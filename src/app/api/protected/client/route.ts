import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createClient, CreateClientData } from "./service";
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

    // Parse the request body
    const body = await req.json();

    console.log("Request body:", body); // Debugging log
    const { name, userName, password, phone, isActive } = body;

    // Validate required fields
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Name is required and must be a string",
        },
        { status: 400 }
      );
    }

    if (!userName || typeof userName !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Username is required and must be a string",
        },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Password is required and must be a string",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (phone !== undefined && phone !== null && typeof phone !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Phone must be a string",
        },
        { status: 400 }
      );
    }

    const clientData: CreateClientData = {
      name: name.trim(),
      userName: userName.trim(),
      password: password,
      phone: phone && phone.trim() ? phone.trim() : undefined,
      isActive: typeof isActive === "boolean" ? isActive : false,
    };

    // Create the client using the service function
    const result = await createClient(clientData);

    return NextResponse.json(result, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in POST /api/client:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Check for username already taken error
      if (error.message.includes("already taken")) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 409 } // Conflict
        );
      }

      // Check for validation errors
      if (
        error.message.includes("required") ||
        error.message.includes("Invalid") ||
        error.message.includes("must be")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 400 }
        );
      }

      // Generic error
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    // Unknown error
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
