'use client'

import ClientForm from "../components/addEditForm"

// --------------------------------------
// This page remains the CREATE wrapper using the reusable form
// --------------------------------------
export default function NewClientPage() {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
            <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight">Add New Client</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Create a client account to manage attendance and payments.
                    </p>
                </div>

                <ClientForm mode="create" />
            </div>
        </div>
    )
}
