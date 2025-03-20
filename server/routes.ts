import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMedicalReportSchema, 
  insertCommunicationLogSchema, 
  type User, 
  type InsertMedicalReport
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth, ensureAuthenticated, ensureAdmin, initAdminUser } from "./auth";
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
      
      // Check if the user is the owner of the report
      if (report.userId !== req.user.id) {
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

  // ==== Patient Routes ====

  // Get patient by process number
  app.get("/api/patients/:processNumber", ensureAuthenticated, async (req, res) => {
    try {
      const { processNumber } = req.params;
      
      if (!processNumber) {
        return res.status(400).json({
          success: false,
          message: "Número de processo é obrigatório"
        });
      }
      
      // Check if there's a report with this process number to get patient info
      const reports = await storage.getAllMedicalReports();
      const patientReport = reports.find(report => report.processNumber === processNumber);
      
      if (!patientReport) {
        return res.status(404).json({
          success: false,
          message: "Paciente não encontrado"
        });
      }
      
      // Return patient info from the report
      const patientInfo = {
        processNumber: patientReport.processNumber,
        name: patientReport.name,
        age: patientReport.age,
        gender: patientReport.gender
      };
      
      res.json(patientInfo);
    } catch (error) {
      log(`Error fetching patient: ${error}`, "api");
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  });

  // Add patient test data (for testing purposes - only admin can use)
  app.post("/api/admin/patients/test-data", ensureAdmin, async (req, res) => {
    try {
      const { patients } = req.body;
      
      if (!Array.isArray(patients) || patients.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Dados de pacientes inválidos"
        });
      }
      
      const createdReports = [];
      
      // For each patient, create a draft medical report
      for (const patient of patients) {
        if (!patient.processNumber || !patient.name || !patient.age || !patient.gender) {
          continue; // Skip invalid patients
        }
        
        // Create a draft medical report for this patient
        const reportData = {
          processNumber: patient.processNumber,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          diagnosis: "Dados de teste",
          symptoms: "Dados de teste",
          treatment: "Dados de teste",
          observations: "Paciente de teste criado pelo administrador",
          status: "draft",
          userId: req.user.id
        };
        
        const report = await storage.createMedicalReport(reportData);
        createdReports.push(report);
        
        // Log the action
        await logAuditTrail(req, "create", "medical_report", report.id, {
          message: "Paciente de teste criado pelo administrador",
        });
      }
      
      res.status(201).json({
        success: true,
        message: `${createdReports.length} pacientes de teste criados com sucesso`,
        data: createdReports
      });
    } catch (error) {
      log(`Error creating test patients: ${error}`, "api");
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
