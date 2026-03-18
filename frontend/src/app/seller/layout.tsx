import { SellerSidebar } from "@/components/layout/SellerSidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="seller">
      <div className="flex min-h-screen bg-muted/10 text-foreground">
        <SellerSidebar />
        <main className="main-content flex-1 pt-[56px] md:pt-0 min-w-0 relative">
          <div className="page-container py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

