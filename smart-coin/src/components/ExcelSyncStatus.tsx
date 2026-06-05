import React, { useState, useEffect } from "react";
import { 
  CloudLightning, RefreshCw, FileSpreadsheet, Search, CheckCircle2, 
  ArrowUpDown, Download, Calendar, Loader2, Database, ExternalLink,
  Copy, Check, Link2, Info
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { SharepointSyncLog, Calibur, OP, Line, Daily } from "../types";

export default function ExcelSyncStatus() {
  const { language, t } = useLanguage();
  const [syncLogs, setSyncLogs] = useState<SharepointSyncLog[]>([]);
  const [activeSheet, setActiveSheet] = useState<"Calibur" | "OP" | "Line" | "Daily">("Daily");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // States for live sheets read from server Database
  const [caliburs, setCaliburs] = useState<Calibur[]>([]);
  const [ops, setOps] = useState<OP[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [dailies, setDailies] = useState<Daily[]>([]);

  // Integration helper copy state
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  const handleCopyLink = (endpoint: string) => {
    const fullUrl = `${window.location.origin}${endpoint}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedLink(endpoint);
      setTimeout(() => setCopiedLink(null), 2000);
    }).catch(err => {
      console.error("Failed to copy link: ", err);
    });
  };

  // Pagination states
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const fetchSyncLogsAndSheets = async () => {
    setLoading(true);
    try {
      const [logsRes, cbRes, opRes, lnRes, dlRes] = await Promise.all([
        fetch("/api/sharepoint-sync-logs"),
        fetch("/api/caliburs"),
        fetch("/api/ops"),
        fetch("/api/lines"),
        fetch("/api/dailies")
      ]);

      if (logsRes.ok) setSyncLogs(await logsRes.json());
      if (cbRes.ok) setCaliburs(await cbRes.json());
      if (opRes.ok) setOps(await opRes.json());
      if (lnRes.ok) setLines(await lnRes.json());
      if (dlRes.ok) setDailies(await dlRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncLogsAndSheets();
  }, [activeSheet]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Extract grid source
  const getSourceData = () => {
    switch (activeSheet) {
      case "Calibur":
        return caliburs.map(c => ({ id: c.CB_code, col1: c.CB_code, col2: c.CB_name, col3: "", col4: "", col5: "", col6: "" }));
      case "OP":
        return ops.map(o => ({ id: o.OP_code, col1: o.OP_code, col2: o.OP_name, col3: "", col4: "", col5: "", col6: "" }));
      case "Line":
        return lines.map(l => ({ id: l.Line_code, col1: l.Line_code, col2: l.Line_name, col3: "", col4: "", col5: "", col6: "" }));
      case "Daily":
        return dailies.map(d => ({
          id: d._id,
          col1: d.Emp_code,
          col2: `${d.Emp_Fname} ${d.Emp_Lname}`,
          col3: d.Work_Date,
          col4: `${d.Start_DateTime} - ${d.End_DateTime}`,
          col5: `${d.CB_code} / ${d.OP_code} / ${d.Line_code}`,
          col6: d.Production_Qty
        }));
    }
  };

  const getHeaders = () => {
    switch (activeSheet) {
      case "Calibur":
        return [
          { key: "col1", label: "CB_code", sortable: true },
          { key: "col2", label: "CB_name", sortable: true }
        ];
      case "OP":
        return [
          { key: "col1", label: "OP_code", sortable: true },
          { key: "col2", label: "OP_name", sortable: true }
        ];
      case "Line":
        return [
          { key: "col1", label: "Line_code", sortable: true },
          { key: "col2", label: "Line_name", sortable: true }
        ];
      case "Daily":
        return [
          { key: "col1", label: "Emp_code", sortable: true },
          { key: "col2", label: "Fname_Lname", sortable: true },
          { key: "col3", label: "Work_Date", sortable: true },
          { key: "col4", label: "Timeframe (ST-ET)", sortable: false },
          { key: "col5", label: "CB/OP/Line Code", sortable: false },
          { key: "col6", label: "Production_Qty", sortable: true }
        ];
    }
  };

  // Filter & sorting routine
  const rawData = getSourceData();
  const filteredData = rawData.filter(row => {
    const q = searchQuery.toLowerCase();
    return (
      row.col1.toLowerCase().includes(q) ||
      row.col2.toLowerCase().includes(q) ||
      row.col3.toLowerCase().includes(q) ||
      row.col4.toLowerCase().includes(q) ||
      row.col5.toLowerCase().includes(q) ||
      String(row.col6).toLowerCase().includes(q)
    );
  });

  if (sortField) {
    filteredData.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      // Keep numbers robust
      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Trigger Client-Side CSV Export (Export Excel)
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = `Sharepoint_Sheet_${activeSheet}.csv`;

    if (activeSheet === "Calibur") {
      headers = ["CB_code", "CB_name"];
      rows = caliburs.map(c => [c.CB_code, c.CB_name]);
    } else if (activeSheet === "OP") {
      headers = ["OP_code", "OP_name"];
      rows = ops.map(o => [o.OP_code, o.OP_name]);
    } else if (activeSheet === "Line") {
      headers = ["Line_code", "Line_name"];
      rows = lines.map(l => [l.Line_code, l.Line_name]);
    } else {
      headers = [
        "_id", "Emp_code", "Emp_Fname", "Emp_Lname", "Work_Date", 
        "Start_DateTime", "End_DateTime", "CB_code", "OP_code", 
        "Line_code", "Production_Qty"
      ];
      rows = dailies.map(d => [
        d._id, d.Emp_code, d.Emp_Fname, d.Emp_Lname, d.Work_Date,
        d.Start_DateTime, d.End_DateTime, d.CB_code, d.OP_code, 
        d.Line_code, d.Production_Qty
      ]);
    }

    // Generate CSV UTF-8 with BOM to display Thai correctly in Excel!
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(r => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="excel-sync-section" className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden mt-8 animate-fadeIn">
      {/* Visual Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <CloudLightning className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              {t("syncStatusTitle")}
            </h3>
            <p className="text-slate-500 text-[11px] font-medium leading-relaxed mt-0.5">
              Microsoft Graph API : cloud-synced Excel worksheets synchronized below.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="https://burapha.sharepoint.com/:x:/s/RadonKPI/IQA5wgt3uQWwQY4EAX-PxHpHAVCbgDmhMWHctIqwx125e08?e=pqvCkk"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 shadow-sm active:scale-95 text-center decoration-transparent"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t("openSharePointExcel")}
          </a>

          <button
            onClick={fetchSyncLogsAndSheets}
            disabled={loading}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {language === "TH" ? "ดึงค่าจาก SharePoint" : "Refresh SharePoint"}
          </button>
        </div>
      </div>

      {/* SharePoint Power Query Connections Helper Guidance */}
      <div className="border-b border-slate-150 p-6 bg-slate-50/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Info className="w-4.5 h-4.5 text-blue-600 shrink-0" />
            <h4 className="text-xs font-black text-slate-900 tracking-tight font-display uppercase">
              {language === "TH" 
                ? "คู่มือการเตรียมเชื่อมโยงข้อมูลสู่ SharePoint & Excel" 
                : "SharePoint & Microsoft Excel Live Connection Wizard"}
            </h4>
          </div>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold transition cursor-pointer"
          >
            {showGuide 
              ? (language === "TH" ? "ซ่อนคู่มือ (Hide Guide)" : "Hide Guide") 
              : (language === "TH" ? "แสดงคู่มือ (Show Guide)" : "Show Guide")}
          </button>
        </div>

        {showGuide && (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-[11px] text-slate-600 leading-relaxed max-w-4xl font-semibold">
              {language === "TH" 
                ? "คุณสามารถตั้งค่าให้ Microsoft Excel ตารางชีตบน SharePoint Cloud คอยดึงข้อมูลจากระบบหลักนี้ย้อนหลังโดยอัตโนมัติด้วยการจดทะเบียน 'Get Data -> From Web' จากนั้นป้อนที่อยู่ Live API Endpoint ด้านล่างนี้เข้าไป ข้อมูลบนคลาวด์จะซิงค์สถิติล่าสุดอย่างต่อเนื่อง และแปลงอักขระไทยในระบบให้ถูกต้องโดยไม่ติดปัญหาภาษาวิบัติด้วยรูปแบบมาตรฐาน UTF-8 BOM"
                : "Configure Microsoft Excel or Power Automate inside SharePoint to query live data from this applet directly using 'Data -> From Web'. Excel will download real-time UTF-8 BOM embedded streams, preventing formatting anomalies and encoding corruptions for Thai alphabets."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {[
                { label: language === "TH" ? "ตารางรายงานผลิตจริงย้อนหลัง (Production Dailies)" : "Daily records sheet", path: "/api/export/dailies.csv" },
                { label: language === "TH" ? "ตารางค่าเกณฑ์พารามิเตอร์ Calibur Master" : "Calibur Master", path: "/api/export/caliburs.csv" },
                { label: language === "TH" ? "ตารางรหัสขั้นตอนการทำงาน OP Master" : "OP Master", path: "/api/export/ops.csv" },
                { label: language === "TH" ? "ตารางรหัสเครื่องจักรเเละไลน์ Line Master" : "Line Master", path: "/api/export/lines.csv" }
              ].map((item) => {
                const isCopied = copiedLink === item.path;
                return (
                  <div key={item.path} className="bg-white border border-slate-200 p-3 rounded-xl flex flex-col justify-between gap-2 shadow-xs hover:border-slate-300 transition">
                    <span className="text-[10px] font-extrabold text-slate-800 truncate">{item.label}</span>
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 p-1.5 pl-2.5 rounded-lg">
                      <code className="text-[10px] font-mono font-medium text-indigo-700 truncate select-all flex-1">
                        {window.location.origin}{item.path}
                      </code>
                      <button
                        onClick={() => handleCopyLink(item.path)}
                        type="button"
                        className={`p-1.5 px-2.5 rounded-md text-[10px] font-bold tracking-wide flex items-center gap-1 transition ${
                          isCopied 
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-150" 
                            : "bg-slate-100 text-slate-700 hover:bg-slate-250 hover:bg-slate-205"
                        }`}
                        title="Copy Live Endpoint URL for Excel Power Query"
                      >
                        {isCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-600 animate-bounce" /> : <Copy className="w-3 h-3" />}
                        {isCopied ? (language === "TH" ? "คัดลอกสำเร็จ" : "Copied") : (language === "TH" ? "คัดลอกคีย์" : "Copy URL")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-emerald-50 bg-indigo-50/40 border border-indigo-150/40 rounded-2xl p-4 text-[11px] text-slate-600 leading-relaxed font-bold space-y-1">
              <span className="text-indigo-950 block text-xs font-black mb-1.5">
                💡 {language === "TH" ? "วิธีเชื่อมโยงข้อมูล Excel ใน SharePoint:" : "SharePoint / Excel Configuration Steps:"}
              </span>
              <ol className="list-decimal list-inside pl-1 space-y-1.5 font-bold text-slate-700">
                <li>{language === "TH" ? "เปิดเอกสาร Excel ของคุณในคอมพิวเตอร์หลัก" : "Open Microsoft Excel desktop or Office 365 spreadsheet."}</li>
                <li>{language === "TH" ? "ไปที่เมนูด้านบนชื่อ ข้อมูล (Data) -> ดึงข้อมูล (Get Data) -> แหล่งข้อมูลอื่น -> จากเว็บ (From Web)" : "Go to 'Data' ribbon tab -> 'Get Data' -> 'From Other Sources' -> 'From Web'."}</li>
                <li>{language === "TH" ? "นำ URL เส้นทางแบบเต็มพอร์ตจากช่องด้านบนไปวางลงในฟิลด์ที่กำหนด" : "Copy the Complete URL from the copy buttons above and paste it."}</li>
                <li>{language === "TH" ? "ตั้งค่าดึงฟอนต์ภาษาไทยให้สมบูรณ์ด้วยการตั้งค่าต้นกำเนิดไฟล์เป็น 65001: Unicode (UTF-8) ใน Power Query แล้วคลิกโหลด" : "Ensure File Origin encoding is set to '65001: Unicode (UTF-8)' so Thai labels render properly."}</li>
                <li>{language === "TH" ? "บันทึกบันทึกสมุดงานนี้เก็บลงโฟลเดอร์ SharePoint ทีมเพื่ออัปเดต Live Dashboard เเบบออโต้ทันที!" : "Save to SharePoint Cloud Storage. All worksheets are ready for real-time live synchronization."}</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        
        {/* Left Side: Workshead Tab Grid */}
        <div className="lg:col-span-2 p-6 flex flex-col space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              {t("sharepointLiveSheets")}
            </h4>

            {/* Export & Downloader */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold text-[11px] rounded-lg cursor-pointer transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {t("exportExcelBtn")} ({activeSheet})
            </button>
          </div>

          {/* Active sheet select */}
          <div className="flex gap-1.5 bg-slate-105 p-1 bg-slate-100 rounded-xl self-start">
            {(["Daily", "Calibur", "OP", "Line"] as const).map((sheet) => (
              <button
                key={sheet}
                onClick={() => {
                  setActiveSheet(sheet);
                  setPage(1);
                  setSearchQuery("");
                }}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeSheet === sheet
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Sheet: {sheet}
              </button>
            ))}
          </div>

          {/* Table Search */}
          <div className="relative w-full max-w-xs self-end">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1); // reset to first page on search
              }}
              placeholder={language === "TH" ? "ค้นหาคอลัมน์ในชีต..." : "Search columns..."}
              className="w-full bg-white text-slate-800 placeholder-slate-400 font-medium text-xs pl-9 pr-3 py-2 border border-slate-250 border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 transition"
            />
          </div>

          {/* Core spreadsheet mock */}
          <div className="overflow-x-auto border border-slate-150 rounded-xl shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                  {getHeaders().map((h) => (
                    <th 
                      key={h.key} 
                      onClick={() => h.sortable && toggleSort(h.key)}
                      className={`px-4 py-3.5 uppercase tracking-wide font-black ${h.sortable ? "cursor-pointer hover:bg-slate-100 select-none" : ""}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {h.label}
                        {h.sortable && <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={getHeaders().length} className="px-4 py-8 text-center text-slate-400 italic">
                      {language === "TH" ? "ไม่มีข้อมูลตรงความต้องการ" : "No live matching credentials found"}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, rIdx) => (
                    <tr key={row.id + "_" + rIdx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-800 border border-slate-200/50 font-bold">
                          {row.col1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-bold">{row.col2}</td>
                      
                      {/* Condensed Columns */}
                      {activeSheet === "Daily" && (
                        <>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">{row.col3}</td>
                          <td className="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap">{row.col4}</td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{row.col5}</td>
                          <td className="px-4 py-3 bg-slate-50/40 text-center font-bold text-slate-900 font-mono">
                            {row.col6?.toLocaleString()}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controllers */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500 font-semibold">
                Page {page} of {totalPages} ({filteredData.length} total rows)
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 bg-slate-100 text-slate-600 rounded disabled:opacity-40 text-xs font-bold cursor-pointer hover:bg-slate-200 transition"
                >
                  Prev
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 bg-slate-100 text-slate-600 rounded disabled:opacity-40 text-xs font-bold cursor-pointer hover:bg-slate-200 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Graph API Live Synchronizer Activity Log */}
        <div className="p-6 flex flex-col space-y-4">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
              Microsoft Graph Action Feed
            </h4>
          </div>

          <div className="border border-slate-150 rounded-xl p-4 bg-slate-50 space-y-4 max-h-[380px] overflow-y-auto">
            {syncLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic text-xs">
                No Microsoft Graph REST API calls established yet.
              </div>
            ) : (
              syncLogs.map((log) => (
                <div key={log.id} className="bg-white border border-slate-200 p-3 rounded-xl flex flex-col space-y-1.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded uppercase bg-emerald-950 text-emerald-350 border border-emerald-900">
                      /{log.sheet}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black ${
                      log.action === "CREATE" ? "text-emerald-600" : log.action === "UPDATE" ? "text-blue-600" : "text-rose-600"
                    }`}>
                      {log.action} ROW
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 font-mono bg-emerald-55 bg-emerald-50 px-1 border border-emerald-100 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      HTTP 201 OK
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-600 font-mono bg-slate-50 p-1.5 rounded border border-slate-200 break-all max-h-16 overflow-y-auto">
                    {log.payload}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
