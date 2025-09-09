import { notFound } from 'next/navigation';
import isAuthenticated from '@/lib/authUtils';
import { getAllClientsFiltered } from '@/app/api/protected/client/service';
import { getAllClientGroups } from '@/app/api/protected/client/group/service'; // Now import the function
import ClientsPage from './clientsPage';

interface Client {
    id: string;
    name: string;
    phone?: string;
    isActive: boolean;
    createdAt: string;
    groups: ClientGroup[];
}

interface ClientGroup {
    id: string;
    name: string;
    description?: string;
    memberCount?: number;
}

// Server-side function to fetch all clients with their groups
async function getAllClientsWithGroups(): Promise<Client[]> {
    try {
        const verified = await isAuthenticated();

        if (!verified.status) {
            throw new Error('Authentication failed');
        }

        // Get all clients (both active and inactive)
        const result = await getAllClientsFiltered({
            includeInactive: true,
        });

        if (!result.success) {
            throw new Error('Failed to fetch clients');
        }

        // Get all groups to map client memberships
        const groupsResult = await getAllClientGroups();
        const allGroups = groupsResult.success ? groupsResult.groups : [];

        // Transform the data to match your Client interface
        return result.clients.map(client => {
            // Find groups this client belongs to
            const clientGroups = allGroups.filter(group =>
                group.members.some((member: { id: string; }) => member.id === client.id)
            ).map(group => ({
                id: group.id,
                name: group.name,
                description: group.description || undefined,
                memberCount: group.memberCount,
            }));

            return {
                id: client.id,
                name: client.name,
                phone: client.phone || undefined,
                isActive: client.isActive,
                createdAt: client.createdAt.toISOString().split('T')[0],
                groups: clientGroups,
            };
        });

    } catch (error) {
        console.error('Error fetching clients:', error);
        return [];
    }
}

// Server-side function to fetch all client groups
async function getAllClientGroupsForPage(): Promise<ClientGroup[]> {
    try {
        const verified = await isAuthenticated();

        if (!verified.status) {
            throw new Error('Authentication failed');
        }

        // Get all client groups
        const result = await getAllClientGroups();

        if (!result.success) {
            throw new Error('Failed to fetch client groups');
        }

        // Transform the data to match your ClientGroup interface
        return result.groups.map(group => ({
            id: group.id,
            name: group.name,
            description: group.description || undefined,
            memberCount: group.memberCount,
        }));

    } catch (error) {
        console.error('Error fetching client groups:', error);
        return [];
    }
}

export default async function ClientsPageWrapper() {
    try {
        // Fetch clients and groups in parallel
        const [allClients, allClientGroups] = await Promise.all([
            getAllClientsWithGroups(),
            getAllClientGroupsForPage()
        ]);

        return <ClientsPage allClients={allClients} allClientGroups={allClientGroups} />;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error in ClientsPageWrapper:', error);

        if (error.message === 'Authentication failed') {
            notFound();
        }

        throw error;
    }
}
