import { useEffect, useState } from "react";
import { api, getSession } from "../lib/api";
import Layout from "../components/Layout";
import { Table, ErrorBanner, EmptyState, PrimaryButton } from "../components/ui";

interface Distribution {
  id: string;
  quantity: number;
  distributedTo: string;
  createdAt: string;
  stockItemName: string | null;
}

interface StockItem {
  id: string;
  name: string;
  quantity: number;
}

export default function Distributions() {
  const [distributions, setDistributions] = useState<Distribution[] | null>(null);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [error, setError] = useState("");
  const { user } = getSession();
  const canCreate = ["ADMIN", "MANAGER"].includes(user?.role);

  function load() {
    api.distributions().then(setDistributions).catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
    api.stock().then(setStock).catch(() => {});
  }
  useEffect(load, []);

  return (
    <Layout title="Distributions">
      <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-1">Distribution history</h2>
        <p className="text-slate-400 text-sm mb-5">
          Every time stock is handed out, it's logged here and the Stock Master quantity drops in real time.
        </p>

        {error && <ErrorBanner message={error} />}
        {!distributions && !error && <div className="text-slate-500 text-sm">Loading…</div>}
        {distributions && distributions.length === 0 && <EmptyState message="No distributions yet." />}

        {distributions && distributions.length > 0 && (
          <Table headers={["Item", "Quantity", "Distributed to", "Date"]}>
            {distributions.map((d) => (
              <tr key={d.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 px-3 pl-0 text-slate-200">{d.stockItemName ?? "—"}</td>
                <td className="py-3 px-3 text-slate-200">{d.quantity}</td>
                <td className="py-3 px-3 text-slate-400">{d.distributedTo}</td>
                <td className="py-3 px-3 text-slate-500 text-xs">{d.createdAt}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {canCreate && <NewDistributionForm stock={stock} onCreated={load} />}
    </Layout>
  );
}

function NewDistributionForm({ stock, onCreated }: { stock: StockItem[]; onCreated: () => void }) {
  const [stockItemId, setStockItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [distributedTo, setDistributedTo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (stock.length > 0 && !stockItemId) setStockItemId(stock[0].id);
  }, [stock]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.createDistribution({ stockItemId, quantity: Number(quantity), distributedTo });
      setDistributedTo("");
      setQuantity(1);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create distribution");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
      <h2 className="text-white font-semibold text-lg mb-4">Distribute stock</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Item</label>
          <select
            value={stockItemId}
            onChange={(e) => setStockItemId(e.target.value)}
            className="bg-[#070a12] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
          >
            {stock.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.quantity} available)
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
            className="bg-[#070a12] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 w-24 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Distributed to</label>
          <input
            value={distributedTo}
            onChange={(e) => setDistributedTo(e.target.value)}
            required
            placeholder="Employee name"
            className="bg-[#070a12] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? "Distributing…" : "Distribute"}
        </PrimaryButton>
      </form>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
