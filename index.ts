import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const globalForDb = globalThis as typeof globalThis & { __najeebMysqlPool?: mysql.Pool };
export const pool = globalForDb.__najeebMysqlPool ?? mysql.createPool({ uri: databaseUrl, connectionLimit: 8, waitForConnections: true });
if (process.env.NODE_ENV !== "production") globalForDb.__najeebMysqlPool = pool;
export const db: any = drizzle(pool);
