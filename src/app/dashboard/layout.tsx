import * as React from 'react';
import DashboardSidebar from '@/components/shared/DashboardSidebar';


interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
    return (
        <>
            <div className="flex flex-row relative min-h-screen bg-gray-100">
                <DashboardSidebar />
                <div className="flex flex-1">
                    <main className="flex-1 pt-6">
                        <div className="">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </>

    );
}
