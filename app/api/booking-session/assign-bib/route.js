import { NextResponse } from 'next/server';
import { assignBibNumber } from '@/lib/bibGenerator';

export async function POST(request) {
    try {
        const { eventId, bookingId, categoryName } = await request.json();
        if (!eventId || !bookingId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        const bib = await assignBibNumber(eventId, bookingId, categoryName);
        
        return NextResponse.json({ success: true, bibNumber: bib });
    } catch (err) {
        console.error("Assign BIB error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
