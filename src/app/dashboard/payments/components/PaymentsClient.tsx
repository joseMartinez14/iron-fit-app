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
            setError('No se pudo actualizar la lista de pagos. Intenta de nuevo.');
            console.error('Error actualizando pagos:', err);
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
                throw new Error(result.error || 'No se pudo marcar el pago como pagado');
            }

            // Update local state optimistically
            setPayments(prev => prev.map(payment =>
                payment.id === paymentId
                    ? { ...payment, status: 'paid' as const }
                    : payment
            ));

            // Show success message
            console.log(`Pago ${paymentId} marcado como pagado`);

            // Refresh data from server
            startTransition(() => {
                router.refresh();
            });

        } catch (error) {
            console.error('Error al marcar pago como pagado:', error);
            setError(error instanceof Error ? error.message : 'No se pudo marcar el pago como pagado');
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!window.confirm('¿Seguro que deseas eliminar este pago?')) {
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
                throw new Error(result.error || 'No se pudo eliminar el pago');
            }

            // Update local state optimistically
            setPayments(prev => prev.filter(payment => payment.id !== paymentId));

            // Show success message
            console.log(`Pago ${paymentId} eliminado`);

            // Refresh data from server
            startTransition(() => {
                router.refresh();
            });

        } catch (error) {
            console.error('Error eliminando pago:', error);
            setError(error instanceof Error ? error.message : 'No se pudo eliminar el pago');
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
            title="Pagos de clientes"
            showAddButton={true}
        />
    );
}
