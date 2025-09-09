import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { editClientGroupWithValidation, EditClientGroupData } from "../service";
import { checkAdminAuth } from "@/app/api/service";

export async function PUT(req: NextRequest) {
  try {
    const segments = req.nextUrl.pathname.split("/").filter(Boolean);
    const groupId = segments[segments.length - 1];

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
      return NextResponse.json(
        {
          success: false,
          error: adminAuthResult.error || "Admin authentication failed",
        },
        { status: 403 }
      );
    }

    // Validate groupId parameter
    if (!groupId) {
      return NextResponse.json(
        {
          success: false,
          error: "Group ID is required",
        },
        { status: 400 }
      );
    }

    // Parse the request body
    let body;
    try {
      body = await req.json();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 }
      );
    }

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

    // Validate clientIds are strings
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

    // Prepare group data for the service function
    const groupData: EditClientGroupData = {
      name: name.trim(),
      description: description ? description.trim() : undefined,
      clientIds: [...new Set(clientIds)], // Remove duplicates
    };

    // Log the update operation
    console.log(`Updating group ${groupId} with data:`, {
      name: groupData.name,
      description: groupData.description,
      clientCount: groupData.clientIds.length,
    });

    // Update the client group using the service function
    const result = await editClientGroupWithValidation(groupId, groupData);

    // Log successful update
    console.log(`Group ${groupId} updated successfully`);

    return NextResponse.json(result, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in PUT /api/client/group/[id]:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Group not found
      if (
        error.message.includes("not found") ||
        error.message.includes("Group not found")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Group not found",
          },
          { status: 404 }
        );
      }

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
          { status: 409 }
        );
      }

      // Validation errors
      if (
        error.message.includes("required") ||
        error.message.includes("must be") ||
        error.message.includes("invalid") ||
        error.message.includes("at least") ||
        error.message.includes("exceed") ||
        error.message.includes("cannot have more")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 400 }
        );
      }

      // Client ID validation errors
      if (
        error.message.includes("client IDs") ||
        error.message.includes("do not exist")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 400 }
        );
      }

      // Generic error with message
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
        error: "Internal server error while updating group",
      },
      { status: 500 }
    );
  }
}

// Optional: Add GET method for retrieving a specific group
export async function GET(
  req: NextRequest
) {
  try {
    const segments = req.nextUrl.pathname.split("/").filter(Boolean);
    const groupId = segments[segments.length - 1];

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
      return NextResponse.json(
        {
          success: false,
          error: adminAuthResult.error || "Admin authentication failed",
        },
        { status: 403 }
      );
    }

    // Validate groupId parameter
    if (!groupId) {
      return NextResponse.json(
        {
          success: false,
          error: "Group ID is required",
        },
        { status: 400 }
      );
    }

    // Import the getClientGroupById function
    const { getClientGroupById } = await import("../service");

    // Get the group
    const result = await getClientGroupById(groupId);

    return NextResponse.json(result, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in GET /api/client/group/[id]:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          {
            success: false,
            error: "Group not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while fetching group",
      },
      { status: 500 }
    );
  }
}

// Optional: Add DELETE method for deleting a group
export async function DELETE(
  req: NextRequest
) {
  try {
    const segments = req.nextUrl.pathname.split("/").filter(Boolean);
    const groupId = segments[segments.length - 1];

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
      return NextResponse.json(
        {
          success: false,
          error: adminAuthResult.error || "Admin authentication failed",
        },
        { status: 403 }
      );
    }

    // Validate groupId parameter
    if (!groupId) {
      return NextResponse.json(
        {
          success: false,
          error: "Group ID is required",
        },
        { status: 400 }
      );
    }

    // Import the deleteClientGroup function
    const { deleteClientGroup } = await import("../service");

    // Delete the group
    const result = await deleteClientGroup(groupId);

    console.log(`Group ${groupId} deleted successfully`);

    return NextResponse.json(result, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in DELETE /api/client/group/[id]:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          {
            success: false,
            error: "Group not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while deleting group",
      },
      { status: 500 }
    );
  }
}
