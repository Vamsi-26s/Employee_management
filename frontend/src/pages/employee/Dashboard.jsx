import { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/dashboard/employee');
        setData(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!data) return <p>Failed to load dashboard data.</p>;

  const todayStatus = data?.todayRecord ? data.todayRecord.status : 'No record';
  const chartData = (data?.last7 || []).map(r => ({
    date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    hours: r.totalHours || 0
  }));

  return (
    <div className="space-y-6">
      <h1 className="heading">Employee Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4"><p className="text-gray-600">Today status</p><p className="text-lg font-semibold">{todayStatus}</p></div>
        <div className="card p-4"><p className="text-gray-600">Total hours this month</p><p className="text-lg font-semibold">{(data?.totalHours ?? 0).toFixed(2)}</p></div>
        <div className="card p-4"><p className="text-gray-600">Present</p><p className="text-lg font-semibold">{data?.present ?? 0}</p></div>
        <div className="card p-4"><p className="text-gray-600">Late</p><p className="text-lg font-semibold">{data?.late ?? 0}</p></div>
        <div className="card p-4"><p className="text-gray-600">Half-day</p><p className="text-lg font-semibold">{data?.halfDay ?? 0}</p></div>
        <div className="card p-4"><p className="text-gray-600">Absent</p><p className="text-lg font-semibold">{data?.absent ?? 0}</p></div>
      </div>

      <div className="card p-4">
        <p className="font-medium mb-2">Last 7 days working hours</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="hours" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHours)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}