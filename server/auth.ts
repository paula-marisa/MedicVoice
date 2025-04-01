import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { type User as UserType, type InsertUser, auditLogs } from "@shared/schema";
import { log } from "./vite";

// Add User type to Express.User
declare global {
  namespace Express {
    // Extend the User interface
    interface User extends UserType {}
  }
}

const scryptAsync = promisify(scrypt);

// Hash password with salt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare password with stored hash
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Log authentication activities
async function logAuthActivity(action: string, userId?: number, details?: any, req?: Request) {
  try {
    if (userId) {
      await storage.createAuditLog({
        userId,
        action,
        resourceType: "auth",
        details,
        ipAddress: req?.ip
      });
    }
  } catch (error) {
    log(`Error logging auth activity: ${error}`, "auth");
  }
}

// Setup authentication
// Function to initialize admin user
export async function initAdminUser() {
  try {
    log("Initializing admin user...", "auth");
    
    // Verificar se o usuário admin já existe
    const adminUser = await storage.getUserByUsername("admin");
    log(`Admin user exists? ${!!adminUser}`, "auth");
    
    // Se não existir, criar o usuário admin
    if (!adminUser) {
      const adminData: InsertUser = {
        username: "admin",
        password: await hashPassword("admin123"), // Atualizado para senha mais simples
        name: "Administrador",
        role: "admin",
        specialty: "Administração"
      };
      const newAdmin = await storage.createUser(adminData);
      log(`Admin user created successfully with ID: ${newAdmin.id}`, "auth");
    } else {
      // Atualizar a senha do admin para garantir que seja a correta
      log(`Updating admin password for user ID: ${adminUser.id}`, "auth");
      await storage.updateUser(adminUser.id, {
        password: await hashPassword("admin123") // Atualizado para senha mais simples
      });
      log("Admin password updated to 'admin123'", "auth");
    }
  } catch (error) {
    log(`Error managing admin user: ${error}`, "auth");
  }
}

export function setupAuth(app: Express) {
  // Session settings
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local authentication strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user || !(await comparePasswords(password, user.password))) {
          await logAuthActivity("login_failed", undefined, { username });
          return done(null, false, { message: "Credenciais inválidas" });
        }
        
        await logAuthActivity("login_success", user.id);
        return done(null, user);
      } catch (error) {
        log(`Authentication error: ${error}`, "auth");
        return done(error);
      }
    })
  );

  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Create admin user if it doesn't exist when setting up auth
  initAdminUser().catch(error => log(`Failed to initialize admin user: ${error}`, "auth"));

  // Normal registration (when no user exists in the system)
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if any user exists in the system
      const allUsers = await storage.getAllUsers();
      
      // If we have users in the system, only admins can register new users
      if (allUsers.length > 0) {
        // Check if the current user is authenticated and is an admin
        if (!req.isAuthenticated() || req.user.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "Apenas administradores podem registrar novos usuários"
          });
        }
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Nome de usuário já existe"
        });
      }

      // Create the user with hashed password
      const userData: InsertUser = {
        ...req.body,
        password: await hashPassword(req.body.password)
      };
      
      const user = await storage.createUser(userData);
      
      // Log the registration
      if (req.isAuthenticated()) {
        await logAuthActivity("user_registered", user.id, { 
          registeredBy: req.user.id 
        }, req);
      } else {
        await logAuthActivity("user_registered", user.id, { 
          registeredBy: "self" 
        }, req);
      }

      // Return success without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({
        success: true,
        user: userWithoutPassword,
        message: "Usuário registrado com sucesso"
      });
      
      // If this is a self-registration, log them in automatically
      if (!req.isAuthenticated()) {
        req.login(user, (err) => {
          if (err) return next(err);
        });
      }
    } catch (error) {
      log(`Registration error: ${error}`, "auth");
      res.status(500).json({
        success: false,
        message: "Erro ao registrar usuário"
      });
    }
  });

  // Login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: UserType | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: info?.message || "Credenciais inválidas"
        });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return success without password
        const { password, ...userWithoutPassword } = user;
        res.status(200).json({
          success: true,
          user: userWithoutPassword
        });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/logout", async (req, res, next) => {
    // Log the logout before destroying the session
    const userId = req.user?.id;
    
    req.logout((err) => {
      if (err) return next(err);
      
      // Destroy the session
      req.session.destroy(async (err) => {
        if (err) return next(err);
        
        // Log the logout
        if (userId) {
          await logAuthActivity("logout", userId, null, req);
        }
        
        res.status(200).json({
          success: true,
          message: "Logout realizado com sucesso"
        });
      });
    });
  });

  // Get current authenticated user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado"
      });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = req.user;
    res.json({
      success: true,
      user: userWithoutPassword
    });
  });

  // Middleware to check if user is authenticated
  app.use("/api/protected", ensureAuthenticated);
}

// Middleware to ensure user is authenticated
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({
    success: false,
    message: "Autenticação necessária"
  });
}

// Middleware to ensure user is an admin
export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  
  res.status(403).json({
    success: false,
    message: "Acesso permitido apenas para administradores"
  });
}