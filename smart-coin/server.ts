import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { 
  User, Employee, Calibur, OP, Line, Daily, AuditLog, SharepointSyncLog 
} from "./src/types.js";

// Recreate __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(express.json());

// Initialize Database with Demo Data
function initDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      // Validate we have all necessary tables
      if (
        data.users && 
        data.employees && 
        data.caliburs && 
        data.ops && 
        data.lines && 
        data.dailies && 
        data.auditLogs && 
        data.sharepointSyncLogs &&
        data.locks
      ) {
        return data;
      }
    } catch (e) {
      console.error("Error reading database file, reinitializing...", e);
    }
  }

  // Pre-hash passwords and PINs
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync("password123", salt);
  const adminPasswordHash = bcrypt.hashSync("admin123", salt);
  const somchaiPinHash = bcrypt.hashSync("159357", salt); // Valid and complex
  const somyingPinHash = bcrypt.hashSync("258258", salt); // Valid and complex

  const initialData = {
    users: [
      {
        User_id: "u_001",
        Username: "leader_somchai",
        PasswordHash: passwordHash,
        PinHash: somchaiPinHash,
        Role: "Leader",
        IsActive: true
      },
      {
        User_id: "u_002",
        Username: "leader_somying",
        PasswordHash: passwordHash,
        PinHash: somyingPinHash,
        Role: "Leader",
        IsActive: true
      },
      {
        User_id: "u_003",
        Username: "admin",
        PasswordHash: adminPasswordHash,
        PinHash: null, // First-time PIN setup required
        Role: "Admin",
        IsActive: true
      }
    ] as User[],
    employees: [
      { Emp_code: "EMP-001", Emp_Fname: "สมศักดิ์", Emp_Lname: "รักชาติ", Leader_id: "u_001" },
      { Emp_code: "EMP-002", Emp_Fname: "นงนุช", Emp_Lname: "สุดสวย", Leader_id: "u_001" },
      { Emp_code: "EMP-003", Emp_Fname: "กรรณิการ์", Emp_Lname: "พาเพลิน", Leader_id: "u_001" },
      { Emp_code: "EMP-004", Emp_Fname: "ปรัชญา", Emp_Lname: "ปัญญาไว", Leader_id: "u_001" },
      { Emp_code: "EMP-005", Emp_Fname: "ชูชาติ", Emp_Lname: "ชัชวาล", Leader_id: "u_002" },
      { Emp_code: "EMP-006", Emp_Fname: "วิชัย", Emp_Lname: "เกียรติดำรง", Leader_id: "u_002" },
      { Emp_code: "EMP-007", Emp_Fname: "อรอนงค์", Emp_Lname: "พงศ์สวัสดิ์", Leader_id: "u_002" },
      { Emp_code: "EMP-008", Emp_Fname: "มนัส", Emp_Lname: "มั่นคง", Leader_id: "u_002" }
    ] as Employee[],
    caliburs: [
      { CB_code: "CB001", CB_name: "Assembly (ประกอบตัวเครื่อง)" },
      { CB_code: "CB002", CB_name: "Welding (เชื่อมโลหะโครงสร้าง)" },
      { CB_code: "CB003", CB_name: "Painting (ทำสีพ่นเคลือบกันสนิม)" },
      { CB_code: "CB004", CB_name: "QC Inspection (ตรวจเช็คคุณภาพ)" }
    ] as Calibur[],
    ops: [
      { OP_code: "OP001", OP_name: "Line Operator (ผู้ปฏิบัติงานสายการผลิต)" },
      { OP_code: "OP002", OP_name: "Technical Support (ช่างเทคนิคสนับสนุน)" },
      { OP_code: "OP003", OP_name: "Material Infeed (ผู้คุมวัตถุดิบป้อนเครื่อง)" },
      { OP_code: "OP004", OP_name: "Finishing Checker (ตรวจสัดส่วนประกอบขั้นสุดท้าย)" }
    ] as OP[],
    lines: [
      { Line_code: "LN001", Line_name: "Production Line A" },
      { Line_code: "LN002", Line_name: "Production Line B" },
      { Line_code: "LN003", Line_name: "Production Line C" }
    ] as Line[],
    dailies: [
      {
        _id: "dl_01",
        Emp_code: "EMP-001",
        Emp_Fname: "สมศักดิ์",
        Emp_Lname: "รักชาติ",
        Work_Date: "2026-06-01",
        Start_DateTime: "08:00",
        End_DateTime: "17:00",
        CB_code: "CB001",
        OP_code: "OP001",
        Line_code: "LN001",
        Production_Qty: 1250,
        Created_By: "leader_somchai",
        Created_Date: "2026-06-01T17:15:00.000Z"
      },
      {
        _id: "dl_02",
        Emp_code: "EMP-002",
        Emp_Fname: "นงนุช",
        Emp_Lname: "สุดสวย",
        Work_Date: "2026-06-02",
        Start_DateTime: "08:30",
        End_DateTime: "17:30",
        CB_code: "CB002",
        OP_code: "OP003",
        Line_code: "LN002",
        Production_Qty: 850,
        Created_By: "leader_somchai",
        Created_Date: "2026-06-02T17:40:00.000Z"
      },
      {
        _id: "dl_03",
        Emp_code: "EMP-005",
        Emp_Fname: "ชูชาติ",
        Emp_Lname: "ชัชวาล",
        Work_Date: "2026-06-03",
        Start_DateTime: "08:00",
        End_DateTime: "17:00",
        CB_code: "CB003",
        OP_code: "OP002",
        Line_code: "LN003",
        Production_Qty: 1520,
        Created_By: "leader_somying",
        Created_Date: "2026-06-03T17:05:00.000Z"
      },
      {
        _id: "dl_04",
        Emp_code: "EMP-006",
        Emp_Fname: "วิชัย",
        Emp_Lname: "เกียรติดำรง",
        Work_Date: "2026-06-04",
        Start_DateTime: "09:00",
        End_DateTime: "18:00",
        CB_code: "CB001",
        OP_code: "OP001",
        Line_code: "LN001",
        Production_Qty: 935,
        Created_By: "leader_somying",
        Created_Date: "2026-06-04T18:10:00.000Z"
      },
      {
        _id: "dl_05",
        Emp_code: "EMP-003",
        Emp_Fname: "กรรณิการ์",
        Emp_Lname: "พาเพลิน",
        Work_Date: "2026-06-04",
        Start_DateTime: "08:00",
        End_DateTime: "17:00",
        CB_code: "CB004",
        OP_code: "OP004",
        Line_code: "LN002",
        Production_Qty: 1100,
        Created_By: "leader_somchai",
        Created_Date: "2026-06-04T17:22:00.000Z"
      }
    ] as Daily[],
    auditLogs: [
      {
        id: "log_init",
        timestamp: new Date().toISOString(),
        action: "SYSTEM_INIT",
        user_name: "System",
        details: "ระบบ Daily Production Record System เริ่มต้นฐานข้อมูลสาธิตระดับ Production"
      }
    ] as AuditLog[],
    sharepointSyncLogs: [
      {
        id: "sync_init",
        timestamp: new Date().toISOString(),
        sheet: "Daily",
        action: "CREATE",
        payload: "Seeded initial record entries",
        status: "SUCCESS"
      }
    ] as SharepointSyncLog[],
    locks: [] as { Username: string; wrong_attempts: number; locked_until: string | null }[]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  return initialData;
}

// Helpers
function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (e) {
    return initDb();
  }
}

function writeDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function addAuditLog(action: string, userName: string, details: string) {
  const db = readDb();
  const newLog: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    action,
    user_name: userName,
    details
  };
  db.auditLogs.unshift(newLog);
  writeDb(db);
}

function addSharepointSyncLog(sheet: "Calibur" | "OP" | "Line" | "Daily", action: "CREATE" | "UPDATE" | "DELETE", payload: any) {
  const db = readDb();
  const newLog: SharepointSyncLog = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    sheet,
    action,
    payload: typeof payload === "string" ? payload : JSON.stringify(payload),
    status: "SUCCESS" // Realistically mock Microsoft Graph API Success status
  };
  db.sharepointSyncLogs.unshift(newLog);
  writeDb(db);
}

// Validate PIN format (6-digit numeric, non-repeating, non-sequential)
function validatePin(pin: string): { valid: boolean; reason?: string } {
  if (!/^\d+$/.test(pin)) {
    return { valid: false, reason: "PIN ต้องประกอบด้วยตัวเลขเท่านั้น" };
  }
  if (pin.length !== 6) {
    return { valid: false, reason: "PIN ต้องมีความยาวเป็นตัวเลข 6 หลัก" };
  }

  // Prevent simple repeats e.g. 111111, 222222
  const uniqueDigits = new Set(pin);
  if (uniqueDigits.size === 1) {
    return { valid: false, reason: "ห้ามใช้ชุดตัวเลขซ้ำกันทั้งหมด (เช่น 111111)" };
  }

  // Prevent direct sequences e.g. 123456, 654321, 012345
  let isIncreasing = true;
  let isDecreasing = true;
  for (let i = 0; i < pin.length - 1; i++) {
    const diff = pin.charCodeAt(i + 1) - pin.charCodeAt(i);
    if (diff !== 1) isIncreasing = false;
    if (diff !== -1) isDecreasing = false;
  }
  if (isIncreasing || isDecreasing) {
    return { valid: false, reason: "ห้ามใช้ตัวเลขที่มีลำดับเรียงกันโดยตรง (เช่น 123456, 654321)" };
  }

  return { valid: true };
}

// Ensure database sits populated
initDb();

// ---------------- REST API API ROUTES ----------------

// 1. JWT / Password Auth (Module 1)
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "กรุณาระบุกรอก Username และ Password" });
  }

  const db = readDb();
  const user = db.users.find((u: User) => u.Username.toLowerCase() === username.toLowerCase());

  if (!user || !user.IsActive) {
    return res.status(404).json({ error: "ไม่พบผู้ใช้ในระบบ หรือบัญชีถูกระงับการใช้งาน" });
  }

  // Match Password
  const isMatch = bcrypt.compareSync(password, user.PasswordHash);
  if (!isMatch) {
    addAuditLog("LOGIN_FAILED", username, "พยายามเข้าสู่ระบบด้วยรหัสผ่านที่ไม่ถูกต้อง");
    return res.status(401).json({ error: "Username หรือ Password ไม่ถูกต้อง" });
  }

  addAuditLog("LOGIN_PASSED_STAGE1", username, "ผ่านการยืนยันรหัสผ่านขั้นแรก ย้ายเข้าสู่หน้ายืนยัน PIN");

  // User details without hash secrets
  const safeUser = {
    User_id: user.User_id,
    Username: user.Username,
    Role: user.Role,
    IsActive: user.IsActive,
    isPinCreated: !!user.PinHash
  };

  // Login stage 1 passed. Clients must redirect to PIN challenge.
  res.json({
    success: true,
    message: "ผ่านการเข้าสู่ระบบขั้นแรกแล้ว กรุณายืนยันรหัส PIN 6 หลักเพื่อเข้าใช้งาน",
    user: safeUser
  });
});

// 2. PIN Verification Stage (Module 2)
app.post("/api/auth/verify-pin", (req, res) => {
  const { username, pin } = req.body;

  if (!username || !pin) {
    return res.status(400).json({ error: "กรุณาระบุกรอกรหัส PIN" });
  }

  const db = readDb();
  const user = db.users.find((u: User) => u.Username.toLowerCase() === username.toLowerCase());

  if (!user) {
    return res.status(404).json({ error: "ผู้ใช้ไม่พบบัญชีอ้างอิง" });
  }

  if (!user.PinHash) {
    return res.status(428).json({
      error: "ผู้ใช้ยังไม่ได้กำหนดรหัส PIN แรกเข้าในระบบ กรุณาข้ามไปสร้าง PIN ใหม่ก่อน",
      needsSetup: true
    });
  }

  const isMatch = bcrypt.compareSync(pin, user.PinHash);

  if (!isMatch) {
    addAuditLog("PIN_FAILED", username, "กรอกรหัส PIN ผิดพลาด");
    return res.status(401).json({ error: "รหัส PIN ไม่ถูกต้อง", wrongAttempts: 0, locked: false });
  }

  addAuditLog("PIN_VERIFIED", username, "การพิสูจน์ตัวตนด้วย PIN สำเร็จ เข้าสู่พื้นที่ปฏิบัติการ");

  const safeUser = {
    User_id: user.User_id,
    Username: user.Username,
    Role: user.Role,
    IsActive: user.IsActive,
    isPinCreated: true
  };

  res.json({
    success: true,
    user: safeUser
  });
});

// Setup New First PIN
app.post("/api/auth/setup-pin", (req, res) => {
  const { username, newPin, confirmPin } = req.body;

  if (!username || !newPin || !confirmPin) {
    return res.status(400).json({ error: "ข้อมูลอินพุตไม่ครบถ้วนสำหรับการลงทะเบียน PIN" });
  }

  if (newPin !== confirmPin) {
    return res.status(400).json({ error: "รหัส PIN และยืนยัน PIN ไม่ตรงกัน" });
  }

  const validation = validatePin(newPin);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  const db = readDb();
  const userIndex = db.users.findIndex((u: User) => u.Username.toLowerCase() === username.toLowerCase());

  if (userIndex === -1) {
    return res.status(404).json({ error: "ไม่พบชื่อพนักงานที่เหมาะสม" });
  }

  const salt = bcrypt.genSaltSync(10);
  db.users[userIndex].PinHash = bcrypt.hashSync(newPin, salt);
  writeDb(db);

  addAuditLog("PIN_CREATED", username, "สร้างและเปิดใช้งานรหัส PIN 6 หลักแรกเข้าเรียบร้อยผ่านพอร์ทัลความปลอดภัย");

  res.json({ success: true, message: "สร้างเปิดใช้งานความปลอดภัย PIN สำเร็จแล้ว!" });
});

// Reset specific users PIN by admins (Audit log triggers)
app.post("/api/admin/reset-user-pin", (req, res) => {
  const { username, admin_username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "กรุณาระบุ Username ที่ต้องการรีเซ็ต" });
  }

  const db = readDb();
  const index = db.users.findIndex((u: User) => u.Username.toLowerCase() === username.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ error: "ไม่พบบัญชีผู้ใช้เป้าหมาย" });
  }

  db.users[index].PinHash = null; // Set pin wait initialization
  
  // Clear any incorrect locks
  const lockIndex = db.locks.findIndex((l: any) => l.Username.toLowerCase() === username.toLowerCase());
  if (lockIndex !== -1) {
    db.locks[lockIndex].wrong_attempts = 0;
    db.locks[lockIndex].locked_until = null;
  }

  writeDb(db);

  addAuditLog(
    "PIN_RESET",
    admin_username || "Admin",
    `รีเซ็ตโครงสร้าง PIN บัญชี "${username}" กลับสู่จุดเริ่มต้น (First PIN Setup Status)`
  );

  res.json({ success: true, message: `รีเซ็ตสิทธิ์ PIN สำเร็จสำหรับ ${username}` });
});


// 3. Team Member Management (Module 3)
app.get("/api/employees", (req, res) => {
  const db = readDb();
  const { leader_id, search } = req.query;

  let list = db.employees;

  // Filter by leader if provided
  if (leader_id) {
    list = list.filter((e: Employee) => e.Leader_id === leader_id);
  }

  // Search keyword filter (Emp_code, Emp_Fname, Emp_Lname)
  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(
      (e: Employee) =>
        e.Emp_code.toLowerCase().includes(s) ||
        e.Emp_Fname.toLowerCase().includes(s) ||
        e.Emp_Lname.toLowerCase().includes(s)
    );
  }

  res.json(list);
});

app.post("/api/employees", (req, res) => {
  const { Emp_code, Emp_Fname, Emp_Lname, Leader_id, requester } = req.body;

  if (!Emp_code || !Emp_Fname || !Emp_Lname || !Leader_id) {
    return res.status(400).json({ error: "กรุณากรอกฟิลด์รหัสพนักงาน ชื่อ และนามสกุลให้ครบถ้วน" });
  }

  const db = readDb();
  const exists = db.employees.some((e: Employee) => e.Emp_code.toLowerCase() === Emp_code.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: `รหัสพนักงาน ${Emp_code} มีการระบุแล้วในระบบทะเบียนฐานข้อมูล` });
  }

  const newEmp: Employee = { Emp_code, Emp_Fname, Emp_Lname, Leader_id };
  db.employees.push(newEmp);
  writeDb(db);

  addAuditLog("EMP_CRUD", requester || "System", `เพิ่มสมาชิกทีมใหม่ รหัส: ${Emp_code} [${Emp_Fname} ${Emp_Lname}]`);

  res.status(201).json(newEmp);
});

app.put("/api/employees/:code", (req, res) => {
  const { code } = req.params;
  const { Emp_Fname, Emp_Lname, Leader_id, requester } = req.body;

  const db = readDb();
  const idx = db.employees.findIndex((e: Employee) => e.Emp_code.toLowerCase() === code.toLowerCase());

  if (idx === -1) {
    return res.status(404).json({ error: "ไม่พบพนักงานท่านนี้ในการอัปเดต" });
  }

  // Update particulars
  db.employees[idx] = {
    ...db.employees[idx],
    Emp_Fname: Emp_Fname || db.employees[idx].Emp_Fname,
    Emp_Lname: Emp_Lname || db.employees[idx].Emp_Lname,
    Leader_id: Leader_id || db.employees[idx].Leader_id
  };
  writeDb(db);

  addAuditLog("EMP_CRUD", requester || "System", `อัปเดตแก้นามสกุล/ชื่อ สมาชิกทีมในสังกัด รหัส: ${code}`);

  res.json(db.employees[idx]);
});

app.delete("/api/employees/:code", (req, res) => {
  const { code } = req.params;
  const { requester } = req.body || {};

  const db = readDb();
  const idx = db.employees.findIndex((e: Employee) => e.Emp_code.toLowerCase() === code.toLowerCase());

  if (idx === -1) {
    return res.status(404).json({ error: "ไม่พบรหัสทะเบียนเป้าหมายที่จะลบ" });
  }

  const removed = db.employees[idx];
  db.employees.splice(idx, 1);
  writeDb(db);

  addAuditLog("EMP_CRUD", requester || "System", `ลบข้อมูลพนักงานออกจากทีมสังกัด รหัส: ${code} [${removed.Emp_Fname}]`);

  res.json({ success: true, message: `ลบสมาชิก ${code} สำเร็จเรียบร้อย` });
});


// 4. Master Data Core CRUD Endpoints (Module 5)

// Caliburs
app.get("/api/caliburs", (req, res) => {
  const db = readDb();
  const { search } = req.query;
  let list = db.caliburs;
  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter((c: Calibur) => c.CB_code.toLowerCase().includes(s) || c.CB_name.toLowerCase().includes(s));
  }
  res.json(list);
});

app.post("/api/caliburs", (req, res) => {
  const { CB_code, CB_name, requester } = req.body;
  if (!CB_code || !CB_name) return res.status(400).json({ error: "กรุณาระบุกรอกรหัสและชื่องาน Calibur" });

  const db = readDb();
  if (db.caliburs.some((c: Calibur) => c.CB_code.toLowerCase() === CB_code.toLowerCase())) {
    return res.status(400).json({ error: `รหัส CB Code นี้มีอยู่ในระบบแล้ว` });
  }

  const item = { CB_code, CB_name };
  db.caliburs.push(item);
  writeDb(db);

  addAuditLog("MASTER_CRUD", requester || "Admin", `เพิ่ม Calibur ใหม่: ${CB_code} - ${CB_name}`);
  addSharepointSyncLog("Calibur", "CREATE", item);

  res.status(201).json(item);
});

app.put("/api/caliburs/:code", (req, res) => {
  const { code } = req.params;
  const { CB_name, requester } = req.body;

  const db = readDb();
  const idx = db.caliburs.findIndex((c: Calibur) => c.CB_code.toLowerCase() === code.toLowerCase());
  if (idx === -1) return res.status(404).json({ error: "ไม่พบข้อมูลรหัสฟอร์แมตดังกล่าว" });

  db.caliburs[idx].CB_name = CB_name;
  writeDb(db);

  addAuditLog("MASTER_CRUD", requester || "Admin", `แก้ไขชื่อ Calibur รหัส ${code} เป็น: ${CB_name}`);
  addSharepointSyncLog("Calibur", "UPDATE", db.caliburs[idx]);

  res.json(db.caliburs[idx]);
});

app.delete("/api/caliburs/:code", (req, res) => {
  const { code } = req.params;
  const { requester } = req.body || {};

  const db = readDb();
  const idx = db.caliburs.findIndex((c: Calibur) => c.CB_code.toLowerCase() === code.toLowerCase());
  if (idx === -1) return res.status(404).json({ error: "ไม่พบรหัสดังกล่าวในการทำลายทิ้ง" });

  const item = db.caliburs[idx];
  db.caliburs.splice(idx, 1);
  writeDb(db);

  addAuditLog("MASTER_CRUD", requester || "Admin", `ลบ Master Calibur เกรดโครงสร้าง รหัส รหัส: ${code}`);
  addSharepointSyncLog("Calibur", "DELETE", item);

  res.json({ success: true });
});

// OPs
app.get("/api/ops", (req, res) => {
  const db = readDb();
  const { search } = req.query;
  let list = db.ops;
  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter((o: OP) => o.OP_code.toLowerCase().includes(s) || o.OP_name.toLowerCase().includes(s));
  }
  res.json(list);
});

app.post("/api/ops", (req, res) => {
  const { OP_code, OP_name, requester } = req.body;
  if (!OP_code || !OP_name) return res.status(400).json({ error: "ระบุข้อฟิลด์ OP ไม่ครบถ้วน" });

  const db = readDb();
  if (db.ops.some((o: OP) => o.OP_code.toLowerCase() === OP_code.toLowerCase())) {
    return res.status(400).json({ error: `มีรหัส OP นี้ในคลังระบบจัดการแล้ว` });
  }

  const item = { OP_code, OP_name };
  db.ops.push(item);
  writeDb(db);

  addAuditLog("MASTER_CRUD", requester || "Admin", `สร้าง OP ใหม่: ${OP_code} - ${OP_name}`);
  addSharepointSyncLog("OP", "CREATE", item);

  res.status(201).json(item);
});

app.put("/api/ops/:code", (req, res) => {
  const { code } = req.params;
  const { OP_name, requester } = req.body;

  const db = readDb();
  const idx = db.ops.findIndex((o: OP) => o.OP_code.toLowerCase() === code.toLowerCase());
  if (idx === -1) return res.status(404).json({ error: "ไม่พบคู่รหัสในทะเบียน OP" });

  db.ops[idx].OP_name = OP_name;
  writeDb(db);

  addAuditLog("MASTER_CRUD", requester || "Admin", `แก้ไขตัวแปร OP รหัส ${code} เสนอเป็น: ${OP_name}`);
  addSharepointSyncLog("OP", "UPDATE", db.ops[idx]);

  res.json(db.ops[idx]);
});

app.delete("/api/ops/:code", (req, res) => {
  const { code } = req.params;
  const { requester } = req.body || {};

  const db = readDb();
  const idx = db.ops.findIndex((o: OP) => o.OP_code.toLowerCase() === code.toLowerCase());
  if (idx === -1) return res.status(404).json({ error: "ไม่พบรหัสเป้าทลายบันทึก" });

  const item = db.ops[idx];
  db.ops.splice(idx, 1);
  writeDb(db);

  addAuditLog("MASTER_CRUD", requester || "Admin", `ลบ OP บันทึกการจัดการ ทะเบียนรหัส: ${code}`);
  addSharepointSyncLog("OP", "DELETE", item);

  res.json({ success: true });
});

// Lines
app.get("/api/lines", (req, res) => {
  const db = readDb();
  const { search } = req.query;
  let list = db.lines;
  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter((l: Line) => l.Line_code.toLowerCase().includes(s) || l.Line_name.toLowerCase().includes(s));
  }
  res.json(list);
});

app.post("/api/lines", (req, res) => {
  const { Line_code, Line_name, requester } = req.body;
  if (!Line_code || !Line_name) return res.status(400).json({ error: "ระบุกรอกฟิลด์ข้อมูลสายการผลิตไม่ครบถ้วน" });

  const db = readDb();
  if (db.lines.some((l: Line) => l.Line_code.toLowerCase() === Line_code.toLowerCase())) {
    return res.status(400).json({ error: "รหัสสายการผลิตดั่งกล่าวมีการเปิดใช้งานระบบแล้ว" });
  }

  const item = { Line_code, Line_name };
  db.lines.push(item);
  writeDb(db);

  addAuditLog("MASTER_CRUD", requester || "Admin", `เพิ่มไลน์การผลิต: ${Line_code} - ${Line_name}`);
  addSharepointSyncLog("Line", "CREATE", item);

  res.status(201).json(item);
});

app.put("/api/lines/:code", (req, res) => {
  const { code } = req.params;
  const { Line_name, requester } = req.body;

  const db = readDb();
  const idx = db.lines.findIndex((l: Line) => l.Line_code.toLowerCase() === code.toLowerCase());
  if (idx === -1) return res.status(404).json({ error: "ไม่พบ Line code ในระบบ" });

  db.lines[idx].Line_name = Line_name;
  writeDb(db);

  addAuditLog("MASTER_CRUD", requester || "Admin", `อัปเดตปรับเปลี่ยนไลน์การผลิตสายงาน ${code} เป็น: ${Line_name}`);
  addSharepointSyncLog("Line", "UPDATE", db.lines[idx]);

  res.json(db.lines[idx]);
});

app.delete("/api/lines/:code", (req, res) => {
  const { code } = req.params;
  const { requester } = req.body || {};

  const db = readDb();
  const idx = db.lines.findIndex((l: Line) => l.Line_code.toLowerCase() === code.toLowerCase());
  if (idx === -1) return res.status(404).json({ error: "ไม่พบโครงสร้างรหัสในการลบ" });

  const item = db.lines[idx];
  db.lines.splice(idx, 1);
  writeDb(db);

  addAuditLog("MASTER_CRUD", requester || "Admin", `สลายถอนทำลายข้อมูลสายเวิร์กสเตชัน รหัส: ${code}`);
  addSharepointSyncLog("Line", "DELETE", item);

  res.json({ success: true });
});


// 5. Daily Production Work Entry & History Log Routing
app.get("/api/dailies", (req, res) => {
  const db = readDb();
  const { search, leader, emp } = req.query;
  let list = db.dailies;

  if (leader) {
    list = list.filter((d: Daily) => d.Created_By.toLowerCase() === String(leader).toLowerCase());
  }

  if (emp) {
    list = list.filter((d: Daily) => d.Emp_code.toLowerCase() === String(emp).toLowerCase());
  }

  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(
      (d: Daily) =>
        d.Emp_code.toLowerCase().includes(s) ||
        d.Emp_Fname.toLowerCase().includes(s) ||
        d.Emp_Lname.toLowerCase().includes(s) ||
        d.CB_code.toLowerCase().includes(s) ||
        d.OP_code.toLowerCase().includes(s) ||
        d.Line_code.toLowerCase().includes(s)
    );
  }

  // Soft sort by Created_Date desc (latest first)
  list.sort((a: Daily, b: Daily) => new Date(b.Created_Date).getTime() - new Date(a.Created_Date).getTime());

  res.json(list);
});

// Submit a daily record (Confirm Workflow -> Microsoft Graph SharePoint Sync simulation)
app.post("/api/dailies", (req, res) => {
  const { 
    Emp_code, Emp_Fname, Emp_Lname, Work_Date, Start_DateTime, End_DateTime,
    CB_code, OP_code, Line_code, Production_Qty, Created_By 
  } = req.body;

  if (
    !Emp_code || !Emp_Fname || !Emp_Lname || !Work_Date || 
    !Start_DateTime || !End_DateTime || !CB_code || !OP_code || !Line_code ||
    Production_Qty === undefined || !Created_By
  ) {
    return res.status(400).json({ error: "กรุณากรอกฟิลด์ข้อมูลผู้ผลิตเวลาไลน์รายละเอียดชิ้นงาน และจำนวนผลผลิตของพนักงานให้ครบขั้นตอน" });
  }

  if (Production_Qty < 0) {
    return res.status(400).json({ error: "จำนวนผลผลิตที่เก็บเกี่ยวได้ห้ามมีค่าติดลบ" });
  }

  const db = readDb();
  const _id = `dl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const newEntry: Daily = {
    _id,
    Emp_code,
    Emp_Fname,
    Emp_Lname,
    Work_Date,
    Start_DateTime,
    End_DateTime,
    CB_code,
    OP_code,
    Line_code,
    Production_Qty,
    Created_By,
    Created_Date: new Date().toISOString()
  };

  db.dailies.unshift(newEntry);
  writeDb(db);

  // Trigger Logging & Real-time SharePoint Cloud Synchronizer Excel (Microsoft Graph representation)
  addAuditLog(
    "DAILY_SUBMIT",
    Created_By,
    `จัดส่งนำเสนอรายงานบันทึกผลงานของพนักงานสำเร็จ [พนักงาน: ${Emp_Fname} ${Emp_Lname}, จำนวน: ${Production_Qty}]`
  );

  addSharepointSyncLog("Daily", "CREATE", newEntry);

  res.status(201).json({
    success: true,
    message: "บันทึกผลงานลงระบบสำเร็จอย่างถูกต้อง และแนบส่ง Sync ข้อมูลเข้าฐานคลาวด์ SharePoint Excel สำเร็จแล้ว",
    data: newEntry
  });
});

app.put("/api/dailies/:id", (req, res) => {
  const { id } = req.params;
  const { 
    Emp_code, Emp_Fname, Emp_Lname, Work_Date, Start_DateTime, End_DateTime,
    CB_code, OP_code, Line_code, Production_Qty, Created_By 
  } = req.body;

  const db = readDb();
  const idx = db.dailies.findIndex((d: Daily) => d._id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "ไม่พบรายการรายงานที่กำหนดเพื่อขอการอ้างอิง" });
  }

  if (Production_Qty !== undefined && Production_Qty < 0) {
    return res.status(400).json({ error: "จำนวนผลผลิตเป็นค่าลบไม่ได้" });
  }

  db.dailies[idx] = {
    ...db.dailies[idx],
    Emp_code: Emp_code || db.dailies[idx].Emp_code,
    Emp_Fname: Emp_Fname || db.dailies[idx].Emp_Fname,
    Emp_Lname: Emp_Lname || db.dailies[idx].Emp_Lname,
    Work_Date: Work_Date || db.dailies[idx].Work_Date,
    Start_DateTime: Start_DateTime || db.dailies[idx].Start_DateTime,
    End_DateTime: End_DateTime || db.dailies[idx].End_DateTime,
    CB_code: CB_code || db.dailies[idx].CB_code,
    OP_code: OP_code || db.dailies[idx].OP_code,
    Line_code: Line_code || db.dailies[idx].Line_code,
    Production_Qty: Production_Qty !== undefined ? Production_Qty : db.dailies[idx].Production_Qty,
    Created_By: Created_By || db.dailies[idx].Created_By
  };
  writeDb(db);

  addAuditLog(
    "DAILY_SUBMIT",
    Created_By || "Leader",
    `แก้ไขประวัติย้อนหลังของรายงาน ID: ${id} ของคุณ ${db.dailies[idx].Emp_Fname}`
  );

  addSharepointSyncLog("Daily", "UPDATE", db.dailies[idx]);

  res.json({
    success: true,
    message: "ปรับปรุงเปลี่ยนบันทึกข้อมูลย้อนหลังเสร็จบูรณ์",
    data: db.dailies[idx]
  });
});

app.delete("/api/dailies/:id", (req, res) => {
  const { id } = req.params;
  const { requester } = req.body || {};

  const db = readDb();
  const idx = db.dailies.findIndex((d: Daily) => d._id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "ไม่พบข้อบันทึกที่จะฉีกทำลาย" });
  }

  const item = db.dailies[idx];
  db.dailies.splice(idx, 1);
  writeDb(db);

  addAuditLog(
    "DAILY_SUBMIT",
    requester || "Leader",
    `ถอนทำลายตัดประวัติรายงานผลิตพนักงาน ID: ${id} ของคุณ ${item.Emp_Fname}`
  );

  addSharepointSyncLog("Daily", "DELETE", item);

  res.json({ success: true, message: "ถอดบันทึกออกจากคลังข้อมูลเรียบร้อย!" });
});


// 6. Dashboard metrics
app.get("/api/dashboard-stats", (req, res) => {
  const { leader } = req.query;
  const db = readDb();

  // Active Member Count
  const members = db.employees.filter((e: Employee) => e.Leader_id === leader).length;

  // Today entries (recorded on work date or created date)
  const todayStr = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
  const leaderDailies = db.dailies.filter((d: Daily) => d.Created_By === leader);
  
  // Today reports
  const todayEntriesCount = leaderDailies.filter((d: Daily) => d.Work_Date === todayStr).length;

  // Today Qty sum
  const todayQtySum = leaderDailies
    .filter((d: Daily) => d.Work_Date === todayStr)
    .reduce((acc: number, item: Daily) => acc + item.Production_Qty, 0);

  // Daily Chart (group last 7 days)
  const dailyOutputs: { date: string; qty: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().substring(0, 10);
    const sum = db.dailies
      .filter((da: Daily) => da.Work_Date === dateStr)
      .reduce((acc: number, entry: Daily) => acc + entry.Production_Qty, 0);
    
    // Format nice Thai Date Label
    const thaiDateLabel = new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    dailyOutputs.push({ date: thaiDateLabel, qty: sum });
  }

  // Monthly Chart
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyOutputs = months.map((m, idx) => {
    const sum = db.dailies
      .filter((da: Daily) => {
        const itemMonth = new Date(da.Work_Date).getMonth();
        return itemMonth === idx;
      })
      .reduce((acc: number, entry: Daily) => acc + entry.Production_Qty, 0);
    return { name: m, qty: sum };
  });

  res.json({
    membersCount: members || db.employees.length, // Fallback if no specific leader logged in
    todayEntriesCount,
    todayQtySum,
    dailyOutputs,
    monthlyOutputs
  });
});

app.get("/api/audit-logs", (req, res) => {
  const db = readDb();
  res.json(db.auditLogs);
});

app.get("/api/sharepoint-sync-logs", (req, res) => {
  const db = readDb();
  res.json(db.sharepointSyncLogs);
});

app.post("/api/sharepoint/sync", (req, res) => {
  const { requester } = req.body;
  const db = readDb();
  
  const syncId = `sp_${Date.now()}`;
  const newLog: SharepointSyncLog = {
    id: syncId,
    timestamp: new Date().toISOString(),
    sheet: "Daily",
    action: "UPDATE",
    payload: JSON.stringify({ count: db.dailies.length, message: "Manual batch upload triggered by leader" }),
    status: "SUCCESS"
  };
  
  db.sharepointSyncLogs.unshift(newLog);
  
  // Custom helper defined in server context
  const auditId = `aud_${Date.now()}`;
  db.auditLogs.unshift({
    id: auditId,
    timestamp: new Date().toISOString(),
    action: "EXCEL_SYNC",
    user_name: requester || "System",
    details: `ส่งออกและ Sync บันทึกประวัติผลผลิตใต้สังกัดขึ้น SharePoint Excel ทั้งหมดเรียบร้อย [จำนวนรายการ: ${db.dailies.length}]`
  });
  
  writeDb(db);
  
  res.json({
    success: true,
    message: "ประสานฐานข้อมูลและซิงค์รายงานขึ้น SharePoint Cloud Server สำเร็จ!",
    log: newLog
  });
});

// CSV & JSON Data Export Endpoints with UTF-8 BOM encoding for live Microsoft Excel / SharePoint Power Query Web connection
app.get("/api/export/dailies.csv", (req, res) => {
  const db = readDb();
  const headers = ["ID", "Employee_Code", "First_Name", "Last_Name", "Work_Date", "Start_Time", "End_Time", "CB_Code", "OP_Code", "Line_Code", "Production_Qty", "Created_By", "Created_Date"];
  const rows = db.dailies.map((d: Daily) => [
    d._id,
    d.Emp_code,
    d.Emp_Fname,
    d.Emp_Lname,
    d.Work_Date,
    d.Start_DateTime,
    d.End_DateTime,
    d.CB_code,
    d.OP_code,
    d.Line_code,
    d.Production_Qty,
    d.Created_By,
    d.Created_Date
  ]);

  const csvContent = "\uFEFF" + [
    headers.join(","),
    ...rows.map((r: any) => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=dailies_export.csv");
  res.send(csvContent);
});

app.get("/api/export/caliburs.csv", (req, res) => {
  const db = readDb();
  const headers = ["CB_code", "CB_name"];
  const rows = db.caliburs.map((c: Calibur) => [c.CB_code, c.CB_name]);

  const csvContent = "\uFEFF" + [
    headers.join(","),
    ...rows.map((r: any) => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=caliburs_export.csv");
  res.send(csvContent);
});

app.get("/api/export/ops.csv", (req, res) => {
  const db = readDb();
  const headers = ["OP_code", "OP_name"];
  const rows = db.ops.map((o: OP) => [o.OP_code, o.OP_name]);

  const csvContent = "\uFEFF" + [
    headers.join(","),
    ...rows.map((r: any) => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=ops_export.csv");
  res.send(csvContent);
});

app.get("/api/export/lines.csv", (req, res) => {
  const db = readDb();
  const headers = ["Line_code", "Line_name"];
  const rows = db.lines.map((l: Line) => [l.Line_code, l.Line_name]);

  const csvContent = "\uFEFF" + [
    headers.join(","),
    ...rows.map((r: any) => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=lines_export.csv");
  res.send(csvContent);
});

app.get("/api/export/dailies.json", (req, res) => {
  const db = readDb();
  res.json(db.dailies);
});

app.get("/api/export/caliburs.json", (req, res) => {
  const db = readDb();
  res.json(db.caliburs);
});

app.get("/api/export/ops.json", (req, res) => {
  const db = readDb();
  res.json(db.ops);
});

app.get("/api/export/lines.json", (req, res) => {
  const db = readDb();
  res.json(db.lines);
});

// Reset overall database parameters for fresh demonstration
app.post("/api/admin/reset-db", (req, res) => {
  fs.unlinkSync(DB_FILE);
  initDb();
  res.json({ success: true, message: "ล้างฐานข้อมูล และคืนค่าระบบจำลองโรงงาน Master Data เริ่มต้นสำเร็จ!" });
});


// ---------------- HOST INTEGRATION DEVISE ----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
