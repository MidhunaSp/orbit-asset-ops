import { useEffect, useState } from "react";
import { api, getSession } from "../lib/api";
import Layout from "../components/Layout";
import { Table, ErrorBanner, EmptyState, PrimaryButton, Badge } from "../components/ui";

interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  createdAt: string;
}

export default function StockMaster() {
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [error, setError] = useState("");
  const { user } = getSession();
  const canCreate = ["ADMIN", "MANAGER"].includes(user?.role);

  function load() {
    api.stock().then(setItems).catch((e) => setError(e instanceof Error ? e.message : "Failed to load stock"));
  }
  useEffect(load, []);

  return (
    <Layout title="Stock Master">
      <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-1">Current stock catalog</h2>
        <p className="text-slate-400 text-sm mb-5">Live quantities — updated automatically as items are distributed.</p>

        {error && <ErrorBanner message={error} />}
        {!items && !error && <div className="text-slate-500 text-sm">Loading…</div>}
        {items && items.length === 0 && <EmptyState message="No stock items yet." />}

        {items && items.length > 0 && (
          <Table headers={["Item", "Category", "Quantity", "Status"]}>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 px-3 pl-0 text-slate-200">{i.name}</td>
                <td className="py-3 px-3 text-slate-400">{i.category}</td>
                <td className="py-3 px-3 text-slate-200 font-medium">{i.quantity}</td>
                <td className="py-3 px-3">
                  <Badge tone={i.quantity === 0 ? "red" : i.quantity < 10 ? "amber" : "green"}>
                    {i.quantity === 0 ? "Out of stock" : i.quantity < 10 ? "Low" : "In stock"}
                  </Badge>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {canCreate && <NewStockForm onCreated={load} />}
    </Layout>
  );
}

function NewStockForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.createStock({ name, category, quantity: Number(quantity) });
      setName("");
      setCategory("");
      setQuantity(1);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add stock item");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
      <h2 className="text-white font-semibold text-lg mb-4">Add stock item</h2>
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
          <label className="text-xs text-slate-500">Quantity</label>
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
            className="bg-[#070a12] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 w-28 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add item"}
        </PrimaryButton>
      </form>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
