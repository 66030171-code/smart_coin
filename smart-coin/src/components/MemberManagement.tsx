import React, { useState, useEffect } from "react";
import { 
  Users, Search, UserPlus, Pencil, Trash, ClipboardSignature, 
  X, Save, AlertCircle, RefreshCw 
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { Employee } from "../types";

interface MemberManagementProps {
  currentUser: { User_id: string; Username: string };
  onSelectMember: (employee: Employee) => void;
  onRefreshAll: () => void;
}

export default function MemberManagement({ currentUser, onSelectMember, onRefreshAll }: MemberManagementProps) {
  const { language, t } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");

  // Editor states
  const [addMode, setAddMode] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);

  // Form Fields
  const [empCode, setEmpCode] = useState("");
  const [empFname, setEmpFname] = useState("");
  const [empLname, setEmpLname] = useState("");

  const loadTeamEmployees = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // Fetch specifically for current logged-in Leader
      const res = await fetch(`/api/employees?leader_id=${currentUser.User_id}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      } else {
        setErrorMsg("ไม่สามารถดึงข้อมูลทะเบียนพนักงานจากเซิร์ฟเวอร์");
      }
    } catch {
      setErrorMsg("ขาดการเชื่อมโยงระบบสัญญาณเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamEmployees();
  }, [currentUser.User_id]);

  const handleResetForm = () => {
    setAddMode(false);
    setEditingCode(null);
    setEmpCode("");
    setEmpFname("");
    setEmpLname("");
    setErrorMsg("");
  };

  // Add Member
  const handleOpenAdd = () => {
    handleResetForm();
    setAddMode(true);
  };

  // Edit Member
  const handleOpenEdit = (emp: Employee) => {
    handleResetForm();
    setEditingCode(emp.Emp_code);
    setEmpCode(emp.Emp_code);
    setEmpFname(emp.Emp_Fname);
    setEmpLname(emp.Emp_Lname);
  };

  // Save Add/Edit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!empCode.trim() || !empFname.trim() || !empLname.trim()) {
      setErrorMsg("กรุณาระบุกรอกรหัสพนักงาน ชื่อ และนามสกุลให้ครบทุกช่อง");
      return;
    }

    const payload = {
      Emp_code: empCode.trim(),
      Emp_Fname: empFname.trim(),
      Emp_Lname: empLname.trim(),
      Leader_id: currentUser.User_id,
      requester: currentUser.Username
    };

    const url = addMode ? "/api/employees" : `/api/employees/${editingCode}`;
    const method = addMode ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูลพนักงาน");
      } else {
        loadTeamEmployees();
        onRefreshAll();
        handleResetForm();
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดด้านการต่อสัญญาณเน็ตเวิร์ก");
    }
  };

  // Delete Member
  const handleDelete = async (emp: Employee) => {
    const confirmMessage = t("confirmDeleteMember").replace("{0}", `"${emp.Emp_code} - ${emp.Emp_Fname} ${emp.Emp_Lname}"`);
    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/employees/${emp.Emp_code}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requester: currentUser.Username })
      });
      if (res.ok) {
        loadTeamEmployees();
        onRefreshAll();
      } else {
        const data = await res.json();
        alert(data.error || "การลบพนักงานไม่สำเร็จ");
      }
    } catch {
      alert("ขัดข้องในการต่อสัญญาณกับ API");
    }
  };

  // Filter Search Team
  const filteredEmployees = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.Emp_code.toLowerCase().includes(q) ||
      e.Emp_Fname.toLowerCase().includes(q) ||
      e.Emp_Lname.toLowerCase().includes(q)
    );
  });

  return (
    <div id="team-member-mgmt" className="h-full flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden animate-fadeIn">
      {/* Banner */}
      <div className="border-b border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-2.5 py-0.5 text-[10px] uppercase font-black bg-slate-100 text-slate-800 border border-slate-300 rounded tracking-wider">
            {language === "TH" ? "ทีมงานฝ่ายผลิต" : "Operational Team"}
          </span>
          <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2 mt-1 px-0.5">
            <Users className="w-5.2 h-5.2 text-slate-850" />
            {t("memberTab")} ({employees.length})
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            แผงข้อมูลจัดการสมาชิกพนักงานสังกัดตรงสายคุณ เลือกสมาชิกพนักงานใต้สังกัดเพื่อทำรายงานกรอกผลงานประจำวัน
          </p>
        </div>

        <button 
          onClick={loadTeamEmployees}
          className="p-1 px-3 text-[10px] bg-slate-100 font-bold max-w-xs text-slate-750 hover:bg-slate-200 text-slate-800 rounded-lg cursor-pointer transition flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> ดึงพนักงานใหม่
        </button>
      </div>

      {/* Controllers: Search & Add button */}
      <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4 flex flex-wrap justify-between items-center gap-3">
        {/* Search */}
        <div className="relative w-full max-w-xs">
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

        {!addMode && !editingCode && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            {t("addMemberBtn")}
          </button>
        )}
      </div>

      {/* Content wrapper */}
      <div className="flex-1 min-h-0 p-6 flex flex-col">
        
        {/* If Add / Edit mode is active */}
        {(addMode || editingCode) && (
          <form onSubmit={handleSave} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 space-y-4 max-w-xl animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                {addMode ? t("addMemberBtn") : `${t("editMemberTitle")} (CODE: ${editingCode})`}
              </h4>
              <button type="button" onClick={handleResetForm} className="text-slate-400 hover:text-slate-750 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Emp Code ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">{t("empCode")}</label>
                <input
                  type="text"
                  disabled={!addMode}
                  value={empCode}
                  onChange={(e) => setEmpCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EMP-009"
                  className="w-full bg-white text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none font-mono font-bold"
                />
              </div>

              {/* Emp Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">{t("empFname")}</label>
                <input
                  type="text"
                  value={empFname}
                  onChange={(e) => setEmpFname(e.target.value)}
                  placeholder="ชื่อจริง..."
                  className="w-full bg-white text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none font-semibold text-slate-800"
                />
              </div>

              {/* Emp Surname */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">{t("empLname")}</label>
                <input
                  type="text"
                  value={empLname}
                  onChange={(e) => setEmpLname(e.target.value)}
                  placeholder="นามสกุล..."
                  className="w-full bg-white text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
              >
                <Save className="w-4 h-4" />
                {t("save")}
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                {t("cancel")}
              </button>
            </div>

          </form>
        )}

        {/* Main List Grid Table */}
        <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">{t("empCode")} (PK)</th>
                <th className="px-6 py-4">{t("empFname")}</th>
                <th className="px-6 py-4">{t("empLname")}</th>
                <th className="px-6 py-4 text-center">จัดการสมาชิก / รายงานผลงาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">
                    ไม่พบพนักงานในก๊วน หรือผลการค้นหาว่างเปล่า
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.Emp_code} className="hover:bg-slate-50/40 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono bg-slate-100 border border-slate-200 font-black px-2.5 py-1 rounded text-slate-800">
                        {emp.Emp_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{emp.Emp_Fname}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{emp.Emp_Lname}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Selected record trigger button */}
                        <button
                          onClick={() => onSelectMember(emp)}
                          className="px-3.5 py-2 bg-slate-905 bg-slate-905 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 text-[11px] font-sans active:scale-95"
                        >
                          <ClipboardSignature className="w-3.5 h-3.5 text-white" />
                          {t("recordProductionBtn")}
                        </button>
                        
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-2 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition"
                          title={t("edit")}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(emp)}
                          className="p-2 text-rose-700 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-105 hover:bg-rose-100 cursor-pointer transition"
                          title={t("delete")}
                        >
                          <Trash className="w-3.5 h-3.5" />
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
  );
}
