import React, { useState, useEffect } from "react";
import { 
  History, Users, FileSpreadsheet, SlidersHorizontal, 
  Database, LogOut, Globe, ShieldAlert, CheckCircle, 
  UserPlus, Award, Sliders
} from "lucide-react";
import { LanguageProvider, useLanguage } from "./components/LanguageContext";
import LoginAndPIN from "./components/LoginAndPIN";
import DashboardView from "./components/DashboardView";
import MemberManagement from "./components/MemberManagement";
import MasterDataManagement from "./components/MasterDataManagement";
import ExcelSyncStatus from "./components/ExcelSyncStatus";
import AdminPanel from "./components/AdminPanel";
import ProductionEntryForm from "./components/ProductionEntryForm";
import { Employee, User } from "./types";

function MainAppContent() {
  const { language, toggleLanguage, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Tab control states:
  // "dashboard" | "members" | "master" | "sharepoint" | "admin"
  const [currentTab, setCurrentTab] = useState<"dashboard" | "members" | "master" | "sharepoint" | "admin">("dashboard");

  // Subordinates state fetched automatically
  const [subordinates, setSubordinates] = useState<Employee[]>([]);
  const [loadingSubordinates, setLoadingSubordinates] = useState(false);

  // Active recording operator state:
  const [activeRecordingEmployee, setActiveRecordingEmployee] = useState<Employee | null>(null);

  // Sync ref hook to let children trigger state reloads instantly across tabs
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefreshAllData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTab("dashboard");
    setActiveRecordingEmployee(null);
    setSubordinates([]);
  };

  const handleSelectRecordEmployee = (emp: Employee) => {
    setActiveRecordingEmployee(emp);
    setCurrentTab("dashboard"); // bounce back to workspace dashboard to show the recording pane on the right instantly!
  };

  // Automatically fetch leader's subordinates upon successful authenticated entry
  useEffect(() => {
    if (!currentUser) {
      setSubordinates([]);
      return;
    }
    const fetchSubordinates = async () => {
      setLoadingSubordinates(true);
      try {
        const res = await fetch(`/api/employees?leader_id=${currentUser.User_id}`);
        if (res.ok) {
          const data = await res.json();
          setSubordinates(data);
          // Pre-populate active recording teammate if none is already selected
          if (data.length > 0 && !activeRecordingEmployee) {
            setActiveRecordingEmployee(data[0]);
          }
        }
      } catch (e) {
        console.error("Error reading subordinates list API", e);
      } finally {
        setLoadingSubordinates(false);
      }
    };
    fetchSubordinates();
  }, [currentUser, refreshTrigger]);

  const isMainWorkspace = currentUser !== null;

  return (
    <div className={isMainWorkspace ? "h-screen max-h-screen overflow-hidden bg-slate-100 flex flex-col font-sans select-none" : "min-h-screen bg-slate-50 flex flex-col font-sans transition-all"}>
      
      {/* Top Header Panel */}
      <header className="bg-slate-900 border-b border-slate-950 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 py-2 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          {/* Brand Identity / Headline Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white text-slate-900 rounded-xl flex items-center justify-center shadow font-black text-md tracking-wider">
              SC
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-white font-display uppercase leading-tight">
                {t("appTitle")}
              </h1>
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                {language === "TH" 
                  ? "ระบบลงสถิติและวิเคราะห์ชิ้นงานเพื่อประสานงาน SharePoint" 
                  : "Smart Manufacturing Reporting Console (Leader Space)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap md:flex-nowrap">
            {/* Bilingual Translation Trigger */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-black uppercase rounded-lg cursor-pointer transition flex items-center gap-1.5 border border-slate-700"
              title="สลับภาษา (Switch language context)"
            >
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>{language === "TH" ? "English" : "ภาษาไทย"}</span>
            </button>

            {/* Quick Logout Indicator if authenticated */}
            {currentUser && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-rose-300 bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-700 rounded-lg cursor-pointer transition-all"
                title={t("logout")}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Body Layout Container */}
      <main className={isMainWorkspace ? "flex-1 h-0 w-full max-w-[1600px] mx-auto p-4 flex flex-col justify-start overflow-hidden" : "flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 flex flex-col justify-start"}>
        
        {!currentUser ? (
          /* Authentication Screen (Module 1 & 2) */
          <div className="my-auto py-10 w-full max-w-xl mx-auto">
            <LoginAndPIN 
              onAuthSuccess={(usr) => setCurrentUser(usr)} 
              onRefreshAll={handleRefreshAllData}
            />
          </div>
        ) : (
          /* Logged In Working Console: 3-Column Dashboard Workspace */
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 items-stretch w-full overflow-hidden">
            
            {/* COLUMN 1: LEFT SIDEBAR PANEL ("หน้าเมนู") */}
            <aside className="w-full lg:w-60 h-full shrink-0 flex flex-col gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm overflow-hidden">
              
              {/* Authenticated Leader Profile Card */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-1.5 relative overflow-hidden shadow-inner shrink-0">
                <div className="absolute right-2 top-2 text-slate-700">
                  <Award className="w-10 h-10 stroke-1 opacity-20" />
                </div>
                <div className="text-[9px] uppercase font-mono font-black text-emerald-400 tracking-widest leading-none">
                  Leader Account
                </div>
                <div className="font-display font-black text-sm tracking-tight truncate">
                  👤 {currentUser.Username}
                </div>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-mono font-black uppercase">
                  Role: {currentUser.Role}
                </div>
              </div>

              {/* Navigation Sidebar List */}
              <div className="space-y-1 shrink-0">
                <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1 mb-1.5">
                  {language === "TH" ? "หน้าเมนูหลัก" : "MAIN NAVIGATION MENU"}
                </div>
                
                <button
                  onClick={() => setCurrentTab("dashboard")}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                    currentTab === "dashboard"
                      ? "bg-slate-900 text-white shadow-sm font-black"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>{language === "TH" ? "ประวัติการนำส่งงาน" : "Submission History"}</span>
                </button>

                <button
                  onClick={() => setCurrentTab("members")}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                    currentTab === "members"
                      ? "bg-slate-900 text-white shadow-sm font-black"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{t("memberTab")}</span>
                </button>

                <button
                  onClick={() => setCurrentTab("master")}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                    currentTab === "master"
                      ? "bg-slate-900 text-white shadow-sm font-black"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>{t("masterTab")}</span>
                </button>

                <button
                  onClick={() => setCurrentTab("sharepoint")}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                    currentTab === "sharepoint"
                      ? "bg-slate-900 text-white shadow-sm font-black"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{language === "TH" ? "แฟ้มเชื่อมต่อ SharePoint" : "SharePoint Sync status"}</span>
                </button>

                {currentUser.Role === "Admin" && (
                  <button
                    onClick={() => setCurrentTab("admin")}
                    className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2.5 bg-rose-50/20 cursor-pointer ${
                      currentTab === "admin"
                        ? "bg-rose-900 text-white shadow-sm font-black"
                        : "text-rose-805 text-rose-805 hover:bg-rose-50/65"
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    <span>{t("adminConsole")}</span>
                  </button>
                )}
              </div>

              {/* Subordinates selector list ("พนักงานในสังกัด") */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="border-t border-slate-100 pt-3 pb-1.5 text-[9px] font-black uppercase text-slate-400 tracking-widest px-1 flex justify-between items-center shrink-0">
                  <span>👥 {language === "TH" ? "เลือกพนักงานเพื่อกรอก" : "Select operator to write"}</span>
                  
                  {/* Shortcut to list management */}
                  <button 
                    onClick={() => setCurrentTab("members")} 
                    title={t("addMemberBtn")}
                    className="text-slate-400 hover:text-slate-900 transition bg-slate-100 hover:bg-slate-200 p-0.5 rounded-md"
                  >
                    <UserPlus className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-sans">
                  {subordinates.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic p-3 text-center bg-slate-50/40 rounded-xl">
                      {language === "TH" ? "ไม่มีพนักงานในสังกัด" : "No subordinaries found"}
                    </div>
                  ) : (
                    subordinates.map((emp) => {
                      const isActive = activeRecordingEmployee?.Emp_code === emp.Emp_code;
                      return (
                        <button
                          key={emp.Emp_code}
                          onClick={() => handleSelectRecordEmployee(emp)}
                          className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between text-xs cursor-pointer ${
                            isActive
                              ? "bg-slate-900 text-white font-black shadow-inner"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100/70"
                          }`}
                        >
                          <div className="flex flex-col truncate pr-2">
                            <span className="font-mono font-bold text-[9px] opacity-80">{emp.Emp_code}</span>
                            <span className="font-sans truncate text-[11px] font-bold">{emp.Emp_Fname} {emp.Emp_Lname}</span>
                          </div>
                          {isActive && (
                            <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 block"></span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

            </aside>

            {/* COLUMN 2: CENTER WORK AREA PANEL */}
            <section className="flex-1 h-full min-w-0 overflow-hidden flex flex-col">
              
              {currentTab === "dashboard" && (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden" key={`dash-${refreshTrigger}`}>
                  <DashboardView
                    currentUser={currentUser}
                    onRedirectToRecord={() => setCurrentTab("members")}
                    onRefreshAll={handleRefreshAllData}
                  />
                </div>
              )}

              {currentTab === "members" && (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden" key={`members-${refreshTrigger}`}>
                  <MemberManagement 
                    currentUser={currentUser}
                    onSelectMember={handleSelectRecordEmployee}
                    onRefreshAll={handleRefreshAllData}
                  />
                </div>
              )}

              {currentTab === "master" && (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden" key={`master-${refreshTrigger}`}>
                  <MasterDataManagement
                    currentUser={currentUser}
                    onConfigChange={handleRefreshAllData}
                  />
                </div>
              )}

              {currentTab === "sharepoint" && (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden" key={`sync-${refreshTrigger}`}>
                  <ExcelSyncStatus
                    refreshTrigger={refreshTrigger}
                  />
                </div>
              )}

              {currentTab === "admin" && currentUser.Role === "Admin" && (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden" key={`admin-${refreshTrigger}`}>
                  <AdminPanel
                    currentUser={currentUser}
                    onRefreshAll={handleRefreshAllData}
                    onBackToApp={() => setCurrentTab("dashboard")}
                  />
                </div>
              )}

            </section>

            {/* COLUMN 3: RIGHT PANEL ("หน้ากรอกข้อมูล") */}
            {currentTab === "dashboard" && (
              <aside className="w-full lg:w-[380px] h-full shrink-0 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col overflow-hidden">
                {activeRecordingEmployee ? (
                  <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden pr-1" key={`form-${activeRecordingEmployee.Emp_code}-${refreshTrigger}`}>
                    <ProductionEntryForm
                      isSidebar={true}
                      allSubordinates={subordinates}
                      onSelectEmployee={(emp) => setActiveRecordingEmployee(emp)}
                      employee={activeRecordingEmployee}
                      currentUser={currentUser}
                      onBackToTeam={() => {}}
                      onSubmitSuccess={() => {
                        handleRefreshAllData(); // reload statistics and charts immediately!
                      }}
                    />
                  </div>
                ) : (
                  <div className="my-auto py-16 text-center text-slate-400 italic font-sans flex flex-col items-center justify-center gap-3 shrink-0">
                    <Sliders className="w-8 h-8 text-slate-300 animate-pulse" />
                    <div>
                      <p className="font-bold text-slate-700 text-xs not-italic">
                        {language === "TH" ? "ยังไม่ได้เลือกพนักงาน" : "No operator selected"}
                      </p>
                      <p className="text-[10px] mt-1 text-slate-450 text-slate-400">
                        {language === "TH" 
                          ? "กรุณาคลิกเลือกพนักงานในแผงเมนูด้านซ้ายเพื่อเริ่มระบุชิ้นงาน" 
                          : "Click member from Left sidebar list to begin reporting."}
                      </p>
                    </div>
                  </div>
                )}
              </aside>
            )}

          </div>
        )}

      </main>

      {/* Footer Design Accents */}
      <footer className="bg-slate-900 border-t border-slate-950 py-2 text-center text-[10px] text-slate-400 font-mono tracking-wider uppercase shrink-0">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col sm:flex-row justify-between gap-1 font-semibold">
          <span>&copy; SMART COIN MANUFACTURING WORKSPACE &middot; {language === "TH" ? "ระบบคลังผลผลิตพนักงาน" : "PROD RECORD CONSOLE"}</span>
          <div className="flex justify-center gap-4 text-emerald-400">
            <span>Microsoft SharePoint: Connected</span>
            <span>&bull;</span>
            <span>PIN Lockdown: ACTIVE</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainAppContent />
    </LanguageProvider>
  );
}
