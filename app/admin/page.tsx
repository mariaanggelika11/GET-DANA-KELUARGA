import AdminDashboard from "./dashboard";
import "./admin.css";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminDashboard />;
}
