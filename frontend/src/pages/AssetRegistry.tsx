import { useEffect, useState } from "react";
import { api, getSession } from "../lib/api";
import Layout from "../components/Layout";
import { Table, Badge, ErrorBanner, EmptyState, PrimaryButton } from "../components/ui";

interface Asset {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  status: "IN_USE" | "AVAILABLE" | "MAINTENANCE" | "RETIRED";
  assignedToName: string | null;
}

const STATUS_TONE: Record<string, "blue" | "green" | "amber" | "slate"> = {
  IN_USE: "blue",
  AVAILABLE: "green",
  MAINTENANCE: "amber",
  RETIRED: "slate",
};

export default function AssetRegistry() {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [error, setError] = useState("");
  const { user } = getSession();
  const canCreate = ["ADMIN", "MANAGER"].includes(user?.role);

  function load() {
    api.assets().then(setAssets).catch((e) => setError(e instanceof Error ? e.message : "Failed to load assets"));
  }
  useEffect(load, []);

  return (
    <Layout title="Asset Registry">
      <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-1">All registered assets</h2>
        <p className="text-slate-400 text-sm mb-5">Every physical asset the org owns, its status, and who it's assigned to.</p>

        {error && <ErrorBanner message={error} />}
        {!assets && !error && <div className="text-slate-500 text-sm">Loading…</div>}
        {assets && assets.length === 0 && <EmptyState message="No assets registered yet." />}

        {assets && assets.length > 0 && (
          <Table headers={["Name", "Category", "Serial", "Status", "Assigned to"]}>
            {assets.map((a) => (
              <tr key={a.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 px-3 pl-0 text-slate-200">{a.name}</td>
                <td className="py-3 px-3 text-slate-400">{a.category}</td>
                <td className="py-3 px-3 text-slate-500 text-xs">{a.serialNumber}</td>
                <td className="py-3 px-3">
                  <Badge tone={STATUS_TONE[a.status]}>{a.status.replace("_", " ")}</Badge>
                </td>
                <td className="py-3 px-3 text-slate-400">{a.assignedToName ?? "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {canCreate && <NewAssetForm onCreated={load} />}
    </Layout>
  );
}

function NewAssetForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.createAsset({ name, category, serialNumber });
      setName("");
      setCategory("");
      setSerialNumber("");
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create asset");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
      <h2 className="text-white font-semibold text-lg mb-4">Register new asset</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-[#070a12] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="bg-[#070a12] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Serial number</label>
          <input
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            required
            className="bg-[#070a12] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? "Registering…" : "Register asset"}
        </PrimaryButton>
      </form>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
