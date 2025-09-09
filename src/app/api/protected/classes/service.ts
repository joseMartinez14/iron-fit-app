import { prisma } from "@/lib/prisma";

interface SingleClassData {
  name: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: string;
  isCancelled: boolean; // Changed from status to isCancelled
  clerkUserId: string;
}

interface RecurringClassData {
  name: string;
  description?: string;
  days: string[];
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  capacity: string;
  isCancelled: boolean; // Changed from status to isCancelled
  clerkUserId: string;
}

interface UpdateClassData {
  id: string;
  name?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  capacity?: string;
  isCancelled?: boolean; // Changed from status to isCancelled
  clerkUserId: string;
}

interface DateRangeParams {
  startDate: string;
  endDate: string;
  clerkUserId: string;
}

// Updated interface to match the page component's ClassData
interface ClassSessionResponse {
  id: string;
  title: string;
  description?: string;
  location?: string;
  capacity: number;
  date: string;
  startTime: string;
  endTime: string;
  isCancelled: boolean;
  instructor: {
    id: string;
    name: string;
    email?: string; // Keep email for service but page will only use id and name
  };
  attendanceLogs: Array<{
    id: string;
    client: {
      id: string;
      name: string;
      phone?: string;
      isActive: boolean;
    };
    checkInTime: string;
    checkedInBy?: {
      id: string;
      name: string;
    };
  }>;
  attendeeCount: number;
}

export async function saveOneClass(data: SingleClassData) {
  const {
    name,
    description,
    date,
    startTime,
    endTime,
    capacity,
    isCancelled,
    clerkUserId,
  } = data;

  // Find instructor
  const instructorRecord = await prisma.admin.findFirst({
    where: { clerkId: clerkUserId },
  });

  if (!instructorRecord) {
    throw new Error("Instructor not found");
  }

  // Combine date and time for start and end DateTime
  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(`${date}T${endTime}`);

  const classSession = await prisma.classSession.create({
    data: {
      title: name,
      description: description || null,
      capacity: parseInt(capacity),
      date: new Date(date),
      startTime: startDateTime,
      endTime: endDateTime,
      instructorID: instructorRecord.id,
      isCancelled: isCancelled, // Use boolean directly
    },
  });

  return {
    classSession,
    message: "Single class created successfully",
  };
}

export async function saveMultipleClasses(data: RecurringClassData) {
  const {
    name,
    description,
    days,
    startDate,
    endDate,
    startTime,
    endTime,
    capacity,
    isCancelled,
    clerkUserId,
  } = data;

  console.log("Creating recurring classes with data:", data);

  // Find instructor
  const instructorRecord = await prisma.admin.findFirst({
    where: { clerkId: clerkUserId },
  });

  if (!instructorRecord) {
    throw new Error("Instructor not found");
  }

  // Convert day names to numbers (0 = Sunday, 1 = Monday, etc.)
  const dayMapping: { [key: string]: number } = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const selectedDays = days.map((day: string) => dayMapping[day]);
  const classSessions = [];

  // Generate all class sessions between start and end date
  console.log("Start Date:", startDate);
  console.log("End Date:", endDate);
  const currentDate = new Date(startDate);
  const endDateObj = new Date(endDate);
  console.log("Start Date obj:", currentDate);
  console.log("End Date obj:", endDateObj);

  while (currentDate <= endDateObj) {
    if (selectedDays.includes(currentDate.getDay())) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const startDateTime = new Date(`${dateStr}T${startTime}`);
      const endDateTime = new Date(`${dateStr}T${endTime}`);

      const classSession = await prisma.classSession.create({
        data: {
          title: name,
          description: description || null,
          capacity: parseInt(capacity),
          date: new Date(dateStr),
          startTime: startDateTime,
          endTime: endDateTime,
          instructorID: instructorRecord.id,
          isCancelled: isCancelled, // Use boolean directly
        },
      });

      classSessions.push(classSession);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    classSessions,
    message: `${classSessions.length} recurring classes created successfully`,
  };
}

export async function updateClass(data: UpdateClassData) {
  const {
    id,
    name,
    description,
    date,
    startTime,
    endTime,
    capacity,
    isCancelled,
    clerkUserId,
  } = data;

  // Verify the authenticated user is an admin
  const authenticatedAdmin = await prisma.admin.findFirst({
    where: { clerkId: clerkUserId },
  });

  if (!authenticatedAdmin) {
    throw new Error("Admin user not found. Please contact support.");
  }

  // Check if the class exists
  const existingClass = await prisma.classSession.findUnique({
    where: { id },
    include: {
      instructor: true,
    },
  });

  if (!existingClass) {
    throw new Error("Class not found");
  }

  // Prepare update data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};

  if (name !== undefined) updateData.title = name;
  if (description !== undefined) updateData.description = description || null;
  if (capacity !== undefined) updateData.capacity = parseInt(capacity);
  if (isCancelled !== undefined) updateData.isCancelled = isCancelled; // Use boolean directly

  // Handle date and time updates
  if (date !== undefined) updateData.date = new Date(date);

  if (startTime !== undefined || endTime !== undefined || date !== undefined) {
    const classDate = date || existingClass.date.toISOString().split("T")[0];

    if (startTime !== undefined) {
      updateData.startTime = new Date(`${classDate}T${startTime}`);
    }

    if (endTime !== undefined) {
      updateData.endTime = new Date(`${classDate}T${endTime}`);
    }

    // If only date changed, update the time components too
    if (
      date !== undefined &&
      startTime === undefined &&
      endTime === undefined
    ) {
      const existingStartTime = existingClass.startTime
        .toTimeString()
        .split(" ")[0];
      const existingEndTime = existingClass.endTime
        .toTimeString()
        .split(" ")[0];
      updateData.startTime = new Date(`${date}T${existingStartTime}`);
      updateData.endTime = new Date(`${date}T${existingEndTime}`);
    }
  }

  // Update the class session
  const updatedClassSession = await prisma.classSession.update({
    where: { id },
    data: updateData,
    include: {
      instructor: true,
    },
  });

  return {
    classSession: updatedClassSession,
    message: "Class updated successfully",
    updatedBy: authenticatedAdmin.name,
  };
}

export async function getClassesByDateRange(data: DateRangeParams) {
  const { startDate, endDate, clerkUserId } = data;

  // Verify the authenticated user is an admin
  const authenticatedAdmin = await prisma.admin.findFirst({
    where: { clerkId: clerkUserId },
  });

  if (!authenticatedAdmin) {
    throw new Error("Admin user not found. Please contact support.");
  }

  // Validate date format
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  if (startDateObj > endDateObj) {
    throw new Error("Start date cannot be after end date");
  }

  // Create start and end of day boundaries
  const startOfRange = new Date(
    startDateObj.getFullYear(),
    startDateObj.getMonth(),
    startDateObj.getDate()
  );
  const endOfRange = new Date(
    endDateObj.getFullYear(),
    endDateObj.getMonth(),
    endDateObj.getDate(),
    23,
    59,
    59,
    999
  );

  // Fetch classes within the date range
  const classes = await prisma.classSession.findMany({
    where: {
      date: {
        gte: startOfRange,
        lte: endOfRange,
      },
    },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          attendanceLogs: true,
        },
      },
    },
    orderBy: [
      {
        date: "asc",
      },
      {
        startTime: "asc",
      },
    ],
  });

  // Group classes by date for better organization
  const groupedClasses = classes.reduce((acc, classSession) => {
    const dateKey = classSession.date.toISOString().split("T")[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(classSession);
    return acc;
  }, {} as Record<string, typeof classes>);

  return {
    classes,
    groupedClasses,
    count: classes.length,
    dateRange: {
      startDate,
      endDate,
    },
    daysInRange:
      Math.ceil(
        (endOfRange.getTime() - startOfRange.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1,
    message: `Found ${classes.length} classes between ${startDate} and ${endDate}`,
  };
}

// Server-side function (no auth check needed since it's called from server component)
export async function getClassesByDateRangeServer(
  startDate: string,
  endDate: string
) {
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  // Parse the date strings and create start/end of day
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  // Validate date range
  if (startDateObj > endDateObj) {
    throw new Error("Start date cannot be after end date");
  }

  // Create start of start date and end of end date
  const startOfRange = new Date(
    startDateObj.getFullYear(),
    startDateObj.getMonth(),
    startDateObj.getDate()
  );
  const endOfRange = new Date(
    endDateObj.getFullYear(),
    endDateObj.getMonth(),
    endDateObj.getDate(),
    23,
    59,
    59,
    999
  );

  // Fetch all classes within the date range
  const classes = await prisma.classSession.findMany({
    where: {
      date: {
        gte: startOfRange,
        lte: endOfRange,
      },
    },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          attendanceLogs: true,
        },
      },
      // Remove this if you're trying to include reservations with status filter
      // reservations: {
      //   where: {
      //     status: 'reserved', // This line might be causing the error
      //   },
      //   include: {
      //     client: {
      //       select: {
      //         id: true,
      //         name: true,
      //         email: true,
      //       },
      //     },
      //   },
      // },
    },
    orderBy: [
      {
        date: "asc",
      },
      {
        startTime: "asc",
      },
    ],
  });

  return {
    classes,
    dateRange: {
      startDate,
      endDate,
    },
    count: classes.length,
  };
}

// Updated function that properly uses the Reservation model's status enum
export async function getClassesByDateRangeWithReservations(
  startDate: string,
  endDate: string
) {
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  if (startDateObj > endDateObj) {
    throw new Error("Start date cannot be after end date");
  }

  const startOfRange = new Date(
    startDateObj.getFullYear(),
    startDateObj.getMonth(),
    startDateObj.getDate()
  );
  const endOfRange = new Date(
    endDateObj.getFullYear(),
    endDateObj.getMonth(),
    endDateObj.getDate(),
    23,
    59,
    59,
    999
  );

  // Fetch classes with reservations using the correct status field
  const classes = await prisma.classSession.findMany({
    where: {
      date: {
        gte: startOfRange,
        lte: endOfRange,
      },
    },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          attendanceLogs: true,
        },
      },
    },
    orderBy: [
      {
        date: "asc",
      },
      {
        startTime: "asc",
      },
    ],
  });

  return {
    classes,
    dateRange: {
      startDate,
      endDate,
    },
    count: classes.length,
  };
}

// Helper function to calculate week dates
export function getWeekDates(weekOffset: number = 0) {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate days to subtract to get to Monday
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

  // Get Monday of current week, then add week offset
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  // Get Sunday of that week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    startDate: monday.toISOString().split("T")[0],
    endDate: sunday.toISOString().split("T")[0],
    mondayDate: monday,
    sundayDate: sunday,
  };
}

// Function to get a specific class session by ID
export async function getClassSessionById(classId: string) {
  try {
    // Validate input
    if (!classId || typeof classId !== "string") {
      return {
        success: false,
        error: "Class ID is required and must be a string",
      };
    }

    // Fetch the class session with all related data
    const classSession = await prisma.classSession.findUnique({
      where: { id: classId },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attendanceLogs: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
                isActive: true,
              },
            },
            checkedInBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            checkInTime: "asc", // Order by check-in time
          },
        },
        _count: {
          select: {
            attendanceLogs: true,
          },
        },
      },
    });

    if (!classSession) {
      return {
        success: false,
        error: "Class session not found",
      };
    }

    // Format the response data
    const formattedClassSession: ClassSessionResponse = {
      id: classSession.id,
      title: classSession.title,
      description: classSession.description || undefined,
      location: classSession.location || undefined,
      capacity: classSession.capacity,
      date: classSession.date.toISOString(),
      startTime: classSession.startTime.toISOString(),
      endTime: classSession.endTime.toISOString(),
      isCancelled: classSession.isCancelled,
      instructor: {
        id: classSession.instructor.id,
        name: classSession.instructor.name,
        email: classSession.instructor.email,
      },
      attendanceLogs: classSession.attendanceLogs.map((log) => ({
        id: log.id,
        client: {
          id: log.client.id,
          name: log.client.name,
          phone: log.client.phone || undefined,
          isActive: log.client.isActive,
        },
        checkInTime: log.checkInTime.toISOString(),
        checkedInBy: log.checkedInBy
          ? {
              id: log.checkedInBy.id,
              name: log.checkedInBy.name,
            }
          : undefined,
      })),
      attendeeCount: classSession._count.attendanceLogs,
    };

    return {
      success: true,
      classSession: formattedClassSession,
      message: "Class session retrieved successfully",
    };
  } catch (error) {
    console.error("Error getting class session by ID:", error);

    if (error instanceof Error) {
      // Handle Prisma-specific errors
      if (error.message.includes("Invalid ID")) {
        return {
          success: false,
          error: "Invalid class ID format",
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to retrieve class session due to an unexpected error",
    };
  }
}

// Function to get basic class info (without heavy relations) - Updated
export async function getClassBasicInfo(classId: string) {
  try {
    if (!classId || typeof classId !== "string") {
      return {
        success: false,
        error: "Class ID is required and must be a string",
      };
    }

    const classSession = await prisma.classSession.findUnique({
      where: { id: classId },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        capacity: true,
        date: true,
        startTime: true,
        endTime: true,
        isCancelled: true,
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            attendanceLogs: true,
          },
        },
      },
    });

    if (!classSession) {
      return {
        success: false,
        error: "Class session not found",
      };
    }

    return {
      success: true,
      classSession: {
        id: classSession.id,
        title: classSession.title,
        description: classSession.description || undefined,
        location: classSession.location || undefined,
        capacity: classSession.capacity,
        date: classSession.date.toISOString(),
        startTime: classSession.startTime.toISOString(),
        endTime: classSession.endTime.toISOString(),
        isCancelled: classSession.isCancelled,
        instructor: classSession.instructor,
        attendeeCount: classSession._count.attendanceLogs,
      },
      message: "Class basic info retrieved successfully",
    };
  } catch (error) {
    console.error("Error getting class basic info:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to retrieve class basic information",
    };
  }
}

// Add this interface with your other interfaces
interface UpdateClassWithAttendeesData {
  title: string;
  description?: string;
  location?: string;
  capacity: number;
  date: string;
  startTime: string;
  endTime: string;
  isCancelled: boolean;
  attendeeIds: string[];
}

// Function to update class session with attendees
export async function updateClassSessionWithAttendees(
  classId: string,
  data: UpdateClassWithAttendeesData,
  clerkUserId: string
) {
  try {
    // Validate input
    if (!classId || typeof classId !== "string") {
      return {
        success: false,
        error: "Class ID is required and must be a string",
      };
    }

    // Verify the authenticated user is an admin
    const authenticatedAdmin = await prisma.admin.findFirst({
      where: { clerkId: clerkUserId },
    });

    if (!authenticatedAdmin) {
      return {
        success: false,
        error: "Admin user not found. Please contact support.",
      };
    }

    // Check if the class exists
    const existingClass = await prisma.classSession.findUnique({
      where: { id: classId },
      include: {
        instructor: true,
        attendanceLogs: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!existingClass) {
      return {
        success: false,
        error: "Class session not found",
      };
    }

    // Validate attendeeIds - ensure all clients exist
    if (data.attendeeIds && data.attendeeIds.length > 0) {
      const existingClients = await prisma.client.findMany({
        where: {
          id: { in: data.attendeeIds },
          //isActive: true, // Only allow active clients (uncomment if needed)
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (existingClients.length !== data.attendeeIds.length) {
        const foundIds = existingClients.map((client) => client.id);
        const missingIds = data.attendeeIds.filter(
          (id) => !foundIds.includes(id)
        );
        return {
          success: false,
          error: `The following client IDs are invalid or inactive: ${missingIds.join(
            ", "
          )}`,
        };
      }

      // Check capacity
      if (data.attendeeIds.length > data.capacity) {
        return {
          success: false,
          error: `Cannot add ${data.attendeeIds.length} attendees. Class capacity is ${data.capacity}.`,
        };
      }
    }

    // Perform the update in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update the class session basic information
      const updatedClass = await tx.classSession.update({
        where: { id: classId },
        data: {
          title: data.title,
          description: data.description || null,
          location: data.location || null,
          capacity: data.capacity,
          date: new Date(data.date),
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          isCancelled: data.isCancelled,
        },
      });

      // 2. Handle attendee updates if provided
      if (data.attendeeIds !== undefined) {
        // Remove all existing attendance logs for this session
        await tx.attendanceLog.deleteMany({
          where: { sessionId: classId },
        });

        // Create new attendance logs for selected attendees
        if (data.attendeeIds.length > 0) {
          await tx.attendanceLog.createMany({
            data: data.attendeeIds.map((clientId) => ({
              sessionId: classId,
              clientId: clientId,
              checkedInById: authenticatedAdmin.id, // Track who added them
            })),
          });
        }
      }

      return updatedClass;
    });

    // Fetch the complete updated class with attendees for response
    const updatedClassWithAttendees = await prisma.classSession.findUnique({
      where: { id: classId },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attendanceLogs: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
                isActive: true,
              },
            },
            checkedInBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            checkInTime: "asc",
          },
        },
        _count: {
          select: {
            attendanceLogs: true,
          },
        },
      },
    });

    if (!updatedClassWithAttendees) {
      return {
        success: false,
        error: "Failed to retrieve updated class information",
      };
    }

    // Calculate changes for response
    const previousAttendeeIds = existingClass.attendanceLogs.map(
      (log) => log.clientId
    );
    const newAttendeeIds = data.attendeeIds || [];
    const addedAttendees = newAttendeeIds.filter(
      (id) => !previousAttendeeIds.includes(id)
    );
    const removedAttendees = previousAttendeeIds.filter(
      (id) => !newAttendeeIds.includes(id)
    );

    return {
      success: true,
      message: `Class "${updatedClassWithAttendees.title}" updated successfully`,
      classSession: {
        id: updatedClassWithAttendees.id,
        title: updatedClassWithAttendees.title,
        description: updatedClassWithAttendees.description || undefined,
        location: updatedClassWithAttendees.location || undefined,
        capacity: updatedClassWithAttendees.capacity,
        date: updatedClassWithAttendees.date.toISOString(),
        startTime: updatedClassWithAttendees.startTime.toISOString(),
        endTime: updatedClassWithAttendees.endTime.toISOString(),
        isCancelled: updatedClassWithAttendees.isCancelled,
        instructor: updatedClassWithAttendees.instructor,
        attendanceLogs: updatedClassWithAttendees.attendanceLogs.map((log) => ({
          id: log.id,
          client: {
            id: log.client.id,
            name: log.client.name,
            phone: log.client.phone || undefined,
            isActive: log.client.isActive,
          },
          checkInTime: log.checkInTime.toISOString(),
          checkedInBy: log.checkedInBy
            ? {
                id: log.checkedInBy.id,
                name: log.checkedInBy.name,
              }
            : undefined,
        })),
        attendeeCount: updatedClassWithAttendees._count.attendanceLogs,
      },
      changes: {
        classInfoUpdated: true,
        attendeesUpdated: data.attendeeIds !== undefined,
        attendeesAdded: addedAttendees.length,
        attendeesRemoved: removedAttendees.length,
        totalAttendees: newAttendeeIds.length,
      },
      updatedBy: authenticatedAdmin.name,
    };
  } catch (error) {
    console.error("Error updating class session with attendees:", error);

    if (error instanceof Error) {
      // Handle Prisma-specific errors
      if (error.message.includes("Unique constraint")) {
        return {
          success: false,
          error: "A constraint violation occurred. Please check your data.",
        };
      }

      if (error.message.includes("Foreign key constraint")) {
        return {
          success: false,
          error: "One or more referenced records do not exist.",
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to update class session due to an unexpected error",
    };
  }
}

// Helper function to validate class update data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateClassUpdateData(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (
    !data.title ||
    typeof data.title !== "string" ||
    data.title.trim().length === 0
  ) {
    errors.push("Title is required and must be a non-empty string");
  }

  if (data.title && data.title.length > 100) {
    errors.push("Title must not exceed 100 characters");
  }

  if (data.description && data.description.length > 500) {
    errors.push("Description must not exceed 500 characters");
  }

  if (data.location && data.location.length > 100) {
    errors.push("Location must not exceed 100 characters");
  }

  if (
    !data.capacity ||
    typeof data.capacity !== "number" ||
    data.capacity < 1
  ) {
    errors.push("Capacity must be a positive number");
  }

  if (data.capacity && data.capacity > 1000) {
    errors.push("Capacity cannot exceed 1000");
  }

  if (!data.date || typeof data.date !== "string") {
    errors.push("Date is required and must be a string in YYYY-MM-DD format");
  }

  if (!data.startTime || typeof data.startTime !== "string") {
    errors.push("Start time is required and must be a valid ISO string");
  }

  if (!data.endTime || typeof data.endTime !== "string") {
    errors.push("End time is required and must be a valid ISO string");
  }

  // Validate date formats
  if (data.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      errors.push("Date must be in YYYY-MM-DD format");
    }
  }

  // Validate time logic
  if (data.startTime && data.endTime) {
    try {
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);

      if (startTime >= endTime) {
        errors.push("End time must be after start time");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      errors.push("Invalid date/time format");
    }
  }

  if (typeof data.isCancelled !== "boolean") {
    errors.push("isCancelled must be a boolean value");
  }

  if (data.attendeeIds) {
    if (!Array.isArray(data.attendeeIds)) {
      errors.push("attendeeIds must be an array");
    } else {
      const invalidIds = data.attendeeIds.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (id: any) => !id || typeof id !== "string"
      );
      if (invalidIds.length > 0) {
        errors.push("All attendee IDs must be valid non-empty strings");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
