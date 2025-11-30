import { useEffect, useState } from 'react';
import api from '../../utils/api.js';

export default function Reports() {
  const [filters, setFilters] = useState({ start: '', end: '', status: '' });
  const [downloading, setDownloading] = useState(false);

  const downloadCSV = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (filters.start) params.append('start', filters.start);
      if (filters.end) params.append('end', filters.end);
      if (filters.status) params.append('status', filters.status);
      const url = `/api/attendance/export?${params.toString()}`;
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'attendance_export.csv';
      link.click();
    } finally { setDownloading(false); }
  };

  return (
    <div className="space-y-4">
      <h1 className="heading">Reports</h1>
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input className="input" type="date" value={filters.start} onChange={e=>setFilters({ ...filters, start: e.target.value })} />
          <input className="input" type="date" value={filters.end} onChange={e=>setFilters({ ...filters, end: e.target.value })} />
          <select className="input" value={filters.status} onChange={e=>setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="half-day">Half-day</option>
            <option value="absent">Absent</option>
          </select>
          <button className="btn-primary" onClick={downloadCSV} disabled={downloading}>{downloading?'Generating...':'Export CSV'}</button>
        </div>
      </div>
    </div>
  );
}