/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import DashboardClient, {
    type DashboardStats,
    type DashboardClass,
} from "@/components/dashboard/DashboardClient";
import isAuthenticated from "@/lib/authUtils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const verified = await isAuthenticated();
    if (!verified.status) {
        if (verified.userID) {
            redirect("/not-admin");
        } else {
            redirect("/");
        }
    }

    const { startOfDay, startOfTomorrow } = getTodayRange();

    const [totalClients, activeClients, sessions] = await Promise.all([
        prisma.client.count(),
        prisma.client.count({ where: { isActive: true } }).catch(() => 0),
        prisma.classSession
            .findMany({
                where: { startTime: { gte: startOfDay, lt: startOfTomorrow } },
                orderBy: { startTime: "asc" },
                select: {
                    id: true,
                    title: true,
                    startTime: true,
                    capacity: true,
                    instructor: { select: { name: true } },
                    _count: { select: { attendanceLogs: true } },
                },
            })
            .catch(() => [] as any[]),
    ]);

    const classesToday = sessions.length;
    const reservedSpots = sessions.reduce(
        (sum, s) => sum + (s._count?.attendanceLogs ?? 0),
        0
    );

    const stats: DashboardStats = {
        totalClients,
        activeClients,
        classesToday,
        reservedSpots,
    };

    const classes: DashboardClass[] = sessions.map((s) => ({
        id: s.id,
        title: s.title,
        startTime: s.startTime.toISOString(),
        instructorName: s.instructor?.name ?? null,
        capacity: s.capacity,
        reserved: s._count?.attendanceLogs ?? 0,
    }));

    return <DashboardClient stats={stats} classes={classes} />;
}

function getTodayRange() {
    const now = new Date();
    const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
    );
    const startOfTomorrow = new Date(startOfDay);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    return { startOfDay, startOfTomorrow };
}
