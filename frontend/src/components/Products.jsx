import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

// Base API URL and endpoint
const API_BASE = "http://localhost:3000";
const LIST_URL = API_BASE + "/api/product/list";
const TOORDER_ADD_URL = API_BASE + "/api/toorder/add-selection";

/** Format number as Hungarian Forint with 2 digits
 * Returns "-" for non-finite inputs
 */
const formatPrice = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("hu-HU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Ft";
};

const Products = () => {

  // Server date and loading state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search query and checkbox selection { productId: true }
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState({});

  // Submit feedback states
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");

  // Authorization header from localStorage
  function getAuthHeaders() {
    const token = localStorage.getItem("pos-token") || localStorage.getItem("token");
    return token ? { Authorization: "Bearer " + token } : {};
  }

  // Load all products populated with category and warehouse, reset selections
  async function loadProducts() {
    try {
      setLoading(true);
      const res = await axios.get(LIST_URL, { headers: getAuthHeaders() });
      if (res.data && res.data.success) {
        const list = (res.data && res.data.data) || [];
        setProducts(list);
        setSelected({});
      } else {
        alert((res.data && res.data.message) || "Failed to load products.");
      }
    } catch (e) {
      alert((e.response && e.response.data && e.response.data.message) || "Server error while loading products.");
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    loadProducts();
  }, []);


  // Client side filter by name, sku, category or warehouse
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return products;
    return products.filter(function (p) {
      const name = (p && p.name) ? p.name : "";
      const sku = (p && p.sku) ? p.sku : "";
      const cat = (p && p.category && p.category.name) ? p.category.name : "";
      const wh = (p && p.warehouse && p.warehouse.name) ? p.warehouse.name : "";
      return (
        name.toLowerCase().includes(q) ||
        sku.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        wh.toLowerCase().includes(q)
      );
    });
  }, [products, query]);

  // Toggle single product selection
  const toggleOne = (id) => {
    setSelected(function (prev) {
      return Object.assign({}, prev, { [id]: !prev[id] });
    });
  };

  // Toggle all currently visible products
  const toggleAllVisible = (checked) => {
    const map = Object.assign({}, selected);
    filtered.forEach(function (p) {
      map[p._id] = !!checked;
    });
    setSelected(map);
  };

  // Send selected product ids to to-Order
  const sendToToOrder = async () => {
    const picked = filtered.filter(function (p) { return selected[p._id]; });
    if (picked.length === 0) {
      alert("Select at least one product.");
      return;
    }

    try {
      setSending(true);

      // Simple payload, only MongoDB _id values
      const ids = picked.map(function (p) { return p._id; });

      const res = await axios.post(
        TOORDER_ADD_URL,
        { ids: ids },
        { headers: getAuthHeaders() }
      );

      if (res.data && res.data.success) {
        setSelected({});
        setToast((res.data && res.data.message) || "Items sent to To-Order.");
        setTimeout(function () { setToast(""); }, 2500);
      } else {
        alert((res.data && res.data.message) || "Failed to send to To-Order.");
      }
    } catch (e) {
      alert((e.response && e.response.data && e.response.data.message) || "Server error while sending to To-Order.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full bg-gray-50 min-h-[calc(100vh-64px)] p-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Products</h1>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div className="text-sm text-gray-600">
          {loading ? "Loading…" : (filtered.length + " products")}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={function (e) { setQuery(e.target.value); }}
            placeholder="Search by name/SKU/category/warehouse…"
            className="w-72 max-w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={sendToToOrder}
            disabled={sending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send to To-Order"}
          </button>
        </div>
      </div>

      {/* Success toast */}
      {toast && (
        <div className="mb-3 rounded-md bg-green-50 border border-green-200 text-green-800 px-3 py-2 text-sm">
          {toast}
        </div>
      )}

      {/* Table header row */}
      <div className="hidden md:grid grid-cols-12 text-xs uppercase tracking-wide text-gray-600 border-b border-gray-200 pb-2 mb-2">
        <div className="col-span-3">Name</div>
        <div className="col-span-2">SKU</div>
        <div className="col-span-2">Category</div>
        <div className="col-span-2">Warehouse</div>
        <div className="col-span-1 text-right">Price</div>
        <div className="col-span-1 text-right">Stock</div>
        <div className="col-span-1 text-right">
          <label className="inline-flex items-center gap-2 justify-end w-full">
            <input
              type="checkbox"
              onChange={function (e) { toggleAllVisible(e.target.checked); }}
              className="size-4 accent-indigo-600"
            />
            <span className="hidden lg:inline">Select</span>
          </label>
        </div>
      </div>

      <ul className="divide-y divide-gray-100">
        {filtered.map(function (p) {
          const low = ((p && p.stock) || 0) <= 5;
          var rowClass = "py-3 px-2 md:px-0";
          if (low) rowClass += " bg-red-100/80 ring-1 ring-red-200";

          var stockColor = "text-gray-700";
          if (low) stockColor = "text-red-700";

          return (
            <li
              key={p._id}
              className={rowClass}
            >
              <div className="grid grid-cols-12 items-center gap-2">
                {/* Product name */}
                <div className="col-span-12 md:col-span-3 min-w-0 order-1">
                  <div className="text-gray-900 font-medium truncate" title={(p && p.name) || ""}>
                    {(p && p.name) || ""}
                  </div>
                </div>

                {/* SKU */}
                <div className="col-span-6 md:col-span-2 text-gray-700 order-2">
                  {(p && p.sku) || ""}
                </div>

                {/* Category */}
                <div className="col-span-6 md:col-span-2 text-gray-700 order-3">
                  {(p && p.category && p.category.name) || "-"}
                </div>

                {/* Warehouse */}
                <div className="col-span-6 md:col-span-2 text-gray-700 order-4">
                  {(p && p.warehouse && p.warehouse.name) || "-"}
                </div>

                {/* Price */}
                <div className="col-span-3 md:col-span-1 text-right text-gray-700 order-5">
                  {formatPrice(p && p.price)}
                </div>

                {/* Stock */}
                <div className={"col-span-3 md:col-span-1 text-right font-semibold order-6 " + stockColor}>
                  {((p && p.stock) != null ? p.stock : 0)}
                </div>

                {/* Select checkbox */}
                <div className="col-span-6 md:col-span-1 flex md:justify-end order-7">
                  <input
                    type="checkbox"
                    checked={!!selected[p._id]}
                    onChange={function () { toggleOne(p._id); }}
                    className="size-4 accent-indigo-600"
                    aria-label={"Select " + (((p && p.name) || "") + "")}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Empty state */}
      {filtered.length === 0 && !loading && (
        <div className="text-gray-600 text-sm py-8">No products found.</div>
      )}
    </div>
  );
};

export default Products;
