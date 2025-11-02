import { Outlet } from "react-router-dom";
import EmployeeNavbar from "../components/EmployeeNavbar";

/** Employee layout
 * Show employee navbar, provides padded content area, renders nested routes
 */
const EmployeeDashboard = () => {
  return (

    // Full-height page with light background
    <div className="min-h-screen bg-gray-50">

      {/* Top navigation */}
      <EmployeeNavbar />

      {/* Main content container for child routes */}
      <div className="mx-auto max-w-7xl p-4">
        
        {/* Nested route content */}
        <Outlet />
      </div>
    </div>
  );
};

export default EmployeeDashboard;
