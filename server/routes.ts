import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMedicalReportSchema, 
  insertCommunicationLogSchema,
  insertPatientConsentSchema,
  insertAccessRequestSchema,
  type User, 
  type InsertMedicalReport,
  type InsertPatientConsent,
  type InsertAccessRequest
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth, ensureAuthenticated, ensureAdmin, initAdminUser, comparePasswords, hashPassword } from "./auth";
import { log } from "./vite";

// Function to log audit trail
async function logAuditTrail(req: Request, action: string, resourceType: string, resourceId?: number, details?: any) {
  try {
    if (req.user) {
      await storage.createAuditLog({
        userId: req.user.id,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress: req.ip
      });
    }
  } catch (error) {
    log(`Error logging audit trail: ${error}`, "audit");
  }
}

// Function to export to SClinico
async function exportToSClinico(reportId: number, processNumber: string, userId: number) {
  try {
    // Get the report
    const report = await storage.getMedicalReport(reportId);
    if (!report) {
      throw new Error("Report not found");
    }
    
    // Prepare the payload for SClinico
    const payload = {
      processNumber,
      reportData: report,
      timestamp: new Date().toISOString(),
      exporterId: userId
    };
    
    // In a real app, this would be an actual API call to SClinico
    // Here we're just simulating a successful response
    const sclinicoResponse = {
      success: true,
      receiptId: `SCL-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    
    // Log the communication
    await storage.createCommunicationLog({
      reportId,
      direction: "outgoing",
      endpoint: "SClinico",
      status: "success",
      requestPayload: payload,
      responsePayload: sclinicoResponse
    });
    
    return {
      success: true,
      data: sclinicoResponse
    };
  } catch (error) {
    // Log the error
    await storage.createCommunicationLog({
      reportId,
      direction: "outgoing",
      endpoint: "SClinico",
      status: "error",
      requestPayload: { processNumber, reportId },
      errorDetails: error instanceof Error ? error.message : String(error)
    });
    
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create admin user
  await initAdminUser();
  
  // Setup authentication
  setupAuth(app);
  
  // Change password route
  app.post("/api/change-password", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Senha atual e nova senha são obrigatórias"
        });
      }
      
      // Get the user from the database
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado"
        });
      }
      
      // Check if current password is correct
      const isCorrectPassword = await comparePasswords(currentPassword, user.password);
      if (!isCorrectPassword) {
        return res.status(400).json({
          success: false,
          message: "Senha atual incorreta"
        });
      }
      
      // Hash the new password
      const hashedNewPassword = await hashPassword(newPassword);
      
      // Update the user with the new password
      await storage.updateUser(user.id, {
        password: hashedNewPassword
      });
      
      // Log the password change
      await logAuditTrail(req, "password_change", "user", user.id, {
        success: true
      });
      
      return res.status(200).json({
        success: true,
        message: "Senha atualizada com sucesso"
      });
    } catch (error) {
      log(`Error changing password: ${error}`, "api");
      return res.status(500).json({
        success: false,
        message: "Erro ao atualizar senha"
      });
    }
  });
  
  // Rota para verificar se existem usuários no sistema
  app.get("/api/check-users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json({
        success: true,
        hasUsers: users.length > 0
      });
    } catch (error) {
      log(`Error checking users: ${error}`, "auth");
      res.status(500).json({
        success: false,
        message: "Erro ao verificar usuários",
        hasUsers: true // Por segurança, assume que existem usuários
      });
    }
  });
  
  // ==== Protected Medical Report Routes ====
  
  // Create medical report
  app.post("/api/medical-reports", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      // Add user ID to the report data
      const reportData = {
        ...req.body,
        userId: req.user.id
      };
      
      // Validate request body
      const data = insertMedicalReportSchema.parse(reportData);
      
      // Create new report
      const report = await storage.createMedicalReport(data);
      
      // Log the action
      await logAuditTrail(req, "create", "medical_report", report.id, {
        processNumber: report.processNumber,
        status: report.status
      });
      
      res.status(201).json({
        success: true,
        message: "Relatório médico criado com sucesso",
        data: report
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          success: false,
          message: "Erro de validação",
          errors: validationError.details
        });
      } else {
        log(`Error creating medical report: ${error}`, "api");
        res.status(500).json({
          success: false,
          message: "Erro interno do servidor"
        });
      }
    }
  });

  // Get all medical reports (for current user)
  app.get("/api/medical-reports", ensureAuthenticated, async (req, res) => {
    try {
      // Only fetch reports created by the current user
      const reports = await storage.getMedicalReportsByUserId(req.user.id);
      
      res.json({
        success: true,
        data: reports
      });
    } catch (error) {
      log(`Error fetching medical reports: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });

  // Get medical report by ID
  app.get("/api/medical-reports/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Formato de ID inválido"
        });
      }
      
      const report = await storage.getMedicalReport(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Relatório médico não encontrado"
        });
      }
      
      // Check if the user is the owner of the report or an admin
      if (report.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Acesso negado"
        });
      }
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      log(`Error fetching medical report: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });
  
  // Get medical reports by patient process number
  app.get("/api/medical-reports/by-process/:processNumber", ensureAuthenticated, async (req, res) => {
    try {
      const { processNumber } = req.params;
      
      if (!processNumber) {
        return res.status(400).json({
          success: false,
          message: "Número de processo não fornecido"
        });
      }
      
      // Get all reports by process number
      const allReports = await storage.getAllMedicalReports();
      const patientReports = allReports.filter(report => 
        report.processNumber.toLowerCase() === processNumber.toLowerCase()
      );
      
      // If user is not admin, filter to only show reports created by this user
      const filteredReports = req.user.role === "admin" 
        ? patientReports
        : patientReports.filter(report => report.userId === req.user.id);
      
      res.json({
        success: true,
        data: filteredReports
      });
    } catch (error) {
      log(`Error fetching reports by process number: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });

  // Update medical report by ID
  app.put("/api/medical-reports/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Formato de ID inválido"
        });
      }
      
      // Check if the report exists and belongs to the user
      const existingReport = await storage.getMedicalReport(id);
      if (!existingReport) {
        return res.status(404).json({
          success: false,
          message: "Relatório médico não encontrado"
        });
      }
      
      if (existingReport.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Acesso negado"
        });
      }
      
      // Validate request body
      const data = insertMedicalReportSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Update report
      const updatedReport = await storage.updateMedicalReport(id, data);
      
      // Log the action
      await logAuditTrail(req, "update", "medical_report", id, {
        processNumber: updatedReport.processNumber,
        status: updatedReport.status,
        changes: req.body
      });
      
      res.json({
        success: true,
        message: "Relatório médico atualizado com sucesso",
        data: updatedReport
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          success: false,
          message: "Erro de validação",
          errors: validationError.details
        });
      } else {
        log(`Error updating medical report: ${error}`, "api");
        res.status(500).json({
          success: false,
          message: "Erro interno do servidor"
        });
      }
    }
  });

  // Delete medical report by ID
  app.delete("/api/medical-reports/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Formato de ID inválido"
        });
      }
      
      // Check if the report exists and belongs to the user
      const existingReport = await storage.getMedicalReport(id);
      if (!existingReport) {
        return res.status(404).json({
          success: false,
          message: "Relatório médico não encontrado"
        });
      }
      
      if (existingReport.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Acesso negado"
        });
      }
      
      // Delete the report
      const success = await storage.deleteMedicalReport(id);
      
      // Log the action
      await logAuditTrail(req, "delete", "medical_report", id, {
        processNumber: existingReport.processNumber
      });
      
      res.json({
        success: true,
        message: "Relatório médico excluído com sucesso"
      });
    } catch (error) {
      log(`Error deleting medical report: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });
  
  // ==== SClinico Integration ====
  
  // Export to SClinico
  app.post("/api/medical-reports/:id/export-sclinico", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Formato de ID inválido"
        });
      }
      
      // Check if the report exists and belongs to the user
      const report = await storage.getMedicalReport(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Relatório médico não encontrado"
        });
      }
      
      if (report.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Acesso negado"
        });
      }
      
      // Export to SClinico
      const result = await exportToSClinico(id, report.processNumber, req.user.id);
      
      // Log the action
      await logAuditTrail(req, "export", "medical_report", id, {
        processNumber: report.processNumber,
        destination: "SClinico"
      });
      
      res.json({
        success: true,
        message: "Relatório exportado para SClínico com sucesso",
        data: result
      });
    } catch (error) {
      log(`Error exporting to SClinico: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro ao exportar para SClínico",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // ==== Audit Logs ====
  
  // Get audit logs for a specific report
  app.get("/api/medical-reports/:id/audit-logs", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Formato de ID inválido"
        });
      }
      
      // Check if the report exists and belongs to the user
      const report = await storage.getMedicalReport(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Relatório médico não encontrado"
        });
      }
      
      if (report.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Acesso negado"
        });
      }
      
      // Get audit logs
      const logs = await storage.getAuditLogs("medical_report", id);
      
      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      log(`Error fetching audit logs: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });
  
  // Get communication logs for a specific report
  app.get("/api/medical-reports/:id/communication-logs", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Formato de ID inválido"
        });
      }
      
      // Check if the report exists and belongs to the user
      const report = await storage.getMedicalReport(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Relatório médico não encontrado"
        });
      }
      
      if (report.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Acesso negado"
        });
      }
      
      // Get communication logs
      const logs = await storage.getCommunicationLogsByReportId(id);
      
      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      log(`Error fetching communication logs: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });
  
  // ==== Admin Routes ====
  
  // ==== Rotas Administrativas ====
  
  // Get all users (admin only)
  app.get("/api/admin/users", ensureAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      
      // Remove password from each user
      const usersWithoutPassword = allUsers.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json({
        success: true,
        data: usersWithoutPassword
      });
    } catch (error) {
      log(`Error fetching users: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });
  
  // Obter todos os relatórios médicos (admin only)
  app.get("/api/admin/reports", ensureAdmin, async (req, res) => {
    try {
      const reports = await storage.getAllMedicalReports();
      
      // Enriquecer dados dos relatórios com informações do médico
      const reportsWithUserData = await Promise.all(reports.map(async (report) => {
        const doctor = await storage.getUser(report.userId);
        return {
          ...report,
          doctor: doctor ? { 
            id: doctor.id, 
            name: doctor.name, 
            role: doctor.role,
            specialty: doctor.specialty 
          } : null
        };
      }));
      
      res.json({
        success: true,
        data: reportsWithUserData
      });
    } catch (error) {
      log(`Error fetching all reports: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });
  
  // Obter relatórios médicos do usuário autenticado
  app.get("/api/my-reports", ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado"
        });
      }
      
      const userId = req.user.id;
      const reports = await storage.getMedicalReportsByUserId(userId);
      
      res.json({
        success: true,
        data: reports
      });
    } catch (error) {
      log(`Error fetching user reports: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });
  
  // Obter um relatório específico pertencente ao usuário autenticado
  app.get("/api/my-reports/:id", ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado"
        });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Formato de ID inválido"
        });
      }
      
      // Obter o relatório
      const report = await storage.getMedicalReport(id);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Relatório médico não encontrado"
        });
      }
      
      // Verificar se o relatório pertence ao usuário autenticado
      if (report.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Você não tem permissão para acessar este relatório"
        });
      }
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      log(`Error fetching user report: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });
  
  // Atualizar um relatório médico (apenas campos permitidos)
  app.patch("/api/my-reports/:id", ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado"
        });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Formato de ID inválido"
        });
      }
      
      // Obter o relatório atual
      const existingReport = await storage.getMedicalReport(id);
      
      if (!existingReport) {
        return res.status(404).json({
          success: false,
          message: "Relatório médico não encontrado"
        });
      }
      
      // Verificar se o relatório pertence ao usuário autenticado
      if (existingReport.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Você não tem permissão para editar este relatório"
        });
      }
      
      // Extrair apenas os campos que podem ser atualizados
      const { diagnosis, symptoms, treatment, observations, status } = req.body;
      
      // Criar o objeto de atualização apenas com campos permitidos
      const updateData: Partial<InsertMedicalReport> = {};
      
      if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
      if (symptoms !== undefined) updateData.symptoms = symptoms;
      if (treatment !== undefined) updateData.treatment = treatment;
      if (observations !== undefined) updateData.observations = observations;
      if (status !== undefined) updateData.status = status;
      
      // Atualizar o relatório
      const updatedReport = await storage.updateMedicalReport(id, updateData);
      
      if (!updatedReport) {
        return res.status(500).json({
          success: false,
          message: "Erro ao atualizar o relatório"
        });
      }
      
      // Registrar a atualização no log de auditoria
      await logAuditTrail(req, "update", "medical_report", id, {
        updatedFields: Object.keys(updateData),
        oldValues: {
          diagnosis: existingReport.diagnosis,
          symptoms: existingReport.symptoms,
          treatment: existingReport.treatment,
          observations: existingReport.observations,
          status: existingReport.status
        },
        newValues: updateData
      });
      
      res.json({
        success: true,
        message: "Relatório atualizado com sucesso",
        data: updatedReport
      });
    } catch (error) {
      log(`Error updating report: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });
  
  // Obter todos os logs de auditoria (admin only)
  app.get("/api/admin/audit-logs", ensureAdmin, async (req, res) => {
    try {
      const logs = await storage.getAuditLogs();
      
      // Enriquecer logs com informações do usuário
      const logsWithUserData = await Promise.all(logs.map(async (log) => {
        if (log.userId) {
          const user = await storage.getUser(log.userId);
          return {
            ...log,
            user: user ? { 
              id: user.id, 
              name: user.name, 
              role: user.role 
            } : null
          };
        }
        return log;
      }));
      
      res.json({
        success: true,
        data: logsWithUserData.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      });
    } catch (error) {
      log(`Error fetching audit logs: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });
  
  // Obter relatório específico com histórico de auditoria (admin only)
  app.get("/api/admin/reports/:id/audit", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Formato de ID inválido"
        });
      }
      
      // Obter o relatório
      const report = await storage.getMedicalReport(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Relatório médico não encontrado"
        });
      }
      
      // Obter logs de auditoria do relatório
      const auditLogs = await storage.getAuditLogs("medical_report", id);
      
      // Obter logs de comunicação do relatório
      const communicationLogs = await storage.getCommunicationLogsByReportId(id);
      
      // Enriquecer logs com informações do usuário
      const auditLogsWithUserData = await Promise.all(auditLogs.map(async (log) => {
        if (log.userId) {
          const user = await storage.getUser(log.userId);
          return {
            ...log,
            user: user ? { 
              id: user.id, 
              name: user.name, 
              role: user.role 
            } : null
          };
        }
        return log;
      }));
      
      // Obter informações do médico
      const doctor = await storage.getUser(report.userId);
      
      res.json({
        success: true,
        data: {
          report: {
            ...report,
            doctor: doctor ? { 
              id: doctor.id, 
              name: doctor.name, 
              role: doctor.role,
              specialty: doctor.specialty 
            } : null
          },
          auditLogs: auditLogsWithUserData,
          communicationLogs
        }
      });
    } catch (error) {
      log(`Error fetching report audit: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });

  // ==== Utente Routes ====

  // Get utente by process number
  // Endpoint para buscar informações do utente pelo número de processo
  app.get("/api/utentes/:processNumber", ensureAuthenticated, async (req, res) => {
    try {
      const { processNumber } = req.params;
      
      if (!processNumber) {
        return res.status(400).json({
          success: false,
          message: "Número de processo é obrigatório"
        });
      }
      
      // Verificar se existe um relatório com este número de processo para obter informações do utente
      const reports = await storage.getAllMedicalReports();
      const utenteReport = reports.find(report => report.processNumber === processNumber);
      
      if (!utenteReport) {
        return res.status(404).json({
          success: false,
          message: "Utente não encontrado"
        });
      }
      
      // Retornar informações do utente a partir do relatório
      const utenteInfo = {
        processNumber: utenteReport.processNumber,
        name: utenteReport.name,
        age: utenteReport.age,
        gender: utenteReport.gender
      };
      
      res.json(utenteInfo);
    } catch (error) {
      log(`Erro ao buscar utente: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });
  
  // Mantendo endpoint legado para compatibilidade
  // Endpoint para busca de utentes
  app.get("/api/utentes/:processNumber", ensureAuthenticated, async (req, res) => {
    try {
      const { processNumber } = req.params;
      
      if (!processNumber) {
        return res.status(400).json({
          success: false,
          message: "Número de processo é obrigatório"
        });
      }
      
      // Verificar se existe um relatório com este número de processo para obter informações do utente
      const reports = await storage.getAllMedicalReports();
      const utenteReport = reports.find(report => report.processNumber === processNumber);
      
      if (!utenteReport) {
        return res.status(404).json({
          success: false,
          message: "Utente não encontrado"
        });
      }
      
      // Retornar informações do utente a partir do relatório
      const utenteInfo = {
        processNumber: utenteReport.processNumber,
        name: utenteReport.name,
        age: utenteReport.age,
        gender: utenteReport.gender
      };
      
      res.json(utenteInfo);
    } catch (error) {
      log(`Erro ao buscar utente: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });

  // Add utente test data (for testing purposes - only admin can use)
  app.post("/api/admin/utentes/test-data", ensureAdmin, async (req, res) => {
    try {
      const { utentes } = req.body;
      
      if (!Array.isArray(utentes) || utentes.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Dados de utentes inválidos"
        });
      }
      
      const createdReports = [];
      
      // For each utente, create a draft medical report
      for (const utente of utentes) {
        if (!utente.processNumber || !utente.name || !utente.age || !utente.gender) {
          continue; // Skip invalid utentes
        }
        
        // Create a draft medical report for this utente
        const reportData = {
          processNumber: utente.processNumber,
          name: utente.name,
          age: utente.age,
          gender: utente.gender,
          diagnosis: "Dados de teste",
          symptoms: "Dados de teste",
          treatment: "Dados de teste",
          observations: "Utente de teste criado pelo administrador",
          status: "draft",
          userId: req.user.id
        };
        
        const report = await storage.createMedicalReport(reportData);
        createdReports.push(report);
        
        // Log the action
        await logAuditTrail(req, "create", "medical_report", report.id, {
          message: "Utente de teste criado pelo administrador",
        });
      }
      
      res.status(201).json({
        success: true,
        message: `${createdReports.length} utentes de teste criados com sucesso`,
        data: createdReports
      });
    } catch (error) {
      log(`Erro ao criar utentes de teste: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });
  
  // Manter endpoint legado para compatibilidade
  app.post("/api/admin/patients/test-data", ensureAdmin, async (req, res) => {
    try {
      // Redirecionando para o novo endpoint
      const utentes = req.body.patients || [];
      
      if (!Array.isArray(utentes) || utentes.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Dados de utentes inválidos"
        });
      }
      
      const createdReports = [];
      
      // Para cada utente, criar um relatório médico de rascunho
      for (const utente of utentes) {
        if (!utente.processNumber || !utente.name || !utente.age || !utente.gender) {
          continue; // Pular utentes inválidos
        }
        
        // Criar um relatório médico de rascunho para este utente
        const reportData = {
          processNumber: utente.processNumber,
          name: utente.name,
          age: utente.age,
          gender: utente.gender,
          diagnosis: "Dados de teste",
          symptoms: "Dados de teste",
          treatment: "Dados de teste",
          observations: "Utente de teste criado pelo administrador",
          status: "draft",
          userId: req.user.id
        };
        
        const report = await storage.createMedicalReport(reportData);
        createdReports.push(report);
        
        // Log da ação
        await logAuditTrail(req, "create", "medical_report", report.id, {
          message: "Utente de teste criado pelo administrador",
        });
      }
      
      res.status(201).json({
        success: true,
        message: `${createdReports.length} utentes de teste criados com sucesso`,
        data: createdReports
      });
    } catch (error) {
      log(`Erro ao criar utentes de teste: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });

  // ==== Patient Consent Routes ====
  
  // Create patient consent
  app.post("/api/patient-consents", ensureAuthenticated, async (req, res) => {
    try {
      // Add user ID to the consent data
      const consentData = {
        ...req.body,
        consentDate: new Date(),
        userId: req.user.id
      };
      
      // Validate request body
      const data = insertPatientConsentSchema.parse(consentData);
      
      // Create new consent record
      const consent = await storage.createPatientConsent(data);
      
      // Log the action
      await logAuditTrail(req, "create", "patient_consent", consent.id, {
        processNumber: consent.processNumber,
        consentType: consent.consentType,
        consentGranted: consent.consentGranted
      });
      
      res.status(201).json({
        success: true,
        message: "Consentimento de paciente registrado com sucesso",
        data: consent
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          success: false,
          message: "Erro de validação",
          errors: validationError.details
        });
      } else {
        log(`Error creating patient consent: ${error}`, "api");
        res.status(500).json({
          success: false,
          message: "Erro interno do servidor"
        });
      }
    }
  });
  
  // Get patient consent by process number and type
  app.get("/api/patient-consents/:processNumber/:consentType", ensureAuthenticated, async (req, res) => {
    try {
      const { processNumber, consentType } = req.params;
      
      // Get the most recent consent for this process number and type
      const consent = await storage.getPatientConsentByProcessNumber(processNumber, consentType);
      
      if (!consent) {
        return res.status(404).json({
          success: false,
          message: "Consentimento não encontrado",
          data: { consentExists: false }
        });
      }
      
      res.json({
        success: true,
        data: {
          ...consent,
          consentExists: true
        }
      });
    } catch (error) {
      log(`Error fetching patient consent: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });
  
  // Update patient consent
  app.put("/api/patient-consents/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Formato de ID inválido"
        });
      }
      
      // Check if the consent exists
      const existingConsent = await storage.getPatientConsent(id);
      if (!existingConsent) {
        return res.status(404).json({
          success: false,
          message: "Consentimento não encontrado"
        });
      }
      
      // Validate request body
      const updateData = {
        ...req.body,
        consentDate: new Date(), // Update consent date on changes
      };
      
      // Update consent
      const updatedConsent = await storage.updatePatientConsent(id, updateData);
      
      // Log the action
      await logAuditTrail(req, "update", "patient_consent", id, {
        processNumber: updatedConsent.processNumber,
        consentType: updatedConsent.consentType,
        consentGranted: updatedConsent.consentGranted,
        changes: req.body
      });
      
      res.json({
        success: true,
        message: "Consentimento atualizado com sucesso",
        data: updatedConsent
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          success: false,
          message: "Erro de validação",
          errors: validationError.details
        });
      } else {
        log(`Error updating patient consent: ${error}`, "api");
        res.status(500).json({
          success: false,
          message: "Erro interno do servidor"
        });
      }
    }
  });

  // ==== Access Request Routes ====
  
  // Create access request (does not require authentication)
  app.post("/api/request-access", async (req: Request, res: Response) => {
    try {
      log(`Received access request with data: ${JSON.stringify(req.body)}`, "api");
      
      // Validate request body
      const data = insertAccessRequestSchema.parse(req.body);
      log(`Validated access request data: ${JSON.stringify(data)}`, "api");
      
      // Create new access request
      const request = await storage.createAccessRequest(data);
      log(`Created access request with ID: ${request.id}`, "api");
      
      // Log the action (using null user ID since this is a public endpoint)
      try {
        await storage.createAuditLog({
          userId: null,
          action: "create",
          resourceType: "access_request",
          resourceId: request.id,
          details: {
            email: request.email,
            specialty: request.specialty,
            status: request.status
          },
          ipAddress: req.ip
        });
        log(`Created audit log for access request ID: ${request.id}`, "api");
      } catch (auditError) {
        log(`Error creating audit log: ${auditError}`, "api");
        // Continue even if audit log fails
      }
      
      res.status(201).json({
        success: true,
        message: "Solicitação de acesso enviada com sucesso",
        data: {
          id: request.id,
          email: request.email,
          status: request.status
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        log(`Validation error for access request: ${JSON.stringify(validationError.details)}`, "api");
        res.status(400).json({
          success: false,
          message: "Erro de validação",
          errors: validationError.details
        });
      } else {
        log(`Error creating access request: ${error}`, "api");
        res.status(500).json({
          success: false,
          message: "Erro interno do servidor"
        });
      }
    }
  });
  
  // Get pending access requests (admin only)
  app.get("/api/access-requests/pending", ensureAdmin, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getPendingAccessRequests();
      
      res.json({
        success: true,
        data: requests
      });
    } catch (error) {
      log(`Error fetching pending access requests: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });
  
  // Endpoint para solicitar recuperação de senha
  app.post("/api/reset-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "E-mail é obrigatório"
        });
      }
      
      // Buscar usuário pelo e-mail (buscamos nas solicitações de acesso primeiro)
      const pendingRequests = await storage.getPendingAccessRequests();
      const matchingRequest = pendingRequests.find(request => request.email.toLowerCase() === email.toLowerCase());
      
      // Se não encontrarmos o e-mail nas solicitações, checamos os usuários
      // Na prática precisaríamos de um campo de e-mail na tabela de usuários
      // Para este exemplo, vamos simular uma resposta de sucesso
      
      // Log da tentativa de recuperação (sem dados sensíveis)
      await storage.createAuditLog({
        userId: null,
        action: "request",
        resourceType: "password_reset",
        resourceId: null,
        details: {
          email: email,
          ipAddress: req.ip,
          requestTime: new Date().toISOString()
        },
        ipAddress: req.ip
      });
      
      // Registrar esta recuperação de senha como uma comunicação
      if (matchingRequest) {
        // Enviar e-mail em uma aplicação real
        
        // Notificar os administradores (em uma aplicação real, isso enviaria um e-mail)
        const adminUsers = await storage.getAllUsers().then(users => 
          users.filter(user => user.role === "admin")
        );
        
        // Log para cada administrador que deve ser notificado
        for (const admin of adminUsers) {
          await storage.createAuditLog({
            userId: admin.id,
            action: "notify",
            resourceType: "password_reset",
            resourceId: null,
            details: {
              adminId: admin.id,
              userEmail: email,
              requestTime: new Date().toISOString()
            },
            ipAddress: req.ip
          });
        }
      }
      
      // Sempre retornar sucesso para não revelar se o e-mail existe ou não (segurança)
      return res.status(200).json({
        success: true,
        message: "Se o e-mail estiver registrado, você receberá instruções para redefinir sua senha."
      });
      
    } catch (error) {
      log(`Error processing password reset: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });

  // Approve/reject access request (admin only)
  app.put("/api/access-requests/:id", ensureAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Formato de ID inválido"
        });
      }
      
      const { action, comments } = req.body;
      
      if (action !== "approve" && action !== "reject") {
        return res.status(400).json({
          success: false,
          message: "Ação inválida. Use 'approve' ou 'reject'."
        });
      }
      
      // Get the request
      const accessRequest = await storage.getAccessRequest(id);
      if (!accessRequest) {
        return res.status(404).json({
          success: false,
          message: "Solicitação de acesso não encontrada"
        });
      }
      
      // Update the request status
      const status = action === "approve" ? "approved" : "rejected";
      
      // For approved requests, generate a temporary password
      let temporaryPassword = null;
      if (status === "approved") {
        // Generate a random password (in real app would be more secure)
        temporaryPassword = Math.random().toString(36).slice(-8);
      }
      
      const updatedRequest = await storage.updateAccessRequest(id, {
        status,
        reviewedBy: req.user.id,
        reviewDate: new Date(),
        comments,
        temporaryPassword
      });
      
      // Log the action
      await logAuditTrail(req, action, "access_request", id, {
        email: accessRequest.email,
        status: status,
        comments: comments || ""
      });
      
      // If approved, create a new user account
      if (status === "approved" && temporaryPassword) {
        // Generate a username from the email (part before @)
        const username = accessRequest.email.split('@')[0];
        
        // Hash the temporary password
        const hashedPassword = await hashPassword(temporaryPassword);
        
        // Create the user
        const newUser = await storage.createUser({
          username,
          password: hashedPassword,
          name: accessRequest.fullName,
          role: "doctor",
          specialty: accessRequest.specialty
        });
        
        // Log the user creation
        await logAuditTrail(req, "create", "user", newUser.id, {
          username,
          role: "doctor",
          fromAccessRequest: accessRequest.id
        });
        
        // In a real application, send an email to the user with their credentials
        // This would be implemented using an email service
        
        return res.json({
          success: true,
          message: "Solicitação aprovada e usuário criado com sucesso",
          data: {
            accessRequest: {
              id: updatedRequest.id,
              email: updatedRequest.email,
              status: updatedRequest.status
            },
            user: {
              id: newUser.id,
              username: newUser.username,
              name: newUser.name,
              role: newUser.role
            },
            // In a real app, the temporary password would be emailed, not returned in the response
            temporaryPassword
          }
        });
      }
      
      res.json({
        success: true,
        message: action === "approve" 
          ? "Solicitação aprovada com sucesso" 
          : "Solicitação rejeitada com sucesso",
        data: {
          id: updatedRequest.id,
          email: updatedRequest.email,
          status: updatedRequest.status
        }
      });
    } catch (error) {
      log(`Error processing access request: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
