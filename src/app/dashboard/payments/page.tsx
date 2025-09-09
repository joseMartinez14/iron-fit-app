import { Suspense } from 'react';
import { getLastPaymentPerClient } from '@/app/api/protected/payments/service';
import PaymentsClient from './components/PaymentsClient';
import PaymentsLoading from './components/PaymentsLoading';

async function getPaymentsData() {
    try {
        // Fetch all payments without search params/filters
        const result = await getLastPaymentPerClient();

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch payments');
        }

        return {
            payments: result.payments || [],
            stats: result.stats,
            message: result.message,
        };
    } catch (error) {
        console.error('Error fetching payments:', error);
        throw error;
    }
}

export default async function PaymentsPage() {
    try {
        // Fetch payments data on the server
        const { payments, stats, message } = await getPaymentsData();

        return (
            <div className="py-6 px-3 space-y-6">
                <Suspense fallback={<PaymentsLoading />}>
                    <PaymentsClient
                        initialPayments={payments}
                        initialStats={stats}
                        initialMessage={message}
                    />
                </Suspense>
            </div>
        );
    } catch (error) {
        console.error('Error in PaymentsPage:', error);

        // Return error state
        return (
            <div className="py-6 px-3 space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="text-red-600 font-medium mb-2">Error Loading Payments</div>
                    <div className="text-red-500 text-sm">
                        {error instanceof Error ? error.message : 'An unexpected error occurred'}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }
}