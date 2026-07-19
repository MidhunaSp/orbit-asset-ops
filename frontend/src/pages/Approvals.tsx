import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { api, getSession } from "../lib/api";
import Layout from "../components/Layout";
import { Badge, Table, ErrorBanner, EmptyState, PrimaryButton } from "../components/ui";

interface Approval {
  id: string;
  type: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requesterName: string;
  requesterId: string;
  createdAt: string;
}

const CAN_DECIDE = ["MANAGER", "ADMIN", "EXECUTIVE"];

export default function Approvals() {
  const [approvals, setApprovals] = useState<Approval[] | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState<Record<string, string>>({});
  const { user } = getSession();

  function load() {
    api
      .approvals()
      .then(setApprovals)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load approvals"));
  }

  useEffect(load, []);

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    setActionError((prev) => ({ ...prev, [id]: "" }));
    try {
      await api.decideApproval(id, decision);
      load();
    } catch (e) {
      setActionError((prev) => ({ ...prev, [id]: e instanceof Error ? e.message : "Action failed" }));
    }
  }

  const canDecide = CAN_DECIDE.includes(user?.role);

  return (
    <Layout title="Approval Workbench">
      <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-white font-semibold text-lg">Pending & recent approvals</h2>
          {!canDecide && (
            <Badge tone="slate">Your role ({user?.role}) can request, but not decide</Badge>
          )}
        </div>
        <p className="text-slate-400 text-sm mb-5">
          Maker-checker is enforced server-side: whoever requested an item can never be the one who approves it,
          regardless of what the UI allows you to click.
        </p>

        {error && <ErrorBanner message={error} />}
        {!approvals && !error && <div className="text-slate-500 text-sm">Loading…</div>}
        {approvals && approvals.length === 0 && <EmptyState message="No approvals yet." />}

        {approvals && approvals.length > 0 && (
          <Table headers={["Type", "Description", "Requested by", "Status", "Actions"]}>
            {approvals.map((a) => (
              <tr key={a.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 px-3 pl-0 text-slate-200">{a.type}</td>
                <td className="py-3 px-3 text-slate-400">{a.description}</td>
                <td className="py-3 px-3 text-slate-400">{a.requesterName}</td>
                <td className="py-3 px-3">
                  <Badge tone={a.status === "PENDING" ? "amber" : a.status === "APPROVED" ? "green" : "red"}>
                    {a.status}
                  </Badge>
                </td>
                <td className="py-3 px-3">
                  {a.status === "PENDING" && canDecide ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() => decide(a.id, "APPROVED")}
                          className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/25"
                          title="Approve"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => decide(a.id, "REJECTED")}
                          className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center hover:bg-red-500/25"
                          title="Reject"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {actionError[a.id] && (
                        <span className="text-red-400 text-xs max-w-xs">{actionError[a.id]}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-600 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <NewApprovalForm onCreated={load} />
    </Layout>
  );
}

function NewApprovalForm({ onCreated }: { onCreated: () => void }) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.createApproval({ type, description });
      setType("");
      setDescription("");
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
      <h2 className="text-white font-semibold text-lg mb-4">Request a new approval</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-lg">
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Type (e.g. New laptop request)"
          required
          className="bg-[#070a12] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          required
          rows={2}
          className="bg-[#070a12] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
        />
        {error && <span className="text-red-400 text-xs">{error}</span>}
        <div>
          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit request"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
