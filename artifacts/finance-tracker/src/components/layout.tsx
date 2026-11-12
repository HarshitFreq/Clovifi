import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Calendar,
  Tags,
  Settings as SettingsIcon,
} from "lucide-react";
import React, { ReactNode, useState, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { useSoundEffects } from "@/lib/sound";
import CloverLogo from "@/components/CloverLogo";
import StockTickerWidget from "@/components/StockTickerWidget";
import FirebaseAuthModal from "@/components/FirebaseAuthModal";
import { auth, onAuthStateChanged, type FirebaseUser } from "@/lib/firebase";
import { LogIn, ShieldCheck } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/subscriptions", label: "Subscriptions", icon: Calendar },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const { data: user } = useGetMe();
  const { playClick } = useSoundEffects();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => setFirebaseUser(u));
    return () => unsub();
  }, []);

  const activeUser = user || { username: firebaseUser?.displayName || firebaseUser?.email?.split("@")[0] || "demouser" };

  return (
    <div
      className="min-h-[100dvh] flex flex-col md:flex-row-reverse"
      style={{ maxWidth: "1400px", margin: "0 auto", padding: "1rem", gap: "12px" }}
    >
      {/* ── Sidebar (Right on desktop) ── */}
      <aside
        className="flex-shrink-0 flex flex-col w-full md:w-[220px] gap-3"
        style={{
          position: "sticky",
          top: "1rem",
          height: "fit-content",
        }}
      >
        <nav
          className="glass-panel flex flex-col w-full"
          style={{
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
        {/* Brand Header */}
        <div
          style={{
            background: "linear-gradient(to bottom, var(--title-bg-1) 0%, var(--title-bg-2) 100%)",
            borderBottom: "1px solid var(--title-border)",
            padding: "14px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5 no-underline" onClick={playClick}>
            <span style={{ fontSize: "26px", lineHeight: 1, filter: "drop-shadow(0 0 10px rgba(74,222,128,0.55))", display: "inline-block" }}>
              ☘️
            </span>
            <div
              className="brand-title"
              style={{
                fontWeight: 800,
                fontSize: "1.42rem",
                fontFamily: "'Comfortaa', 'Century Gothic', 'Quicksand', 'Trebuchet MS', 'Lucida Grande', sans-serif",
                letterSpacing: "-0.01em",
                lineHeight: 1,
              }}
            >
              Clovifi
            </div>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 rounded"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {mobileMenuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Links container */}
        <div className={`${mobileMenuOpen ? "flex" : "hidden"} md:flex flex-col`} style={{ padding: "8px 6px", gap: "2px" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} onClick={playClick}>
                <div
                  className={isActive ? "nav-active" : "nav-item-hover"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid transparent",
                    transition: "all 0.12s ease",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.75)",
                    fontSize: "0.84rem",
                    fontWeight: isActive ? 600 : 500,
                    cursor: "pointer",
                  }}
                >
                  <Icon
                    style={{
                      width: "16px",
                      height: "16px",
                      flexShrink: 0,
                      color: isActive ? "#fff" : "rgba(255, 255, 255, 0.6)",
                      filter: isActive ? "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" : "none",
                    }}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Compact User Profile Bar */}
        <div
          style={{
            borderTop: "1px solid var(--panel-border)",
            padding: "10px 12px",
            background: "rgba(0, 0, 0, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <Link href="/settings" style={{ minWidth: 0, flex: 1, textDecoration: "none" }} onClick={playClick}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                borderRadius: "5px",
                padding: "4px 6px",
                transition: "background 0.15s",
              }}
              className="hover:bg-white/5"
              title="Profile & Settings"
            >
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent-gradient-1), var(--accent-gradient-3))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {firebaseUser?.photoURL ? (
                  <img src={firebaseUser.photoURL} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  activeUser.username.slice(0, 2)
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    color: "#fff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {firebaseUser ? (firebaseUser.displayName || firebaseUser.email?.split("@")[0]) : activeUser.username}
                </div>
                <div style={{ fontSize: "0.62rem", color: firebaseUser ? "#6ee87a" : "var(--accent-gradient-1)", opacity: 0.85 }}>
                  {firebaseUser ? "Firebase Linked" : "Active Workspace"}
                </div>
              </div>
            </div>
          </Link>

          <button
            onClick={() => {
              playClick();
              setIsAuthModalOpen(true);
            }}
            className="toolbar-btn"
            style={{ padding: "4px 7px", fontSize: "0.64rem", borderRadius: "3px" }}
            title="Firebase Authentication"
          >
            {firebaseUser ? <ShieldCheck size={12} style={{ color: "#6ee87a" }} /> : <LogIn size={12} />}
          </button>
        </div>
      </nav>

      {/* ── Live Stock Data (Just below the nav tab) ── */}
      <StockTickerWidget />

      {/* ── Firebase Auth Modal ── */}
      <FirebaseAuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </aside>

      {/* ── Main Content View ── */}
      <main className="flex-1 min-w-0 flex flex-col gap-3">
        {children}
      </main>
    </div>
  );
}
