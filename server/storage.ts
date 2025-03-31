import { 
  users, medicalReports, auditLogs, communicationLogs, patientConsents, accessRequests,
  type User, type InsertUser, 
  type MedicalReport, type InsertMedicalReport,
  type AuditLog, type InsertAuditLog,
  type CommunicationLog, type InsertCommunicationLog,
  type PatientConsent, type InsertPatientConsent,
  type AccessRequest, type InsertAccessRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { connection } from "./db";

// Defines a store for express-session
type SessionStore = session.Store;

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Medical report methods
  createMedicalReport(report: InsertMedicalReport): Promise<MedicalReport>;
  getMedicalReport(id: number): Promise<MedicalReport | undefined>;
  getAllMedicalReports(): Promise<MedicalReport[]>;
  getMedicalReportsByUserId(userId: number): Promise<MedicalReport[]>;
  updateMedicalReport(id: number, report: Partial<InsertMedicalReport>): Promise<MedicalReport | undefined>;
  deleteMedicalReport(id: number): Promise<boolean>;
  
  // Audit log methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(resourceType?: string, resourceId?: number): Promise<AuditLog[]>;
  
  // Communication log methods
  createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog>;
  getCommunicationLogsByReportId(reportId: number): Promise<CommunicationLog[]>;
  
  // Access request methods
  createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  getAccessRequest(id: number): Promise<AccessRequest | undefined>;
  getPendingAccessRequests(): Promise<AccessRequest[]>;
  updateAccessRequest(id: number, request: Partial<AccessRequest>): Promise<AccessRequest | undefined>;
  
  // Patient consent methods
  createPatientConsent(consent: InsertPatientConsent): Promise<PatientConsent>;
  getPatientConsent(id: number): Promise<PatientConsent | undefined>;
  getPatientConsentByProcessNumber(processNumber: string, consentType: string): Promise<PatientConsent | undefined>;
  updatePatientConsent(id: number, consent: Partial<InsertPatientConsent>): Promise<PatientConsent | undefined>;
  
  // Session store
  sessionStore: SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.createdAt);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Medical report methods
  async createMedicalReport(report: InsertMedicalReport): Promise<MedicalReport> {
    const [newReport] = await db.insert(medicalReports).values(report).returning();
    return newReport;
  }

  async getMedicalReport(id: number): Promise<MedicalReport | undefined> {
    const [report] = await db.select().from(medicalReports).where(eq(medicalReports.id, id));
    return report;
  }

  async getAllMedicalReports(): Promise<MedicalReport[]> {
    return db.select().from(medicalReports).orderBy(desc(medicalReports.updatedAt));
  }
  
  async getMedicalReportsByUserId(userId: number): Promise<MedicalReport[]> {
    return db
      .select()
      .from(medicalReports)
      .where(eq(medicalReports.userId, userId))
      .orderBy(desc(medicalReports.updatedAt));
  }

  async updateMedicalReport(id: number, reportData: Partial<InsertMedicalReport>): Promise<MedicalReport | undefined> {
    const [updatedReport] = await db
      .update(medicalReports)
      .set({ 
        ...reportData,
        updatedAt: new Date() 
      })
      .where(eq(medicalReports.id, id))
      .returning();
    return updatedReport;
  }

  async deleteMedicalReport(id: number): Promise<boolean> {
    const [deletedReport] = await db
      .delete(medicalReports)
      .where(eq(medicalReports.id, id))
      .returning();
    return !!deletedReport;
  }

  // Audit log methods
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getAuditLogs(resourceType?: string, resourceId?: number): Promise<AuditLog[]> {
    let conditions = [];
    
    if (resourceType) {
      conditions.push(eq(auditLogs.resourceType, resourceType));
    }
    
    if (resourceId) {
      conditions.push(eq(auditLogs.resourceId, resourceId));
    }
    
    if (conditions.length > 0) {
      return db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.timestamp));
    } else {
      return db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.timestamp));
    }
  }

  // Communication log methods
  async createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog> {
    const [newLog] = await db.insert(communicationLogs).values(log).returning();
    return newLog;
  }

  async getCommunicationLogsByReportId(reportId: number): Promise<CommunicationLog[]> {
    return db
      .select()
      .from(communicationLogs)
      .where(eq(communicationLogs.reportId, reportId))
      .orderBy(desc(communicationLogs.timestamp));
  }

  // Patient consent methods
  async createPatientConsent(consent: InsertPatientConsent): Promise<PatientConsent> {
    const [newConsent] = await db.insert(patientConsents).values(consent).returning();
    return newConsent;
  }

  async getPatientConsent(id: number): Promise<PatientConsent | undefined> {
    const [consent] = await db.select().from(patientConsents).where(eq(patientConsents.id, id));
    return consent;
  }

  async getPatientConsentByProcessNumber(processNumber: string, consentType: string): Promise<PatientConsent | undefined> {
    const [consent] = await db
      .select()
      .from(patientConsents)
      .where(
        and(
          eq(patientConsents.processNumber, processNumber),
          eq(patientConsents.consentType, consentType),
          eq(patientConsents.consentGranted, true)
        )
      )
      .orderBy(desc(patientConsents.consentDate))
      .limit(1);
    
    return consent;
  }

  async updatePatientConsent(id: number, consentData: Partial<InsertPatientConsent>): Promise<PatientConsent | undefined> {
    const [updatedConsent] = await db
      .update(patientConsents)
      .set(consentData)
      .where(eq(patientConsents.id, id))
      .returning();
    
    return updatedConsent;
  }

  // Access request methods
  async createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest> {
    const [newRequest] = await db.insert(accessRequests).values(request).returning();
    return newRequest;
  }

  async getAccessRequest(id: number): Promise<AccessRequest | undefined> {
    const [request] = await db.select().from(accessRequests).where(eq(accessRequests.id, id));
    return request;
  }

  async getPendingAccessRequests(): Promise<AccessRequest[]> {
    return db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.status, "pending"))
      .orderBy(desc(accessRequests.createdAt));
  }

  async updateAccessRequest(id: number, requestData: Partial<AccessRequest>): Promise<AccessRequest | undefined> {
    const [updatedRequest] = await db
      .update(accessRequests)
      .set(requestData)
      .where(eq(accessRequests.id, id))
      .returning();
    return updatedRequest;
  }
}

export const storage = new DatabaseStorage();
