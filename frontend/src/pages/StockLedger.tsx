import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import { Table, ErrorBanner, EmptyState } from "../components/ui";

interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
}

interface LedgerEntry {
  id: string;
  quantity: number;
  distributedTo: string;
  createdAt: string;
}

export default function StockLedger() {
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [ledger, setLedger] = useState<LedgerEntry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.stock().then((rows: StockItem[]) => {
      setItems(rows);
      if (rows.length > 0) setSelected(rows[0].id);
    }).catch((e) => setError(e instanceof Error ? e.message : "Failed to load stock"));
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.stockLedger(selected).then(setLedger).catch((e) => setError(e instanceof Error ? e.message : "Failed to load ledger"));
  }, [selected]);

  return (
    <Layout title="Stock Ledger">
      <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-1">Transaction history by item</h2>
        <p className="text-slate-400 text-sm mb-5">
          Every distribution event for a stock item, in order — the ledger view is the "how did we get here" to
          Stock Master's "where are we now".
        </p>

        {error && <ErrorBanner message={error} />}

        {items && items.length > 0 && (
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="bg-[#070a12] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 mb-5 focus:outline-none focus:border-blue-500/50"
          >
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.quantity} remaining)
              </option>
            ))}
          </select>
        )}

        {ledger && ledger.length === 0 && <EmptyState message="No distributions recorded for this item yet." />}
        {ledger && ledger.length > 0 && (
          <Table headers={["Quantity", "Distributed to", "Date"]}>
            {ledger.map((entry) => (
              <tr key={entry.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 px-3 pl-0 text-slate-200">-{entry.quantity}</td>
                <td className="py-3 px-3 text-slate-400">{entry.distributedTo}</td>
                <td className="py-3 px-3 text-slate-500 text-xs">{entry.createdAt}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </Layout>
  );
}
