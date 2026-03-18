"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  IndianRupee, ShoppingCart, Package, AlertTriangle, Users, 
  TrendingUp, TrendingDown, ArrowRight, RefreshCw, Clock,
  BarChart3, Star, Tag, Archive, Loader2
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color, href }: any) {
  const content = (
    <Card className={`relative overflow-hidden border-l-4 ${color} hover:shadow-lg transition-all duration-300 cursor-pointer group`}>
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs md:text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl md:text-3xl font-black tracking-tight">{value}</p>
            {subtitle && <p className="text-[10px] md:text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="p-2.5 md:p-3 rounded-2xl bg-muted/40 group-hover:scale-110 transition-transform">
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>
        {trendValue !== undefined && (
          <div className={`flex items-center gap-1 mt-3 text-[10px] md:text-xs font-bold ${trendValue >= 0 ? "text-[var(--success)]" : "text-[var(--destructive)]"}`}>
            {trendValue >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trendValue)}% vs yesterday
          </div>
        )}
        {href && <ArrowRight className="absolute right-4 bottom-4 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

// Mini bar chart (pure CSS/SVG - no extra dependencies)
function MiniBarChart({ data }: { data: { day: string; total: number }[] }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="flex items-end gap-1.5 h-24 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="relative w-full flex items-end justify-center h-16">
            <div
              className="w-full rounded-t-md bg-primary/20 group-hover:bg-primary/50 transition-all duration-300 relative"
              style={{ height: `${(d.total / max) * 100}%`, minHeight: 4 }}
            >
              <div className="absolute inset-0 rounded-t-md bg-gradient-to-t from-primary to-primary/60 opacity-0 group-hover:opacity-100 transition-opacity" />
              {d.total > 0 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-1 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: statsRes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin_dashboard"],
    queryFn: async () => {
      const res = await api.get("/dashboard/admin");
      return res.data;
    },
    refetchInterval: 60000, // auto-refresh every 60s
  });

  const stats = statsRes?.data;
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace("/api", "") || "http://localhost:5000";
  const getImg = (imgs: any[]) => imgs?.[0]?.url ? (imgs[0].url.startsWith("http") ? imgs[0].url : `${baseUrl}${imgs[0].url}`) : null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} className="w-full sm:w-auto">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats?.revenue?.today || 0)}
          subtitle={`Yesterday: ${formatCurrency(stats?.revenue?.yesterday || 0)}`}
          icon={IndianRupee}
          trendValue={stats?.revenue?.todayChange}
          color="border-l-green-500"
        />
        <StatCard
          title="Today's Sales"
          value={`${stats?.transactions?.todayCount || 0} bills`}
          subtitle={`${stats?.transactions?.allTime || 0} all time`}
          icon={ShoppingCart}
          color="border-l-blue-500"
          href="/admin"
        />
        <StatCard
          title="Active Products"
          value={stats?.products?.total || 0}
          subtitle={`${stats?.products?.lowStock || 0} need restock`}
          icon={Package}
          color="border-l-[var(--brand)]"
          href="/admin/products"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats?.products?.lowStock || 0}
          subtitle="Require restocking soon"
          icon={AlertTriangle}
          color={(stats?.products?.lowStock || 0) > 0 ? "border-l-[var(--destructive)]" : "border-l-muted"}
          href="/admin/products"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl"><Users className="w-6 h-6 text-blue-700" /></div>
            <div>
              <p className="text-sm font-medium text-blue-700">Total Users</p>
              <p className="text-2xl font-black text-blue-900">{stats?.users?.total || 0}</p>
            </div>
            <Link href="/admin/users" className="ml-auto"><ArrowRight className="w-5 h-5 text-blue-400 hover:text-blue-700 transition-colors" /></Link>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-amber-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl"><IndianRupee className="w-6 h-6 text-amber-700" /></div>
            <div>
              <p className="text-sm font-medium text-amber-700">This Month</p>
              <p className="text-2xl font-black text-amber-900">{formatCurrency(stats?.revenue?.thisMonth || 0)}</p>
            </div>
            {stats?.revenue?.monthChange !== undefined && (
              <div className={`ml-auto text-xs font-bold ${stats.revenue.monthChange >= 0 ? "text-green-600" : "text-red-500"}`}>
                {stats.revenue.monthChange >= 0 ? "+" : ""}{stats.revenue.monthChange}% vs last
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl"><BarChart3 className="w-6 h-6 text-purple-700" /></div>
            <div>
              <p className="text-sm font-medium text-purple-700">All Time Revenue</p>
              <p className="text-2xl font-black text-purple-900">{formatCurrency(stats?.revenue?.allTime || 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="bg-muted/50 w-full sm:w-auto inline-flex md:flex justify-start">
            <TabsTrigger value="overview" className="shrink-0">📊 Overview</TabsTrigger>
            <TabsTrigger value="lowstock" className="shrink-0 relative">
              ⚠️ Low Stock
              {(stats?.products?.lowStock || 0) > 0 && (
                <Badge className="ml-2 bg-[var(--destructive)] text-destructive-foreground text-[9px] px-1.5 py-0 h-4">
                  {stats.products.lowStock}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="recent" className="shrink-0">🧾 Recent Sales</TabsTrigger>
            <TabsTrigger value="topsellers" className="shrink-0">⭐ Top Products</TabsTrigger>
          </TabsList>
        </div>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 7-Day Sales Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[var(--brand)]" /> Last 7 Days Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MiniBarChart data={stats?.charts?.dailySales || []} />
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total 7-day: <strong className="text-foreground">{formatCurrency(stats?.charts?.dailySales?.reduce((s: number, d: any) => s + d.total, 0) || 0)}</strong></span>
                  <span>Bills: <strong className="text-foreground">{stats?.charts?.dailySales?.reduce((s: number, d: any) => s + d.count, 0) || 0}</strong></span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {[
                  { href: "/admin/products/new", icon: Package, label: "Add Product", desc: "Create new inventory item", color: "bg-violet-50 hover:bg-violet-100 text-violet-700" },
                  { href: "/admin/categories", icon: Tag, label: "Categories", desc: "Manage product groups", color: "bg-blue-50 hover:bg-blue-100 text-blue-700" },
                  { href: "/admin/users", icon: Users, label: "Add Seller", desc: "Create staff account", color: "bg-green-50 hover:bg-green-100 text-green-700" },
                  { href: "/admin/settings", icon: Archive, label: "POS Settings", desc: "Quick mode tags", color: "bg-amber-50 hover:bg-amber-100 text-amber-700" },
                ].map(item => (
                  <Link key={item.href} href={item.href}>
                    <div className={`${item.color} rounded-xl p-4 h-full transition-colors cursor-pointer`}>
                      <item.icon className="w-6 h-6 mb-2" />
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className="text-xs opacity-70 mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LOW STOCK TAB */}
        <TabsContent value="lowstock" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Low Stock Products
              </CardTitle>
              <Link href="/admin/products">
                <Button variant="outline" size="sm">View All Products <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!stats?.products?.lowStockList?.length ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">All products are well stocked! 🎉</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.products.lowStockList.map((p: any) => {
                    const imgUrl = getImg(p.images);
                    const pct = Math.round((p.stock / (p.lowStockThreshold || 10)) * 100);
                    const isOut = p.stock <= 0;
                    return (
                      <div key={p._id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-muted/30 ${isOut ? "bg-red-50" : "bg-orange-50/50"}`}>
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                          {imgUrl ? <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 m-auto mt-2.5 text-muted-foreground opacity-50" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-muted/50 rounded-full h-1.5 max-w-[120px]">
                              <div className={`h-1.5 rounded-full ${isOut ? "bg-red-500" : pct < 50 ? "bg-orange-500" : "bg-yellow-400"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className={`text-xs font-bold ${isOut ? "text-red-600" : "text-orange-600"}`}>
                              {isOut ? "OUT OF STOCK" : `${p.stock} left`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">Threshold</p>
                          <p className="text-sm font-bold">{p.lowStockThreshold}</p>
                        </div>
                        <Link href={`/admin/products/${p._id}`}>
                          <Button variant="ghost" size="sm" className="text-xs h-8">Restock</Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RECENT TRANSACTIONS */}
        <TabsContent value="recent" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Recent Transactions
              </CardTitle>
              <Link href="/seller/history">
                <Button variant="outline" size="sm">Full History <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!stats?.recentTransactions?.length ? (
                <div className="py-12 text-center text-muted-foreground opacity-50">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3" />
                  <p>No transactions found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentTransactions.map((tx: any) => (
                    <div key={tx._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">#{tx._id.slice(-6).toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">{tx.sellerName} · {tx.items?.length || 0} items</p>
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

        {/* TOP PRODUCTS */}
        <TabsContent value="topsellers" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" /> Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!stats?.charts?.topProducts?.length ? (
                <div className="py-12 text-center text-muted-foreground opacity-50">
                  <Star className="w-12 h-12 mx-auto mb-3" />
                  <p>No sales data yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.charts.topProducts.map((p: any, i: number) => {
                    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                        <span className="text-xl w-8 text-center">{medals[i]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{p.name || "Quick Add Item"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min((p.totalSold / stats.charts.topProducts[0].totalSold) * 100, 100)}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-sm">{p.totalSold} units</p>
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
