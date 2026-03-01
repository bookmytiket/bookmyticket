import HeroBanner from "@/components/HeroBanner";
import Link from "next/link";

const CATEGORIES = ["All", "Business", "Technology", "Finance", "Innovation", "Leadership"];

const EVENTS = [
    { id: 1, title: "Innovation Summit 2025", date: "Jan 15, 2025", location: "New York, NY", category: "Business", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop&q=80" },
    { id: 2, title: "Tech Forward Conference", date: "Jan 16, 2025", location: "San Francisco, CA", category: "Technology", img: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&auto=format&fit=crop&q=80" },
    { id: 3, title: "Finance Leaders Summit", date: "Jan 17, 2025", location: "Chicago, IL", category: "Finance", img: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=400&auto=format&fit=crop&q=80" },
    { id: 4, title: "Global Business Forum", date: "Jan 18, 2025", location: "Boston, MA", category: "Business", img: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&auto=format&fit=crop&q=80" },
    { id: 5, title: "Digital Innovators Expo", date: "Jan 19, 2025", location: "Austin, TX", category: "Innovation", img: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&auto=format&fit=crop&q=80" },
    { id: 6, title: "Leadership Excellence 2025", date: "Jan 20, 2025", location: "Seattle, WA", category: "Leadership", img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&auto=format&fit=crop&q=80" },
    { id: 7, title: "Startup Pitch Battle", date: "Jan 21, 2025", location: "New York, NY", category: "Innovation", img: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=400&auto=format&fit=crop&q=80" },
    { id: 8, title: "AI & Future of Work", date: "Jan 22, 2025", location: "Los Angeles, CA", category: "Technology", img: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&auto=format&fit=crop&q=80" },
    { id: 9, title: "Sustainable Business Summit", date: "Jan 23, 2025", location: "Portland, OR", category: "Business", img: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&auto=format&fit=crop&q=80" },
    { id: 10, title: "Women in Tech Summit", date: "Jan 24, 2025", location: "Denver, CO", category: "Technology", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80" },
    { id: 11, title: "Corporate Strategy Forum", date: "Jan 25, 2025", location: "Atlanta, GA", category: "Finance", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80" },
    { id: 12, title: "Entrepreneurship Bootcamp", date: "Jan 26, 2025", location: "Miami, FL", category: "Leadership", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80" },
    { id: 13, title: "Marketing Masters Conf.", date: "Jan 27, 2025", location: "Dallas, TX", category: "Business", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop&q=80" },
    { id: 14, title: "Product Design Summit", date: "Jan 28, 2025", location: "San Diego, CA", category: "Innovation", img: "https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=400&auto=format&fit=crop&q=80" },
    { id: 15, title: "Future Finance Forum", date: "Jan 29, 2025", location: "Phoenix, AZ", category: "Finance", img: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&auto=format&fit=crop&q=80" },
];

export default function EventsPage() {
    return (
        <main>
            {/* Page Hero Banner */}
            <div style={{ paddingTop: "102px" }}>
                <HeroBanner />
            </div>

            {/* Breadcrumb row */}
            <div style={{ background: "#000", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="container">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", fontWeight: 600 }}>
                        <Link href="/" style={{ color: "rgba(255,255,255,0.5)", transition: "color 0.2s" }}>Home</Link>
                        <span>›</span>
                        <span style={{ color: "#FDB913" }}>Events</span>
                    </div>
                </div>
            </div>

            {/* Events Content */}
            <div style={{ background: "#f8fafc", padding: "4rem 0 5rem" }}>
                <div className="container">

                    {/* Category Filter bar */}
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "3rem", justifyContent: "center" }}>
                        {CATEGORIES.map((cat) => (
                            <button key={cat} style={{
                                padding: "0.6rem 1.4rem",
                                borderRadius: "100px",
                                border: cat === "All" ? "none" : "1.5px solid #e2e8f0",
                                background: cat === "All" ? "#FDB913" : "white",
                                color: cat === "All" ? "black" : "#334155",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* 5 × 3 GRID */}
                    <div className="event-grid">
                        {EVENTS.map((event) => (
                            <Link href={`/events/${event.id}`} key={event.id} className="event-card">
                                <img src={event.img} alt={event.title} className="event-card-img" />
                                <div className="event-card-body">
                                    <span className="event-card-tag">{event.category}</span>
                                    <h3 className="event-card-title">{event.title}</h3>
                                    <p className="event-card-meta">📅 {event.date}</p>
                                    <p className="event-card-meta">📍 {event.location}</p>
                                    <button className="event-card-btn">Get Tickets</button>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
