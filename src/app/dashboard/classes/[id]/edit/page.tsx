import { notFound } from 'next/navigation';
import isAuthenticated from '@/lib/authUtils';
import { getClassSessionById } from '@/app/api/protected/classes/service';
import { getAllClientsFiltered } from '@/app/api/protected/client/service';
import { getAllClientGroups } from '@/app/api/protected/client/group/service';
import EditClassPage from './editClassPage';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

// Define types that match what the components expect
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

interface ClassData {
    id: string;
    title: string;
    description?: string;
    location?: string;
    capacity: number;
    date: string;
    startTime: string;
    endTime: string;
    isCancelled: boolean;
    instructor: {
        id: string;
        name: string;
    };
    attendanceLogs: Array<{
        id: string;
        client: Client;
        checkInTime: string;
    }>;
}

// Server-side function to fetch class data
async function getClassData(classId: string): Promise<ClassData> {
    try {
        const verified = await isAuthenticated();

        if (!verified.status) {
            throw new Error('Authentication failed');
        }

        const result = await getClassSessionById(classId);

        if (!result.success) {
            throw new Error('Class not found');
        }

        // Transform the service response to match ClassData interface
        const transformedClassData: ClassData = {
            id: result?.classSession?.id || '',
            title: result?.classSession?.title || '',
            description: result?.classSession?.description || '',
            location: result?.classSession?.location || '',
            capacity: result?.classSession?.capacity || 0,
            date: result?.classSession?.date || '',
            startTime: result?.classSession?.startTime || '',
            endTime: result?.classSession?.endTime || '',
            isCancelled: result?.classSession?.isCancelled || false,
            instructor: {
                id: result?.classSession?.instructor.id || '',
                name: result?.classSession?.instructor.name || 'Unassigned',
                // Note: email is excluded here as ClassData doesn't include it
            },
            attendanceLogs: result?.classSession?.attendanceLogs.map(log => ({
                id: log.id,
                client: {
                    id: log.client.id,
                    name: log.client.name,
                    phone: log.client.phone,
                    isActive: log.client.isActive,
                },
                checkInTime: log.checkInTime,
                // Note: checkedInBy is excluded here as ClassData doesn't include it
            })) || [],
        };

        return transformedClassData;

    } catch (error) {
        console.error('Error fetching class data:', error);
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

        const result = await getAllClientsFiltered({
            includeInactive: true, // Only active clients for classes
        });

        if (!result.success) {
            throw new Error('Failed to fetch clients');
        }

        return result.clients.map(client => ({
            id: client.id,
            name: client.name,
            phone: client.phone || undefined,
            isActive: client.isActive,
        }));

    } catch (error) {
        console.error('Error fetching clients:', error);
        return [];
    }
}

// Server-side function to fetch all client groups
async function getAllGroups(): Promise<ClientGroup[]> {
    try {
        const verified = await isAuthenticated();

        if (!verified.status) {
            throw new Error('Authentication failed');
        }

        const result = await getAllClientGroups();

        if (!result.success) {
            throw new Error('Failed to fetch client groups');
        }

        // Transform the data to match the expected interface
        return result.groups.map(group => ({
            id: group.id,
            name: group.name,
            description: group.description || undefined, // Convert null to undefined
            memberCount: group.memberCount,
            members: group.members.map(member => ({
                id: member.id,
                name: member.name,
                phone: member.phone || undefined, // Convert null to undefined
                isActive: member.isActive,
            })),
        }));

    } catch (error) {
        console.error('Error fetching client groups:', error);
        return [];
    }
}

export default async function EditClassPageWrapper({ params }: PageProps) {
    const { id: classId } = await params;

    try {
        if (!classId) {
            console.error('Class ID is required');
            notFound();
        }

        // Fetch all data in parallel
        const [classData, allClients, allGroups] = await Promise.all([
            getClassData(classId),
            getAllClients(),
            getAllGroups()
        ]);

        if (!classData) {
            console.error(`Class with ID ${classId} not found`);
            notFound();
        }

        return (
            <EditClassPage
                classData={classData}
                allClients={allClients}
                allGroups={allGroups}
            />
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error in EditClassPageWrapper:', error);

        if (error.message === 'Class not found' ||
            error.message === 'Authentication failed') {
            notFound();
        }

        throw error;
    }
}

export async function generateMetadata({ params }: PageProps) {
    try {
        const verified = await isAuthenticated();
        if (verified.status) {
            const { id } = await params;
            const result = await getClassSessionById(id);
            if (result.success) {
                return {
                    title: `Edit ${result?.classSession?.title} - Iron Fit`,
                    description: `Edit class: ${result?.classSession?.title}`,
                };
            }
        }
    } catch (error) {
        console.error('Error generating metadata:', error);
    }

    return {
        title: 'Edit Class - Iron Fit',
        description: 'Edit class details and manage attendees',
    };
}