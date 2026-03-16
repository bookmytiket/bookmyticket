export default function EventCard({ title, date, location, image }) {
    return (
        <div className="event-card">
            <div className="event-image">
                {image ? <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />}
            </div>
            <div className="event-content">
                <span className="event-date">{date}</span>
                <h3 className="event-title">{title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{location}</p>
                <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>Get Tickets</button>
            </div>
        </div>
    );
}
