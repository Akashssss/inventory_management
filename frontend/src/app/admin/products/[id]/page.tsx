"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Image as ImageIcon, X, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Name is too long"),
  categoryIds: z.array(z.string()).min(1, "At least one category is required"),
  type: z.enum(["measurable", "non-measurable"]),
  unit: z.string().min(1, "Base unit is required"),
  stock: z.coerce.number({ message: "Stock must be a number" }).min(0, "Stock cannot be negative"),
  costPrice: z.coerce.number({ message: "Cost price must be a number" }).min(0, "Price cannot be negative"),
  sellingPrice: z.coerce.number({ message: "Selling price must be a number" }).min(0, "Price cannot be negative"),
  lowStockThreshold: z.coerce.number({ message: "Threshold must be a number" }).min(0, "Threshold cannot be negative").default(10),
  isSmallProduct: z.boolean().default(false),
  comesInBoxes: z.boolean().default(false),
  itemsPerBox: z.coerce.number().nullable(),
  boxCostPrice: z.coerce.number().nullable(),
  numBoxes: z.coerce.number().nullable(),
  status: z.enum(["active", "inactive"]),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "",
      categoryIds: [],
      type: "non-measurable",
      unit: "piece",
      stock: 0,
      costPrice: 0,
      sellingPrice: 0,
      lowStockThreshold: 10,
      status: "active",
      isSmallProduct: false,
      comesInBoxes: false,
      itemsPerBox: null,
      boxCostPrice: null,
      numBoxes: null,
    },
  });

  const watchType = watch("type");
  const watchComesInBoxes = watch("comesInBoxes");
  const watchItemsPerBox = watch("itemsPerBox");
  const watchBoxCostPrice = watch("boxCostPrice");
  const watchNumBoxes = watch("numBoxes");
  const watchUnit = watch("unit");

  useEffect(() => {
    if (watchType === "measurable") {
      if (watchUnit === "piece" || watchUnit === "box") {
        setValue("unit", "kg");
      }
    } else {
       if (watchUnit !== "piece" && watchUnit !== "box") {
         setValue("unit", "piece");
       }
    }
  }, [watchType, watchUnit, setValue]);

  useEffect(() => {
    if (watchType === "non-measurable" && watchComesInBoxes && watchItemsPerBox && watchItemsPerBox > 0) {
       if (watchBoxCostPrice) {
          setValue("costPrice", Number((watchBoxCostPrice / watchItemsPerBox).toFixed(2)));
       }
       if (watchNumBoxes) {
          setValue("stock", watchNumBoxes * watchItemsPerBox);
       }
    }
  }, [watchType, watchComesInBoxes, watchItemsPerBox, watchBoxCostPrice, watchNumBoxes, setValue]);

  const { data: categoriesRes } = useQuery({
    queryKey: ["categories_dropdown"],
    queryFn: async () => {
      const res = await api.get("/categories?limit=100");
      return res.data;
    },
  });
  const categories = categoriesRes?.data || [];
  const categoryOptions = categories.map((c: any) => ({ label: c.name, value: c._id }));

  const { data: productRes, isLoading: isProductLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}`);
      return res.data;
    },
  });

  useEffect(() => {
    if (productRes?.data) {
      const p = productRes.data;
      reset({
        name: p.name,
        categoryIds: p.categories?.map((c: any) => typeof c === 'object' ? c._id : c) || [],
        type: p.type,
        unit: p.unit || "piece",
        stock: p.stock || 0,
        costPrice: p.costPrice || 0,
        sellingPrice: p.sellingPrice || 0,
        lowStockThreshold: p.lowStockThreshold || 10,
        status: p.status || "active",
        isSmallProduct: p.isSmallProduct || false,
        comesInBoxes: p.comesInBoxes || false,
        itemsPerBox: p.itemsPerBox || null,
        boxCostPrice: p.boxCostPrice || null,
        numBoxes: p.numBoxes || null,
      });

      if (p.images && p.images.length > 0) {
        const imageUrl = p.images[0].url;
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace("/api", "") || "http://localhost:5000";
        setPreviewUrl(imageUrl.startsWith("http") ? imageUrl : `${baseUrl}${imageUrl}`);
      }
    }
  }, [productRes, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const formData = new FormData();
      (Object.keys(data) as Array<keyof ProductFormValues>).forEach((key) => {
        const value = data[key];
        if (key === "categoryIds" && Array.isArray(value)) {
            value.forEach(id => formData.append("categories", id));
        } else if (value !== null && value !== undefined) {
           formData.append(key, value.toString());
        }
      });

      if (imageFile) {
         formData.append("image", imageFile);
      }

      const res = await api.put(`/products/${productId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated successfully!");
      router.push("/admin/products");
    },
    onError: (err: any) => {
      toast.error(err.message || err.response?.data?.error?.message || "Failed to update product.");
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setImageError("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  if (isProductLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto pb-20 space-y-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">Edit Product</h1>
            <p className="text-sm text-muted-foreground font-medium italic">Update information and technical parameters for <span className="text-primary font-bold">{productRes?.data?.name}</span></p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Basic Information */}
        <div className="xl:col-span-5 space-y-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">01</span>
                Basic Information
              </CardTitle>
              <CardDescription>Visual identification and classification</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Image Upload */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Product Image {imageError && <AlertCircle className="w-4 h-4 text-destructive" />}
                </Label>
                <div className={cn(
                  "flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-2xl transition-all duration-300",
                  previewUrl ? "border-primary/20 bg-primary/5" : "border-slate-200 bg-slate-50/50 hover:border-primary/30",
                  imageError && "border-destructive/30 bg-destructive/5"
                )}>
                  {previewUrl ? (
                    <div className="relative group">
                      <img src={previewUrl} className="w-48 h-48 object-contain rounded-xl bg-white shadow-xl p-2" alt="Preview" />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2.5 shadow-lg border-2 border-white hover:scale-110 transition-transform"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-48 h-48 flex flex-col items-center justify-center bg-white rounded-xl text-slate-400 border-2 border-slate-100 shadow-inner">
                      <ImageIcon className="w-16 h-16 mb-4 opacity-10" />
                      <div className="text-center px-4">
                        <span className="text-[10px] uppercase font-black tracking-widest block mb-1">Max Size 5MB</span>
                        <span className="text-xs font-bold leading-tight">No Image Selected</span>
                      </div>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  <div className="flex flex-col items-center gap-2">
                    <Button 
                      type="button" 
                      variant={imageError ? "destructive" : "outline"} 
                      className="rounded-full px-6 font-bold"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {previewUrl ? "Change Image" : "Upload Image"}
                    </Button>
                    {imageError && <p className="text-[10px] text-destructive font-black uppercase tracking-tighter">{imageError}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold text-slate-700">Product Name*</Label>
                <Input 
                  id="name" 
                  {...register("name")} 
                  placeholder="e.g. Dairy Milk Silk" 
                  className={cn("h-12 text-base font-medium rounded-xl border-2 focus-visible:ring-primary/20", errors.name && "border-destructive/50")} 
                />
                {errors.name && <p className="text-[10px] text-destructive font-black uppercase tracking-widest pl-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Categories*</Label>
                <Controller
                  name="categoryIds"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      options={categoryOptions}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder="Search and select categories..."
                      className={cn("border-2 rounded-xl h-auto min-h-12", errors.categoryIds && "border-destructive/50")}
                    />
                  )}
                />
                {errors.categoryIds && <p className="text-[10px] text-destructive font-black uppercase tracking-widest pl-1">{errors.categoryIds.message}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Configuration & Technical */}
        <div className="xl:col-span-7 space-y-6">
          <Card className="border-2 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">02</span>
                Product Configuration
              </CardTitle>
              <CardDescription>Units, Pricing and Stock control</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Type of Product*</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-12 border-2 rounded-xl font-medium"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="non-measurable">Discrete / Units (Non-Measurable)</SelectItem>
                          <SelectItem value="measurable">Bulk / Weight (Measurable)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && <p className="text-[10px] text-destructive font-black uppercase tracking-widest pl-1">{errors.type.message}</p>}
                </div>

                <div className="space-y-2">
                   <Label className="text-sm font-bold text-slate-700">Base Unit*</Label>
                   <Controller
                    name="unit"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-12 border-2 rounded-xl font-medium"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {watchType === "measurable" ? (
                            <>
                              <SelectItem value="kg">kilogram (kg)</SelectItem>
                              <SelectItem value="g">gram (g)</SelectItem>
                              <SelectItem value="l">liter (l)</SelectItem>
                              <SelectItem value="ml">milliliter (ml)</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="piece">piece</SelectItem>
                              <SelectItem value="box">box</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.unit && <p className="text-[10px] text-destructive font-black uppercase tracking-widest pl-1">{errors.unit.message}</p>}
                </div>
              </div>

              {/* Box Purchase Logic */}
              {watchType === "non-measurable" && (
                <div className={cn(
                  "p-6 rounded-2xl border-2 transition-all duration-300",
                  watchComesInBoxes ? "bg-violet-50/50 border-violet-200" : "bg-slate-50 border-slate-100"
                )}>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <p className="font-black text-sm text-violet-900 uppercase tracking-tight">Box-Based Purchasing</p>
                      <p className="text-xs text-violet-600 font-medium">Auto-calculates individual cost from box price</p>
                    </div>
                    <Controller name="comesInBoxes" control={control} render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-violet-600" />
                    )} />
                  </div>

                  {watchComesInBoxes && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-violet-100 animate-in fade-in slide-in-from-top-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-violet-700 tracking-widest">Boxes Current</Label>
                        <Input type="number" {...register("numBoxes")} placeholder="0" className="h-11 border-2 rounded-xl border-violet-100 bg-white font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-violet-700 tracking-widest">Items / Box</Label>
                        <Input type="number" {...register("itemsPerBox")} placeholder="24" className="h-11 border-2 rounded-xl border-violet-100 bg-white font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-violet-700 tracking-widest">Cost / Box (₹)</Label>
                        <Input type="number" step="any" {...register("boxCostPrice")} placeholder="0.00" className="h-11 border-2 rounded-xl border-violet-100 bg-white font-bold" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 flex justify-between">
                    <span>Cost Price*</span>
                    {watchComesInBoxes && <Badge className="bg-violet-100 text-violet-700 border-none px-1.5 py-0 text-[8px] h-4">AUTO</Badge>}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <Input 
                      type="number" 
                      step="any" 
                      {...register("costPrice")} 
                      disabled={watchComesInBoxes} 
                      className={cn("h-12 pl-8 border-2 rounded-xl font-black text-base", watchComesInBoxes ? "bg-slate-100/50 text-slate-500" : "bg-white", errors.costPrice && "border-destructive/50")} 
                    />
                  </div>
                  {errors.costPrice && <p className="text-[10px] text-destructive font-black uppercase tracking-widest pl-1">{errors.costPrice.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Selling Price*</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <Input 
                      type="number" 
                      step="any" 
                      {...register("sellingPrice")} 
                      className={cn("h-12 pl-8 border-2 rounded-xl font-black text-base transition-all focus:border-[var(--seller)]", errors.sellingPrice && "border-destructive/50")} 
                    />
                  </div>
                  {errors.sellingPrice && <p className="text-[10px] text-destructive font-black uppercase tracking-widest pl-1">{errors.sellingPrice.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 flex justify-between">
                    <span>Stock Level*</span>
                    {watchComesInBoxes && <Badge className="bg-violet-100 text-violet-700 border-none px-1.5 py-0 text-[8px] h-4">AUTO</Badge>}
                  </Label>
                  <Input 
                    type="number" 
                    step="any" 
                    {...register("stock")} 
                    disabled={watchComesInBoxes} 
                    className={cn("h-12 border-2 rounded-xl font-black text-base", watchComesInBoxes ? "bg-slate-100/50 text-slate-500" : "bg-white", errors.stock && "border-destructive/50")} 
                  />
                  {errors.stock && <p className="text-[10px] text-destructive font-black uppercase tracking-widest pl-1">{errors.stock.message}</p>}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-4 border-t border-slate-100">
                <div className="flex-1 space-y-1">
                   <p className="font-black text-sm text-orange-900 uppercase tracking-tight italic flex items-center gap-2">
                     <AlertCircle className="w-4 h-4" /> Low Stock Warning
                   </p>
                   <p className="text-[11px] text-orange-600 font-medium">Notify when inventory drops below this quantity</p>
                </div>
                <div className="w-full sm:w-auto">
                   <Input 
                     type="number" 
                     {...register("lowStockThreshold")} 
                     className="w-full sm:w-32 h-12 bg-white border-2 border-orange-100 rounded-xl font-black text-center text-orange-900 focus-visible:ring-orange-200" 
                   />
                   {errors.lowStockThreshold && <p className="text-[10px] text-destructive font-black uppercase tracking-widest mt-1 text-center">{errors.lowStockThreshold.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="p-6 rounded-2xl border-2 border-primary/10 bg-primary/5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-slate-900">Small Product</p>
                    <p className="text-xs text-muted-foreground font-medium">Quick selection in POS</p>
                  </div>
                  <Controller
                    name="isSmallProduct"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
                
                <div className="p-6 rounded-2xl border-2 border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-slate-900">Product Status</p>
                    <p className="text-xs text-muted-foreground font-medium">{watch("status") === 'active' ? 'Visible to sellers' : 'Hidden from terminal'}</p>
                  </div>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-24 h-10 border-2 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="ghost" onClick={() => router.back()} className="w-full sm:w-auto h-14 px-8 font-bold text-slate-500 rounded-2xl hover:bg-slate-100">Cancel</Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending} 
                  className="w-full sm:w-auto h-14 px-12 font-black text-lg shadow-xl shadow-primary/20 rounded-2xl active:scale-95 transition-all"
                >
                  {updateMutation.isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-3" /> Updating...</>
                  ) : (
                    <><Save className="w-5 h-5 mr-3" /> Update Product</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
