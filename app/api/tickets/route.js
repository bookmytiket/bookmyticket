import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "tickets.json");

function getTickets() {
    if (!fs.existsSync(DATA_PATH)) return [];
    const content = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(content);
}

function saveTickets(tickets) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(tickets, null, 4));
}

export async function GET() {
    const tickets = getTickets();
    return NextResponse.json(tickets);
}

export async function POST(req) {
    try {
        const body = await req.json();
        const tickets = getTickets();

        const newTicket = {
            id: (Math.max(...tickets.map(t => parseInt(t.id))) + 1).toString(),
            title: body.title,
            category: body.category,
            prio: body.prio,
            status: "Open", // Initial status
            created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            organiser: body.organiser || "Unknown"
        };

        tickets.unshift(newTicket);
        saveTickets(tickets);

        return NextResponse.json(newTicket);
    } catch (e) {
        return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }
}
