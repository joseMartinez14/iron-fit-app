import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export interface AdminAuthResult {
  success: boolean;
  admin?: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    superAdmin: boolean;
  };
  error?: NextResponse;
}

export async function checkAdminAuth(
  clerkUserId: string
): Promise<AdminAuthResult> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { clerkId: clerkUserId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        superAdmin: true,
      },
    });

    if (!admin) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: "Admin not found",
            message:
              "Your account is not registered as an admin. Please contact a super admin.",
          },
          { status: 403 }
        ),
      };
    }

    if (!admin.isActive) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: "Account deactivated",
            message:
              "Your admin account has been deactivated. Please contact a super admin to reactivate your account.",
          },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      admin,
    };
  } catch (error) {
    console.error("Error checking admin auth:", error);
    return {
      success: false,
      error: NextResponse.json(
        { error: "Database error", message: "Failed to verify admin status" },
        { status: 500 }
      ),
    };
  }
}

export async function checkSuperAdminAuth(
  clerkUserId: string
): Promise<AdminAuthResult> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { clerkId: clerkUserId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        superAdmin: true,
      },
    });

    if (!admin) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: "Admin not found",
            message:
              "Your account is not registered as an admin. Please contact a super admin.",
          },
          { status: 403 }
        ),
      };
    }

    if (!admin.isActive || !admin.superAdmin) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: "Account deactivated",
            message:
              "Your admin account has been deactivated. Please contact a super admin to reactivate your account.",
          },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      admin,
    };
  } catch (error) {
    console.error("Error checking admin auth:", error);
    return {
      success: false,
      error: NextResponse.json(
        { error: "Database error", message: "Failed to verify admin status" },
        { status: 500 }
      ),
    };
  }
}
