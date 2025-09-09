export default function PaymentsLoading() {
    return (
        <div className="p-6 space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse"></div>
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg shadow">
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                ))}
            </div>

            {/* Filters Skeleton */}
            <div className="bg-white p-4 rounded-lg shadow space-y-4">
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i}>
                            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mb-1"></div>
                            <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <th key={i} className="px-4 py-3">
                                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 5 }).map((_, rowIndex) => (
                                <tr key={rowIndex} className="border-t">
                                    {Array.from({ length: 7 }).map((_, colIndex) => (
                                        <td key={colIndex} className="px-4 py-3">
                                            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}