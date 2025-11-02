import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Root from './components/Root';
import Login from './pages/Login';
import ProtectedRoutes from './components/ProtectedRoutes';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Categories from './components/Categories';
import Users from './components/Users';
import Warehouses from './components/Warehouses';
import Orders from './components/Orders';
import Products from './components/Products';
import ToOrder from './components/ToOrder';
import AdminSummary from './components/AdminSummary';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (

    // App level router, defines public and protected routes
    <Router>
      <Routes>

        {/* Redirects based on auth/role */}
        <Route path="/" element={<Root />} />

        {/* Public login page */}
        <Route path="/login" element={<Login />} />

        {/* Admin area with nested pages */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoutes requireRole={"admin"}>
            <AdminDashboard />
          </ProtectedRoutes>}>

          {/* Default admin page */}
          <Route index element={<AdminSummary />}></Route>

          {/* Admin tools */}
          <Route path="categories" element={<Categories />}></Route>
          <Route path="products" element={<Products />}></Route>
          <Route path="warehouses" element={<Warehouses />}></Route>
          <Route path="orders" element={<Orders />}></Route>
          <Route path="to-order" element={<ToOrder />}></Route>
          <Route path="users" element={<Users />}></Route>
        </Route>

        {/* Employee area with nested pages */}
        <Route path="/employee-dashboard" element={
          <ProtectedRoutes requireRole={"employee"}>
            <EmployeeDashboard />
          </ProtectedRoutes>}>

          {/* Default employee page */}
          <Route index element={<Products />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
        </Route>

        {/* Fallback for blocked access */}
        <Route path="/unauthorized" element={<p className='font-bold text-3xl mt-20 ml-20'><Unauthorized /></p>} />
      </Routes>
    </Router>
  )
}

export default App
