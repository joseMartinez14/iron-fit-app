import * as React from 'react';
import DashboardSidebar from '@/components/shared/DashboardSidebar';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs';
import { redirect } from 'next/navigation';


interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
    return (
        <ClerkProvider>
            <>
                <SignedIn>

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
                </SignedIn>
                <SignedOut>
                    {redirect('/')}
                </SignedOut>
            </>
        </ClerkProvider>

    );
}
