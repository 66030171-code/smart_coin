import React, { useState, useEffect } from "react";
import { 
  Users, RefreshCw, ShieldAlert, Key, CheckCircle, 
  Clock, Lock, Unlock, Search, Database, AlertCircle, FileText, Ban,
  HelpCircle
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { User, AuditLog } from "../types";

interface AdminPanelProps {
  currentUser: { Username: string; Role: string };
  onRefreshAll: () => void;
  onBackToApp: () => void;
}

export default function AdminPanel({ currentUser, onRefreshAll, onBackToApp }: AdminPanelProps) {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"users" | "audit">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const dbUsersRes = await fetch("/api/leaders"); // alias to fetch all safe user profiles
      const auditRes = await fetch("/api/audit-logs");
      
      if (dbUsersRes.ok) setUsers(await dbUsersRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const handleResetPin = async (targetUsername: string) => {
    if (!window.confirm(`คุณต้องการยืนยันการ Reset รหัส PIN ของ "${targetUsername}" ใช่หรือไม่? บัญชีนี้จะถูกปลดล็อกประวัติการกรอกผิดพลาด และเปิดให้ทำการตั้งค่ารหัสผ่านใหม่ (Set First PIN) ได้ทันที`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/reset-user-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: targetUsername,
          admin_username: currentUser.Username
        })
      });

      if (res.ok) {
        setSuccessMsg(`รีเซ็ตสิทธิ์รหัส PIN ประจำผู้ใช้ "${targetUsername}" สำเร็จแล้ว!`);
        fetchAdminData();
        onRefreshAll();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert("ไม่สามารถรีเซ็ตได้");
      }
    } catch {
      alert("เกิดข้อขัดข้องในการอ้างอิงและรีเซ็ต");
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm("คำเตือน: คุณต้องการล้างแก้ไขและจัดค่าเรคคอร์ดข้อมูลการกรอกรายงานผลิต, สมาชิก และ Master Data ย้อนหลังเป็นค่าตั้งต้นใช่หรือไม่?")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/reset-db", { method: "POST" });
      if (res.ok) {
        setSuccessMsg("ทำการล้างและ Re-seed สภาวะระบบจำลองระดับโรงงานทั้งหมดสำเร็จแล้ว!");
        fetchAdminData();
        onRefreshAll();
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        alert("ล้างไม่สำเร็จ");
      }
    } catch {
      alert("เกิดอาการขัดข้องในการเคลียร์ DB");
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "PIN_CREATED":
        return <span className="px-2.5 py-0.5 text-[9px] font-black rounded uppercase bg-slate-900 text-white border border-slate-950">PIN Setup</span>;
      case "PIN_FAILED":
        return <span className="px-2.5 py-0.5 text-[9px] font-black rounded uppercase bg-rose-50 text-rose-600 border border-rose-150 border-rose-200">Failed PIN</span>;
      case "PIN_LOCK":
        return <span className="px-2.5 py-0.5 text-[9px] font-black rounded uppercase bg-red-950 text-red-100 border border-red-900 animate-pulse">LOCK 15 MIN</span>;
      case "PIN_RESET":
        return <span className="px-2.5 py-0.5 text-[9px] font-black rounded uppercase bg-blue-50 text-blue-600 border border-blue-250 border-blue-200">Reset PIN</span>;
      case "LOGIN_PASSED_STAGE1":
        return <span className="px-2.5 py-0.5 text-[9px] font-black rounded uppercase bg-slate-100 text-slate-800 border border-slate-200">Pass login 1</span>;
      case "PIN_VERIFIED":
        return <span className="px-2.5 py-0.5 text-[9px] font-black rounded uppercase bg-emerald-50 text-emerald-700 border border-emerald-150 border-emerald-200">PIN Verified</span>;
      case "DAILY_SUBMIT":
        return <span className="px-2.5 py-0.5 text-[9px] font-black rounded uppercase bg-yellow-50 text-yellow-800 border-yellow-250 border border-yellow-200">DAILY RECORD</span>;
      case "MASTER_CRUD":
        return <span className="px-2.5 py-0.5 text-[9px] font-black rounded uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">MASTER SET</span>;
      case "EMP_CRUD":
        return <span className="px-2.5 py-0.5 text-[9px] font-black rounded uppercase bg-slate-100 text-slate-600 border border-slate-200">MEMBER SET</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[9px] font-black rounded uppercase bg-slate-100 text-slate-700 border border-slate-200">{action}</span>;
    }
  };

  // Search filtering
  const filteredUsers = users.filter(user => 
    user.Username.toLowerCase().includes(search.toLowerCase()) ||
    user.Role.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(log => 
    log.user_name.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="admin-management-console" className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden max-w-5xl mx-auto my-8 animate-fadeIn">
      {/* Visual Header banner */}
      <div className="bg-slate-900 border-b border-slate-950 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="bg-white/10 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-white/20">
            Console Core Level-4
          </span>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2 mt-1 font-display">
            <Lock className="w-5.5 h-5.5 text-white" />
            {t("adminConsole")}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            เครื่องมือปลดล็อค PIN กลับสู่ Setup State, บันทึกการกระทำ Security Audit Logs เเละล้างฐานข้อมูล Re-seeder
          </p>
        </div>
        <button
          onClick={onBackToApp}
          className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl active:scale-95 transition cursor-pointer"
        >
          &larr; {t("leaderWorkspace")}
        </button>
      </div>

      {/* Tabs list Controls */}
      <div className="border-b border-slate-200 bg-slate-50/50 flex flex-wrap justify-between items-center px-6 py-2">
        <div className="flex gap-1.5 py-1">
          <button
            onClick={() => { setActiveTab("users"); setSearch(""); }}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg cursor-pointer transition ${
              activeTab === "users"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            รายชื่อผู้ใช้ระบบ ({users.length})
          </button>
          <button
            onClick={() => { setActiveTab("audit"); setSearch(""); }}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Security Audit Log ({auditLogs.length})
          </button>
        </div>

        {/* Global search */}
        <div className="relative w-full max-w-xs my-2">
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

      {/* Success banner notifications */}
      {successMsg && (
        <div className="mx-6 mt-4 p-4 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-xl flex items-center gap-2 animate-fadeIn font-bold">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-xs">{successMsg}</p>
        </div>
      )}

      {/* Grid container */}
      <div className="p-6">
        
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4" />
                บัญชีใช้งานพนักงานในระบบพอร์ทัลหลัก
              </h3>
              
              <button
                onClick={handleResetDatabase}
                className="px-4 py-2 bg-rose-55 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-150 border-rose-200 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
              >
                <Ban className="w-3.5 h-3.5" />
                Reseed Database (ล้างฐานข้อมูลคืนค่าเริ่มต้น)
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-205 border-slate-200 rounded-xl bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="px-5 py-3.5">USER_ID</th>
                    <th className="px-5 py-3.5">USERNAME</th>
                    <th className="px-5 py-3.5">ROLE STATUS</th>
                    <th className="px-5 py-3.5">PIN STATUS</th>
                    <th className="px-5 py-3.5 text-center">PIN RESET ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">
                        ไม่พบบัญชีผู้ใช้ตามข้ออ้างอิงค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.User_id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3.5">
                          <span className="font-mono bg-slate-100 border border-slate-200 text-slate-800 font-extrabold px-2 py-0.5 rounded text-xs">
                            {u.User_id}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">{u.Username}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            u.Role === "Admin" ? "bg-amber-100 text-amber-900 border border-amber-250" : "bg-slate-100 text-slate-800 border border-slate-250"
                          }`}>
                            {u.Role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {u.PinHash ? (
                            <span className="flex items-center gap-1 text-emerald-700 font-bold">
                              <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                              ตั่งรหัส PIN เเล้ว (Active)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-400 italic">
                              <Lock className="w-3.5 h-3.5 text-slate-350 text-slate-400" />
                              รอสร้างรหัส (PIN = NULL)
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-center">
                            {u.PinHash ? (
                              <button
                                onClick={() => handleResetPin(u.Username)}
                                className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 rounded-lg font-bold text-[10px] cursor-pointer flex items-center gap-1 text-center active:scale-95"
                              >
                                <Key className="w-3 h-3 text-rose-500" />
                                Reset PIN
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">No PIN assigned</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Guide box */}
            <div className="bg-slate-50 border border-slate-250 border-slate-200 p-4 rounded-xl text-slate-700 text-xs leading-relaxed space-y-1 shadow-sm font-sans">
              <span className="font-bold text-slate-900 flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-slate-700" /> คำแนะนำเพื่อการตรวจสอบรหัส PIN ความปลอดภัย:</span>
              <p>&bull; <b>นายสมชาย (leader_somchai)</b>: รหัสผ่านคือ <strong className="font-mono bg-slate-200 px-1 py-0.5 text-slate-900 text-slate-800 rounded">password123</strong> และรหัสลับ PIN คือ <strong className="font-mono bg-slate-200 px-1 py-0.5 text-slate-900 text-slate-800 rounded">159357</strong></p>
              <p>&bull; <b>นางสาวสมหญิง (leader_somying)</b>: รหัสผ่านแรกเข้าคือ <strong className="font-mono bg-slate-200 px-1 py-0.5 text-slate-900 text-slate-800 rounded">password123</strong> และรหัสลับ PIN คือ <strong className="font-mono bg-slate-200 px-1 py-0.5 text-slate-900 text-slate-800 rounded">258258</strong></p>
              <p>&bull; <b>บัญชีแอดมิน (admin)</b>: เข้าร่วมทดสอบโดยใช้รหัสผ่านแรกเริ่ม <strong className="font-mono bg-slate-200 px-1 py-0.5 text-slate-900 text-slate-800 rounded">admin123</strong> แต่ผู้ใช้จะต้องสร้าง PIN 6 หลักใหม่ในการเข้าระบบเป็นครั้งแรก</p>
            </div>
          </div>
        )}

        {/* Audit Logs tab panel */}
        {activeTab === "audit" && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              การเข้าถึงความปลอดภัยเเละประวัติการใช้งาน (System Security Feed logs)
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white max-h-[420px] overflow-y-auto shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider sticky top-0">
                    <th className="px-4 py-4 bg-slate-50">วันเวลาทำรายการ</th>
                    <th className="px-4 py-4 bg-slate-50">ประเภทความปลอดภัย</th>
                    <th className="px-4 py-4 bg-slate-50">ผู้ทำรายการ</th>
                    <th className="px-4 py-4 bg-slate-50">รายละเอียด (Audit Message)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-700 font-mono">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">
                        ไม่พบข้อมูลใน Audit Logs
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("th-TH")}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="px-4 py-3 text-slate-800 font-bold whitespace-nowrap">
                          {log.user_name}
                        </td>
                        <td className="px-4 py-3 text-slate-500 leading-relaxed max-w-sm font-sans text-xs">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
