import { notFound } from 'next/navigation';
import EditGroupPage from './groupEditPage';
import isAuthenticated from '@/lib/authUtils';
import { getClientGroupById } from '@/app/api/protected/client/group/service';
import { getAllClientsFiltered } from '@/app/api/protected/client/service';

interface Client {
    id: string;
    name: string;
    phone?: string;
    isActive: boolean;
    createdAt: string;
}

interface ClientGroup {
    id: string;
    name: string;
    description?: string;
    memberIds: string[];
    memberCount: number;
    activeMemberCount: number;
    inactiveMemberCount: number;
    members: Client[];
}

interface PageProps {
    params: Promise<{ groupId: string }>;
}

// Server-side function to fetch group by ID
async function getGroupData(groupId: string): Promise<ClientGroup> {
    try {
        const verified = await isAuthenticated();

        if (!verified.status) {
            throw new Error('Authentication failed');
        }

        // Get the specific group by ID
        const result = await getClientGroupById(groupId);

        if (!result.success) {
            throw new Error('Group not found');
        }

        // Transform the data to match your ClientGroup interface
        return {
            id: result.group.id,
            name: result.group.name,
            description: result.group.description || undefined,
            memberIds: result.group.memberIds,
            memberCount: result.group.memberCount,
            activeMemberCount: result.group.activeMemberCount,
            inactiveMemberCount: result.group.inactiveMemberCount,
            members: result.group.members.map(member => ({
                id: member.id,
                name: member.name,
                phone: member.phone || undefined,
                isActive: member.isActive,
                createdAt: member.createdAt.toISOString().split('T')[0],
            })),
        };

    } catch (error) {
        console.error('Error fetching group data:', error);
        throw error;
    }
}

// Server-side function to fetch all clients
async function getAllClients(): Promise<Client[]> {
    try {
        const verified = await isAuthenticated();

        if (!verified.status) {
            throw new Error('Authentication failed');
        }

        // Get all clients (both active and inactive for editing purposes)
        const result = await getAllClientsFiltered({
            includeInactive: true, // Include all clients for editing
        });

        if (!result.success) {
            throw new Error('Failed to fetch clients');
        }

        // Transform the data to match your Client interface
        return result.clients.map(client => ({
            id: client.id,
            name: client.name,
            phone: client.phone || undefined,
            isActive: client.isActive,
            createdAt: client.createdAt.toISOString().split('T')[0],
        }));

    } catch (error) {
        console.error('Error fetching clients:', error);
        return [];
    }
}

export default async function EditGroupPageWrapper({ params }: PageProps) {
    const { groupId } = await params;

    try {
        // Validate groupId parameter
        if (!groupId) {
            console.error('Group ID is required');
            notFound();
        }

        // Fetch group data and all clients in parallel
        const [group, allClients] = await Promise.all([
            getGroupData(groupId),
            getAllClients()
        ]);

        // Check if group was found
        if (!group) {
            console.error(`Group with ID ${groupId} not found`);
            notFound();
        }

        // Pass the data to the client component
        return <EditGroupPage group={group} allClients={allClients} />;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error in EditGroupPageWrapper:', error);

        // Handle specific error cases
        if (error.message === 'Group not found' ||
            error.message === 'Authentication failed') {
            notFound();
        }

        // For other errors, you might want to show an error page
        throw error;
    }
}

// Optional: Add metadata for the page
export async function generateMetadata({ params }: PageProps) {
    const { groupId } = await params;

    try {
        // You could fetch the group name for the title
        const verified = await isAuthenticated();
        if (verified.status) {
            const result = await getClientGroupById(groupId);
            if (result.success) {
                return {
                    title: `Edit ${result.group.name} - Iron Fit`,
                    description: `Edit client group: ${result.group.name}`,
                };
            }
        }
    } catch (error) {
        console.error('Error generating metadata:', error);
    }

    // Fallback metadata
    return {
        title: 'Edit Group - Iron Fit',
        description: 'Edit client group details and membership',
    };
}

// Optional: Generate static params if you know the group IDs ahead of time
// export async function generateStaticParams() {
//     // This would be useful if you want to pre-generate pages for known groups
//     // You could fetch all group IDs from your database
//     return [];
// }