"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Hero() {
    const [timeLeft, setTimeLeft] = useState({
        days: 15,
        hours: 23,
        minutes: 45,
        seconds: 30
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { days, hours, minutes, seconds } = prev;
                if (seconds > 0) seconds--;
                else {
                    seconds = 59;
                    if (minutes > 0) minutes--;
                    else {
                        minutes = 59;
                        if (hours > 0) hours--;
                        else {
                            hours = 23;
                            if (days > 0) days--;
                        }
                    }
                }
                return { days, hours, minutes, seconds };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="hero">
            <p style={{ textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--secondary)', marginBottom: '1rem', fontWeight: 600 }}>
                Lead Purpose, Innovate with Passion
            </p>
            <h1>BUSINESS FORWARD 2025 STRATEGIES FOR A NEW ERA</h1>

            <div className="countdown">
                <div className="countdown-item">
                    <span className="countdown-value">{timeLeft.days}</span>
                    <span className="countdown-label">Days</span>
                </div>
                <div className="countdown-item">
                    <span className="countdown-value">{timeLeft.hours}</span>
                    <span className="countdown-label">Hours</span>
                </div>
                <div className="countdown-item">
                    <span className="countdown-value">{timeLeft.minutes}</span>
                    <span className="countdown-label">Minutes</span>
                </div>
                <div className="countdown-item">
                    <span className="countdown-value">{timeLeft.seconds}</span>
                    <span className="countdown-label">Seconds</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
                <Link href="/events" className="btn btn-secondary" style={{ padding: '1rem 2rem' }}>Browse Events</Link>
                <Link href="/rsvp" className="btn btn-outline" style={{ padding: '1rem 2rem', borderColor: 'white', color: 'white' }}>RSVP Now</Link>
            </div>
        </section>
    );
}
