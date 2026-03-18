"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Tag, Box, Ruler, Package, Loader2, Filter, Image as ImageIcon } from "lucide-react";
import { useQueryState, parseAsBoolean } from "nuqs";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function ProductsContent() {
  const [searchQuery, setSearchQuery] = useQueryState("search", { defaultValue: "" });
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });
  const [categoryFilter, setCategoryFilter] = useQueryState("category", { defaultValue: "all" });
  const [smallProductOnly, setSmallProductOnly] = useQueryState("smallOnly", parseAsBoolean.withDefault(false));
  
  // Fetch available categories for the filter dropdown
  const { data: categoriesRes } = useQuery({
    queryKey: ["categories_dropdown"],
    queryFn: async () => {
      const res = await api.get(`/categories?limit=100`);
      return res.data;
    }
  });
  const categoriesDb = categoriesRes?.data || [];

  const { data: productsRes, isLoading, refetch } = useQuery({
    queryKey: ["products", searchQuery, page, categoryFilter, smallProductOnly],
    queryFn: async () => {
      const filterConditions = [];
      
      if (categoryFilter !== "all") {
        filterConditions.push({ field: "categoryId", operator: "eq", value: categoryFilter });
      }
      
      if (smallProductOnly) {
        filterConditions.push({ field: "isSmallProduct", operator: "eq", value: true });
      }

      const payload = {
        filter: filterConditions.length > 0 ? { logic: "and", conditions: filterConditions } : undefined
      };
      const res = await api.post(`/products/search?search=${searchQuery}&page=${page}&limit=10`, payload);
      return res.data;
    }
  });

  const products = productsRes?.data || [];
  const meta = productsRes?.pagination;
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace("/api", "") || "http://localhost:5000";
  const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${baseUrl}${path}`;
  const getProductImage = (product: any) => {
    // Backend stores images as an array
    if (product.images && product.images.length > 0) return getImageUrl(product.images[0].url);
    return null;
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/products/${deleteId}`);
      toast.success("Product deleted successfully");
      refetch();
    } catch(e) {
      toast.error("Failed to delete product");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your inventory and stock levels.</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8 bg-white h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white shrink-0">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoriesDb.map((c: any) => (
                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant={smallProductOnly ? "default" : "outline"}
            onClick={() => setSmallProductOnly(!smallProductOnly)}
            className={`h-10 whitespace-nowrap shrink-0 ${smallProductOnly ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white'}`}
          >
            <Tag className="w-4 h-4 mr-2" /> Small POS Items
          </Button>
        </div>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={8} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground"/></TableCell></TableRow>
            ) : products.length === 0 ? (
               <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No products found matching your search.</TableCell></TableRow>
            ) : (
             products.map((product: any) => (
              <TableRow key={product._id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                {(() => { const imgUrl = getProductImage(product); return imgUrl ? (
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0 border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0 border border-dashed">
                        <ImageIcon className="w-5 h-5 text-muted-foreground opacity-50" />
                      </div>
                    ); })()
                }
                    <div className="flex flex-col">
                      <span>{product.name}</span>
                      {product.isSmallProduct && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 w-max mt-1 flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Small Product
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {Array.isArray(product.categories) && product.categories.length > 0
                    ? product.categories.map((c: any) => categoriesDb.find((cat: any) => cat._id === c)?.name || c).filter(Boolean).join(", ")
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm text-muted-foreground">
                    {product.type === "measurable" ? (
                      <><Ruler className="w-4 h-4 mr-1" /> Measurable ({product.unit})</>
                    ) : product.comesInBoxes ? (
                      <><Box className="w-4 h-4 mr-1" /> Boxes ({product.itemsPerBox} pcs/box)</>
                    ) : (
                      <><Package className="w-4 h-4 mr-1" /> Pieces</>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">₹{product.costPrice}</TableCell>
                <TableCell className="text-right font-semibold">₹{product.sellingPrice}</TableCell>
                <TableCell className="text-right">
                  {product.availableStock || product.stock || 0} {product.unit}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      product.status === "active" || typeof product.deletedAt === 'undefined' || product.deletedAt === null
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.status || (product.deletedAt ? "deleted" : "active")}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/products/${product._id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(product._id)}>
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
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the product from the inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading products...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
