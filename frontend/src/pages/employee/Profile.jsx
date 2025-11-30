import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import api from '../../utils/api.js';
import { fetchMe } from '../../store/slices/authSlice.js';
import { useToast } from '../../components/Toast.jsx';

export default function Profile() {
  const { user } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', employeeId: user?.employeeId || '' });
  const [preview, setPreview] = useState(user?.profileImage || '');
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();
  const toast = useToast();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };
  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (preview) payload.profileImage = preview;
      await api.put('/api/auth/me', payload);
      await dispatch(fetchMe());
      toast?.show('Profile updated!', 'success');
    } catch {
      toast?.show('Failed to update profile.', 'error');
    } finally { setSaving(false); }
  };
  return (
    <div className="max-w-md card p-6">
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>
      {user ? (
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border">
              {preview ? <img src={preview} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
            </div>
            <div>
              <label className="label">Photo</label>
              <input className="input" type="file" accept="image/*" onChange={onFile} />
            </div>
          </div>
          <div>
            <label className="label">Name</label>
            <input className="input" name="name" value={form.name} onChange={onChange} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={user.email} disabled />
          </div>
          <div>
            <label className="label">Employee ID</label>
            <input className="input" name="employeeId" value={form.employeeId} onChange={onChange} />
          </div>
          <div>
            <label className="label">Department</label>
            <input className="input" name="department" value={form.department} onChange={onChange} />
          </div>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      ) : <p>Loading...</p>}
    </div>
  );
}