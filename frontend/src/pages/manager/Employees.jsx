import { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import dayjs from 'dayjs';
import { useToast } from '../../components/Toast.jsx';

export default function Employees() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ status: '', department: '', start: '', end: '', employee: '' });
  const [employees, setEmployees] = useState([]);
  const [bulkDate, setBulkDate] = useState('');
  const [bulkSelected, setBulkSelected] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', in: '', out: '' });
  const toast = useToast();

  const load = async () => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.department) params.department = filters.department;
    if (filters.start) params.start = filters.start;
    if (filters.end) params.end = filters.end;
    const { data } = await api.get('/api/attendance/all', { params });
    let recs = data.records;
    if (filters.employee) {
      const q = filters.employee.toLowerCase();
      recs = recs.filter(r => (r.userId?.name || '').toLowerCase().includes(q) || (r.userId?.employeeId || '').toLowerCase().includes(q));
    }
    setRecords(recs);
  };

  const loadEmployees = async () => {
    const params = {};
    if (filters.department) params.department = filters.department;
    if (filters.employee) params.q = filters.employee;
    const { data } = await api.get('/api/users', { params });
    setEmployees(data.users || []);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadEmployees(); }, []);

  const startEdit = (rec) => {
    setEditingId(rec._id);
    setEditForm({
      status: rec.status,
      in: rec.checkInTime ? dayjs(rec.checkInTime).format('HH:mm') : '',
      out: rec.checkOutTime ? dayjs(rec.checkOutTime).format('HH:mm') : '',
    });
  };
  const cancelEdit = () => { setEditingId(null); };
  const saveEdit = async (rec) => {
    try {
      const body = { status: editForm.status };
      if (editForm.in) {
        const inISO = dayjs(rec.date).hour(Number(editForm.in.split(':')[0])).minute(Number(editForm.in.split(':')[1])).second(0).toISOString();
        body.checkInTime = inISO;
      }
      if (editForm.out) {
        const outISO = dayjs(rec.date).hour(Number(editForm.out.split(':')[0])).minute(Number(editForm.out.split(':')[1])).second(0).toISOString();
        body.checkOutTime = outISO;
      }
      const { data } = await api.put(`/api/attendance/${rec._id}`, body);
      setRecords((list) => list.map((r) => (r._id === rec._id ? data.record : r)));
      setEditingId(null);
      toast?.show('Attendance updated', 'success');
    } catch (e) {
      toast?.show('Update failed', 'error');
    }
  };

  const toggleSelectBulk = (id) => {
    setBulkSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const markAbsentBulk = async () => {
    if (!bulkDate || bulkSelected.length === 0) {
      toast?.show('Select date and employees', 'error');
      return;
    }
    try {
      const { data } = await api.post('/api/attendance/mark-absent', { date: bulkDate, userIds: bulkSelected });
      toast?.show(`Marked ${data.records.length} absent`, 'success');
      await load();
    } catch (e) {
      toast?.show('Bulk mark failed', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="heading">Manage Employees Attendance</h1>
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <input className="input" placeholder="Employee name or ID" value={filters.employee} onChange={e=>setFilters({ ...filters, employee: e.target.value })} />
          <select className="input" value={filters.status} onChange={e=>setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="half-day">Half-day</option>
            <option value="absent">Absent</option>
          </select>
          <input className="input" placeholder="Department" value={filters.department} onChange={e=>setFilters({ ...filters, department: e.target.value })} />
          <input className="input" type="date" value={filters.start} onChange={e=>setFilters({ ...filters, start: e.target.value })} />
          <input className="input" type="date" value={filters.end} onChange={e=>setFilters({ ...filters, end: e.target.value })} />
          <button className="btn-primary" onClick={() => { load(); loadEmployees(); }}>Filter</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
          <div className="md:col-span-2 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Employee</th>
                  <th className="p-2">Department</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Hours</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id} className="border-b">
                    <td className="p-2">{r.userId?.name}</td>
                    <td className="p-2">{r.userId?.department}</td>
                    <td className="p-2">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="p-2 capitalize">
                      {editingId === r._id ? (
                        <select className="input" value={editForm.status} onChange={(e)=>setEditForm({ ...editForm, status: e.target.value })}>
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="half-day">Half-day</option>
                          <option value="absent">Absent</option>
                        </select>
                      ) : (
                        r.status
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === r._id ? (
                        <div className="flex gap-2">
                          <input className="input" type="time" value={editForm.in} onChange={(e)=>setEditForm({ ...editForm, in: e.target.value })} />
                          <input className="input" type="time" value={editForm.out} onChange={(e)=>setEditForm({ ...editForm, out: e.target.value })} />
                        </div>
                      ) : (
                        (r.totalHours || 0).toFixed(2)
                      )}
                    </td>
                    <td className="p-2">
                      {editingId === r._id ? (
                        <div className="flex gap-2">
                          <button className="btn-primary" onClick={()=>saveEdit(r)}>Save</button>
                          <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn-ghost" onClick={()=>startEdit(r)}>Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card p-3">
            <p className="font-medium mb-2">Bulk Mark Absent</p>
            <input className="input mb-2" type="date" value={bulkDate} onChange={(e)=>setBulkDate(e.target.value)} />
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Select employees</p>
              <div className="max-h-48 overflow-y-auto border rounded">
                {employees.map((u) => (
                  <label key={u._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-900">
                    <input type="checkbox" checked={bulkSelected.includes(u._id)} onChange={()=>toggleSelectBulk(u._id)} />
                    <span className="text-sm">{u.name} ({u.employeeId || 'N/A'})</span>
                  </label>
                ))}
              </div>
            </div>
            <button className="btn-primary mt-3 w-full" onClick={markAbsentBulk}>Mark Absent</button>
          </div>
        </div>
      </div>
    </div>
  );
}