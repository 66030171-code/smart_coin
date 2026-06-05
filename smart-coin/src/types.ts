export interface Employee {
  Emp_code: string; // PK
  Emp_Fname: string;
  Emp_Lname: string;
  Leader_id: string;
}

export interface User {
  User_id: string; // PK
  Username: string;
  PasswordHash: string;
  PinHash: string | null;
  Role: string;
  IsActive: boolean;
}

export interface Calibur {
  CB_code: string; // PK
  CB_name: string;
}

export interface OP {
  OP_code: string; // PK
  OP_name: string;
}

export interface Line {
  Line_code: string; // PK
  Line_name: string;
}

export interface Daily {
  _id: string; // PK
  Emp_code: string;
  Emp_Fname: string;
  Emp_Lname: string;
  Work_Date: string; // YYYY-MM-DD
  Start_DateTime: string; // ISO date-time or HH:MM
  End_DateTime: string; // ISO date-time or HH:MM
  CB_code: string;
  OP_code: string;
  Line_code: string;
  Production_Qty: number;
  Created_By: string; // Username
  Created_Date: string; // ISO timestamp
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string; // "LOGIN", "PIN_VERIFY", "PIN_LOCK", "EMP_CRUD", "MASTER_CRUD", "DAILY_SUBMIT", "EXCEL_SYNC"
  user_name: string;
  details: string;
}

export interface SharepointSyncLog {
  id: string;
  timestamp: string;
  sheet: "Calibur" | "OP" | "Line" | "Daily";
  action: "CREATE" | "UPDATE" | "DELETE";
  payload: string;
  status: "SUCCESS" | "FAILED";
}
