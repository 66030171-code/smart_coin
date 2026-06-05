import React, { useRef, useEffect } from "react";
import { Clock } from "lucide-react";

interface CustomTimePickerProps {
  value: string; // "HH:MM"
  onChange: (newValue: string) => void;
  label: string;
}

export default function CustomTimePicker({ value, onChange, label }: CustomTimePickerProps) {
  // Parse hours & minutes
  const [hoursStr, minutesStr] = value.split(":");
  const hours = isNaN(parseInt(hoursStr)) ? 8 : parseInt(hoursStr);
  const minutes = isNaN(parseInt(minutesStr)) ? 0 : parseInt(minutesStr);

  const hourContainerRef = useRef<HTMLDivElement>(null);
  const minuteContainerRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({ hours, minutes });
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    stateRef.current = { hours, minutes };
    onChangeRef.current = onChange;
  }, [hours, minutes, onChange]);

  useEffect(() => {
    const hrEl = hourContainerRef.current;
    const minEl = minuteContainerRef.current;

    const onHrWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const currHours = stateRef.current.hours;
      const currMinutes = stateRef.current.minutes;
      let newHour = currHours;
      if (e.deltaY < 0) {
        newHour = (currHours + 1) % 24; // Scroll Up -> Increase
      } else if (e.deltaY > 0) {
        newHour = (currHours - 1 + 24) % 24; // Scroll Down -> Decrease
      }
      const hh = String(newHour).padStart(2, "0");
      const mm = String(currMinutes).padStart(2, "0");
      onChangeRef.current(`${hh}:${mm}`);
    };

    const onMinWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const currHours = stateRef.current.hours;
      const currMinutes = stateRef.current.minutes;
      let newMinute = currMinutes;
      if (e.deltaY < 0) {
        // Scroll Up -> Increase
        newMinute = (currMinutes + 1) % 60;
      } else if (e.deltaY > 0) {
        // Scroll Down -> Decrease
        newMinute = (currMinutes - 1 + 60) % 60;
      }
      const hh = String(currHours).padStart(2, "0");
      const mm = String(newMinute).padStart(2, "0");
      onChangeRef.current(`${hh}:${mm}`);
    };

    if (hrEl) hrEl.addEventListener("wheel", onHrWheel, { passive: false });
    if (minEl) minEl.addEventListener("wheel", onMinWheel, { passive: false });

    return () => {
      if (hrEl) hrEl.removeEventListener("wheel", onHrWheel);
      if (minEl) minEl.removeEventListener("wheel", onMinWheel);
    };
  }, []);

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    val = Math.min(23, Math.max(0, val));
    const hh = String(val).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    onChange(`${hh}:${mm}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    val = Math.min(59, Math.max(0, val));
    const hh = String(hours).padStart(2, "0");
    const mm = String(val).padStart(2, "0");
    onChange(`${hh}:${mm}`);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-700 tracking-wide">
        {label}
      </label>
      
      <div className="flex items-center gap-1 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-2 py-2 shadow-sm transition min-w-0">
        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        
        {/* Custom Hour Scroll Zone */}
        <div 
          ref={hourContainerRef}
          className="relative group flex flex-col items-center justify-center cursor-ns-resize px-2 rounded-lg hover:bg-slate-50 transition select-none"
          title="วางเมาส์เเล้วหมุนลูกกลิ้งเพื่อปรับชั่วโมง (Scroll to Change Hours)"
        >
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider scale-90 mb-0.5 opacity-0 group-hover:opacity-100 transition duration-150">
            ▲
          </span>
          <input
            type="text"
            maxLength={2}
            value={String(hours).padStart(2, "0")}
            onChange={handleHourChange}
            className="w-8 font-mono font-bold text-sm text-slate-800 text-center outline-none bg-transparent"
          />
          <span className="text-[10px] text-slate-400 font-bold uppercase scale-90 mt-0.5 opacity-0 group-hover:opacity-100 transition duration-150">
            ▼
          </span>
        </div>

        <span className="text-slate-400 font-bold animate-pulse">:</span>

        {/* Custom Minute Scroll Zone */}
        <div 
          ref={minuteContainerRef}
          className="relative group flex flex-col items-center justify-center cursor-ns-resize px-2 rounded-lg hover:bg-slate-50 transition select-none"
          title="วางเมาส์เเล้วหมุนลูกกลิ้งเพื่อปรับนาที (Scroll to Change Minutes)"
        >
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider scale-90 mb-0.5 opacity-0 group-hover:opacity-100 transition duration-150">
            ▲
          </span>
          <input
            type="text"
            maxLength={2}
            value={String(minutes).padStart(2, "0")}
            onChange={handleMinuteChange}
            className="w-8 font-mono font-bold text-sm text-slate-800 text-center outline-none bg-transparent"
          />
          <span className="text-[10px] text-slate-400 font-bold uppercase scale-90 mt-0.5 opacity-0 group-hover:opacity-100 transition duration-150">
            ▼
          </span>
        </div>

        <span className="ml-auto text-[9px] uppercase font-bold text-slate-400 tracking-wider bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 hidden min-[420px]:inline-block">
          Scroll
        </span>
      </div>
    </div>
  );
}
