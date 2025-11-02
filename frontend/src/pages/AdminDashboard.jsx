import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

/** Admin layout
 * sticky top navbar, scrollable main area, renders nested routes
 */
const AdminDashboard = () => {
  return (
    // Full height page with column layout
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top nav, stays visible */}
      <header className="sticky top-0 z-50">
        <Navbar />
      </header>

      {/* Main content fills remaining height */}
      <main className="flex-1 overflow-auto">
        {/* Optional inner container and padding */}
        <div className="w-full p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;