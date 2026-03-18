"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, Tags, Settings, Users, Home, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/users", label: "Users & Sellers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const confirmLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 topbar-h bg-background border-b z-40 flex items-center justify-between px-4 safe-padding">
        <div className="flex items-center gap-2 font-bold text-[var(--brand)]">
          <Package className="w-5 h-5" /> Admin
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className={`
        fixed lg:sticky top-0 left-0 h-[100dvh] w-[280px] lg:w-64 border-r bg-background/95 backdrop-blur-md z-50 flex flex-col
        sidebar-transition ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--brand)]">
              <Package className="w-6 h-6" /> Confectionary
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Admin Portal</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <nav className="p-4 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? "bg-[var(--brand)] text-[var(--brand-foreground)] shadow-sm"
                      : "hover:bg-[var(--brand-muted)] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t bg-muted/10">
          <button
            onClick={() => setLogoutConfirmOpen(true)}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </div>

      <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of the admin portal?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setLogoutConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmLogout}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
