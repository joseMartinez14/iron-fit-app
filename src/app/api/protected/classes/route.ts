import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { saveMultipleClasses, saveOneClass } from "./service";
import { checkAdminAuth } from "../../service";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Check if admin exists and is active
    const adminAuthResult = await checkAdminAuth(userId);

    if (!adminAuthResult.success) {
      return adminAuthResult.error!;
    }

    const body = await req.json();
    const { type, ...formData } = body;

    // Add the authenticated user's ID and admin info to the form data
    const dataWithUserId = {
      ...formData,
      clerkUserId: userId,
    };

    if (type === "single") {
      const result = await saveOneClass(dataWithUserId);
      return NextResponse.json({
        success: true,
        ...result,
      });
    } else if (type === "recurring") {
      const result = await saveMultipleClasses(dataWithUserId);
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    return NextResponse.json({ error: "Invalid class type" }, { status: 400 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error creating class:", error);

    // Handle specific Clerk errors
    if (error.message?.includes("auth")) {
      return NextResponse.json(
        { error: "Authentication error", details: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create class", details: error.message },
      { status: 500 }
    );
  }
}
