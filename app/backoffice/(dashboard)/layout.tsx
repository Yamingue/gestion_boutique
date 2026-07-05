import AppLayout from "@/components/AppLayout";
import Sidebar   from "@/components/Sidebar";
import Topbar    from "@/components/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout
      sidebar={<Sidebar />}
      topbar={<Topbar />}
    >
      {children}
    </AppLayout>
  );
}
