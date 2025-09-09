import Link from "next/link";

export const metadata = {
  title: "Access Pending - Iron Fit",
};

export default function NotAdminPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold">Access pending</h1>
        <p className="mt-3 text-gray-700 dark:text-gray-300">
          Please request an admin to add you to the admin list.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-gray-300 dark:border-white/15 px-5 py-2 font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
          >
            Back to Home
          </Link>
      </div>
    </div>
    </main>
  );
}

