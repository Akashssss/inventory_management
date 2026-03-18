"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Search, 
  Filter, 
  Layers, 
  TrendingDown,
  Info,
  PackageSearch
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ReconciliationPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllSmall, setShowAllSmall] = useState(false);
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);

  const { data: pendingRes, isLoading: pendingLoading } = useQuery({
    queryKey: ["pending-quick-adds"],
    queryFn: async () => {
      const res = await api.get("/transactions/pending-quick-adds");
      return res.data;
    }
  });

  const pendingItems = pendingRes?.data || [];

  const { data: productsRes, isLoading: productsLoading } = useQuery({
    queryKey: ["products-reconciliation"],
    queryFn: async () => {
      const payload = {
        filter: {
          logic: "and",
          conditions: [
            { field: "status", operator: "eq", value: "active" },
            { field: "isSmallProduct", operator: "eq", value: true }
          ]
        }
      };
      const res = await api.post(`/products/search?limit=200`, payload);
      return res.data;
    }
  });

  const allProducts = productsRes?.data || [];
 
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace("/api", "") || "http://localhost:5000";
  const getImageUrl = (path: string) => path ? (path.startsWith("http") ? path : `${baseUrl}${path}`) : "";
  const getProductImage = (p: any) => {
    if (p.images && p.images.length > 0) return getImageUrl(p.images[0].url);
    if (p.image) return getImageUrl(p.image);
    return null;
  };

  // Auto-select the first pending item when data loads
  useEffect(() => {
    if (pendingItems.length > 0 && !selectedPendingId) {
      setSelectedPendingId(pendingItems[0].id);
    }
  }, [pendingItems, selectedPendingId]);

  const selectedPending = pendingItems.find((p: any) => p.id === selectedPendingId);

  // Dynamic products list based on search and selected pending item
  const displayProducts = useMemo(() => {
    if (!selectedPending && !showAllSmall) return [];

    let filtered = allProducts;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p: any) => 
        p.name.toLowerCase().includes(q)
      );
    }

    // Recommendation logic
    return filtered.map((p: any) => {
      const priceMatch = Math.abs(p.sellingPrice - (selectedPending?.price || 0)) < 0.01;
      
      // Match if pendings category is in products categories array
      const productCats = Array.isArray(p.categories) ? p.categories : [];
      const categoryMatch = productCats.some((cat: string) => 
        cat.toLowerCase() === selectedPending?.category?.toLowerCase() ||
        cat.toLowerCase().includes(selectedPending?.category?.toLowerCase()) ||
        selectedPending?.category?.toLowerCase().includes(cat.toLowerCase())
      );

      return {
        ...p,
        isPriceMatch: priceMatch,
        isCategoryMatch: categoryMatch,
        score: (priceMatch ? 2 : 0) + (categoryMatch ? 1 : 0)
      };
    }).filter((p: any) => {
      if (showAllSmall || searchQuery) return true;
      return p.score > 0; // Show only matches by default
    }).sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
  }, [allProducts, selectedPending, showAllSmall, searchQuery]);

  const resolveMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string, quantity: number }) => {
      if (!selectedPending) throw new Error("No pending item selected");
      const payload = {
        category: selectedPending.category,
        price: selectedPending.price,
        resolutions: [
          { productId, quantity }
        ]
      };
      await api.post("/transactions/resolve-quick-add", payload);
    },
    onSuccess: () => {
      toast.success("Stock reconciled successfully!");
      queryClient.invalidateQueries({ queryKey: ["pending-quick-adds"] });
      queryClient.invalidateQueries({ queryKey: ["products-reconciliation"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to resolve stock");
    }
  });

  const handleResolve = (productId: string, quantityToResolve: number) => {
    if (!selectedPending || quantityToResolve <= 0) return;
    resolveMutation.mutate({ productId, quantity: quantityToResolve });
  };

  return (
    <div className="flex bg-white rounded-3xl overflow-hidden border shadow-sm">
      {/* Sidebar: Pending Batches */}
      <div className="w-[340px] border-r bg-muted/30 flex flex-col h-[700px] sticky top-0">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
            <TrendingDown className="w-4 h-4" />
            <span>STOCK RECONCILIATION</span>
          </div>
          <h2 className="font-black text-2xl tracking-tight">Pending Batches</h2>
          <p className="text-muted-foreground text-xs mt-1">Resolve quick-adds to actual products.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]/50">
          {pendingLoading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3 opacity-50">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Loading Batches</span>
            </div>
          ) : pendingItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center border-2 border-dashed rounded-2xl bg-white/50 space-y-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="font-black text-sm uppercase">All Clear!</p>
                <p className="text-xs text-muted-foreground mt-1">No pending reconciliations found.</p>
              </div>
            </div>
          ) : (
            pendingItems.map((item: any) => {
              const isSelected = selectedPendingId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedPendingId(item.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${
                    isSelected 
                      ? "border-primary bg-white shadow-xl scale-[1.02] z-10" 
                      : "border-transparent bg-white hover:border-primary/20 hover:shadow-md"
                  }`}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />}
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-sm uppercase tracking-tight truncate pr-2">{item.category}</span>
                    <Badge className="font-black rounded-lg">₹{item.price}</Badge>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Unresolved</span>
                        <span className="text-lg font-black text-orange-600">
                            {item.quantity - (item.resolved || 0)} <span className="text-xs">pcs</span>
                        </span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main content: Resolution list */}
      <div className="flex-1 p-6 space-y-8 min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 overflow-hidden">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">Match Products</h1>
            <p className="text-muted-foreground mt-2 font-medium italic text-sm">
              Connect anonymous quick-added sales to actual inventory records.
            </p>
          </div>
          {selectedPending && (
            <div className="bg-orange-50 border border-orange-200 px-4 py-3 rounded-2xl flex items-center gap-3 w-full sm:w-auto">
                <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                <div className="min-w-0">
                   <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest truncate">Resolving Now</p>
                   <p className="text-sm font-bold truncate">{selectedPending.category} @ ₹{selectedPending.price}</p>
                </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input 
                 placeholder="Search product name..."
                 className="pl-11 h-12 rounded-2xl bg-muted/20 border-transparent focus:bg-white transition-all font-bold"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            <div className="flex flex-wrap items-center gap-4 px-4 py-2 border rounded-2xl bg-muted/5 w-full lg:w-auto overflow-x-auto scrollbar-hide">
               <div className="flex items-center space-x-2 shrink-0">
                 <Switch 
                   id="show-all" 
                   checked={showAllSmall} 
                   onCheckedChange={setShowAllSmall}
                 />
                 <Label htmlFor="show-all" className="text-xs font-black uppercase tracking-tight cursor-pointer">Show All Products</Label>
               </div>
               <div className="hidden lg:block h-6 w-px bg-border shrink-0" />
               <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold italic shrink-0">
                  <Filter className="w-3 h-3" />
                  Showing {displayProducts.length} items
               </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-4 font-black uppercase text-[10px] tracking-widest whitespace-nowrap">Product Info</TableHead>
                    <TableHead className="text-right font-black uppercase text-[10px] tracking-widest whitespace-nowrap">In Stock</TableHead>
                    <TableHead className="text-center font-black uppercase text-[10px] tracking-widest whitespace-nowrap">Resolve Qty</TableHead>
                    <TableHead className="text-right pr-6 font-black uppercase text-[10px] tracking-widest whitespace-nowrap">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {productsLoading ? (
                   <TableRow><TableCell colSpan={4} className="h-60 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto opacity-20"/></TableCell></TableRow>
                ) : displayProducts.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={4} className="h-80 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4 opacity-50">
                           <PackageSearch className="w-16 h-16" />
                           <div>
                             <p className="font-black uppercase tracking-tight">No Matching Products Found</p>
                             <p className="text-xs max-w-[300px] mx-auto mt-1">Try searching for a different name or enable "Show All Products" to find a manual match.</p>
                           </div>
                        </div>
                     </TableCell>
                   </TableRow>
                ) : (
                  displayProducts.map((product: any) => (
                    <ReconciliationRow 
                      key={product._id} 
                      product={product} 
                      maxResolvable={selectedPending?.quantity - (selectedPending?.resolved || 0)}
                      onResolve={(qty) => handleResolve(product._id, qty)}
                      isResolving={resolveMutation.isPending}
                      getProductImage={getProductImage}
                    />
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ChevronRight = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
)

// Subcomponent for handling local input state per row
function ReconciliationRow({ product, maxResolvable, onResolve, isResolving, getProductImage }: { product: any, maxResolvable: number, onResolve: (qty: number) => void, isResolving: boolean, getProductImage: (p: any) => string | null }) {
  const [qty, setQty] = useState(maxResolvable > 0 ? 1 : 0);
  const currentStock = product.stock || 0;
  
  // Update local qty if maxResolvable changes
  useEffect(() => {
    if (qty > maxResolvable) setQty(maxResolvable);
    if (qty === 0 && maxResolvable > 0) setQty(1);
  }, [maxResolvable]);

  return (
    <TableRow className="group hover:bg-slate-50 transition-colors">
      <TableCell className="py-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 rounded-xl">
            <AvatarImage src={getProductImage(product) || ""} className="object-cover" />
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">{product.name.substring(0,2)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="font-black text-slate-900 group-hover:text-primary transition-colors uppercase text-sm leading-tight">{product.name}</p>
            <div className="flex gap-1.5 items-center">
              <Badge variant="outline" className="text-[9px] px-1 h-4 font-bold tracking-tight">₹{product.sellingPrice}</Badge>
              {product.isPriceMatch && <Badge className="text-[9px] px-1 h-4 bg-green-500 hover:bg-green-600 border-none font-bold">PRICE MATCH</Badge>}
              {product.isCategoryMatch && <Badge className="text-[9px] px-1 h-4 bg-blue-500 hover:bg-blue-600 border-none font-bold">CATEGORY MATCH</Badge>}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
            <span className={`text-lg font-black ${currentStock < 10 ? 'text-red-500' : 'text-slate-700'}`}>{currentStock}</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Available pieces</span>
        </div>
      </TableCell>
      <TableCell className="text-center w-40">
        <div className="flex flex-col items-center gap-1">
            <Input 
              type="number" 
              value={qty} 
              onChange={(e) => setQty(Math.min(maxResolvable, Math.max(0, parseInt(e.target.value) || 0)))}
              className="text-center font-black h-10 w-24 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50 tracking-widest">pcs to resolve</span>
        </div>
      </TableCell>
      <TableCell className="text-right pr-6">
        <Button 
          disabled={qty <= 0 || qty > maxResolvable || qty > currentStock || isResolving}
          onClick={() => onResolve(qty)}
          className="rounded-xl h-10 font-bold px-6 shadow-sm hover:shadow-lg transition-all"
        >
          {isResolving ? <Loader2 className="w-4 h-4 animate-spin"/> : "Resolve"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
