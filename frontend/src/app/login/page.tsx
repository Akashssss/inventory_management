"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Store, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

import { Suspense } from "react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "admin";

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { 
        email: values.email, 
        password: values.password 
      });
      const { token, user } = res.data;

      localStorage.setItem("accessToken", token);
      localStorage.setItem("currentUser", JSON.stringify(user));

      toast.success(`Welcome back, ${user.name || 'User'}!`);

      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/seller/billing");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Login failed. Please check your credentials.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === "admin";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Background grid overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnptLTQgNHYyaC0ydi0yaDJ6bTAtNHYyaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />

      <div className="relative w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-4 ${isAdmin ? 'bg-violet-600' : 'bg-emerald-600'}`}>
            {isAdmin ? <ShieldCheck className="w-8 h-8 text-white" /> : <Store className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Confectionary</h1>
          <p className="text-slate-400 mt-1 text-sm">Inventory & POS Management</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              {isAdmin ? "Admin Login" : "Seller Login"}
            </CardTitle>
            <CardDescription className="text-slate-300">
              Enter your credentials to access the {isAdmin ? "admin dashboard" : "point of sale"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          {...field}
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-400/20"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPass ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-400/20 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full font-bold py-6 text-base ${isAdmin ? 'bg-violet-600 hover:bg-violet-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white border-0`}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing In...</>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 space-y-4 text-center">
              <button
                onClick={() => router.push(isAdmin ? "/login?role=seller" : "/login?role=admin")}
                className="text-slate-400 hover:text-slate-200 text-sm transition-colors block w-full"
              >
                Switch to {isAdmin ? "Seller" : "Admin"} login →
              </button>

              {!isAdmin && (
                <p className="text-slate-400 text-xs border-t border-white/10 pt-4">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4">
                    Create Seller Account
                  </Link>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="animate-spin text-white" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
