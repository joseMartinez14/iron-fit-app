import { NextResponse } from "next/server";
import { updateAdminFlags, type UpdateAdminFlagsInput } from "./services";
import { checkSuperAdminAuth } from "../../service";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(req: Request) {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please sign in",
        },
        { status: 401 }
      );
    }

    // Check if admin exists and is active
    const adminAuthResult = await checkSuperAdminAuth(userId);

    if (!adminAuthResult.success) {
      return adminAuthResult.error!;
    }

    const body = (await req.json()) as { id?: string } & UpdateAdminFlagsInput;

    if (!body?.id || typeof body.id !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'id'" },
        { status: 400 }
      );
    }

    const payload: UpdateAdminFlagsInput = {};
    if (typeof body.isActive === "boolean") payload.isActive = body.isActive;
    if (typeof body.superAdmin === "boolean")
      payload.superAdmin = body.superAdmin;

    if (payload.isActive === undefined && payload.superAdmin === undefined) {
      return NextResponse.json(
        { success: false, error: "Provide 'isActive' and/or 'superAdmin'" },
        { status: 400 }
      );
    }

    const admin = await updateAdminFlags(body.id, payload);
    return NextResponse.json({ success: true, admin });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("No 'Admin' record") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
