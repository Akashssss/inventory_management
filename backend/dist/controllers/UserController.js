"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
exports.createUserController = createUserController;
const User_1 = require("@/models/User");
const auth_1 = require("@/lib/auth");
class UserController {
    async listUsers(req, res, next) {
        try {
            const tenantId = req.context?.tenantId;
            const users = await User_1.User.find({ tenantId }).select("-passwordHash").sort({ createdAt: -1 }).exec();
            res.status(200).json({ success: true, data: users });
        }
        catch (err) {
            next(err);
        }
    }
    async searchUsers(req, res, next) {
        try {
            const tenantId = req.context?.tenantId;
            const { q, search, page, limit } = req.query;
            const body = req.body || {};
            const query = q || search || body.q || body.search || "";
            const filter = { tenantId };
            // Handle search query
            if (query) {
                filter.$or = [
                    { name: { $regex: query, $options: "i" } },
                    { email: { $regex: query, $options: "i" } }
                ];
            }
            // Handle role filter from body (QueryEngine style)
            if (body.filter && body.filter.conditions) {
                for (const cond of body.filter.conditions) {
                    if (cond.field === "role" && cond.value) {
                        filter.role = cond.value;
                    }
                }
            }
            const p = page ? Number(page) : 1;
            const l = limit ? Number(limit) : 20;
            const users = await User_1.User.find(filter)
                .select("-passwordHash")
                .sort({ name: 1 })
                .skip((p - 1) * l)
                .limit(l)
                .exec();
            const total = await User_1.User.countDocuments(filter).exec();
            res.status(200).json({
                success: true,
                data: users,
                pagination: {
                    page: p,
                    limit: l,
                    total
                }
            });
        }
        catch (err) {
            next(err);
        }
    }
    async createUser(req, res, next) {
        try {
            const tenantId = req.context?.tenantId;
            const { name, email, role, password } = req.body;
            if (!name || !email || !password) {
                res.status(400).json({ success: false, error: { message: "name, email and password are required" } });
                return;
            }
            const existing = await User_1.User.findOne({ email, tenantId }).exec();
            if (existing) {
                res.status(409).json({ success: false, error: { message: "A user with this email already exists" } });
                return;
            }
            const passwordHash = await (0, auth_1.hashPassword)(password);
            const user = await User_1.User.create({ name, email, role: role || "seller", passwordHash, tenantId, isActive: true });
            const { passwordHash: _, ...userData } = user.toObject();
            res.status(201).json({ success: true, data: userData });
        }
        catch (err) {
            next(err);
        }
    }
    async getUser(req, res, next) {
        try {
            const userId = req.params.id;
            const user = await User_1.User.findById(userId).select("-passwordHash").exec();
            if (!user) {
                res.status(404).json({ success: false, error: { message: "User not found" } });
                return;
            }
            res.status(200).json({ success: true, data: user });
        }
        catch (err) {
            next(err);
        }
    }
    async updateUser(req, res, next) {
        try {
            const userId = req.params.id;
            const { name, role, isActive, password } = req.body;
            const updateData = {};
            if (name !== undefined)
                updateData.name = name;
            if (role !== undefined)
                updateData.role = role;
            if (isActive !== undefined)
                updateData.isActive = isActive;
            if (password)
                updateData.passwordHash = await (0, auth_1.hashPassword)(password);
            const user = await User_1.User.findByIdAndUpdate(userId, updateData, { new: true }).select("-passwordHash").exec();
            if (!user) {
                res.status(404).json({ success: false, error: { message: "User not found" } });
                return;
            }
            res.status(200).json({ success: true, data: user });
        }
        catch (err) {
            next(err);
        }
    }
    async deleteUser(req, res, next) {
        try {
            const userId = req.params.id;
            const user = await User_1.User.findByIdAndDelete(userId).exec();
            if (!user) {
                res.status(404).json({ success: false, error: { message: "User not found" } });
                return;
            }
            res.status(200).json({ success: true, message: "User deleted" });
        }
        catch (err) {
            next(err);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const userId = req.context?.user?._id;
            const { name } = req.body;
            const updateData = {};
            if (name !== undefined)
                updateData.name = name;
            const user = await User_1.User.findByIdAndUpdate(userId, updateData, { new: true }).select("-passwordHash").exec();
            res.status(200).json({ success: true, data: user });
        }
        catch (err) {
            next(err);
        }
    }
    async changePassword(req, res, next) {
        try {
            const userId = req.context?.user?._id;
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                res.status(400).json({ success: false, error: { message: "currentPassword and newPassword are required" } });
                return;
            }
            const user = await User_1.User.findById(userId).exec();
            if (!user) {
                res.status(404).json({ success: false, error: { message: "User not found" } });
                return;
            }
            const isPasswordValid = await (0, auth_1.comparePassword)(currentPassword, user.passwordHash);
            if (!isPasswordValid) {
                res.status(401).json({ success: false, error: { message: "Current password is incorrect" } });
                return;
            }
            user.passwordHash = await (0, auth_1.hashPassword)(newPassword);
            await user.save();
            res.status(200).json({ success: true, message: "Password changed" });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UserController = UserController;
function createUserController() {
    return new UserController();
}
//# sourceMappingURL=UserController.js.map