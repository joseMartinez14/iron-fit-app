import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getClientById, updateClient, UpdateClientData } from "../service";
import { checkAdminAuth } from "../../../service";

// GET endpoint to retrieve a client by ID
export async function GET(req: NextRequest) {
  try {
    const segments = req.nextUrl.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 1];
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Client id is required" },
        { status: 400 }
      );
    }
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

    const result = await getClientById(id);
    return NextResponse.json(result);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in GET /api/client/[id]:", error);

    if (error.message === "Client not found") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT endpoint to update a client
export async function PUT(req: NextRequest) {
  try {
    const segments = req.nextUrl.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 1];
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Client id is required" },
        { status: 400 }
      );
    }
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

    // Parse the request body
    const body = await req.json();
    const { name, userName, password, phone, isActive } = body;

    // Validate fields if provided
    if (name !== undefined && (!name || typeof name !== "string")) {
      return NextResponse.json(
        {
          success: false,
          error: "Name must be a non-empty string",
        },
        { status: 400 }
      );
    }

    if (userName !== undefined && (!userName || typeof userName !== "string")) {
      return NextResponse.json(
        {
          success: false,
          error: "Username must be a non-empty string",
        },
        { status: 400 }
      );
    }

    if (password !== undefined && typeof password !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be a string",
        },
        { status: 400 }
      );
    }

    if (password !== undefined && password.length > 0 && password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    if (phone !== undefined && phone !== null && typeof phone !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Phone must be a string",
        },
        { status: 400 }
      );
    }

    if (isActive !== undefined && typeof isActive !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "isActive must be a boolean",
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: UpdateClientData = {};

    if (name !== undefined) updateData.name = name;
    if (userName !== undefined) updateData.userName = userName;
    if (password !== undefined && password.trim() !== "")
      updateData.password = password;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid fields provided for update",
        },
        { status: 400 }
      );
    }

    // Update the client
    const result = await updateClient(id, updateData);

    return NextResponse.json(result);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in PUT /api/client/[id]:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === "Client not found") {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }

      if (error.message.includes("already taken")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 } // Conflict
        );
      }

      if (
        error.message.includes("required") ||
        error.message.includes("Invalid") ||
        error.message.includes("must be")
      ) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
