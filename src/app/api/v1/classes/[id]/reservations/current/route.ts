import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/app/api/v1/_utils/auth";

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireClient(req);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const client = auth.client;
    const segments = req.nextUrl.pathname.split("/").filter(Boolean);
    const classId = segments[segments.length - 3]; // .../classes/[id]/reservations/current
    if (!classId) return NextResponse.json({ success: false, error: "Class id is required" }, { status: 400 });

    const reservation = await prisma.attendanceLog.findFirst({
      where: { sessionId: classId, clientId: client.id },
      select: { id: true },
    });
    if (!reservation) return NextResponse.json({ success: false, error: "Reservation not found" }, { status: 404 });

    // Cancellation cutoff: not allowed after class start
    const session = await prisma.classSession.findUnique({
      where: { id: classId },
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

    await prisma.attendanceLog.delete({ where: { id: reservation.id } });
    const reserved_count = await prisma.attendanceLog.count({ where: { sessionId: classId } });

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
