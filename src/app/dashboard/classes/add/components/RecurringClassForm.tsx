'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

const recurringClassSchema = z.object({
    name: z.string().min(1, 'Class name is required'),
    description: z.string().optional(),
    days: z.array(z.string()).min(1, 'Please select at least one day'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    instructor: z.string().min(1, 'Instructor is required'),
    capacity: z.string().min(1, 'Capacity is required'),
    isCancelled: z.boolean(),
});

type RecurringClassForm = z.infer<typeof recurringClassSchema>;

export default function RecurringClassForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const form = useForm<RecurringClassForm>({
        resolver: zodResolver(recurringClassSchema),
        defaultValues: {
            name: '',
            description: '',
            days: [],
            startDate: getTodayDate(),
            endDate: '',
            startTime: '',
            endTime: '',
            instructor: '',
            capacity: '',
            isCancelled: false,
        },
    });

    const handleSubmit = async (data: RecurringClassForm) => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const classData = { ...data, type: 'recurring' as const };
            const response = await axios.post('/api/protected/classes', classData);

            if (response.data.success) {
                setSubmitMessage({
                    type: 'success',
                    text: response.data.message || 'Recurring classes created successfully!'
                });
                // Reset form
                form.reset({
                    name: '',
                    description: '',
                    days: [],
                    startDate: getTodayDate(),
                    endDate: '',
                    startTime: '',
                    endTime: '',
                    instructor: '',
                    capacity: '',
                    isCancelled: false,
                });
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Error creating recurring classes:', error);
            setSubmitMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to create recurring classes. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleDay = (day: string) => {
        const currentDays = form.watch('days') || [];
        const newDays = currentDays.includes(day)
            ? currentDays.filter((d) => d !== day)
            : [...currentDays, day];
        form.setValue('days', newDays);
    };

    return (
        <div>
            {/* Success/Error Message */}
            {submitMessage && (
                <div className={`mb-4 p-4 rounded ${submitMessage.type === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                    {submitMessage.text}
                </div>
            )}

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                {/* Class Name */}
                <div>
                    <label className="block font-medium">Class Name</label>
                    <Controller
                        name="name"
                        control={form.control}
                        render={({ field }) => (
                            <input
                                {...field}
                                value={field.value || ''}
                                className="mt-1 w-full border px-3 py-2 rounded"
                                placeholder="Enter class name"
                            />
                        )}
                    />
                    {form.formState.errors.name && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block font-medium">Description</label>
                    <Controller
                        name="description"
                        control={form.control}
                        render={({ field }) => (
                            <textarea
                                {...field}
                                className="mt-1 w-full border px-3 py-2 rounded"
                                placeholder="Enter class description"
                            />
                        )}
                    />
                </div>

                {/* Days Selection */}
                <div>
                    <label className="block font-medium">Days of Week</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {daysOfWeek.map((day) => {
                            const selectedDays = form.watch('days') || [];
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDay(day)}
                                    className={`px-3 py-1 rounded border ${selectedDays.includes(day)
                                        ? 'bg-black text-white'
                                        : 'bg-white text-black border-gray-300'
                                        }`}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                    {form.formState.errors.days && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.days.message}</p>
                    )}
                </div>

                {/* Start and End Date */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block font-medium">Start Date</label>
                        <Controller
                            name="startDate"
                            control={form.control}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    type="date"
                                    className="mt-1 w-full border px-3 py-2 rounded"
                                />
                            )}
                        />
                        {form.formState.errors.startDate && (
                            <p className="text-sm text-red-500 mt-1">{form.formState.errors.startDate.message}</p>
                        )}
                    </div>

                    <div className="flex-1">
                        <label className="block font-medium">End Date</label>
                        <Controller
                            name="endDate"
                            control={form.control}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    type="date"
                                    className="mt-1 w-full border px-3 py-2 rounded"
                                    min={form.watch('startDate')}
                                />
                            )}
                        />
                        {form.formState.errors.endDate && (
                            <p className="text-sm text-red-500 mt-1">{form.formState.errors.endDate.message}</p>
                        )}
                    </div>
                </div>

                {/* Start and End Time */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block font-medium">Start Time</label>
                        <Controller
                            name="startTime"
                            control={form.control}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    type="time"
                                    className="mt-1 w-full border px-3 py-2 rounded"
                                />
                            )}
                        />
                        {form.formState.errors.startTime && (
                            <p className="text-sm text-red-500 mt-1">{form.formState.errors.startTime.message}</p>
                        )}
                    </div>

                    <div className="flex-1">
                        <label className="block font-medium">End Time</label>
                        <Controller
                            name="endTime"
                            control={form.control}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    type="time"
                                    className="mt-1 w-full border px-3 py-2 rounded"
                                    min={form.watch('startTime')}
                                />
                            )}
                        />
                        {form.formState.errors.endTime && (
                            <p className="text-sm text-red-500 mt-1">{form.formState.errors.endTime.message}</p>
                        )}
                    </div>
                </div>

                {/* Instructor */}
                <div>
                    <label className="block font-medium">Instructor</label>
                    <Controller
                        name="instructor"
                        control={form.control}
                        render={({ field }) => (
                            <input
                                {...field}
                                className="mt-1 w-full border px-3 py-2 rounded"
                                placeholder="Enter instructor name"
                            />
                        )}
                    />
                    {form.formState.errors.instructor && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.instructor.message}</p>
                    )}
                </div>

                {/* Capacity */}
                <div>
                    <label className="block font-medium">Capacity</label>
                    <Controller
                        name="capacity"
                        control={form.control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="number"
                                min="1"
                                className="mt-1 w-full border px-3 py-2 rounded"
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
                    <label className="block font-medium">Status</label>
                    <Controller
                        name="isCancelled"
                        control={form.control}
                        render={({ field }) => (
                            <select
                                {...field}
                                value={field.value ? "true" : "false"}
                                onChange={(e) => field.onChange(e.target.value === "true")}
                                className="mt-1 w-full border px-3 py-2 rounded"
                            >
                                <option value="false">Active</option>
                                <option value="true">Cancelled</option>
                            </select>
                        )}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 rounded text-white ${isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-black hover:bg-gray-800'
                        }`}
                >
                    {isSubmitting ? 'Creating Classes...' : 'Save Recurring Class'}
                </button>
            </form>
        </div>
    );
}