"use client";

import { Suspense, useState } from "react";
import { useQueryState } from "nuqs";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Search, Plus, Edit, Trash2, UserCog, ShieldAlert, Loader2, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

type User = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "seller";
  status?: string;
  isActive?: boolean;
};

type UserFormState = {
  name: string;
  email: string;
  role: "admin" | "seller";
  password: string;
};

const ITEMS_PER_PAGE = 10;

function UsersContent() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useQueryState("search", { defaultValue: "" });
  const [roleFilter, setRoleFilter] = useQueryState("role", { defaultValue: "" });
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>({ name: "", email: "", role: "seller", password: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const currentPage = parseInt(page) || 1;

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ["users", searchQuery, roleFilter, currentPage],
    queryFn: async () => {
      const filterConditions = [];
      if (roleFilter) {
        filterConditions.push({ field: "role", operator: "eq", value: roleFilter });
      }
      const payload = {
        filter: filterConditions.length > 0 ? { logic: "and", conditions: filterConditions } : undefined
      };
      const res = await api.post(`/users/search?search=${searchQuery}&page=${currentPage}&limit=${ITEMS_PER_PAGE}`, payload);
      return res.data;
    }
  });

  const users: User[] = usersResponse?.data || [];
  const pagination = usersResponse?.pagination;
  const totalPages = pagination?.total ? Math.ceil(pagination.total / ITEMS_PER_PAGE) : 1;

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: UserFormState & { id?: string }) => {
      if (data.id) {
        return api.put(`/users/${data.id}`, { name: data.name, role: data.role, ...(data.password && { password: data.password }) });
      } else {
        return api.post(`/users`, { name: data.name, email: data.email, role: data.role, password: data.password });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(editingUser ? "User updated successfully!" : "User created successfully!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || "Failed to save user");
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || "Failed to delete user");
    }
  });

  const resetForm = () => {
    setForm({ name: "", email: "", role: "seller", password: "" });
    setFormErrors({});
    setEditingUser(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, password: "" });
    setFormErrors({});
    setDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!editingUser && !form.email.trim()) errors.email = "Email is required";
    if (!editingUser && !form.email.includes("@")) errors.email = "Enter a valid email";
    if (!editingUser && !form.password) errors.password = "Password is required for new users";
    if (!editingUser && form.password.length < 6) errors.password = "Password must be at least 6 characters";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    saveMutation.mutate({ ...form, id: editingUser?._id });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-[var(--brand)]" /> User Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage administrators and POS sellers.</p>
        </div>
        <Button className="w-full sm:w-auto bg-[var(--brand)] text-[var(--brand-foreground)] hover:opacity-90 transition-opacity" onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8 bg-white h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <Button variant={roleFilter === "" ? "default" : "outline"} onClick={() => setRoleFilter("")} size="sm" className="h-9 shrink-0">All Roles</Button>
          <Button variant={roleFilter === "admin" ? "default" : "outline"} onClick={() => setRoleFilter("admin")} size="sm" className="h-9 shrink-0">
            <ShieldAlert className="w-3 h-3 mr-1" /> Admins
          </Button>
          <Button variant={roleFilter === "seller" ? "default" : "outline"} onClick={() => setRoleFilter("seller")} size="sm" className="h-9 shrink-0">
            <UserCog className="w-3 h-3 mr-1" /> Sellers
          </Button>
        </div>
      </div>

      <>
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No users found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                        <ShieldAlert className="w-3 h-3 mr-1" /> Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <UserCog className="w-3 h-3 mr-1" /> Seller
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={(user.isActive !== false && user.status !== "inactive") ? "default" : "secondary"}>
                      {(user.isActive !== false && user.status !== "inactive") ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800" onClick={() => openEditDialog(user)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-800" onClick={() => openDeleteDialog(user)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {currentPage} of {totalPages} ({pagination?.total || 0} users)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(String(currentPage - 1))}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(String(currentPage + 1))}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      </>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update user details. Leave password blank to keep unchanged." : "Fill in the details for the new user."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name *</Label>
              <Input
                id="user-name"
                placeholder="e.g. Raj Kumar"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && <p className="text-red-500 text-xs">{formErrors.name}</p>}
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="user-email">Email Address *</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="e.g. raj@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={formErrors.email ? "border-red-500" : ""}
                />
                {formErrors.email && <p className="text-red-500 text-xs">{formErrors.email}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="user-role">Role *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin" | "seller" })}>
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller"><UserCog className="w-4 h-4 mr-2 inline" />Seller (POS Access)</SelectItem>
                  <SelectItem value="admin"><ShieldAlert className="w-4 h-4 mr-2 inline" />Admin (Full Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">{editingUser ? "New Password (optional)" : "Password *"}</Label>
              <Input
                id="user-password"
                type="password"
                placeholder={editingUser ? "Leave blank to keep unchanged" : "Minimum 6 characters"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={formErrors.password ? "border-red-500" : ""}
              />
              {formErrors.password && <p className="text-red-500 text-xs">{formErrors.password}</p>}
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingUser ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => userToDelete && deleteMutation.mutate(userToDelete._id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div>Loading users...</div>}>
      <UsersContent />
    </Suspense>
  );
}
