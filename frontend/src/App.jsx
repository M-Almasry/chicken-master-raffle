import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Menu from './pages/Menu';
import Raffle from './pages/Raffle';
import Users from './pages/Users';

// Get current user role from localStorage
const getRole = () => {
  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
  return user?.role || null;
};

// Protect a route based on allowed roles
const RoleRoute = ({ allowedRoles, children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/login" replace />;
  const role = getRole();
  if (!role || !allowedRoles.includes(role)) return <Navigate to="/orders" replace />;
  return children;
};

// Basic auth check (any logged in user)
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('adminToken');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router basename="/admin">
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes wrapped in Layout */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* Dashboard — admin and superadmin only */}
          <Route index element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <Dashboard />
            </RoleRoute>
          } />

          {/* Orders — all roles */}
          <Route path="orders" element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } />

          {/* Menu — admin and superadmin only */}
          <Route path="menu" element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <Menu />
            </RoleRoute>
          } />

          {/* Raffle — admin and superadmin only */}
          <Route path="raffle" element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <Raffle />
            </RoleRoute>
          } />

          {/* Users — superadmin ONLY */}
          <Route path="users" element={
            <RoleRoute allowedRoles={['superadmin']}>
              <Users />
            </RoleRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
