import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, medicalReports } from "@shared/schema";

// SQLite connection for development (will use memory storage in development)
export const connection = postgres(process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres");

// Initialize drizzle
export const db = drizzle(connection, {
  schema: { users, medicalReports }
});
