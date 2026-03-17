import { Request, Response, NextFunction } from "express";
import { SettingRepository } from "@/repositories/SettingRepository";
export declare class SettingController {
    private repository;
    constructor(repository: SettingRepository);
    getSetting(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateSetting(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare function createSettingController(repository: SettingRepository): SettingController;
//# sourceMappingURL=SettingController.d.ts.map