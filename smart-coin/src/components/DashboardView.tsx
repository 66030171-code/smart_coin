import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { 
  Users, CheckCircle2, Factory, Loader2, Search, Edit2, Trash2, 
  Plus, Settings2, Sparkles, FolderUp, RefreshCw, X, AlertCircle
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { Daily } from "../types";

interface DashboardViewProps {
  currentUser: { Username: string; Role: string };
  onRedirectToRecord: () => void;
  onRefreshAll: () => void;
}

export default function DashboardView({ 
  currentUser, onRedirectToRecord, onRefreshAll 
}: DashboardViewProps) {
  const { language, t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<Daily[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Editing historical entries state modal
  const [editEntry, setEditEntry] = useState<Daily | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editQty, setEditQty] = useState(0);
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Deleting historical entries state modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; empName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSyncSharepoint = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/sharepoint/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requester: currentUser.Username })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(language === "TH" ? "ประสานฐานข้อมูลและซิงค์รายงานขึ้น SharePoint Cloud Server สำเร็จ!" : "Successfully synced data with SharePoint Excel Worksheet!");
        setTimeout(() => setSyncMessage(null), 3000);
        onRefreshAll(); // trigger stats reload in parent
        loadDashboardData(); // local reload
      } else {
        alert(data.error || "Sync error");
      }
    } catch {
      alert("API Connection failure during sync trigger");
    } finally {
      setSyncing(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const statsUrl = `/api/dashboard-stats?leader=${currentUser.Username}`;
      const recordsUrl = `/api/dailies?leader=${currentUser.Username}`;
      
      const [statsRes, recordsRes] = await Promise.all([
        fetch(statsUrl),
        fetch(recordsUrl)
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (recordsRes.ok) setHistory(await recordsRes.json());
    } catch (e) {
      console.error("Error reading dashboard summaries", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser.Username]);

  const handleEditInit = (entry: Daily) => {
    setEditEntry(entry);
    setEditQty(entry.Production_Qty);
    setEditDate(entry.Work_Date);
    setEditStart(entry.Start_DateTime);
    setEditEnd(entry.End_DateTime);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEntry) return;

    try {
      const res = await fetch(`/api/dailies/${editEntry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Work_Date: editDate,
          Start_DateTime: editStart,
          End_DateTime: editEnd,
          Production_Qty: editQty,
          Created_By: currentUser.Username
        })
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        setEditEntry(null);
        loadDashboardData();
        onRefreshAll(); // sync sharepoint grids
      } else {
        const err = await res.json();
        alert(err.error || "ไม่สามารถอัปเดตข้อมูลได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อแก้ไขข้อมูล");
    }
  };

  const handleDeleteEntry = (id: string, empName: string) => {
    setDeleteTarget({ id, empName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/dailies/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requester: currentUser.Username })
      });
      if (res.ok) {
        setDeleteTarget(null);
        loadDashboardData();
        onRefreshAll(); // refresh sync status sheets
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "ลบไม่สำเร็จ");
      }
    } catch {
      alert("ขัดข้องทางเทคนิค");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredHistory = history.filter((h) => {
    const q = search.toLowerCase();
    return (
      h.Emp_code.toLowerCase().includes(q) ||
      h.Emp_Fname.toLowerCase().includes(q) ||
      h.Emp_Lname.toLowerCase().includes(q) ||
      h.CB_code.toLowerCase().includes(q) ||
      h.Line_code.toLowerCase().includes(q)
    );
  });

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        <span className="text-xs text-slate-500 font-bold mt-2">{t("loading")}</span>
      </div>
    );
  }

  return (
    <div id="dashboard-view-wrapper" className="h-full flex flex-col space-y-4">
      
      {/* Edit Entry Modal Overlay */}
      {isEditModalOpen && editEntry && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleEditSave} className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-2xl shadow-xl space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-slate-700" />
                {language === "TH" ? "แก้ไขข้อมูลรายวันย้อนหลัง" : "Restore & Edit Daily Record"}
              </h4>
              <button type="button" onClick={() => { setIsEditModalOpen(false); setEditEntry(null); }} className="text-slate-400 hover:text-slate-755 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-slate-500 leading-normal">
              พนักงานหลัก: <strong>{editEntry.Emp_code} &bull; {editEntry.Emp_Fname} {editEntry.Emp_Lname}</strong>
            </div>

            <div className="space-y-3 pt-1">
              {/* Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500">DATE (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl text-slate-800 font-bold focus:outline-none"
                />
              </div>

              {/* Start Time */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500">START TIME (HH:MM)</label>
                <input
                  type="text"
                  maxLength={5}
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl text-slate-800 font-mono font-bold text-center focus:outline-none"
                />
              </div>

              {/* End Time */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500">END TIME (HH:MM)</label>
                <input
                  type="text"
                  maxLength={5}
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl text-slate-800 font-mono font-bold text-center focus:outline-none"
                />
              </div>

              {/* Qty */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500">PRODUCTION QUANTITY (PIECES)</label>
                <input
                  type="number"
                  min={0}
                  max={9999}
                  value={editQty}
                  onChange={(e) => setEditQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl text-slate-900 font-mono font-black text-center focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl active:scale-95 cursor-pointer shadow-sm"
              >
                {t("save")}
              </button>
              <button
                type="button"
                onClick={() => { setIsEditModalOpen(false); setEditEntry(null); }}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                {t("cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <AlertCircle className="w-6 h-6 text-rose-600 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 font-display uppercase tracking-wide">
                  {language === "TH" ? "ยืนยันการลบบันทึกประวัติ" : "Confirm Deletion"}
                </h4>
                <p className="text-slate-500 text-[11px] mt-0.5 font-bold">
                  {language === "TH" 
                    ? "ต้องการลบบันทึกข้อมูลประวัติการผลิตจริงหรือไม่?" 
                    : "Are you sure you want to delete this production history record?"}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
              <div className="text-[11px] space-y-1.5 text-slate-700 leading-normal">
                <div>
                  <span className="text-slate-400 font-bold block text-[9px] uppercase">พนักงาน / Employee Name</span>
                  <span className="font-bold text-slate-900 text-xs">{deleteTarget.empName}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-rose-600 font-bold px-1">
              ⚠️ {language === "TH" 
                ? "ข้อมูลบน SharePoint Excel และ Database คลังข้อมูลหลักจะถูกลบออกไปพร้อมกันโดยทันที" 
                : "This will remove the record from both the internal database and live SharePoint."}
            </p>

            {/* Action buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer text-center"
              >
                {language === "TH" ? "ยกเลิก (Cancel)" : "Cancel"}
              </button>
              
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  language === "TH" ? "ลบรายการ (Delete)" : "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Sync Alert */}
      {syncMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-950 text-white text-xs font-bold px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{syncMessage}</span>
        </div>
      )}

      {/* History log ledger (Table: Daily with sorting, routing edit and search) */}
      <div className="flex-1 min-h-[280px] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
        <div className="border-b border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">
              {language === "TH" ? "ประวัติการนำส่งบันทึกผลงานฝ่ายผลิตใต้สังกัด" : "Historical Production Entries Saved"}
            </h3>
            <p className="text-slate-400 text-[9px] mt-0.5">
              แก้ไขข้อมูลย้อนหลัง, ลบบันทึก และค้นหารายการรายงานผลงานรายบุคคล
            </p>
          </div>

          <div className="flex gap-2 w-full max-w-lg items-center justify-end flex-wrap sm:flex-nowrap">
            {/* Search */}
            <div className="relative w-full max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === "TH" ? "ค้นหารหัส คาลิเบอร์ หรือไลน์..." : "Search code, calibur, line..."}
                className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 font-medium text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            {/* SYNC TO SHAREPOINT SUBMIT BUTTON */}
            <button
              onClick={handleSyncSharepoint}
              disabled={syncing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-350 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition shadow-sm leading-none shrink-0"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <RefreshCw className="w-4 h-4 text-white" />
              )}
              <span>{language === "TH" ? "ส่งออก Sync SharePoint" : "Sync SharePoint"}</span>
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="flex-1 min-h-0 p-4 pt-1 flex flex-col">
          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <th className="px-5 py-4">{t("empCode")}</th>
                  <th className="px-5 py-4">{language === "TH" ? "ชื่อพนักงาน" : "Name"}</th>
                  <th className="px-4 py-4">{language === "TH" ? "วันที่ทำงาน" : "Work Date"}</th>
                  <th className="px-4 py-4">{language === "TH" ? "เวลาเวิร์คช็อป" : "Hours (ST-ET)"}</th>
                  <th className="px-4 py-4">CB / OP / Line</th>
                  <th className="px-4 py-4 text-center">ชิ้นงานสำเร็จ (QTY)</th>
                  <th className="px-2 py-4 text-center w-24">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                      ยังไม่พบรายการบันทึกประวัติ หรือไม่พบผลสำหรับคำค้นหานี้
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((h) => (
                    <tr key={h._id} className="hover:bg-slate-50/30 transition">
                      <td className="px-5 py-3.5">
                        <span className="font-mono bg-slate-100 border border-slate-250 border-slate-200 font-black px-2 py-0.5 rounded text-slate-800">
                          {h.Emp_code}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{h.Emp_Fname} {h.Emp_Lname}</td>
                      <td className="px-4 py-3.5 text-slate-550 font-mono text-[11px]">{h.Work_Date}</td>
                      <td className="px-4 py-3.5 text-slate-550 whitespace-nowrap text-[11px]">{h.Start_DateTime} - {h.End_DateTime}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-550 font-mono text-[11px]">
                        CB: {h.CB_code} | OP: {h.OP_code} | LN: {h.Line_code}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-900 font-mono bg-slate-50/10 text-xs">
                        {h.Production_Qty.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 w-24">
                        <div className="flex items-center justify-center gap-1">
                          {/* Retroactive Edit Trigger */}
                          <button
                            onClick={() => handleEditInit(h)}
                            title={t("edit")}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg cursor-pointer transition flex items-center justify-center active:scale-95"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                          
                          {/* Retroactive Delete Trigger */}
                          <button
                            onClick={() => handleDeleteEntry(h._id, `${h.Emp_Fname} ${h.Emp_Lname}`)}
                            title={t("delete")}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-lg cursor-pointer transition flex items-center justify-center active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
