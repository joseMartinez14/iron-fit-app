'use client';

import { SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';
import Image from 'next/image';

export default function AdminLanding() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
            {/* Header */}
            <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-black" />
                        <span className="text-lg font-semibold tracking-tight">Iron Fit — Admin</span>
                    </div>
                    <SignedOut>
                        <div className="flex items-center gap-3">
                            <SignInButton mode="modal">
                                <button className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                                    Sign in
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90">
                                    Create account
                                </button>
                            </SignUpButton>
                        </div>
                    </SignedOut>
                </div>
            </header>

            {/* Hero */}
            <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
                <div className="grid items-center gap-10 md:grid-cols-2">
                    <div>
                        <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
                            Manage classes, clients, and payments—<span className="underline decoration-black">all in one place</span>.
                        </h1>
                        <p className="mt-4 max-w-prose text-base text-gray-600 md:text-lg">
                            The Iron Fit admin hub lets you create sessions, control capacity, track attendance,
                            and verify payment status without friction.
                        </p>

                        <SignedOut>
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <SignUpButton mode="modal">
                                    <button className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-black/90">
                                        Get started — it’s free
                                    </button>
                                </SignUpButton>
                                <SignInButton mode="modal">
                                    <button className="rounded-2xl border px-5 py-3 text-sm font-semibold hover:bg-gray-50">
                                        I already have an account
                                    </button>
                                </SignInButton>
                            </div>
                        </SignedOut>

                        <p className="mt-4 text-xs text-gray-500">
                            Secured by Clerk • Works great on desktop and mobile
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 -z-10 rounded-3xl bg-gray-100 blur-2xl" />
                        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
                            <Image
                                src="/admin-preview.png"
                                alt="Iron Fit admin dashboard preview"
                                width={1024}
                                height={768}
                                className="h-auto w-full"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="bg-white">
                <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Feature
                            title="Class scheduling"
                            desc="Create sessions, define capacity, set instructors, and control waitlists."
                        />
                        <Feature
                            title="Attendance tracking"
                            desc="See who’s booked, who checked in, and export attendance logs."
                        />
                        <Feature
                            title="Payment status"
                            desc="Quickly verify client payments and account activity in one view."
                        />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-6xl px-4 pb-20 pt-8">
                <div className="rounded-3xl border bg-gray-50 px-6 py-10 text-center md:px-12">
                    <h2 className="text-2xl font-bold md:text-3xl">
                        Ready to manage your next class?
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
                        Create your admin account and set up your first week of sessions in minutes.
                    </p>
                    <SignedOut>
                        <div className="mt-6 flex justify-center gap-3">
                            <SignUpButton mode="modal">
                                <button className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-black/90">
                                    Create admin account
                                </button>
                            </SignUpButton>
                            <SignInButton mode="modal">
                                <button className="rounded-2xl border px-5 py-3 text-sm font-semibold hover:bg-gray-100">
                                    Sign in
                                </button>
                            </SignInButton>
                        </div>
                    </SignedOut>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-gray-500">
                    <span>© {new Date().getFullYear()} Iron Fit</span>
                    <span>Admin Platform • Next.js • Clerk • Supabase</span>
                </div>
            </footer>
        </main>
    );
}

function Feature({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-gray-600">{desc}</p>
        </div>
    );
}