"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Minus, ShoppingCart, Info, Flashlight, Receipt, Loader2, Filter, Image as ImageIcon, CheckCircle2, Trash2, X, Store } from "lucide-react";
import { QuickModeDialog } from "@/components/billing/QuickModeDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BillingPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [quickModeOpen, setQuickModeOpen] = useState(false);
  const [clearCartOpen, setClearCartOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useQueryState("search", { defaultValue: "" });
  const [categoryFilter, setCategoryFilter] = useQueryState("category", { defaultValue: "all" });

  const { data: categoriesRes } = useQuery({
    queryKey: ["categories_dropdown"],
    queryFn: async () => {
      const res = await api.get("/categories?limit=100");
      return res.data;
    }
  });

  const { data: productsRes, isLoading } = useQuery({
    queryKey: ["products", searchQuery, categoryFilter],
    queryFn: async () => {
      const filterConditions = [];
      if (categoryFilter !== "all") {
        filterConditions.push({ field: "categories", operator: "in", value: [categoryFilter] });
      }
      filterConditions.push({ field: "status", operator: "eq", value: "active" });

      const payload = {
        filter: filterConditions.length > 0 ? { logic: "and", conditions: filterConditions } : undefined
      };
      const res = await api.post(`/products/search?search=${searchQuery}&limit=50`, payload);
      return res.data;
    }
  });

  const products = productsRes?.data || [];
  const categoriesDb = categoriesRes?.data || [];
  
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace("/api", "") || "http://localhost:5000";
  const getImageUrl = (path: string) => path ? (path.startsWith("http") ? path : `${baseUrl}${path}`) : "";
  const getProductImage = (p: any) => {
    if (p.images && p.images.length > 0) return getImageUrl(p.images[0].url);
    if (p.image) return getImageUrl(p.image); // Fallback for legacy
    return null;
  };

  const addToCart = (product: any, qtyChange: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id && !item.product.isQuickAdd);
      if (existing) {
        const currentQty = existing.quantity;
        const newQty = currentQty + qtyChange;
        
        // Enforce stock limit
        const availableStock = product.availableStock !== undefined ? product.availableStock : product.stock;
        if (qtyChange > 0 && newQty > availableStock) {
           toast.error(`Cannot add more. Only ${availableStock} in stock.`);
           return prev;
        }

        if (newQty <= 0) return prev.filter((item) => item.product._id !== product._id || item.product.isQuickAdd);
        return prev.map((item) =>
          item.product._id === product._id && !item.product.isQuickAdd ? { ...item, quantity: newQty } : item
        );
      }
      
      if (qtyChange <= 0) return prev;

      // Enforce stock limit for new item
      const availableStock = product.availableStock !== undefined ? product.availableStock : product.stock;
      if (qtyChange > availableStock) {
        toast.error(`Only ${availableStock} in stock.`);
        return prev;
      }

      return [...prev, { product, quantity: qtyChange }];
    });
  };

  const updateCartQuantity = (product: any, newQtyRaw: number | string) => {
    if (newQtyRaw === "") return;
    
    // Parse to number (handles decimals from measurable products)
    const parsedQty = typeof newQtyRaw === 'number' ? newQtyRaw : Number(newQtyRaw);
    if (isNaN(parsedQty) || parsedQty < 0) return;

    const stock = product.isQuickAdd ? Infinity : (product.availableStock !== undefined ? product.availableStock : product.stock);
    const validatedQty = product.isQuickAdd ? parsedQty : Math.max(0, Math.min(parsedQty, stock));

    setCart((prev) => {
      const existing = prev.find(item => 
        (item.product as any)._id === product._id && 
        (item.product as any).isQuickAdd === product.isQuickAdd
      );

      if (validatedQty === 0) {
        return prev.filter(item => item !== existing);
      }

      if (existing) {
        return prev.map(item => 
          item === existing ? { ...item, quantity: validatedQty } : item
        );
      }

      return [...prev, { product, quantity: validatedQty }];
    });
  };

  const handleQuickAddAll = (items: { category: string, price: number, quantity: number }[]) => {
    setCart((prev) => {
      let currentCart = [...prev];

      items.forEach(item => {
        const tempId = `quick-${item.category}-${item.price}`;
        const existingIndex = currentCart.findIndex((i) => i.product._id === tempId);
        
        if (existingIndex > -1) {
          currentCart[existingIndex] = {
            ...currentCart[existingIndex],
            quantity: currentCart[existingIndex].quantity + item.quantity
          };
        } else {
          const newProduct = {
            _id: tempId,
            name: `Small ${item.category}`,
            sellingPrice: item.price,
            unit: "pieces",
            isSmallProduct: true,
            category: item.category,
            isQuickAdd: true,
          };
          currentCart.push({ product: newProduct, quantity: item.quantity });
        }
      });

      return currentCart;
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        items: cart.map(c => ({
          productId: c.product.isQuickAdd ? null : c.product._id,
          name: c.product.name,
          category: typeof c.product.category === 'object' ? c.product.category?.name : (c.product.category || "General"),
          quantity: c.quantity,
          unit: c.product.unit || "pieces",
          sellingPrice: c.product.sellingPrice,
          total: c.quantity * c.product.sellingPrice,
          isQuickAdd: !!c.product.isQuickAdd
        })),
        subTotal: cartTotal,
        tax: 0,
        total: cartTotal,
        paymentMethod: "cash" // Defaults to cash for now
      };
      
      const res = await api.post("/transactions", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Transaction completed successfully!");
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Checkout failed");
    }
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-56px)] md:min-h-screen bg-muted/20">
      <QuickModeDialog 
        open={quickModeOpen} 
        onOpenChange={setQuickModeOpen} 
        onBatchAddAll={handleQuickAddAll} 
      />
      
      {/* Left side: Products Grid */}
      <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 md:gap-6 min-h-[60vh] lg:h-screen">
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10 h-10 md:h-11 rounded-lg md:rounded-xl border-transparent bg-slate-100/50 focus:bg-white transition-all font-medium text-sm md:text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                type="button"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <SearchableSelect
              options={[{ label: "All Categories", value: "all" }, ...categoriesDb.map((c: any) => ({ label: c.name, value: c._id }))]}
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="All Categories"
              className="w-full sm:w-[200px]"
            />

            <Button 
              variant="outline" 
              className="w-full sm:w-auto h-10 md:h-11 border-orange-500 text-orange-600 hover:bg-orange-50 whitespace-nowrap px-4"
              onClick={() => setQuickModeOpen(true)}
            >
              <Flashlight className="mr-2 h-4 w-4" /> Quick Mode
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-2 px-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex justify-center items-center h-40 text-muted-foreground">
              No products available in stock matching this search.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4 pb-20 md:pb-10">
              {products.map((p: any) => {
                const cartItem = cart.find(c => (c.product as any)._id === p._id && !(c.product as any).isQuickAdd);
                const qty = cartItem ? cartItem.quantity : 0;
                
                return (
                  <Card key={p._id} className="overflow-hidden group hover:border-[var(--seller)] transition-all duration-300 flex flex-col hover:shadow-xl hover:-translate-y-1 bg-white border-2">
                    <div className="aspect-square relative bg-white flex items-center justify-center p-4 overflow-hidden">
                      {(() => {
                        const imgUrl = getProductImage(p);
                        return imgUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={imgUrl} alt={p.name} className="object-contain w-full h-full mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <ImageIcon className="w-16 h-16 text-muted/30 group-hover:scale-110 transition-transform duration-500" />
                        );
                      })()}
                      
                      <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 items-end max-w-[80%]">
                        {p.isSmallProduct && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none shadow-sm text-[9px] md:text-[10px] font-bold px-1.5 py-0 truncate">Small POS</Badge>
                        )}
                        {(p.stock === 0 && !p.availableStock) ? (
                          <Badge variant="destructive" className="text-[9px] md:text-[10px] font-bold px-1.5 py-0">Out of Stock</Badge>
                        ) : (p.availableStock || p.stock || 0) < (p.lowStockThreshold || 10) && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[9px] md:text-[10px] font-bold px-1.5 py-0 animate-pulse">Low Stock</Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-3 flex-1 flex flex-col justify-between border-t bg-slate-50/50">
                      <div>
                        <h3 className="font-bold text-sm line-clamp-2 leading-tight min-h-[2.5rem] text-slate-800">{p.name}</h3>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">
                          {p.unit} &middot; <span className={(p.availableStock || p.stock || 0) < (p.lowStockThreshold || 10) ? "text-orange-600 font-bold" : ""}>Stock: {p.availableStock || p.stock || 0}</span>
                        </p>
                      </div>
                      <div className="mt-3 md:mt-4 flex flex-wrap gap-2 items-center justify-between">
                        <div className="font-black text-base md:text-lg text-[var(--seller)] truncate">₹{p.sellingPrice}</div>
                        
                        {qty === 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[var(--seller)] text-[var(--seller)] hover:bg-[var(--seller)] hover:text-white transition-all px-2 md:px-3 h-8 md:h-9 font-bold text-[10px] md:text-xs rounded-lg md:rounded-xl"
                            onClick={() => addToCart(p, 1)}
                            disabled={(p.stock === 0 && !p.availableStock)}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                      ) : (
                        <div className="flex items-center bg-white border border-[var(--seller)] text-[var(--seller)] rounded-lg md:rounded-xl h-8 md:h-9 overflow-hidden shadow-sm shrink-0">
                          <button
                            className="w-7 md:w-8 h-full flex items-center justify-center hover:bg-slate-50 transition-colors"
                            onClick={() => addToCart(p, -1)}
                          >
                            <Minus size={12} className="md:w-3.5 md:h-3.5" />
                          </button>
                          <input
                            type="number"
                            step="any"
                            className="w-8 md:w-10 h-full text-center font-black text-xs md:text-sm bg-transparent border-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={qty}
                            onChange={(e) => updateCartQuantity(p, e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          <button
                            className="w-7 md:w-8 h-full flex items-center justify-center hover:bg-slate-50 transition-colors"
                            onClick={() => addToCart(p, 1)}
                          >
                            <Plus size={12} className="md:w-3.5 md:h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right side: Cart/Billing */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l bg-white flex flex-col h-[40dvh] lg:h-screen shadow-[0_-10px_20px_rgba(0,0,0,0.05)] lg:shadow-2xl z-20 sticky lg:static bottom-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b flex items-center justify-between bg-slate-50">
          <div className="flex flex-col">
             <h2 className="font-black text-lg text-slate-900 leading-none">Bill Details</h2>
             <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Terminal #01</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
              onClick={() => setClearCartOpen(true)}
              title="Clear Cart"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Badge className="bg-[var(--seller)] text-white hover:bg-[var(--seller)] font-black text-xs px-2.5 py-0.5 border-none shadow-sm">
              {cart.reduce((s, i) => s + i.quantity, 0)} Items
            </Badge>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 py-20">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p>Your cart is empty.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.product._id} className="group relative flex justify-between items-start gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-[var(--seller)]/20 hover:bg-white transition-all duration-300 hover:shadow-md">
                  <div className="flex-1">
                    <h4 className="font-black text-sm text-slate-800 leading-tight">
                      {item.product.isQuickAdd && <Flashlight className="inline w-3 h-3 text-orange-500 mr-1 animate-pulse" />}
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-tight">
                      {item.product.isQuickAdd ? `${item.quantity} x ${item.product.category}` : `₹${item.product.sellingPrice} / ${item.product.unit}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="font-black text-[var(--seller)] text-sm">₹{item.product.sellingPrice * item.quantity}</div>
                    <div className="flex items-center border-2 rounded-xl h-9 overflow-hidden bg-white shadow-sm mt-1">
                      <button
                        className="w-8 h-full flex items-center justify-center hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                        onClick={() => addToCart(item.product, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        step="any"
                        className="w-10 h-full text-center font-black text-sm bg-transparent border-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={item.quantity}
                        onChange={(e) => updateCartQuantity(item.product, e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                      <button
                        className="w-8 h-full flex items-center justify-center hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                        onClick={() => addToCart(item.product, 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-6 border-t bg-slate-50/50 mt-auto">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span>Items Total</span>
              <span>₹{cartTotal}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-400">
              <span className="flex items-center gap-1 italic"><Badge variant="outline" className="h-4 p-0 px-1 text-[8px]">POS</Badge> System Tax</span>
              <span>₹0.00</span>
            </div>
            <div className="flex justify-between font-black text-2xl pt-4 border-t-2 border-dashed border-slate-200 mt-4 text-slate-900">
              <span>Total Payable</span>
              <span className="text-[var(--seller)] tracking-tight">₹{cartTotal}</span>
            </div>
          </div>
          <Button 
            className="w-full h-16 text-xl font-black shadow-xl bg-[var(--seller)] text-white hover:opacity-90 active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-3 border-none" 
            disabled={cart.length === 0 || checkoutMutation.isPending}
            onClick={() => setFinalizeOpen(true)}
          >
           {checkoutMutation.isPending ? (
             <><Loader2 className="w-6 h-6 animate-spin" /> Finalizing Bill...</>
           ) : (
             <><CheckCircle2 className="w-6 h-6" /> Finalize Bill & Pay</>
           )}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground mt-4 font-medium italic">
            Tax invoice will be generated upon confirmation.
          </p>
        </div>
      </div>

      <Dialog open={clearCartOpen} onOpenChange={setClearCartOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear Cart?</DialogTitle>
            <DialogDescription>
              This will remove all items from your current bill. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setClearCartOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setCart([]); setClearCartOpen(false); }}>Clear Everything</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalize Transaction?</DialogTitle>
            <DialogDescription>
              Are you sure you want to process this bill for <strong>₹{cartTotal}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setFinalizeOpen(false)}>Go Back</Button>
            <Button className="bg-[var(--seller)] text-white" onClick={() => { checkoutMutation.mutate(); setFinalizeOpen(false); }}>
              Confirm & Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
