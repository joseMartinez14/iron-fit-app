'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

type ClientOption = {
    id: string;
    name: string;
    phone?: string;
    isActive: boolean;
    lastPaymentDate: string | null;
    lastValidUntil: string | null;
};

export default function NewPaymentClient({ clients }: { clients: ClientOption[] }) {
    const router = useRouter();

    // Default dates
    const today = useMemo(() => new Date(), []);
    const defaultPaymentDate = useMemo(
        () => new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0],
        [today]
    );
    const defaultValidUntil = useMemo(() => {
        const d = new Date(defaultPaymentDate);
        d.setMonth(d.getMonth() + 1);
        return d.toISOString().split('T')[0];
    }, [defaultPaymentDate]);

    const [paymentForm, setPaymentForm] = useState({
        clientId: '',
        amount: '',
        status: 'paid' as 'paid' | 'pending' | 'failed',
        paymentDate: defaultPaymentDate,
        validUntil: defaultValidUntil,
    });

    const [clientSearch, setClientSearch] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // NEW

    // Filter clients based on search
    const filteredClients = useMemo(() => {
        const term = clientSearch.toLowerCase();
        return clients
            .filter(
                c =>
                    c.name.toLowerCase().includes(term) ||
                    (c.phone && c.phone.includes(clientSearch))
            )
            .slice(0, 10);
    }, [clientSearch, clients]);

    const selectedClient = clients.find(c => c.id === paymentForm.clientId);

    const handleClientSelect = (client: ClientOption) => {
        setPaymentForm({ ...paymentForm, clientId: client.id });
        setClientSearch(client.name);
        setShowClientDropdown(false);
    };

    const handleSave = async () => {
        if (isSaving || successMessage) return; // prevent double submit
        if (!paymentForm.clientId || !paymentForm.amount || !paymentForm.paymentDate || !paymentForm.validUntil) {
            alert('Please fill in all required fields');
            return;
        }

        const amount = parseFloat(paymentForm.amount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        // Validate date order
        const paymentDate = new Date(paymentForm.paymentDate);
        const validUntil = new Date(paymentForm.validUntil);
        if (validUntil <= paymentDate) {
            alert('Valid until date must be after payment date');
            return;
        }

        // Ensure ISO strings are sent from the front end
        // (normalize to start of day to avoid time drift)
        const paymentDateISO = new Date(`${paymentForm.paymentDate}T00:00:00`).toISOString();
        const validUntilISO = new Date(`${paymentForm.validUntil}T00:00:00`).toISOString();

        const payload = {
            // route.ts expects `clientID` (capital D) in the body
            clientID: paymentForm.clientId,
            amount,
            status: paymentForm.status,
            paymentDate: paymentDateISO,
            validUntil: validUntilISO,
        };

        try {
            setIsSaving(true);
            await axios.post('/api/protected/payments', payload).then(async res => {
                setIsSaving(false);
                const clientName =
                    res.data?.payment?.client?.name || selectedClient?.name || 'client';
                setSuccessMessage(`Payment saved successfully for ${clientName}. Redirecting…`);
                await new Promise((r) => setTimeout(r, 1200)); // short delay
                router.push('/dashboard/payments');
                console.log('Payment creation response:', res.data);
            }).catch(err => {
                setIsSaving(false);
                console.error('Error saving payment:', err);
                alert('There was a problem saving the payment. Please try again.');
            });

            // Show success message, then redirect

            return;
        } catch (err) {
            console.error('Error saving payment:', err);
            alert('There was a problem saving the payment. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        router.push('/dashboard/payments');
    };

    const formatCurrency = (amount: string) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
    };

    // Keep validUntil >= paymentDate when paymentDate changes
    const handlePaymentDateChange = (value: string) => {
        const newPaymentDate = new Date(value);
        const currentValidUntil = new Date(paymentForm.validUntil);
        let nextValidUntil = value;

        if (!(currentValidUntil > newPaymentDate)) {
            const d = new Date(newPaymentDate);
            d.setMonth(d.getMonth() + 1);
            nextValidUntil = d.toISOString().split('T')[0];
        }

        setPaymentForm({
            ...paymentForm,
            paymentDate: value,
            validUntil: nextValidUntil,
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Log New Payment</h1>
                    <p className="text-gray-500 text-sm">Record a payment for a client</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={
                            isSaving ||
                            !!successMessage || // UPDATED
                            !paymentForm.clientId ||
                            !paymentForm.amount ||
                            !paymentForm.paymentDate ||
                            !paymentForm.validUntil
                        }
                        aria-busy={isSaving}
                        aria-disabled={isSaving}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                    >
                        {(isSaving || successMessage) && (
                            <span className={`h-4 w-4 ${isSaving ? 'animate-spin rounded-full border-2 border-white border-t-transparent' : 'bg-green-400 rounded-full'}`} />
                        )}
                        {isSaving ? 'Saving…' : successMessage ? 'Saved!' : 'Save Payment'}
                    </button>
                </div>
            </div>

            {/* Payment Form */}
            <div className="relative bg-white p-6 rounded-lg shadow max-w-2xl">
                {/* Loading / Success overlay */}
                {(isSaving || successMessage) && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                            <span>Saving payment…</span>
                        </div>
                    </div>
                )}

                <h3 className="text-lg font-medium mb-6">Payment Details</h3>

                <div className="space-y-6" aria-busy={isSaving}>
                    {/* Client Selection */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Client *
                        </label>
                        <input
                            type="text"
                            placeholder="Search for a client..."
                            value={clientSearch}
                            onChange={(e) => {
                                setClientSearch(e.target.value);
                                setShowClientDropdown(true);
                                if (!e.target.value) {
                                    setPaymentForm({ ...paymentForm, clientId: '' });
                                }
                            }}
                            onFocus={() => setShowClientDropdown(true)}
                            disabled={isSaving} // NEW
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        />

                        {/* Client Dropdown */}
                        {showClientDropdown && filteredClients.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredClients.map((client) => (
                                    <div
                                        key={client.id}
                                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => handleClientSelect(client)}
                                    >
                                        <div className="font-medium">{client.name}</div>
                                        {client.phone && (
                                            <div className="text-sm text-gray-500">{client.phone}</div>
                                        )}
                                        <div className={`text-xs ${client.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                            {client.isActive ? 'Active' : 'Inactive'}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            Last payment: {client.lastPaymentDate ? new Date(client.lastPaymentDate).toLocaleDateString() : '—'}
                                            {' • '}Valid until: {client.lastValidUntil ? new Date(client.lastValidUntil).toLocaleDateString() : '—'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Client Display */}
                        {selectedClient && (
                            <div className="mt-2 p-3 bg-blue-50 rounded border">
                                <div className="font-medium text-blue-900">{selectedClient.name}</div>
                                {selectedClient.phone && (
                                    <div className="text-sm text-blue-700">{selectedClient.phone}</div>
                                )}
                                <div className="text-xs text-blue-700 mt-1">
                                    Last payment: {selectedClient.lastPaymentDate ? new Date(selectedClient.lastPaymentDate).toLocaleDateString() : '—'}
                                    {' • '}Valid until: {selectedClient.lastValidUntil ? new Date(selectedClient.lastValidUntil).toLocaleDateString() : '—'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                disabled={isSaving} // NEW
                                className="w-full border border-gray-300 rounded px-8 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                            />
                        </div>
                        {paymentForm.amount && (
                            <div className="mt-1 text-sm text-gray-600">
                                {formatCurrency(paymentForm.amount)}
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Status *
                        </label>
                        <select
                            value={paymentForm.status}
                            onChange={(e) =>
                                setPaymentForm({ ...paymentForm, status: e.target.value as typeof paymentForm.status })
                            }
                            disabled={isSaving} // NEW
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>

                    {/* Payment Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Date *
                        </label>
                        <input
                            type="date"
                            value={paymentForm.paymentDate}
                            onChange={(e) => handlePaymentDateChange(e.target.value)}
                            disabled={isSaving} // NEW
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        />
                    </div>

                    {/* Valid Until (Date Selector) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valid Until *
                        </label>
                        <input
                            type="date"
                            value={paymentForm.validUntil}
                            min={paymentForm.paymentDate} // cannot be earlier than payment date
                            onChange={(e) => setPaymentForm({ ...paymentForm, validUntil: e.target.value })}
                            disabled={isSaving} // NEW
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        />
                    </div>
                </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={
                        isSaving ||
                        !paymentForm.clientId ||
                        !paymentForm.amount ||
                        !paymentForm.paymentDate ||
                        !paymentForm.validUntil
                    }
                    aria-busy={isSaving}
                    aria-disabled={isSaving}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                >
                    {isSaving && (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    Save Payment
                </button>
            </div>
        </div>
    );
}