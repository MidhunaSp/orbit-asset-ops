import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, ClipboardCheck, AlertTriangle, Box, BookOpen, Repeat, RefreshCw,
  Tag, FileText, Bell, Palette, ShieldCheck, LogOut,
} from "lucide-react";
import { getSession, clearSession } from "../lib/api";

const navSections = [
  { label: "WORKSPACE", items: [{ icon: LayoutGrid, label: "Dashboard", to: "/dashboard" }] },
  {
    label: "APPROVALS",
    items: [
      { icon: ClipboardCheck, label: "Approval Workbench", to: "/approvals" },
      { icon: AlertTriangle, label: "Anomalies", to: "/anomalies" },
    ],
  },
  {
    label: "STOCK",
    items: [
      { icon: Box, label: "Stock Master", to: "/stock" },
      { icon: BookOpen, label: "Stock Ledger", to: "/stock-ledger" },
      { icon: Repeat, label: "Distributions", to: "/distributions" },
      { icon: RefreshCw, label: "Reconciliation", to: "/reconciliation" },
    ],
  },
  {
    label: "ASSETS",
    items: [
      { icon: Tag, label: "Asset Registry", to: "/assets" },
      { icon: FileText, label: "Asset Requests", to: "/asset-requests" },
    ],
  },
];

export default function Layout({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = getSession();

  function handleSignOut() {
    clearSession();
    navigate("/login");
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <div className="min-h-screen w-full bg-[#070a12] text-slate-200 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/5 flex flex-col p-4">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">ORBIT</div>
            <div className="text-[9px] tracking-wider text-slate-500">ASSET OPS</div>
          </div>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              <div className="text-[10px] tracking-wider text-slate-500 font-semibold px-2 mb-2">
                {section.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-blue-500/15 text-blue-400 font-medium"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/5 pt-3 flex items-center gap-2.5 px-2">
          <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white leading-tight">{user?.name ?? "Guest"}</div>
            <div className="text-[11px] text-slate-500">{user?.department ?? user?.role}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-2 flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm px-2 py-1.5"
        >
          <LogOut size={14} /> Sign out
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white">
              <Palette size={15} />
            </button>
            <button className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white relative">
              <Bell size={15} />
            </button>
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>

        <div className="p-8 flex flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}
