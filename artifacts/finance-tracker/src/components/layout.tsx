import { Link, useLocation } from "wouter";
import { LayoutDashboard, Receipt, Wallet, Tags, Settings, Calculator, User } from "lucide-react";
import React, { ReactNode } from "react";
import { useCurrency } from "@/lib/currency";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Reorder } from "framer-motion";
import GlassCalculator from "./GlassCalculator";

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
      { href: "#calculator", label: "Calculator", icon: Calculator },
    ],
  },
];

const getIconComponent = (item: any) => {
  if (item && item.icon && typeof item.icon === "function") {
    return item.icon;
  }
  if (item && item.href) {
    if (item.href === "/") return LayoutDashboard;
    if (item.href === "/transactions") return Receipt;
    if (item.href === "/accounts") return Wallet;
    if (item.href === "/categories") return Tags;
    if (item.href === "/settings") return Settings;
    if (item.href === "#calculator") return Calculator;
  }
  return Settings;
};

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { currency } = useCurrency();

  // Stateful sidebar section sorting list
  const [sections, setSections] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("clovifi_sidebar_sections_order");
      return saved ? JSON.parse(saved) : ["Finance", "Manage", "App"];
    } catch {
      return ["Finance", "Manage", "App"];
    }
  });

  // Stateful subitems mapping
  const [itemsMap, setItemsMap] = React.useState<Record<string, { href: string; label: string; icon: any }[]>>(() => {
    try {
      const saved = localStorage.getItem("clovifi_sidebar_subitems_order");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      Finance: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/transactions", label: "Transactions", icon: Receipt },
        { href: "/accounts", label: "Accounts", icon: Wallet },
      ],
      Manage: [
        { href: "/categories", label: "Categories", icon: Tags },
      ],
      App: [
        { href: "/settings", label: "Settings", icon: Settings },
        { href: "#calculator", label: "Calculator", icon: Calculator },
      ]
    };
  });

  const handleSectionsReorder = (newOrder: string[]) => {
    setSections(newOrder);
    try {
      localStorage.setItem("clovifi_sidebar_sections_order", JSON.stringify(newOrder));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubitemsReorder = (sectionLabel: string, newOrder: any[]) => {
    const updated = { ...itemsMap, [sectionLabel]: newOrder };
    setItemsMap(updated);
    try {
      localStorage.setItem("clovifi_sidebar_subitems_order", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col md:flex-row"
      style={{ maxWidth: "1400px", margin: "0 auto", padding: "1rem", gap: "10px" }}
    >
      {/* ── Sidebar ── */}
      <nav
        className="glass-panel flex-shrink-0 flex flex-col w-full md:w-[200px]"
        style={{
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
          {/* Custom Symmetrical Glossy Clover SVG Logo (2000s Vista Style) */}
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.55))", flexShrink: 0 }}>
            <defs>
              <radialGradient id="leafGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#c5f838" />
                <stop offset="30%" stopColor="#66c028" />
                <stop offset="80%" stopColor="#1b5a04" />
                <stop offset="100%" stopColor="#0b3002" />
              </radialGradient>
              <linearGradient id="stemGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#66c028" />
                <stop offset="100%" stopColor="#144602" />
              </linearGradient>
              <linearGradient id="glossReflection" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
                <stop offset="45%" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <path id="clover-leaf" d="M 16 16 C 13.5 12.5, 10.5 11, 10.5 7.8 C 10.5 4.8, 13.2 4.8, 16 8 C 18.8 4.8, 21.5 4.8, 21.5 7.8 C 21.5 11, 18.5 12.5, 16 16 Z" />
            </defs>
            <path d="M 16 16 Q 16 23 23 27.5" stroke="url(#stemGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <use href="#clover-leaf" fill="url(#leafGrad)" />
            <use href="#clover-leaf" fill="url(#leafGrad)" transform="rotate(90 16 16)" />
            <use href="#clover-leaf" fill="url(#leafGrad)" transform="rotate(180 16 16)" />
            <use href="#clover-leaf" fill="url(#leafGrad)" transform="rotate(270 16 16)" />
            <circle cx="16" cy="16" r="2.8" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.35" />
            <path d="M 6 16 C 6 10.4772 10.4772 6 16 6 C 21.5228 6 26 10.4772 26 16 C 26 17.5 24 13.5 16 13.5 C 8 13.5 6 17.5 6 16 Z" fill="url(#glossReflection)" />
          </svg>
          <div style={{
            fontWeight: 900,
            fontSize: "1.45rem",
            fontFamily: "'Segoe UI', 'Trebuchet MS', sans-serif",
            background: "linear-gradient(to bottom, #ffffff 0%, #d5f2a2 45%, #66c028 50%, #1c5204 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 1.5px 2.5px rgba(0,0,0,0.85)) drop-shadow(0 0 5px rgba(100,220,40,0.4))",
            letterSpacing: "0.01em",
            lineHeight: 1,
            paddingBottom: "2px",
          }}>
            Clovifi
          </div>
        </div>

        {/* Nav sections */}
        <Reorder.Group
          as="div"
          axis="y"
          values={sections}
          onReorder={handleSectionsReorder}
          style={{ padding: "6px 0", flex: 1 }}
        >
          {sections.map((secLabel: string) => {
            const currentItems = itemsMap[secLabel] || [];
            return (
              <Reorder.Item
                key={secLabel}
                value={secLabel}
                as="div"
                style={{ cursor: "grab" }}
              >
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
                  {secLabel}
                </div>
                <Reorder.Group
                  as="div"
                  axis="y"
                  values={currentItems}
                  onReorder={(newOrder) => handleSubitemsReorder(secLabel, newOrder)}
                >
                  {currentItems.map((item) => {
                    const isActive = location === item.href;
                    const Icon = getIconComponent(item);

                    if (item.href === "#calculator") {
                      return (
                        <Reorder.Item
                          key={item.href}
                          value={item}
                          as="div"
                          style={{ cursor: "grab" }}
                        >
                          <div
                            className="nav-item-hover"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent("open-calculator"));
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "6px 10px",
                              margin: "1px 5px",
                              borderRadius: "4px",
                              border: "1px solid transparent",
                              transition: "all 0.15s",
                              color: "rgba(190,225,150,0.88)",
                              fontSize: "0.8rem",
                            }}
                          >
                            <Icon
                              style={{
                                width: "13px",
                                height: "13px",
                                flexShrink: 0,
                                color: "rgba(140,200,80,0.8)",
                              }}
                            />
                            {item.label}
                          </div>
                        </Reorder.Item>
                      );
                    }

                    return (
                      <Reorder.Item
                        key={item.href}
                        value={item}
                        as="div"
                        style={{ cursor: "grab" }}
                      >
                        <Link href={item.href}>
                          <div
                            className={isActive ? "nav-active" : "nav-item-hover"}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "6px 10px",
                              margin: "1px 5px",
                              borderRadius: "4px",
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
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>


      </nav>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 flex flex-col gap-3">
        {children}
      </main>

      {/* Floating Glassmorphic Calculator */}
      <GlassCalculator />
    </div>
  );
}

function UserProfileCard() {
  const { data: user } = useGetMe();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      queryClient.clear();
      window.location.reload();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  return (
    <div
      style={{
        borderTop: "1px solid rgba(70,140,20,0.3)",
        padding: "12px 10px",
        background: "rgba(10,30,5,0.45)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <Link href="/settings">
        <div
          title="Edit Profile Settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "4px",
            border: "1px solid transparent",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(110,180,50,0.15)";
            e.currentTarget.style.borderColor = "rgba(110,180,50,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #66c028, #1b5a04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "0.85rem",
              textTransform: "uppercase",
              border: "1px solid rgba(255,255,255,0.3)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
            }}
          >
            {user.username.slice(0, 2)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#fff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>{user.username}</span>
              <User style={{ width: "10px", height: "10px", color: "rgba(160,220,90,0.7)" }} />
            </div>
            <div style={{ fontSize: "0.6rem", color: "rgba(160,220,90,0.8)" }}>Edit Profile</div>
          </div>
        </div>
      </Link>
      <button
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
        style={{
          width: "100%",
          padding: "5px",
          borderRadius: "4px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff",
          fontSize: "0.7rem",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s",
          textAlign: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239,68,68,0.2)";
          e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
        }}
      >
        {logoutMutation.isPending ? "Logging out..." : "Log Out"}
      </button>
    </div>
  );
}
