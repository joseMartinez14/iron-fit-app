'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface ClassSession {
    id: string;
    title: string;
    description?: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    capacity: number;
    isCancelled: boolean;
    instructor: {
        name: string;
    };
    _count?: {
        reservations: number;
    };
}

interface ClassListProps {
    classes: ClassSession[];
    loading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
    itemsPerPage?: number;
}

export function ClassList({
    classes,
    loading = false,
    error = null,
    onRefresh,
    itemsPerPage = 10
}: ClassListProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const router = useRouter();

    // Calculate pagination data
    const pagination = useMemo(() => {
        const total = classes.length;
        const totalPages = Math.ceil(total / itemsPerPage);
        const hasNext = currentPage < totalPages;
        const hasPrev = currentPage > 1;

        return {
            page: currentPage,
            limit: itemsPerPage,
            total,
            totalPages,
            hasNext,
            hasPrev,
        };
    }, [classes.length, itemsPerPage, currentPage]);

    // Get current page's classes
    const paginatedClasses = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return classes.slice(startIndex, endIndex);
    }, [classes, currentPage, itemsPerPage]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setCurrentPage(page);
        }
    };

    const handleEditClass = (classId: string) => {
        router.push(`/dashboard/classes/${classId}/edit`);
    };

    const handleDeleteClass = (classId: string) => {
        // TODO: Implement delete functionality
        console.log('Delete class:', classId);
        // You can add a confirmation modal here
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('es', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    // Reset to page 1 when classes change (e.g., after filtering or refresh)
    useMemo(() => {
        setCurrentPage(1);
    }, [classes]);

    if (loading && classes.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="animate-pulse">Cargando clases...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-red-600">{error}</div>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Reintentar
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-left bg-gray-50">
                        <tr>
                            <th className="px-4 py-3">Información de la clase</th>
                            <th className="px-4 py-3">Horario</th>
                            <th className="px-4 py-3">Instructor</th>
                            <th className="px-4 py-3">Capacidad</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedClasses.length > 0 ? (
                            paginatedClasses.map((classSession) => (
                                <tr key={classSession.id} className="border-t">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{classSession.title}</div>
                                        {classSession.description && (
                                            <div className="text-gray-500 text-xs">{classSession.description}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div>{formatDate(classSession.date)}</div>
                                        <div className="text-gray-500">
                                            {formatTime(classSession.startTime)} – {formatTime(classSession.endTime)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{classSession.instructor.name}</td>
                                    <td className="px-4 py-3">
                                        {classSession._count?.reservations || 0} / {classSession.capacity}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${classSession.isCancelled
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-green-100 text-green-700'
                                                }`}
                                        >
                                            {classSession.isCancelled ? 'Cancelada' : 'Activa'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 space-x-2">
                                        <button
                                            onClick={() => handleEditClass(classSession.id)}
                                            className="hover:bg-gray-100 p-1 rounded transition-colors duration-150"
                                            title="Editar clase"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClass(classSession.id)}
                                            className="hover:bg-gray-100 p-1 rounded transition-colors duration-150"
                                            title="Eliminar clase"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                    No se encontraron clases
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination - Only show if there are multiple pages */}
            {pagination.totalPages > 1 && (
                <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, pagination.total)} de {pagination.total} resultados
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Previous Button */}
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={!pagination.hasPrev}
                            className={`px-3 py-1 rounded border ${pagination.hasPrev
                                ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                }`}
                        >
                            Anterior
                        </button>

                        {/* Page Numbers */}
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNumber;
                            if (pagination.totalPages <= 5) {
                                pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                                pageNumber = i + 1;
                            } else if (currentPage >= pagination.totalPages - 2) {
                                pageNumber = pagination.totalPages - 4 + i;
                            } else {
                                pageNumber = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNumber}
                                    onClick={() => handlePageChange(pageNumber)}
                                    className={`px-3 py-1 rounded border ${pageNumber === currentPage
                                        ? 'bg-blue-500 text-white border-blue-500'
                                        : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                                        }`}
                                >
                                    {pageNumber}
                                </button>
                            );
                        })}

                        {/* Next Button */}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!pagination.hasNext}
                            className={`px-3 py-1 rounded border ${pagination.hasNext
                                ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                }`}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
