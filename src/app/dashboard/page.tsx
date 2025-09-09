'use client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {

    return (
        <div className="flex h-screen overflow-hidden ">
            {/* Main Content */}
            <main className="flex-1 bg-app-bg p-6 overflow-y-auto w-full">
                <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
                <p className="text-gray-600 mb-6">{`Welcome back! Here's what's happening today.`}</p>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard title="Total Clients" value="248" sub="↑ 12% from last month" />
                    <StatCard title="Active Clients" value="189" sub="76% of total clients" />
                    <StatCard title="Classes Today" value="8" sub="↑ 2 from yesterday" />
                    <StatCard title="Reserved Spots" value="86" sub="89% capacity filled" />
                </div>

                {/* Today's Classes */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">{`Today's Classes`}</h2>
                        <Button variant="link">View All</Button>
                    </div>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <Th>Time</Th>
                                    <Th>Class Name</Th>
                                    <Th>Instructor</Th>
                                    <Th>Capacity</Th>
                                    <Th>Reserved</Th>
                                    <Th>Actions</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["06:00 AM", "Morning HIIT", "Sarah Johnson", 15, 12],
                                    ["09:30 AM", "Power Yoga", "Michael Chen", 20, 18],
                                    ["12:15 PM", "Lunch Express", "Jessica Patel", 12, 10],
                                    ["05:30 PM", "Strength Training", "David Williams", 18, 15],
                                    ["07:00 PM", "Spin Class", "Alex Rodriguez", 25, 22],
                                ].map(([time, name, instructor, cap, res], i) => (
                                    <tr key={i} className="border-t">
                                        <Td>{time}</Td>
                                        <Td>{name}</Td>
                                        <Td>{instructor}</Td>
                                        <Td>{cap}</Td>
                                        <Td>{res}</Td>
                                        <Td>
                                            <Button size="icon" variant="ghost">
                                                <EyeIcon className="w-4 h-4" />
                                            </Button>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}



function StatCard({ title, value, sub }: { title: string; value: string; sub: string }) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">{title}</div>
                <div className="text-xl font-bold mb-1">{value}</div>
                <div className="text-xs text-gray-400">{sub}</div>
            </CardContent>
        </Card>
    );
}

function Th({ children }: { children: React.ReactNode }) {
    return <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
    return <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{children}</td>;
}

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}
