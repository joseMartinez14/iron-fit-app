import { notFound } from 'next/navigation';
import ClientForm from "../../components/addEditForm";
import { getClientById } from '@/app/api/protected/client/service';
import isAuthenticated from '@/lib/authUtils';

interface EditClientPageProps {
    params: Promise<{ clientId: string }>; // params is now a Promise
}

export default async function EditClientPage({ params }: EditClientPageProps) {
    try {
        // Await params before accessing its properties
        const { clientId } = await params;

        const result = await getClientById(clientId);

        const verified = await isAuthenticated()

        if (!result.success || !verified.status) {
            notFound();
        }

        const client = result.client;

        return (
            <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
                <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold tracking-tight">Editar cliente</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Actualiza la cuenta del cliente para gestionar asistencia y pagos.
                        </p>
                    </div>

                    <ClientForm
                        mode="edit"
                        id={clientId}
                        initial={{
                            name: client.name,
                            userName: client.userName,
                            phone: client.phone || '',
                            isActive: client.isActive,
                            password: '', // Don't pre-fill password for security
                        }}
                    />
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error loading client:', error);
        notFound();
    }
}
