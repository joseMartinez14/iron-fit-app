import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createClientGroupWithValidation,
  CreateClientGroupData,
} from "./service";
import { checkAdminAuth } from "../../../service";

export async function POST(req: NextRequest) {
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
    const adminAuthResult = await checkAdminAuth(userId);

    if (!adminAuthResult.success) {
      return adminAuthResult.error!;
    }

    // Parse the request body
    const body = await req.json();
    const { name, description, clientIds } = body;

    // Validate required fields
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Group name is required and must be a string",
        },
        { status: 400 }
      );
    }

    if (!clientIds || !Array.isArray(clientIds)) {
      return NextResponse.json(
        {
          success: false,
          error: "Client IDs must be provided as an array",
        },
        { status: 400 }
      );
    }

    if (clientIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one client must be selected for the group",
        },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (description !== undefined && typeof description !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Description must be a string",
        },
        { status: 400 }
      );
    }

    // Validate client IDs are strings
    const invalidClientIds = clientIds.filter(
      (id) => !id || typeof id !== "string"
    );
    if (invalidClientIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "All client IDs must be valid strings",
        },
        { status: 400 }
      );
    }

    // Prepare group data
    const groupData: CreateClientGroupData = {
      name: name.trim(),
      description:
        description && description.trim() ? description.trim() : undefined,
      clientIds: [...new Set(clientIds)], // Remove duplicates
    };

    // Create the client group using the service function with validation
    const result = await createClientGroupWithValidation(groupData);

    return NextResponse.json(result, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in POST /api/client/group:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Group name already exists
      if (
        error.message.includes("already exists") ||
        error.message.includes("already taken")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 409 } // Conflict
        );
      }

      // Validation errors
      if (
        error.message.includes("required") ||
        error.message.includes("must be") ||
        error.message.includes("invalid") ||
        error.message.includes("At least") ||
        error.message.includes("cannot have more than") ||
        error.message.includes("Duplicate")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 400 }
        );
      }

      // Client not found errors
      if (error.message.includes("invalid or inactive")) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 404 }
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

// Optional: Add GET method to retrieve all groups
export async function GET() {
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

    // This would require implementing getAllGroups in your service
    // const result = await getAllGroups();
    // return NextResponse.json(result);

    return NextResponse.json(
      {
        success: false,
        error: "GET method not implemented yet",
      },
      { status: 501 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in GET /api/client/group:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
