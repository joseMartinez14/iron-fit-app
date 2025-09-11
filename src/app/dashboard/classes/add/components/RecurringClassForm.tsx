'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';

const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

const recurringClassSchema = z.object({
    name: z.string().min(1, 'El nombre de la clase es obligatorio'),
    description: z.string().optional(),
    days: z.array(z.string()).min(1, 'Selecciona al menos un día'),
    startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
    endDate: z.string().min(1, 'La fecha de fin es obligatoria'),
    startTime: z.string().min(1, 'La hora de inicio es obligatoria'),
    endTime: z.string().min(1, 'La hora de fin es obligatoria'),
    instructor: z.string().min(1, 'El instructor es obligatorio'),
    capacity: z.string().min(1, 'La capacidad es obligatoria'),
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
                    text: response.data.message || '¡Clases recurrentes creadas con éxito!'
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
            console.error('Error al crear clases recurrentes:', error);
            setSubmitMessage({
                type: 'error',
                text: error.response?.data?.error || 'No se pudieron crear las clases recurrentes. Intenta nuevamente.'
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
                {/* Nombre de la clase */}
                <div>
                    <label className="block font-medium">Nombre de la clase</label>
                    <Controller
                        name="name"
                        control={form.control}
                        render={({ field }) => (
                            <input
                                {...field}
                                value={field.value || ''}
                                className="mt-1 w-full border px-3 py-2 rounded"
                                placeholder="Ingresa el nombre de la clase"
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

                {/* Selección de días */}
                <div>
                    <label className="block font-medium">Días de la semana</label>
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

                {/* Fechas de inicio y fin */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block font-medium">Fecha de inicio</label>
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
                        <label className="block font-medium">Fecha de fin</label>
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

                {/* Horarios */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block font-medium">Hora de inicio</label>
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
                        <label className="block font-medium">Hora de fin</label>
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
                                placeholder="Ingresa el nombre del instructor"
                            />
                        )}
                    />
                    {form.formState.errors.instructor && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.instructor.message}</p>
                    )}
                </div>

                {/* Capacidad */}
                <div>
                    <label className="block font-medium">Capacidad</label>
                    <Controller
                        name="capacity"
                        control={form.control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="number"
                                min="1"
                                className="mt-1 w-full border px-3 py-2 rounded"
                                placeholder="Ingresa la capacidad"
                            />
                        )}
                    />
                    {form.formState.errors.capacity && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.capacity.message}</p>
                    )}
                </div>

                {/* Estado */}
                <div>
                    <label className="block font-medium">Estado</label>
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
                                <option value="false">Activa</option>
                                <option value="true">Cancelada</option>
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
                    {isSubmitting ? 'Creando clases...' : 'Guardar clases recurrentes'}
                </button>
            </form>
        </div>
    );
}
