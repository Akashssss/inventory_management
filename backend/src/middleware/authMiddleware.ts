import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "@/lib/auth";
import { User } from "@/models/User";

export interface RequestContext {
  user?: any;
  tenantId?: string;
}

// Augment express Request in codebase where needed; here we cast inline

export async function jwtAuth(req: Request & { context?: RequestContext }, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || req.headers["x-access-token"] as string | undefined;
  if (!auth) {
    return res.status(401).json({ success: false, error: { message: "Missing authorization token" } });
  }

  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: { message: "Invalid or expired token" } });
  }

  // attach minimal user context
  try {
    const user = await User.findById(payload.sub).lean().exec();
    if (!user) {
      return res.status(401).json({ success: false, error: { message: "User not found" } });
    }
    req.context = req.context || {};
    req.context.user = user;
    req.context.tenantId = user.tenantId || req.context.tenantId;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(role: string) {
  return (req: Request & { context?: RequestContext }, res: Response, next: NextFunction) => {
    const user = req.context?.user;
    if (!user) return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    if (user.role !== role && user.role !== "admin") {
      return res.status(403).json({ success: false, error: { message: "Forbidden" } });
    }
    next();
  };
}
