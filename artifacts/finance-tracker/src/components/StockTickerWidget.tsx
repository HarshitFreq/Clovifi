import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { useSoundEffects } from "@/lib/sound";

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percent: number;
  isUp: boolean;
  updatedAt?: string;
}

export default function StockTickerWidget() {
  const [stocks, setStocks] = useState<StockQuote[]>([
    { symbol: "AAPL", name: "Apple", price: 355.63, change: 0.27, percent: 0.08, isUp: true },
    { symbol: "NVDA", name: "Nvidia", price: 165.62, change: -8.10, percent: -4.66, isUp: false },
    { symbol: "MSFT", name: "Microsoft", price: 528.24, change: 7.12, percent: 1.37, isUp: true },
    { symbol: "GOOGL", name: "Alphabet", price: 301.43, change: 7.98, percent: 2.72, isUp: true },
    { symbol: "AMZN", name: "Amazon", price: 268.93, change: 2.76, percent: 1.04, isUp: true },
  ]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("Just now");
  const [flashingSymbol, setFlashingSymbol] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return typeof window !== "undefined" && window.innerWidth < 768;
  });
  const { playClick } = useSoundEffects();
  const mountedRef = useRef(true);

  const fetchStocks = async (isManual = false) => {
    if (isManual) playClick();
    setLoading(true);
    try {
      const res = await fetch("/api/market/stocks");
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const json = await res.json().catch(() => null);
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          const normalized: StockQuote[] = json.data.map((item: any) => ({
            symbol: String(item.symbol || ""),
            name: String(item.name || item.symbol || ""),
            price: Number(item.price) || 0,
            change: Number(item.change) || 0,
            percent: Number(item.percent ?? item.changePercent) || 0,
            isUp: item.isUp !== undefined ? Boolean(item.isUp) : (Number(item.change) >= 0),
          }));
          setStocks(normalized);
          const d = new Date();
          setLastUpdated(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }
      }
    } catch (err) {
      console.warn("Stock feed fallback:", err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchStocks();
    const interval = setInterval(() => {
      fetchStocks();
    }, 25000); // 25s auto-refresh
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="glass-panel"
      style={{
        borderRadius: "8px",
        overflow: "hidden",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Titlebar */}
      <div
        className="panel-titlebar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Glowing pulse indicator */}
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#34d399",
              boxShadow: "0 0 8px #34d399",
              display: "inline-block",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
          <Activity size={13} style={{ color: "var(--accent-gradient-1)" }} />
          <span style={{ fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.02em" }}>
            Live Stocks
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => fetchStocks(true)}
            disabled={loading}
            title="Refresh Live Stock Quotes"
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <RefreshCw
              size={11}
              className={loading ? "animate-spin" : ""}
              style={{ color: "rgba(255,255,255,0.7)" }}
            />
          </button>
          <span
            style={{
              fontSize: "0.58rem",
              fontWeight: 700,
              padding: "1px 5px",
              borderRadius: "3px",
              background: "rgba(74, 222, 128, 0.15)",
              color: "#4ade80",
              border: "1px solid rgba(74, 222, 128, 0.3)",
              fontFamily: "monospace",
              textTransform: "uppercase",
            }}
          >
            Live
          </span>
          <button
            onClick={() => {
              playClick();
              setIsCollapsed(!isCollapsed);
            }}
            className="md:hidden"
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              padding: "2px 4px",
              display: "flex",
              alignItems: "center",
            }}
            title={isCollapsed ? "Expand Stocks" : "Collapse Stocks"}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Stock List (Collapsible on mobile) */}
      {!isCollapsed && (
        <>
          <div style={{ padding: "6px 8px", display: "flex", flexDirection: "column", gap: "3px" }}>
            {stocks.map((s) => {
              const isUp = s.change >= 0;
              return (
                <div
                  key={s.symbol}
                  className="nav-item-hover"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "5px 8px",
                    borderRadius: "4px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.04)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {/* Left Symbol & Name */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        color: "rgba(255, 255, 255, 0.95)",
                        lineHeight: 1.1,
                      }}
                    >
                      {s.symbol}
                    </div>
                    <div
                      style={{
                        fontSize: "0.6rem",
                        color: "rgba(255, 255, 255, 0.4)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s.name}
                    </div>
                  </div>

                  {/* Right Price & Delta */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        color: "#fff",
                        lineHeight: 1.1,
                      }}
                    >
                      ${(Number(s.price) || 0).toFixed(2)}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "2px",
                        fontFamily: "monospace",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: isUp ? "#6ee87a" : "#f87171",
                      }}
                    >
                      <span>{isUp ? "▲" : "▼"}</span>
                      <span>
                        {isUp ? "+" : ""}
                        {(Number(s.percent) || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div
            style={{
              borderTop: "1px solid var(--panel-border)",
              background: "rgba(0, 0, 0, 0.2)",
              padding: "5px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.6rem",
              color: "rgba(255, 255, 255, 0.4)",
              fontFamily: "monospace",
            }}
          >
            <span>NASDAQ Feed</span>
            <span>{lastUpdated}</span>
          </div>
        </>
      )}
    </div>
  );
}
