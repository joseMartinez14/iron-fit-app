import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/app/api/v1/_utils/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireClient(req);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const client = auth.client;
    const segments = req.nextUrl.pathname.split("/").filter(Boolean);
    const classId = segments[segments.length - 2]; // .../classes/[id]/reservations
    if (!classId) return NextResponse.json({ success: false, error: "Class id is required" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const allowWaitlist = !!body?.waitlist;

    // Load class and counts
    const session = await prisma.classSession.findUnique({
      where: { id: classId },
      select: {
        id: true,
        capacity: true,
        startTime: true,
        endTime: true,
        _count: { select: { attendanceLogs: true } },
      },
    });
    if (!session) return NextResponse.json({ success: false, error: "Class not found" }, { status: 404 });

    // Simple reservation cutoff: do not allow after class start
    const now = new Date();
    if (now >= session.startTime) {
      return NextResponse.json(
        { success: false, error: "Reservations closed for this class" },
        { status: 422 }
      );
    }

    // Already reserved?
    const existing = await prisma.attendanceLog.findFirst({
      where: { sessionId: classId, clientId: client.id },
      select: { id: true },
    });

    if (existing) {
      const reserved_count = await prisma.attendanceLog.count({ where: { sessionId: classId } });
      return NextResponse.json({
        success: true,
        reservation_id: existing.id,
        status: "reserved",
        reserved_count,
        waitlist_count: 0,
        user_status: "reserved",
      });
    }

    // Capacity check
    const reservedCount = session._count.attendanceLogs;
    if (reservedCount >= session.capacity) {
      if (allowWaitlist) {
        return NextResponse.json(
          { success: false, error: "Waitlist not supported", code: "WAITLIST_UNAVAILABLE" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: "Class is full" },
        { status: 409 }
      );
    }

    const reservation = await prisma.attendanceLog.create({
      data: {
        sessionId: classId,
        clientId: client.id,
      },
      select: { id: true },
    });

    const newReservedCount = await prisma.attendanceLog.count({ where: { sessionId: classId } });
    return NextResponse.json({
      success: true,
      reservation_id: reservation.id,
      status: "reserved",
      reserved_count: newReservedCount,
      waitlist_count: 0,
      user_status: "reserved",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
