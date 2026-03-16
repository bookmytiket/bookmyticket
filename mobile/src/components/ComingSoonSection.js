import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../theme/Theme';

const { width } = Dimensions.get('window');

function useCountdown(targetDate) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

    useEffect(() => {
        if (!targetDate) return;
        const calc = () => {
            // Normalize "YYYY-MM-DD HH:mm" to "YYYY-MM-DDTHH:mm" for cross-browser consistency (especially iOS Safari)
            const normalized = String(targetDate).includes(' ') && !String(targetDate).includes('T') 
                ? String(targetDate).replace(' ', 'T') 
                : targetDate;
            const diff = new Date(normalized) - new Date();
            if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
            setTimeLeft({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff % 86400000) / 3600000),
                mins: Math.floor((diff % 3600000) / 60000),
                secs: Math.floor((diff % 60000) / 1000),
            });
        };
        calc();
        const t = setInterval(calc, 1000);
        return () => clearInterval(t);
    }, [targetDate]);

    return timeLeft;
}

function TimerBox({ value, label }) {
    return (
        <View style={styles.timerBox}>
            <Text style={styles.timerValue}>{String(value).padStart(2, "0")}</Text>
            <Text style={styles.timerLabel}>{label}</Text>
        </View>
    );
}

export default function ComingSoonSection({ events = [], onEventPress }) {
    const [idx, setIdx] = useState(0);
    const now = new Date();
    const COMING_SOON_EVENTS = events.filter(e => {
        if (!e.date) return false;
        const normalized = String(e.date).includes(' ') && !String(e.date).includes('T') 
            ? String(e.date).replace(' ', 'T') 
            : e.date;
        const diff = new Date(normalized + (e.time ? `T${e.time}` : 'T23:59')) - now;
        return (e.featured || e.trending) && diff > 0;
    }).slice(0, 5);

    useEffect(() => {
        if (COMING_SOON_EVENTS.length <= 1) return;
        const timer = setInterval(() => {
            setIdx((i) => (i + 1) % COMING_SOON_EVENTS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [COMING_SOON_EVENTS.length]);

    if (COMING_SOON_EVENTS.length === 0) return null;

    const event = COMING_SOON_EVENTS[idx];
    const timeLeft = useCountdown(event.date);

    const prev = () => setIdx((i) => (i - 1 + COMING_SOON_EVENTS.length) % COMING_SOON_EVENTS.length);
    const next = () => setIdx((i) => (i + 1) % COMING_SOON_EVENTS.length);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Coming <Text style={{ color: Colors.secondary }}>Soon</Text> 🎯</Text>
                <Text style={styles.subtitle}>Handpicked experiences you won't want to miss!</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: event.img }} style={styles.image} />
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{event.category || "Featured"}</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    
                    <View style={styles.timerRow}>
                        <TimerBox value={timeLeft.days} label="Days" />
                        <TimerBox value={timeLeft.hours} label="Hours" />
                        <TimerBox value={timeLeft.mins} label="Mins" />
                        <TimerBox value={timeLeft.secs} label="Secs" />
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoText}>{event.date}</Text>
                        <Text style={styles.infoText}> • </Text>
                        <Text style={styles.infoText} numberOfLines={1}>{event.location}</Text>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={styles.bookBtn}
                            onPress={() => onEventPress(event)}
                        >
                            <Text style={styles.bookBtnText}>Book Now</Text>
                        </TouchableOpacity>

                        <View style={styles.navRow}>
                            <TouchableOpacity onPress={prev} style={styles.navBtn}>
                                <Text style={styles.navBtnText}>←</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={next} style={styles.navBtn}>
                                <Text style={styles.navBtnText}>→</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingVertical: 24, backgroundColor: '#fff' },
    header: { paddingHorizontal: 24, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: -0.8 },
    subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4, fontWeight: '500' },
    card: {
        marginHorizontal: 24,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    imageContainer: { height: 180, position: 'relative' },
    image: { width: '100%', height: '100%' },
    categoryBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    categoryText: { fontSize: 10, fontWeight: '800', color: '#111' },
    content: { padding: 20, backgroundColor: '#fff5f5' },
    eventTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 12 },
    timerRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    timerBox: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
        minWidth: 55,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    timerValue: { fontSize: 18, fontWeight: '800', color: Colors.text, lineHeight: 22 },
    timerLabel: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginTop: 2 },
    infoRow: { flexDirection: 'row', marginBottom: 20 },
    infoText: { fontSize: 12, color: '#374151', fontWeight: '500' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bookBtn: {
        backgroundColor: '#f97316',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
    },
    bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    navRow: { flexDirection: 'row', gap: 8 },
    navBtn: {
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    navBtnText: { fontSize: 16, color: Colors.text },
});
