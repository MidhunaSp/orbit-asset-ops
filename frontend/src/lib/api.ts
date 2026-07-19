const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? JSON.stringify(body.error) : `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  demoLogin: (role: string) =>
    request("/auth/demo-login", { method: "POST", body: JSON.stringify({ role }) }),
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  dashboardStats: () => request("/dashboard/stats"),
  assets: () => request("/assets"),
  createAsset: (data: { name: string; category: string; serialNumber: string; status?: string }) =>
    request("/assets", { method: "POST", body: JSON.stringify(data) }),
  approvals: () => request("/approvals"),
  createApproval: (data: { type: string; description: string }) =>
    request("/approvals", { method: "POST", body: JSON.stringify(data) }),
  decideApproval: (id: string, decision: "APPROVED" | "REJECTED") =>
    request(`/approvals/${id}/decision`, { method: "POST", body: JSON.stringify({ decision }) }),
  anomalies: () => request("/anomalies"),
  resolveAnomaly: (id: string) => request(`/anomalies/${id}/resolve`, { method: "POST" }),
  aiInsights: (question: string) =>
    request("/ai/insights", { method: "POST", body: JSON.stringify({ question }) }),
  stock: () => request("/stock"),
  createStock: (data: { name: string; category: string; quantity: number }) =>
    request("/stock", { method: "POST", body: JSON.stringify(data) }),
  stockLedger: (id: string) => request(`/stock/${id}/ledger`),
  distributions: () => request("/distributions"),
  createDistribution: (data: { stockItemId: string; quantity: number; distributedTo: string }) =>
    request("/distributions", { method: "POST", body: JSON.stringify(data) }),
  auditLog: () => request("/audit"),
  reconciliation: () => request("/audit/reconciliation"),
};

export function saveSession(token: string, user: unknown) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getSession() {
  const user = localStorage.getItem("user");
  return { token: getToken(), user: user ? JSON.parse(user) : null };
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
