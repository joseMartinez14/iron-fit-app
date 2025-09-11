// app/loading.tsx
import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-gray-600 text-lg font-medium">Cargando...</p>
            </div>
        </div>
    );
}
