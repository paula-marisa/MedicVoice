import { pgTable, text, serial, integer, timestamp, boolean, jsonb, varchar } from "drizzle-orm/pg-core";
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
  professionalId: text("professional_id"), // ID profissional para médicos e enfermeiros
  mechanographicNumber: text("mechanographic_number"), // Número mecanográfico do profissional
  status: text("status").notNull().default("active"), // 'active', 'inactive'
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  specialty: true,
  status: true,
  professionalId: true,
  mechanographicNumber: true,
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
  userId: integer("user_id"), // Can be null for anonymous actions/public endpoints
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

// Access requests from professionals
export const accessRequests = pgTable("access_requests", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  professionalId: text("professional_id").notNull(),
  specialty: text("specialty").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  mechanographicNumber: text("mechanographic_number").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewDate: timestamp("review_date"),
  comments: text("comments"),
  temporaryPassword: text("temporary_password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Patient consent records for GDPR/LGPD compliance
export const patientConsents = pgTable("patient_consents", {
  id: serial("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  processNumber: text("process_number").notNull(),
  consentType: text("consent_type").notNull(), // 'voice_recording', 'data_processing', etc.
  consentGranted: boolean("consent_granted").notNull(),
  consentDate: timestamp("consent_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date"),
  consentDetails: jsonb("consent_details"), // Additional consent metadata
  verbalConfirmation: boolean("verbal_confirmation").default(false),
  confirmationRecording: text("confirmation_recording"), // Optional reference to stored confirmation
  userId: integer("user_id").references(() => users.id), // Doctor/user who collected consent
});

// Relations
export const accessRequestsRelations = relations(accessRequests, ({ one }) => ({
  reviewer: one(users, {
    fields: [accessRequests.reviewedBy],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  medicalReports: many(medicalReports),
  auditLogs: many(auditLogs),
  patientConsents: many(patientConsents),
  reviewedAccessRequests: many(accessRequests),
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

export const patientConsentsRelations = relations(patientConsents, ({ one }) => ({
  user: one(users, {
    fields: [patientConsents.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertMedicalReportSchema = createInsertSchema(medicalReports)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertAuditLogSchema = createInsertSchema(auditLogs)
  .omit({ id: true, timestamp: true });

export const insertCommunicationLogSchema = createInsertSchema(communicationLogs)
  .omit({ id: true, timestamp: true });

export const insertAccessRequestSchema = createInsertSchema(accessRequests)
  .omit({ 
    id: true, 
    createdAt: true, 
    status: true, 
    reviewedBy: true,
    reviewDate: true, 
    comments: true,
    temporaryPassword: true
  });

export const insertPatientConsentSchema = createInsertSchema(patientConsents)
  .omit({ id: true, consentDate: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMedicalReport = z.infer<typeof insertMedicalReportSchema>;
export type MedicalReport = typeof medicalReports.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;
export type CommunicationLog = typeof communicationLogs.$inferSelect;

export type InsertAccessRequest = z.infer<typeof insertAccessRequestSchema>;
export type AccessRequest = typeof accessRequests.$inferSelect;

export type InsertPatientConsent = z.infer<typeof insertPatientConsentSchema>;
export type PatientConsent = typeof patientConsents.$inferSelect;
