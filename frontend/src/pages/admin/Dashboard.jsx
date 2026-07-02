import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../api/axiosInstance';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/summary').then((res) => setData(res.data));
  }, []);

  if (!data) return <div className="container">Loading...</div>;

  const statusData = Object.entries(data.byStatus).map(([name, count]) => ({ name, count }));
  const categoryData = Object.entries(data.byCategory).map(([name, count]) => ({ name, count }));

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <div className="card stat-card">
          <div className="value">{data.total}</div>
          <div className="label">Total Complaints</div>
        </div>
        <div className="card stat-card">
          <div className="value">{data.overdueCount}</div>
          <div className="label">Overdue Complaints</div>
        </div>
        <div className="card stat-card">
          <div className="value">{data.byStatus.Resolved || 0}</div>
          <div className="label">Resolved</div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>By Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>By Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
