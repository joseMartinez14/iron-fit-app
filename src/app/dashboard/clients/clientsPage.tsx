'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ClientGroup {
    id: string;
    name: string;
    description?: string;
    memberCount?: number;
}

interface Client {
    id: string;
    name: string;
    phone?: string;
    isActive: boolean;
    createdAt: string;
    groups: ClientGroup[];
}

interface ClientsPageProps {
    allClients: Client[];
    allClientGroups: ClientGroup[];
}

export default function ClientsPage({ allClients, allClientGroups }: ClientsPageProps) {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const pageSize = 10;

    // Filter clients based on search term, group, and status
    const filteredClients = allClients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.phone && client.phone.includes(searchTerm));

        const matchesGroup = selectedGroup === 'all' ||
            client.groups.some(group => group.id === selectedGroup);

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && client.isActive) ||
            (statusFilter === 'inactive' && !client.isActive);

        return matchesSearch && matchesGroup && matchesStatus;
    });

    const totalPages = Math.ceil(filteredClients.length / pageSize);
    const start = (page - 1) * pageSize;
    const clients = filteredClients.slice(start, start + pageSize);

    const nextPage = () => page < totalPages && setPage(page + 1);
    const prevPage = () => page > 1 && setPage(page - 1);

    // Reset page when filters change
    const handleFilterChange = (filterType: string, value: string) => {
        setPage(1);
        if (filterType === 'search') setSearchTerm(value);
        if (filterType === 'group') setSelectedGroup(value);
        if (filterType === 'status') setStatusFilter(value as typeof statusFilter);
    };


    // Navigation functions
    const openAddGroupModal = () => {
        router.push('/dashboard/clients/groups/new');
    };

    const openEditGroupModal = (group: ClientGroup) => {
        router.push(`/dashboard/clients/groups/${group.id}/edit`);
    };

    const handleDeleteGroup = async (groupId: string) => {
        const confirmed = confirm('Are you sure you want to delete this group? This action cannot be undone.');
        if (!confirmed) return;

        try {
            // TODO: Implement delete group API call
            console.log('Deleting group:', groupId);
            alert('Group deletion functionality will be implemented');
        } catch (error) {
            console.error('Error deleting group:', error);
            alert('Failed to delete group');
        }
    };

    const handleClientAction = (action: string, clientId: string) => {
        switch (action) {
            case 'view':
                router.push(`/dashboard/clients/${clientId}`);
                break;
            case 'edit':
                router.push(`/dashboard/clients/${clientId}/edit`);
                break;
            case 'groups':
                router.push(`/dashboard/clients/${clientId}/groups`);
                break;
            case 'remove':
                const confirmed = confirm('Are you sure you want to remove this client?');
                if (confirmed) {
                    console.log('Removing client:', clientId);
                    alert('Client removal functionality will be implemented');
                }
                break;
            default:
                console.log('Unknown action:', action);
        }
    };

    return (
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold">Clients</h1>
                    <p className="text-gray-500 text-sm">
                        {filteredClients.length} of {allClients.length} clients
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={() => router.push('/dashboard/clients/add')}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm sm:text-base whitespace-nowrap"
                    >
                        Add Client
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div className="ml-2 sm:ml-4">
                            <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
                            <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{allClients.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-2 sm:ml-4">
                            <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
                            <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                                {allClients.filter(client => client.isActive).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="ml-2 sm:ml-4">
                            <p className="text-xs sm:text-sm font-medium text-gray-600">Inactive</p>
                            <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                                {allClients.filter(client => !client.isActive).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="ml-2 sm:ml-4">
                            <p className="text-xs sm:text-sm font-medium text-gray-600">Groups</p>
                            <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{allClientGroups.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow space-y-4">
                <h3 className="font-medium text-sm sm:text-base">Filters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Group Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Group
                        </label>
                        <select
                            value={selectedGroup}
                            onChange={(e) => handleFilterChange('group', e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">All Groups</option>
                            {allClientGroups.map(group => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                    {group.memberCount !== undefined && ` (${group.memberCount})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                    </div>
                </div>

                {/* Clear Filters */}
                {(searchTerm || selectedGroup !== 'all' || statusFilter !== 'all') && (
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedGroup('all');
                                setStatusFilter('all');
                                setPage(1);
                            }}
                            className="text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            {/* Client Groups Summary */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-3">
                    <h3 className="font-medium text-sm sm:text-base">Client Groups</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={openAddGroupModal}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 whitespace-nowrap"
                        >
                            Add Group
                        </button>
                    </div>
                </div>
                {allClientGroups.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {allClientGroups.map(group => {
                            const clientCount = allClients.filter(client =>
                                client.groups.some(g => g.id === group.id)
                            ).length;

                            return (
                                <div
                                    key={group.id}
                                    className={`group relative px-2 sm:px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${selectedGroup === group.id
                                        ? 'bg-blue-500 text-white'
                                        : "bg-purple-100 text-purple-700"
                                        }`}
                                    onClick={() => handleFilterChange('group', group.id)}
                                    title={group.description}
                                >
                                    <span className="text-xs sm:text-sm">
                                        {group.name} ({clientCount})
                                    </span>

                                    {/* Edit/Delete buttons (shown on hover) - Hidden on mobile */}
                                    <div className="absolute -top-2 -right-2 hidden sm:group-hover:flex bg-white shadow-lg rounded border">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditGroupModal(group);
                                            }}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-l text-xs"
                                            title="Edit group"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteGroup(group.id);
                                            }}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded-r text-xs"
                                            title="Delete group"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No client groups found.</p>
                        <button
                            onClick={openAddGroupModal}
                            className="mt-2 text-green-600 hover:text-green-800 text-sm underline"
                        >
                            Create your first group
                        </button>
                    </div>
                )}
            </div>

            {/* Clients Content */}
            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-3 lg:px-4 py-3 font-medium">Name</th>
                                <th className="px-3 lg:px-4 py-3 font-medium">Phone</th>
                                <th className="px-3 lg:px-4 py-3 font-medium">Status</th>
                                <th className="px-3 lg:px-4 py-3 font-medium">Groups</th>
                                <th className="px-3 lg:px-4 py-3 font-medium hidden lg:table-cell">Join Date</th>
                                <th className="px-3 lg:px-4 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.length > 0 ? (
                                clients.map((client) => (
                                    <tr key={client.id} className="border-t hover:bg-gray-50">
                                        <td className="px-3 lg:px-4 py-3">
                                            <div className="font-medium text-sm lg:text-base">{client.name}</div>
                                            <div className="text-xs text-gray-500 lg:hidden">ID: {client.id}</div>
                                        </td>
                                        <td className="px-3 lg:px-4 py-3 text-gray-600 text-sm">
                                            {client.phone || '-'}
                                        </td>
                                        <td className="px-3 lg:px-4 py-3">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full font-medium ${client.isActive
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {client.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-3 lg:px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {client.groups.length > 0 ? (
                                                    client.groups.slice(0, 2).map((group) => (
                                                        <span
                                                            key={group.id}
                                                            className={`px-2 py-1 text-xs rounded-full font-medium bg-purple-100 text-purple-700`}
                                                            title={group.description}
                                                        >
                                                            {group.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">No groups</span>
                                                )}
                                                {client.groups.length > 2 && (
                                                    <span className="text-xs text-gray-500">
                                                        +{client.groups.length - 2} more
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 lg:px-4 py-3 text-gray-600 text-sm hidden lg:table-cell">
                                            {new Date(client.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 lg:px-4 py-3">
                                            <div className="flex space-x-1 lg:space-x-2">
                                                <button
                                                    onClick={() => handleClientAction('edit', client.id)}
                                                    className="text-gray-600 text-xs hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleClientAction('remove', client.id)}
                                                    className="text-red-600 text-xs hover:underline hidden lg:inline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                                        {searchTerm || selectedGroup !== 'all' || statusFilter !== 'all'
                                            ? 'No clients found matching your filters'
                                            : 'No clients found. Get started by adding your first client.'
                                        }
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards View */}
            <div className="sm:hidden space-y-3">
                {clients.length > 0 ? (
                    clients.map((client) => (
                        <div key={client.id} className="bg-white rounded-lg shadow p-4 border">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-medium text-base">{client.name}</h3>
                                    <p className="text-xs text-gray-500">ID: {client.id}</p>
                                    {client.phone && (
                                        <p className="text-sm text-gray-600 mt-1">{client.phone}</p>
                                    )}
                                </div>
                                <span
                                    className={`px-2 py-1 text-xs rounded-full font-medium ${client.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}
                                >
                                    {client.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {/* Groups */}
                            <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-1">Groups:</p>
                                <div className="flex flex-wrap gap-1">
                                    {client.groups.length > 0 ? (
                                        client.groups.map((group) => (
                                            <span
                                                key={group.id}
                                                className={`px-2 py-1 text-xs rounded-full font-medium bg-purple-100 text-purple-700`}
                                                title={group.description}
                                            >
                                                {group.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">No groups</span>
                                    )}
                                </div>
                            </div>

                            {/* Join Date */}
                            <div className="mb-3">
                                <p className="text-xs text-gray-500">
                                    Joined: {new Date(client.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-2 pt-2 border-t">
                                <button
                                    onClick={() => handleClientAction('view', client.id)}
                                    className="flex-1 text-blue-600 text-sm py-2 px-3 rounded border border-blue-200 hover:bg-blue-50"
                                >
                                    View
                                </button>
                                <button
                                    onClick={() => handleClientAction('edit', client.id)}
                                    className="flex-1 text-gray-600 text-sm py-2 px-3 rounded border border-gray-200 hover:bg-gray-50"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleClientAction('groups', client.id)}
                                    className="flex-1 text-green-600 text-sm py-2 px-3 rounded border border-green-200 hover:bg-green-50"
                                >
                                    Groups
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                        <p className="text-sm">
                            {searchTerm || selectedGroup !== 'all' || statusFilter !== 'all'
                                ? 'No clients found matching your filters'
                                : 'No clients found. Get started by adding your first client.'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white rounded-lg shadow">
                    <div className="border-t bg-gray-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="text-sm text-gray-700 text-center sm:text-left">
                            Showing {start + 1} to {Math.min(start + pageSize, filteredClients.length)} of {filteredClients.length} results
                        </div>
                        <div className="flex justify-center sm:justify-end space-x-2">
                            <button
                                onClick={prevPage}
                                disabled={page === 1}
                                className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-sm">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={nextPage}
                                disabled={page === totalPages}
                                className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}