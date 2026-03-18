"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Calendar, User, CreditCard, Package, Hash, Receipt } from "lucide-react";

interface TransactionDetailSheetProps {
  transaction: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailSheet({ transaction, open, onOpenChange }: TransactionDetailSheetProps) {
  if (!transaction) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
            <Receipt className="w-4 h-4" />
            <span>TRANSACTION DETAILS</span>
          </div>
          <SheetTitle className="text-2xl font-black flex items-center justify-between">
            <span>#{transaction._id.substring(transaction._id.length - 8).toUpperCase()}</span>
            <Badge variant={transaction.status === "completed" ? "default" : "secondary"} className="capitalize">
              {transaction.status || "Completed"}
            </Badge>
          </SheetTitle>
          <SheetDescription className="text-xs">
            Full record of transaction and itemized breakdown.
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Metadata Section */}
          <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-muted-foreground/10">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date & Time
              </span>
              <p className="text-xs font-semibold">{format(new Date(transaction.createdAt), "PPp")}</p>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 justify-end">
                <CreditCard className="w-3 h-3" /> Payment
              </span>
              <p className="text-xs font-semibold capitalize">{transaction.paymentMethod}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <User className="w-3 h-3" /> Seller
              </span>
              <p className="text-xs font-semibold">{transaction.sellerName}</p>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 justify-end">
                <Hash className="w-3 h-3" /> Item Count
              </span>
              <p className="text-xs font-semibold">{transaction.items?.length || 0} unique items</p>
            </div>
          </div>

          {/* Items Section */}
          <div className="flex-1 flex flex-col overflow-hidden space-y-2">
            <h4 className="text-sm font-bold flex items-center gap-2 px-1">
              <Package className="w-4 h-4 text-primary" /> Itemized Bill
            </h4>
            <ScrollArea className="flex-1 rounded-xl border bg-white shadow-inner p-2">
              <div className="space-y-2">
                {transaction.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start p-3 rounded-lg border bg-muted/5 hover:bg-muted/10 transition-colors">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold leading-tight">{item.name}</p>
                      <div className="flex items-center gap-2">
                        {item.category && <Badge variant="outline" className="text-[9px] px-1 h-4">{item.category}</Badge>}
                        <span className="text-[10px] text-muted-foreground">
                          {item.quantity} {item.unit || "pcs"} × ₹{item.sellingPrice}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">₹{item.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer with Totals */}
        <div className="mt-auto pt-6 space-y-4">
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between text-muted-foreground text-sm px-1">
              <span>Subtotal</span>
              <span>₹{transaction.total}</span>
            </div>
            <div className="flex justify-between items-center bg-primary/10 p-4 rounded-xl border border-primary/20">
              <span className="text-sm font-bold text-primary italic">TOTAL AMOUNT</span>
              <span className="text-2xl font-black text-primary drop-shadow-sm">₹{transaction.total}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
