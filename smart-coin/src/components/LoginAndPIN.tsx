import React, { useState, useEffect, useRef } from "react";
import { 
  LockKeyhole, UserSquare, ShieldAlert, KeyRound, ArrowRight, Eye, 
  EyeOff, CheckCircle2, ChevronRight, AlertCircle, HelpCircle, AlertTriangle 
} from "lucide-react";
import { useLanguage } from "./LanguageContext";

interface LoginAndPINProps {
  onAuthSuccess: (sessionUser: any) => void;
  onRefreshAll: () => void;
}

export default function LoginAndPIN({ onAuthSuccess, onRefreshAll }: LoginAndPINProps) {
  const { language, t } = useLanguage();

  // Authentication states
  // login -> verify_pin -> app
  // or user may be directed to setup_pin if isPinCreated is FALSE
  const [stage, setStage] = useState<"login" | "verify_pin" | "setup_pin">("login");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Input Fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPinVal, setConfirmPinVal] = useState("");

  // Visibilities
  const [showPassword, setShowPassword] = useState(false);

  // Locked out timer handling
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);

  // Authenticated partial session user between stage 1 and stage 2
  const [sessionUser, setSessionUser] = useState<any>(null);

  useEffect(() => {
    // If cooldown is active, decrement every second
    if (cooldownRemaining && cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining(cooldownRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (cooldownRemaining === 0) {
      setCooldownRemaining(null);
      setErrorMsg("");
    }
  }, [cooldownRemaining]);

  // Phase 1 : Login with Username/Password (Module 1)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!username.trim() || !password.trim()) {
      setErrorMsg("กรุณากรอก Username เเละ Password สำหรับการตรวจสอบ");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || "Username หรือ Password ไม่ถูกต้อง");
      } else {
        // Phase 1 succeeded! User MUST now verify PIN to enter (ไม่สามารถเข้าระบบได้ทันที)
        setSessionUser(data.user);
        
        if (!data.user.isPinCreated) {
          // Unassigned PIN user (e.g. Admin first timer), take to setup pin
          setStage("setup_pin");
        } else {
          // Ready for PIN challenge (Module 2)
          setStage("verify_pin");
        }
      }
    } catch {
      setLoading(false);
      setErrorMsg("ไม่สามารถคุยกับเซิร์ฟเวอร์หลักได้");
    }
  };

  // Phase 2 : PIN 6-digit confirmation (Module 2)
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!pin || pin.length !== 6) {
      setErrorMsg("กรุณาระบุรหัส PIN ตัวเลข 6 หลักให้เรียบร้อย");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: sessionUser.Username, pin })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || "รหัส PIN ไม่ถูกต้อง");
      } else {
        // Complete fully authenticated logged in state!
        onAuthSuccess(data.user);
        onRefreshAll();
      }
    } catch {
      setLoading(false);
      setErrorMsg("ทางเข้าเกิดปัญหาสัญญาณอินเทอร์เน็ต");
    }
  };

  // First-time PIN initialization setup
  const handleSetupPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!newPin || !confirmPinVal) {
      setErrorMsg("กรุณากรอกรหัส PIN ทั้งคู่เพื่อตรวจสอง");
      return;
    }
    if (newPin !== confirmPinVal) {
      setErrorMsg("รหัส PIN ทั้งคู่ไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: sessionUser.Username,
          newPin,
          confirmPin: confirmPinVal
        })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || "เกิดข้อขัดข้องในการกำหนดรหัส PIN ใหม่");
      } else {
        // update session flag
        setSessionUser({ ...sessionUser, isPinCreated: true });
        // Proceed to verify it to lock login state
        setStage("verify_pin");
        setNewPin("");
        setConfirmPinVal("");
        setErrorMsg("");
      }
    } catch {
      setLoading(false);
      setErrorMsg("เกิดความล่าช้าในการบันทึกค่า");
    }
  };

  const selectDemoAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg("");
  };

  return (
    <div id="auth-panel-stage" className="max-w-md w-full mx-auto bg-white border border-slate-205 border-slate-200 shadow-xl rounded-2xl overflow-hidden animate-fadeIn">
      
      {/* Dynamic graphic sidebar title */}
      <div className="bg-slate-900 border-b border-slate-950 p-6 flex flex-col justify-start items-center text-center space-y-2">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
          <LockKeyhole className="w-6 h-6 text-slate-900" />
        </div>
        <div className="space-y-1">
          <h2 className="text-white text-md font-black tracking-tight font-display">
            {stage === "login" ? t("appTitle") : stage === "verify_pin" ? t("pinVerifyTitle") : t("setupPinTitle")}
          </h2>
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest leading-normal">
            Manufacturing Execution Gateway
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Error warning label */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold">{errorMsg}</span>
              {cooldownRemaining !== null && (
                <div className="mt-1.5 font-mono font-black text-xs text-rose-900">
                  COOLDOWN TIMER: {Math.floor(cooldownRemaining / 60)}:
                  {String(cooldownRemaining % 60).padStart(2, "0")} Sec.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 1 login username password menu */}
        {stage === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {t("username")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={cooldownRemaining !== null}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. leader_somchai"
                  className="w-full bg-slate-50 text-slate-900 text-xs px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 focus:bg-white transition font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {t("password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={cooldownRemaining !== null}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full bg-slate-50 text-slate-900 text-xs px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 focus:bg-white transition font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-450 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Form actions */}
            <button
              type="submit"
              disabled={loading || cooldownRemaining !== null}
              className="w-full py-3.5 bg-slate-905 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1"
            >
              {loading ? "กำลังลงทะเบียน..." : t("loginBtn")}
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            {/* Premium quick lookup seed user guide */}
            <div className="pt-2 border-t border-slate-100">
              <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 text-center">
                Quick Demo Accounts Sandbox Select
              </h5>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => selectDemoAccount("leader_somchai", "password123")}
                  className="bg-slate-100 border border-slate-200 hover:bg-slate-150 p-2 rounded-lg text-slate-700 cursor-pointer text-left block"
                >
                  Somchai (Leader)<br/>
                  <span className="text-[9px] text-slate-400">PIN: 159357</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectDemoAccount("leader_somying", "password123")}
                  className="bg-slate-100 border border-slate-200 hover:bg-slate-150 p-2 rounded-lg text-slate-700 cursor-pointer text-left block"
                >
                  Somying (Leader)<br/>
                  <span className="text-[9px] text-slate-400">PIN: 258258</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => selectDemoAccount("admin", "admin123")}
                className="w-full text-center mt-1.5 p-1 bg-slate-50 border border-slate-150 rounded-lg hover:bg-slate-100 text-[9px] font-bold text-slate-500 block"
              >
                Admin User Setup Wait PIN: user: admin / pass: admin123 (First-time PIN setup required)
              </button>
            </div>

          </form>
        )}

        {/* Phase 2: Enter PIN 6-digit confirmation challenge */}
        {stage === "verify_pin" && sessionUser && (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="text-center space-y-1">
              <div className="text-xs text-slate-500 font-medium">
                {t("pinExplain")}
              </div>
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-900 border border-slate-200 text-[10px] font-bold rounded-lg font-mono">
                👤 {sessionUser.Username} ({sessionUser.Role})
              </span>
            </div>

            {/* PIN Code */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">
                  ENTER SECURE 6-DIGIT PIN
                </label>
              </div>
              <input
                type="password"
                maxLength={6}
                required
                disabled={cooldownRemaining !== null}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                className="w-full tracking-[1.5em] text-center font-mono font-black border border-slate-250 bg-slate-50 text-slate-900 text-lg px-4 py-3 rounded-xl focus:outline-none focus:border-slate-800 transition shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading || cooldownRemaining !== null}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-4 h-4 text-white" />
              {t("confirmPin")}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setStage("login"); setPin(""); setSessionUser(null); setErrorMsg(""); }}
                className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-800 transition cursor-pointer"
              >
                &larr; Switch username account login
              </button>
            </div>
          </form>
        )}

        {/* Setup first PIN form stage */}
        {stage === "setup_pin" && sessionUser && (
          <form onSubmit={handleSetupPinSubmit} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-slate-650 text-slate-600">
                <span className="font-bold text-slate-900">{t("notSetPin")}</span><br/>
                กรุณาระบุกำหนดรหัส PIN ลับ 6 หลักใหม่เพื่อเปิดใช้งานความปลอดภัยระดับสูง
              </div>
            </div>

            {/* Specify Pin */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {t("enterNew6Pin")}
              </label>
              <input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                className="w-full tracking-[1em] text-center font-mono font-black border border-slate-200 bg-slate-50 text-slate-900 px-4 py-2.5 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white transition"
              />
            </div>

            {/* Confirm Pin */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {t("confirmNewPin")}
              </label>
              <input
                type="password"
                maxLength={6}
                value={confirmPinVal}
                onChange={(e) => setConfirmPinVal(e.target.value.replace(/\D/g, ""))}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                className="w-full tracking-[1em] text-center font-mono font-black border border-slate-200 bg-slate-50 text-slate-900 px-4 py-2.5 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white transition"
              />
            </div>

            <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
              {t("pinRuleNote")}
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-98"
            >
              {t("setupPinBtn")}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setStage("login"); setSessionUser(null); setErrorMsg(""); }}
                className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-800 transition cursor-pointer"
              >
                &larr; กลับหน้าลงชื่อรหัสผ่าน
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
