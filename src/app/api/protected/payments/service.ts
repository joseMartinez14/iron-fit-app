/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import type {
  PaymentResponse,
  PaymentFilters,
  PaymentServiceResponse,
  PaymentServiceStats,
  ClientPaymentResponse,
  PaymentStatsResponse,
  ClientsWithoutRecentPaymentsResponse,
  CreatePaymentData,
  CreatePaymentResponse,
} from "@/types/payment";

// Function to get the last payment of each client
export async function getLastPaymentPerClient(
  filters: PaymentFilters = {}
): Promise<PaymentServiceResponse<PaymentResponse>> {
  try {
    const {
      includeInactiveClients = false,
      statusFilter,
      validUntilAfter,
      validUntilBefore,
    } = filters;

    // Build where clause for clients
    const clientWhereClause: { isActive?: boolean } = {};
    if (!includeInactiveClients) {
      clientWhereClause.isActive = true;
    }

    // Build where clause for payments with proper enum typing
    const paymentWhereClause: {
      status?: "paid" | "pending" | "failed";
      validUntil?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (statusFilter) {
      paymentWhereClause.status = statusFilter;
    }
    if (validUntilAfter || validUntilBefore) {
      paymentWhereClause.validUntil = {};
      if (validUntilAfter) {
        paymentWhereClause.validUntil.gte = new Date(validUntilAfter);
      }
      if (validUntilBefore) {
        paymentWhereClause.validUntil.lte = new Date(validUntilBefore);
      }
    }

    // Get all clients with their latest payment
    const clientsWithLastPayment = await prisma.client.findMany({
      where: clientWhereClause,
      include: {
        payments: {
          where: paymentWhereClause,
          orderBy: {
            paymentDate: "desc",
          },
          take: 1, // Only get the most recent payment
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Filter out clients who don't have any payments (if filters are applied)
    const clientsWithPayments = clientsWithLastPayment.filter(
      (client) => client.payments.length > 0
    );

    // Transform the data to match the expected format
    const lastPayments: PaymentResponse[] = clientsWithPayments.map(
      (client) => {
        const lastPayment = client.payments[0]; // We only took 1, so it's the latest

        return {
          id: lastPayment.id,
          amount: lastPayment.amount,
          status: lastPayment.status, // Already typed correctly from Prisma
          paymentDate: lastPayment.paymentDate.toISOString(),
          validUntil: lastPayment.validUntil.toISOString(),
          client: {
            id: client.id,
            name: client.name,
            phone: client.phone || undefined,
            isActive: client.isActive,
          },
        };
      }
    );

    // Calculate summary statistics
    const stats: PaymentServiceStats = {
      totalClients: clientsWithLastPayment.length,
      clientsWithPayments: clientsWithPayments.length,
      clientsWithoutPayments:
        clientsWithLastPayment.length - clientsWithPayments.length,
      paidPayments: lastPayments.filter((p) => p.status === "paid").length,
      pendingPayments: lastPayments.filter((p) => p.status === "pending")
        .length,
      failedPayments: lastPayments.filter((p) => p.status === "failed").length,
      totalAmount: lastPayments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.amount, 0),
      expiredPayments: lastPayments.filter(
        (p) => new Date(p.validUntil) < new Date()
      ).length,
    };

    return {
      success: true,
      payments: lastPayments,
      stats,
      message: `Retrieved last payment for ${lastPayments.length} clients`,
    };
  } catch (error) {
    console.error("Error getting last payment per client:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
        payments: [],
        stats: null,
      };
    }

    return {
      success: false,
      error: "Failed to retrieve last payments due to an unexpected error",
      payments: [],
      stats: null,
    };
  }
}

// Alternative function using raw SQL for better performance on large datasets
export async function getLastPaymentPerClientOptimized(
  filters: PaymentFilters = {}
): Promise<PaymentServiceResponse<PaymentResponse>> {
  try {
    const {
      includeInactiveClients = false,
      statusFilter,
      validUntilAfter,
      validUntilBefore,
    } = filters;

    // Build SQL conditions
    const conditions = ["1=1"]; // Start with a true condition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [];
    let paramIndex = 1;

    // Client active filter
    if (!includeInactiveClients) {
      conditions.push(`c."isActive" = $${paramIndex}`);
      params.push(true);
      paramIndex++;
    }

    // Payment status filter
    if (statusFilter) {
      conditions.push(`p."status" = $${paramIndex}`);
      params.push(statusFilter);
      paramIndex++;
    }

    // Valid until filters
    if (validUntilAfter) {
      conditions.push(`p."validUntil" >= $${paramIndex}`);
      params.push(new Date(validUntilAfter));
      paramIndex++;
    }

    if (validUntilBefore) {
      conditions.push(`p."validUntil" <= $${paramIndex}`);
      params.push(new Date(validUntilBefore));
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    // Raw SQL query to get the last payment per client
    const query = `
      WITH ranked_payments AS (
        SELECT 
          p."id",
          p."amount",
          p."status",
          p."paymentDate",
          p."validUntil",
          p."clientId",
          c."name" as client_name,
          c."phone" as client_phone,
          c."isActive" as client_is_active,
          ROW_NUMBER() OVER (PARTITION BY p."clientId" ORDER BY p."paymentDate" DESC) as rn
        FROM "Payment" p
        INNER JOIN "Client" c ON p."clientId" = c."id"
        WHERE ${whereClause}
      )
      SELECT 
        id,
        amount,
        status,
        "paymentDate",
        "validUntil",
        "clientId",
        client_name,
        client_phone,
        client_is_active
      FROM ranked_payments
      WHERE rn = 1
      ORDER BY client_name ASC;
    `;

    const rawResults = await prisma.$queryRawUnsafe(query, ...params);

    // Transform raw results to match expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastPayments: PaymentResponse[] = (rawResults as any[]).map(
      (row) => ({
        id: row.id,
        amount: row.amount,
        status: row.status,
        paymentDate: row.paymentDate.toISOString(),
        validUntil: row.validUntil.toISOString(),
        client: {
          id: row.clientId,
          name: row.client_name,
          phone: row.client_phone || undefined,
          isActive: row.client_is_active,
        },
      })
    );

    // Calculate stats
    const stats: PaymentServiceStats = {
      totalPayments: lastPayments.length,
      paidPayments: lastPayments.filter((p) => p.status === "paid").length,
      pendingPayments: lastPayments.filter((p) => p.status === "pending")
        .length,
      failedPayments: lastPayments.filter((p) => p.status === "failed").length,
      totalAmount: lastPayments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.amount, 0),
      expiredPayments: lastPayments.filter(
        (p) => new Date(p.validUntil) < new Date()
      ).length,
    };

    return {
      success: true,
      payments: lastPayments,
      stats,
      message: `Retrieved last payment for ${lastPayments.length} clients (optimized)`,
    };
  } catch (error) {
    console.error("Error getting last payment per client (optimized):", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
        payments: [],
        stats: null,
      };
    }

    return {
      success: false,
      error: "Failed to retrieve last payments due to an unexpected error",
      payments: [],
      stats: null,
    };
  }
}

// Function to get all payments for a specific client
export async function getClientPayments(
  clientId: string
): Promise<ClientPaymentResponse> {
  try {
    if (!clientId || typeof clientId !== "string") {
      return {
        success: false,
        error: "Client ID is required and must be a string",
        payments: [],
      };
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
      },
    });

    if (!client) {
      return {
        success: false,
        error: "Client not found",
        payments: [],
      };
    }

    const payments: PaymentResponse[] = client.payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status, // Already correctly typed
      paymentDate: payment.paymentDate.toISOString(),
      validUntil: payment.validUntil.toISOString(),
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone || undefined,
        isActive: client.isActive,
      },
    }));

    return {
      success: true,
      payments,
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone || undefined,
        isActive: client.isActive,
      },
      message: `Retrieved ${payments.length} payments for client ${client.name}`,
    };
  } catch (error) {
    console.error("Error getting client payments:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
        payments: [],
      };
    }

    return {
      success: false,
      error: "Failed to retrieve client payments",
      payments: [],
    };
  }
}

// Function to get payment statistics
export async function getPaymentStats(): Promise<PaymentStatsResponse> {
  try {
    const [
      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      totalRevenue,
      expiredPayments,
      clientsWithPayments,
      clientsWithoutPayments,
    ] = await Promise.all([
      // Total payments count
      prisma.payment.count(),

      // Paid payments count
      prisma.payment.count({
        where: { status: "paid" },
      }),

      // Pending payments count
      prisma.payment.count({
        where: { status: "pending" },
      }),

      // Failed payments count
      prisma.payment.count({
        where: { status: "failed" },
      }),

      // Total revenue (sum of paid payments)
      prisma.payment.aggregate({
        where: { status: "paid" },
        _sum: { amount: true },
      }),

      // Expired payments count
      prisma.payment.count({
        where: {
          validUntil: {
            lt: new Date(),
          },
        },
      }),

      // Clients with at least one payment
      prisma.client.count({
        where: {
          payments: {
            some: {},
          },
        },
      }),

      // Clients without any payments
      prisma.client.count({
        where: {
          payments: {
            none: {},
          },
        },
      }),
    ]);

    return {
      success: true,
      stats: {
        totalPayments,
        paidPayments,
        pendingPayments,
        failedPayments,
        totalRevenue: totalRevenue._sum.amount || 0,
        expiredPayments,
        clientsWithPayments,
        clientsWithoutPayments,
        totalClients: clientsWithPayments + clientsWithoutPayments,
      },
      message: "Payment statistics retrieved successfully",
    };
  } catch (error) {
    console.error("Error getting payment stats:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
        stats: null,
      };
    }

    return {
      success: false,
      error: "Failed to retrieve payment statistics",
      stats: null,
    };
  }
}

// Function to get clients without recent payments (for follow-up)
export async function getClientsWithoutRecentPayments(
  daysThreshold: number = 30
): Promise<ClientsWithoutRecentPaymentsResponse> {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const clientsWithoutRecentPayments = await prisma.client.findMany({
      where: {
        isActive: true,
        OR: [
          // Clients with no payments at all
          {
            payments: {
              none: {},
            },
          },
          // Clients with no payments after threshold date
          {
            payments: {
              none: {
                paymentDate: {
                  gte: thresholdDate,
                },
              },
            },
          },
        ],
      },
      include: {
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
          take: 1, // Get the last payment for context
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const result = clientsWithoutRecentPayments.map((client) => ({
      id: client.id,
      name: client.name,
      phone: client.phone || undefined,
      isActive: client.isActive,
      lastPayment:
        client.payments.length > 0
          ? {
              id: client.payments[0].id,
              amount: client.payments[0].amount,
              status: client.payments[0].status,
              paymentDate: client.payments[0].paymentDate.toISOString(),
              validUntil: client.payments[0].validUntil.toISOString(),
            }
          : null,
      daysSinceLastPayment:
        client.payments.length > 0
          ? Math.floor(
              (Date.now() - client.payments[0].paymentDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null,
    }));

    return {
      success: true,
      clients: result,
      thresholdDays: daysThreshold,
      message: `Found ${result.length} clients without payments in the last ${daysThreshold} days`,
    };
  } catch (error) {
    console.error("Error getting clients without recent payments:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
        clients: [],
      };
    }

    return {
      success: false,
      error: "Failed to retrieve clients without recent payments",
      clients: [],
    };
  }
}

// Function to create a new payment
export async function createPayment(
  paymentData: CreatePaymentData,
  clerkUserId: string
): Promise<CreatePaymentResponse> {
  try {
    // Validate input data
    if (!paymentData.clientId || typeof paymentData.clientId !== "string") {
      return {
        success: false,
        error: "Client ID is required and must be a string",
      };
    }

    if (
      !paymentData.amount ||
      typeof paymentData.amount !== "number" ||
      paymentData.amount <= 0
    ) {
      return {
        success: false,
        error: "Amount is required and must be a positive number",
      };
    }

    if (
      !paymentData.paymentDate ||
      typeof paymentData.paymentDate !== "string"
    ) {
      return {
        success: false,
        error: "Payment date is required and must be a valid date string",
      };
    }

    if (!paymentData.validUntil || typeof paymentData.validUntil !== "string") {
      return {
        success: false,
        error: "Valid until date is required and must be a valid date string",
      };
    }

    const validStatuses = ["paid", "pending", "failed"];
    if (!paymentData.status || !validStatuses.includes(paymentData.status)) {
      return {
        success: false,
        error: "Status is required and must be one of: paid, pending, failed",
      };
    }

    // Validate date formats
    let paymentDate: Date;
    let validUntilDate: Date;

    try {
      paymentDate = new Date(paymentData.paymentDate);
      validUntilDate = new Date(paymentData.validUntil);

      if (isNaN(paymentDate.getTime()) || isNaN(validUntilDate.getTime())) {
        throw new Error("Invalid date format");
      }

      // Validate that validUntil is after paymentDate
      if (validUntilDate <= paymentDate) {
        return {
          success: false,
          error: "Valid until date must be after payment date",
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          "Invalid date format. Please use ISO date strings (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)",
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

    // Verify the client exists
    const client = await prisma.client.findUnique({
      where: { id: paymentData.clientId },
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
      },
    });

    if (!client) {
      return {
        success: false,
        error: "Client not found",
      };
    }

    // If client is inactive, auto-activate before creating payment
    if (!client.isActive) {
      await prisma.client.update({
        where: { id: client.id },
        data: { isActive: true },
      });
    }

    // Check for duplicate payment (optional business rule)
    if (paymentData.preventDuplicates) {
      const existingPayment = await prisma.payment.findFirst({
        where: {
          clientId: paymentData.clientId,
          amount: paymentData.amount,
          paymentDate: {
            gte: new Date(paymentDate.getTime() - 24 * 60 * 60 * 1000), // 24 hours before
            lte: new Date(paymentDate.getTime() + 24 * 60 * 60 * 1000), // 24 hours after
          },
        },
      });

      if (existingPayment) {
        return {
          success: false,
          error:
            "A similar payment already exists for this client on this date",
        };
      }
    }

    // Create the payment with correct field names
    const newPayment = await prisma.payment.create({
      data: {
        clientId: paymentData.clientId,
        amount: paymentData.amount,
        status: paymentData.status as "paid" | "pending" | "failed",
        paymentDate,
        validUntil: validUntilDate,
        notes: paymentData.notes?.trim() || null,
        createdById: authenticatedAdmin.id,
      },
      include: {
        client: {
          select: { id: true, name: true, phone: true, isActive: true },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Transform the response
    const paymentResponse: PaymentResponse = {
      id: newPayment.id,
      amount: newPayment.amount,
      status: newPayment.status,
      paymentDate: newPayment.paymentDate.toISOString(),
      validUntil: newPayment.validUntil.toISOString(),
      client: {
        id: newPayment.client.id,
        name: newPayment.client.name,
        phone: newPayment.client.phone || undefined,
        isActive: newPayment.client.isActive,
      },
    };

    return {
      success: true,
      payment: paymentResponse,
      message: `Payment of $${newPayment.amount} created successfully for ${newPayment.client.name}`,
      createdBy: newPayment.createdBy.name,
    };
  } catch (error) {
    console.error("Error creating payment:", error);

    if (error instanceof Error) {
      // Handle Prisma-specific errors
      if (error.message.includes("Unique constraint")) {
        return {
          success: false,
          error: "A payment with these details already exists",
        };
      }

      if (error.message.includes("Foreign key constraint")) {
        return {
          success: false,
          error: "Referenced client or admin does not exist",
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to create payment due to an unexpected error",
    };
  }
}

// Function to update an existing payment
export async function updatePayment(
  paymentId: string,
  updateData: Partial<CreatePaymentData>,
  clerkUserId: string
): Promise<CreatePaymentResponse> {
  try {
    // Validate payment ID
    if (!paymentId || typeof paymentId !== "string") {
      return {
        success: false,
        error: "Payment ID is required and must be a string",
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

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        client: true,
      },
    });

    if (!existingPayment) {
      return {
        success: false,
        error: "Payment not found",
      };
    }

    // Build update object with correct types
    const updatePaymentData: {
      amount?: number;
      status?: "paid" | "pending" | "failed";
      paymentDate?: Date;
      validUntil?: Date;
      notes?: string | null;
    } = {};

    if (updateData.amount !== undefined) {
      if (typeof updateData.amount !== "number" || updateData.amount <= 0) {
        return {
          success: false,
          error: "Amount must be a positive number",
        };
      }
      updatePaymentData.amount = updateData.amount;
    }

    if (updateData.status !== undefined) {
      const validStatuses = ["paid", "pending", "failed"] as const;
      if (!validStatuses.includes(updateData.status as any)) {
        return {
          success: false,
          error: "Status must be one of: paid, pending, failed",
        };
      }
      updatePaymentData.status = updateData.status as
        | "paid"
        | "pending"
        | "failed";
    }

    if (updateData.paymentDate !== undefined) {
      try {
        const paymentDate = new Date(updateData.paymentDate);
        if (isNaN(paymentDate.getTime())) {
          throw new Error("Invalid date");
        }
        updatePaymentData.paymentDate = paymentDate;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return {
          success: false,
          error: "Invalid payment date format",
        };
      }
    }

    if (updateData.validUntil !== undefined) {
      try {
        const validUntilDate = new Date(updateData.validUntil);
        if (isNaN(validUntilDate.getTime())) {
          throw new Error("Invalid date");
        }
        updatePaymentData.validUntil = validUntilDate;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return {
          success: false,
          error: "Invalid valid until date format",
        };
      }
    }

    if (updateData.notes !== undefined) {
      updatePaymentData.notes = updateData.notes?.trim() || null;
    }

    // Validate date logic if both dates are being updated
    const finalPaymentDate =
      updatePaymentData.paymentDate || existingPayment.paymentDate;
    const finalValidUntilDate =
      updatePaymentData.validUntil || existingPayment.validUntil;

    if (finalValidUntilDate <= finalPaymentDate) {
      return {
        success: false,
        error: "Valid until date must be after payment date",
      };
    }

    // Update the payment
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updatePaymentData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            isActive: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform the response
    const paymentResponse: PaymentResponse = {
      id: updatedPayment.id,
      amount: updatedPayment.amount,
      status: updatedPayment.status,
      paymentDate: updatedPayment.paymentDate.toISOString(),
      validUntil: updatedPayment.validUntil.toISOString(),
      client: {
        id: updatedPayment.client.id,
        name: updatedPayment.client.name,
        phone: updatedPayment.client.phone || undefined,
        isActive: updatedPayment.client.isActive,
      },
    };

    return {
      success: true,
      payment: paymentResponse,
      message: `Payment updated successfully`,
      updatedBy: authenticatedAdmin.name,
    };
  } catch (error) {
    console.error("Error updating payment:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to update payment due to an unexpected error",
    };
  }
}

// Function to mark a payment as paid
export async function markPaymentAsPaid(
  paymentId: string,
  clerkUserId: string
): Promise<CreatePaymentResponse> {
  try {
    return await updatePayment(paymentId, { status: "paid" }, clerkUserId);
  } catch (error) {
    console.error("Error marking payment as paid:", error);
    return {
      success: false,
      error: "Failed to mark payment as paid",
    };
  }
}

// Function to delete a payment
export async function deletePayment(
  paymentId: string,
  clerkUserId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Validate payment ID
    if (!paymentId || typeof paymentId !== "string") {
      return {
        success: false,
        error: "Payment ID is required and must be a string",
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

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingPayment) {
      return {
        success: false,
        error: "Payment not found",
      };
    }

    // Delete the payment
    await prisma.payment.delete({
      where: { id: paymentId },
    });

    return {
      success: true,
      message: `Payment for ${existingPayment.client.name} deleted successfully`,
    };
  } catch (error) {
    console.error("Error deleting payment:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to delete payment due to an unexpected error",
    };
  }
}

// Function to validate payment data
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function validatePaymentData(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!data.clientId || typeof data.clientId !== "string") {
    errors.push("Client ID is required and must be a string");
  }

  if (!data.amount || typeof data.amount !== "number" || data.amount <= 0) {
    errors.push("Amount is required and must be a positive number");
  }

  if (data.amount && data.amount > 999999.99) {
    errors.push("Amount cannot exceed $999,999.99");
  }

  if (!data.paymentDate || typeof data.paymentDate !== "string") {
    errors.push("Payment date is required");
  }

  if (!data.validUntil || typeof data.validUntil !== "string") {
    errors.push("Valid until date is required");
  }

  const validStatuses = ["paid", "pending", "failed"];
  if (!data.status || !validStatuses.includes(data.status)) {
    errors.push("Status must be one of: paid, pending, failed");
  }

  // Validate date formats
  if (data.paymentDate && data.validUntil) {
    try {
      const paymentDate = new Date(data.paymentDate);
      const validUntilDate = new Date(data.validUntil);

      if (isNaN(paymentDate.getTime())) {
        errors.push("Invalid payment date format");
      }

      if (isNaN(validUntilDate.getTime())) {
        errors.push("Invalid valid until date format");
      }

      if (!isNaN(paymentDate.getTime()) && !isNaN(validUntilDate.getTime())) {
        if (validUntilDate <= paymentDate) {
          errors.push("Valid until date must be after payment date");
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      errors.push("Invalid date format");
    }
  }

  if (data.notes && typeof data.notes !== "string") {
    errors.push("Notes must be a string");
  }

  if (data.notes && data.notes.length > 500) {
    errors.push("Notes cannot exceed 500 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
