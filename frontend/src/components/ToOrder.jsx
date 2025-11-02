import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

// Base API URL and endpoint
const API_BASE = "http://localhost:3000";
const LIST_URL = API_BASE + "/api/toorder/list";
const ADD_SELECTION_URL = API_BASE + "/api/toorder/add-selection";
const UPDATE_URL = function (id) { return API_BASE + "/api/toorder/update/" + id; };
const DELETE_URL = function (id) { return API_BASE + "/api/toorder/delete/" + id; };

/** Format number as Hungarian Forint with 2 digits
 * Returns "-" for non-finite inputs
 */
const formatPrice = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("hu-HU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Ft";
};

const ToOrder = () => {
  const loc = useLocation();

  // Items optionally passed from Products
  const state = loc.state;
  const incoming = (state && state.items) || [];

  // Table rows, loading flags, filters
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [query, setQuery] = useState("");

  // Authorization header from localStorage
  function authHeader() {
    const token = localStorage.getItem("pos-token") || localStorage.getItem("token");
    return token ? { Authorization: "Bearer " + token } : {};
  }

  // Fetch current To-Order list
  async function loadList() {
    try {
      setLoading(true);
      const res = await axios.get(LIST_URL, { headers: authHeader() });
      if (res.data && res.data.success) {
        setRows((res.data && res.data.data) || []);
      } else {
        alert((res.data && res.data.message) || "Failed to load to-order list.");
      }
    } catch (e) {
      alert((e.response && e.response.data && e.response.data.message) || "Server error while loading list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    // If items came from Product page, bulk add them first, then refresh list
    async function pushIncoming() {
      if (!incoming || incoming.length === 0) {
        await loadList();
        return;
      }
      try {
        // Stock optional, backen upserts by product while status is pending
        // Backend supports bulk add via /add-selection
        await axios.post(
          ADD_SELECTION_URL,
          { ids: incoming.map(function (i) { return i.productId; }) },
          { headers: authHeader() }
        );
      } catch (e) {
        // If thex exist, upsert
      } finally {
        if (mounted) await loadList();
      }
    }

    pushIncoming();
    return function () { mounted = false; };
  }, []);

  // Text filter product, name, sku, category, warehouse and status
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(function (r) {
      const p = r && r.product ? r.product : {};
      const cat = (p && p.category && p.category.name) ? p.category.name : "";
      const wh = (p && p.warehouse && p.warehouse.name) ? p.warehouse.name : "";
      return (
        ((p.name || "") + "").toLowerCase().includes(q) ||
        ((p.sku || "") + "").toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        wh.toLowerCase().includes(q) ||
        (((r && r.status) || "") + "").toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  // Update row's local status selection
  function onStatusChange(rowIndex, value) {
    setRows(function (prev) {
      const copy = prev.slice();
      copy[rowIndex].status = value;
      return copy;
    });
  }

  // Persist status change for a row
  async function saveRow(rowIndex) {
    const row = rows[rowIndex];
    if (!row || !row._id) return;
    try {
      setSavingId(row._id);
      // Only status is editable
      const res = await axios.put(
        UPDATE_URL(row._id),
        { status: row.status },
        { headers: authHeader() }
      );
      if (res.data && res.data.success) {
        await loadList();
      } else {
        alert((res.data && res.data.message) || "Failed to update item.");
      }
    } catch (e) {
      alert((e.response && e.response.data && e.response.data.message) || "Server error while saving.");
    } finally {
      setSavingId(null);
    }
  }

  // Delete To-Order entry
  async function deleteRow(rowIndex) {
    const row = rows[rowIndex];
    if (!row || !row._id) return;
    const prodName = (row && row.product && row.product.name) || "";
    if (!window.confirm('Delete "' + prodName + '" from to-order?')) return;

    try {
      const res = await axios.delete(DELETE_URL(row._id), { headers: authHeader() });
      if (res.data && res.data.success) {
        await loadList();
      } else {
        alert((res.data && res.data.message) || "Failed to delete.");
      }
    } catch (e) {
      alert((e.response && e.response.data && e.response.data.message) || "Server error while deleting.");
    }
  }

  return (
    <div className="w-full bg-gray-50 min-h-[calc(100vh-64px)] p-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">To-Order</h1>

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-sm text-gray-600">
          {loading ? "Loading…" : (filtered.length + " items")}
        </div>
        <input
          type="text"
          value={query}
          onChange={function (e) { setQuery(e.target.value); }}
          placeholder="Search by name/SKU/category/warehouse/status…"
          className="w-72 max-w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Header, dedicated columns for status and actions */}
      <div className="hidden md:grid grid-cols-12 text-xs uppercase tracking-wide text-gray-600 border-b border-gray-200 pb-2 mb-2">
        <div className="col-span-2">Product</div>
        <div className="col-span-1">SKU</div>
        <div className="col-span-2">Category</div>
        <div className="col-span-2">Warehouse</div>
        <div className="col-span-1 text-right">Price</div>
        <div className="col-span-1 text-right">Stock</div>
        <div className="col-span-1 text-right">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Rows */}
      <ul className="divide-y divide-gray-100">
        {filtered.map(function (r, idx) {
          const p = (r && r.product) ? r.product : {};
          return (
            <li key={r._id} className="py-3 px-2 md:px-0">
              <div className="grid grid-cols-12 items-center gap-2">
                {/* Product */}
                <div className="col-span-12 md:col-span-2 min-w-0">
                  <div className="text-gray-900 font-medium truncate" title={(p && p.name) || ""}>
                    {(p && p.name) || "-"}
                  </div>
                </div>

                {/* SKU */}
                <div className="col-span-6 md:col-span-1 text-gray-700">{(p && p.sku) || "-"}</div>

                {/* Category */}
                <div className="col-span-6 md:col-span-2 text-gray-700">{(p && p.category && p.category.name) || "-"}</div>

                {/* Warehouse */}
                <div className="col-span-6 md:col-span-2 text-gray-700">{(p && p.warehouse && p.warehouse.name) || "-"}</div>

                {/* Price */}
                <div className="col-span-3 md:col-span-1 text-right text-gray-700">
                  {formatPrice(p && p.price)}
                </div>

                {/* Stock, display only */}
                <div className="col-span-3 md:col-span-1 text-right text-gray-900 font-medium">
                  {((p && p.stock) != null ? p.stock : 0)}
                </div>

                {/* Status select */}
                <div className="col-span-6 md:col-span-1 flex md:justify-end">
                  <select
                    value={(r && r.status) || "pending"}
                    onChange={function (e) { onStatusChange(idx, e.target.value); }}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">pending</option>
                    <option value="ordered">ordered</option>
                    <option value="received">received</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-3">
                  <button
                    onClick={function () { saveRow(idx); }}
                    disabled={savingId === (r && r._id)}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {savingId === (r && r._id) ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={function () { deleteRow(idx); }}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && !loading && (
        <div className="text-gray-600 text-sm py-8">No items.</div>
      )}
    </div>
  );
};

export default ToOrder;
