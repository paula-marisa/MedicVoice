import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model (required for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Medical Report model
export const medicalReports = pgTable("medical_reports", {
  id: serial("id").primaryKey(),
  processNumber: text("process_number").notNull(),
  name: text("name").notNull(),
  age: text("age").notNull(),
  gender: text("gender").notNull(),
  diagnosis: text("diagnosis").notNull(),
  symptoms: text("symptoms").notNull(),
  treatment: text("treatment").notNull(),
  observations: text("observations"),
  status: text("status").notNull().default("draft"), // 'draft' or 'submitted'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMedicalReportSchema = createInsertSchema(medicalReports)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMedicalReport = z.infer<typeof insertMedicalReportSchema>;
export type MedicalReport = typeof medicalReports.$inferSelect;
