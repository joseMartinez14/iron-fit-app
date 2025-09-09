import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-1/3 left-1/2 h-[70vh] w-[70vw] -translate-x-1/2 rounded-full blur-3xl opacity-30 dark:opacity-20 bg-gradient-to-tr from-purple-500 via-indigo-500 to-sky-400" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[50vh] w-[50vw] rounded-full blur-3xl opacity-20 dark:opacity-10 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-400" />
      </div>

      {/* Hero */}
      <section className="container mx-auto max-w-6xl px-6 pt-28 pb-16 sm:pt-36">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur">
            <span className="text-lg">💪</span> Built for fitness studios
          </span>
          <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold tracking-tight">
            Iron Fit
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Manage your clients, schedule classes, and track payments — all in one simple, powerful dashboard.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 text-white px-6 py-3 font-semibold shadow hover:bg-indigo-500 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Preview card */}
        <div className="mt-14 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur p-4 shadow-sm">
          <div className="aspect-[16/9] w-full rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 grid place-items-center">
            <div className="text-center">
              <div className="text-5xl">📆</div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Weekly schedule preview</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Client Management"
            emoji="🧑‍🤝‍🧑"
            desc="Create, group, and filter clients with ease. Keep everything in sync."
          />
          <FeatureCard
            title="Class Scheduling"
            emoji="📅"
            desc="Plan classes, manage capacity, and track reservations effortlessly."
          />
          <FeatureCard
            title="Payments & Reports"
            emoji="💳"
            desc="Record payments and export simple summaries for quick insights."
          />
          <FeatureCard
            title="Access Control"
            emoji="🔐"
            desc="Admin-protected tools keep sensitive operations safe and secure."
          />
          <FeatureCard
            title="Fast & Modern"
            emoji="⚡"
            desc="Built with Next.js and Tailwind for speed, reliability, and polish."
          />
          <FeatureCard
            title="Mobile Friendly"
            emoji="📱"
            desc="Responsive UI works great on phones, tablets, and desktops."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>© {new Date().getFullYear()} Iron Fit. All rights reserved.</p>
      </footer>
    </main>
  );
}

function FeatureCard({ title, desc, emoji }: { title: string; desc: string; emoji: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur p-5 shadow-sm">
      <div className="text-3xl">{emoji}</div>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{desc}</p>
    </div>
  );
}
