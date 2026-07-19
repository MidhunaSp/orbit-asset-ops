import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { api, saveSession } from "../lib/api";

const roles = [
  { key: "EMPLOYEE", label: "Employee" },
  { key: "MANAGER", label: "Manager" },
  { key: "L2_SUPPORT", label: "L2 Support" },
  { key: "EXECUTIVE", label: "Executive" },
  { key: "ADMIN", label: "Admin" },
];

export default function Login() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleDemoLogin(role: string) {
    setLoading(role);
    setError("");
    try {
      const { token, user } = await api.demoLogin(role);
      saveSession(token, user);
      navigate("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#070a12] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <div className="text-base font-bold text-white leading-tight">ORBIT</div>
            <div className="text-[10px] tracking-wider text-slate-500">ASSET OPS</div>
          </div>
        </div>

        <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
          <h1 className="text-white font-semibold text-lg mb-1">Try a demo role</h1>
          <p className="text-slate-400 text-sm mb-5">
            Each role has its own journey and permissions. Pick one to explore.
          </p>

          <div className="flex flex-col gap-2">
            {roles.map((r) => (
              <button
                key={r.key}
                onClick={() => handleDemoLogin(r.key)}
                disabled={loading !== null}
                className="w-full text-left px-4 py-3 rounded-xl border border-white/10 text-slate-200 hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors disabled:opacity-50 flex items-center justify-between"
              >
                <span className="font-medium">{r.label}</span>
                <span className="text-xs text-slate-500">
                  {loading === r.key ? "Signing in..." : "Continue"}
                </span>
              </button>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

          <p className="text-slate-600 text-xs mt-5">
            Demo credentials: role@demo.io / password123 (same accounts, seeded on setup).
          </p>
        </div>
      </div>
    </div>
  );
}
