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
        .min(2, 'Name must be at least 2 characters')
        .max(80, 'Name is too long'),
    phone: z
        .string()
        .max(30, 'Phone is too long')
        .regex(/^[0-9+()\-\s]*$/, 'Only digits, spaces, +, -, () allowed')
        .optional()
        .or(z.literal('')),
    userName: z
        .string()
        .trim()
        .min(4, 'Username must be at least 4 characters')
        .max(30, 'Username too long')
        .regex(/^[a-z0-9_.-]+$/, 'Use lowercase letters, numbers, dot, dash or underscore'),
    isActive: z.boolean().optional().default(false),
})

const createSchema = baseSchema.extend({
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password too long'),
})

const editSchema = baseSchema.extend({
    password: z
        .union([
            z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
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
    const labels = ['Very weak', 'Weak', 'Okay', 'Good', 'Strong', 'Very strong']
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
                    alert('✅ Client created successfully!')
                    reset({ name: '', phone: '', userName: '', password: '', isActive: false })
                } else {
                    alert('❌ Failed to create client: ' + (response.data?.error || 'Unknown error'))
                }
            } else {
                // EDIT MODE
                if (!id) {
                    alert('❌ Missing client id for edit action.')
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
                    alert('✅ Client updated successfully!')
                } else {
                    alert('❌ Failed to update client: ' + (response.data?.error || 'Unknown error'))
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
                alert('❌ Failed to submit. Please try again.')
            }
        }
    }

    const onSubmit = onSubmitProp ?? handleInternalSubmit

    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-5">
                <h2 className="text-lg font-medium">Client Details</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-6">
                {/* Name */}
                <div className="grid gap-2">
                    <label htmlFor="name" className="text-sm font-medium">
                        Full name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        {...register('name')}
                        className="h-11 rounded-xl border border-gray-300 bg-white px-3 outline-none ring-0 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                        placeholder="e.g., Ana Morales"
                    />
                    {errors.name?.message && (
                        // @ts-expect-error errors.name is a ZodError
                        <p className="text-sm text-red-600">{errors.name?.message}</p>
                    )}
                </div>

                {/* Phone (optional) */}
                <div className="grid gap-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                        Phone (optional)
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        {...register('phone')}
                        className="h-11 rounded-xl border border-gray-300 bg-white px-3 outline-none ring-0 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                        placeholder="e.g., +57 300 123 4567"
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
                            Username <span className="text-red-500">*</span>
                        </label>
                        <button
                            type="button"
                            onClick={handleSuggestUsername}
                            className="text-xs font-medium text-gray-700 underline-offset-2 hover:underline"
                            aria-label="Suggest username from name"
                        >
                            Suggest from name
                        </button>
                    </div>
                    <input
                        id="userName"
                        type="text"
                        autoComplete="username"
                        {...register('userName')}
                        className="h-11 rounded-xl border border-gray-300 bg-white px-3 outline-none ring-0 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                        placeholder="e.g., ana.morales"
                    />
                    <p className="text-xs text-gray-500">Use lowercase letters, numbers, dot, dash or underscore.</p>
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
                                <>Password <span className="text-red-500">*</span></>
                            ) : (
                                <>New password (optional)</>
                            )}
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className="text-xs font-medium text-gray-700 underline-offset-2 hover:underline"
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                            <button
                                type="button"
                                onClick={handleGeneratePassword}
                                className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                aria-label="Generate strong password"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={mode === 'create' ? 'new-password' : 'off'}
                        {...register('password')}
                        className="h-11 rounded-xl border border-gray-300 bg-white px-3 outline-none ring-0 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                        placeholder="At least 8 characters"
                    />
                    <div className="flex items-center justify-between text-xs">
                        <p className="text-gray-500">Strength: <span className="font-medium text-gray-700">{strength.label}</span></p>
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
                            <p className="text-sm font-medium">Active status</p>
                            <p className="text-xs text-gray-500">Active clients can book classes and appear in attendance lists.</p>
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
                        Cancel
                    </a>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? (mode === 'create' ? 'Saving…' : 'Updating…') : (mode === 'create' ? 'Save Client' : 'Update Client')}
                    </button>
                </div>
            </form>

            {/* Developer helper: live JSON */}
            <details className="mt-2 cursor-pointer select-none text-sm text-gray-600 px-5 pb-5">
                <summary className="mb-2 font-medium">Developer Preview</summary>
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
