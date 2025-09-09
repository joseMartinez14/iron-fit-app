import { checkAdminAuth } from "@/app/api/service";
import { auth } from "@clerk/nextjs/server";

type AuthResult = {
  message: string;
  userID: string | null;
  status: boolean;
};

export default async function isAuthenticated(): Promise<AuthResult> {
  // This function checks if the user is authenticated
  // and returns a boolean value.
  // You can implement your authentication logic here.

  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return {
        message: `Authentication failed, no user ID found`,
        userID: null,
        status: false,
      };
    }

    // Check if admin exists and is active
    const adminAuthResult = await checkAdminAuth(userId);

    if (!adminAuthResult.success) {
      return {
        message: `Authentication failed, no user ID found`,
        userID: userId,
        status: false,
      };
    }

    return {
      message: `Authentication successful`,
      userID: userId,
      status: true,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      message: `Authentication failed ${error}`,
      userID: null,
      status: false,
    };
  }
}
