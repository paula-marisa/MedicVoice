import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model (required for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'doctor', 'admin', etc.
  specialty: text("specialty"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  specialty: true,
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
  status: text("status").notNull().default("draft"), // 'draft', 'submitted', 'approved'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
});

// Audit log model for tracking changes
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // 'create', 'update', 'delete', 'export', etc.
  resourceType: text("resource_type").notNull(), // 'medical_report', 'user', etc.
  resourceId: integer("resource_id"), // ID of the affected resource
  details: jsonb("details"), // JSON details of the change
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
});

// Network communication logs for SClinico integration
export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => medicalReports.id),
  direction: text("direction").notNull(), // 'outgoing', 'incoming'
  endpoint: text("endpoint").notNull(), // Target system/endpoint
  status: text("status").notNull(), // 'success', 'error'
  requestPayload: jsonb("request_payload"),
  responsePayload: jsonb("response_payload"),
  errorDetails: text("error_details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  medicalReports: many(medicalReports),
  auditLogs: many(auditLogs),
}));

export const medicalReportsRelations = relations(medicalReports, ({ one, many }) => ({
  user: one(users, {
    fields: [medicalReports.userId],
    references: [users.id],
  }),
  communicationLogs: many(communicationLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const communicationLogsRelations = relations(communicationLogs, ({ one }) => ({
  medicalReport: one(medicalReports, {
    fields: [communicationLogs.reportId],
    references: [medicalReports.id],
  }),
}));

// Insert schemas
export const insertMedicalReportSchema = createInsertSchema(medicalReports)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertAuditLogSchema = createInsertSchema(auditLogs)
  .omit({ id: true, timestamp: true });

export const insertCommunicationLogSchema = createInsertSchema(communicationLogs)
  .omit({ id: true, timestamp: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMedicalReport = z.infer<typeof insertMedicalReportSchema>;
export type MedicalReport = typeof medicalReports.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;
export type CommunicationLog = typeof communicationLogs.$inferSelect;
