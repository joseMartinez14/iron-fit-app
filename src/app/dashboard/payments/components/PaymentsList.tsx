'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PaymentServiceStats } from '@/types/payment';

interface Client {
    id: string;
    name: string;
    phone?: string;
    isActive: boolean;
}

interface Payment {
    id: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    paymentDate: string;
    validUntil: string;
    client: Client;
}

interface PaymentsListProps {
    payments: Payment[];
    loading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
    onAddPayment?: () => void;
    onViewPayment?: (paymentId: string) => void;
    onEditPayment?: (paymentId: string) => void;
    onMarkPaid?: (paymentId: string) => void;
    onDeletePayment?: (paymentId: string) => void;
    pageSize?: number;
    enableActions?: boolean;
    title?: string;
    showAddButton?: boolean;
    onFilterChange?: (filters: Record<string, string | null>) => void;
    initialStats?: PaymentServiceStats | null;
}

export default function PaymentsList({
    payments,
    loading = false,
    error = null,
    onRefresh,
    onAddPayment,
    onViewPayment,
    onEditPayment,
    onMarkPaid,
    onDeletePayment,
    pageSize = 10,
    enableActions = true,
    title = 'Pagos',
    showAddButton = true,
    onFilterChange,
    initialStats,
}: PaymentsListProps) {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
    const [dateFilter, setDateFilter] = useState('');
    const [includeInactiveClients, setIncludeInactiveClients] = useState(false);

    // Filter payments
    const filteredPayments = payments.filter(payment => {
        const matchesSearch = payment.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (payment.client.phone && payment.client.phone.includes(searchTerm)) ||
            payment.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

        const matchesDate = !dateFilter || payment.paymentDate === dateFilter;

        const matchesActiveStatus = includeInactiveClients || payment.client.isActive;

        return matchesSearch && matchesStatus && matchesDate && matchesActiveStatus;
    });

    const totalPages = Math.ceil(filteredPayments.length / pageSize);
    const start = (page - 1) * pageSize;
    const paymentsToShow = filteredPayments.slice(start, start + pageSize);

    const nextPage = () => page < totalPages && setPage(page + 1);
    const prevPage = () => page > 1 && setPage(page - 1);

    // Reset page when filters change
    const handleFilterChange = (filterType: string, value: string) => {
        setPage(1);

        if (onFilterChange) {
            // Server-side filtering
            const filters = {
                includeInactiveClients: includeInactiveClients ? 'true' : null,
                statusFilter: statusFilter === 'all' ? null : statusFilter,
                validUntilAfter: dateFilter || null,
                validUntilBefore: null, // Add support for end date if needed
            };

            if (filterType === 'status') {
                filters.statusFilter = value === 'all' ? null : (value as 'paid' | 'pending' | 'failed' | null);
            }
            if (filterType === 'date') {
                filters.validUntilAfter = value || null;
            }
            if (filterType === 'includeInactive') {
                filters.includeInactiveClients = value === 'true' ? 'true' : null;
            }

            onFilterChange(filters);
        } else {
            // Client-side filtering (fallback)
            if (filterType === 'search') setSearchTerm(value);
            if (filterType === 'status') setStatusFilter(value as typeof statusFilter);
            if (filterType === 'date') setDateFilter(value);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-700';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700';
            case 'failed':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case 'paid':
                return 'Pagado';
            case 'pending':
                return 'Pendiente';
            case 'failed':
                return 'Fallido';
            default:
                return status;
        }
    };

    // Use initialStats if provided
    const computedStats: PaymentServiceStats = {
        totalPayments: payments.length,
        paidPayments: payments.filter(p => p.status === 'paid').length,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        failedPayments: payments.filter(p => p.status === 'failed').length,
        totalAmount: payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0),
        expiredPayments: payments.filter(p => new Date(p.validUntil) < new Date()).length,
    };

    const stats = initialStats ?? computedStats;

    const handleAddPayment = () => {
        if (onAddPayment) {
            onAddPayment();
        } else {
            router.push('/dashboard/payments/new');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const isExpired = (validUntil: string) => {
        return new Date(validUntil) < new Date();
    };

    // Loading state
    if (loading && payments.length === 0) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{title}</h1>
                        <p className="text-gray-500 text-sm">Loading payments...</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="animate-pulse">Loading payments...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{title}</h1>
                        <p className="text-gray-500 text-sm">Error loading payments</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="text-red-600 mb-4">{error}</div>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Retry
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">{title}</h1>
                    <p className="text-gray-500 text-sm">
                        {filteredPayments.length} de {payments.length} pagos
                    </p>
                </div>
                <div className="flex gap-2">
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            disabled={loading}
                        >
                            {loading ? 'Actualizando...' : 'Actualizar'}
                        </button>
                    )}
                    {showAddButton && (
                        <button
                            onClick={handleAddPayment}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Registrar pago
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-gray-900">{stats.totalPayments}</div>
                    <div className="text-sm text-gray-500">Pagos totales</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-green-600">{stats.paidPayments}</div>
                    <div className="text-sm text-gray-500">Pagados</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</div>
                    <div className="text-sm text-gray-500">Pendientes</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-red-600">{stats.failedPayments}</div>
                    <div className="text-sm text-gray-500">Fallidos</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</div>
                    <div className="text-sm text-gray-500">Ingresos totales</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow space-y-4">
                <h3 className="font-medium">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Buscar
                        </label>
                        <input
                            type="text"
                            placeholder="Buscar por nombre del cliente, teléfono o ID de pago..."
                            value={searchTerm}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="paid">Pagados</option>
                            <option value="pending">Pendientes</option>
                            <option value="failed">Fallidos</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de pago
                        </label>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => handleFilterChange('date', e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Inactive Clients Filter */}
                <div className="flex items-center">
                    <input
                        id="includeInactive"
                        type="checkbox"
                        checked={includeInactiveClients}
                        onChange={(e) => {
                            setIncludeInactiveClients(e.target.checked);
                            handleFilterChange('includeInactive', e.target.checked ? 'true' : 'false');
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="includeInactive" className="ml-2 block text-sm text-gray-700">
                        Incluir clientes inactivos
                    </label>
                </div>

                {/* Clear Filters */}
                {(searchTerm || statusFilter !== 'all' || dateFilter) && (
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setDateFilter('');
                                setPage(1);
                            }}
                            className="text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                            Limpiar todos los filtros
                        </button>
                    </div>
                )}
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-4 py-3 font-medium">ID de pago</th>
                                <th className="px-4 py-3 font-medium">Cliente</th>
                                <th className="px-4 py-3 font-medium">Monto</th>
                                <th className="px-4 py-3 font-medium">Estado</th>
                                <th className="px-4 py-3 font-medium">Fecha de pago</th>
                                <th className="px-4 py-3 font-medium">Válido hasta</th>
                                {enableActions && (
                                    <th className="px-4 py-3 font-medium">Acciones</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {paymentsToShow.length > 0 ? (
                                paymentsToShow.map((payment) => (
                                    <tr key={payment.id} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-mono text-xs">{payment.id}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{payment.client.name}</div>
                                            {payment.client.phone && (
                                                <div className="text-gray-500 text-xs">{payment.client.phone}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{formatCurrency(payment.amount)}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadgeColor(payment.status)}`}
                                            >
                                                {statusLabel(payment.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {new Date(payment.paymentDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className={`text-sm ${isExpired(payment.validUntil) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                                {new Date(payment.validUntil).toLocaleDateString()}
                                                {isExpired(payment.validUntil) && (
                                                    <div className="text-xs">Vencido</div>
                                                )}
                                            </div>
                                        </td>
                                        {enableActions && (
                                            <td className="px-4 py-3">
                                                <div className="flex space-x-2">
                                                    {onViewPayment && (
                                                        <button
                                                            onClick={() => onViewPayment(payment.id)}
                                                            className="text-blue-600 text-xs hover:underline"
                                                        >
                                                            Ver
                                                        </button>
                                                    )}
                                                    {onEditPayment && (
                                                        <button
                                                            onClick={() => onEditPayment(payment.id)}
                                                            className="text-gray-600 text-xs hover:underline"
                                                        >
                                                            Editar
                                                        </button>
                                                    )}
                                                    {payment.status === 'pending' && onMarkPaid && (
                                                        <button
                                                            onClick={() => onMarkPaid(payment.id)}
                                                            className="text-green-600 text-xs hover:underline"
                                                        >
                                                            Marcar como pagado
                                                        </button>
                                                    )}
                                                    {onDeletePayment && (
                                                        <button
                                                            onClick={() => onDeletePayment(payment.id)}
                                                            className="text-red-600 text-xs hover:underline"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={enableActions ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                                        No se encontraron pagos que coincidan con tus filtros
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Mostrando {start + 1} a {Math.min(start + pageSize, filteredPayments.length)} de {filteredPayments.length} resultados
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={prevPage}
                                disabled={page === 1}
                                className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                                Anterior
                            </button>
                            <span className="px-3 py-1 text-sm">
                                Página {page} de {totalPages}
                            </span>
                            <button
                                onClick={nextPage}
                                disabled={page === totalPages}
                                className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
