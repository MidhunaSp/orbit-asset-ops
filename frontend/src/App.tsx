import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Approvals from "./pages/Approvals";
import Anomalies from "./pages/Anomalies";
import StockMaster from "./pages/StockMaster";
import StockLedger from "./pages/StockLedger";
import Distributions from "./pages/Distributions";
import Reconciliation from "./pages/Reconciliation";
import AssetRegistry from "./pages/AssetRegistry";
import AssetRequests from "./pages/AssetRequests";
import { getSession } from "./lib/api";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = getSession();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

const protectedPages: [string, React.ComponentType][] = [
  ["/dashboard", Dashboard],
  ["/approvals", Approvals],
  ["/anomalies", Anomalies],
  ["/stock", StockMaster],
  ["/stock-ledger", StockLedger],
  ["/distributions", Distributions],
  ["/reconciliation", Reconciliation],
  ["/assets", AssetRegistry],
  ["/asset-requests", AssetRequests],
];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {protectedPages.map(([path, Component]) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute>
                <Component />
              </ProtectedRoute>
            }
          />
        ))}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
