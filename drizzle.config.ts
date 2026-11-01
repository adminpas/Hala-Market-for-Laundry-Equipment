import { defineConfig } from "drizzle-kit";
export default defineConfig({ dialect: "mysql", schema: "./src/db/schema.ts", dbCredentials: { url: process.env.DRIZZLE_DATABASE_URL || process.env.DATABASE_URL || "" }, out: "drizzle" });
