import { Filters } from "@/components/shared/TableFilters";
import { WeeklySchedule } from "@/components/shared/WeeklySchedule";
import { ClassList } from "./components/ClassList";
import { getClassesByDateRangeServer, getWeekDates } from "@/app/api/protected/classes/service";


interface ClassesPageProps {
    searchParams: Promise<{
        week?: string; // Week offset as string
    }>;
}

export default async function ClassesPage({ searchParams }: ClassesPageProps) {
    // Await searchParams before using its properties
    const params = await searchParams;
    const weekOffset = parseInt(params.week || '0');
    const { startDate, endDate } = getWeekDates(weekOffset);

    let classesData;
    let error = null;

    try {
        classesData = await getClassesByDateRangeServer(startDate, endDate);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error('Error fetching classes:', err);
        error = err.message;
        classesData = { classes: [], dateRange: { startDate, endDate }, count: 0 };
    }

    return (
        <div className="p-6 space-y-6">
            <header>
                <h1 className="text-2xl font-semibold">Classes</h1>
                <p className="text-gray-500">Manage all fitness classes and schedules</p>
            </header>

            <Filters />

            <WeeklySchedule
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                classes={classesData.classes.map((cls: any) => ({
                    ...cls,
                    description: cls.description === null ? undefined : cls.description,
                }))}
                dateRange={classesData.dateRange}
                currentWeekOffset={weekOffset}
                error={error}
            />

            <ClassList
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                classes={classesData.classes.map((cls: any) => ({
                    ...cls,
                    description: cls.description === null ? undefined : cls.description,
                }))}
                loading={false}
                error={error}
            />
        </div>
    );
}