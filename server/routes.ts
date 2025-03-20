import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMedicalReportSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create medical report
  app.post("/api/medical-reports", async (req, res) => {
    try {
      // Validate request body
      const data = insertMedicalReportSchema.parse(req.body);
      
      // Create new report
      const report = await storage.createMedicalReport(data);
      
      res.status(201).json({
        success: true,
        message: "Medical report created successfully",
        data: report
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validationError.details
        });
      } else {
        console.error("Error creating medical report:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error"
        });
      }
    }
  });

  // Get all medical reports
  app.get("/api/medical-reports", async (req, res) => {
    try {
      const reports = await storage.getAllMedicalReports();
      res.json({
        success: true,
        data: reports
      });
    } catch (error) {
      console.error("Error fetching medical reports:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Get medical report by ID
  app.get("/api/medical-reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format"
        });
      }
      
      const report = await storage.getMedicalReport(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Medical report not found"
        });
      }
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error("Error fetching medical report:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Update medical report by ID
  app.put("/api/medical-reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format"
        });
      }
      
      // Validate request body
      const data = insertMedicalReportSchema.parse(req.body);
      
      // Update report
      const updatedReport = await storage.updateMedicalReport(id, data);
      if (!updatedReport) {
        return res.status(404).json({
          success: false,
          message: "Medical report not found"
        });
      }
      
      res.json({
        success: true,
        message: "Medical report updated successfully",
        data: updatedReport
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validationError.details
        });
      } else {
        console.error("Error updating medical report:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error"
        });
      }
    }
  });

  // Delete medical report by ID
  app.delete("/api/medical-reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format"
        });
      }
      
      const success = await storage.deleteMedicalReport(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Medical report not found"
        });
      }
      
      res.json({
        success: true,
        message: "Medical report deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting medical report:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
