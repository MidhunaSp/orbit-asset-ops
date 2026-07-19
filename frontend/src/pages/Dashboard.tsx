import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { ShieldCheck, Box, ClipboardCheck, AlertTriangle, type LucideIcon } from "lucide-react";
import { api, getSession } from "../lib/api";
import Layout from "../components/Layout";
import { ErrorBanner } from "../components/ui";

const STATUS_COLORS: Record<string, string> = {
  IN_USE: "#3b82f6",
  AVAILABLE: "#60a5fa",
  MAINTENANCE: "#f59e0b",
  RETIRED: "#64748b",
};

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "blue" | "amber" | "red";
}

function StatCard({ label, value, icon: Icon, tone }: StatCardProps) {
  const tones = {
    blue: "bg-blue-500/15 text-blue-400",
    amber: "bg-amber-500/15 text-amber-400",
    red: "bg-red-500/15 text-red-400",
  };
  return (
    <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] tracking-wider text-slate-400 font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

interface Stats {
  totalUsers: number;
  totalStocks: number;
  pendingApprovals: number;
  activeAnomalies: number;
  distributionByStatus: { name: string; value: number }[];
  topDistributedItems: { name: string; value: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = getSession();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    api
      .dashboardStats()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load stats"));
  }, []);

  return (
    <Layout title="Dashboard">
      <div className="bg-gradient-to-br from-[#0d1a33] to-[#0a0e1a] border border-white/5 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[11px] tracking-wider font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
            ✦ {user?.role?.replace("_", " ") ?? "SYSTEM"}
          </span>
          <span className="text-[11px] tracking-wider font-medium text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> LIVE
          </span>
        </div>
        <h2 className="text-4xl font-bold text-white mb-3">
          Operations, <span className="text-blue-400">under control.</span>
        </h2>
        <p className="text-slate-400 max-w-xl leading-relaxed">
          Service health, user activity, and the full audit trail — observed live across every subsystem.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}
      {!stats && !error && <div className="text-slate-500 text-sm">Loading live data…</div>}

      {stats && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="TOTAL USERS" value={stats.totalUsers} icon={ShieldCheck} tone="blue" />
            <StatCard label="TOTAL STOCKS" value={stats.totalStocks} icon={Box} tone="blue" />
            <StatCard label="PENDING APPROVALS" value={stats.pendingApprovals} icon={ClipboardCheck} tone="amber" />
            <StatCard label="ACTIVE ANOMALIES" value={stats.activeAnomalies} icon={AlertTriangle} tone="red" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Distribution by Status</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={stats.distributionByStatus} dataKey="value" nameKey="name" outerRadius={100}>
                    {stats.distributionByStatus.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] ?? "#64748b"} stroke="#0d1220" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0d1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-2 flex-wrap">
                {stats.distributionByStatus.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[s.name] ?? "#64748b" }} />
                    {s.name.replace("_", " ")}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Top Distributed Items</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.topDistributedItems}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    contentStyle={{ background: "#0d1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
