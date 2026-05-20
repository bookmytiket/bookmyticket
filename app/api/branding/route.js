import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    logo_url: "/logo.png",
    powered_by_logo_url: "/logo.png",
    powered_by_link: "https://www.bookmyticket.net"
  });
}
