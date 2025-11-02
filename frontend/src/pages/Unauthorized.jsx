import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Unauthorized = () => {

  // Router helpers and auth context
  const navigate = useNavigate();
  const { state } = useLocation(); // required role passed via location state
  const { user } = useAuth() || {};
  const requiredRole = state?.required || null;

  // Send user based on their role
  const goHome = () => {
    if (!user) navigate("/login", { replace: true });
    else if ((user.role || "").toLowerCase() === "admin")
      navigate("/admin-dashboard", { replace: true });
    else
      navigate("/employee-dashboard", { replace: true });
  };

  return (

    // Cnetered card with clear guidance and actions
    <div className="min-h-[calc(100vh-64px)] grid place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Unauthorized</h1>

        <p className="text-gray-700 mb-4">
          You don't have permission to view this page.
        </p>

        {/* Show who is signed in and what role is required */}
        {user ? (
          <div className="mb-6 text-sm text-gray-700 space-y-1">
            <div>
              <span className="text-gray-500">Signed in as:</span>{" "}
              <span className="font-medium">{user.name}</span>{" "}
              <span className="text-gray-500">({user.email})</span>
            </div>
            <div>
              <span className="text-gray-500">Your role:</span>{" "}
              <span className="font-medium">{user.role}</span>
            </div>
            {requiredRole && (
              <div>
                <span className="text-gray-500">Required role:</span>{" "}
                <span className="font-medium">{requiredRole}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-700 mb-6">
            You need to sign in to continue.
          </p>
        )}

        {/* Login / go to dashboard / go back */}
        <div className="flex flex-wrap gap-3">
          {!user && (
            <button
              onClick={() => navigate("/login")}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Go to Login
            </button>
          )}

          {user && (
            <button
              onClick={goHome}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Go to my dashboard
            </button>
          )}

          <button
            onClick={() => navigate(-1)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
