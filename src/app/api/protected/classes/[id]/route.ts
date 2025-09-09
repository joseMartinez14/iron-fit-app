/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  updateClassSessionWithAttendees,
  getClassSessionById,
  validateClassUpdateData,
} from "../service";

// Helper to extract [id] from the URL
function getClassIdFromUrl(req: NextRequest) {
  const urlParts = req.nextUrl.pathname.split("/");
  return urlParts[urlParts.length - 1];
}

export async function PUT(req: NextRequest) {
  try {
    const classId = getClassIdFromUrl(req);

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

    // Validate classId parameter
    if (!classId) {
      return NextResponse.json(
        {
          success: false,
          error: "Class ID is required",
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

    // Validate the request data
    const validation = validateClassUpdateData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Extract data from request body
    const {
      title,
      description,
      location,
      capacity,
      date,
      startTime,
      endTime,
      isCancelled,
      attendeeIds,
    } = body;

    // Helper function to create proper ISO datetime
    const createDateTime = (date: string, time: string) => {
      // Check if time is already a full ISO string
      if (time.includes("T") && time.includes("Z")) {
        // It's already an ISO string, just return it
        return time;
      }

      // It's a time-only string (HH:MM), combine with date
      return new Date(`${date}T${time}`).toISOString();
    };

    // Prepare update data
    const updateData = {
      title: title.trim(),
      description: description?.trim(),
      location: location?.trim(),
      capacity: parseInt(capacity),
      date,
      startTime: createDateTime(date, startTime),
      endTime: createDateTime(date, endTime),
      isCancelled,
      attendeeIds: attendeeIds || [],
    };

    // Log the update operation
    console.log(`Updating class ${classId} by user ${userId}`, {
      title: updateData.title,
      capacity: updateData.capacity,
      attendeeCount: updateData.attendeeIds.length,
      isCancelled: updateData.isCancelled,
    });

    // Update the class session using the service function
    const result = await updateClassSessionWithAttendees(
      classId,
      updateData,
      userId
    );

    if (!result.success) {
      // Determine appropriate status code based on error
      let statusCode = 500;
      if (result.error?.includes("not found")) {
        statusCode = 404;
      } else if (result.error?.includes("Admin user not found")) {
        statusCode = 403;
      } else if (
        result.error?.includes("invalid") ||
        result.error?.includes("capacity") ||
        result.error?.includes("inactive")
      ) {
        statusCode = 400;
      }

      return NextResponse.json(result, { status: statusCode });
    }

    // Log successful update
    console.log(`Class ${classId} updated successfully by ${result.updatedBy}`);

    return NextResponse.json(result, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in PUT /api/classes/[id]:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Database connection errors
      if (
        error.message.includes("connect") ||
        error.message.includes("timeout")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Database connection error. Please try again.",
          },
          { status: 503 }
        );
      }

      // Validation errors
      if (
        error.message.includes("validation") ||
        error.message.includes("invalid")
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
        error: "Internal server error while updating class",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const classId = getClassIdFromUrl(req);

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

    // Validate classId parameter
    if (!classId) {
      return NextResponse.json(
        {
          success: false,
          error: "Class ID is required",
        },
        { status: 400 }
      );
    }

    // Get the class session
    const result = await getClassSessionById(classId);

    if (!result.success) {
      const statusCode = result.error?.includes("not found") ? 404 : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error in GET /api/classes/[id]:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error while fetching class",
      },
      { status: 500 }
    );
  }
}

// Optional: Add DELETE method for deleting classes
export async function DELETE(req: NextRequest) {
  try {
    const classId = getClassIdFromUrl(req);

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

    // Validate classId parameter
    if (!classId) {
      return NextResponse.json(
        {
          success: false,
          error: "Class ID is required",
        },
        { status: 400 }
      );
    }

    // Import delete function (you'll need to create this)
    // const { deleteClassSession } = await import("../service");
    // const result = await deleteClassSession(classId, userId);

    // For now, return not implemented
    return NextResponse.json(
      {
        success: false,
        error: "Delete functionality not implemented yet",
      },
      { status: 501 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in DELETE /api/classes/[id]:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error while deleting class",
      },
      { status: 500 }
    );
  }
}
