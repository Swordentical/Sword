import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { Express } from "express";
import type { User } from "@shared/schema";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User extends Omit<import("@shared/schema").User, "password"> {}
  }
}

const PgSession = connectPgSimple(session);

export function setupAuth(app: Express) {
  // Trust proxy for Replit environment (needed for secure cookies over HTTPS proxy)
  app.set("trust proxy", 1);

  const sessionSettings: session.SessionOptions = {
    store: new PgSession({
      pool: pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "dental-clinic-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // Always use secure cookies (Replit always uses HTTPS)
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "none" as const, // Required for cross-origin cookies in Replit iframe
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        if (!user.isActive) {
          return done(null, false, { message: "Account is disabled" });
        }

        if (user.role === "pending") {
          return done(null, false, { message: "Your account is pending approval. Please wait for an administrator to activate your account." });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, firstName, lastName, email, phone } = req.body;

      if (!username || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Always set role to 'pending' - admin must approve and assign role
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        role: "pending",
        isActive: true,
      });

      const { password: _, ...userWithoutPassword } = user;

      // Don't auto-login pending users - they must wait for admin approval
      res.status(201).json({
        message: "Registration successful. Your account is pending approval by an administrator.",
        user: userWithoutPassword,
      });
    } catch (error) {
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}
