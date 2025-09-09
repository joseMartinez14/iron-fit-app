import { notFound } from 'next/navigation';
import NewGroupPage from './addGroupPage';
import isAuthenticated from '@/lib/authUtils';
import { getAllClientsFiltered } from '@/app/api/protected/client/service';

interface Client {
    id: string;
    name: string;
    phone?: string;
    isActive: boolean;
    createdAt: string;
}

// Alternative implementation that fetches all clients but allows filtering in the UI
async function getAllClients(): Promise<Client[]> {
    try {
        const verified = await isAuthenticated();

        if (!verified.status) {
            throw new Error('Authentication failed');
        }

        // Get all clients (active and inactive)
        const result = await getAllClientsFiltered({
            includeInactive: true, // Get all clients
        });

        if (!result.success) {
            throw new Error('Failed to fetch clients');
        }

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


export default async function NewGroupPageWrapper() {
    try {
        // Fetch all clients on the server
        const allClients = await getAllClients();

        // You could also add additional data here if needed
        // const groups = await getAllGroups();

        return <NewGroupPage allClients={allClients} />;
    } catch (error) {
        console.error('Error in NewGroupPageWrapper:', error);
        notFound();
    }
}

// Optional: Add metadata for the page
export const metadata = {
    title: 'Create New Group - Iron Fit',
    description: 'Create a new client group and select members',
};