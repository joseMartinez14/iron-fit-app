import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { deleteAdminByClerkId, upsertAdminFromClerk } from "./service";
import { UserJSON } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const signingSecret =
      process.env.CLERK_WEBHOOK_SIGNING_SECRET ||
      process.env.CLERK_WEBHOOK_SECRET ||
      process.env.WEBHOOK_SECRET;

    if (!signingSecret) {
      console.error("Missing Clerk webhook signing secret env var");
      return new Response("Server misconfigured", { status: 500 });
    }

    const evt = await verifyWebhook(req, { signingSecret });

    // Do something with payload
    // For this guide, log payload to console
    const { id } = evt.data;
    const eventType = evt.type;
    const userData = evt.data as UserJSON;

    if (eventType === "user.deleted") {
      try {
        console.log(
          `User deleted with ID: ${id}, attempting to delete admin...`
        );

        await deleteAdminByClerkId(id || "");

        return new Response(
          "Webhook received, admin deletion or disactivation in progress",
          { status: 200 }
        );
      } catch (error) {
        console.error("Error deleting admin:", error);

        // Don't fail the webhook if admin deletion fails
        // This prevents Clerk from retrying if the user doesn't exist in our DB
        return new Response(
          JSON.stringify({
            message: "Webhook received but admin deletion failed",
            error: error instanceof Error ? error.message : "Unknown error",
          }),
          {
            status: 200, // Still return 200 to acknowledge webhook
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    if (eventType === "user.created" || eventType === "user.updated") {
      try {
        console.log(`User ${eventType} with ID: ${id}`);

        // Extract user data from Clerk webhook
        const clerkId = userData.id;
        const firstName = userData.first_name || "";
        const lastName = userData.last_name || "";
        const fullName = `${firstName} ${lastName}`.trim() || "Unknown User";

        // Get primary email address
        const primaryEmail = userData.email_addresses?.[0]?.email_address;
        if (!primaryEmail) {
          throw new Error("No email address found for user");
        }

        // Get primary phone number (optional)
        const primaryPhone = userData.phone_numbers?.[0]?.phone_number;

        // Call upsert function
        const admin = await upsertAdminFromClerk(
          clerkId || "",
          fullName,
          primaryEmail,
          primaryPhone
        );

        console.log(
          `Admin ${eventType === "user.created" ? "created" : "updated"}:`,
          {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            isActive: admin.isActive,
          }
        );

        return new Response(
          JSON.stringify({
            message: `User ${eventType} webhook processed successfully`,
            adminId: admin.id,
            adminName: admin.name,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error(`Error processing user ${eventType}:`, error);

        return new Response(
          JSON.stringify({
            message: `Webhook received but admin ${
              eventType === "user.created" ? "creation" : "update"
            } failed`,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
          {
            status: 200, // Still return 200 to acknowledge webhook
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}
