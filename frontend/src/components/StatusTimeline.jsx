export default function StatusTimeline({ history }) {
  if (!history || history.length === 0) return <p className="empty-state">No history yet.</p>;
  return (
    <div className="timeline">
      {history.map((h) => (
        <div className="timeline-item" key={h.id}>
          <div>
            <strong>{h.oldStatus ? `${h.oldStatus} → ${h.newStatus}` : `Raised (${h.newStatus})`}</strong>
          </div>
          {h.note && <div>{h.note}</div>}
          <div className="meta">
            {h.actor?.name} ({h.actor?.role}) • {new Date(h.changedAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
