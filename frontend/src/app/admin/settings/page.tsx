"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Loader2, AlertCircle, Settings2, Trash2, Plus, IndianRupee, ShieldCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState("");
  const [thresholdValue, setThresholdValue] = useState("");
  const [tags, setTags] = useState<number[]>([]);
  
  // Validation states
  const [thresholdError, setThresholdError] = useState("");
  const [tagError, setTagError] = useState("");

  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await api.get("/settings");
      return res.data;
    }
  });

  useEffect(() => {
    if (settingsRes?.data) {
      setThresholdValue(String(settingsRes.data.smallProductThreshold || 10));
      setTags(settingsRes.data.smallProductTags || [1, 2, 5]);
    }
  }, [settingsRes]);

  const mutation = useMutation({
    mutationFn: async (updatedSetting: any) => {
      const res = await api.put("/settings", updatedSetting);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to save settings.");
    }
  });

  const handleAddTag = () => {
    setTagError("");
    const val = parseInt(newTag);
    if (isNaN(val) || val <= 0) {
      setTagError("Please enter a valid positive number.");
      return;
    }
    if (tags.length >= 10) {
      setTagError("Maximum 10 tags allowed.");
      return;
    }
    if (tags.includes(val)) {
      setTagError("This tag already exists.");
      return;
    }
    if (val > parseInt(thresholdValue)) {
      setTagError(`Tag must be ≤ threshold (₹${thresholdValue}).`);
      return;
    }

    setTags([...tags, val].sort((a, b) => a - b));
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: number) => {
    setTags(tags.filter((t: number) => t !== tagToRemove));
  };

  const handleOverallSave = () => {
    setThresholdError("");
    const newThreshold = parseInt(thresholdValue);
    
    if (isNaN(newThreshold) || newThreshold < 0) {
      setThresholdError("Please enter a valid threshold.");
      return;
    }

    const invalidTags = tags.filter(t => t > newThreshold);
    if (invalidTags.length > 0) {
      setThresholdError(`Threshold cannot be less than tags (₹${invalidTags.join(", ₹")}).`);
      return;
    }

    mutation.mutate({
      smallProductThreshold: newThreshold,
      smallProductTags: tags
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium text-lg">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings2 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">System Configuration</h1>
          </div>
          <p className="text-muted-foreground">
            Control global application behavior and POS business rules.
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={handleOverallSave} 
          disabled={mutation.isPending}
          className="shadow-xl shadow-primary/20 h-14 px-8 text-lg font-bold gap-2 active:scale-95 transition-all w-full md:w-auto"
        >
          {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {mutation.isPending ? "Saving..." : "Save Configuration"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Main Settings */}
        <div className="lg:col-span-12 space-y-8">
          <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-slate-50 overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <IndianRupee className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle className="text-xl font-bold">POS Quick Mode Settings</CardTitle>
              </div>
              <CardDescription className="text-base">
                Fine-tune how fast items are added to the bill during peak hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-12 p-8">
              {/* Threshold Setting */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="threshold" className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Price Threshold (₹)
                  </Label>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Products priced at or below this amount will appear in "Quick Mode" for instant billing.
                  </p>
                </div>
                <div className="space-y-2 max-w-[280px]">
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="threshold"
                      type="number"
                      value={thresholdValue}
                      onChange={(e) => { setThresholdValue(e.target.value); setThresholdError(""); }}
                      className={`pl-9 h-12 text-lg font-bold bg-white border-slate-200 focus:ring-primary/20 transition-all ${thresholdError ? 'border-red-500 ring-red-50' : ''}`}
                      placeholder="10"
                    />
                  </div>
                  {thresholdError && (
                    <div className="flex items-center gap-1.5 text-red-600 text-[13px] font-medium leading-tight">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{thresholdError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Tags Setting */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" />
                    Predefined Price Tags
                  </Label>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Create price shortcuts (e.g. ₹1, ₹2, ₹5) for single-item additions.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 min-h-[48px]">
                    {tags.length === 0 ? (
                      <div className="flex items-center gap-2 text-muted-foreground italic text-sm">
                        <AlertCircle className="w-4 h-4" />
                        No tags defined
                      </div>
                    ) : (
                      tags.map(tag => (
                        <div key={tag} className="flex items-center gap-2 bg-white border shadow-sm px-4 py-2 rounded-xl group transition-all hover:border-red-200 hover:bg-red-50/30">
                          <span className="font-extrabold text-slate-800">₹{tag}</span>
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="p-1 rounded-full text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-100 transition-all flex items-center justify-center"
                            title="Remove Tag"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 max-w-[160px]">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="Price"
                          value={newTag}
                          onChange={(e) => { setNewTag(e.target.value); setTagError(""); }}
                          onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                          className={`pl-8 h-10 border-slate-200 ${tagError ? 'border-red-500' : ''}`}
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleAddTag}
                        className="h-10 px-4 font-bold border-slate-200 hover:bg-slate-100"
                      >
                        Add Tag
                      </Button>
                    </div>
                    {tagError && (
                      <div className="flex items-center gap-1.5 text-red-600 text-[13px] font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{tagError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
