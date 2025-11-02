import { useEffect, useState } from "react";
import axios from "axios";


/** Base API URL and endpoint
 * Server is expected on port 3000
 */
const API_BASE = "http://localhost:3000";
const SUMMARY_URL = API_BASE + "/api/admin/summary";

/** Format number as Hungarian Forint 
 * Returns "-" for non-finite inputs
 */
const formatFt = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("hu-HU", { maximumFractionDigits: 0 }) + " Ft";
};

// Small card used throughout the dashboard, title : label, value: main metric, hint: optional text
const Card = ({ title, value, hint }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="text-sm text-gray-600">{title}</div>
    <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
  </div>
);

// Fetches aggregated KPI and latest orders, renders cards and a list
const AdminSummary = () => {

  // API response payload and loading state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);


  // Build authorization header from localStorage tokens
  const authHeader = () => {
    const token = localStorage.getItem("pos-token") || localStorage.getItem("token");
    return token ? { Authorization: "Bearer " + token } : {};
  };

  // Load summary data from backend, set loading, calls summary GET API, stores data
  async function load() {
    try {
      setLoading(true);
      const res = await axios.get(SUMMARY_URL, { headers: authHeader() });
      if (res.data && res.data.success) setData(res.data.data);
      else alert((res.data && res.data.message) || "Failed to load summary.");
    } catch (e) {
      const msg = (e.response && e.response.data && e.response.data.message) || "Server error while loading summary.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    load();
  }, []);

  // Accessors for nested data
  const cards = data && data.cards;
  const latest = (data && data.latestOrders) || [];


  // Build text for the users card from role breakdown
  const usersHint =
    cards && cards.usersByRole
      ? "admin: " +
        (cards.usersByRole.admin || 0) +
        ", employee: " +
        (cards.usersByRole.employee || 0)
      : "";

  return (
    <div className="w-full bg-gray-50 min-h-[calc(100vh-64px)] p-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Summary of dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="Products"
          value={cards ? cards.productsCount : "-"}
          hint={"Low stock: " + (cards ? cards.lowStockCount || 0 : 0)}
        />
        <Card title="Categories" value={cards ? cards.categoriesCount : "-"} />
        <Card title="Warehouses" value={cards ? cards.warehousesCount : "-"} />
        <Card title="Users" value={cards ? cards.usersCount : "-"} hint={usersHint} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <Card
          title="Orders"
          value={(cards ? cards.ordersFulfilled || 0 : 0) + " fulfilled"}
          hint={(cards ? cards.ordersPending || 0 : 0) + " pending"}
        />
        <Card
          title="To-Order items"
          value={((cards && cards.toOrder && cards.toOrder.pending) || 0) + " pending"}
          hint={
            "ordered: " +
            ((cards && cards.toOrder && cards.toOrder.ordered) || 0) +
            ", received: " +
            ((cards && cards.toOrder && cards.toOrder.received) || 0)
          }
        />
        <Card
          title="Inventory value (est.)"
          value={formatFt((cards && cards.inventoryValue) || 0)}
        />
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-gray-900 mb-3">Latest orders</div>

        {loading && <div className="text-gray-600 text-sm">Loading…</div>}

        {!loading && latest.length === 0 && (
          <div className="text-gray-600 text-sm">No recent orders.</div>
        )}

        {!loading && latest.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {latest.map((o) => {
              const status = o.status || "pending";
              const badge =
                "text-xs font-medium px-2 py-0.5 rounded-md border " +
                (status === "fulfilled"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-yellow-100 text-yellow-800 border-yellow-200");

              return (
                <li key={o._id} className="py-2 flex items-center justify-between">
                  <div className="text-gray-900">
                    <span className="font-semibold">#{o.id}</span>{" "}
                    <span className="text-gray-600">• {(o.itemsCount || 0) + " items"}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={badge}>{status}</span>
                    <span className="text-xs text-gray-500">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminSummary;
