import { useEffect, useState } from "react";
import axios from "axios";

// Base API URL and endpoint, :i = MongoDB _id
const API_BASE = "http://localhost:3000";
const LIST_URL   = API_BASE + "/api/user/list";
const ADD_URL    = API_BASE + "/api/user/add";
const UPDATE_URL = function (id) { return API_BASE + "/api/user/update/" + id; };
const DELETE_URL = function (id) { return API_BASE + "/api/user/delete/" + id; };

const Users = () => {
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // optional on edit
  const [role, setRole] = useState("employee");
  const [shift, setShift] = useState("morning");

  // List and search
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editDocId, setEditDocId] = useState(null); // Mongo _id

  // Authorization header from localStorage
  function getAuthHeaders() {
    const token = localStorage.getItem("pos-token") || localStorage.getItem("token");
    return token ? { Authorization: "Bearer " + token } : {};
  }

  // Fetch users list
  async function loadUsers() {
    try {
      setLoadingList(true);
      const res = await axios.get(LIST_URL, { headers: getAuthHeaders() });
      if (res.data && res.data.success) {
        setUsers((res.data && res.data.data) || []);
      } else {
        alert((res.data && res.data.message) || "Failed to load users.");
      }
    } catch (err) {
      alert((err.response && err.response.data && err.response.data.message) || "Server error while loading users.");
    } finally {
      setLoadingList(false);
    }
  }

  // Initial load
  useEffect(() => {
    loadUsers();
  }, []);

  // Reset form and exit edit mode
  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("employee");
    setShift("morning");
    setIsEditing(false);
    setEditDocId(null);
  }

  // Create or update a user based on mode
  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert("Name and email are required.");
      return;
    }
    if (!isEditing && !password.trim()) {
      alert("Password is required for new users.");
      return;
    }

    try {
      setSaving(true);

      if (!isEditing) {
        // Create
        const payload = { name: name, email: email, password: password, role: role, shift: shift };
        const res = await axios.post(ADD_URL, payload, { headers: getAuthHeaders() });
        if (res.data && res.data.success) {
          resetForm();
          loadUsers();
        } else {
          alert((res.data && res.data.message) || "Failed to add user.");
        }
      } else {
        // Update
        if (!editDocId) {
          alert("Missing user id for update.");
          return;
        }
        // Password is optional on edit
        const payload = { name: name, email: email, role: role, shift: shift };
        if (password.trim()) {
          payload.password = password.trim();
        }
        const res = await axios.put(UPDATE_URL(editDocId), payload, { headers: getAuthHeaders() });
        if (res.data && res.data.success) {
          resetForm();
          loadUsers();
        } else {
          alert((res.data && res.data.message) || "Failed to update user.");
        }
      }
    } catch (err) {
      alert((err.response && err.response.data && err.response.data.message) || "Server error while saving.");
    } finally {
      setSaving(false);
    }
  }

  // Enter edit mode and prefill form with selected user
  function startEdit(u) {
    setEditDocId((u && u._id) || null); // uses MongoDB _id
    setName((u && u.name) || "");
    setEmail((u && u.email) || "");
    setPassword(""); // empty by default, unchanged if left blank
    setRole((u && u.role) || "employee");
    setShift((u && u.shift) || "morning");
    setIsEditing(true);
  }

  // Cancel edit and clear form
  function cancelEdit() {
    resetForm();
  }

  // Delete a user by id
  async function handleDelete(u) {
    const idForDelete = u && u._id;
    if (!idForDelete) {
      alert("Missing id for delete.");
      return;
    }
    if (!window.confirm("Delete user: " + ((u && u.name) || "") + " (" + ((u && u.email) || "") + ") ?")) {
      return;
    }
    try {
      const res = await axios.delete(DELETE_URL(idForDelete), { headers: getAuthHeaders() });
      if (res.data && res.data.success) {
        if (isEditing && editDocId === idForDelete) resetForm();
        loadUsers();
      } else {
        alert((res.data && res.data.message) || "Failed to delete user.");
      }
    } catch (err) {
      alert((err.response && err.response.data && err.response.data.message) || "Server error while deleting.");
    }
  }

  // Simple keyword filter across multiple fields
  const filtered = users.filter(function (u) {
    const q = (query || "").toLowerCase();
    return (
      (((u && u.name) || "") + "").toLowerCase().includes(q) ||
      (((u && u.email) || "") + "").toLowerCase().includes(q) ||
      (((u && u.role) || "") + "").toLowerCase().includes(q) ||
      (((u && u.shift) || "") + "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full bg-gray-50 min-h-[calc(100vh-64px)] p-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">User Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left form */}
        <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {isEditing ? "Edit User" : "Add User"}
          </h2>
          <p className="text-sm text-gray-700 mb-4">
            {isEditing
              ? "Modify fields and save. Leave password empty to keep it unchanged."
              : "Name, email and password are required. Role & shift can be adjusted."}
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
              <label className="block text-sm text-gray-800 mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={function (e) { setEmail(e.target.value); }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-800 mb-1">
                {isEditing ? "Password (leave empty to keep old)" : "Password *"}
              </label>
              <input
                type="password"
                value={password}
                onChange={function (e) { setPassword(e.target.value); }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required={!isEditing}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-800 mb-1">Role</label>
                <select
                  value={role}
                  onChange={function (e) { setRole(e.target.value); }}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="admin">admin</option>
                  <option value="employee">employee</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-800 mb-1">Shift</label>
                <select
                  value={shift}
                  onChange={function (e) { setShift(e.target.value); }}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="morning">morning</option>
                  <option value="afternoon">afternoon</option>
                  <option value="night">night</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                {saving ? (isEditing ? "Saving..." : "Adding...") : (isEditing ? "Save" : "Add User")}
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
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            <input
              type="text"
              value={query}
              onChange={function (e) { setQuery(e.target.value); }}
              placeholder="Search by name/email/role/shift…"
              className="w-56 max-w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="hidden sm:grid grid-cols-12 text-xs uppercase tracking-wide text-gray-600 border-b border-gray-200 pb-2 mb-2">
            <div className="col-span-3">Name</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-1">Shift</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {loadingList ? (
            <div className="text-gray-700 text-sm py-6">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-700 text-sm py-6">No users found.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filtered.map(function (u) {
                return (
                  <li key={u && u._id} className="py-3">
                    <div className="grid grid-cols-12 items-start gap-2">
                      <div className="col-span-12 sm:col-span-3 text-gray-900 font-medium">{(u && u.name) || ""}</div>
                      <div className="col-span-12 sm:col-span-4 text-gray-700">{(u && u.email) || ""}</div>
                      <div className="col-span-6 sm:col-span-2 text-gray-700">{(u && u.role) || ""}</div>
                      <div className="col-span-6 sm:col-span-1 text-gray-700">{(u && u.shift) || ""}</div>
                      <div className="col-span-12 sm:col-span-2 flex sm:justify-end gap-2 mt-2 sm:mt-0">
                        <button
                          className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-800 hover:bg-gray-50"
                          onClick={function () { startEdit(u); }}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-500"
                          onClick={function () { handleDelete(u); }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default Users;
