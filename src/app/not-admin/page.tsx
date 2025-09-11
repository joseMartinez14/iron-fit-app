import Link from "next/link";

export const metadata = {
  title: "Acceso pendiente - Iron Fit",
};

export default function NotAdminPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold">Acceso pendiente</h1>
        <p className="mt-3 text-gray-700 dark:text-gray-300">
          Solicita a un administrador que te agregue a la lista de administradores.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-gray-300 dark:border-white/15 px-5 py-2 font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
          >
            Volver al inicio
          </Link>
      </div>
    </div>
    </main>
  );
}
