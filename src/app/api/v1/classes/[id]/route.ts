import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type UserStatus = "reserved" | "waitlisted" | "none";

export async function GET(req: NextRequest) {
  try {
    const segments = req.nextUrl.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 1];
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Class id is required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") || undefined; // optional for user_status

    const session = await prisma.classSession.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        capacity: true,
        startTime: true,
        endTime: true,
        isCancelled: true,
        instructor: { select: { id: true, name: true } },
        _count: { select: { attendanceLogs: true } },
        attendanceLogs: {
          select: {
            id: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    const timezone = process.env.TZ || "UTC";
    const participants = session.attendanceLogs.map((log) => ({
      id: log.client.id,
      name: log.client.name,
      avatar_url: null as string | null,
    }));
    const participants_count = participants.length;
    const reserved_count = session._count.attendanceLogs;
    const waitlist_count = 0; // no waitlist model
    const user_status: UserStatus = clientId
      ? (session.attendanceLogs.some((log) => log.client.id === clientId)
          ? "reserved"
          : "none")
      : "none";

    return NextResponse.json({
      success: true,
      class: {
        id: session.id,
        title: session.title,
        start_at: session.startTime.toISOString(),
        end_at: session.endTime.toISOString(),
        timezone,
        instructor: {
          id: session.instructor.id,
          name: session.instructor.name,
          avatar_url: null as string | null,
        },
        capacity: session.capacity,
        reserved_count,
        waitlist_count,
        user_status,
        location: session.location ?? undefined,
        tags: undefined as string[] | undefined,
        updated_at: session.startTime.toISOString(),
        description: session.description || "",
        participants,
        participants_count,
        // waitlist: undefined, // add when model exists
        // rules: undefined, // add when policy configuration exists
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
