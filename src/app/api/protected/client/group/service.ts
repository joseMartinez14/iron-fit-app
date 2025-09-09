import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export interface CreateClientGroupData {
  name: string;
  description?: string;
  clientIds: string[];
}

export async function createClientGroup(data: CreateClientGroupData) {
  try {
    // Validate input data
    if (!data.name || typeof data.name !== "string") {
      throw new Error("Group name is required and must be a string");
    }

    if (!data.clientIds || !Array.isArray(data.clientIds)) {
      throw new Error("Client IDs must be provided as an array");
    }

    if (data.clientIds.length === 0) {
      throw new Error("At least one client must be selected for the group");
    }

    // Check if group name already exists
    const existingGroup = await prisma.clientGroup.findUnique({
      where: { name: data.name.trim() },
    });

    if (existingGroup) {
      throw new Error(`Group name "${data.name}" already exists`);
    }

    // Validate that all client IDs exist (allow both active and inactive clients)
    const existingClients = await prisma.client.findMany({
      where: {
        id: { in: data.clientIds },
        // Removed isActive: true - now allows both active and inactive clients
      },
      select: {
        id: true,
        name: true,
        isActive: true, // Keep this to track status in response
      },
    });

    if (existingClients.length !== data.clientIds.length) {
      const foundIds = existingClients.map((client) => client.id);
      const missingIds = data.clientIds.filter((id) => !foundIds.includes(id));
      throw new Error(
        `The following client IDs are invalid: ${missingIds.join(", ")}`
      );
    }

    // Create the group and memberships in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the client group
      const clientGroup = await tx.clientGroup.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
        },
      });

      // Create group memberships for all selected clients
      const memberships = await tx.clientGroupMembership.createMany({
        data: data.clientIds.map((clientId) => ({
          clientGroupId: clientGroup.id,
          clientId: clientId,
        })),
      });

      return { clientGroup, memberships };
    });

    // Fetch the complete group with members for the response
    const completeGroup = await prisma.clientGroup.findUnique({
      where: { id: result.clientGroup.id },
      include: {
        members: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      message: "Client group created successfully",
      group: {
        id: completeGroup!.id,
        name: completeGroup!.name,
        description: completeGroup!.description,
        memberCount: completeGroup!.members.length,
        members: completeGroup!.members.map((membership) => membership.client),
        // Add summary of active/inactive members
        activeMemberCount: completeGroup!.members.filter(
          (m) => m.client.isActive
        ).length,
        inactiveMemberCount: completeGroup!.members.filter(
          (m) => !m.client.isActive
        ).length,
      },
    };
  } catch (error) {
    console.error("Error creating client group:", error);

    if (error instanceof Error) {
      // Handle Prisma unique constraint violations
      if (error.message.includes("Unique constraint")) {
        throw new Error("Group name already exists");
      }
      throw error;
    }

    throw new Error("Failed to create client group: Unknown error");
  }
}

// Alternative function with batch validation
export async function createClientGroupWithValidation(
  data: CreateClientGroupData
) {
  try {
    // Extended validation
    if (!data.name?.trim()) {
      throw new Error("Group name is required");
    }

    if (data.name.trim().length < 3) {
      throw new Error("Group name must be at least 3 characters long");
    }

    if (data.name.trim().length > 50) {
      throw new Error("Group name must not exceed 50 characters");
    }

    if (data.description && data.description.length > 500) {
      throw new Error("Description must not exceed 500 characters");
    }

    if (!Array.isArray(data.clientIds) || data.clientIds.length === 0) {
      throw new Error("At least one client must be selected");
    }

    if (data.clientIds.length > 100) {
      throw new Error("Group cannot have more than 100 members");
    }

    // Validate client IDs format
    const invalidIds = data.clientIds.filter(
      (id) => !id || typeof id !== "string"
    );
    if (invalidIds.length > 0) {
      throw new Error("All client IDs must be valid strings");
    }

    // Check for duplicate client IDs
    const uniqueClientIds = [...new Set(data.clientIds)];
    if (uniqueClientIds.length !== data.clientIds.length) {
      throw new Error("Duplicate client IDs found in the selection");
    }

    // Use the main creation function
    return await createClientGroup({
      name: data.name,
      description: data.description,
      clientIds: uniqueClientIds,
    });
  } catch (error) {
    console.error("Error in client group validation:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to validate and create client group");
  }
}

// Optional: Function to get group statistics including inactive members
export async function getGroupWithStats(groupId: string) {
  try {
    const group = await prisma.clientGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
                isActive: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    const members = group.members.map((m) => m.client);
    const activeMembers = members.filter((m) => m.isActive);
    const inactiveMembers = members.filter((m) => !m.isActive);

    return {
      success: true,
      group: {
        ...group,
        memberCount: members.length,
        activeMemberCount: activeMembers.length,
        inactiveMemberCount: inactiveMembers.length,
        members,
        activeMembers,
        inactiveMembers,
      },
    };
  } catch (error) {
    console.error("Error getting group with stats:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to retrieve group statistics");
  }
}

// Utility function to check if group name is available
export async function checkGroupNameAvailability(name: string) {
  try {
    if (!name || typeof name !== "string") {
      return {
        available: false,
        message: "Group name is required",
      };
    }

    const existingGroup = await prisma.clientGroup.findUnique({
      where: { name: name.trim() },
    });

    return {
      available: !existingGroup,
      message: existingGroup
        ? "Group name is already taken"
        : "Group name is available",
    };
  } catch (error) {
    console.error("Error checking group name availability:", error);
    return {
      available: false,
      message: "Error checking group name availability",
    };
  }
}

// Cleanup function to close Prisma connection
export async function closePrismaConnection() {
  await prisma.$disconnect();
}

export interface UpdateClientGroupData {
  name: string;
  description?: string;
  clientIds: string[];
}

export async function updateClientGroup(
  groupId: string,
  data: UpdateClientGroupData
) {
  try {
    // Validate input data
    if (!groupId || typeof groupId !== "string") {
      throw new Error("Group ID is required and must be a string");
    }

    if (!data.name || typeof data.name !== "string") {
      throw new Error("Group name is required and must be a string");
    }

    if (!data.clientIds || !Array.isArray(data.clientIds)) {
      throw new Error("Client IDs must be provided as an array");
    }

    if (data.clientIds.length === 0) {
      throw new Error("At least one client must be selected for the group");
    }

    // Check if the group exists
    const existingGroup = await prisma.clientGroup.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      throw new Error("Group not found");
    }

    // Check if group name already exists (excluding current group)
    const groupWithSameName = await prisma.clientGroup.findUnique({
      where: { name: data.name.trim() },
    });

    if (groupWithSameName && groupWithSameName.id !== groupId) {
      throw new Error(`Group name "${data.name}" already exists`);
    }

    // Validate that all client IDs exist (allow both active and inactive clients)
    const existingClients = await prisma.client.findMany({
      where: {
        id: { in: data.clientIds },
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (existingClients.length !== data.clientIds.length) {
      const foundIds = existingClients.map((client) => client.id);
      const missingIds = data.clientIds.filter((id) => !foundIds.includes(id));
      throw new Error(
        `The following client IDs are invalid: ${missingIds.join(", ")}`
      );
    }

    // Update the group and memberships in a transaction
    await prisma.$transaction(async (tx) => {
      // Update the client group
      const updatedGroup = await tx.clientGroup.update({
        where: { id: groupId },
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
        },
      });

      // Delete existing memberships
      await tx.clientGroupMembership.deleteMany({
        where: { clientGroupId: groupId },
      });

      // Create new memberships for all selected clients
      const memberships = await tx.clientGroupMembership.createMany({
        data: data.clientIds.map((clientId) => ({
          clientGroupId: groupId,
          clientId: clientId,
        })),
      });

      return { updatedGroup, memberships };
    });

    // Fetch the complete updated group with members for the response
    const completeGroup = await prisma.clientGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      message: "Client group updated successfully",
      group: {
        id: completeGroup!.id,
        name: completeGroup!.name,
        description: completeGroup!.description,
        memberCount: completeGroup!.members.length,
        members: completeGroup!.members.map((membership) => membership.client),
        // Add summary of active/inactive members
        activeMemberCount: completeGroup!.members.filter(
          (m) => m.client.isActive
        ).length,
        inactiveMemberCount: completeGroup!.members.filter(
          (m) => !m.client.isActive
        ).length,
      },
    };
  } catch (error) {
    console.error("Error updating client group:", error);

    if (error instanceof Error) {
      // Handle Prisma unique constraint violations
      if (error.message.includes("Unique constraint")) {
        throw new Error("Group name already exists");
      }
      throw error;
    }

    throw new Error("Failed to update client group: Unknown error");
  }
}

// Function to get a single group by ID with full details
export async function getClientGroupById(groupId: string) {
  try {
    if (!groupId || typeof groupId !== "string") {
      throw new Error("Group ID is required and must be a string");
    }

    const group = await prisma.clientGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
                isActive: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    const members = group.members.map((m) => m.client);
    const activeMembers = members.filter((m) => m.isActive);
    const inactiveMembers = members.filter((m) => !m.isActive);

    return {
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        memberCount: members.length,
        activeMemberCount: activeMembers.length,
        inactiveMemberCount: inactiveMembers.length,
        members,
        memberIds: members.map((m) => m.id), // Include member IDs for easier form initialization
      },
    };
  } catch (error) {
    console.error("Error getting client group by ID:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to retrieve client group");
  }
}

// Function to delete a client group
export async function deleteClientGroup(groupId: string) {
  try {
    if (!groupId || typeof groupId !== "string") {
      throw new Error("Group ID is required and must be a string");
    }

    // Check if the group exists
    const existingGroup = await prisma.clientGroup.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      throw new Error("Group not found");
    }

    // Delete the group and its memberships in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all memberships first
      await tx.clientGroupMembership.deleteMany({
        where: { clientGroupId: groupId },
      });

      // Delete the group
      await tx.clientGroup.delete({
        where: { id: groupId },
      });
    });

    return {
      success: true,
      message: "Client group deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting client group:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to delete client group");
  }
}

// Function to get all client groups with their statistics
export async function getAllClientGroups() {
  try {
    const groups = await prisma.clientGroup.findMany({
      include: {
        members: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
                isActive: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc", // Order by name since no createdAt field
      },
    });

    const groupsWithStats = groups.map((group) => {
      const members = group.members.map((m) => m.client);
      const activeMembers = members.filter((m) => m.isActive);
      const inactiveMembers = members.filter((m) => !m.isActive);

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        memberCount: members.length,
        activeMemberCount: activeMembers.length,
        inactiveMemberCount: inactiveMembers.length,
        members,
      };
    });

    return {
      success: true,
      message: "Client groups retrieved successfully",
      groups: groupsWithStats,
    };
  } catch (error) {
    console.error("Error getting all client groups:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to retrieve client groups");
  }
}

// Alternative function with filtering options
export async function getAllClientGroupsFiltered(
  options: {
    includeEmpty?: boolean;
    includeInactive?: boolean;
    searchTerm?: string;
  } = {}
) {
  try {
    const {
      includeEmpty = true,
      includeInactive = true,
      searchTerm = "",
    } = options;

    // Build the where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    // Add search filter if provided
    if (searchTerm) {
      whereClause.OR = [
        {
          name: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ];
    }

    const groups = await prisma.clientGroup.findMany({
      where: whereClause,
      include: {
        members: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
                isActive: true,
                createdAt: true,
              },
            },
          },
          where: includeInactive
            ? undefined
            : {
                client: {
                  isActive: true,
                },
              },
        },
      },
      orderBy: {
        name: "asc", // Order by name since no createdAt field
      },
    });

    let filteredGroups = groups.map((group) => {
      const members = group.members.map((m) => m.client);
      const activeMembers = members.filter((m) => m.isActive);
      const inactiveMembers = members.filter((m) => !m.isActive);

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        memberCount: members.length,
        activeMemberCount: activeMembers.length,
        inactiveMemberCount: inactiveMembers.length,
        members,
      };
    });

    // Filter out empty groups if requested
    if (!includeEmpty) {
      filteredGroups = filteredGroups.filter((group) => group.memberCount > 0);
    }

    return {
      success: true,
      message: "Client groups retrieved successfully",
      groups: filteredGroups,
    };
  } catch (error) {
    console.error("Error getting filtered client groups:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to retrieve client groups");
  }
}

// Function to get groups summary (for dashboard stats)
export async function getClientGroupsSummary() {
  try {
    const totalGroups = await prisma.clientGroup.count();

    const groupsWithMembers = await prisma.clientGroup.findMany({
      include: {
        _count: {
          select: {
            members: true,
          },
        },
        members: {
          include: {
            client: {
              select: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    const emptyGroups = groupsWithMembers.filter(
      (group) => group._count.members === 0
    ).length;
    const activeGroups = groupsWithMembers.filter((group) =>
      group.members.some((member) => member.client.isActive)
    ).length;

    const totalMembers = groupsWithMembers.reduce(
      (sum, group) => sum + group._count.members,
      0
    );
    const activeMembers = groupsWithMembers.reduce((sum, group) => {
      const activeMembersInGroup = group.members.filter(
        (member) => member.client.isActive
      ).length;
      return sum + activeMembersInGroup;
    }, 0);

    const averageMembersPerGroup =
      totalGroups > 0
        ? Math.round((totalMembers / totalGroups) * 100) / 100
        : 0;

    return {
      success: true,
      summary: {
        totalGroups,
        activeGroups,
        emptyGroups,
        totalMembers,
        activeMembers,
        inactiveMembers: totalMembers - activeMembers,
        averageMembersPerGroup,
      },
    };
  } catch (error) {
    console.error("Error getting client groups summary:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to retrieve client groups summary");
  }
}

// Interface for editing group data
export interface EditClientGroupData {
  name: string;
  description?: string;
  clientIds: string[];
}

// Main function to edit an existing client group
export async function editClientGroup(
  groupId: string,
  data: EditClientGroupData
) {
  try {
    // Input validation
    if (!groupId || typeof groupId !== "string") {
      throw new Error("Group ID is required and must be a string");
    }

    if (!data.name || typeof data.name !== "string") {
      throw new Error("Group name is required and must be a string");
    }

    if (!data.clientIds || !Array.isArray(data.clientIds)) {
      throw new Error("Client IDs must be provided as an array");
    }

    if (data.clientIds.length === 0) {
      throw new Error("At least one client must be selected for the group");
    }

    // Check if the group exists
    const existingGroup = await prisma.clientGroup.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      throw new Error("Group not found");
    }

    // Check if new group name conflicts with existing groups (excluding current group)
    const groupWithSameName = await prisma.clientGroup.findFirst({
      where: {
        name: data.name.trim(),
        id: { not: groupId }, // Exclude current group from check
      },
    });

    if (groupWithSameName) {
      throw new Error(
        `Group name "${data.name}" is already taken by another group`
      );
    }

    // Validate that all client IDs exist and are valid
    const existingClients = await prisma.client.findMany({
      where: {
        id: { in: data.clientIds },
      },
      select: {
        id: true,
        name: true,
        //isActive: true, NOTE: We allow both active and inactive clients For now
      },
    });

    if (existingClients.length !== data.clientIds.length) {
      const foundIds = existingClients.map((client) => client.id);
      const missingIds = data.clientIds.filter((id) => !foundIds.includes(id));
      throw new Error(
        `The following client IDs are invalid or do not exist: ${missingIds.join(
          ", "
        )}`
      );
    }

    // Remove duplicate client IDs if any
    const uniqueClientIds = [...new Set(data.clientIds)];

    // Perform the update in a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // 1. Update the group basic information
      const updatedGroup = await tx.clientGroup.update({
        where: { id: groupId },
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
        },
      });

      // 2. Remove all existing memberships for this group
      await tx.clientGroupMembership.deleteMany({
        where: { clientGroupId: groupId },
      });

      // 3. Create new memberships with the updated client list
      if (uniqueClientIds.length > 0) {
        await tx.clientGroupMembership.createMany({
          data: uniqueClientIds.map((clientId) => ({
            clientGroupId: groupId,
            clientId: clientId,
          })),
        });
      }

      return updatedGroup;
    });

    // Fetch the complete updated group with all member details
    const completeGroup = await prisma.clientGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
                isActive: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!completeGroup) {
      throw new Error("Failed to retrieve updated group information");
    }

    // Calculate statistics

    return {
      success: true,
      message: `Group "${completeGroup.name}" has been successfully updated`,
    };
  } catch (error) {
    console.error("Error editing client group:", error);

    if (error instanceof Error) {
      // Handle specific Prisma errors
      if (error.message.includes("Unique constraint")) {
        throw new Error("Group name already exists");
      }

      // Re-throw validation errors
      if (
        error.message.includes("required") ||
        error.message.includes("invalid") ||
        error.message.includes("not found") ||
        error.message.includes("already taken")
      ) {
        throw error;
      }
    }

    throw new Error("Failed to update client group due to an unexpected error");
  }
}

// Enhanced version with additional validation and rollback support
export async function editClientGroupWithValidation(
  groupId: string,
  data: EditClientGroupData
) {
  try {
    // Extended validation
    if (!groupId?.trim()) {
      throw new Error("Group ID is required");
    }

    if (!data.name?.trim()) {
      throw new Error("Group name is required");
    }

    if (data.name.trim().length < 2) {
      throw new Error("Group name must be at least 2 characters long");
    }

    if (data.name.trim().length > 50) {
      throw new Error("Group name must not exceed 50 characters");
    }

    if (data.description && data.description.length > 500) {
      throw new Error("Description must not exceed 500 characters");
    }

    if (!Array.isArray(data.clientIds)) {
      throw new Error("Client IDs must be provided as an array");
    }

    if (data.clientIds.length === 0) {
      throw new Error("At least one client must be selected for the group");
    }

    if (data.clientIds.length > 100) {
      throw new Error("Group cannot have more than 100 members");
    }

    // Validate client ID format
    const invalidIds = data.clientIds.filter(
      (id) => !id || typeof id !== "string" || id.trim().length === 0
    );

    if (invalidIds.length > 0) {
      throw new Error("All client IDs must be valid non-empty strings");
    }

    // Remove duplicates and empty strings
    const cleanedClientIds = [
      ...new Set(data.clientIds.filter((id) => id.trim())),
    ];

    // Use the main edit function
    return await editClientGroup(groupId, {
      name: data.name.trim(),
      description: data.description?.trim(),
      clientIds: cleanedClientIds,
    });
  } catch (error) {
    console.error("Error in client group edit validation:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to validate and update client group");
  }
}

// Utility function to preview changes before applying them
export async function previewGroupChanges(
  groupId: string,
  data: EditClientGroupData
) {
  try {
    // Get current group state
    const currentGroup = await getClientGroupById(groupId);
    if (!currentGroup.success) {
      throw new Error("Group not found");
    }

    // Get client information for new member list
    const newClients = await prisma.client.findMany({
      where: { id: { in: data.clientIds } },
      select: { id: true, name: true, isActive: true },
    });

    const current = currentGroup.group;
    const currentMemberIds = current.memberIds;
    const newMemberIds = [...new Set(data.clientIds)];

    // Calculate changes
    const addedMemberIds = newMemberIds.filter(
      (id) => !currentMemberIds.includes(id)
    );
    const removedMemberIds = currentMemberIds.filter(
      (id) => !newMemberIds.includes(id)
    );
    const keptMemberIds = currentMemberIds.filter((id) =>
      newMemberIds.includes(id)
    );

    const addedMembers = newClients.filter((c) =>
      addedMemberIds.includes(c.id)
    );
    const removedMembers = current.members.filter((c) =>
      removedMemberIds.includes(c.id)
    );

    return {
      success: true,
      preview: {
        changes: {
          nameWillChange: current.name !== data.name.trim(),
          descriptionWillChange:
            (current.description || "") !== (data.description?.trim() || ""),
          membersWillChange:
            addedMemberIds.length > 0 || removedMemberIds.length > 0,
        },
        memberChanges: {
          current: currentMemberIds.length,
          new: newMemberIds.length,
          added: addedMembers,
          removed: removedMembers,
          kept: keptMemberIds.length,
        },
        newValues: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          memberCount: newMemberIds.length,
        },
      },
    };
  } catch (error) {
    console.error("Error previewing group changes:", error);
    throw new Error("Failed to preview group changes");
  }
}
