"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
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
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Image as ImageIcon, X } from "lucide-react";
import Link from "next/link";
import { useForm as useRHForm } from "react-hook-form";

// Define the schema based on your backend Product model
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryIds: z.array(z.string()).min(1, "At least one category is required"),
  type: z.enum(["measurable", "non-measurable"]),
  unit: z.string().min(1, "Unit is required"),
  stock: z.number().min(0, "Stock cannot be negative"),
  costPrice: z.number().min(0, "Cost Price must be positive"),
  sellingPrice: z.number().min(0, "Selling Price must be positive"),
  lowStockThreshold: z.number().min(0).default(10),
  isSmallProduct: z.boolean(),
  comesInBoxes: z.boolean(),
  itemsPerBox: z.number().nullable(),
  boxCostPrice: z.number().nullable(),
  numBoxes: z.number().nullable(),
  status: z.enum(["active", "inactive"]),
  image: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = params.id === "new";
  const productId = params.id as string;

  // Form setup
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

  // Auto-calculate logic for Boxes
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

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
  };

  // Fetch Categories for dropdown
  const { data: categoriesRes } = useQuery({
    queryKey: ["categories_dropdown"],
    queryFn: async () => {
      const res = await api.get("/categories?limit=100");
      return res.data;
    },
  });
  const categoriesDb = categoriesRes?.data || [];

  // Fetch product data if editing
  const { data: productRes, isLoading: isProductLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (isNew) return null;
      const res = await api.get(`/products/${productId}`);
      return res.data;
    },
    enabled: !isNew,
  });

  // Populate form on load
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

  // Mutation to save 
  const mutation = useMutation({
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

      const config = { headers: { "Content-Type": "multipart/form-data" } };

      if (isNew) {
        if (!imageFile) throw new Error("Image is mandatory for new products");
        const res = await api.post("/products", formData, config);
        return res.data;
      } else {
        const res = await api.put(`/products/${productId}`, formData, config);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(isNew ? "Product created successfully!" : "Product updated successfully!");
      router.push("/admin/products");
    },
    onError: (err: any) => {
      toast.error(err.message || err.response?.data?.error?.message || "Failed to save product.");
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    mutation.mutate(data);
  };

  if (!isNew && isProductLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isNew ? "Create Product" : "Edit Product"}
        </h1>
      </div>

      <form onSubmit={handleSubmit((data) => onSubmit(data as ProductFormValues))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
            <CardDescription>Main configuration and image</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md gap-4 bg-muted/5">
              <div className="space-y-0.5 max-w-sm">
                <Label className="text-base font-semibold">Product Image*</Label>
                <p className="text-sm text-muted-foreground">
                  A clear image is required for easy identification.
                </p>
              </div>
              <div className="flex items-center gap-4">
                {previewUrl ? (
                  <div className="relative w-32 h-32 border rounded-xl overflow-hidden bg-white shadow-sm group">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed rounded-xl flex items-center justify-center bg-muted/30">
                    <ImageIcon className="w-10 h-10 text-muted-foreground opacity-30" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    className="max-w-[200px]" 
                    onChange={handleImageChange} 
                  />
                  <p className="text-[10px] text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Product Name*</Label>
                <Input {...register("name")} placeholder="e.g. Dairy Milk Silk" className="h-11" />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Categories* (Multi-select)</Label>
                <div className="grid grid-cols-1 gap-1 border rounded-md p-3 max-h-40 overflow-y-auto bg-muted/5">
                  {categoriesDb.map((c: any) => (
                    <label key={c._id} className="flex items-center gap-2 p-1 hover:bg-muted/10 cursor-pointer rounded">
                        <Controller
                            name="categoryIds"
                            control={control}
                            render={({ field }) => (
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    checked={field.value.includes(c._id)}
                                    onChange={(e) => {
                                        const newVal = e.target.checked
                                            ? [...field.value, c._id]
                                            : field.value.filter((id: string) => id !== c._id);
                                        field.onChange(newVal);
                                    }}
                                />
                            )}
                        />
                        <span className="text-sm">{c.name}</span>
                    </label>
                  ))}
                </div>
                {errors.categoryIds && <p className="text-red-500 text-sm">{errors.categoryIds.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Product Type*</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non-measurable">Discrete / Units (Non-Measurable)</SelectItem>
                        <SelectItem value="measurable">Bulk / Weight (Measurable)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Unit of Measurement*</Label>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="e.g. piece, kg" />
                      </SelectTrigger>
                      <SelectContent>
                        {watchType === "measurable" ? (
                          <>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="g">gram</SelectItem>
                            <SelectItem value="l">liter</SelectItem>
                            <SelectItem value="ml">ml</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="piece">piece</SelectItem>
                            <SelectItem value="pack">pack</SelectItem>
                            <SelectItem value="box">box</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory & Pricing</CardTitle>
            <CardDescription>Setup stock levels and purchase logic</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {watchType === "non-measurable" && (
              <div className="bg-violet-50/50 p-6 rounded-xl space-y-4 border border-violet-100">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <Label className="text-violet-900 font-bold">Purchased in Boxes?</Label>
                      <p className="text-xs text-violet-600">Calculate per-piece cost and stock automatically</p>
                   </div>
                   <Controller
                    name="comesInBoxes"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                {watchComesInBoxes && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-violet-100 ">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-violet-700">Num Boxes</Label>
                      <Input 
                        type="number" 
                        {...register("numBoxes", { valueAsNumber: true })}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-violet-700">Items per Box</Label>
                      <Input 
                        type="number" 
                        {...register("itemsPerBox", { valueAsNumber: true })}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-violet-700">Cost/Box (₹)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...register("boxCostPrice", { valueAsNumber: true })}
                        className="bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="space-y-2">
                <Label className="flex justify-between">
                    <span>Cost Price (₹)*</span>
                    {watchComesInBoxes && <span className="text-[10px] text-violet-600 font-bold uppercase">Auto</span>}
                </Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  {...register("costPrice", { valueAsNumber: true })} 
                  disabled={watchComesInBoxes}
                  className={watchComesInBoxes ? "bg-muted/50 cursor-not-allowed" : "h-11"}
                />
                {errors.costPrice && <p className="text-red-500 text-sm">{errors.costPrice.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Selling Price (₹)*</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  {...register("sellingPrice", { valueAsNumber: true })} 
                  className="h-11"
                />
                {errors.sellingPrice && <p className="text-red-500 text-sm">{errors.sellingPrice.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="flex justify-between">
                    <span>Available Stock*</span>
                    {watchComesInBoxes && <span className="text-[10px] text-violet-600 font-bold uppercase">Auto</span>}
                </Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  {...register("stock", { valueAsNumber: true })} 
                  disabled={watchComesInBoxes}
                  className={watchComesInBoxes ? "bg-muted/50 cursor-not-allowed" : "h-11"}
                />
                {errors.stock && <p className="text-red-500 text-sm">{errors.stock.message}</p>}
              </div>
            </div>

            <div className="bg-orange-50/50 p-5 rounded-lg border border-orange-100 flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label className="text-orange-900 font-bold">Low Stock Warning</Label>
                    <p className="text-xs text-orange-600">Alert threshold for notifications</p>
                </div>
                <Input 
                    type="number" 
                    {...register("lowStockThreshold", { valueAsNumber: true })} 
                    className="w-24 bg-white"
                />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div className="space-y-0.5">
                <Label className="text-base">Small POS Product</Label>
                <p className="text-sm text-muted-foreground">
                  Allow quick checkout for this item (detected based on price threshold).
                </p>
              </div>
              <Controller
                name="isSmallProduct"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div className="space-y-0.5">
                <Label className="text-base">Status</Label>
                <p className="text-sm text-muted-foreground">Active products are visible to sellers.</p>
              </div>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-[140px] h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pb-10">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={mutation.isPending} className="h-12 px-8">
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending} className="h-12 px-10 font-bold">
            {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
