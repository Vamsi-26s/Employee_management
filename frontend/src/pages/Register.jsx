import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/slices/authSlice.js';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', employeeId: '', department: '' });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(register({ ...form, role: 'employee' }));
    if (res.meta.requestStatus === 'fulfilled') navigate('/dashboard');
  };

  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-2xl font-semibold mb-4">Employee Registration</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="label">Name</label>
          <input className="input" name="name" value={form.name} onChange={onChange} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" name="email" value={form.email} onChange={onChange} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" name="password" value={form.password} onChange={onChange} required />
        </div>
        <div>
          <label className="label">Employee ID</label>
          <input className="input" name="employeeId" value={form.employeeId} onChange={onChange} />
        </div>
        <div>
          <label className="label">Department</label>
          <input className="input" name="department" value={form.department} onChange={onChange} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="btn-primary w-full" disabled={status==='loading'}>{status==='loading'?'Registering...':'Register'}</button>
      </form>
    </div>
  );
}