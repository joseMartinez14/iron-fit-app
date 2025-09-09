'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Client {
    id: string;
    name: string;
    phone?: string;
    isActive: boolean;
    createdAt: string;
}

interface NewGroupPageProps {
    allClients: Client[];
}

export default function NewGroupPage({ allClients }: NewGroupPageProps) {
    const router = useRouter();
    const [groupForm, setGroupForm] = useState({
        name: '',
        description: '',
    });
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter clients
    const filteredClients = allClients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.phone && client.phone.includes(searchTerm));

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && client.isActive) ||
            (statusFilter === 'inactive' && !client.isActive);

        return matchesSearch && matchesStatus;
    });

    const handleClientToggle = (clientId: string) => {
        setSelectedClients(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    const handleSelectAll = () => {
        const visibleClientIds = filteredClients.map(client => client.id);
        const allSelected = visibleClientIds.every(id => selectedClients.includes(id));

        if (allSelected) {
            // Deselect all visible clients
            setSelectedClients(prev => prev.filter(id => !visibleClientIds.includes(id)));
        } else {
            // Select all visible clients
            setSelectedClients(prev => [...new Set([...prev, ...visibleClientIds])]);
        }
    };

    const handleSave = async () => {
        // Basic validation
        if (!groupForm.name.trim()) {
            alert('Please enter a group name');
            return;
        }

        if (selectedClients.length === 0) {
            alert('Please select at least one client for the group');
            return;
        }

        try {
            setIsSubmitting(true);

            // Prepare the data to send
            const groupData = {
                name: groupForm.name.trim(),
                description: groupForm.description.trim() || undefined,
                clientIds: selectedClients,
            };

            console.log('Sending group data:', groupData);

            // Send request to the backend
            const response = await axios.post('/api/protected/client/group', groupData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.data?.success) {
                console.log('Group created successfully:', response.data.group);

                // Show success message
                alert(`✅ Group "${response.data.group.name}" created successfully with ${response.data.group.memberCount} members!`);

                // Navigate back to clients page or groups page
                router.push('/dashboard/clients'); // or wherever you want to redirect
            } else {
                throw new Error(response.data?.error || 'Failed to create group');
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Error creating group:', error);

            let errorMessage = 'Failed to create group. Please try again.';

            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(`❌ ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/dashboard/clients');
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Create New Group</h1>
                    <p className="text-gray-500 text-sm">
                        Add a new client group and select members
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!groupForm.name.trim() || selectedClients.length === 0 || isSubmitting}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting && (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isSubmitting ? 'Creating...' : 'Create Group'}
                    </button>
                </div>
            </div>

            {/* Group Details Form */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Group Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Group Name *
                        </label>
                        <input
                            type="text"
                            value={groupForm.name}
                            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                            disabled={isSubmitting}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                            placeholder="Enter group name"
                            maxLength={50}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {groupForm.name.length}/50 characters
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={groupForm.description}
                            onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                            disabled={isSubmitting}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                            placeholder="Enter group description"
                            rows={3}
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {groupForm.description.length}/500 characters
                        </p>
                    </div>
                </div>
            </div>

            {/* Client Selection */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Select Clients</h3>
                    <div className="text-sm text-gray-500">
                        {selectedClients.length} of {allClients.length} clients selected
                    </div>
                </div>

                {/* Client Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search Clients
                        </label>
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleSelectAll}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                        >
                            {filteredClients.every(client => selectedClients.includes(client.id))
                                ? 'Deselect All'
                                : 'Select All'
                            }
                        </button>
                    </div>
                </div>

                {/* Client List */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={filteredClients.length > 0 && filteredClients.every(client => selectedClients.includes(client.id))}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">Name</th>
                                    <th className="px-4 py-3 text-left font-medium">Phone</th>
                                    <th className="px-4 py-3 text-left font-medium">Status</th>
                                    <th className="px-4 py-3 text-left font-medium">Join Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map((client) => (
                                    <tr
                                        key={client.id}
                                        className="border-t hover:bg-gray-50 cursor-pointer"
                                    //onClick={() => handleClientToggle(client.id)}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedClients.includes(client.id)}
                                                onChange={() => handleClientToggle(client.id)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium">{client.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{client.phone || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full font-medium ${client.isActive
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {client.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {new Date(client.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {filteredClients.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No clients found matching your filters
                    </div>
                )}
            </div>

            {/* Selected Clients Summary */}
            {selectedClients.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                        Selected Clients ({selectedClients.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {selectedClients.map(clientId => {
                            const client = allClients.find(c => c.id === clientId);
                            return client ? (
                                <span
                                    key={clientId}
                                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                >
                                    {client.name}
                                    <button
                                        onClick={() => handleClientToggle(clientId)}
                                        className="ml-2 text-blue-600 hover:text-blue-800"
                                    >
                                        ×
                                    </button>
                                </span>
                            ) : null;
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}