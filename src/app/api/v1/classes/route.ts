import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type UserStatus = "reserved" | "waitlisted" | "none";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const clientId = searchParams.get("clientId") || undefined; // optional for user_status

    if (!from || !to) {
      return NextResponse.json(
        { success: false, error: "Query params 'from' and 'to' are required (ISO)" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "'from' and 'to' must be valid ISO date strings" },
        { status: 400 }
      );
    }

    // Fetch classes overlapping the requested window
    const sessions = await prisma.classSession.findMany({
      where: {
        // session overlaps range if it starts before 'to' and ends after 'from'
        AND: [{ startTime: { lt: toDate } }, { endTime: { gt: fromDate } }],
      },
      select: {
        id: true,
        title: true,
        location: true,
        capacity: true,
        startTime: true,
        endTime: true,
        isCancelled: true,
        instructor: { select: { id: true, name: true } },
        _count: { select: { attendanceLogs: true } },
        attendanceLogs: clientId
          ? { where: { clientId }, select: { id: true } }
          : false,
      },
      orderBy: [{ startTime: "asc" }],
    });

    const timezone = process.env.TZ || "UTC"; // best-effort IANA TZ

    const items = sessions.map((s) => {
      const reserved_count = s._count.attendanceLogs;
      const waitlist_count = 0; // no waitlist model in schema
      const user_status: UserStatus = clientId
        ? (Array.isArray(s.attendanceLogs) && s.attendanceLogs.length > 0
            ? "reserved"
            : "none")
        : "none";

      return {
        id: s.id,
        title: s.title,
        start_at: s.startTime.toISOString(),
        end_at: s.endTime.toISOString(),
        timezone,
        instructor: {
          id: s.instructor.id,
          name: s.instructor.name,
          avatar_url: null as string | null,
        },
        capacity: s.capacity,
        reserved_count,
        waitlist_count,
        user_status,
        location: s.location ?? undefined,
        tags: undefined as string[] | undefined,
        updated_at: s.startTime.toISOString(), // no updatedAt on session; use start time as stable value
      };
    });

    return NextResponse.json({ success: true, classes: items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
