'use client';
import React from 'react'
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    // Calendar,
    Dumbbell,
    LayoutDashboard,
    Users,
    CreditCard,
    // BarChart2,
    Settings,
    HelpCircle,
    Menu,
    PanelLeftClose
} from "lucide-react";

const DashboardSidebar = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // Navigation items with their routes (labels in Spanish)
    const mainNavItems = [
        { icon: <LayoutDashboard />, label: "Inicio", href: "/dashboard" },
        { icon: <Dumbbell />, label: "Clases", href: "/dashboard/classes" },
        { icon: <Users />, label: "Clientes", href: "/dashboard/clients" },
        { icon: <CreditCard />, label: "Pagos", href: "/dashboard/payments" },
        // { icon: <Calendar />, label: "Horario", href: "/dashboard/schedule" },
        // { icon: <BarChart2 />, label: "Reportes", href: "/dashboard/reports" },
    ];

    const bottomNavItems = [
        { icon: <Settings />, label: "Settings", href: "/dashboard/settings" },
        { icon: <HelpCircle />, label: "Help", href: "/dashboard/help" },
    ];

    const handleNavigation = (href: string) => {
        router.push(href);
        // Close sidebar on mobile after navigation
        setSidebarOpen(false);
    };

    const isActive = (href: string) => {
        // Check if current path matches or starts with the nav item path
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }
        return pathname.startsWith(href);
    };

    return (
        <div className="app-bg-color">
            <div className="md:hidden absolute top-1 left-3 z-50 app-bg-color">
                {!sidebarOpen && (
                    <div onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <Menu className="w-8 h-8 text-gray-700" />
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed z-40 inset-y-0 left-0 w-64 h-full bg-gray-900 text-white transform md:static md:translate-x-0 transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="h-full flex flex-col justify-between p-4">
                    <div>
                        <div className="w-full flex flex-row justify-between">
                            <div
                                className="text-2xl font-bold mb-6 cursor-pointer hover:text-gray-300 transition-colors"
                                onClick={() => handleNavigation("/dashboard")}
                            >
                                Iron Fit
                            </div>
                            <div className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                                <PanelLeftClose />
                            </div>
                        </div>
                        <nav className="space-y-2">
                            {mainNavItems.map((item) => (
                                <NavItem
                                    key={item.href}
                                    icon={item.icon}
                                    label={item.label}
                                    href={item.href}
                                    active={isActive(item.href)}
                                    onClick={handleNavigation}
                                />
                            ))}
                        </nav>
                    </div>
                    <div className="space-y-2">
                        {bottomNavItems.map((item) => (
                            <NavItem
                                key={item.href}
                                icon={item.icon}
                                label={item.label}
                                href={item.href}
                                active={isActive(item.href)}
                                onClick={handleNavigation}
                            />
                        ))}
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    )
}

export default DashboardSidebar

function NavItem({
    icon,
    label,
    href,
    active = false,
    onClick
}: {
    icon: React.ReactNode;
    label: string;
    href: string;
    active?: boolean;
    onClick: (href: string) => void;
}) {
    return (
        <div
            className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors duration-150 ${active
                ? "bg-gray-800 text-white"
                : "hover:bg-gray-700 text-gray-300 hover:text-white"
                }`}
            onClick={() => onClick(href)}
        >
            <span className={`transition-colors ${active ? 'text-white' : 'text-gray-400'}`}>
                {icon}
            </span>
            <span className="font-medium">{label}</span>
        </div>
    );
}