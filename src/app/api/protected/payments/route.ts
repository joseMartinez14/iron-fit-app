import { NextRequest, NextResponse } from "next/server";
import { auth, getAuth } from "@clerk/nextjs/server";
import { createPayment, getLastPaymentPerClient } from "./service";
import { checkAdminAuth } from "../../service";
import { CreatePaymentData } from "@/types/payment";

export async function GET(req: NextRequest) {
  try {
    // Get authentication
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized access",
        },
        { status: 401 }
      );
    }

    // Extract query parameters for filters
    const { searchParams } = new URL(req.url);
    const includeInactiveClients =
      searchParams.get("includeInactiveClients") === "true";
    const statusFilter = searchParams.get("statusFilter") as
      | "paid"
      | "pending"
      | "failed"
      | null;
    const validUntilAfter = searchParams.get("validUntilAfter");
    const validUntilBefore = searchParams.get("validUntilBefore");

    // Build filters object
    const filters = {
      includeInactiveClients,
      ...(statusFilter && { statusFilter }),
      ...(validUntilAfter && { validUntilAfter }),
      ...(validUntilBefore && { validUntilBefore }),
    };

    console.log(`Getting payments for user ${userId} with filters:`, filters);

    // Get payments from service
    const result = await getLastPaymentPerClient(filters);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to fetch payments",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payments: result.payments || [],
      stats: result.stats,
      message: result.message,
    });
  } catch (error) {
    console.error("Error in GET /api/payments:", error);

    if (error instanceof Error) {
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
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();

    console.log("Authenticated userId: ***", userId);

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

    // Add the authenticated user's ID and admin info to the form data
    const data: CreatePaymentData = {
      clientId: body.clientID,
      amount: body.amount,
      status: body.status,
      paymentDate: body.paymentDate,
      validUntil: body.validUntil,
    };

    const result = await createPayment(data, userId);
    console.log("Create payment result:", result);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to create payment" },
        { status: 500 }
      );
    }
    return NextResponse.json(result, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment", details: error.message },
      { status: 500 }
    );
  }
}
