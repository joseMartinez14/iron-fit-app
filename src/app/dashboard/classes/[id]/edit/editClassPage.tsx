'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import AttendeeManagement from './components/AttendeeManagement';

// Schema for class form validation
const editClassSchema = z.object({
    title: z.string().min(1, 'Class title is required'),
    description: z.string().optional(),
    location: z.string().optional(),
    date: z.string().min(1, 'Date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    capacity: z.string().min(1, 'Capacity is required'),
    isCancelled: z.boolean(),
});

type EditClassForm = z.infer<typeof editClassSchema>;

interface Client {
    id: string;
    name: string;
    phone?: string;
    isActive: boolean;
}

interface ClientGroup {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
    members: Client[];
}

interface ClassData {
    id: string;
    title: string;
    description?: string;
    location?: string;
    capacity: number;
    date: string;
    startTime: string;
    endTime: string;
    isCancelled: boolean;
    instructor: {
        id: string;
        name: string;
    };
    attendanceLogs: Array<{
        id: string;
        client: Client;
        checkInTime: string;
    }>;
}

interface EditClassPageProps {
    classData: ClassData;
    allClients: Client[];
    allGroups: ClientGroup[];
}

export default function EditClassPage({ classData, allClients, allGroups }: EditClassPageProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [attendees, setAttendees] = useState<string[]>(
        classData.attendanceLogs.map(log => log.client.id)
    );

    // Convert date and time from ISO strings to form format
    const formatDateForInput = (isoString: string) => {
        return new Date(isoString).toISOString().split('T')[0];
    };

    const formatTimeForInput = (isoString: string) => {
        return new Date(isoString).toTimeString().slice(0, 5);
    };

    const form = useForm<EditClassForm>({
        resolver: zodResolver(editClassSchema),
        defaultValues: {
            title: classData.title,
            description: classData.description || '',
            location: classData.location || '',
            date: formatDateForInput(classData.date),
            startTime: formatTimeForInput(classData.startTime),
            endTime: formatTimeForInput(classData.endTime),
            capacity: classData.capacity.toString(),
            isCancelled: classData.isCancelled,
        },
    });

    const handleSubmit = async (data: EditClassForm) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Combine date and time for API
            const startDateTime = new Date(`${data.date}T${data.startTime}`);
            const endDateTime = new Date(`${data.date}T${data.endTime}`);

            const updateData = {
                title: data.title,
                description: data.description || undefined,
                location: data.location || undefined,
                capacity: parseInt(data.capacity),
                date: data.date,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                isCancelled: data.isCancelled,
                attendeeIds: attendees, // Include selected attendees
            };

            const response = await axios.put(`/api/protected/classes/${classData.id}`, updateData);

            if (response.data.success) {
                setSubmitMessage({
                    type: 'success',
                    text: response.data.message || 'Class updated successfully!'
                });

                // Redirect after success
                setTimeout(() => {
                    router.push('/dashboard/classes');
                }, 2000);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Error updating class:', error);
            setSubmitMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to update class. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/dashboard/classes');
    };

    const currentAttendees = allClients.filter(client => attendees.includes(client.id));

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Edit Class</h1>
                    <p className="text-gray-500 text-sm">
                        Class ID: {classData.id}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {/* Success/Error Message */}
            {submitMessage && (
                <div className={`mb-6 p-4 rounded ${submitMessage.type === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                    {submitMessage.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Class Details Form */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-medium mb-4">Class Details</h2>

                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        {/* Class Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Class Title
                            </label>
                            <Controller
                                name="title"
                                control={form.control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter class title"
                                    />
                                )}
                            />
                            {form.formState.errors.title && (
                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <Controller
                                name="description"
                                control={form.control}
                                render={({ field }) => (
                                    <textarea
                                        {...field}
                                        rows={3}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter class description"
                                    />
                                )}
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                            </label>
                            <Controller
                                name="location"
                                control={form.control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter location"
                                    />
                                )}
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <Controller
                                name="date"
                                control={form.control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        type="date"
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                )}
                            />
                            {form.formState.errors.date && (
                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.date.message}</p>
                            )}
                        </div>

                        {/* Time fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Time
                                </label>
                                <Controller
                                    name="startTime"
                                    control={form.control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            type="time"
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    )}
                                />
                                {form.formState.errors.startTime && (
                                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.startTime.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Time
                                </label>
                                <Controller
                                    name="endTime"
                                    control={form.control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            type="time"
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            min={form.watch('startTime')}
                                        />
                                    )}
                                />
                                {form.formState.errors.endTime && (
                                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.endTime.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Capacity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Capacity
                            </label>
                            <Controller
                                name="capacity"
                                control={form.control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        type="number"
                                        min="1"
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter capacity"
                                    />
                                )}
                            />
                            {form.formState.errors.capacity && (
                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.capacity.message}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <Controller
                                name="isCancelled"
                                control={form.control}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        value={field.value ? "true" : "false"}
                                        onChange={(e) => field.onChange(e.target.value === "true")}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="false">Active</option>
                                        <option value="true">Cancelled</option>
                                    </select>
                                )}
                            />
                        </div>

                        {/* Instructor Info (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Instructor
                            </label>
                            <input
                                value={classData.instructor.name}
                                readOnly
                                className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-gray-600"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-2 px-4 rounded text-white ${isSubmitting
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                        >
                            {isSubmitting ? 'Updating Class...' : 'Update Class'}
                        </button>
                    </form>
                </div>

                {/* Attendee Management */}
                <div className="bg-white rounded-lg shadow p-6">
                    <AttendeeManagement
                        selectedAttendees={attendees}
                        onAttendeesChange={setAttendees}
                        allClients={allClients}
                        allGroups={allGroups}
                        currentAttendees={currentAttendees}
                        classCapacity={parseInt(form.watch('capacity') || '0')}
                    />
                </div>
            </div>
        </div>
    );
}