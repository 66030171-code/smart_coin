import React, { createContext, useContext, useState, ReactNode } from "react";

export type Language = "TH" | "EN";

interface TranslationDict {
  [key: string]: {
    TH: string;
    EN: string;
  };
}

  export const translations: TranslationDict = {
  // Common
  openSharePointExcel: { TH: "เปิดเอกสาร Excel บน SharePoint", EN: "Open Excel in SharePoint" },
  appTitle: { TH: "Smart COIN", EN: "Smart COIN" },
  appSub: { TH: "ส่วนจัดการเเละรายงานสายงานผลิตของหัวหน้างาน (Leader Space)", EN: "Manufacturing line reporting dashboard for team leaders" },
  leaderWorkspace: { TH: "พื้นที่ปฏิบัติงานหลัก", EN: "Leader Workspace" },
  adminConsole: { TH: "ผู้ดูแลระบบ (Admin Control)", EN: "Admin Console" },
  success: { TH: "สำเร็จ", EN: "Success" },
  error: { TH: "ข้อผิดพลาด", EN: "Error" },
  save: { TH: "บันทึก", EN: "Save" },
  cancel: { TH: "ยกเลิก", EN: "Cancel" },
  confirm: { TH: "ยืนยัน", EN: "Confirm" },
  delete: { TH: "ลบ", EN: "Delete" },
  edit: { TH: "แก้ไข", EN: "Edit" },
  add: { TH: "เพิ่มข้อมูล", EN: "Add" },
  searchPlaceholder: { TH: "ค้นหาข้อมูล...", EN: "Search records..." },
  loading: { TH: "กำลังโหลดข้อมูล...", EN: "Loading system data..." },
  logout: { TH: "ออกจากระบบ", EN: "Sign Out" },
  changeLanguage: { TH: "English", EN: "ภาษาไทย" },

  // Modules Login / Verify PIN
  username: { TH: "ชื่อผู้ใช้งาน (Username)", EN: "Username" },
  password: { TH: "รหัสผ่าน (Password)", EN: "Password" },
  loginBtn: { TH: "เข้าสู่ระบบขั้นที่ 1", EN: "Phase 1 - Login" },
  pinVerifyTitle: { TH: "ยืนยันการระบุตัวตนด้วย PIN 6 หลัก", EN: "Verify Identity with 6-Digit PIN" },
  pinExplain: { TH: "ป้อนรหัส PIN ลับความปลอดภัยเพื่อเริ่มทำงาน", EN: "Enter your secure PIN to unlock dashboard access" },
  confirmPin: { TH: "ยืนยันรหัส PIN", EN: "Confirm PIN" },
  notSetPin: { TH: "บัญชีนี้ยังไม่ได้ตั้งค่ารหัส PIN ยืนยันสิทธิ์เป็นครั้งแรก", EN: "This account has not set public security PIN yet" },
  linkToSetup: { TH: "คลิกเพื่อไปหน้าตั้งค่ารหัส PIN แรกเข้า", EN: "Click here to set up your initial PIN" },
  forgotPin: { TH: "ลืม PIN? ติดต่อผู้ดูแลระบบเพื่อรีเซ็ต", EN: "Forgot PIN? Contact system administrator to reset" },
  setupPinTitle: { TH: "ตั้งรหัส PIN แรกเข้าสังกัดความปลอดภัย", EN: "Generate Security PIN for First-Time Setup" },
  enterNew6Pin: { TH: "ระบุ PIN 6 หลักใหม่", EN: "Specify new 6-digit PIN" },
  confirmNewPin: { TH: "ยืนยันการระบุ PIN อีกครั้ง", EN: "Repeat and confirm your new PIN" },
  pinRuleNote: { TH: "ข้อบังคับ: ต้องเป็นตัวเลข 6 หลัก, ห้ามซ้ำกันหมด (เช่น 111111) หรือเรียงลำดับแถวหลัก (เช่น 123456)", EN: "Rules: 6 digits, no identical repeats (e.g. 111111), and no sequential series (e.g. 123456)." },
  setupPinBtn: { TH: "ลงชื่อตั้งค่ารหัสผ่านสำเร็จ", EN: "Secure and Setup Pin" },

  // Module Dashboard
  dashboard: { TH: "สรุปผลงาน", EN: "Overview Dashboard" },
  teamMembersCount: { TH: "จำนวนสมาชิกในทีม", EN: "Team Members" },
  todayEntries: { TH: "รายการส่งวันนี้", EN: "Entries Recorded Today" },
  todayTotalQty: { TH: "ชิ้นงานรวมวันนี้", EN: "Total Production Quantity" },
  dailyProductionChart: { TH: "กราฟสถิติผลผลิตรายวัน (7 วันย้อนหลัง)", EN: "7-Day Daily Production Output Chart" },
  monthlyProductionChart: { TH: "กราฟสถิติผลงานผลิตสรุปรายเดือน", EN: "Monthly Production Target Analysis" },
  exportExcelBtn: { TH: "ดาวน์โหลด Excel / CSV", EN: "Export Excel Report" },
  syncStatusTitle: { TH: "สถานะการเชื่อมต่อ และซิงค์ SharePoint Cloud Server", EN: "SharePoint Sync Log & Worksheet Status" },
  sharepointLiveSheets: { TH: "ตารางผลรวม SharePoint Excel Worksheets เเบ่งสี่หมวด", EN: "Live SharePoint excel worksheets synchronization status" },

  // Module Member management
  memberTab: { TH: "จัดการสมาชิกทีม", EN: "Team Members" },
  empCode: { TH: "รหัสพนักงาน", EN: "Employee Code" },
  empFname: { TH: "ชื่อจริง", EN: "First Name" },
  empLname: { TH: "นามสกุล", EN: "Last Name" },
  recordProductionBtn: { TH: "บันทึกข้อมูลผลงาน", EN: "Record Production" },
  addMemberBtn: { TH: "เพิ่มสมาชิกรายใหม่", EN: "Add Team Member" },
  editMemberTitle: { TH: "แก้ไขข้อมูลสมาชิกทีม", EN: "Edit Team Member" },
  confirmDeleteMember: { TH: "คุณแน่ใจว่าต้องการลบพนักงานทีมรหัส {0} หรือไม่?", EN: "Are you sure you want to remove team employee {0}?" },

  // Module Production Entry
  productionEntryTitle: { TH: "บันทึกผลงานรายวัน", EN: "Daily Record Entry" },
  workerInfo: { TH: "ข้อมูลพนักงาน", EN: "Operator Info" },
  selectWorkDate: { TH: "วันที่ปฏิบัติงาน", EN: "Work Date" },
  startTime: { TH: "เวลาเริ่มงาน", EN: "Start Time" },
  endTime: { TH: "เวลาเลิกงาน", EN: "End Time" },
  selectCalibur: { TH: "ประเภทเกรด (Calibur)", EN: "Grade (Calibur)" },
  selectOP: { TH: "ขั้นตอน (OP)", EN: "Process (OP)" },
  selectLine: { TH: "ไลน์ผลิต (Line)", EN: "Line" },
  productionResultQty: { TH: "จำนวนชิ้นงาน", EN: "Quantity" },
  quantityHelper: { TH: "เลื่อนเมาส์เหนือหลักเเล้วหมุนลูกกลิ้งเพื่อปรับ", EN: "Hover digits and scroll wheel to adjust." },
  realTimeSum: { TH: "ผลรวมชิ้นงาน", EN: "Total Qty" },
  unitsSuffix: { TH: "ชิ้น", EN: "Units" },

  // Review
  reviewTitle: { TH: "ตรวจสอบความถูกต้อง", EN: "Review & Edit" },
  reviewExplain: { TH: "สามารถคีย์ป้อนตัวเลขแบบระบุตรงกล่องข้อความนี้โดยตรงด้านล่าง", EN: "Can be manually typed directly." },
  submitBtn: { TH: "บันทึกและ Sync เข้า SharePoint", EN: "Save & Sync to SharePoint" },
  confirmSubmitMsg: { TH: "คุณยินคำสั่งยืนยันการบันทึกข้อมูลและรายงานผลิตชิ้นงานนี้เข้า SharePoint Excel ใช่ไหม?", EN: "Are you sure you want to commit this daily record entry and synchronize to SharePoint?" },

  // Master Data
  masterDataTab: { TH: "จัดการ Master Data", EN: "Master Data CRUD" },
  cbManager: { TH: "Calibur Management", EN: "Calibur CRUD" },
  opManager: { TH: "OP Management", EN: "OP Process CRUD" },
  lineManager: { TH: "Line Management", EN: "Production Lines list" },
  addButton: { TH: "เพิ่มค่าพารามิเตอร์", EN: "Add Master Parameter" },
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("TH");

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "TH" ? "EN" : "TH"));
  };

  const t = (key: string): string => {
    if (!translations[key]) return key;
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
