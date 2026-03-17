import jwt, { SignOptions, Secret } from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET: Secret = (process.env.JWT_SECRET as Secret) || "change_this_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signJwt(payload: Record<string, any>): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
  return jwt.sign(payload as string | object | Buffer, JWT_SECRET, options);
}

export function verifyJwt(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET as Secret);
  } catch (err) {
    return null;
  }
}
