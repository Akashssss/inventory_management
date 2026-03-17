"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAuth = jwtAuth;
exports.requireRole = requireRole;
const auth_1 = require("@/lib/auth");
const User_1 = require("@/models/User");
// Augment express Request in codebase where needed; here we cast inline
async function jwtAuth(req, res, next) {
    const auth = req.headers.authorization || req.headers["x-access-token"];
    if (!auth) {
        return res.status(401).json({ success: false, error: { message: "Missing authorization token" } });
    }
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
    const payload = (0, auth_1.verifyJwt)(token);
    if (!payload) {
        return res.status(401).json({ success: false, error: { message: "Invalid or expired token" } });
    }
    // attach minimal user context
    try {
        const user = await User_1.User.findById(payload.sub).lean().exec();
        if (!user) {
            return res.status(401).json({ success: false, error: { message: "User not found" } });
        }
        req.context = req.context || {};
        req.context.user = user;
        req.context.tenantId = user.tenantId || req.context.tenantId;
        next();
    }
    catch (err) {
        next(err);
    }
}
function requireRole(role) {
    return (req, res, next) => {
        const user = req.context?.user;
        if (!user)
            return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        if (user.role !== role && user.role !== "admin") {
            return res.status(403).json({ success: false, error: { message: "Forbidden" } });
        }
        next();
    };
}
//# sourceMappingURL=authMiddleware.js.map