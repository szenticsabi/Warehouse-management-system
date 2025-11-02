import { useEffect, useState } from "react";
import axios from "axios";

// Base API URL and endpoints
const API_BASE = "http://localhost:3000";
const LIST_URL = API_BASE + "/api/category/list";
const ADD_URL = API_BASE + "/api/category/add";
const UPDATE_URL = (id) => API_BASE + "/api/category/update/" + id;
const DELETE_URL = (id) => API_BASE + "/api/category/delete/" + id;
const CAT_PRODUCTS_URL = (id) => API_BASE + "/api/category/" + id + "/products";

const Categories = () => {

  // Form state
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  // Data and UI state
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editDocId, setEditDocId] = useState(null);

  // View panel state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewProducts, setViewProducts] = useState([]);
  const [viewCategoryName, setViewCategoryName] = useState("");


  // Build authorization header from localStorage tokens
  function getAuthHeaders() {
    const token = localStorage.getItem("pos-token") || localStorage.getItem("token");
    return token ? { Authorization: "Bearer " + token } : {};
  }

  // Fetch all categories
  async function loadCategories() {
    try {
      setLoadingList(true);
      const res = await axios.get(LIST_URL, { headers: getAuthHeaders() });
      if (res.data && res.data.success) {
        setCategories(res.data.data || []);
      } else {
        alert((res.data && res.data.message) || "Failed to load categories.");
      }
    } catch (err) {
      const msg = (err.response && err.response.data && err.response.data.message) || "Server error while loading categories.";
      alert(msg);
    } finally {
      setLoadingList(false);
    }
  }

  // Initial load
  useEffect(() => {
    loadCategories();
  }, []);

  // Reset form and edit flags
  function resetForm() {
    setCategoryName("");
    setCategoryDescription("");
    setIsEditing(false);
    setEditDocId(null);
  }


  // Create or update a category based on isEditing
  async function handleSubmit(e) {
    e.preventDefault();
    if (!categoryName.trim()) {
      alert("Name is required.");
      return;
    }
    try {
      setSaving(true);
      if (!isEditing) {

        // Create a category
        const payload = { categoryName: categoryName, categoryDescription: categoryDescription };
        const res = await axios.post(ADD_URL, payload, { headers: getAuthHeaders() });
        if (res.data && res.data.success) {
          resetForm();
          loadCategories();
        } else {
          alert((res.data && res.data.message) || "Failed to add category.");
        }
      } else {

        // Update a category
        if (!editDocId) {
          alert("Missing id for update.");
          return;
        }
        const payload = { categoryName: categoryName, categoryDescription: categoryDescription };
        const res = await axios.put(UPDATE_URL(editDocId), payload, { headers: getAuthHeaders() });
        if (res.data && res.data.success) {
          resetForm();
          loadCategories();
        } else {
          alert((res.data && res.data.message) || "Failed to update category.");
        }
      }
    } catch (err) {
      const msg = (err.response && err.response.data && err.response.data.message) || "Server error while saving.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  // Enter edit mode and populate form fields from selected category
  function startEdit(cat) {
    setEditDocId(cat && (cat._id || null));
    setCategoryName((cat && cat.name) || "");
    setCategoryDescription((cat && cat.description) || "");
    setIsEditing(true);
  }

  // Leave edit mode and clear form
  function cancelEdit() {
    resetForm();
  }

  // Delete a category then refresh the list
  async function handleDelete(cat) {
    const idForDelete = cat && cat._id;
    if (!idForDelete) {
      alert("Missing id for delete.");
      return;
    }
    if (!window.confirm("Delete category: " + ((cat && cat.name) || "") + "?")) return;
    try {
      const res = await axios.delete(DELETE_URL(idForDelete), { headers: getAuthHeaders() });
      if (res.data && res.data.success) {
        if (isEditing && editDocId === idForDelete) resetForm();
        if (viewOpen && viewCategoryName === ((cat && cat.name) || "")) {
          setViewOpen(false);
          setViewProducts([]);
          setViewCategoryName("");
        }
        loadCategories();
      } else {
        alert((res.data && res.data.message) || "Failed to delete category.");
      }
    } catch (err) {
      const msg = (err.response && err.response.data && err.response.data.message) || "Server error while deleting.";
      alert(msg);
    }
  }

  // Open the side panel and load products for selected category
  async function handleView(cat) {
    if (!(cat && cat._id)) return;
    try {
      setViewLoading(true);
      setViewCategoryName((cat && cat.name) || "");
      setViewOpen(true);
      const res = await axios.get(CAT_PRODUCTS_URL(cat._id), { headers: getAuthHeaders() });
      if (res.data && res.data.success) {
        setViewProducts(res.data.data || []);
      } else {
        setViewProducts([]);
        alert((res.data && res.data.message) || "Failed to load products.");
      }
    } catch (err) {
      setViewProducts([]);
      const msg = (err.response && err.response.data && err.response.data.message) || "Server error while loading products.";
      alert(msg);
    } finally {
      setViewLoading(false);
    }
  }

  // Close the view panel
  function closeView() {
    setViewOpen(false);
    setViewProducts([]);
    setViewCategoryName("");
  }

  // Client side filtering by id, name and description
  const filtered = categories.filter((c) => {
    const q = query.toLowerCase();
    const idStr = String((c && c.id) || "");
    const nameStr = ((c && c.name) || "").toLowerCase();
    const descStr = ((c && c.description) || "").toLowerCase();
    return idStr.includes(q) || nameStr.includes(q) || descStr.includes(q);
  });

  return (
    <div className="w-full bg-gray-50 min-h-[calc(100vh-64px)] p-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Category Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{isEditing ? "Edit Category" : "Add Category"}</h2>
          <p className="text-sm text-gray-700 mb-4">Name is required; description is optional.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-800 mb-1">Category Name *</label>
              <input
                type="text"
                required
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Electronics"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-800 mb-1">Category Description</label>
              <textarea
                rows={3}
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Short summary (optional)"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                {saving ? (isEditing ? "Saving..." : "Adding...") : isEditing ? "Save" : "Add Category"}
              </button>

              {isEditing ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID/name/description…"
              className="w-56 max-w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="hidden sm:grid grid-cols-12 text-xs uppercase tracking-wide text-gray-600 border-b border-gray-200 pb-2 mb-2">
            <div className="col-span-1">ID</div>
            <div className="col-span-3">Name</div>
            <div className="col-span-5">Description</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          {loadingList ? (
            <div className="text-gray-700 text-sm py-6">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-700 text-sm py-6">No categories found.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filtered.map((c) => (
                <li key={(c && c._id) || (c && c.id)} className="py-3">
                  <div className="grid grid-cols-12 items-center gap-2 min-w-0">
                    <div className="col-span-12 sm:col-span-1 text-gray-900">{c && c.id}</div>

                    <div className="col-span-12 sm:col-span-3 text-gray-900 font-medium min-w-0">
                      <span className="block truncate" title={(c && c.name) || ""}>
                        {(c && c.name) || ""}
                      </span>
                    </div>

                    <div className="col-span-12 sm:col-span-5 text-gray-700 min-w-0 pr-2">
                      <span className="block truncate" title={(c && c.description) || ""}>
                        {(c && c.description) || "-"}
                      </span>
                    </div>

                    <div className="col-span-12 sm:col-span-3 flex sm:justify-end gap-2 mt-2 sm:mt-0 shrink-0 whitespace-nowrap">
                      <button
                        className="rounded-md border border-gray-300 bg-white px-2 sm:px-3 py-1 text-sx sm:text-sm text-gray-800 hover:bg-gray-50"
                        onClick={() => startEdit(c)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-md bg-red-600 px-2 sm:px-3 py-1 text-sx sm:text-sm text-white hover:bg-red-500"
                        onClick={() => handleDelete(c)}
                      >
                        Delete
                      </button>
                      <button
                        className="rounded-md bg-gray-800 px-2 sm:px-3 py-1 text-sx sm:text-sm text-white hover:bg-gray-700"
                        onClick={() => handleView(c)}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {viewOpen ? (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">
                  Products in: <span className="font-bold">{viewCategoryName}</span>
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
                <div className="text-gray-700 text-sm py-4">No products found in this category.</div>
              ) : (
                <>
                  <div className="hidden md:grid grid-cols-12 text-xs uppercase tracking-wide text-gray-600 border-b border-gray-200 pb-2 mb-2">
                    <div className="col-span-3">Name</div>
                    <div className="col-span-2">SKU</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-2">Stock</div>
                    <div className="col-span-3">Warehouse</div>
                  </div>

                  <ul className="divide-y divide-gray-200">
                    {viewProducts.map((p) => (
                      <li key={p._id} className="py-3">
                        <div className="grid grid-cols-12 items-start gap-2">
                          <div className="col-span-12 md:col-span-3 text-gray-900 font-medium">{p.name}</div>
                          <div className="col-span-6 md:col-span-2 text-gray-700">{p.sku}</div>
                          <div className="col-span-6 md:col-span-2 text-gray-700">
                            {typeof p.price === "number" ? p.price + " Ft" : p.price}
                          </div>
                          <div className="col-span-6 md:col-span-2 text-gray-700">{p.stock}</div>
                          <div className="col-span-6 md:col-span-3 text-gray-700">
                            {(p.warehouse && p.warehouse.name) || "-"}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default Categories;
