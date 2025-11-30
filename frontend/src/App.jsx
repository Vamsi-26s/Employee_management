import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './store/slices/authSlice.js';
import Layout from './components/Layout.jsx';
import { RequireAuth, RequireRole } from './components/Protected.jsx';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import EmployeeDashboard from './pages/employee/Dashboard.jsx';
import MarkAttendance from './pages/employee/MarkAttendance.jsx';
import AttendanceHistory from './pages/employee/AttendanceHistory.jsx';
import Profile from './pages/employee/Profile.jsx';
import ManagerDashboard from './pages/manager/Dashboard.jsx';
import Employees from './pages/manager/Employees.jsx';
import TeamCalendar from './pages/manager/TeamCalendar.jsx';
import Reports from './pages/manager/Reports.jsx';

export default function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((s) => s.auth);
  const location = useLocation();
  useEffect(() => { if (token && !user) dispatch(fetchMe()); }, [token, user, dispatch]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard smart route based on role */}
        <Route path="/dashboard" element={
          <RequireAuth>
            {user?.role === 'manager' ? <ManagerDashboard /> : <EmployeeDashboard />}
          </RequireAuth>
        } />

        {/* Employee-only routes */}
        <Route path="/mark-attendance" element={
          <RequireRole role="employee"><MarkAttendance /></RequireRole>
        } />
        <Route path="/attendance-history" element={
          <RequireRole role="employee"><AttendanceHistory /></RequireRole>
        } />
        <Route path="/profile" element={
          <RequireRole role="employee"><Profile /></RequireRole>
        } />

        {/* Manager-only routes */}
        <Route path="/employees" element={
          <RequireRole role="manager"><Employees /></RequireRole>
        } />
        <Route path="/team-calendar" element={
          <RequireRole role="manager"><TeamCalendar /></RequireRole>
        } />
        <Route path="/reports" element={
          <RequireRole role="manager"><Reports /></RequireRole>
        } />
      </Routes>
    </Layout>
  );
}