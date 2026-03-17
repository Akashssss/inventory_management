import { Schema, model, Model } from "mongoose";
import { BaseEntity } from "../types/query.types";

export type ProductType = "measurable" | "non-measurable";
export type MeasurableUnit = "kg" | "g" | "l" | "ml" | "piece" | "pack" | "box";

export interface IProduct extends BaseEntity {
  tenantId: string;
  name: string;
  description?: string;
  categories: string[]; // references Category name/id
  
  type: ProductType;
  unit: MeasurableUnit;

  // Box specific
  comesInBoxes: boolean;
  itemsPerBox?: number;
  boxCostPrice?: number;
  
  // Pricing and Stock
  costPrice: number; // Cost price per piece/unit. Calculated automatically if boxes.
  sellingPrice: number; // Selling price per piece/unit.
  stock: number; // Overall quantities in terms of unit (e.g. pieces or kg)
  
  // Settings
  isSmallProduct: boolean;
  lowStockThreshold: number;

  status: "active" | "inactive" | "discontinued";
  images: { url: string; alt?: string }[];
  
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

const productSchema = new Schema<IProduct>(
  {
    tenantId: { type: String, required: true, index: true, default: "default" },
    name: { type: String, required: true, index: true },
    description: { type: String, default: null },
    categories: { type: [String], default: [], index: true },

    type: { type: String, enum: ["measurable", "non-measurable"], required: true },
    unit: { type: String, enum: ["kg", "g", "l", "ml", "piece", "pack", "box"], default: "piece" },

    comesInBoxes: { type: Boolean, default: false },
    itemsPerBox: { type: Number, default: null },
    boxCostPrice: { type: Number, default: null },

    costPrice: { type: Number, required: true, index: true },
    sellingPrice: { type: Number, required: true, index: true },
    stock: { type: Number, required: true, default: 0, index: true },

    isSmallProduct: { type: Boolean, default: false, index: true },
    lowStockThreshold: { type: Number, required: true, default: 10 },

    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active",
      index: true,
    },
    images: {
      type: [
        {
          url: { type: String, required: true },
          alt: { type: String, default: "" },
        }
      ],
      validate: [
        {
          validator: (v: any) => Array.isArray(v) && v.length > 0,
          message: "At least one image is mandatory for the product"
        }
      ]
    },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: "products" }
);

// Pre-save hook to calculate cost price if it comes in boxes
productSchema.pre("save", async function () {
  // Box logic for non-measurable
  if (this.type === "non-measurable" && this.comesInBoxes && this.boxCostPrice && this.itemsPerBox) {
    this.costPrice = this.boxCostPrice / this.itemsPerBox;
  }
});

productSchema.index({ tenantId: 1, name: 1 });
productSchema.index({ tenantId: 1, categories: 1 });
productSchema.index({ tenantId: 1, isSmallProduct: 1 });

export const Product = model<IProduct>("Product", productSchema);
export type ProductModel = Model<IProduct>;
