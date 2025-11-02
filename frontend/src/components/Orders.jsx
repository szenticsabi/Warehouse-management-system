import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// Base API URL and endpoints
const API_BASE = "http://localhost:3000";
const LIST_URL = API_BASE + "/api/order/list";
const UPDATE_URL = (id) => API_BASE + "/api/order/update/" + id;
const DELETE_URL = (id) => API_BASE + "/api/order/delete/" + id;

/** Format number as Hungarian Forint with 2 digits
 * Returns "-" for non-finite inputs
 */
const formatPrice = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("hu-HU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Ft";
};

// Badge color by status
function badgeClass(status) {
  return status === "fulfilled"
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-yellow-100 text-yellow-800 border-yellow-200";
}

// Order fully fulfilled checker
const isFulfilledLocal = (order) => {
  if (order && order.derivedStatus) return order.derivedStatus === "fulfilled";
  if (order && Array.isArray(order._items)) return order._items.every((it) => it.status === "fulfilled");
  if (order && Array.isArray(order.items)) return order.items.every((it) => it.status === "fulfilled");
  return false;
};

const Orders = () => {
  const { user } = useAuth();
  const isAdmin = ((user && user.role) || "").toLowerCase() === "admin";

  // Data + UI state
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Authorization header from localStorage
  function getAuthHeaders() {
    const token = localStorage.getItem("pos-token") || localStorage.getItem("token");
    return token ? { Authorization: "Bearer " + token } : {};
  }

  // Load orders then normalize for editing and sort 
  async function loadOrders() {
    try {
      setLoading(true);
      const res = await axios.get(LIST_URL, { headers: getAuthHeaders() });
      if (res.data && res.data.success) {

        // Create a local _items array from populated products for editing
        const withLocal = (res.data.data || []).map((o) => ({
          ...o,
          _items: o.items.map((it) => ({
            product: (it.product && it.product._id) || it.product,
            name: (it.product && it.product.name) || "",
            sku: (it.product && it.product.sku) || "",
            price: typeof (it.product && it.product.price) === "number" ? it.product.price : null,
            qty: it.qty,
            status: it.status === "fulfilled" ? "fulfilled" : "pending",
          })),
        }));

        // Sort, pending first then by creation date, oldest date first
        withLocal.sort((a, b) => {
          const af = isFulfilledLocal(a) ? 1 : 0;
          const bf = isFulfilledLocal(b) ? 1 : 0;
          if (af !== bf) return af - bf;
          const ad = new Date(a.createdAt).getTime() || 0;
          const bd = new Date(b.createdAt).getTime() || 0;
          return ad - bd;
        });
        setOrders(withLocal);
      } else {
        alert((res.data && res.data.message) || "Failed to load orders.");
      }
    } catch (e) {
      alert((e.response && e.response.data && e.response.data.message) || "Server error while loading orders.");
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    loadOrders();
  }, []);

  // Change quantity in local state
  function onQtyChange(orderIndex, itemIndex, val) {
    setOrders((prev) => {
      const copy = prev.slice();
      const n = Math.max(1, Number(val) || 1);
      copy[orderIndex]._items[itemIndex].qty = n;
      return copy;
    });
  }

  // Toggle item found, pending or fulfilled in local state
  function onFoundToggle(orderIndex, itemIndex, checked) {
    setOrders((prev) => {
      const copy = prev.slice();
      copy[orderIndex]._items[itemIndex].status = checked ? "fulfilled" : "pending";
      return copy;
    });
  }

  // Persist current order edit to the server
  async function saveOrder(orderIndex) {
    const o = orders[orderIndex];
    if (!o || !o._id) return;
    try {
      setSavingId(o._id);
      const payload = {
        items: o._items.map((it) => ({
          product: it.product,
          qty: it.qty,
          status: it.status,
        })),
      };
      const res = await axios.put(UPDATE_URL(o._id), payload, { headers: getAuthHeaders() });
      if (res.data && res.data.success) {
        await loadOrders();
      } else {
        alert((res.data && res.data.message) || "Failed to update order.");
      }
    } catch (e) {
      alert((e.response && e.response.data && e.response.data.message) || "Server error while saving order.");
    } finally {
      setSavingId(null);
    }
  }

  // Delete order, only for admin
  async function deleteOrder(orderIndex) {
    if (!isAdmin) {
      alert("Only admin can delete orders.");
      return;
    }
    const o = orders[orderIndex];
    if (!o || !o._id) return;
    if (!window.confirm("Delete order #" + o.id + "?")) return;
    try {
      const res = await axios.delete(DELETE_URL(o._id), { headers: getAuthHeaders() });
      if (res.data && res.data.success) {
        loadOrders();
      } else {
        alert((res.data && res.data.message) || "Failed to delete order.");
      }
    } catch (e) {
      alert((e.response && e.response.data && e.response.data.message) || "Server error while deleting order.");
    }
  }

  // Client side search by order id or product name
  const filtered = orders.filter((o) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    if (String(o.id).indexOf(q) !== -1) return true;
    return o._items.some((it) => ((it.name || "") + "").toLowerCase().indexOf(q) !== -1);
  });

  return (
    <div className="w-full bg-gray-50 min-h-[calc(100vh-64px)] p-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Orders</h1>

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-sm text-gray-600">{loading ? "Loading…" : filtered.length + " orders"}</div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order ID or product name…"
          className="w-72 max-w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {filtered.map((o, oi) => (
        <div key={o._id} className="mb-4 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="text-base font-semibold text-gray-900">Order #{o.id}</div>
              <span className={"inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border " + badgeClass(o.derivedStatus || "pending")}>
                {(o.derivedStatus || "pending")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => saveOrder(oi)}
                disabled={savingId === o._id}
                className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {savingId === o._id ? "Saving..." : "Save"}
              </button>
              {isAdmin && (
                <button
                  onClick={() => deleteOrder(oi)}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          <div className="p-4">
            <div className="hidden md:grid grid-cols-12 text-xs uppercase tracking-wide text-gray-600 border-b border-gray-200 pb-2 mb-2">
              <div className="col-span-5">Product</div>
              <div className="col-span-2">SKU</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Found</div>
              <div className="col-span-1 text-right">Total</div>
            </div>

            <ul className="divide-y divide-gray-100">
              {o._items.map((it, ii) => (
                <li key={o._id + "-" + it.product + "-" + ii} className="py-3">
                  <div className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-12 md:col-span-5 min-w-0">
                      <div className="text-gray-900 font-medium truncate" title={it.name}>
                        {it.name || "(product)"}
                      </div>
                      <div className="text-xs text-gray-500">ID: {it.product}</div>
                    </div>

                    <div className="col-span-6 md:col-span-2 text-gray-700">{it.sku || "-"}</div>

                    <div className="col-span-6 md:col-span-2">
                      <input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) => onQtyChange(oi, ii, e.target.value)}
                        className="w-24 rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <label className="inline-flex items-center gap-2 text-gray-800">
                        <input
                          type="checkbox"
                          checked={it.status === "fulfilled"}
                          onChange={(e) => onFoundToggle(oi, ii, e.target.checked)}
                          className="size-4 accent-indigo-600"
                        />
                        <span className="text-sm">Found</span>
                      </label>
                    </div>

                    <div className="col-span-6 md:col-span-1 text-right text-gray-700">
                      {typeof (o.items && o.items[ii] && o.items[ii].product && o.items[ii].product.price) === "number"
                        ? formatPrice((it.qty || 0) * (o.items[ii].product.price || 0))
                        : "-"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-end text-sm text-gray-800">
              <span className="mr-2">Estimated total:</span>
              <strong>
                {o.items && o.items.every((x) => typeof (x.product && x.product.price) === "number")
                  ? formatPrice(
                    o._items.reduce((sum, it, idx) => {
                      const price = (o.items[idx] && o.items[idx].product && o.items[idx].product.price) || 0;
                      return sum + it.qty * price;
                    }, 0)
                  )
                  : "-"}
              </strong>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Orders;
