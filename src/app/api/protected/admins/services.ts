import { PrismaClient } from "@/generated/prisma";
import type { Admin } from "@/types/admins";

const prisma = new PrismaClient();

// Map Prisma Admin model to UI Admin type
function mapAdmin(a: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  superAdmin: boolean;
  createdAt: Date;
  clerkId: string | null;
}): Admin {
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    isActive: a.isActive,
    superAdmin: a.superAdmin,
    phone: a.phone,
    createdAt: a.createdAt.toISOString(),
    clerkId: a.clerkId,
  };
}

export async function getAllAdmins(): Promise<Admin[]> {
  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      superAdmin: true,
      createdAt: true,
      clerkId: true,
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return admins.map(mapAdmin);
}

export async function getAdminById(id: string): Promise<Admin | null> {
  if (!id) return null;
  const a = await prisma.admin.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      superAdmin: true,
      createdAt: true,
      clerkId: true,
    },
  });
  return a ? mapAdmin(a) : null;
}

export interface UpdateAdminFlagsInput {
  isActive?: boolean;
  superAdmin?: boolean;
}

export async function updateAdminFlags(
  id: string,
  data: UpdateAdminFlagsInput
): Promise<Admin> {
  if (!id) throw new Error("Admin id is required");
  if (data.isActive === undefined && data.superAdmin === undefined) {
    throw new Error("Provide at least one field to update");
  }

  const updated = await prisma.admin.update({
    where: { id },
    data: {
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.superAdmin !== undefined ? { superAdmin: data.superAdmin } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      superAdmin: true,
      createdAt: true,
      clerkId: true,
    },
  });

  return mapAdmin(updated);
}
