import { Link, useLocation } from "wouter";
import { LayoutDashboard, Receipt, Wallet, Tags, Settings, DollarSign } from "lucide-react";
import { ReactNode } from "react";
import { useCurrency } from "@/lib/currency";

const NAV_SECTIONS = [
  {
    label: "Finance",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/transactions", label: "Transactions", icon: Receipt },
      { href: "/accounts", label: "Accounts", icon: Wallet },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/categories", label: "Categories", icon: Tags },
    ],
  },
  {
    label: "App",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { currency } = useCurrency();

  return (
    <div
      className="min-h-[100dvh] flex flex-col md:flex-row"
      style={{ maxWidth: "1400px", margin: "0 auto", padding: "1rem", gap: "10px" }}
    >
      {/* ── Sidebar ── */}
      <nav
        className="glass-panel flex-shrink-0 flex flex-col"
        style={{
          width: "200px",
          borderRadius: "6px",
          overflow: "hidden",
          height: "fit-content",
          position: "sticky",
          top: "1rem",
        }}
      >
        {/* Logo / header */}
        <div
          style={{
            background: "linear-gradient(to bottom, rgba(15,40,6,0.95) 0%, rgba(8,22,3,0.98) 100%)",
            borderBottom: "1px solid rgba(70,140,20,0.3)",
            padding: "12px 10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {/* Vista-style orb */}
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "radial-gradient(circle at 38% 35%, #9ded40 0%, #5db820 40%, #2d6b08 80%, #1a4204 100%)",
              boxShadow: "0 0 10px rgba(90,200,20,0.5), inset 0 2px 3px rgba(255,255,255,0.4)",
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#d4f0a0", letterSpacing: "0.02em", lineHeight: 1.2, textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
              Aero Finance
            </div>
            <div style={{ fontSize: "0.6rem", color: "rgba(140,190,80,0.7)", letterSpacing: "0.04em", lineHeight: 1 }}>
              {currency} selected
            </div>
          </div>
        </div>

        {/* Nav sections */}
        <div style={{ padding: "6px 0", flex: 1 }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div
                style={{
                  padding: "8px 10px 3px",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(110,170,60,0.7)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={isActive ? "nav-active" : "nav-item-hover"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 10px",
                        margin: "1px 5px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        border: "1px solid transparent",
                        transition: "all 0.15s",
                        color: isActive ? "#fff" : "rgba(190,225,150,0.88)",
                        fontSize: "0.8rem",
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      <Icon
                        style={{
                          width: "13px",
                          height: "13px",
                          flexShrink: 0,
                          color: isActive ? "#fff" : "rgba(140,200,80,0.8)",
                          filter: isActive ? "drop-shadow(0 1px 2px rgba(0,0,0,0.7))" : "none",
                        }}
                      />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 flex flex-col gap-3">
        {children}
      </main>
    </div>
  );
}
