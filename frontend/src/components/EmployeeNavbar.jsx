import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { TiShoppingBag, TiShoppingCart, TiCog } from "react-icons/ti";
import { MdOutlineLogout } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import adminIcon from "../assets/icons/adminprof.png";
import employeeIcon from "../assets/icons/employeeprof.png";
import nouserIcon from "../assets/icons/nouserprof.png";

// Base API URL
const API_BASE = "http://localhost:3000";


// Tailwind class presets for navlinks
const linkBase = "rounded-md px-3 py-2 text-sm font-medium transition flex items-center gap-2";
const linkInactive = "text-gray-300 hover:bg-white/5 hover:text-white";
const linkActive = "bg-gray-950/50 text-white";

const EmployeeNavbar = () => {
  const navigate = useNavigate();

  // Read auth state from context
  const auth = useAuth() || {};
  const user = auth.user;
  const token = auth.token;
  const ctxLogout = auth.logout;

  // Pick avatar icon based on role
  const role = (((user && user.role) || "") + "").toLowerCase();
  const iconSrc = role === "admin" ? adminIcon : (role === "employee" ? employeeIcon : nouserIcon);

  // Profile dialog visibility
  const [showProfile, setShowProfile] = useState(false);

  // Close profile dialog when pressing escape
  useEffect(() => {
    function onEsc(e) {
      if (e.key === "Escape") setShowProfile(false);
    }
    if (showProfile) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [showProfile]);


  // Build authorization header if have a token
  function getAuthHeader() {
    return token ? { Authorization: "Bearer " + token } : {};
  }

  // Logout, ping API, clear auth, redirect to /login
  async function handleLogout() {
    try {
      await axios.post(API_BASE + "/api/auth/logout", null, { headers: getAuthHeader() });
    } catch (e) {
      // Intentionally ignore API errors
    } finally {
      if (typeof ctxLogout === "function") {
        ctxLogout();
      } else {
        localStorage.removeItem("pos-user");
        localStorage.removeItem("pos-token");
      }
      navigate("/login", { replace: true });
    }
  }

  // Employee menu entries
  const menuItems = [
    { name: "Products", path: "/employee-dashboard/products", icon: <TiShoppingBag /> },
    { name: "Orders", path: "/employee-dashboard/orders", icon: <TiShoppingCart /> },
  ];

  // Hide mobile menu
  function closeMobileMenu() {
    const cb = document.getElementById("emp-nav-toggle");
    if (cb) cb.checked = false;
  }

  return (
    <>
      <nav className="relative bg-gray-800/50 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10">

        {/*Mobile menu toggle */}
        <input id="emp-nav-toggle" type="checkbox" className="peer sr-only" />

        <div className="px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            {/* Left menu toggle + brand */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="emp-nav-toggle"
                className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500 cursor-pointer"
                aria-label="Open main menu"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6">
                  <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </label>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-white text-lg font-bold">Employee</span>
                <span className="sm:hidden text-white font-semibold">EMP</span>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="hidden sm:block">
              <div className="flex space-x-1">
                {menuItems.map(function (item) {
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className={function (args) {
                        return linkBase + " " + (args.isActive ? linkActive : linkInactive);
                      }}
                      end
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.name}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Profile dropdown */}
            <div className="flex items-center">
              <details className="relative group ml-1">
                <summary className="list-none cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                  <img
                    src={iconSrc}
                    alt="User avatar"
                    className="size-8 rounded-full bg-gray-800 outline -outline-offset-1 outline-white/10"
                  />
                </summary>
                <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-gray-800 py-1 outline -outline-offset-1 outline-white/10 shadow-lg hidden group-open:block">
                  <button
                    type="button"
                    onClick={function () { setShowProfile(true); }}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                  >
                    Your profile
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                  >
                    Logout
                  </button>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="hidden sm:hidden peer-checked:block px-2 pt-2 pb-3">
          {menuItems.map(function (item) {
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={function (args) {
                  return "block rounded-md px-3 py-2 text-base font-medium flex items-center gap-2 " +
                    (args.isActive ? "bg-gray-950/50 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white");
                }}
                onClick={closeMobileMenu}
                end
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={function () {
              setShowProfile(true);
              closeMobileMenu();
            }}
            className="w-full text-left block rounded-md px-3 py-2 text-base font-medium flex items-center gap-2 text-gray-300 hover:bg-white/5 hover:text-white"
          >
            <span className="text-lg"><TiCog /></span>
            Your profile
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left block rounded-md px-3 py-2 text-base font-medium flex items-center gap-2 text-gray-300 hover:bg-white/5 hover:text-white"
          >
            <span className="text-lg"><MdOutlineLogout /></span>
            Logout
          </button>
        </div>
      </nav>

      {/* Profile dialog */}
      {showProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
          onClick={function () { setShowProfile(false); }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 w-[90%] max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={function (e) { e.stopPropagation(); }}
          >
            <div className="flex justify-center">
              <img src={iconSrc} alt="Profile" className="size-20 rounded-full border border-gray-200" />
            </div>

            <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">
              {(user && user.name) || "User"}
            </h3>
            <p className="mt-1 text-center text-sm text-gray-600">{(user && user.email) || "-"}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="text-gray-500">Role</div>
              <div className="text-gray-900 font-medium">{(user && user.role) || "-"}</div>

              <div className="text-gray-500">Shift</div>
              <div className="text-gray-900 font-medium">{(user && user.shift) || "-"}</div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={function () { setShowProfile(false); }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeNavbar;
