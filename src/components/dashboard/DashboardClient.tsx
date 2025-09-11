"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type DashboardStats = {
  totalClients: number;
  activeClients: number;
  classesToday: number;
  reservedSpots: number;
};

export type DashboardClass = {
  id: string;
  startTime: string; // ISO
  title: string;
  instructorName: string | null;
  capacity: number;
  reserved: number;
};

export default function DashboardClient({
  stats,
  classes,
}: {
  stats: DashboardStats;
  classes: DashboardClass[];
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 bg-app-bg p-6 overflow-y-auto w-full">
        <h1 className="text-2xl font-semibold mb-4">Panel</h1>
        <p className="text-gray-600 mb-6">{`¡Bienvenido de nuevo! Esto es lo que sucede hoy.`}</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Clientes totales" value={String(stats.totalClients)} sub="" />
          <StatCard title="Clientes activos" value={String(stats.activeClients)} sub="" />
          <StatCard title="Clases de hoy" value={String(stats.classesToday)} sub="" />
          <StatCard title="Cupos reservados" value={String(stats.reservedSpots)} sub="" />
        </div>

        {/* Today's Classes */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">{`Clases de hoy`}</h2>
            <Button variant="link">Ver todo</Button>
          </div>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Hora</Th>
                  <Th>Nombre de la clase</Th>
                  <Th>Instructor</Th>
                  <Th>Capacidad</Th>
                  <Th>Reservados</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id} className="border-t">
                    <Td>{formatTime(c.startTime)}</Td>
                    <Td>{c.title}</Td>
                    <Td>{c.instructorName ?? "—"}</Td>
                    <Td>{c.capacity}</Td>
                    <Td>{c.reserved}</Td>
                    <Td>
                      <Button size="icon" variant="ghost" aria-label="Ver clase">
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    </Td>
                  </tr>
                ))}
                {classes.length === 0 && (
                  <tr>
                    <Td colSpan={6}>
                      <span className="text-gray-500">No hay clases programadas para hoy.</span>
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-gray-500 mb-1">{title}</div>
        <div className="text-xl font-bold mb-1">{value}</div>
        {sub ? <div className="text-xs text-gray-400">{sub}</div> : null}
      </CardContent>
    </Card>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{children}</th>;
}

function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return (
    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700" colSpan={colSpan}>
      {children}
    </td>
  );
}

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}
