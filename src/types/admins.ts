export interface Admin {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  superAdmin: boolean;
  // Optional fields if needed elsewhere
  phone?: string | null;
  createdAt?: string; // ISO
  clerkId?: string | null;
}

export interface UpdateAdminRequest {
  id: string;
  isActive?: boolean;
  superAdmin?: boolean;
}

export interface UpdateAdminResponse {
  success: boolean;
  message?: string;
  error?: string;
  admin?: Admin;
}
