import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import { Table, ErrorBanner, EmptyState } from "../components/ui";

interface AuditEntry {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  actorName: string | null;
}

interface ReconciliationResult {
  checkedAt: string;
  issues: { assetId: string; assetName: string; serialNumber: string; issue: string }[];
  clean: boolean;
}

export default function Reconciliation() {
  const [recon, setRecon] = useState<ReconciliationResult | null>(null);
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.reconciliation().then(setRecon).catch((e) => setError(e instanceof Error ? e.message : "Failed to run reconciliation"));
    api.auditLog().then(setAudit).catch(() => {});
  }, []);

  return (
    <Layout title="Reconciliation">
      {error && <ErrorBanner message={error} />}

      <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-1">Data integrity check</h2>
        <p className="text-slate-400 text-sm mb-5">
          Runs live against the current data — flags assets marked "in use" with nobody assigned to them, a real
          mismatch between the physical/operational state and the system record.
        </p>

        {!recon && !error && <div className="text-slate-500 text-sm">Running check…</div>}

        {recon && recon.clean && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <CheckCircle2 size={16} /> No discrepancies found. Everything reconciles.
          </div>
        )}

        {recon && !recon.clean && (
          <>
            <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
              <AlertTriangle size={16} /> {recon.issues.length} discrepanc{recon.issues.length === 1 ? "y" : "ies"} found.
            </div>
            <Table headers={["Asset", "Serial", "Issue"]}>
              {recon.issues.map((issue) => (
                <tr key={issue.assetId} className="border-b border-white/5 last:border-0">
                  <td className="py-3 px-3 pl-0 text-slate-200">{issue.assetName}</td>
                  <td className="py-3 px-3 text-slate-400">{issue.serialNumber}</td>
                  <td className="py-3 px-3 text-amber-400">{issue.issue}</td>
                </tr>
              ))}
            </Table>
          </>
        )}
      </div>

      <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-1">Audit trail</h2>
        <p className="text-slate-400 text-sm mb-5">Immutable log of every approval, resolution, and creation action.</p>

        {audit && audit.length === 0 && <EmptyState message="No audit events yet." />}
        {audit && audit.length > 0 && (
          <Table headers={["Actor", "Action", "Details", "When"]}>
            {audit.map((a) => (
              <tr key={a.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 px-3 pl-0 text-slate-200">{a.actorName ?? "—"}</td>
                <td className="py-3 px-3 text-slate-400">{a.action}</td>
                <td className="py-3 px-3 text-slate-500">{a.details}</td>
                <td className="py-3 px-3 text-slate-600 text-xs">{a.createdAt}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </Layout>
  );
}
