import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Normalize the 'requireRole' prop to a lowercase array
 * string -> [string]
 * array -> array of lowercase strings
 */
function normalizeRoles(requireRole) {
  // No role requirement
  if (!requireRole) return null;
  if (Array.isArray(requireRole)) {
    return requireRole.map(function (r) { return String(r).toLowerCase(); });
  }
  return [String(requireRole).toLowerCase()];
}

/** Protected routes
 * If user is unknown yet, render nothing
 * If unauthenticated, redirect to /login
 * IF role required and user lacks it, redirect to /unauthorized
 * Otherwise render children
 */
const ProtectedRoutes = ({ children, requireRole }) => {
  const auth = useAuth() || {};
  const user = auth.user;
  const location = useLocation();

  // User not resolved yet, avoid UI flicker
  if (user === undefined) return null;

  // Not logged in, redirect to login
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // If role required, verify
  const allowed = normalizeRoles(requireRole);
  if (allowed && allowed.indexOf(((user && user.role) || "").toLowerCase()) === -1) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{ required: allowed.join(" / "), from: location }}
      />
    );
  }

  // All passed, render content
  return children;
};

export default ProtectedRoutes;
