import React, { useRef, useEffect } from "react";
import { useLanguage } from "./LanguageContext";

interface CustomQtyPickerProps {
  value: number; // Combined total, e.g. 1528
  onChange: (newValue: number) => void;
}

export default function CustomQtyPicker({ value, onChange }: CustomQtyPickerProps) {
  const { language, t } = useLanguage();

  // Decompose value into 4 digits: [Thousand, Hundred, Ten, Unit]
  // Clamped between 0 and 9999
  const clampedVal = Math.max(0, Math.min(9999, value));
  
  const thousand = Math.floor(clampedVal / 1000) % 10;
  const hundred = Math.floor(clampedVal / 100) % 10;
  const ten = Math.floor(clampedVal / 10) % 10;
  const unit = clampedVal % 10;

  const thousandRef = useRef<HTMLDivElement>(null);
  const hundredRef = useRef<HTMLDivElement>(null);
  const tenRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({ thousand, hundred, ten, unit });
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    stateRef.current = { thousand, hundred, ten, unit };
    onChangeRef.current = onChange;
  }, [thousand, hundred, ten, unit, onChange]);

  const updateDigits = (th: number, h: number, tDigit: number, u: number) => {
    const total = th * 1000 + h * 100 + tDigit * 10 + u;
    onChangeRef.current(total);
  };

  useEffect(() => {
    const thEl = thousandRef.current;
    const hEl = hundredRef.current;
    const tEl = tenRef.current;
    const uEl = unitRef.current;

    const handleWheel = (e: WheelEvent, position: "thousand" | "hundred" | "ten" | "unit") => {
      e.preventDefault();
      e.stopPropagation();
      
      // Determine delta
      const step = e.deltaY < 0 ? 1 : -1; // up scroll increases, down decreases
      
      let { thousand: th, hundred: h, ten: tDigit, unit: u } = stateRef.current;

      if (position === "thousand") {
        th = (th + step + 10) % 10;
      } else if (position === "hundred") {
        h = (h + step + 10) % 10;
      } else if (position === "ten") {
        tDigit = (tDigit + step + 10) % 10;
      } else if (position === "unit") {
        u = (u + step + 10) % 10;
      }

      updateDigits(th, h, tDigit, u);
    };

    const onThWheel = (e: WheelEvent) => handleWheel(e, "thousand");
    const onHWheel = (e: WheelEvent) => handleWheel(e, "hundred");
    const onTWheel = (e: WheelEvent) => handleWheel(e, "ten");
    const onUWheel = (e: WheelEvent) => handleWheel(e, "unit");

    if (thEl) thEl.addEventListener("wheel", onThWheel, { passive: false });
    if (hEl) hEl.addEventListener("wheel", onHWheel, { passive: false });
    if (tEl) tEl.addEventListener("wheel", onTWheel, { passive: false });
    if (uEl) uEl.addEventListener("wheel", onUWheel, { passive: false });

    return () => {
      if (thEl) thEl.removeEventListener("wheel", onThWheel);
      if (hEl) hEl.removeEventListener("wheel", onHWheel);
      if (tEl) tEl.removeEventListener("wheel", onTWheel);
      if (uEl) uEl.removeEventListener("wheel", onUWheel);
    };
  }, []);

  return (
    <div className="space-y-3 bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
      <div>
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-slate-900 rounded-full animate-pulse"></span>
          {t("productionResultQty")}
        </h4>
        <p className="text-[11px] text-slate-500 leading-normal mt-1">
          {t("quantityHelper")}
        </p>
      </div>

      <div className="flex flex-col gap-4 py-2 items-center">
        {/* Real-time Dynamic Results Card (stacked on top, 100% symmetrical) */}
        <div className="w-full bg-white border-2 border-slate-200/80 px-5 py-3 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col text-left">
            <span className="text-[9px] tracking-wider font-extrabold uppercase text-slate-400">
              {t("realTimeSum")}
            </span>
            <span className="text-xs text-slate-400 font-bold mt-0.5">
              {t("unitsSuffix")}
            </span>
          </div>
          <span className="text-3xl font-mono font-black text-slate-900 pr-1">
            {clampedVal.toLocaleString()}
          </span>
        </div>

        {/* Wheels Row */}
        <div className="flex items-center justify-center gap-1.5 bg-slate-100/50 p-3 rounded-2xl border border-slate-150 border-slate-200/60 w-full">
          {/* Thousand */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-[8px] uppercase tracking-wide text-slate-400 font-bold mb-1 truncate">
              {language === "TH" ? "พัน" : "Thou"}
            </span>
            <div 
              ref={thousandRef}
              className="group select-none cursor-ns-resize w-11 h-16 bg-slate-900 text-white border border-slate-950 rounded-xl flex flex-col justify-between items-center py-1.5 transition-all hover:bg-slate-800 shadow-md active:scale-95"
            >
              <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition leading-none">▲</span>
              <span className="text-2xl font-mono font-black tracking-tight leading-none">{thousand}</span>
              <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition leading-none">▼</span>
            </div>
          </div>

          <div className="text-slate-300 font-bold text-sm self-end mb-5 font-mono select-none">:</div>

          {/* Hundred */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-[8px] uppercase tracking-wide text-slate-400 font-bold mb-1 truncate">
              {language === "TH" ? "ร้อย" : "Hund"}
            </span>
            <div 
              ref={hundredRef}
              className="group select-none cursor-ns-resize w-11 h-16 bg-slate-900 text-white border border-slate-950 rounded-xl flex flex-col justify-between items-center py-1.5 transition-all hover:bg-slate-800 shadow-md active:scale-95"
            >
              <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition leading-none">▲</span>
              <span className="text-2xl font-mono font-black tracking-tight leading-none">{hundred}</span>
              <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition leading-none">▼</span>
            </div>
          </div>

          <div className="text-slate-300 font-bold text-sm self-end mb-5 font-mono select-none">:</div>

          {/* Ten */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-[8px] uppercase tracking-wide text-slate-400 font-bold mb-1 truncate">
              {language === "TH" ? "สิบ" : "Tens"}
            </span>
            <div 
              ref={tenRef}
              className="group select-none cursor-ns-resize w-11 h-16 bg-slate-900 text-white border border-slate-950 rounded-xl flex flex-col justify-between items-center py-1.5 transition-all hover:bg-slate-800 shadow-md active:scale-95"
            >
              <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition leading-none">▲</span>
              <span className="text-2xl font-mono font-black tracking-tight leading-none">{ten}</span>
              <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition leading-none">▼</span>
            </div>
          </div>

          <div className="text-slate-300 font-bold text-sm self-end mb-5 font-mono select-none">:</div>

          {/* Unit */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-[8px] uppercase tracking-wide text-slate-400 font-bold mb-1 truncate">
              {language === "TH" ? "หน่วย" : "Unit"}
            </span>
            <div 
              ref={unitRef}
              className="group select-none cursor-ns-resize w-11 h-16 bg-slate-900 text-white border border-slate-950 rounded-xl flex flex-col justify-between items-center py-1.5 transition-all hover:bg-slate-800 shadow-md active:scale-95"
            >
              <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition leading-none">▲</span>
              <span className="text-2xl font-mono font-black tracking-tight leading-none">{unit}</span>
              <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition leading-none">▼</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
