import { Link, useLocation } from "wouter";
import { LayoutDashboard, Receipt, Wallet, Tags, Settings } from "lucide-react";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: Receipt },
    { href: "/accounts", label: "Accounts", icon: Wallet },
    { href: "/categories", label: "Categories", icon: Tags },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row max-w-7xl mx-auto p-4 gap-6">
      <nav className="glass-panel w-full md:w-64 flex-shrink-0 rounded-2xl p-4 flex flex-col gap-2 h-fit md:sticky top-4">
        <div className="flex items-center gap-3 px-2 py-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-blue-200 shadow-sm flex items-center justify-center border border-white/60">
            <div className="w-6 h-6 rounded-full bg-blue-500 glass-button" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-800 drop-shadow-sm">Aero Finance</h1>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? "bg-white/40 shadow-sm border border-white/70 text-blue-900"
                      : "hover:bg-white/20 text-slate-700 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-blue-600 drop-shadow-sm" : ""}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-2 pt-2 border-t border-white/30">
          <Link href="/settings">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                location === "/settings"
                  ? "bg-white/40 shadow-sm border border-white/70 text-blue-900"
                  : "hover:bg-white/20 text-slate-700 hover:text-slate-900 border border-transparent"
              }`}
            >
              <Settings className={`w-5 h-5 ${location === "/settings" ? "text-blue-600 drop-shadow-sm" : ""}`} />
              <span className="font-medium">Settings</span>
            </div>
          </Link>
        </div>
      </nav>
      <main className="flex-1 min-w-0 flex flex-col gap-6">
        {children}
      </main>
    </div>
  );
}
