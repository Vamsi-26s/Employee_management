import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export function RequireAuth({ children }) {
  const { token } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  useEffect(() => { if (!token) navigate('/login'); }, [token, navigate]);
  return children;
}

export function RequireRole({ role, children }) {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) navigate('/login');
    else if (user.role !== role) navigate('/dashboard');
  }, [user, role, navigate]);
  return children;
}