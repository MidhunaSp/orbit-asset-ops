import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api, getSession } from "../lib/api";
import Layout from "../components/Layout";
import { Badge, Table, ErrorBanner, EmptyState } from "../components/ui";

interface Anomaly {
  id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "ACTIVE" | "RESOLVED" | "IGNORED";
  createdAt: string;
  assetName: string | null;
  assetSerial: string | null;
}

const CAN_RESOLVE = ["L2_SUPPORT", "ADMIN", "MANAGER"];
const SEVERITY_TONE: Record<string, "slate" | "amber" | "red"> = {
  LOW: "slate",
  MEDIUM: "amber",
  HIGH: "red",
  CRITICAL: "red",
};

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState<Anomaly[] | null>(null);
  const [error, setError] = useState("");
  const { user } = getSession();

  function load() {
    api
      .anomalies()
      .then(setAnomalies)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load anomalies"));
  }

  useEffect(load, []);

  async function resolve(id: string) {
    try {
      await api.resolveAnomaly(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resolve");
    }
  }

  const canResolve = CAN_RESOLVE.includes(user?.role);
  const active = anomalies?.filter((a) => a.status === "ACTIVE") ?? [];
  const resolved = anomalies?.filter((a) => a.status !== "ACTIVE") ?? [];

  return (
    <Layout title="Anomalies">
      {error && <ErrorBanner message={error} />}
      {!anomalies && !error && <div className="text-slate-500 text-sm">Loading…</div>}

      {anomalies && (
        <>
          <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-white font-semibold text-lg">Active anomalies ({active.length})</h2>
              {!canResolve && <Badge tone="slate">Your role can view, not resolve</Badge>}
            </div>
            <p className="text-slate-400 text-sm mb-5">
              Flagged automatically from asset activity. L2 Support, Manager, or Admin can mark these resolved.
            </p>

            {active.length === 0 && <EmptyState message="No active anomalies. Clean." />}

            {active.length > 0 && (
              <Table headers={["Asset", "Description", "Severity", "Detected", "Action"]}>
                {active.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 px-3 pl-0 text-slate-200">
                      {a.assetName ?? "—"}
                      {a.assetSerial && <span className="text-slate-600 text-xs ml-1">({a.assetSerial})</span>}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{a.description}</td>
                    <td className="py-3 px-3">
                      <Badge tone={SEVERITY_TONE[a.severity]}>{a.severity}</Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{a.createdAt}</td>
                    <td className="py-3 px-3">
                      {canResolve ? (
                        <button
                          onClick={() => resolve(a.id)}
                          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          <CheckCircle2 size={14} /> Resolve
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </div>

          {resolved.length > 0 && (
            <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-semibold text-lg mb-4">Resolved ({resolved.length})</h2>
              <Table headers={["Asset", "Description", "Severity", "Status"]}>
                {resolved.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 last:border-0 opacity-60">
                    <td className="py-3 px-3 pl-0 text-slate-200">{a.assetName ?? "—"}</td>
                    <td className="py-3 px-3 text-slate-400">{a.description}</td>
                    <td className="py-3 px-3">
                      <Badge tone={SEVERITY_TONE[a.severity]}>{a.severity}</Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Badge tone="green">{a.status}</Badge>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
