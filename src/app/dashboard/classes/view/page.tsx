'use client';

const sampleClass = {
    name: "Power Yoga",
    description: "Dynamic flow yoga session",
    instructor: "Michael Chen",
    schedule: ["Tue", "Thu"],
    time: "09:30 AM - 10:30 AM",
    capacity: 20,
    attendees: [
        { id: 1, name: "Ana Torres", email: "ana@email.com", status: "Reserved" },
        { id: 2, name: "Luis Romero", email: "luis@email.com", status: "Attended" },
    ],
    status: "Full",
};

export default function ClassDetailPage() {
    return (
        <div className="p-6 w-full mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{sampleClass.name}</h1>
                    <p className="text-gray-500">{sampleClass.description}</p>
                </div>
                <div>
                    <span
                        className={`text-xs px-3 py-1 rounded ${sampleClass.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-300 text-gray-700'
                            }`}
                    >
                        {sampleClass.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                    <span className="font-medium">Instructor:</span> {sampleClass.instructor}
                </div>
                <div>
                    <span className="font-medium">Días:</span> {sampleClass.schedule.join(', ')}
                </div>
                <div>
                    <span className="font-medium">Hora:</span> {sampleClass.time}
                </div>
                <div>
                    <span className="font-medium">Capacidad:</span>{' '}
                    {sampleClass.attendees.length} / {sampleClass.capacity}
                </div>
            </div>

            <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Asistentes</h2>
                <div className="bg-white rounded shadow overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-4 py-2">Nombre</th>
                                <th className="px-4 py-2">Email</th>
                                <th className="px-4 py-2">Estado</th>
                                <th className="px-4 py-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sampleClass.attendees.map((attendee) => (
                                <tr key={attendee.id} className="border-t">
                                    <td className="px-4 py-2">{attendee.name}</td>
                                    <td className="px-4 py-2">{attendee.email}</td>
                                    <td className="px-4 py-2">
                                        <span
                                            className={`px-2 py-1 text-xs rounded ${attendee.status === 'Attended'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}
                                        >
                                            {attendee.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 space-x-2">
                                        <button className="text-blue-600 text-xs hover:underline">Marcar asistido</button>
                                        <button className="text-red-600 text-xs hover:underline">Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
