import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getClassesByDateRange } from "../service";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Both startDate and endDate are required" },
        { status: 400 }
      );
    }

    const result = await getClassesByDateRange({
      startDate,
      endDate,
      clerkUserId: userId,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error fetching classes by date range:", error);

    if (error.message?.includes("Admin user not found")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (
      error.message?.includes("Invalid date") ||
      error.message?.includes("Start date")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to fetch classes", details: error.message },
      { status: 500 }
    );
  }
}
