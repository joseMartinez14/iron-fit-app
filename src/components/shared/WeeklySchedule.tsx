'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

type Day = typeof days[number];

interface ClassSession {
    id: string;
    title: string;
    description?: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    capacity: number;
    isCancelled: boolean;
    instructor: {
        name: string;
    };
    _count?: {
        reservations: number;
    };
}

interface WeeklyScheduleProps {
    classes: ClassSession[];
    dateRange: {
        startDate: string;
        endDate: string;
    };
    currentWeekOffset: number;
    error?: string | null;
}

export function WeeklySchedule({
    classes,
    dateRange,
    currentWeekOffset,
    error
}: WeeklyScheduleProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Navigation functions
    const navigateToWeek = (weekOffset: number) => {
        const params = new URLSearchParams(searchParams.toString());

        if (weekOffset === 0) {
            params.delete('week');
        } else {
            params.set('week', weekOffset.toString());
        }

        const newUrl = params.toString() ? `?${params.toString()}` : '';
        router.push(`/dashboard/classes${newUrl}`);
    };

    const goToPreviousWeek = () => navigateToWeek(currentWeekOffset - 1);
    const goToNextWeek = () => navigateToWeek(currentWeekOffset + 1);
    const goToCurrentWeek = () => navigateToWeek(0);

    // Group classes by day of week
    const groupClassesByDay = (classes: ClassSession[]) => {
        const grouped: Record<Day, ClassSession[]> = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: [],
        };

        classes.forEach((classSession) => {
            const classDate = new Date(classSession.date);
            const dayOfWeek = classDate.getDay();

            // Convert day number to day name
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = dayNames[dayOfWeek] as Day;

            if (grouped[dayName]) {
                grouped[dayName].push(classSession);
            }
        });

        // Sort classes within each day by start time
        Object.keys(grouped).forEach((day) => {
            grouped[day as Day].sort((a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );
        });

        return grouped;
    };

    // Format time for display
    const formatTime = (dateTime: Date) => {
        return new Date(dateTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    // Format date for display
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    // Get date for each day of the week
    const getDateForDay = (dayIndex: number) => {
        // Ensure startDate is always Monday
        const startDate = new Date(dateRange.startDate);
        // If startDate is not Monday, adjust to previous Monday
        const dayOfWeek = startDate.getDay(); // 0 (Sun) - 6 (Sat)
        const mondayOffset = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
        const monday = new Date(startDate);
        monday.setDate(startDate.getDate() + mondayOffset);

        const date = new Date(monday);
        date.setDate(monday.getDate() + dayIndex);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    // Get week label
    const getWeekLabel = () => {
        if (currentWeekOffset === 0) return 'This Week';
        if (currentWeekOffset === 1) return 'Next Week';
        if (currentWeekOffset === -1) return 'Last Week';
        if (currentWeekOffset > 1) return `${currentWeekOffset} Weeks Ahead`;
        return `${Math.abs(currentWeekOffset)} Weeks Ago`;
    };

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Weekly Schedule</h2>
                <div className="text-center text-red-600 py-8">
                    <p>{error}</p>
                    <button
                        onClick={() => router.refresh()}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const groupedClasses = groupClassesByDay(classes);

    return (
        <div className="bg-white rounded-lg shadow p-4">
            {/* Header with navigation */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Weekly Schedule</h2>

                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPreviousWeek}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Previous week"
                    >
                        ←
                    </button>

                    <div className="text-center min-w-[120px]">
                        <div className="font-medium text-sm">{getWeekLabel()}</div>
                        <div className="text-xs text-gray-500">
                            {new Date(dateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
                            {new Date(dateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                    </div>

                    <button
                        onClick={goToNextWeek}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Next week"
                    >
                        →
                    </button>
                </div>

                {currentWeekOffset !== 0 && (
                    <button
                        onClick={goToCurrentWeek}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Today
                    </button>
                )}
            </div>

            {/* Schedule grid */}
            <div className="grid grid-cols-7 gap-2 text-sm">
                {days.map((day, dayIndex) => (
                    <div key={day} className="min-h-[200px]">
                        <div className="sticky top-0 bg-white pb-2">
                            <h3 className="font-medium">{day}</h3>
                            <p className="text-xs text-gray-500">{getDateForDay(dayIndex)}</p>
                        </div>

                        <div className="space-y-2">
                            {groupedClasses[day]?.length > 0 ? (
                                groupedClasses[day].map((classSession) => (
                                    <div
                                        key={classSession.id}
                                        className={`p-2 rounded border-l-4 ${classSession.isCancelled
                                            ? 'bg-red-50 border-red-400'
                                            : 'bg-blue-50 border-blue-400'
                                            }`}
                                    >
                                        <p className="font-medium text-xs">
                                            {formatTime(classSession.startTime)} – {formatTime(classSession.endTime)}
                                        </p>
                                        <p className={`font-medium ${classSession.isCancelled ? 'text-red-600 line-through' : 'text-gray-800'
                                            }`}>
                                            {classSession.title}
                                        </p>
                                        <p className="text-gray-600 text-xs">
                                            {classSession.instructor.name}
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            {classSession._count?.reservations || 0}/{classSession.capacity}
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            {formatDate(classSession.date)}
                                        </p>
                                        {classSession.isCancelled && (
                                            <p className="text-red-500 text-xs font-medium">CANCELLED</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-400 text-xs italic py-4">
                                    No classes scheduled
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Class count */}
            <div className="mt-4 text-center text-sm text-gray-500">
                {classes.length} {classes.length === 1 ? 'class' : 'classes'} scheduled this week
            </div>
        </div>
    );
}