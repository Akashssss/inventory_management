import { Request, Response, NextFunction } from "express";
import { hashPassword, comparePassword, signJwt } from "@/lib/auth";
import { User } from "@/models/User";
import { UserRepository } from "@/repositories/UserRepository";

const userRepo = new UserRepository();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, role, tenantId } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: { message: "email and password required" } });
      }

      const existing = await userRepo.findByEmail(email);
      if (existing) return res.status(409).json({ success: false, error: { message: "Email already in use" } });

      const passwordHash = await hashPassword(password);
      const user = await userRepo.create({ email, passwordHash, name, role: role || "seller", tenantId });

      res.status(201).json({ success: true, data: { id: user._id, email: user.email } });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ success: false, error: { message: "email and password required" } });

      const user = await userRepo.findByEmail(email);
      if (!user) return res.status(401).json({ success: false, error: { message: "Invalid credentials" } });

      const ok = await comparePassword(password, user.passwordHash);
      if (!ok) return res.status(401).json({ success: false, error: { message: "Invalid credentials" } });

      const token = signJwt({ sub: user._id.toString(), role: user.role, tenantId: user.tenantId });
      res.status(200).json({ success: true, token, user: { id: user._id, email: user.email, role: user.role } });
    } catch (err) {
      next(err);
    }
  }
}

export function createAuthController() {
  return new AuthController();
}
