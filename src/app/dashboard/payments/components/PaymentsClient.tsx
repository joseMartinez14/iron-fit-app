'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentsList from './PaymentsList';
import type { PaymentResponse, PaymentServiceStats } from '@/types/payment';

interface PaymentsClientProps {
    initialPayments: PaymentResponse[];
    initialStats?: PaymentServiceStats | null;
    initialMessage?: string;
}

export default function PaymentsClient({
    initialPayments,
    initialStats,
}: PaymentsClientProps) {
    const router = useRouter();
    const currentSearchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [payments, setPayments] = useState<PaymentResponse[]>(initialPayments);
    const [error, setError] = useState<string | null>(null);

    // Handler functions
    const handleRefresh = async () => {
        try {
            setError(null);
            startTransition(() => {
                // Refresh by navigating to the same page
                router.refresh();
            });
        } catch (err) {
            setError('Failed to refresh payments. Please try again.');
            console.error('Error refreshing payments:', err);
        }
    };

    const handleAddPayment = () => {
        router.push('/dashboard/payments/new');
    };

    const handleViewPayment = (paymentId: string) => {
        router.push(`/dashboard/payments/${paymentId}`);
    };

    const handleEditPayment = (paymentId: string) => {
        router.push(`/dashboard/payments/${paymentId}/edit`);
    };

    const handleMarkPaid = async (paymentId: string) => {
        try {
            setError(null);

            // Make API call to mark payment as paid
            const response = await fetch(`/api/protected/payments/${paymentId}/mark-paid`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to mark payment as paid');
            }

            // Update local state optimistically
            setPayments(prev => prev.map(payment =>
                payment.id === paymentId
                    ? { ...payment, status: 'paid' as const }
                    : payment
            ));

            // Show success message
            console.log(`Payment ${paymentId} marked as paid`);

            // Refresh data from server
            startTransition(() => {
                router.refresh();
            });

        } catch (error) {
            console.error('Error marking payment as paid:', error);
            setError(error instanceof Error ? error.message : 'Failed to mark payment as paid');
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!window.confirm('Are you sure you want to delete this payment?')) {
            return;
        }

        try {
            setError(null);

            // Make API call to delete payment
            const response = await fetch(`/api/protected/payments/${paymentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to delete payment');
            }

            // Update local state optimistically
            setPayments(prev => prev.filter(payment => payment.id !== paymentId));

            // Show success message
            console.log(`Payment ${paymentId} deleted`);

            // Refresh data from server
            startTransition(() => {
                router.refresh();
            });

        } catch (error) {
            console.error('Error deleting payment:', error);
            setError(error instanceof Error ? error.message : 'Failed to delete payment');
        }
    };

    const handleFilterChange = (filters: Record<string, string | null>) => {
        // Build new search params
        const newSearchParams = new URLSearchParams(currentSearchParams.toString());

        Object.entries(filters).forEach(([key, value]) => {
            if (value === null || value === '' || value === 'all') {
                newSearchParams.delete(key);
            } else {
                newSearchParams.set(key, value);
            }
        });

        // Navigate with new filters
        const newUrl = `/dashboard/payments${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;

        startTransition(() => {
            router.push(newUrl);
        });
    };

    return (
        <PaymentsList
            payments={payments}
            loading={isPending}
            error={error}
            onRefresh={handleRefresh}
            onAddPayment={handleAddPayment}
            onViewPayment={handleViewPayment}
            onEditPayment={handleEditPayment}
            onMarkPaid={handleMarkPaid}
            onDeletePayment={handleDeletePayment}
            onFilterChange={handleFilterChange}
            initialStats={initialStats}
            pageSize={10}
            enableActions={true}
            title="Client Payments"
            showAddButton={true}
        />
    );
}