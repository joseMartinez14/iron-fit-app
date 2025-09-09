import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function upsertAdminFromClerk(
  clerkID: string,
  name: string,
  email: string,
  phone_number?: string
) {
  try {
    const admin = await prisma.admin.upsert({
      where: { clerkId: clerkID },
      update: {
        name: name,
        email: email,
        phone: phone_number,
        isActive: false,
        superAdmin: false, // Default to false, can be updated later
      },
      create: {
        clerkId: clerkID,
        name: name,
        email: email,
        phone: phone_number,
        superAdmin: false, // Default to false, can be updated later
        isActive: false,
      },
    });

    return admin;
  } catch (error) {
    console.error("Error upserting admin:", error);

    if (error instanceof Error) {
      throw new Error(`Failed to upsert admin: ${error.message}`);
    }

    throw new Error("Failed to upsert admin: Unknown error");
  }
}

export async function deleteAdminByClerkId(clerkId: string) {
  try {
    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { clerkId },
      include: {
        _count: {
          select: {
            checkedInLogs: true,
            ClassSession: true,
          },
        },
      },
    });

    if (!existingAdmin) {
      throw new Error(`Admin with clerkId ${clerkId} not found`);
    }

    // Check for related data that might prevent deletion
    const hasRelatedData =
      existingAdmin._count.checkedInLogs > 0 ||
      existingAdmin._count.ClassSession > 0;

    if (hasRelatedData) {
      // Option 1: Soft delete by setting isActive to false
      const updatedAdmin = await prisma.admin.update({
        where: { clerkId },
        data: { isActive: false },
      });

      return {
        success: true,
        message:
          "Admin deactivated due to existing related data (classes or attendance logs)",
        admin: updatedAdmin,
        action: "deactivated",
      };
    } else {
      // Option 2: Hard delete if no related data
      const deletedAdmin = await prisma.admin.delete({
        where: { clerkId },
      });

      return {
        success: true,
        message: "Admin successfully deleted",
        admin: deletedAdmin,
        action: "deleted",
      };
    }
  } catch (error) {
    console.error("Error deleting admin:", error);

    if (error instanceof Error) {
      throw new Error(`Failed to delete admin: ${error.message}`);
    }

    throw new Error("Failed to delete admin: Unknown error");
  }
}
