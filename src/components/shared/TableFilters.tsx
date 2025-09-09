'use client';

import { useRouter } from 'next/navigation';

export function Filters() {
    const router = useRouter();

    const handleAddNewClass = () => {
        router.push('/dashboard/classes/add');
    };

    return (
        <div className="flex flex-wrap gap-4">
            <div className="flex flex-wrap gap-4">
                {/* Add your filter components here */}
            </div>
            <button
                onClick={handleAddNewClass}
                className="ml-auto bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
            >
                + Add New Class
            </button>
        </div>
    );
}