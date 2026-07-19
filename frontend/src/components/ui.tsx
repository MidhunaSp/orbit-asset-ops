import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-[#0d1220] border border-white/5 rounded-2xl p-6 ${className}`}>{children}</div>;
}

export function Badge({ tone, children }: { tone: "green" | "amber" | "red" | "blue" | "slate"; children: ReactNode }) {
  const tones: Record<string, string> = {
    green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    red: "bg-red-500/15 text-red-400 border-red-500/20",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    slate: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-1 rounded-full border ${tones[tone]}`}>{children}</span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="text-slate-500 text-sm py-8 text-center">{message}</div>;
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
      {message}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
    >
      {children}
    </button>
  );
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            {headers.map((h) => (
              <th key={h} className="text-left text-slate-500 font-medium text-xs tracking-wider py-3 px-3 first:pl-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
