import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="admin">
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminSidebar />
        <main className="main-content flex-1 pt-[56px] lg:pt-0 min-w-0">
          <div className="page-container py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

