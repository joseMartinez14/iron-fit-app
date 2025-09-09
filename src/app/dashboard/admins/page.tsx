import AdminsPage from "@/components/admins/AdminsPage";
import { getAllAdmins } from "@/app/api/protected/admins/services";
import isAuthenticated from "@/lib/authUtils";

async function queryAllAdmins() {

    const verified = await isAuthenticated();

    if (!verified.status) {
        throw new Error('Authentication failed');
    }

    return await getAllAdmins();
}

export default async function Page() {
    const admins = await queryAllAdmins();
    return <AdminsPage admins={admins} />;
} 
