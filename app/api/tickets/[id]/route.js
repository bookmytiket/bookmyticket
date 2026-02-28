import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "tickets.json");

function getTickets() {
    if (!fs.existsSync(DATA_PATH)) return [];
    try {
        const content = fs.readFileSync(DATA_PATH, "utf-8");
        return JSON.parse(content);
    } catch (e) { return []; }
}

function saveTickets(tickets) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(tickets, null, 4));
}

export async function PATCH(req, { params }) {
    try {
        const { id } = params;
        const body = await req.json(); // { status: "..." }

        let tickets = getTickets();
        const index = tickets.findIndex(t => t.id === id);

        if (index === -1) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        tickets[index] = { ...tickets[index], ...body };
        saveTickets(tickets);

        return NextResponse.json(tickets[index]);
    } catch (e) {
        return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
    }
}
