import { useEffect, useState } from "react";
import axios from "axios";

// Base API URL and endpoint
const API_BASE = "http://localhost:3000";
const LIST_URL = API_BASE + "/api/warehouse/list";
const ADD_URL = API_BASE + "/api/warehouse/add";
const UPDATE_URL = function (id) { return API_BASE + "/api/warehouse/update/" + id; };
const DELETE_URL = function (id) { return API_BASE + "/api/warehouse/delete/" + id; };
const WAREHOUSE_PRODUCTS_URL = function (id) { return API_BASE + "/api/warehouse/" + id + "/products"; };

const Warehouses = () => {

  // Form fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  // List and search
  const [warehouses, setWarehouses] = useState([]);
  const [query, setQuery] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editDocId, setEditDocId] = useState(null);

  // View panel state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewProducts, setViewProducts] = useState([]);
  const [viewWarehouseName, setViewWarehouseName] = useState("");

  // Authorization header from localStorage
  function getAuthHeaders() {
    const token = localStorage.getItem("pos-token") || localStorage.getItem("token");
    return token ? { Authorization: "Bearer " + token } : {};
  }

  // Fetch warehouses list
  async function loadWarehouses() {
    try {
      setLoadingList(true);
      const res = await axios.get(LIST_URL, { headers: getAuthHeaders() });
      if (res.data && res.data.success) {
        setWarehouses((res.data && res.data.data) || []);
      } else {
        alert((res.data && res.data.message) || "Failed to load warehouses.");
      }
    } catch (e) {
      alert((e.response && e.response.data && e.response.data.message) || "Server error while loading warehouses.");
    } finally {
      setLoadingList(false);
    }
  }

  // Initial load
  useEffect(() => {
    loadWarehouses();
  }, []);

  // Reset form and leave edit mode
  function resetForm() {
    setName("");
    setAddress("");
    setIsEditing(false);
    setEditDocId(null);
  }

  // Create or update a warehouse based on mode
  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      alert("Name is required.");
      return;
    }
    try {
      setSaving(true);

      if (!isEditing) {
        const res = await axios.post(ADD_URL, { name: name, address: address }, { headers: getAuthHeaders() });
        if (res.data && res.data.success) {
          resetForm();
          loadWarehouses();
        } else {
          alert((res.data && res.data.message) || "Failed to add warehouse.");
        }
      } else {
        if (!editDocId) {
          alert("Missing id for update.");
          return;
        }
        const res = await axios.put(UPDATE_URL(editDocId), { name: name, address: address }, { headers: getAuthHeaders() });
        if (res.data && res.data.success) {
          resetForm();
          loadWarehouses();
        } else {
          alert((res.data && res.data.message) || "Failed to update warehouse.");
        }
      }
    } catch (e) {
      alert((e.response && e.response.data && e.response.data.message) || "Server error while saving.");
    } finally {
      setSaving(false);
    }
  }

  // Enter edit mode and prefill form
  function startEdit(w) {
    setEditDocId((w && w._id) || null);
    setName((w && w.name) || "");
    setAddress((w && w.address) || "");
    setIsEditing(true);
  }


  // Cancel edit and clear form
  function cancelEdit() {
    resetForm();
  }

  // Delete a warehouse and handle panel cleanup
  async function handleDelete(w) {
    const id = w && w._id;
    if (!id) return;
    if (!window.confirm("Delete warehouse: " + ((w && w.name) || "") + "?")) return;
    try {
      const res = await axios.delete(DELETE_URL(id), { headers: getAuthHeaders() });
      if (res.data && res.data.success) {
        if (isEditing && editDocId === id) resetForm();
        if (viewOpen && viewWarehouseName === ((w && w.name) || "")) {
          setViewOpen(false);
          setViewProducts([]);
          setViewWarehouseName("");
        }
        loadWarehouses();
      } else {
        alert((res.data && res.data.message) || "Failed to delete warehouse.");
      }
    } catch (e) {
      alert((e.response && e.response.data && e.response.data.message) || "Server error while deleting.");
    }
  }

  // Open view panel and load products
  async function handleView(w) {
    if (!w || !w._id) return;
    try {
      setViewLoading(true);
      setViewWarehouseName((w && w.name) || "");
      setViewOpen(true);
      const res = await axios.get(WAREHOUSE_PRODUCTS_URL(w._id), { headers: getAuthHeaders() });
      if (res.data && res.data.success) {
        setViewProducts((res.data && res.data.data) || []);
      } else {
        setViewProducts([]);
        alert((res.data && res.data.message) || "Failed to load products.");
      }
    } catch (e) {
      setViewProducts([]);
      alert((e.response && e.response.data && e.response.data.message) || "Server error while loading products.");
    } finally {
      setViewLoading(false);
    }
  }

  // Close view panel and reset its state
  function closeView() {
    setViewOpen(false);
    setViewProducts([]);
    setViewWarehouseName("");
  }

  // Simple keyword filter
  const filtered = warehouses.filter(function (w) {
    const q = (query || "").toLowerCase();
    return (
      String(((w && w.id) || "")).includes(q) ||
      (((w && w.name) || "") + "").toLowerCase().includes(q) ||
      (((w && w.address) || "") + "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full bg-gray-50 min-h-[calc(100vh-64px)] p-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Warehouse Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left form */}
        <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {isEditing ? "Edit Warehouse" : "Add Warehouse"}
          </h2>
          <p className="text-sm text-gray-700 mb-4">
            Name is required; address is optional.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-800 mb-1">Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={function (e) { setName(e.target.value); }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-800 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={function (e) { setAddress(e.target.value); }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                {saving ? (isEditing ? "Saving..." : "Adding...") : (isEditing ? "Save" : "Add Warehouse")}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Right list */}
        <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Warehouses</h2>
            <input
              type="text"
              value={query}
              onChange={function (e) { setQuery(e.target.value); }}
              placeholder="Search by ID/name/address…"
              className="w-56 max-w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 text-xs uppercase tracking-wide text-gray-600 border-b border-gray-200 pb-2 mb-2">
            <div className="col-span-1">ID</div>
            <div className="col-span-4">Name</div>
            <div className="col-span-4">Address</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          {loadingList ? (
            <div className="text-gray-700 text-sm py-6">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-700 text-sm py-6">No warehouses found.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filtered.map(function (w) {
                return (
                  <li key={(w && w._id) || w.id} className="py-3">
                    <div className="grid grid-cols-12 items-center gap-2 min-w-0">
                      <div className="col-span-12 sm:col-span-1 text-gray-900">{w && w.id}</div>

                      <div className="col-span-12 sm:col-span-4 text-gray-900 font-medium min-w-0">
                        <span className="block truncate" title={((w && w.name) || "")}>{(w && w.name) || ""}</span>
                      </div>

                      <div className="col-span-12 sm:col-span-4 text-gray-700 min-w-0 pr-2">
                        <span className="block truncate" title={((w && w.address) || "")}>{(w && w.address) || "-"}</span>
                      </div>

                      <div className="col-span-12 sm:col-span-3 flex sm:justify-end gap-2 mt-2 sm:mt-0 pr-2 md:pr-4 shrink-0 whitespace-nowrap">
                        <button
                          className="rounded-md border border-gray-300 bg-white px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-800 hover:bg-gray-50"
                          onClick={function () { startEdit(w); }}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-md bg-red-600 px-2 sm:px-3 py-1 text-xs sm:text-sm text-white hover:bg-red-500"
                          onClick={function () { handleDelete(w); }}
                        >
                          Delete
                        </button>
                        <button
                          className="rounded-md bg-gray-800 px-2 sm:px-3 py-1 text-xs sm:text-sm text-white hover:bg-gray-700"
                          onClick={function () { handleView(w); }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* View panel, products in selected warehouse */}
          {viewOpen && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">
                  Products in: <span className="font-bold">{viewWarehouseName}</span>
                </h3>
                <button
                  onClick={closeView}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-800 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              {viewLoading ? (
                <div className="text-gray-700 text-sm py-4">Loading products…</div>
              ) : viewProducts.length === 0 ? (
                <div className="text-gray-700 text-sm py-4">No products found in this warehouse.</div>
              ) : (
                <>
                  <div className="hidden md:grid grid-cols-12 text-xs uppercase tracking-wide text-gray-600 border-b border-gray-200 pb-2 mb-2">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-2">SKU</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-2">Stock</div>
                    <div className="col-span-2">Category</div>
                  </div>

                  <ul className="divide-y divide-gray-200">
                    {viewProducts.map(function (p) {
                      return (
                        <li key={p && p._id} className="py-3">
                          <div className="grid grid-cols-12 items-start gap-2">
                            <div className="col-span-12 md:col-span-4 text-gray-900 font-medium">{(p && p.name) || ""}</div>
                            <div className="col-span-6 md:col-span-2 text-gray-700">{(p && p.sku) || ""}</div>
                            <div className="col-span-6 md:col-span-2 text-gray-700">
                              {typeof (p && p.price) === "number" ? ((p && p.price) + " Ft") : (p && p.price)}
                            </div>
                            <div className="col-span-6 md:col-span-2 text-gray-700">{(p && p.stock) || 0}</div>
                            <div className="col-span-6 md:col-span-2 text-gray-700">
                              {(p && p.category && p.category.name)
                                ? ((p.category.name) + " (#" + ((p.category && p.category.id) || "") + ")")
                                : "-"}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Warehouses;
