export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
export declare function signJwt(payload: Record<string, any>): string;
export declare function verifyJwt(token: string): any;
//# sourceMappingURL=auth.d.ts.map