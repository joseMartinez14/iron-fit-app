import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/app/api/v1/_utils/auth";

export async function DELETE(req: NextRequest) {
  try {
    const segments = req.nextUrl.pathname.split("/").filter(Boolean);
    const reservation_id = segments[segments.length - 1];
    if (!reservation_id) return NextResponse.json({ success: false, error: "Reservation id is required" }, { status: 400 });
    const auth = await requireClient(req);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const client = auth.client;

    // Load reservation
    const reservation = await prisma.attendanceLog.findUnique({
      where: { id: reservation_id },
      select: { id: true, sessionId: true, clientId: true },
    });

    if (!reservation) return NextResponse.json({ success: false, error: "Reservation not found" }, { status: 404 });
    if (reservation.clientId !== client.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Cancellation cutoff: do not allow after class start
    const session = await prisma.classSession.findUnique({
      where: { id: reservation.sessionId },
      select: { startTime: true },
    });
    if (!session) return NextResponse.json({ success: false, error: "Class not found" }, { status: 404 });
    const now = new Date();
    if (now >= session.startTime) {
      return NextResponse.json(
        { success: false, error: "Cancellation cutoff has passed" },
        { status: 422 }
      );
    }

    await prisma.attendanceLog.delete({ where: { id: reservation_id } });
    const reserved_count = await prisma.attendanceLog.count({ where: { sessionId: reservation.sessionId } });

    return NextResponse.json({
      success: true,
      status: "cancelled",
      reserved_count,
      waitlist_count: 0,
      user_status: "none",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
