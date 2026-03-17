"use strict";
/**
 * SERVER ENTRY POINT
 * Initializes and starts the Express application
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("@/app");
// Load environment variables
dotenv_1.default.config();
// Constants
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/inventory";
const NODE_ENV = process.env.NODE_ENV || "development";
// Initialize server
async function startServer() {
    try {
        // Connect to MongoDB
        console.log(`[MongoDB] Connecting to ${MONGODB_URI}...`);
        await mongoose_1.default.connect(MONGODB_URI);
        console.log(`[MongoDB] ✓ Connected successfully`);
        // Create Express app
        const app = (0, app_1.createApp)();
        // Health endpoint
        app.get("/health", (req, res) => {
            res.status(200).json({
                status: "ok",
                timestamp: new Date().toISOString(),
                environment: NODE_ENV,
            });
        });
        // Start HTTP server
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════╗
║   Inventory Management API              ║
║   Running on http://localhost:${PORT}        ║
║   Environment: ${NODE_ENV.toUpperCase().padEnd(25)} ║
╚════════════════════════════════════════╝
      `);
        });
    }
    catch (error) {
        console.error("[ERROR] Failed to start server:", error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on("SIGTERM", () => {
    console.log("[SIGTERM] Shutting down gracefully...");
    mongoose_1.default.disconnect();
    process.exit(0);
});
process.on("SIGINT", () => {
    console.log("[SIGINT] Shutting down gracefully...");
    mongoose_1.default.disconnect();
    process.exit(0);
});
// Start the server
startServer();
//# sourceMappingURL=server.js.map