import { useState } from "react";
import { useCurrency, CURRENCIES } from "@/lib/currency";
import { Check, Settings2 } from "lucide-react";

export default function Settings() {
  const { currency, setCurrency } = useCurrency();
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState(currency);

  function handleSave() {
    setCurrency(selected);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="glass-panel p-6 rounded-2xl flex items-center gap-4">
        <Settings2 className="w-7 h-7 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800 drop-shadow-sm">Settings</h2>
          <p className="text-slate-600 font-medium">Customize your Aero Finance experience.</p>
        </div>
      </header>

      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-slate-800">Display Currency</h3>
          <p className="text-sm text-slate-500">
            Choose the currency symbol used across the app. This does not convert values — it only changes the display symbol.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {CURRENCIES.map((cur) => {
            const isSelected = selected === cur.code;
            return (
              <button
                key={cur.code}
                onClick={() => setSelected(cur.code)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                  ${isSelected
                    ? "bg-white/60 border-blue-400 shadow-md ring-1 ring-blue-300"
                    : "bg-white/20 border-white/40 hover:bg-white/40 hover:border-white/70"
                  }
                `}
              >
                <div
                  className={`
                    w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0
                    ${isSelected
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-white/50 text-slate-700 border border-white/60"
                    }
                  `}
                >
                  {cur.symbol.length <= 2 ? cur.symbol : cur.code.slice(0, 2)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-800 text-sm">{cur.code}</span>
                  <span className="text-xs text-slate-500 truncate">{cur.name}</span>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-blue-600 ml-auto flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-white/30">
          <button
            onClick={handleSave}
            className="glass-button px-6 py-2.5 rounded-xl font-bold text-sm"
          >
            Save Changes
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-green-700 font-medium text-sm">
              <Check className="w-4 h-4" />
              Saved!
            </span>
          )}
          {selected !== currency && !saved && (
            <span className="text-slate-500 text-sm">Unsaved changes</span>
          )}
        </div>
      </div>
    </div>
  );
}
