"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Search, Plus, Minus, Check, X, Trash2, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface BatchItem {
  id: string; // temp id for batch list
  category: string;
  price: number;
  quantity: number;
}

interface QuickModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBatchAddAll: (items: { category: string, price: number, quantity: number }[]) => void;
}

export function QuickModeDialog({ open, onOpenChange, onBatchAddAll }: QuickModeDialogProps) {
  const { data: settingsRes } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await api.get("/settings");
      return res.data;
    },
    enabled: open
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ["small_product_categories"],
    queryFn: async () => {
      const res = await api.get("/products/small-product-categories");
      return res.data;
    },
    enabled: open
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [customPrice, setCustomPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [catSearch, setCatSearch] = useState("");
  const [batchList, setBatchList] = useState<BatchItem[]>([]);

  // Fetch available prices for the selected category
  const { data: pricesRes, isLoading: isLoadingPrices } = useQuery({
    queryKey: ["small_product_prices", selectedCategory],
    queryFn: async () => {
      const res = await api.get(`/products/small-product-prices?category=${encodeURIComponent(selectedCategory!)}`);
      return res.data;
    },
    enabled: !!selectedCategory && open
  });

  const globalPriceTags: number[] = settingsRes?.data?.smallProductTags || [1, 2, 5, 10];
  const allCategories: string[] = categoriesRes?.data || [];
  const stockAvailablePrices: number[] = pricesRes?.data || [];
  
  const filteredCategories = allCategories.filter(c => 
    c.toLowerCase().includes(catSearch.toLowerCase())
  );

  const effectivePrice = customPrice ? parseFloat(customPrice) : selectedTag;
  const isPriceInStock = effectivePrice ? stockAvailablePrices.includes(effectivePrice) : false;

  const addToBatch = () => {
    if (!effectivePrice || !selectedCategory || quantity <= 0) return;
    
    const newItem: BatchItem = {
      id: `${selectedCategory}-${effectivePrice}-${Date.now()}`,
      category: selectedCategory,
      price: effectivePrice,
      quantity: quantity
    };

    setBatchList(prev => [...prev, newItem]);
    setQuantity(1);
    setCustomPrice("");
  };

  const removeFromBatch = (id: string) => {
    setBatchList(prev => prev.filter(item => item.id !== id));
  };

  const handleConfirmAll = () => {
    if (batchList.length === 0) return;
    onBatchAddAll(batchList.map(({ category, price, quantity }) => ({ category, price, quantity })));
    
    // Reset all
    setBatchList([]);
    setSelectedTag(null);
    setSelectedCategory(null);
    setQuantity(1);
    setCustomPrice("");
    onOpenChange(false);
  };

  const isReadyToAdd = effectivePrice && selectedCategory && quantity > 0;
  const totalInBatch = batchList.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] flex flex-col h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Zap className="text-orange-500 fill-orange-500" /> Quick Batch POS
          </DialogTitle>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>Building batch for reconciliation.</span>
            <Badge variant="outline" className="text-[10px] h-4 bg-green-50 text-green-700 border-green-200 font-bold">
              Only in-stock products shown
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex flex-1 gap-6 py-4 overflow-hidden">
          
          {/* Left: Item Picker */}
          <div className="flex-1 space-y-6 overflow-y-auto pr-2">
            
            {/* Step 1: Category */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px]">1</span>
                  Select Category
                </h4>
                <div className="relative w-40">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search category..." 
                    className="h-8 pl-8 pr-2 text-xs" 
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="h-[180px] border rounded-md p-2 bg-muted/20 shadow-inner">
                <div className="grid grid-cols-2 gap-2">
                  {filteredCategories.length === 0 ? (
                    <div className="col-span-2 text-center py-6 text-xs text-muted-foreground italic bg-white/50 rounded-lg">
                      No categories found with available small products.
                    </div>
                  ) : (
                    filteredCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setSelectedTag(null);
                        }}
                        className={`flex items-center justify-between px-3 py-3 rounded-lg transition-all text-left text-sm border ${
                          selectedCategory === cat 
                            ? "bg-primary text-primary-foreground font-bold shadow-md border-primary" 
                            : "bg-white hover:bg-muted border-transparent"
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {selectedCategory === cat && <Check className="w-4 h-4 flex-shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Step 2: Price */}
            <div className={`space-y-4 transition-opacity duration-300 ${!selectedCategory ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px]">2</span>
                  Select Price
                </h4>
                <div className="relative w-32">
                  <span className="absolute left-3 top-2 text-muted-foreground text-sm font-bold">₹</span>
                  <Input 
                    placeholder="Other..." 
                    type="number"
                    className="h-8 pl-6 pr-2 text-xs font-bold bg-white" 
                    value={customPrice}
                    onChange={(e) => {
                      setCustomPrice(e.target.value);
                      if (e.target.value) setSelectedTag(null);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {/* Available In Stock Prices */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Available in Stock</span>
                  <div className="flex flex-wrap gap-2">
                    {isLoadingPrices ? (
                      <div className="h-10 flex items-center gap-2 text-xs text-muted-foreground px-2">
                        <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Loading stock prices...
                      </div>
                    ) : stockAvailablePrices.length === 0 ? (
                      <div className="text-[11px] text-orange-500 bg-orange-50 px-2 py-1.5 rounded-md border border-orange-100 italic">
                        No specific price points found for this category in stock.
                      </div>
                    ) : (
                      stockAvailablePrices.map(price => (
                        <button
                          key={price}
                          onClick={() => {
                            setSelectedTag(price);
                            setCustomPrice("");
                          }}
                          className={`min-w-[50px] h-10 px-3 rounded-lg border-2 flex items-center justify-center font-bold transition-all relative ${
                            selectedTag === price 
                              ? "border-primary bg-primary/10 text-primary shadow-sm" 
                              : "border-muted-foreground/10 bg-white hover:border-primary/50 text-foreground"
                          }`}
                        >
                          ₹{price}
                          {selectedTag === price && <Check className="absolute -top-1 -right-1 w-3 h-3 bg-primary text-white rounded-full p-0.5" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Common Tags from Settings */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quick Common Tags</span>
                  <div className="flex flex-wrap gap-2 opacity-70 hover:opacity-100 transition-opacity">
                    {globalPriceTags.filter(t => !stockAvailablePrices.includes(t)).map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTag(tag);
                          setCustomPrice("");
                        }}
                        className={`min-w-[45px] h-9 px-2 rounded-lg border flex items-center justify-center text-xs font-semibold transition-all ${
                          selectedTag === tag 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-muted bg-muted/30 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        ₹{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Quantity & Add */}
            <div className={`space-y-4 transition-opacity duration-300 ${!effectivePrice ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px]">3</span>
                Set Quantity
              </h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg h-12 overflow-hidden bg-white shadow-sm">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-none h-full w-12 border-r hover:bg-muted"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <Input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-20 h-full border-none text-center font-bold text-xl focus-visible:ring-0"
                    min="1"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-none h-full w-12 border-l hover:bg-muted"
                    onClick={() => setQuantity(q => q + 1)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Button 
                    disabled={!isReadyToAdd}
                    onClick={addToBatch}
                    className="w-full h-12 font-bold shadow-lg active:scale-95 transition-transform"
                  >
                    <Plus className="w-5 h-5 mr-2" /> Add Selection to Batch
                  </Button>
                  {effectivePrice && selectedCategory && !isPriceInStock && (
                    <span className="text-[10px] text-orange-600 font-medium text-center">
                      ⚠ Price ₹{effectivePrice} not found in {selectedCategory} stock. Will require manual reconciliation.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Batch Summary */}
          <div className="w-80 border rounded-2xl bg-muted/10 flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm">Review Batch</h4>
                <Badge variant="secondary" className="font-bold text-[10px] px-1.5">{batchList.length}</Badge>
              </div>
              <button 
                onClick={() => setBatchList([])}
                className="text-[10px] text-muted-foreground hover:text-red-500 font-semibold"
                disabled={batchList.length === 0}
              >
                Clear All
              </button>
            </div>
            
            <ScrollArea className="flex-1 p-4 bg-muted/5">
              {batchList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs text-center space-y-4 opacity-40 py-10">
                  <div className="p-4 rounded-full bg-muted border-2 border-dashed border-muted-foreground/20">
                    <Zap className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-foreground/80">Empty Batch</p>
                    <p>Select category and price<br/>on the left to start building.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {batchList.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm hover:border-primary/30 transition-colors group">
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="font-bold text-xs text-foreground truncate">{item.category}</div>
                        <div className="text-[10px] text-muted-foreground font-medium">
                          {item.quantity} units @ ₹{item.price}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-black text-xs text-primary">₹{item.price * item.quantity}</div>
                        <button 
                          onClick={() => removeFromBatch(item.id)}
                          className="text-muted-foreground/30 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-5 bg-white border-t space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Estimated Total</span>
                  <span className="text-2xl font-black text-primary drop-shadow-sm">₹{totalInBatch}</span>
                </div>
                <p className="text-[9px] text-muted-foreground italic">
                  * Prices verified against stock records for easier reconciliation.
                </p>
              </div>
              <Button 
                className="w-full font-bold shadow-xl h-14 rounded-xl text-md" 
                disabled={batchList.length === 0}
                onClick={handleConfirmAll}
              >
                Confirm & Add to Bill
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
