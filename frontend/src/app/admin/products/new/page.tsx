"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useState, useRef, useEffect } from "react";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryIds: z.array(z.string()).min(1, "At least one category is required"),
  type: z.enum(["measurable", "non-measurable"]),
  unit: z.string().min(1, "Unit is required"),
  stock: z.number().min(0),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  lowStockThreshold: z.number().min(0),
  isSmallProduct: z.boolean().default(false),
  comesInBoxes: z.boolean().default(false),
  itemsPerBox: z.coerce.number().nullable(),
  boxCostPrice: z.coerce.number().nullable(),
  numBoxes: z.coerce.number().nullable(),
  status: z.enum(["active", "inactive"]),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: catRes } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const res = await api.get("/categories?limit=100");
      return res.data;
    },
  });
  const categories = catRes?.data || [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      categoryIds: [],
      type: "non-measurable",
      unit: "piece",
      stock: 0,
      costPrice: 0,
      sellingPrice: 0,
      lowStockThreshold: 10,
      isSmallProduct: false,
      comesInBoxes: false,
      itemsPerBox: null,
      boxCostPrice: null,
      numBoxes: null,
      status: "active",
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

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      if (!imageFile) throw new Error("Product image is mandatory");
      
      const formData = new FormData();
      (Object.keys(data) as Array<keyof ProductFormValues>).forEach((key) => {
        const val = data[key];
        if (key === "categoryIds" && Array.isArray(val)) {
            val.forEach(id => formData.append("categories", id));
        } else if (val !== null && val !== undefined) {
          formData.append(key, String(val));
        }
      });
      formData.append("image", imageFile);
      
      const res = await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Product created successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/admin/products");
    },
    onError: (err: any) => {
      toast.error(err.message || err.response?.data?.error?.message || "Failed to create product");
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-12 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Upload image and set product name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image */}
            <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed rounded-lg bg-muted/10">
              {imagePreview ? (
                <div className="relative group">
                  <img src={imagePreview} className="w-40 h-40 object-cover rounded-xl shadow-md" alt="Preview" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-40 flex flex-col items-center justify-center bg-muted/30 rounded-xl text-muted-foreground border-2 border-muted">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                  <span className="text-xs font-medium">Image Required*</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? "Change Image" : "Upload Mandatory Image"}
              </Button>
            </div>

            <div className="space-y-1">
              <Label htmlFor="name">Product Name*</Label>
              <Input id="name" {...register("name")} placeholder="e.g. Dairy Milk Silk" className="h-11" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Categories* (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto bg-muted/5">
                {categories.map((cat: any) => (
                   <label key={cat._id} className="flex items-center gap-2 p-1 hover:bg-muted/10 cursor-pointer rounded">
                     <Controller
                        name="categoryIds"
                        control={control}
                        render={({ field }) => (
                          <input
                             type="checkbox"
                             className="rounded border-gray-300 text-primary focus:ring-primary"
                             checked={field.value.includes(cat._id)}
                             onChange={(e) => {
                               const newVal = e.target.checked 
                                 ? [...field.value, cat._id] 
                                 : field.value.filter((id: string) => id !== cat._id);
                               field.onChange(newVal);
                             }}
                          />
                        )}
                     />
                     <span className="text-sm">{cat.name}</span>
                   </label>
                ))}
              </div>
              {errors.categoryIds && <p className="text-xs text-destructive">{errors.categoryIds.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Configuration</CardTitle>
            <CardDescription>Define type, units, and stock logic</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Product Type*</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non-measurable">Non-Measurable (Discrete)</SelectItem>
                        <SelectItem value="measurable">Measurable (Weight/Vol)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1">
                <Label>Base Unit*</Label>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
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

            {/* Box Purchase Logic for Non-Measurable */}
            {watchType === "non-measurable" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-xl bg-violet-50/30 border-violet-100">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-violet-900">Purchased in Boxes?</p>
                    <p className="text-xs text-violet-600/70">Enable to calculate per-piece cost from box price</p>
                  </div>
                  <Controller name="comesInBoxes" control={control} render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )} />
                </div>

                {watchComesInBoxes && (
                  <div className="grid grid-cols-3 gap-4 p-4 border rounded-xl bg-muted/5 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Num Boxes</Label>
                      <Input type="number" {...register("numBoxes", { valueAsNumber: true })} placeholder="10" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Items/Box</Label>
                      <Input type="number" {...register("itemsPerBox", { valueAsNumber: true })} placeholder="24" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cost/Box (₹)</Label>
                      <Input type="number" step="any" {...register("boxCostPrice", { valueAsNumber: true })} placeholder="240" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <Label className="flex justify-between">
                  <span>Cost (₹)*</span>
                  {watchComesInBoxes && <span className="text-[10px] text-violet-600 font-bold">AUTO</span>}
                </Label>
                <Input type="number" step="any" {...register("costPrice", { valueAsNumber: true })} disabled={watchComesInBoxes} className={watchComesInBoxes ? "bg-muted/50" : ""} />
              </div>
              <div className="space-y-1">
                <Label>Selling (₹)*</Label>
                <Input type="number" step="any" {...register("sellingPrice", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label className="flex justify-between">
                  <span>Stock*</span>
                  {watchComesInBoxes && <span className="text-[10px] text-violet-600 font-bold">AUTO</span>}
                </Label>
                <Input type="number" step="any" {...register("stock", { valueAsNumber: true })} disabled={watchComesInBoxes} className={watchComesInBoxes ? "bg-muted/50" : ""} />
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-xl bg-orange-50/30 border-orange-100">
               <div className="flex-1 space-y-0.5">
                  <p className="font-semibold text-sm text-orange-900">Low Stock Alert</p>
                  <p className="text-xs text-orange-600/70">Notify when stock drops below this value</p>
               </div>
               <Input type="number" {...register("lowStockThreshold", { valueAsNumber: true })} className="w-24 bg-white" />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Link href="/admin/products"><Button type="button" variant="outline" className="h-12 px-8">Cancel</Button></Link>
          <Button type="submit" disabled={createMutation.isPending} className="h-12 px-10 font-bold">
            {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : <><Save className="w-4 h-4 mr-2" />Create Product</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
