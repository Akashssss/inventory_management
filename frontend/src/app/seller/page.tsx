"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IndianRupee, ShoppingCart, AlertTriangle, ArrowRight,
  RefreshCw, Clock, Star, Package, BarChart3, Loader2,
  TrendingUp, ChevronRight, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

// Bar chart (pure CSS)
function MiniBarChart({ data }: { data: { day: string; total: number }[] }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="flex items-end gap-1.5 h-20 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="relative w-full flex items-end justify-center h-14">
            <div
              className="w-full rounded-t-lg transition-all duration-300 group-hover:opacity-80"
              style={{ height: `${(d.total / max) * 100}%`, minHeight: 4, background: "linear-gradient(to top, var(--seller), var(--seller))" }}
            >
              {d.total > 0 && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  ₹{d.total}
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: statsRes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["seller_dashboard"],
    queryFn: async () => {
      const res = await api.get("/dashboard/seller");
      return res.data;
    },
    refetchInterval: 60000,
  });

  const stats = statsRes?.data;
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace("/api", "") || "http://localhost:5000";
  const getImg = (imgs: any[]) => imgs?.[0]?.url ? (imgs[0].url.startsWith("http") ? imgs[0].url : `${baseUrl}${imgs[0].url}`) : null;
  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const weekTotal = stats?.charts?.dailySales?.reduce((s: number, d: any) => s + d.total, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-muted-foreground font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            {greeting}, {stats?.seller?.name?.split(" ")[0] || "Seller"} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            {now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {stats?.pendingReconciliation > 0 && (
            <Link href="/seller/reconciliation" className="flex-1 sm:flex-none">
              <Button variant="destructive" size="sm" className="w-full animate-pulse shadow-md">
                ⚠️ {stats.pendingReconciliation} Pending
              </Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} className={stats?.pendingReconciliation > 0 ? "px-3" : "w-full sm:w-auto"}>
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""} ${stats?.pendingReconciliation > 0 ? "" : "mr-2"}`} />
            {stats?.pendingReconciliation > 0 ? "" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Today's Summary Banner */}
      <div className="rounded-2xl bg-[var(--seller)] p-5 md:p-6 text-[var(--seller-foreground)] relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,white,transparent_50%)]" />
        <div className="relative z-10 grid grid-cols-3 gap-4 md:gap-6">
          <div>
            <p className="text-[var(--seller-foreground)]/80 text-[10px] sm:text-sm font-medium">Today's Revenue</p>
            <p className="text-2xl sm:text-4xl font-black mt-1">{formatCurrency(stats?.today?.revenue || 0)}</p>
          </div>
          <div className="border-l border-white/30 pl-4 md:pl-6">
            <p className="text-[var(--seller-foreground)]/80 text-[10px] sm:text-sm font-medium">Bills Generated</p>
            <p className="text-2xl sm:text-4xl font-black mt-1">{stats?.today?.count || 0}</p>
          </div>
          <div className="border-l border-white/30 pl-4 md:pl-6">
            <p className="text-[var(--seller-foreground)]/80 text-[10px] sm:text-sm font-medium">All Time Total</p>
            <p className="text-2xl sm:text-4xl font-black mt-1">{formatCurrency(stats?.allTime?.revenue || 0)}</p>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/seller/billing", icon: ShoppingCart, label: "New Bill", desc: "Start billing", color: "from-orange-50 to-amber-50 border-orange-200 text-orange-700" },
          { href: "/seller/reconciliation", icon: RefreshCw, label: "Reconcile", desc: "Quick adds", color: "from-blue-50 to-indigo-50 border-blue-200 text-blue-700", badge: stats?.pendingReconciliation || 0 },
          { href: "/seller/history", icon: Clock, label: "History", desc: "Past bills", color: "from-green-50 to-emerald-50 border-green-200 text-green-700" },
          { href: "/seller/history", icon: BarChart3, label: "My Stats", desc: `${stats?.allTime?.count || 0} bills`, color: "from-purple-50 to-fuchsia-50 border-purple-200 text-purple-700" },
        ].map(item => (
          <Link key={item.href + item.label} href={item.href}>
            <div className={`bg-gradient-to-br ${item.color} border rounded-xl p-4 h-full relative hover:shadow-md transition-all cursor-pointer`}>
              <item.icon className="w-6 h-6 mb-2" />
              <p className="font-bold text-sm">{item.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{item.desc}</p>
              {item.badge ? (
                <Badge className="absolute top-3 right-3 bg-red-500 text-white text-[9px] px-1.5">{item.badge}</Badge>
              ) : null}
              <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 opacity-30" />
            </div>
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="bg-muted/50 w-full sm:w-auto inline-flex md:flex justify-start">
            <TabsTrigger value="overview" className="shrink-0">📊 My Performance</TabsTrigger>
            <TabsTrigger value="lowstock" className="shrink-0 relative">
              ⚠️ Low Stock
              {(stats?.lowStock?.count || 0) > 0 && (
                <Badge className="ml-2 bg-[var(--destructive)] text-destructive-foreground text-[9px] px-1.5 py-0 h-4">{stats.lowStock.count}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="recent" className="shrink-0">🧾 My Recent Bills</TabsTrigger>
            <TabsTrigger value="top" className="shrink-0">⭐ My Top Items</TabsTrigger>
          </TabsList>
        </div>

        {/* PERFORMANCE TAB */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[var(--seller)]" /> My Last 7 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MiniBarChart data={stats?.charts?.dailySales || []} />
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">7-Day Total: <strong className="text-foreground">{formatCurrency(weekTotal)}</strong></span>
                  <div className="flex items-center gap-1 text-orange-600 font-bold">
                    <TrendingUp className="w-3 h-3" />
                    {stats?.charts?.dailySales?.filter((d: any) => d.total > 0).length || 0} active days
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Summary Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <IndianRupee className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium text-orange-800">Total Earnings</span>
                  </div>
                  <span className="font-black text-orange-800">{formatCurrency(stats?.allTime?.revenue || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-blue-800">Total Bills</span>
                  </div>
                  <span className="font-black text-blue-800">{stats?.allTime?.count || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-800">Avg Bill Value</span>
                  </div>
                  <span className="font-black text-green-800">
                    {formatCurrency(stats?.allTime?.count ? Math.round(stats.allTime.revenue / stats.allTime.count) : 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-purple-800">Pending Reconciliations</span>
                  </div>
                  <span className={`font-black ${(stats?.pendingReconciliation || 0) > 0 ? "text-red-600" : "text-purple-800"}`}>
                    {stats?.pendingReconciliation || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LOW STOCK TAB */}
        <TabsContent value="lowstock" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" /> Products Running Low
              </CardTitle>
              <p className="text-sm text-muted-foreground">These items may run out soon — inform your manager.</p>
            </CardHeader>
            <CardContent>
              {!stats?.lowStock?.list?.length ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">All products are well stocked! 🎉</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.lowStock.list.map((p: any) => {
                    const imgUrl = getImg(p.images);
                    const isOut = p.stock <= 0;
                    const pct = Math.min(Math.round((p.stock / (p.lowStockThreshold || 10)) * 100), 100);
                    return (
                      <div key={p._id} className={`flex items-center gap-3 p-3 rounded-xl ${isOut ? "bg-red-50" : "bg-amber-50/50"}`}>
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                          {imgUrl ? <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 m-auto mt-2.5 text-muted-foreground opacity-50" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-muted rounded-full h-1.5 max-w-[100px]">
                              <div className={`h-1.5 rounded-full ${isOut ? "bg-red-500" : "bg-orange-500"}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-xs font-bold ${isOut ? "text-red-600" : "text-orange-600"}`}>
                              {isOut ? "OUT" : `${p.stock} left`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                          <p>₹{p.sellingPrice}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RECENT BILLS */}
        <TabsContent value="recent" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> My Recent Bills
              </CardTitle>
              <Link href="/seller/history">
                <Button variant="outline" size="sm">Full History <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!stats?.recentTransactions?.length ? (
                <div className="py-12 text-center text-muted-foreground opacity-50">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3" />
                  <p>No bills yet. Start billing! 🚀</p>
                  <Link href="/seller/billing">
                    <Button size="sm" className="mt-4 bg-orange-500 hover:bg-orange-600">Create New Bill</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentTransactions.map((tx: any) => (
                    <div key={tx._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">#{tx._id.slice(-6).toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">{tx.items?.length || 0} items · {tx.paymentMethod}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-green-700">₹{tx.total}</p>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, h:mm a")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TOP ITEMS */}
        <TabsContent value="top" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" /> My Top Selling Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!stats?.charts?.topItems?.length ? (
                <div className="py-12 text-center text-muted-foreground opacity-50">
                  <Star className="w-12 h-12 mx-auto mb-3" />
                  <p>No sales data yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.charts.topItems.map((p: any, i: number) => {
                    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                        <span className="text-xl w-8 text-center">{medals[i] || "•"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{p._id || "Item"}</p>
                          <div className="flex-1 bg-muted rounded-full h-1.5 mt-1.5">
                            <div className="h-1.5 rounded-full bg-orange-500" style={{ width: `${Math.min((p.count / stats.charts.topItems[0].count) * 100, 100)}%` }} />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-sm">{p.count} units</p>
                          <p className="text-xs text-green-600 font-bold">₹{Math.round(p.revenue || 0)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
