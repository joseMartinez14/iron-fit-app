import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export interface CreateClientData {
  name: string;
  userName: string;
  password: string;
  phone?: string;
  isActive: boolean;
}

export async function createClient(data: CreateClientData) {
  try {
    // Hash the password before storing
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Check if username already exists
    const existingClient = await prisma.client.findUnique({
      where: { userName: data.userName },
    });

    if (existingClient) {
      throw new Error(`Username "${data.userName}" is already taken`);
    }

    // Create the client
    const client = await prisma.client.create({
      data: {
        name: data.name.trim(),
        userName: data.userName.toLowerCase().trim(),
        password: hashedPassword,
        phone: data.phone?.trim() || null,
        isActive: data.isActive,
      },
      select: {
        id: true,
        name: true,
        userName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        // Don't return password for security
      },
    });

    return {
      success: true,
      message: "Client created successfully",
      client,
    };
  } catch (error) {
    console.error("Error creating client:", error);

    // Handle Prisma unique constraint violations
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        throw new Error("Username is already taken");
      }
      throw error;
    }

    throw new Error("Failed to create client: Unknown error");
  }
}

export async function verifyClientLogin(userName: string, password: string) {
  try {
    // Find the client by username
    const client = await prisma.client.findUnique({
      where: { userName: userName.toLowerCase().trim() },
      select: {
        id: true,
        name: true,
        userName: true,
        password: true, // We need the hashed password for comparison
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!client) {
      throw new Error("Invalid username or password");
    }

    // Check if client account is active
    if (!client.isActive) {
      throw new Error("Account is deactivated. Please contact support.");
    }

    // Verify the password using bcrypt.compare
    const isPasswordValid = await bcrypt.compare(password, client.password);

    if (!isPasswordValid) {
      throw new Error("Invalid username or password");
    }

    // Return client data without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...clientWithoutPassword } = client;

    return {
      success: true,
      message: "Login successful",
      client: clientWithoutPassword,
    };
  } catch (error) {
    console.error("Error verifying client login:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Login failed: Unknown error");
  }
}

// Alternative with more detailed response
export async function authenticateClient(userName: string, password: string) {
  try {
    // Find client
    const client = await prisma.client.findUnique({
      where: { userName: userName.toLowerCase().trim() },
    });

    // Always check password even if user doesn't exist (prevents timing attacks)
    const hashedPassword =
      client?.password || "$2a$12$dummy.hash.to.prevent.timing.attacks";
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (!client || !isPasswordValid) {
      // Same error message for both cases (security best practice)
      throw new Error("Invalid username or password");
    }

    if (!client.isActive) {
      throw new Error("Account is deactivated. Please contact support.");
    }

    // Return client without sensitive data
    return {
      success: true,
      message: "Authentication successful",
      client: {
        id: client.id,
        name: client.name,
        userName: client.userName,
        phone: client.phone,
        isActive: client.isActive,
        createdAt: client.createdAt,
      },
    };
  } catch (error) {
    console.error("Authentication error:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Authentication failed");
  }
}

export async function getClientById(clientId: string) {
  try {
    // Validate client ID
    if (!clientId || typeof clientId !== "string") {
      throw new Error("Client ID is required and must be a string");
    }

    // Find the client by ID
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        userName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        // Don't return password for security
      },
    });

    if (!client) {
      throw new Error("Client not found");
    }

    return {
      success: true,
      message: "Client retrieved successfully",
      client,
    };
  } catch (error) {
    console.error("Error getting client by ID:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to retrieve client: Unknown error");
  }
}

// Alternative function with more detailed information (includes relationships)
export async function getClientByIdDetailed(clientId: string) {
  try {
    if (!clientId || typeof clientId !== "string") {
      throw new Error("Client ID is required and must be a string");
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        userName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        // Include related data based on your actual schema
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentDate: true,
            validUntil: true,
          },
          orderBy: {
            paymentDate: "desc",
          },
          take: 10, // Last 10 payments
        },
        attendanceLogs: {
          select: {
            id: true,
            checkInTime: true,
            session: {
              select: {
                id: true,
                title: true,
                date: true,
                startTime: true,
                endTime: true,
                location: true,
                instructor: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            checkedInBy: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            checkInTime: "desc",
          },
          take: 10, // Last 10 attendance records
        },
        clientGroups: {
          select: {
            clientGroup: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      throw new Error("Client not found");
    }

    return {
      success: true,
      message: "Client retrieved successfully",
      client,
    };
  } catch (error) {
    console.error("Error getting detailed client by ID:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to retrieve client details: Unknown error");
  }
}

// Function to check if client exists (lightweight check)
export async function clientExists(clientId: string) {
  try {
    if (!clientId || typeof clientId !== "string") {
      return { exists: false, message: "Invalid client ID" };
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true }, // Only select ID for minimal data transfer
    });

    return {
      exists: !!client,
      message: client ? "Client exists" : "Client not found",
    };
  } catch (error) {
    console.error("Error checking client existence:", error);
    return {
      exists: false,
      message: "Error checking client existence",
    };
  }
}

// Add this interface for update data
export interface UpdateClientData {
  name?: string;
  userName?: string;
  password?: string;
  phone?: string;
  isActive?: boolean;
}

// Add this function to your existing service.ts file
export async function updateClient(clientId: string, data: UpdateClientData) {
  try {
    // Validate client ID
    if (!clientId || typeof clientId !== "string") {
      throw new Error("Client ID is required and must be a string");
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      throw new Error("Client not found");
    }

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }

    if (data.userName !== undefined) {
      const trimmedUserName = data.userName.toLowerCase().trim();

      // Check if new username is already taken (by another client)
      if (trimmedUserName !== existingClient.userName) {
        const userNameExists = await prisma.client.findUnique({
          where: { userName: trimmedUserName },
        });

        if (userNameExists) {
          throw new Error(`Username "${data.userName}" is already taken`);
        }
      }

      updateData.userName = trimmedUserName;
    }

    if (data.password !== undefined && data.password.trim() !== "") {
      // Hash the new password
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(data.password, saltRounds);
    }

    if (data.phone !== undefined) {
      updateData.phone =
        data.phone && data.phone.trim() ? data.phone.trim() : null;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    // Update the client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
      select: {
        id: true,
        name: true,
        userName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        // Don't return password for security
      },
    });

    return {
      success: true,
      message: "Client updated successfully",
      client: updatedClient,
    };
  } catch (error) {
    console.error("Error updating client:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        throw new Error("Username is already taken");
      }
      throw error;
    }

    throw new Error("Failed to update client: Unknown error");
  }
}

// Add this function to your existing service.ts file
export async function getAllClients() {
  try {
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        userName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        // Don't return password for security
      },
      orderBy: [
        { isActive: "desc" }, // Active clients first
        { name: "asc" }, // Then alphabetically
      ],
    });

    return {
      success: true,
      message: "Clients retrieved successfully",
      clients,
    };
  } catch (error) {
    console.error("Error getting all clients:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to retrieve clients: Unknown error");
  }
}

// Alternative: Get clients with additional filters
export async function getAllClientsFiltered(options?: {
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    const { includeInactive = true, limit, offset } = options || {};

    const clients = await prisma.client.findMany({
      where: includeInactive ? undefined : { isActive: true },
      select: {
        id: true,
        name: true,
        userName: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.client.count({
      where: includeInactive ? undefined : { isActive: true },
    });

    return {
      success: true,
      message: "Clients retrieved successfully",
      clients,
      totalCount,
      hasMore: limit ? (offset || 0) + clients.length < totalCount : false,
    };
  } catch (error) {
    console.error("Error getting filtered clients:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to retrieve clients: Unknown error");
  }
}
