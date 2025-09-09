import { prisma } from '@/lib/prisma';
import NewPaymentClient from './NewPaymentClient';

export default async function NewPaymentPage() {
    // Fetch active clients with their most recent payment
    const clients = await prisma.client.findMany({
        include: {
            payments: {
                orderBy: { paymentDate: 'desc' },
                take: 1,
            },
        },
        orderBy: { name: 'asc' },
    });

    const clientOptions = clients.map(c => {
        const last = c.payments[0];
        return {
            id: c.id,
            name: c.name,
            phone: c.phone || undefined,
            isActive: c.isActive,
            lastPaymentDate: last ? last.paymentDate.toISOString().split('T')[0] : null,
            lastValidUntil: last ? last.validUntil.toISOString().split('T')[0] : null,
        };
    });

    return <NewPaymentClient clients={clientOptions} />;
}