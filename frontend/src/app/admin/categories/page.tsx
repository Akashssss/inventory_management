"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { useQueryState } from "nuqs";
import { Suspense, useState as useReactState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type Category = { _id: string, name: string, description: string, isActive: boolean };

function CategoriesContent() {
  const [searchQuery, setSearchQuery] = useQueryState("search", { defaultValue: "" });
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });
  
  // Dialog state
  const [isOpen, setIsOpen] = useReactState(false);
  const [formData, setFormData] = useReactState({ name: "", description: "", isActive: true, _id: "" });

  const { data: categoriesRes, isLoading, refetch } = useQuery({
    queryKey: ["categories", searchQuery, page],
    queryFn: async () => {
      const res = await api.get(`/categories?search=${searchQuery}&page=${page}&limit=10`);
      return res.data;
    }
  });

  const categories: Category[] = categoriesRes?.data || [];
  const meta = categoriesRes?.pagination;

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      if (formData._id) {
        await api.put(`/categories/${formData._id}`, payload);
      } else {
        // Remove empty _id for new categories
        delete (payload as any)._id;
        await api.post("/categories", payload);
      }
      toast.success("Category saved!");
      setIsOpen(false);
      refetch();
    } catch(e: any) {
      toast.error(e.response?.data?.error?.message || "Error saving category.");
    }
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/categories/${deleteId}`);
      toast.success("Category deleted");
      refetch();
    } catch(e) {
      toast.error("Delete failed");
    } finally {
      setDeleteId(null);
    }
  };

  const openEdit = (cat: Category) => {
    setFormData(cat);
    setIsOpen(true);
  };
  
  const openNew = () => {
    setFormData({ name: "", description: "", isActive: true, _id: "" });
    setIsOpen(true);
  };
  
  // ... Component Logic continued

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">Organize your products into logical groups.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>{formData._id ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Name</Label>
                <Input id="cat-name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Pastries" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-desc">Description</Label>
                <Input id="cat-desc" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Optional description" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                <Label htmlFor="cat-status" className="cursor-pointer">Active Status</Label>
                <Switch id="cat-status" checked={formData.isActive} onCheckedChange={c => setFormData({...formData, isActive: !!c})} />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1 sm:flex-none">Cancel</Button>
              <Button onClick={handleSave} className="flex-1 sm:flex-none">Save Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            className="pl-8 bg-white h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
               <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground"/></TableCell></TableRow>
            ) : categories.length === 0 ? (
               <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No categories found matching your query.</TableCell></TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category._id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      category.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(category._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>
      
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
          <div>Showing page {meta.page} of {meta.totalPages}</div>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setPage(String(meta.page - 1))}>Previous</Button>
             <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setPage(String(meta.page + 1))}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone and may affect products associated with it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div>Loading categories...</div>}>
      <CategoriesContent />
    </Suspense>
  );
}
