import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import { Table, Badge, ErrorBanner, EmptyState } from "../components/ui";

interface Approval {
  id: string;
  type: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requesterName: string;
  createdAt: string;
}

// Asset Requests is a filtered view of the same Approvals data - specifically
// the subset of approval types that concern physical assets (as opposed to
// vendor onboarding, stock write-offs, etc, which live under Approval Workbench
// in full but aren't "asset requests" per se).
const ASSET_REQUEST_TYPES = ["New laptop request", "Asset transfer", "Retirement request"];

export default function AssetRequests() {
  const [approvals, setApprovals] = useState<Approval[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.approvals().then(setApprovals).catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const requests = approvals?.filter((a) => ASSET_REQUEST_TYPES.includes(a.type)) ?? [];

  return (
    <Layout title="Asset Requests">
      <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-1">Requests involving physical assets</h2>
        <p className="text-slate-400 text-sm mb-5">
          A filtered view of the Approval Workbench, scoped to laptop requests, transfers, and retirements. Decide
          these from the Approval Workbench directly (Manager/Admin/Executive).
        </p>

        {error && <ErrorBanner message={error} />}
        {!approvals && !error && <div className="text-slate-500 text-sm">Loading…</div>}
        {approvals && requests.length === 0 && <EmptyState message="No asset requests right now." />}

        {requests.length > 0 && (
          <Table headers={["Type", "Description", "Requested by", "Status"]}>
            {requests.map((a) => (
              <tr key={a.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 px-3 pl-0 text-slate-200">{a.type}</td>
                <td className="py-3 px-3 text-slate-400">{a.description}</td>
                <td className="py-3 px-3 text-slate-400">{a.requesterName}</td>
                <td className="py-3 px-3">
                  <Badge tone={a.status === "PENDING" ? "amber" : a.status === "APPROVED" ? "green" : "red"}>
                    {a.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </Layout>
  );
}
