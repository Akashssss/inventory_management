"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children, requiredRole }: { children: React.ReactNode; requiredRole: "admin" | "seller" | "any" }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userRaw = localStorage.getItem("currentUser");

    if (!token || !userRaw) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      // Role check
      if (requiredRole !== "any" && user.role !== requiredRole) {
        // Redirect to their appropriate dashboard
        if (user.role === "admin") router.replace("/admin");
        else router.replace("/seller/billing");
        return;
      }
    } catch {
      router.replace("/login");
      return;
    }

    setChecking(false);
  }, [router, requiredRole]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
