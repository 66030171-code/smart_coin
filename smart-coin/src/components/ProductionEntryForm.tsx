import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Calendar, Play, Square, Award, Briefcase, Settings, 
  HelpCircle, ChevronRight, FileCheck, CheckSquare, AlertTriangle, Loader2,
  Users, UserPlus
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import CustomTimePicker from "./CustomTimePicker";
import CustomQtyPicker from "./CustomQtyPicker";
import { Employee, Calibur, OP, Line, Daily } from "../types";

interface ProductionEntryFormProps {
  employee: Employee;
  currentUser: { Username: string };
  onBackToTeam: () => void;
  onSubmitSuccess: () => void;
  isSidebar?: boolean;
  allSubordinates?: Employee[];
  onSelectEmployee?: (emp: Employee) => void;
}

export default function ProductionEntryForm({ 
  employee, 
  currentUser, 
  onBackToTeam, 
  onSubmitSuccess,
  isSidebar = false,
  allSubordinates = [],
  onSelectEmployee
}: ProductionEntryFormProps) {
  const { language, t } = useLanguage();

  // Master lists for selections
  const [caliburs, setCaliburs] = useState<Calibur[]>([]);
  const [ops, setOps] = useState<OP[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Core Form values
  const [workDate, setWorkDate] = useState<string>(new Date().toISOString().substring(0, 10)); // YYYY-MM-DD
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [cbCode, setCbCode] = useState<string>("");
  const [opCode, setOpCode] = useState<string>("");
  const [lineCode, setLineCode] = useState<string>("");
  const [productionQty, setProductionQty] = useState<number>(1000); // starts at 1000 pieces

  // For Duplicate check popup
  const [duplicateMatch, setDuplicateMatch] = useState<Daily | null>(null);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);

  // Load configuration dropdown parameters from local master data on startup
  useEffect(() => {
    const fetchMasters = async () => {
      setLoadingConfig(true);
      try {
        const [cbRes, opRes, lnRes] = await Promise.all([
          fetch("/api/caliburs"),
          fetch("/api/ops"),
          fetch("/api/lines")
        ]);
        if (cbRes.ok) {
          const list = await cbRes.json();
          setCaliburs(list);
          if (list.length > 0) setCbCode(list[0].CB_code);
        }
        if (opRes.ok) {
          const list = await opRes.json();
          setOps(list);
          if (list.length > 0) setOpCode(list[0].OP_code);
        }
        if (lnRes.ok) {
          const list = await lnRes.json();
          setLines(list);
          if (list.length > 0) setLineCode(list[0].Line_code);
        }
      } catch (e) {
        console.error("Error loading master parameters", e);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchMasters();
  }, []);

  // Auto-scroll selected subordinate into view
  useEffect(() => {
    if (employee && allSubordinates && allSubordinates.length > 4) {
      const activeEl = document.getElementById(`subordinate-${employee.Emp_code}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [employee, allSubordinates]);

  const handleManualQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    val = Math.max(0, Math.min(9999, val));
    setProductionQty(val);
  };

  const handleManualTimeChange = (type: "start" | "end", value: string) => {
    // Basic formatting guard
    if (type === "start") setStartTime(value);
    else setEndTime(value);
  };

  // Main Submit handler: Add to List directly without pre-export validation
  const handleSubmitDirect = async () => {
    setSubmitting(true);
    try {
      // Check for existing record of this employee on the chosen work date
      const checkRes = await fetch(`/api/dailies?emp=${employee.Emp_code}`);
      if (checkRes.ok) {
        const existingList = await checkRes.json();
        const match = existingList.find((item: Daily) => item.Work_Date === workDate);
        if (match) {
          setDuplicateMatch(match);
          setShowDuplicatePopup(true);
          setSubmitting(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Could not retrieve daily history to check duplicates", err);
    }

    // Direct submit if no duplicate
    try {
      const res = await fetch("/api/dailies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Emp_code: employee.Emp_code,
          Emp_Fname: employee.Emp_Fname,
          Emp_Lname: employee.Emp_Lname,
          Work_Date: workDate,
          Start_DateTime: startTime,
          End_DateTime: endTime,
          CB_code: cbCode,
          OP_code: opCode,
          Line_code: lineCode,
          Production_Qty: productionQty,
          Created_By: currentUser.Username
        })
      });

      const data = await res.json();
      if (res.ok) {
        setToastMsg(language === "TH" ? "เพิ่มผลงานลงในประวัติสำเร็จ!" : "Successfully added to history!");
        setTimeout(() => {
          setToastMsg(null);
          onSubmitSuccess(); // refresh dashboard stats and reload entry tables
        }, 1500);
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการนำส่ง");
      }
    } catch {
      alert("เกิดความล้มเหลวในการเชื่อมโยงต่อ API");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit action if duplicate exists and user chooses "Update"
  const handleUpdateDuplicate = async () => {
    if (!duplicateMatch) return;
    setSubmitting(true);
    setShowDuplicatePopup(false);
    try {
      const res = await fetch(`/api/dailies/${duplicateMatch._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Emp_code: employee.Emp_code,
          Emp_Fname: employee.Emp_Fname,
          Emp_Lname: employee.Emp_Lname,
          Work_Date: workDate,
          Start_DateTime: startTime,
          End_DateTime: endTime,
          CB_code: cbCode,
          OP_code: opCode,
          Line_code: lineCode,
          Production_Qty: productionQty,
          Created_By: currentUser.Username
        })
      });

      const data = await res.json();
      if (res.ok) {
        setToastMsg(language === "TH" ? "อัปเดตข้อมูลและส่งข้อมูลเข้า SharePoint สำเร็จ!" : "Successfully updated and synced to SharePoint!");
        setDuplicateMatch(null);
        setTimeout(() => {
          setToastMsg(null);
          onSubmitSuccess();
        }, 1500);
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการเพิ่มข้อมูลทับ");
      }
    } catch {
      alert("เกิดความล้มเหลวในการเชื่อมโยงต่อ API");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      id="production-entry-form-root" 
      className={isSidebar ? "w-full max-w-full space-y-4 overflow-x-hidden" : "max-w-4xl mx-auto space-y-6"}
    >
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-slate-950 text-white text-xs font-bold px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Duplicate entry dialog overlay */}
      {showDuplicatePopup && duplicateMatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg p-6 rounded-3xl shadow-2xl space-y-5 animate-scaleUp">
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <AlertTriangle className="w-6 h-6 text-amber-600 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 font-display uppercase tracking-wide">
                  {language === "TH" ? "พบข้อมูลซ้ำซ้อนในระบบ" : "Duplicate Entry Detected"}
                </h4>
                <p className="text-slate-500 text-[11px] mt-0.5 font-bold">
                  {language === "TH" 
                    ? `พนักงานรหัส ${employee.Emp_code} มีการรายงานผลงานในวันที่ ${workDate} อยู่แล้ว` 
                    : `Employee ${employee.Emp_code} already has a submitted record for date ${workDate}`}
                </p>
              </div>
            </div>

            {/* Compare entries side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Old Entry Column */}
              <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl space-y-3">
                <span className="inline-block px-2.5 py-1 bg-slate-200 text-slate-700 text-[9px] font-extrabold uppercase rounded-lg tracking-wider">
                  ⚠️ {language === "TH" ? "ข้อมูลเดิมในคลัง" : "Old/Existing Record"}
                </span>
                
                <div className="text-[11px] space-y-2 text-slate-700 leading-normal font-sans">
                  <div>
                    <span className="text-slate-400 font-bold block text-[9px] uppercase">Working hours</span>
                    <span className="font-bold text-slate-900 font-mono text-xs">{duplicateMatch.Start_DateTime} - {duplicateMatch.End_DateTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[9px] uppercase">CB / OP / Line</span>
                    <span className="font-mono bg-slate-200/50 px-1.5 py-0.5 rounded text-[10px] text-slate-900 font-bold">
                      {duplicateMatch.CB_code} / {duplicateMatch.OP_code} / {duplicateMatch.Line_code}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[9px] uppercase">Amount/Qty</span>
                    <span className="font-black text-amber-700 text-sm font-mono">{duplicateMatch.Production_Qty.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* New Entry Column */}
              <div className="bg-emerald-50/40 p-4 border border-emerald-150 rounded-2xl space-y-3">
                <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase rounded-lg tracking-wider">
                  ✨ {language === "TH" ? "ข้อมูลใหม่เตรียมบันทึก" : "New Entry Parameters"}
                </span>

                <div className="text-[11px] space-y-2 text-slate-700 leading-normal font-sans">
                  <div>
                    <span className="text-slate-400 font-bold block text-[9px] uppercase">Working hours</span>
                    <span className="font-bold text-slate-900 font-mono text-xs">{startTime} - {endTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[9px] uppercase">CB / OP / Line</span>
                    <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded text-[10px] text-emerald-900 font-bold border border-emerald-200/40">
                      {cbCode} / {opCode} / {lineCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[9px] uppercase">Amount/Qty</span>
                    <span className="font-black text-emerald-700 text-sm font-mono">{productionQty.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

            <p className="text-xs text-slate-600 text-center font-bold px-2">
              {language === "TH" 
                ? "คุณต้องการอัปเดตแก้ไขเพื่อเขียนทับข้อมูลดิบเดิมและซิงค์ใหม่ ใช่หรือไม่?" 
                : "Would you like to update the database to overwrite the previous record?"}
            </p>

            {/* Action buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => {
                  setShowDuplicatePopup(false);
                  setDuplicateMatch(null);
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer text-center"
              >
                {language === "TH" ? "ยกเลิก (Cancel)" : "Cancel"}
              </button>
              
              <button
                onClick={handleUpdateDuplicate}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm"
              >
                {language === "TH" ? "อัปเดต (Update)" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title Panel */}
      {!isSidebar ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <button
            onClick={onBackToTeam}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-750 font-bold text-xs border border-slate-200 rounded-xl cursor-pointer flex items-center gap-1.5 active:scale-98 transition"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            {t("cancel")}
          </button>

          <div className="text-right">
            <h2 className="text-sm font-black text-slate-900 tracking-tight font-display uppercase">
              {t("productionEntryTitle")}
            </h2>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-center flex items-center justify-between gap-2">
          <h2 className="text-xs font-black text-slate-900 tracking-wider font-display uppercase flex items-center gap-1.5">
            📝 {t("productionEntryTitle")}
          </h2>
          <span className="text-[9px] uppercase font-bold bg-slate-900 text-white rounded px-1.5 py-0.5 font-mono">
            LIVE DESK
          </span>
        </div>
      )}

      {/* Main Form Fields Layout */}
      <div className={isSidebar ? "flex flex-col gap-4 text-slate-800" : "grid grid-cols-1 md:grid-cols-3 gap-6 items-start"}>
        
        {/* Left column: Operator Details & DateTime Selectors */}
        <div className={isSidebar ? "space-y-4" : "md:col-span-1 space-y-6"}>
          
          {/* Operator Bio */}
          {isSidebar && allSubordinates && allSubordinates.length > 0 ? (
            <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-xs space-y-4 transition">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black text-slate-900 font-display tracking-tight uppercase">
                    {language === "TH" ? "เลือกพนักงานเพื่อกรอก" : "Select employee to fill"}
                  </h3>
                </div>
                <div className="w-7 h-7 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-400">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
              </div>

              <div 
                className={`space-y-2 pr-1 ${
                  allSubordinates.length > 4 
                    ? "max-h-[280px] overflow-y-auto scroll-smooth" 
                    : "max-h-none overflow-y-visible"
                }`}
              >
                {allSubordinates.map(emp => {
                  const isSelected = employee?.Emp_code === emp.Emp_code;
                  return (
                    <button
                      key={emp.Emp_code}
                      id={`subordinate-${emp.Emp_code}`}
                      onClick={() => {
                        if (onSelectEmployee) {
                          onSelectEmployee(emp);
                        }
                      }}
                      type="button"
                      className={`w-full text-left py-2.5 px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" 
                          : "bg-white hover:bg-slate-50 border-slate-900 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`font-mono text-[10px] font-extrabold tracking-wider shrink-0 leading-none uppercase ${
                          isSelected ? "text-slate-400" : "text-slate-500"
                        }`}>
                          {emp.Emp_code}
                        </span>
                        <span className={`text-xs font-black truncate leading-none ${
                          isSelected ? "text-white" : "text-slate-900"
                        }`}>
                          {emp.Emp_Fname} {emp.Emp_Lname}
                        </span>
                      </div>
                      
                      {isSelected ? (
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shrink-0 shadow-sm border border-emerald-500"></span>
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-900 bg-white shrink-0"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3.5">
              <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-widest leading-none">
                {t("workerInfo")}
              </h3>
              
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="block text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">ID Code</span>
                  <span className="font-mono font-black text-slate-900 bg-slate-100/60 px-2 py-1 rounded border border-slate-250 border-slate-200 text-xs inline-block mt-0.5">{employee?.Emp_code}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Operator Name</span>
                  <span className="font-black text-slate-800 text-xs block mt-1.5 truncate">{employee?.Emp_Fname} {employee?.Emp_Lname}</span>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Picker (Work Date) & Time Picker Scroll zones combined for perfect symmetry */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {t("selectWorkDate")}
              </label>
              <input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="w-full bg-slate-50 text-slate-850 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 transition"
              />
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="grid grid-cols-2 gap-3.5">
                <CustomTimePicker
                  label={t("startTime")}
                  value={startTime}
                  onChange={(v) => handleManualTimeChange("start", v)}
                />
                <CustomTimePicker
                  label={t("endTime")}
                  value={endTime}
                  onChange={(v) => handleManualTimeChange("end", v)}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Dropdowns and Qty Numeric Counter Wheel */}
        <div className={isSidebar ? "space-y-4" : "md:col-span-2 space-y-6"}>
          
          {/* Dropdown selectors (Master Data) */}
          <div className={isSidebar ? "bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3.5" : "bg-white border border-slate-200 p-6 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4"}>
            
            {/* Calibur Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {t("selectCalibur")}
              </label>
              <select
                value={cbCode}
                onChange={(e) => setCbCode(e.target.value)}
                className="w-full max-w-full truncate bg-white border border-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none"
              >
                {loadingConfig ? (
                  <option>Loading...</option>
                ) : (
                  caliburs.map(c => (
                    <option key={c.CB_code} value={c.CB_code}>
                      {c.CB_code} - {c.CB_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* OP Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {t("selectOP")}
              </label>
              <select
                value={opCode}
                onChange={(e) => setOpCode(e.target.value)}
                className="w-full max-w-full truncate bg-white border border-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none"
              >
                {loadingConfig ? (
                  <option>Loading...</option>
                ) : (
                  ops.map(o => (
                    <option key={o.OP_code} value={o.OP_code}>
                      {o.OP_code} - {o.OP_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Line Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {t("selectLine")}
              </label>
              <select
                value={lineCode}
                onChange={(e) => setLineCode(e.target.value)}
                className="w-full max-w-full truncate bg-white border border-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none"
              >
                {loadingConfig ? (
                  <option>Loading...</option>
                ) : (
                  lines.map(l => (
                    <option key={l.Line_code} value={l.Line_code}>
                      {l.Line_code} - {l.Line_name}
                    </option>
                  ))
                )}
              </select>
            </div>

          </div>

          {/* Qty Counter Widget */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <CustomQtyPicker
              value={productionQty}
              onChange={(n) => setProductionQty(n)}
            />
          </div>

          {/* Add to List Direct Action button */}
          <button
            onClick={handleSubmitDirect}
            disabled={submitting}
            className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <FileCheck className="w-5 h-5 text-white" />
            )}
            <span>{language === "TH" ? "เพิ่มลงในรายการ" : "Add to list"}</span>
          </button>

        </div>

      </div>

    </div>
  );
}
