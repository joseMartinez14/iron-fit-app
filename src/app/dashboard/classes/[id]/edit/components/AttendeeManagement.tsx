'use client';

import { useState } from 'react';

interface Client {
    id: string;
    name: string;
    phone?: string;
    isActive: boolean;
}

interface ClientGroup {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
    members: Client[];
}

interface AttendeeManagementProps {
    selectedAttendees: string[];
    onAttendeesChange: (attendeeIds: string[]) => void;
    allClients: Client[];
    allGroups: ClientGroup[];
    currentAttendees: Client[];
    classCapacity: number;
}

export default function AttendeeManagement({
    selectedAttendees,
    onAttendeesChange,
    allClients,
    allGroups,
    classCapacity
}: AttendeeManagementProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState<'individual' | 'groups'>('individual');

    // Filter clients based on search
    const filteredClients = allClients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.includes(searchTerm))
    );

    // Filter groups based on search
    const filteredGroups = allGroups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // FIXED: Handle individual client toggle
    const handleClientToggle = (clientId: string) => {
        if (selectedAttendees.includes(clientId)) {
            // Remove client from attendees
            const newAttendees = selectedAttendees.filter(id => id !== clientId);
            onAttendeesChange(newAttendees);
        } else {
            // Add client to attendees
            const newAttendees = [...selectedAttendees, clientId];
            onAttendeesChange(newAttendees);
        }
    };

    // FIXED: Handle group toggle
    const handleGroupToggle = (group: ClientGroup) => {
        const groupMemberIds = group.members.map(member => member.id);
        const allGroupMembersSelected = groupMemberIds.every(id => selectedAttendees.includes(id));

        if (allGroupMembersSelected) {
            // Remove all group members
            const newAttendees = selectedAttendees.filter(id => !groupMemberIds.includes(id));
            onAttendeesChange(newAttendees);
        } else {
            // Add all group members (but keep existing attendees)
            const newAttendees = [...new Set([...selectedAttendees, ...groupMemberIds])];
            onAttendeesChange(newAttendees);
        }
    };

    // FIXED: Handle select all - should add to existing, not replace
    const handleSelectAll = () => {
        if (selectedTab === 'individual') {
            const allClientIds = filteredClients.map(client => client.id);
            // Merge with existing attendees instead of replacing
            const newAttendees = [...new Set([...selectedAttendees, ...allClientIds])];
            onAttendeesChange(newAttendees);
        } else {
            const allGroupMemberIds = filteredGroups.flatMap(group =>
                group.members.map(member => member.id)
            );
            // Merge with existing attendees instead of replacing
            const newAttendees = [...new Set([...selectedAttendees, ...allGroupMemberIds])];
            onAttendeesChange(newAttendees);
        }
    };

    // Handle clear all
    const handleClearAll = () => {
        onAttendeesChange([]);
    };

    // ADDED: Helper function to check if all filtered items are selected
    const areAllFilteredItemsSelected = () => {
        if (selectedTab === 'individual') {
            const filteredClientIds = filteredClients.map(client => client.id);
            return filteredClientIds.length > 0 && filteredClientIds.every(id => selectedAttendees.includes(id));
        } else {
            const allGroupMemberIds = filteredGroups.flatMap(group =>
                group.members.map(member => member.id)
            );
            return allGroupMemberIds.length > 0 && allGroupMemberIds.every(id => selectedAttendees.includes(id));
        }
    };

    const isAtCapacity = selectedAttendees.length >= classCapacity;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Gestionar asistentes</h2>
                <div className="text-sm text-gray-600">
                    {selectedAttendees.length} / {classCapacity} seleccionados
                </div>
            </div>

            {/* Capacity Warning */}
            {isAtCapacity && (
                <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded text-sm">
                    La clase está al máximo de capacidad ({classCapacity} asistentes)
                </div>
            )}

            {/* Current Attendees Summary */}
            {selectedAttendees.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <h3 className="font-medium text-blue-900 text-sm mb-2">
                        Asistentes seleccionados ({selectedAttendees.length})
                    </h3>
                    <div className="flex flex-wrap gap-1">
                        {allClients
                            .filter(client => selectedAttendees.includes(client.id))
                            .slice(0, 5)
                            .map(attendee => (
                                <span
                                    key={attendee.id}
                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                                >
                                    {attendee.name}
                                </span>
                            ))}
                        {selectedAttendees.length > 5 && (
                            <span className="text-blue-600 text-xs">
                                +{selectedAttendees.length - 5} más
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Search */}
            <div>
                <input
                    type="text"
                    placeholder="Buscar clientes o grupos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b">
                <button
                    onClick={() => setSelectedTab('individual')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${selectedTab === 'individual'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Clientes individuales ({filteredClients.length})
                </button>
                <button
                    onClick={() => setSelectedTab('groups')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 ${selectedTab === 'groups'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Grupos de clientes ({filteredGroups.length})
                </button>
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-2">
                <button
                    onClick={handleSelectAll}
                    disabled={areAllFilteredItemsSelected()}
                    className={`text-sm px-3 py-1 rounded ${areAllFilteredItemsSelected()
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                >
                    {areAllFilteredItemsSelected() ? 'Todos seleccionados' : 'Seleccionar todo'}
                </button>
                <button
                    onClick={handleClearAll}
                    disabled={selectedAttendees.length === 0}
                    className={`text-sm px-3 py-1 rounded ${selectedAttendees.length === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                >
                    Limpiar todo
                </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded">
                {selectedTab === 'individual' ? (
                    /* Individual Clients */
                    <div className="divide-y divide-gray-200">
                        {filteredClients.length > 0 ? (
                            filteredClients.map(client => (
                                <div
                                    key={client.id}
                                    className="p-3 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => handleClientToggle(client.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedAttendees.includes(client.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation(); // Prevent double triggering
                                                    handleClientToggle(client.id);
                                                }}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div>
                                                <div className="font-medium text-sm">{client.name}</div>
                                                {client.phone && (
                                                    <div className="text-xs text-gray-500">{client.phone}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${client.isActive
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {client.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No clients found matching your search.
                            </div>
                        )}
                    </div>
                ) : (
                    /* Client Groups */
                    <div className="divide-y divide-gray-200">
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map(group => {
                                const groupMemberIds = group.members.map(member => member.id);
                                const allGroupMembersSelected = groupMemberIds.every(id => selectedAttendees.includes(id));
                                const someGroupMembersSelected = groupMemberIds.some(id => selectedAttendees.includes(id));

                                return (
                                    <div
                                        key={group.id}
                                        className="p-3 hover:bg-gray-50"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    checked={allGroupMembersSelected}
                                                    ref={(el) => {
                                                        if (el) el.indeterminate = someGroupMembersSelected && !allGroupMembersSelected;
                                                    }}
                                                    onChange={() => handleGroupToggle(group)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div>
                                                    <div className="font-medium text-sm">{group.name}</div>
                                                    {group.description && (
                                                        <div className="text-xs text-gray-500">{group.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {group.memberCount} miembros
                                            </div>
                                        </div>

                                        {/* Group Members */}
                                        <div className="ml-6 space-y-1">
                                            {group.members.map(member => (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center justify-between py-1"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedAttendees.includes(member.id)}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                handleClientToggle(member.id);
                                                            }}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 scale-75"
                                                        />
                                                        <span className="text-xs text-gray-700">{member.name}</span>
                                                    </div>
                                                    <span
                                                        className={`px-1 py-0.5 text-xs rounded-full ${member.isActive
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                            }`}
                                                    >
                                                        {member.isActive ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No se encontraron grupos de clientes que coincidan con tu búsqueda.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
