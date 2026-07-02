export default function ComplaintCard({ complaint, children }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <strong>{complaint.category?.name || 'Uncategorized'}</strong>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            {new Date(complaint.createdAt).toLocaleString()}
            {complaint.resident && ` • ${complaint.resident.name} (${complaint.resident.flatNumber || 'N/A'})`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className={`badge ${complaint.status}`}>{complaint.status}</span>
          {complaint.priority && <span className={`badge priority-${complaint.priority}`}>{complaint.priority}</span>}
          {complaint.isOverdue && <span className="badge overdue">OVERDUE</span>}
        </div>
      </div>
      <p style={{ marginTop: 10 }}>{complaint.description}</p>
      {complaint.photoUrl && <img className="complaint-photo" src={complaint.photoUrl} alt="complaint" />}
      {children}
    </div>
  );
}
