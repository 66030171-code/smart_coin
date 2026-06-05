import React, { useState, useEffect } from "react";
import { 
  FolderLock, Search, PlusCircle, Pencil, Trash, Save, X, Database, AlertCircle, RefreshCw 
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { Calibur, OP, Line } from "../types";

interface MasterDataManagementProps {
  currentUser: { Username: string; Role: string };
  onConfigChange: () => void;
}

export default function MasterDataManagement({ currentUser, onConfigChange }: MasterDataManagementProps) {
  const { language, t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<"calibur" | "op" | "line">("calibur");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");

  // Lists
  const [caliburs, setCaliburs] = useState<Calibur[]>([]);
  const [ops, setOps] = useState<OP[]>([]);
  const [lines, setLines] = useState<Line[]>([]);

  // Form states
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);

  // Input Fields
  const [codeVal, setCodeVal] = useState("");
  const [nameVal, setNameVal] = useState("");

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [cbRes, opRes, lnRes] = await Promise.all([
        fetch("/api/caliburs"),
        fetch("/api/ops"),
        fetch("/api/lines")
      ]);
      if (cbRes.ok) setCaliburs(await cbRes.json());
      if (opRes.ok) setOps(await opRes.json());
      if (lnRes.ok) setLines(await lnRes.json());
    } catch {
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อดึงข้อมูล Master Data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetForm = () => {
    setEditingCode(null);
    setAddMode(false);
    setCodeVal("");
    setNameVal("");
    setErrorMsg("");
  };

  const handleTriggerAdd = () => {
    handleResetForm();
    setAddMode(true);
  };

  const handleTriggerEdit = (code: string, currentName: string) => {
    handleResetForm();
    setEditingCode(code);
    setCodeVal(code);
    setNameVal(currentName);
  };

  // Create submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!codeVal.trim() || !nameVal.trim()) {
      setErrorMsg("กรุณาระบุกรอกฟิลด์รหัสเเละรายละเอียดให้เรียบร้อย");
      return;
    }

    const payload = {
      requester: currentUser.Username
    };

    let url = "";
    let method = "POST";
    let bodyArgs: any = {};

    if (activeSubTab === "calibur") {
      url = addMode ? "/api/caliburs" : `/api/caliburs/${editingCode}`;
      method = addMode ? "POST" : "PUT";
      bodyArgs = addMode 
        ? { CB_code: codeVal, CB_name: nameVal } 
        : { CB_name: nameVal };
    } else if (activeSubTab === "op") {
      url = addMode ? "/api/ops" : `/api/ops/${editingCode}`;
      method = addMode ? "POST" : "PUT";
      bodyArgs = addMode 
        ? { OP_code: codeVal, OP_name: nameVal } 
        : { OP_name: nameVal };
    } else {
      url = addMode ? "/api/lines" : `/api/lines/${editingCode}`;
      method = addMode ? "POST" : "PUT";
      bodyArgs = addMode 
        ? { Line_code: codeVal, Line_name: nameVal } 
        : { Line_name: nameVal };
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, ...bodyArgs })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      } else {
        loadData();
        onConfigChange(); // refresh SharePoint Sheet View as well
        handleResetForm();
      }
    } catch {
      setErrorMsg("มีปัญหากับการเชื่อมต่อระหว่างเซิร์ฟเวอร์");
    }
  };

  const handleDelete = async (code: string) => {
    let confirmMsg = `ยืนยันการลุกคืบถอนทำลายลบข้อมูลรหัส ${code} ใช่หรือไม่?`;
    if (!window.confirm(confirmMsg)) return;

    let url = "";
    if (activeSubTab === "calibur") url = `/api/caliburs/${code}`;
    else if (activeSubTab === "op") url = `/api/ops/${code}`;
    else url = `/api/lines/${code}`;

    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requester: currentUser.Username })
      });
      if (res.ok) {
        loadData();
        onConfigChange();
      } else {
        const d = await res.json();
        alert(d.error || "ลบไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการติดต่อระบบ");
    }
  };

  // Filters
  const filteredCaliburs = caliburs.filter(
    (c) =>
      c.CB_code.toLowerCase().includes(search.toLowerCase()) ||
      c.CB_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOps = ops.filter(
    (o) =>
      o.OP_code.toLowerCase().includes(search.toLowerCase()) ||
      o.OP_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLines = lines.filter(
    (l) =>
      l.Line_code.toLowerCase().includes(search.toLowerCase()) ||
      l.Line_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="master-data-view" className="h-full flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden animate-fadeIn">
      {/* Banner */}
      <div className="border-b border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-2.5 py-0.5 text-[10px] uppercase font-black bg-slate-900 text-white tracking-widest rounded border border-slate-950">
            System Config Level-2
          </span>
          <h2 className="text-lg font-black tracking-tight text-slate-800 flex items-center gap-2 mt-1.5">
            <FolderLock className="w-5 h-5 text-slate-700" />
            {t("masterDataTab")}
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            เครื่องมือคุมระบบพารามิเตอร์พื้นฐาน (Calibur, OP, Line) ข้อมูล CRUD ทั้งหมดปรับปรุง Synchronized ออโต้เข้า SharePoint
          </p>
        </div>

        <button 
          onClick={loadData}
          className="p-1 px-3 text-[10px] bg-slate-100 font-bold max-w-xs text-slate-750 hover:bg-slate-200 text-slate-800 rounded-lg cursor-pointer transition flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> รีเซ็ทดึงค่า
        </button>
      </div>

      {/* Sub menu controls */}
      <div className="border-b border-slate-200 bg-slate-50/50 flex flex-wrap justify-between items-center px-6 py-2">
        <div className="flex gap-1 py-1">
          <button
            onClick={() => { setActiveSubTab("calibur"); setSearch(""); handleResetForm(); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeSubTab === "calibur" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {t("cbManager")} ({caliburs.length})
          </button>
          <button
            onClick={() => { setActiveSubTab("op"); setSearch(""); handleResetForm(); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeSubTab === "op" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {t("opManager")} ({ops.length})
          </button>
          <button
            onClick={() => { setActiveSubTab("line"); setSearch(""); handleResetForm(); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeSubTab === "line" 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {t("lineManager")} ({lines.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs my-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-white text-slate-800 placeholder-slate-400 font-medium text-xs pl-9 pr-3 py-2 border border-slate-250 border-slate-200 rounded-xl focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
        
        {/* Forms & Tables Dual Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Table Area (Grid 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-500" />
                {activeSubTab === "calibur" ? "Calibur Items" : activeSubTab === "op" ? "Operating Process List" : "Line Sectors"}
              </h3>

              {!addMode && !editingCode && (
                <button
                  onClick={handleTriggerAdd}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wide rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  {t("addButton")}
                </button>
              )}
            </div>

            <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="px-4 py-3.5">{activeSubTab === "calibur" ? "CB_code" : activeSubTab === "op" ? "OP_code" : "Line_code"} (PK)</th>
                    <th className="px-5 py-3.5">{activeSubTab === "calibur" ? "CB_name" : activeSubTab === "op" ? "OP_name" : "Line_name"}</th>
                    <th className="px-4 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-750">
                  
                  {activeSubTab === "calibur" && (
                    filteredCaliburs.length === 0 ? (
                      <tr><td colSpan={3} className="p-6 text-center text-slate-400 italic">ไม่พบบันทึกข้อมูล Calibur</td></tr>
                    ) : (
                      filteredCaliburs.map(c => (
                        <tr key={c.CB_code} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3"><span className="font-mono bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold text-xs">{c.CB_code}</span></td>
                          <td className="px-5 py-3 text-slate-900 font-semibold">{c.CB_name}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => handleTriggerEdit(c.CB_code, c.CB_name)} className="p-1 px-2.5 text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 active:scale-95 transition cursor-pointer flex items-center gap-1">
                                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                {t("edit")}
                              </button>
                              <button onClick={() => handleDelete(c.CB_code)} className="p-1 px-2.5 text-[10px] font-bold text-red-700 bg-rose-50 border border-rose-100 rounded hover:bg-rose-100 active:scale-95 transition cursor-pointer flex items-center gap-1">
                                <Trash className="w-3.5 h-3.5 text-red-500" />
                                {t("delete")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}

                  {activeSubTab === "op" && (
                    filteredOps.length === 0 ? (
                      <tr><td colSpan={3} className="p-6 text-center text-slate-400 italic">ไม่พบบันทึกข้อมูล OP</td></tr>
                    ) : (
                      filteredOps.map(o => (
                        <tr key={o.OP_code} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3"><span className="font-mono bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold text-xs">{o.OP_code}</span></td>
                          <td className="px-5 py-3 text-slate-900 font-semibold">{o.OP_name}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => handleTriggerEdit(o.OP_code, o.OP_name)} className="p-1 px-2.5 text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 active:scale-95 transition cursor-pointer flex items-center gap-1">
                                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                {t("edit")}
                              </button>
                              <button onClick={() => handleDelete(o.OP_code)} className="p-1 px-2.5 text-[10px] font-bold text-red-700 bg-rose-50 border border-rose-100 rounded hover:bg-rose-100 active:scale-95 transition cursor-pointer flex items-center gap-1">
                                <Trash className="w-3.5 h-3.5 text-red-500" />
                                {t("delete")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}

                  {activeSubTab === "line" && (
                    filteredLines.length === 0 ? (
                      <tr><td colSpan={3} className="p-6 text-center text-slate-400 italic">ไม่พบบันทึกข้อมูล Line</td></tr>
                    ) : (
                      filteredLines.map(l => (
                        <tr key={l.Line_code} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3"><span className="font-mono bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold text-xs">{l.Line_code}</span></td>
                          <td className="px-5 py-3 text-slate-900 font-semibold">{l.Line_name}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => handleTriggerEdit(l.Line_code, l.Line_name)} className="p-1 px-2.5 text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 active:scale-95 transition cursor-pointer flex items-center gap-1">
                                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                {t("edit")}
                              </button>
                              <button onClick={() => handleDelete(l.Line_code)} className="p-1 px-2.5 text-[10px] font-bold text-red-700 bg-rose-50 border border-rose-100 rounded hover:bg-rose-100 active:scale-95 transition cursor-pointer flex items-center gap-1">
                                <Trash className="w-3.5 h-3.5 text-red-500" />
                                {t("delete")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}

                </tbody>
              </table>
            </div>

          </div>

          {/* Form Side Drawer (Grid 1 col) */}
          <div className="lg:col-span-1">
            {addMode || editingCode ? (
              <form onSubmit={handleSave} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    {addMode ? "Add New Parameter" : `Edit Code: ${editingCode}`}
                  </h4>
                  <button type="button" onClick={handleResetForm} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Code Field (PK) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    CODE ID (Primary Key)
                  </label>
                  <input
                    type="text"
                    disabled={!addMode}
                    value={codeVal}
                    onChange={(e) => setCodeVal(e.target.value.toUpperCase())}
                    placeholder={`e.g. ${activeSubTab === "calibur" ? "CB005" : activeSubTab === "op" ? "OP005" : "LN004"}`}
                    className="w-full bg-white text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 font-mono font-bold"
                  />
                </div>

                {/* Name Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    DESCRIPTION (Name)
                  </label>
                  <input
                    type="text"
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    placeholder="ระบุข้อความรายละเอียด..."
                    className="w-full bg-white text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none font-semibold text-slate-800"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98 transition duration-150"
                  >
                    <Save className="w-4 h-4" />
                    {t("save")}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 cursor-pointer transition active:scale-98"
                  >
                    {t("cancel")}
                  </button>
                </div>

              </form>
            ) : (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center text-xs text-slate-400 italic">
                <AlertCircle className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                เลือกเพิ่มค่าหรือกดปุ่มแก้ไขในตารางเพื่อปรับแต่งผังรายการ
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
