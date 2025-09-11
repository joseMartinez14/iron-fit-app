'use client'

import React, { useMemo, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import axios from 'axios'

// --------------------------------------
// Zod schemas (create vs edit)
// --------------------------------------
const baseSchema = z.object({
    name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(80, 'El nombre es demasiado largo'),
    phone: z
        .string()
        .max(30, 'El teléfono es demasiado largo')
        .regex(/^[0-9+()\-\s]*$/, 'Solo se permiten dígitos, espacios y + - ()')
        .optional()
        .or(z.literal('')),
    userName: z
        .string()
        .trim()
        .min(4, 'El usuario debe tener al menos 4 caracteres')
        .max(30, 'El usuario es demasiado largo')
        .regex(/^[a-z0-9_.-]+$/, 'Usa minúsculas, números, punto, guion o guion bajo'),
    isActive: z.boolean().optional().default(false),
})

const createSchema = baseSchema.extend({
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(128, 'La contraseña es demasiado larga'),
})

const editSchema = baseSchema.extend({
    password: z
        .union([
            z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128, 'La contraseña es demasiado larga'),
            z.string().length(0), // Allow empty string
            z.undefined(), // Allow undefined
        ])
        .optional(),
})

// For RHF typing we use the edit variant (password optional).
//export type ClientFormValues = z.infer<typeof editSchema>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClientFormValues = z.input<typeof editSchema> & any & z.output<typeof editSchema>; // Pass the full type signature


// --------------------------------------
// Helpers
// --------------------------------------
function slugifyUsername(input: string) {
    const ascii = input
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
    const base = ascii.replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')
    return base.slice(0, 30)
}

function generatePassword(len = 12) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let out = ''
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
    return out
}

function getPasswordStrength(pw: string) {
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[a-z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    if (pw.length >= 12) score++
    const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte', 'Muy fuerte']
    return { score, label: labels[Math.min(score, labels.length - 1)] }
}

// --------------------------------------
// Reusable ClientForm (create & edit)
// --------------------------------------
export default function ClientForm({
    mode,
    id,
    initial,
    onSubmit: onSubmitProp,
}: {
    mode: 'create' | 'edit'
    id?: string // required for edit default submit
    initial?: Partial<ClientFormValues>
    onSubmit?: (values: ClientFormValues) => Promise<void>
}) {
    const [showPassword, setShowPassword] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<ClientFormValues>({
        resolver: zodResolver(mode === 'create' ? createSchema : editSchema),
        defaultValues: {
            name: initial?.name ?? '',
            phone: initial?.phone ?? '',
            userName: initial?.userName ?? '',
            password: '', // never prefill password
            isActive: initial?.isActive ?? false,
        },
        mode: 'onBlur',
    })

    const nameValue = watch('name')
    const passwordValue = watch('password')

    const strength = useMemo(() => getPasswordStrength(passwordValue || ''), [passwordValue])

    function handleSuggestUsername() {
        const suggested = slugifyUsername(nameValue || '')
        if (suggested) setValue('userName', suggested)
    }

    function handleGeneratePassword() {
        const pw = generatePassword()
        setValue('password', pw, { shouldValidate: true })
    }

    // Type the submit handler properly
    const handleInternalSubmit: SubmitHandler<ClientFormValues> = async (values) => {
        try {
            // Convert empty string to undefined for optional fields
            const payload: Record<string, unknown> = {
                name: values.name,
                userName: values.userName,
                phone: values.phone && values.phone.trim() !== '' ? values.phone.trim() : undefined,
            }

            if (mode === 'create') {
                payload['isActive'] = false
                payload['password'] = values.password // required by createSchema

                const response = await axios.post('/api/protected/client', payload)
                if (response.data?.success) {
                    alert('✅ ¡Cliente creado con éxito!')
                    reset({ name: '', phone: '', userName: '', password: '', isActive: false })
                } else {
                    alert('❌ No se pudo crear el cliente: ' + (response.data?.error || 'Error desconocido'))
                }
            } else {
                // EDIT MODE
                if (!id) {
                    alert('❌ Falta el ID del cliente para editar.')
                    return
                }
                // include password if provided
                if (values.password && values.password.trim() !== '') {
                    payload['password'] = values.password
                }
                // include active flag from the toggle
                payload['isActive'] = values.isActive

                const response = await axios.put(`/api/protected/client/${id}`, payload)
                if (response.data?.success) {
                    alert('✅ ¡Cliente actualizado con éxito!')
                } else {
                    alert('❌ No se pudo actualizar el cliente: ' + (response.data?.error || 'Error desconocido'))
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Error submitting client form:', error)
            if (error?.response?.data?.error) {
                alert('❌ ' + error.response.data.error)
            } else if (error?.response?.data?.message) {
                alert('❌ ' + error.response.data.message)
            } else if (error?.message) {
                alert('❌ Error: ' + error.message)
            } else {
                alert('❌ No se pudo enviar. Inténtalo de nuevo.')
            }
        }
    }

    const onSubmit = onSubmitProp ?? handleInternalSubmit

    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-5">
                <h2 className="text-lg font-medium">Detalles del cliente</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-6">
                {/* Name */}
                <div className="grid gap-2">
                    <label htmlFor="name" className="text-sm font-medium">
                        Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        {...register('name')}
                        className="h-11 rounded-xl border border-gray-300 bg-white px-3 outline-none ring-0 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                        placeholder="Ej.: Ana Morales"
                    />
                    {errors.name?.message && (
                        // @ts-expect-error errors.name is a ZodError
                        <p className="text-sm text-red-600">{errors.name?.message}</p>
                    )}
                </div>

                {/* Phone (optional) */}
                <div className="grid gap-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                        Teléfono (opcional)
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        {...register('phone')}
                        className="h-11 rounded-xl border border-gray-300 bg-white px-3 outline-none ring-0 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                        placeholder="Ej.: +57 300 123 4567"
                    />
                    {errors.phone?.message && (
                        // @ts-expect-error errors.name is a ZodError
                        <p className="text-sm text-red-600">{errors.phone?.message}</p>
                    )}
                </div>

                {/* Row: Username + Suggestion */}
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor="userName" className="text-sm font-medium">
                            Usuario <span className="text-red-500">*</span>
                        </label>
                        <button
                            type="button"
                            onClick={handleSuggestUsername}
                            className="text-xs font-medium text-gray-700 underline-offset-2 hover:underline"
                            aria-label="Suggest username from name"
                        >
                            Sugerir desde el nombre
                        </button>
                    </div>
                    <input
                        id="userName"
                        type="text"
                        autoComplete="username"
                        {...register('userName')}
                        className="h-11 rounded-xl border border-gray-300 bg-white px-3 outline-none ring-0 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                        placeholder="Ej.: ana.morales"
                    />
                    <p className="text-xs text-gray-500">Usa minúsculas, números, punto, guion o guion bajo.</p>
                    {errors.userName && (
                        // @ts-expect-error errors.name is a ZodError
                        <p className="text-sm text-red-600">{errors.userName.message}</p>
                    )}
                </div>

                {/* Password */}
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium">
                            {mode === 'create' ? (
                                <>Contraseña <span className="text-red-500">*</span></>
                            ) : (
                                <>Nueva contraseña (opcional)</>
                            )}
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className="text-xs font-medium text-gray-700 underline-offset-2 hover:underline"
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? 'Ocultar' : 'Mostrar'}
                            </button>
                            <button
                                type="button"
                                onClick={handleGeneratePassword}
                                className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                aria-label="Generate strong password"
                            >
                                Generar
                            </button>
                        </div>
                    </div>
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={mode === 'create' ? 'new-password' : 'off'}
                        {...register('password')}
                        className="h-11 rounded-xl border border-gray-300 bg-white px-3 outline-none ring-0 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                        placeholder="Al menos 8 caracteres"
                    />
                    <div className="flex items-center justify-between text-xs">
                        <p className="text-gray-500">Fuerza: <span className="font-medium text-gray-700">{strength.label}</span></p>
                        <div className="flex gap-1" aria-hidden>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <span
                                    key={i}
                                    className={`h-1.5 w-7 rounded-full ${i < strength.score ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                />
                            ))}
                        </div>
                    </div>
                    {errors.password && (
                        // @ts-expect-error errors.password is a ZodError
                        <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                </div>

                {/* Active toggle (edit mode only) */}
                {mode === 'edit' && (
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                        <div>
                            <p className="text-sm font-medium">Estado activo</p>
                            <p className="text-xs text-gray-500">Los clientes activos pueden reservar clases y aparecer en listas de asistencia.</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                className="peer sr-only"
                                {...register('isActive')}
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-emerald-500" />
                            <div className="pointer-events-none -ml-9 h-6 w-11">
                                <div className="relative left-0 top-0 h-6 w-11">
                                    <span className="absolute left-0 top-0 h-6 w-11">
                                        <span className="absolute left-0 top-0 m-0.5 h-5 w-5 rounded-full bg-white shadow transition-all peer-checked:translate-x-5" />
                                    </span>
                                </div>
                            </div>
                        </label>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <a
                        href="/admin/clients"
                        className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancelar
                    </a>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? (mode === 'create' ? 'Guardando…' : 'Actualizando…') : (mode === 'create' ? 'Guardar cliente' : 'Actualizar cliente')}
                    </button>
                </div>
            </form>

            {/* Developer helper: live JSON */}
            <details className="mt-2 cursor-pointer select-none text-sm text-gray-600 px-5 pb-5">
                <summary className="mb-2 font-medium">Vista previa para desarrollador</summary>
                <pre className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-4 text-xs">
                    {JSON.stringify(
                        {
                            mode,
                            id,
                            name: watch('name'),
                            phone: (watch('phone') || '').trim(),
                            userName: watch('userName'),
                            password: watch('password'),
                            isActive: watch('isActive'),
                        },
                        null,
                        2
                    )}
                </pre>
            </details>
        </div>
    )
}
