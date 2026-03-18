"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Download, 
  FileText, 
  Calendar, 
  Loader2, 
  ArrowUpDown, 
  Receipt,
  FileDown,
  Filter,
  RefreshCw,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { api } from "@/lib/api";
import { format, startOfDay, endOfDay, subDays, startOfWeek } from "date-fns";
import { TransactionDetailSheet } from "@/components/history/TransactionDetailSheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useQueryState("search", { defaultValue: "" });
  const [dateRange, setDateRange] = useState<{ start: string, end: string } | null>(null);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [period, setPeriod] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const buildFilter = () => {
    if (!dateRange) return undefined;
    return {
      field: "createdAt",
      operator: "dateIsBetween",
      value: [dateRange.start, dateRange.end]
    };
  };

  const { data: transactionsRes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["transactions_history", searchQuery, dateRange, sortField, sortOrder, currentPage, itemsPerPage],
    queryFn: async () => {
      const filter = buildFilter();
      const sort = [{ field: sortField, order: sortOrder }];
      
      const res = await api.post(`/transactions/search?search=${searchQuery}&page=${currentPage}&limit=${itemsPerPage}`, {
        filter,
        sort
      });
      return res.data;
    }
  });

  const transactions = transactionsRes?.data || [];
  const pagination = transactionsRes?.pagination;
  const totalPages = pagination?.total ? Math.ceil(pagination.total / itemsPerPage) : 1;

  const handlePeriodChange = (val: string) => {
    setPeriod(val);
    setCurrentPage(1); // reset to page 1 when filter changes
    const now = new Date();
    switch (val) {
      case "today":
        setDateRange({ start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() });
        break;
      case "yesterday":
        const yesterday = subDays(now, 1);
        setDateRange({ start: startOfDay(yesterday).toISOString(), end: endOfDay(yesterday).toISOString() });
        break;
      case "week":
        setDateRange({ start: startOfWeek(now).toISOString(), end: endOfDay(now).toISOString() });
        break;
      case "all":
        setDateRange(null);
        break;
    }
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const exportExcel = () => {
    if (transactions.length === 0) return;
    const formattedData = transactions.map((t: any) => ({
      ID: t._id,
      Date: format(new Date(t.createdAt), "PPp"),
      Seller: t.sellerName,
      Items_Count: t.items?.length || 0,
      Items_Detail: t.items?.map((i: any) => `${i.name} (${i.quantity} ${i.unit || 'pcs'})`).join(", ") || "",
      Total: t.total,
      PaymentMethod: t.paymentMethod,
    }));
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `transactions_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const exportCSV = () => {
     if (transactions.length === 0) return;
     const headers = ["ID", "Date", "Seller", "ItemsCount", "ItemsDetail", "Total", "PaymentMethod"];
     const rows = transactions.map((t: any) => [
       t._id,
       format(new Date(t.createdAt), "yyyy-MM-dd HH:mm:ss"),
       t.sellerName,
       t.items?.length || 0,
       t.items?.map((i: any) => `${i.name} (${i.quantity} ${i.unit || 'pcs'})`).join("; "),
       t.total,
       t.paymentMethod
     ]);
     
     const csvContent = "data:text/csv;charset=utf-8," 
       + headers.join(",") + "\n"
       + rows.map((e: any[]) => e.join(",")).join("\n");
       
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `history_${format(new Date(), "yyyyMMdd")}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Transaction History Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), "PPPpp")}`, 14, 28);
    if (dateRange) {
        doc.text(`Period: ${format(new Date(dateRange.start), "PP")} to ${format(new Date(dateRange.end), "PP")}`, 14, 34);
    }

    const tableData = transactions.map((t: any) => [
      t._id.substring(t._id.length - 8).toUpperCase(), 
      format(new Date(t.createdAt), "PPp"), 
      t.sellerName, 
      t.items?.length || 0,
      t.items ? t.items.map((i: any) => `${i.name} (${i.quantity})`).join(", ") : "",
      `Rs. ${t.total}`, 
      t.paymentMethod
    ]);
    
    autoTable(doc, {
      head: [["ID", "Date", "Seller", "Qty", "Items Detail", "Total", "Payment"]],
      body: tableData,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: {
        4: { cellWidth: 65 } // Give more space to items and allow wrapping
      }
    });
    
    doc.save(`report_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  const downloadBillPDF = (tx: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text("INVOICE", 105, 25, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Transaction ID: ${tx._id}`, 20, 45);
    doc.text(`Date: ${format(new Date(tx.createdAt), "PPPPp")}`, 20, 52);
    doc.text(`Seller: ${tx.sellerName}`, 20, 59);
    
    const itemData = tx.items?.map((item: any) => [
      item.name,
      `${item.quantity} ${item.unit || "pcs"}`,
      `Rs. ${item.sellingPrice}`,
      `Rs. ${item.total}`
    ]) || [];

    autoTable(doc, {
      head: [["Item Name", "Qty", "Price", "Amount"]],
      body: itemData,
      startY: 70,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      foot: [["", "", "Grand Total", `Rs. ${tx.total}`]],
      footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    
    doc.save(`invoice_${tx._id.substring(tx._id.length - 8)}.pdf`);
    toast.success("Invoice Downloaded", { 
      description: "Bill has been saved as PDF" 
    });
  };

  const openDetail = (tx: any) => {
    setSelectedTx(tx);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-primary flex items-center gap-2">
            <Receipt className="w-8 h-8" /> Billing History
          </h1>
          <p className="text-muted-foreground mt-1 font-medium italic">Review past transactions and reconcile records.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="grid grid-cols-3 sm:flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={exportExcel} className="border-green-600 text-green-700 hover:bg-green-50 shadow-sm px-2 sm:px-3">
              <FileText className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} className="border-blue-600 text-blue-700 hover:bg-blue-50 shadow-sm px-2 sm:px-3">
              <FileDown className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">CSV</span>
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF} className="border-red-600 text-red-700 hover:bg-red-50 shadow-sm px-2 sm:px-3">
              <Download className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isRefetching} className="hidden sm:flex">
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID or Seller..."
            className="pl-10 h-10 rounded-xl bg-muted/20 border-transparent focus:bg-white transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border shrink-0">
            <Button 
                variant={period === "today" ? "secondary" : "ghost"} 
                size="sm" 
                className="h-8 rounded-lg text-xs font-bold"
                onClick={() => handlePeriodChange("today")}
            >
              Today
            </Button>
            <Button 
                variant={period === "week" ? "secondary" : "ghost"} 
                size="sm" 
                className="h-8 rounded-lg text-xs font-bold"
                onClick={() => handlePeriodChange("week")}
            >
              This Week
            </Button>
            <Button 
                variant={period === "all" ? "secondary" : "ghost"} 
                size="sm" 
                className="h-8 rounded-lg text-xs font-bold"
                onClick={() => handlePeriodChange("all")}
            >
              All Time
            </Button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 rounded-xl border-dashed shrink-0">
                <Calendar className="w-4 h-4 mr-2 text-primary" /> 
                {dateRange ? `${format(new Date(dateRange.start), "MMM d")} - ${format(new Date(dateRange.end), "MMM d")}` : "Custom Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-sm">Select Range</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Start</span>
                      <input 
                        type="date" 
                        className="w-full p-2 border rounded-md text-sm" 
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value).toISOString(), end: prev?.end || "" }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">End</span>
                      <input 
                        type="date" 
                        className="w-full p-2 border rounded-md text-sm" 
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value).toISOString(), start: prev?.start || "" }))}
                      />
                    </div>
                  </div>
                </div>
                <Button className="w-full" size="sm" onClick={() => setPeriod("custom")}>Apply Filter</Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Select onValueChange={(val) => {
              const [field, order] = val.split(":");
              setSortField(field);
              setSortOrder(order as "asc" | "desc");
          }}>
            <SelectTrigger className="w-full sm:w-[140px] h-10 rounded-xl shrink-0">
              <Filter className="w-3 h-3 mr-2" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:desc">Newest First</SelectItem>
              <SelectItem value="createdAt:asc">Oldest First</SelectItem>
              <SelectItem value="total:desc">Amount (High)</SelectItem>
              <SelectItem value="total:asc">Amount (Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-2xl bg-white shadow-xl overflow-hidden relative">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-32 font-bold py-4 whitespace-nowrap">Transaction ID</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary transition-colors font-bold"
                onClick={() => toggleSort("createdAt")}
              >
                <div className="flex items-center gap-1">
                  Date & Time <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="font-bold">Seller</TableHead>
              <TableHead className="text-right font-bold">Items</TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:text-primary transition-colors font-bold"
                onClick={() => toggleSort("total")}
              >
                <div className="flex items-center justify-end gap-1">
                  Total <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="font-bold">Payment</TableHead>
              <TableHead className="text-right font-bold pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={7} className="h-60 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary opacity-50"/></TableCell></TableRow>
            ) : transactions.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="text-center py-20">
                   <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                      <Receipt className="w-16 h-16" />
                      <div>
                        <p className="text-lg font-bold">No History Found</p>
                        <p className="text-sm">Try adjusting your filters or search query.</p>
                      </div>
                   </div>
                 </TableCell>
               </TableRow>
            ) : (
              transactions.map((tx: any) => (
                <TableRow 
                    key={tx._id} 
                    className="cursor-pointer hover:bg-muted/30 transition-colors group"
                    onClick={() => openDetail(tx)}
                >
                  <TableCell className="font-black text-primary py-4">
                    <span className="text-[10px] text-muted-foreground mr-1 opacity-50">#</span>
                    {tx._id.substring(tx._id.length - 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(new Date(tx.createdAt), "MMM d, yyyy")}
                    <span className="text-muted-foreground ml-2 text-xs">{format(new Date(tx.createdAt), "p")}</span>
                  </TableCell>
                  <TableCell className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                    {tx.sellerName}
                  </TableCell>
                  <TableCell className="text-right font-bold text-muted-foreground">
                    {tx.items?.length || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-md font-black text-foreground">₹{tx.total}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-bold text-[10px] uppercase px-1.5 py-0">
                        {tx.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                        onClick={(e) => downloadBillPDF(tx, e)}
                        title="Download Bill"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-2 duration-300" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      <TransactionDetailSheet 
        transaction={selectedTx} 
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen} 
      />

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          {pagination?.total && <span>{pagination.total} total records</span>}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span>Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
