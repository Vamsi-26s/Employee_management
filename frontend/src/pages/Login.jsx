import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/slices/authSlice.js';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(login({ email, password }));
    if (res.meta.requestStatus === 'fulfilled') navigate('/dashboard');
  };

  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="btn-primary w-full" disabled={status==='loading'}>{status==='loading'?'Logging in...':'Login'}</button>
      </form>
      <p className="text-sm text-gray-600 mt-4">New employee? <a className="text-primary-600" href="/register">Register</a></p>
    </div>
  );
}