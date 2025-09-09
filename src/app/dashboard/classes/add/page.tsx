'use client';

import { useState } from 'react';
import SingleClassForm from './components/SingleClassForm';
import RecurringClassForm from './components/RecurringClassForm';

type ClassType = 'single' | 'recurring';

export default function AddClassPage() {
    const [classType, setClassType] = useState<ClassType>('single');

    return (
        <div className="p-6 w-full mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Add New Class</h1>

            {/* Class Type Selection */}
            <div className="mb-6">
                <label className="block font-medium mb-2">Class Type</label>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setClassType('single')}
                        className={`px-4 py-2 rounded border ${classType === 'single'
                            ? 'bg-black text-white'
                            : 'bg-white text-black border-gray-300'
                            }`}
                    >
                        Single Class
                    </button>
                    <button
                        type="button"
                        onClick={() => setClassType('recurring')}
                        className={`px-4 py-2 rounded border ${classType === 'recurring'
                            ? 'bg-black text-white'
                            : 'bg-white text-black border-gray-300'
                            }`}
                    >
                        Recurring Class
                    </button>
                </div>
            </div>

            {/* Render appropriate form based on class type */}
            {classType === 'single' ? (
                <SingleClassForm key="single" />
            ) : (
                <RecurringClassForm key="recurring" />
            )}
        </div>
    );
}