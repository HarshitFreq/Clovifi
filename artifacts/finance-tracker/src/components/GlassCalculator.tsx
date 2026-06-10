import React, { useState } from "react";
import { Delete, HelpCircle, Minus, Plus, X } from "lucide-react";
import { motion } from "framer-motion";

export default function GlassCalculator() {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [isMinimized, setIsMinimized] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 120 });

  // Handle custom event to open calculator on nav click
  React.useEffect(() => {
    const handleOpen = () => {
      setIsMinimized(false);
    };
    window.addEventListener("open-calculator", handleOpen);
    return () => window.removeEventListener("open-calculator", handleOpen);
  }, []);

  const handleNum = (num: string) => {
    setDisplay((prev) => (prev === "0" ? num : prev + num));
  };

  const handleOp = (op: string) => {
    setEquation((prev) => prev + display + " " + op + " ");
    setDisplay("0");
  };

  const calculate = () => {
    try {
      const fullEq = equation + display;
      // Sanitize equation strings to prevent unsafe eval
      const cleanEq = fullEq.replace(/[^0-9+\-*/. ]/g, "");
      // Evaluate equation
      const result = new Function(`return (${cleanEq})`)();
      setDisplay(String(Number(result.toFixed(4))));
      setEquation("");
    } catch {
      setDisplay("Error");
      setEquation("");
    }
  };

  const clear = () => {
    setDisplay("0");
    setEquation("");
  };

  const handleBackspace = () => {
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
  };

  if (isMinimized) {
    return null;
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{ x: position.x, y: position.y }}
      onDragEnd={(_, info) => setPosition({ x: info.point.x, y: info.point.y })}
      className="fixed z-50 w-64 rounded-2xl border border-[rgba(100,200,30,0.3)] bg-[rgba(12,28,8,0.72)] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.75)] overflow-hidden font-sans"
    >
      {/* Title / Drag Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[rgba(10,35,5,0.65)] border-b border-[rgba(70,140,20,0.25)] cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#66c028] animate-pulse" />
          <span className="text-[10px] font-bold text-white/80 tracking-wider uppercase">Aero Calculator</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-0.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Screen Display */}
      <div className="p-3 bg-[rgba(4,12,2,0.65)] flex flex-col items-end justify-center min-h-[56px] border-b border-[rgba(70,140,20,0.15)]">
        <div className="text-[10px] text-white/40 truncate w-full text-right font-mono tracking-wide">{equation || "\u00A0"}</div>
        <div className="text-xl font-bold font-mono text-[#a3e635] tracking-tight truncate w-full text-right select-all">
          {display}
        </div>
      </div>

      {/* Grid Buttons */}
      <div className="p-2.5 grid grid-cols-4 gap-1.5">
        {/* Row 1 */}
        <button onClick={clear} className="calc-btn calc-op">C</button>
        <button onClick={handleBackspace} className="calc-btn calc-op flex items-center justify-center">
          <Delete className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => handleOp("/")} className="calc-btn calc-op">÷</button>
        <button onClick={() => handleOp("*")} className="calc-btn calc-op">×</button>

        {/* Row 2 */}
        <button onClick={() => handleNum("7")} className="calc-btn">7</button>
        <button onClick={() => handleNum("8")} className="calc-btn">8</button>
        <button onClick={() => handleNum("9")} className="calc-btn">9</button>
        <button onClick={() => handleOp("-")} className="calc-btn calc-op">-</button>

        {/* Row 3 */}
        <button onClick={() => handleNum("4")} className="calc-btn">4</button>
        <button onClick={() => handleNum("5")} className="calc-btn">5</button>
        <button onClick={() => handleNum("6")} className="calc-btn">6</button>
        <button onClick={() => handleOp("+")} className="calc-btn calc-op">+</button>

        {/* Row 4 */}
        <button onClick={() => handleNum("1")} className="calc-btn">1</button>
        <button onClick={() => handleNum("2")} className="calc-btn">2</button>
        <button onClick={() => handleNum("3")} className="calc-btn">3</button>
        <button onClick={calculate} className="calc-btn calc-eq row-span-2">=</button>

        {/* Row 5 */}
        <button onClick={() => handleNum("0")} className="calc-btn col-span-2">0</button>
        <button onClick={() => handleNum(".")} className="calc-btn">.</button>
      </div>

      <style>{`
        .calc-btn {
          padding: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          font-family: monospace;
          color: rgba(220,245,190,0.9);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .calc-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.25);
          color: #fff;
        }
        .calc-btn:active {
          transform: scale(0.96);
        }
        .calc-op {
          background: rgba(140,220,60,0.1);
          border-color: rgba(140,220,60,0.25);
          color: #a3e635;
        }
        .calc-op:hover {
          background: rgba(140,220,60,0.18);
          border-color: rgba(140,220,60,0.45);
        }
        .calc-eq {
          background: linear-gradient(to bottom, #8be034 0%, #49a018 100%);
          border-color: rgba(255,255,255,0.2);
          color: #fff;
          height: 100%;
          text-shadow: 0 1px 2px rgba(0,0,0,0.4);
        }
        .calc-eq:hover {
          background: linear-gradient(to bottom, #9ded40 0%, #5db820 100%);
        }
      `}</style>
    </motion.div>
  );
}
