import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice.js';
import { useEffect, useState } from 'react';

export default function Layout({ children }) {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const onLogout = () => { dispatch(logout()); navigate('/login'); };

  // Theme toggle
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="header sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4 justify-between">
          <Link to={user?.role === 'manager' ? '/dashboard' : '/dashboard'} className="flex items-center gap-2">
            <img src="/src/assets/logo.svg" alt="AttendX" className="w-9 h-9" />
            <div>
              <div className="brand-title">AttendX</div>
              <div className="brand-sub">Smart attendance tracking</div>
            </div>
          </Link>
          <div className="flex-1 hidden md:flex">
            <div className="w-full">
              <input className="input" placeholder="Search pages or actions (e.g., 'Employees', 'Mark Attendance')" />
            </div>
          </div>
          <nav className="flex items-center gap-2">
            {!user && (
              <>
                <Link className="btn-secondary" to="/login">Login</Link>
                <Link className="btn-primary" to="/register">Register</Link>
              </>
            )}
            {user && (
              <>
                {user.role === 'employee' && (
                  <div className="hidden md:flex gap-2">
                    <Link className="nav-link" to="/mark-attendance"><span className="nav-link-icon">🕒</span> Mark Attendance</Link>
                    <Link className="nav-link" to="/attendance-history"><span className="nav-link-icon">📜</span> History</Link>
                    <Link className="nav-link" to="/profile"><span className="nav-link-icon">👤</span> Profile</Link>
                  </div>
                )}
                {user.role === 'manager' && (
                  <div className="hidden md:flex gap-2">
                    <Link className="nav-link" to="/employees"><span className="nav-link-icon">👥</span> Employees</Link>
                    <Link className="nav-link" to="/team-calendar"><span className="nav-link-icon">📅</span> Team Calendar</Link>
                    <Link className="nav-link" to="/reports"><span className="nav-link-icon">📈</span> Reports</Link>
                  </div>
                )}
                <button className="btn-secondary" title="Toggle theme" onClick={toggleTheme}>{dark ? 'Dark' : 'Light'}</button>
                <button className="btn-primary" onClick={onLogout}>Logout</button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <footer className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 dark:text-gray-300">
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/src/assets/logo.svg" alt="AttendX" className="w-6 h-6" />
            <span>© {new Date().getFullYear()} AttendX</span>
          </div>
          <div className="flex gap-4">
            <a className="hover:underline" href="#">Privacy</a>
            <a className="hover:underline" href="#">Terms</a>
            <a className="hover:underline" href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}