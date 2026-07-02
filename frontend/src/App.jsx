import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import NoticeBoard from './pages/NoticeBoard';
import RaiseComplaint from './pages/resident/RaiseComplaint';
import MyComplaints from './pages/resident/MyComplaints';
import AllComplaints from './pages/admin/AllComplaints';
import Dashboard from './pages/admin/Dashboard';
import ManageNotices from './pages/admin/ManageNotices';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="navbar">
      <Link to="/" className="brand">🏢 Society Tracker</Link>
      <div className="links">
        {user?.role === 'resident' && (
          <>
            <Link to="/complaints/new">Raise Complaint</Link>
            <Link to="/complaints">My Complaints</Link>
            <Link to="/notices">Notice Board</Link>
          </>
        )}
        {user?.role === 'admin' && (
          <>
            <Link to="/admin/complaints">Complaints</Link>
            <Link to="/admin/dashboard">Dashboard</Link>
            <Link to="/admin/notices">Notices</Link>
          </>
        )}
        {user ? (
          <>
            <span style={{ fontSize: 13, color: '#6b7280' }}>{user.name} ({user.role})</span>
            <button className="btn secondary" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  );
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/complaints'} replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/notices" element={<ProtectedRoute><NoticeBoard /></ProtectedRoute>} />

        <Route path="/complaints/new" element={<ProtectedRoute role="resident"><RaiseComplaint /></ProtectedRoute>} />
        <Route path="/complaints" element={<ProtectedRoute role="resident"><MyComplaints /></ProtectedRoute>} />

        <Route path="/admin/complaints" element={<ProtectedRoute role="admin"><AllComplaints /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/notices" element={<ProtectedRoute role="admin"><ManageNotices /></ProtectedRoute>} />

        <Route path="*" element={<div className="container">404 - Page not found</div>} />
      </Routes>
    </>
  );
}
