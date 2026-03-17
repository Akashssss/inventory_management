import { Request, Response, NextFunction } from "express";
import { SettingRepository } from "@/repositories/SettingRepository";
import { Product } from "@/models/Product";

export class SettingController {
  private repository: SettingRepository;

  constructor(repository: SettingRepository) {
    this.repository = repository;
  }

  async getSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId || "default";
      let setting = await this.repository.getTenantSetting(tenantId);
      
      if (!setting) {
        // Create default setting if none exists
        setting = await this.repository.create({
          tenantId,
          smallProductThreshold: 10,
          smallProductTags: [1, 2, 5],
          storeName: "Confectionary Shop",
          currency: "₹"
        });
      }

      res.status(200).json({ success: true, data: setting });
    } catch (error) {
      next(error);
    }
  }

  async updateSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId || "default";
      const setting = await this.repository.getTenantSetting(tenantId);
      
      if (!setting) {
        res.status(404).json({ success: false, error: { message: "Setting not found" } });
        return;
      }
      
      const { smallProductThreshold, smallProductTags } = req.body;

      // 1. Validation for tags if provided
      if (smallProductTags && Array.isArray(smallProductTags)) {
        const threshold = smallProductThreshold !== undefined ? smallProductThreshold : setting.smallProductThreshold;
        if (smallProductTags.length > 10) {
            res.status(400).json({ success: false, error: { message: "Maximum 10 small product tags allowed." } });
            return;
        }
        if (!smallProductTags.every(t => Number(t) <= threshold)) {
            res.status(400).json({ success: false, error: { message: "All tags must be less than or equal to the threshold." } });
            return;
        }
      }

      // 2. Perform Update
      const updated = await this.repository.update(setting._id.toString(), req.body);

      // 3. If threshold changed, update all products isSmallProduct status
      if (smallProductThreshold !== undefined && smallProductThreshold !== setting.smallProductThreshold) {
          // Find all non-measurable products for this tenant
          // And update isSmallProduct flag
          // logic: sellingPrice <= smallProductThreshold
          
          await Product.updateMany(
              { tenantId, type: "non-measurable" },
              [
                  {
                      $set: {
                          isSmallProduct: {
                              $lte: ["$sellingPrice", smallProductThreshold]
                          }
                      }
                  }
              ]
          ).exec();
      }

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}

export function createSettingController(repository: SettingRepository): SettingController {
  return new SettingController(repository);
}
