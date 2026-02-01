import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, type ClinicScopeOptions } from "./storage";
import { setupAuth } from "./auth";
import { db } from "./db";
import { subscriptionService } from "./subscription";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { requireClinicScope } from "./middleware/clinic-scope";
import bcrypt from "bcrypt";

// Helper to get clinic scope from request
function getScope(req: Request): ClinicScopeOptions {
  return {
    clinicId: req.clinicId,
    isSuperAdmin: req.isSuperAdmin
  };
}
import {
  insertPatientSchema,
  insertTreatmentSchema,
  insertPatientTreatmentSchema,
  insertAppointmentSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertPaymentSchema,
  insertPaymentPlanSchema,
  insertPaymentPlanInstallmentSchema,
  insertInvoiceAdjustmentSchema,
  insertExpenseSchema,
  insertDoctorPaymentSchema,
  insertInsuranceClaimSchema,
  insertInventoryItemSchema,
  insertLabCaseSchema,
  insertDocumentSchema,
  insertUserSchema,
  insertExternalLabSchema,
  insertLabServiceSchema,
  insertNotificationPreferencesSchema,
  patients,
  documents,
  patientTreatments,
  appointments,
  invoices,
  invoiceItems,
  invoiceAdjustments,
  payments,
  paymentPlans,
  paymentPlanInstallments,
  insuranceClaims,
  treatments,
  inventoryItems,
  labCases,
  users,
  externalLabs,
  labServices,
  expenses,
  doctorPayments,
  clinicRooms,
  activityLog,
  subscriptionPlans,
  organizations,
  promoCodes,
  passwordResetTokens,
  notifications,
  notificationPreferences,
  type PlanFeatures,
  type InsertNotification,
} from "@shared/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { z } from "zod";
import { notifyAdminsPasswordResetRequest, notifyPasswordResetByAdmin, notifyLowStock, notifyDoctorPaymentIssued } from "./notificationService";

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.user as any;
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up authentication FIRST
  setupAuth(app);

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // Dashboard stats
  app.get("/api/dashboard/stats", requireClinicScope, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(getScope(req));
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Activity log - admin only access
  app.get("/api/activity/all", requireClinicScope, async (req, res) => {
    try {
      const activity = await storage.getRecentActivity(100, getScope(req));
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Audit logs - admin only, immutable records for financial integrity
  // These logs are append-only and cannot be modified or deleted
  app.get("/api/audit-logs", requireClinicScope, async (req, res) => {
    try {
      const { entityType, entityId, userId, actionType, startDate, endDate, limit } = req.query;
      const auditLogs = await storage.getAuditLogs({
        entityType: entityType as string,
        entityId: entityId as string,
        userId: userId as string,
        actionType: actionType as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string) : 200,
      }, getScope(req));
      res.json(auditLogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Get list of users for audit log filtering
  app.get("/api/audit-logs/users", requireClinicScope, async (req, res) => {
    try {
      const usersList = await storage.getUsers({}, getScope(req));
      res.json(usersList.map(u => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, role: u.role })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users list" });
    }
  });

  // Users
  app.get("/api/users", requireClinicScope, async (req, res) => {
    try {
      const role = req.query.role as string | undefined;
      let usersList = await storage.getUsers({ role }, getScope(req));
      
      // Never return super_admin users to regular clinic admins/staff
      const currentUser = req.user as any;
      if (currentUser.role !== "super_admin") {
        usersList = usersList.filter(u => u.role !== "super_admin");
      }
      
      res.json(usersList.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireClinicScope, async (req, res) => {
    try {
      const scope = getScope(req);
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      // Check for existing user (unscoped for username uniqueness check across all clinics)
      const existingUser = await storage.getUserByUsername(parsed.data.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

      // Set organizationId from authenticated user's clinic
      const user = await storage.createUser({
        ...parsed.data,
        password: hashedPassword,
        organizationId: scope.clinicId || parsed.data.organizationId,
      });

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "created",
        entityType: "user",
        entityId: user.id,
        details: `Created user ${user.firstName} ${user.lastName}`,
      });

      res.status(201).json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireClinicScope, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const scope = getScope(req);
      
      // Don't allow password updates through this endpoint
      delete updates.password;
      delete updates.username;
      
      const user = await storage.updateUser(id, updates, scope);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "updated",
        entityType: "user",
        entityId: user.id,
        details: `Updated user ${user.firstName} ${user.lastName}`,
      });

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireClinicScope, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = (req.user as any).id;
      const scope = getScope(req);
      
      if (id === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const user = await storage.getUser(id, scope);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(id, scope);

      await storage.logActivity({
        userId: currentUserId,
        action: "deleted",
        entityType: "user",
        entityId: id,
        details: `Deleted user ${user.firstName} ${user.lastName}`,
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get pending users for admin approval
  app.get("/api/users/pending", requireClinicScope, async (req, res) => {
    try {
      const pendingUsers = await storage.getUsers({ role: "pending" }, getScope(req));
      res.json(pendingUsers.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  // Approve user and assign role (admin only)
  app.post("/api/users/:id/approve", requireClinicScope, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const scope = getScope(req);
      
      const validRoles = ["admin", "doctor", "staff", "student"];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ 
          message: "Invalid role. Must be one of: admin, doctor, staff, student" 
        });
      }
      
      const user = await storage.getUser(id, scope);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role !== "pending") {
        return res.status(400).json({ message: "User is already approved" });
      }
      
      const previousRole = user.role;
      const updatedUser = await storage.updateUser(id, { role }, scope);
      
      // Log the role assignment with full audit trail
      await storage.logActivity({
        userId: (req.user as any).id,
        action: "approved",
        entityType: "user",
        entityId: id,
        details: `Approved user ${user.firstName} ${user.lastName} and assigned role: ${role}`,
      });
      
      res.json({ 
        message: `User approved and assigned role: ${role}`,
        user: { ...updatedUser, password: undefined }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  // Change user role (admin only) - for users already approved
  app.post("/api/users/:id/role", requireClinicScope, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const scope = getScope(req);
      
      const validRoles = ["admin", "doctor", "staff", "student", "pending"];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ 
          message: "Invalid role. Must be one of: admin, doctor, staff, student, pending" 
        });
      }
      
      const user = await storage.getUser(id, scope);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currentUserId = (req.user as any).id;
      if (id === currentUserId && role === "pending") {
        return res.status(400).json({ message: "Cannot demote your own account to pending" });
      }
      
      const previousRole = user.role;
      const updatedUser = await storage.updateUser(id, { role }, scope);
      
      // Log the role change with full audit trail
      await storage.logActivity({
        userId: currentUserId,
        action: "role_changed",
        entityType: "user",
        entityId: id,
        details: `Changed role for ${user.firstName} ${user.lastName} from ${previousRole} to ${role}`,
      });
      
      res.json({ 
        message: `User role changed from ${previousRole} to ${role}`,
        user: { ...updatedUser, password: undefined }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to change user role" });
    }
  });

  // ==================== PASSWORD MANAGEMENT ====================

  // Change own password (for logged-in users)
  app.post("/api/users/change-password", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      // Get user with current password
      const scope = getScope(req);
      const dbUser = await storage.getUser(user.id, scope);
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, dbUser.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword }, scope);

      // Log the password change
      await storage.logActivity({
        userId: user.id,
        action: "password_changed",
        entityType: "user",
        entityId: user.id,
        details: `User ${user.firstName} ${user.lastName} changed their password`,
      });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Admin reset password for any user
  app.post("/api/users/:id/reset-password", requireClinicScope, async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const adminUser = req.user as any;
      const scope = getScope(req);

      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const targetUser = await storage.getUser(id, scope);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(id, { password: hashedPassword }, scope);

      // Create audit log entry for admin password reset
      await db.insert(passwordResetTokens).values({
        userId: id,
        token: `admin_reset_${Date.now()}`,
        resetMethod: "admin",
        initiatedBy: adminUser.id,
        used: true,
        expiresAt: new Date(),
      });

      // Log the activity
      await storage.logActivity({
        userId: adminUser.id,
        action: "admin_reset_password",
        entityType: "user",
        entityId: id,
        details: `Admin ${adminUser.firstName} ${adminUser.lastName} reset password for ${targetUser.firstName} ${targetUser.lastName}`,
      });

      // Notify user that their password was reset by admin
      try {
        await notifyPasswordResetByAdmin(
          id, 
          `${adminUser.firstName} ${adminUser.lastName}`,
          targetUser.organizationId ?? undefined
        );
      } catch (notifyError) {
        console.error("Failed to notify user:", notifyError);
      }

      res.json({ message: `Password reset successfully for ${targetUser.firstName} ${targetUser.lastName}` });
    } catch (error) {
      console.error("Admin password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Request password reset (forgot password - generates token)
  app.post("/api/password/forgot", async (req, res) => {
    try {
      const { identifier } = req.body; // Can be email, phone, or username

      if (!identifier) {
        return res.status(400).json({ message: "Email, phone, or username is required" });
      }

      // Find user by email, phone, or username
      // Use super admin scope for password reset lookup since this is a legitimate public endpoint
      // The response deliberately doesn't reveal if a user exists for security
      const systemScope: ClinicScopeOptions = { isSuperAdmin: true };
      const allUsers = await storage.getUsers({}, systemScope);
      const user = allUsers.find((u: any) => 
        u.email === identifier || 
        u.phone === identifier || 
        u.username === identifier
      );

      if (!user) {
        // Don't reveal if user exists for security
        return res.json({ 
          message: "If an account with that identifier exists, a password reset will be initiated. Please contact the administrator.",
          requiresAdmin: true
        });
      }

      // Generate reset token
      const token = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

      // Determine reset method based on identifier
      let resetMethod = "email";
      if (user.phone === identifier) resetMethod = "phone";
      else if (user.username === identifier) resetMethod = "username";

      // Store the reset token
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        resetMethod,
        expiresAt,
      });

      // Notify admins about the password reset request
      try {
        await notifyAdminsPasswordResetRequest(user.id, identifier, user.organizationId ?? undefined);
      } catch (notifyError) {
        console.error("Failed to notify admins:", notifyError);
      }

      // For now, without email/SMS integration, return info for admin reset
      // In production, this would send an email or SMS
      res.json({ 
        message: "Password reset request recorded. Please contact your administrator to complete the reset.",
        resetToken: token, // Only return in dev mode for testing
        expiresAt,
        requiresAdmin: true,
        hint: "An administrator can reset your password from the User Management section."
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Verify reset token and set new password
  app.post("/api/password/reset", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      // Find valid token
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token));

      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      if (resetToken.used) {
        return res.status(400).json({ message: "This reset token has already been used" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Hash new password and update user
      // Use super admin scope for password reset since this is a legitimate token-based reset
      const systemScope: ClinicScopeOptions = { isSuperAdmin: true };
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(resetToken.userId, { password: hashedPassword }, systemScope);

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, resetToken.id));

      // Log the activity
      const user = await storage.getUser(resetToken.userId, systemScope);
      await storage.logActivity({
        userId: resetToken.userId,
        action: "password_reset",
        entityType: "user",
        entityId: resetToken.userId,
        details: `Password reset for ${user?.firstName} ${user?.lastName} via ${resetToken.resetMethod}`,
      });

      res.json({ message: "Password reset successfully. You can now sign in with your new password." });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ==================== END PASSWORD MANAGEMENT ====================

  // ==================== NOTIFICATIONS ====================

  // Get user notifications
  app.get("/api/notifications", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const { unreadOnly } = req.query;
      
      const whereCondition = unreadOnly === "true" 
        ? and(eq(notifications.userId, user.id), eq(notifications.isRead, false))
        : eq(notifications.userId, user.id);
      
      const userNotifications = await db.select()
        .from(notifications)
        .where(whereCondition)
        .orderBy(desc(notifications.createdAt))
        .limit(50);
      
      res.json(userNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
      
      res.json({ count: Number(result[0]?.count || 0) });
    } catch (error) {
      console.error("Failed to get unread count:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const { id } = req.params;
      
      // Verify ownership
      const notification = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
      if (!notification.length || notification[0].userId !== user.id) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      await db.update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.id, id));
      
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/mark-all-read", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      
      await db.update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
      
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const { id } = req.params;
      
      // Verify ownership
      const notification = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
      if (!notification.length || notification[0].userId !== user.id) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      await db.delete(notifications).where(eq(notifications.id, id));
      
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Clear all notifications
  app.delete("/api/notifications", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      
      await db.delete(notifications).where(eq(notifications.userId, user.id));
      
      res.json({ message: "All notifications cleared" });
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      res.status(500).json({ message: "Failed to clear notifications" });
    }
  });

  // Get notification preferences
  app.get("/api/notification-preferences", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      
      let prefs = await db.select().from(notificationPreferences)
        .where(eq(notificationPreferences.userId, user.id))
        .limit(1);
      
      // Create default preferences if none exist
      if (!prefs.length) {
        const newPrefs = await db.insert(notificationPreferences)
          .values({ userId: user.id })
          .returning();
        prefs = newPrefs;
      }
      
      res.json(prefs[0]);
    } catch (error) {
      console.error("Failed to fetch notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  // Update notification preferences
  app.patch("/api/notification-preferences", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Validate request body with strict schema
      const updateSchema = insertNotificationPreferencesSchema.pick({
        passwordResetInApp: true,
        lowStockInApp: true,
        appointmentReminderInApp: true,
        securityAlertInApp: true,
        passwordResetEmail: true,
        lowStockEmail: true,
        appointmentReminderEmail: true,
        securityAlertEmail: true,
        passwordResetSms: true,
        lowStockSms: true,
        appointmentReminderSms: true,
        securityAlertSms: true,
      }).partial().strict();
      
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }
      
      // Ensure preferences exist
      let prefs = await db.select().from(notificationPreferences)
        .where(eq(notificationPreferences.userId, user.id))
        .limit(1);
      
      if (!prefs.length) {
        await db.insert(notificationPreferences).values({ userId: user.id });
      }
      
      // Update preferences with validated data only
      const updated = await db.update(notificationPreferences)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(notificationPreferences.userId, user.id))
        .returning();
      
      res.json(updated[0]);
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // Platform - Organizations
  app.get("/api/platform/organizations", requireClinicScope, requireRole("super_admin"), async (req, res) => {
    try {
      const orgs = await storage.getOrganizations();
      res.json(orgs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post("/api/platform/organizations", requireClinicScope, requireRole("super_admin"), async (req, res) => {
    try {
      const { name, slug, adminUsername, adminPassword, adminFirstName, adminLastName } = req.body;
      
      // Check if organization slug exists
      const existingOrg = await storage.getOrganizationBySlug(slug);
      if (existingOrg) {
        return res.status(409).json({ message: "Organization slug already exists" });
      }

      // Check if username exists
      const existingUser = await storage.getUserByUsername(adminUsername);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Create Organization
      const org = await storage.createOrganization({
        name,
        slug,
        subscriptionStatus: "trial",
        isActive: true
      });

      // Hash password
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create Admin User for this organization
      const user = await storage.createUser({
        username: adminUsername,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        role: "clinic_admin",
        organizationId: org.id,
        isOrganizationOwner: true,
        isActive: true
      });

      // Update organization ownerId
      await storage.updateOrganization(org.id, { ownerId: user.id });

      res.status(201).json({ organization: org, admin: { ...user, password: undefined } });
    } catch (error) {
      console.error("Organization creation error:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.get("/api/platform/organizations/:id", requireClinicScope, requireRole("super_admin"), async (req, res) => {
    try {
      const org = await storage.getOrganization(req.params.id);
      if (!org) return res.status(404).json({ message: "Organization not found" });
      res.json(org);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  app.get("/api/platform/organizations/:id/users", requireClinicScope, requireRole("super_admin"), async (req, res) => {
    try {
      const users = await storage.getUsers({}, { clinicId: req.params.id, isSuperAdmin: true });
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/platform/organizations/:id", requireClinicScope, requireRole("super_admin"), async (req, res) => {
    try {
      const org = await storage.updateOrganization(req.params.id, req.body);
      res.json(org);
    } catch (error) {
      res.status(500).json({ message: "Failed to update organization" });
    }
  });

  app.get("/api/platform/metrics", requireClinicScope, requireRole("super_admin"), async (req, res) => {
    try {
      const orgs = await storage.getOrganizations();
      const totalRevenue = orgs.reduce((acc, org) => acc + (org.subscriptionStatus === 'active' ? 199 : 0), 0);
      
      res.json({
        totalOrganizations: orgs.length,
        activeSubscriptions: orgs.filter(o => o.subscriptionStatus === 'active').length,
        totalRevenue: totalRevenue,
        avgChurnRate: 1.2
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platform metrics" });
    }
  });

  app.post("/api/platform/impersonate", requireClinicScope, requireRole("super_admin"), async (req, res) => {
    try {
      const { organizationId, role } = req.body;
      if (!organizationId || !role) {
        return res.status(400).json({ message: "Organization ID and role are required" });
      }

      // Find a user with that role in that organization
      const usersInOrg = await storage.getUsersByClinic(organizationId, { isSuperAdmin: true });
      const targetUser = usersInOrg.find(u => u.role === role);

      if (!targetUser) {
        return res.status(404).json({ message: `No user with role ${role} found in this organization` });
      }

      // Perform login as that user
      req.login(targetUser, (err) => {
        if (err) return res.status(500).json({ message: "Impersonation failed" });
        res.json({ message: `Now logged in as ${targetUser.firstName} (${role})`, user: { ...targetUser, password: undefined } });
      });
    } catch (error) {
      res.status(500).json({ message: "Impersonation failed" });
    }
  });

  // ==================== END NOTIFICATIONS ====================

  // Patients
  app.get("/api/patients", requireClinicScope, async (req, res) => {
    try {
      const { search, assignedDoctorId, assignedStudentId } = req.query;
      const patientsList = await storage.getPatients({
        search: search as string,
        assignedDoctorId: assignedDoctorId as string,
        assignedStudentId: assignedStudentId as string,
      }, getScope(req));
      res.json(patientsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", requireClinicScope, async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id, getScope(req));
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", requireClinicScope, async (req, res) => {
    try {
      const scope = getScope(req);
      const parsed = insertPatientSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const user = req.user as any;
      const patient = await storage.createPatient({
        ...parsed.data,
        createdById: user.id,
        organizationId: scope.clinicId,
      });

      await storage.logActivity({
        userId: user.id,
        action: "created",
        entityType: "patient",
        entityId: patient.id,
        details: `Added patient ${patient.firstName} ${patient.lastName}`,
      });

      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "CREATE",
        entityType: "patient",
        entityId: patient.id,
        previousValue: null,
        newValue: patient,
        description: `Created patient ${patient.firstName} ${patient.lastName}`,
        ipAddress: req.ip || null,
      });

      res.status(201).json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.patch("/api/patients/:id", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role === "student") {
        return res.status(403).json({ message: "Students cannot update patient records" });
      }

      const updateSchema = insertPatientSchema.pick({
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        photoUrl: true,
        allergies: true,
        chronicConditions: true,
        currentMedications: true,
        medicalNotes: true,
        insuranceProvider: true,
        insurancePolicyNumber: true,
        dentalHistory: true,
        lastVisit: true,
        assignedDoctorId: true,
        assignedStudentId: true,
        notes: true,
      }).partial().strict();
      
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      // Get previous state for audit log
      const scope = getScope(req);
      const previousPatient = await storage.getPatient(req.params.id, scope);

      const patient = await storage.updatePatient(req.params.id, parsed.data, scope);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      await storage.logActivity({
        userId: user.id,
        action: "updated",
        entityType: "patient",
        entityId: patient.id,
        details: `Updated patient ${patient.firstName} ${patient.lastName}`,
      });

      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "UPDATE",
        entityType: "patient",
        entityId: patient.id,
        previousValue: previousPatient,
        newValue: patient,
        description: `Updated patient ${patient.firstName} ${patient.lastName}`,
        ipAddress: req.ip || null,
      });

      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  app.delete("/api/patients/:id", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const scope = getScope(req);
      const patient = await storage.getPatient(req.params.id, scope);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Check for related records that would prevent deletion
      const treatments = await storage.getPatientTreatments(req.params.id, scope);
      const invoices = await storage.getPatientInvoices(req.params.id, scope);
      const appointments = await storage.getAppointments({}, scope);
      const patientAppointments = appointments.filter(a => a.patientId === req.params.id);

      if (treatments.length > 0 || invoices.length > 0 || patientAppointments.length > 0) {
        const relatedItems = [];
        if (treatments.length > 0) relatedItems.push(`${treatments.length} treatment(s)`);
        if (invoices.length > 0) relatedItems.push(`${invoices.length} invoice(s)`);
        if (patientAppointments.length > 0) relatedItems.push(`${patientAppointments.length} appointment(s)`);
        
        return res.status(409).json({ 
          message: `Cannot delete patient. This patient has related records: ${relatedItems.join(", ")}. Please remove or archive these records first.`
        });
      }

      const deleted = await storage.deletePatient(req.params.id, scope);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete patient" });
      }

      await storage.logActivity({
        userId: user.id,
        action: "deleted",
        entityType: "patient",
        entityId: req.params.id,
        details: `Deleted patient ${patient.firstName} ${patient.lastName}`,
      });

      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "DELETE",
        entityType: "patient",
        entityId: req.params.id,
        previousValue: patient,
        newValue: null,
        description: `Deleted patient ${patient.firstName} ${patient.lastName}`,
        ipAddress: req.ip || null,
      });

      res.json({ message: "Patient deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // Patient treatments
  app.get("/api/patients/:id/treatments", requireClinicScope, async (req, res) => {
    try {
      const scope = getScope(req);
      const treatments = await storage.getPatientTreatments(req.params.id, scope);
      
      // Get treatment details for each
      const treatmentsList = await storage.getTreatments(scope);
      const treatmentMap = new Map(treatmentsList.map(t => [t.id, t]));
      
      const enriched = treatments.map(pt => ({
        ...pt,
        treatment: treatmentMap.get(pt.treatmentId),
      }));
      
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient treatments" });
    }
  });

  app.post("/api/patients/:id/treatments", requireClinicScope, async (req, res) => {
    try {
      const parsed = insertPatientTreatmentSchema.safeParse({
        ...req.body,
        patientId: req.params.id,
        doctorId: (req.user as any).role === 'doctor' ? (req.user as any).id : req.body.doctorId,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const treatment = await storage.createPatientTreatment(parsed.data);
      
      // Auto-create invoice when treatment is marked as in_progress
      if (parsed.data.status === "in_progress" && parsed.data.price) {
        const treatmentDetails = await storage.getTreatment(parsed.data.treatmentId);
        const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
        const totalAmount = parsed.data.price;
        
        const invoice = await storage.createInvoice({
          patientId: req.params.id,
          invoiceNumber,
          totalAmount,
          discountType: "none",
          discountValue: "0",
          finalAmount: totalAmount,
          paidAmount: "0",
          status: "sent",
          issuedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdById: (req.user as any).id,
        });
        
        // Add invoice item for the treatment
        await storage.createInvoiceItem({
          invoiceId: invoice.id,
          description: treatmentDetails?.name || "Treatment",
          quantity: 1,
          unitPrice: totalAmount,
          totalPrice: totalAmount,
        });
        
        await storage.logActivity({
          userId: (req.user as any).id,
          action: "created",
          entityType: "invoice",
          entityId: invoice.id,
          details: `Auto-created invoice ${invoiceNumber} for in-progress treatment`,
        });
      }
      
      res.status(201).json(treatment);
    } catch (error) {
      res.status(500).json({ message: "Failed to add treatment" });
    }
  });

  // Update patient treatment status
  app.patch("/api/patients/:id/treatments/:treatmentId", requireClinicScope, async (req, res) => {
    try {
      const { status, notes } = req.body;
      const existingTreatment = await storage.getPatientTreatment(req.params.treatmentId);
      
      if (!existingTreatment) {
        return res.status(404).json({ message: "Treatment not found" });
      }
      
      const updated = await storage.updatePatientTreatment(req.params.treatmentId, { status, notes });
      
      // Auto-create invoice when status changes to in_progress (if not already in_progress)
      if (status === "in_progress" && existingTreatment.status !== "in_progress" && existingTreatment.price) {
        const treatmentDetails = await storage.getTreatment(existingTreatment.treatmentId);
        const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
        const totalAmount = existingTreatment.price;
        
        const invoice = await storage.createInvoice({
          patientId: req.params.id,
          invoiceNumber,
          totalAmount,
          discountType: "none",
          discountValue: "0",
          finalAmount: totalAmount,
          paidAmount: "0",
          status: "sent",
          issuedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdById: (req.user as any).id,
        });
        
        // Add invoice item for the treatment
        await storage.createInvoiceItem({
          invoiceId: invoice.id,
          description: treatmentDetails?.name || "Treatment",
          quantity: 1,
          unitPrice: totalAmount,
          totalPrice: totalAmount,
        });
        
        await storage.logActivity({
          userId: (req.user as any).id,
          action: "created",
          entityType: "invoice",
          entityId: invoice.id,
          details: `Auto-created invoice ${invoiceNumber} for in-progress treatment`,
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating treatment:", error);
      res.status(500).json({ message: "Failed to update treatment" });
    }
  });

  // Delete patient treatment
  app.delete("/api/patients/:id/treatments/:treatmentId", requireClinicScope, async (req, res) => {
    try {
      await storage.deletePatientTreatment(req.params.treatmentId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting treatment:", error);
      res.status(500).json({ message: "Failed to delete treatment" });
    }
  });

  // Patient invoices
  app.get("/api/patients/:id/invoices", requireClinicScope, async (req, res) => {
    try {
      const invoicesList = await storage.getPatientInvoices(req.params.id);
      res.json(invoicesList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient invoices" });
    }
  });

  // Patient documents
  app.get("/api/patients/:id/documents", requireClinicScope, async (req, res) => {
    try {
      const docs = await storage.getPatientDocuments(req.params.id);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient documents" });
    }
  });

  app.post("/api/patients/:id/documents", requireClinicScope, async (req, res) => {
    try {
      const parsed = insertDocumentSchema.safeParse({
        ...req.body,
        patientId: req.params.id,
        uploadedById: (req.user as any).id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const doc = await storage.createDocument(parsed.data);
      res.status(201).json(doc);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete("/api/documents/:id", requireClinicScope, async (req, res) => {
    try {
      const deleted = await storage.deleteDocument(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Treatments (Services catalog)
  app.get("/api/treatments", requireClinicScope, async (req, res) => {
    try {
      const treatmentsList = await storage.getTreatments(getScope(req));
      res.json(treatmentsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch treatments" });
    }
  });

  app.post("/api/treatments", requireClinicScope, async (req, res) => {
    try {
      const scope = getScope(req);
      // Generate unique code
      const code = `SVC-${Date.now().toString(36).toUpperCase()}`;
      
      const parsed = insertTreatmentSchema.safeParse({
        ...req.body,
        code,
        organizationId: scope.clinicId,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const treatment = await storage.createTreatment(parsed.data);
      res.status(201).json(treatment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create treatment" });
    }
  });

  app.patch("/api/treatments/:id", requireClinicScope, async (req, res) => {
    try {
      const { id } = req.params;
      const scope = getScope(req);
      const existingTreatment = await storage.getTreatment(id, scope);
      if (!existingTreatment) {
        return res.status(404).json({ message: "Treatment not found" });
      }

      const updateSchema = insertTreatmentSchema.partial();
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const updated = await storage.updateTreatment(id, parsed.data, scope);
      res.json(updated);
    } catch (error) {
      console.error("Error updating treatment:", error);
      res.status(500).json({ message: "Failed to update treatment" });
    }
  });

  app.delete("/api/treatments/:id", requireClinicScope, async (req, res) => {
    try {
      const { id } = req.params;
      const existingTreatment = await storage.getTreatment(id);
      if (!existingTreatment) {
        return res.status(404).json({ message: "Treatment not found" });
      }

      await storage.deleteTreatment(id);
      res.json({ message: "Treatment deleted successfully" });
    } catch (error) {
      console.error("Error deleting treatment:", error);
      res.status(500).json({ message: "Failed to delete treatment" });
    }
  });

  // Appointments
  app.get("/api/appointments", requireClinicScope, async (req, res) => {
    try {
      const scope = getScope(req);
      const { start, end, status, doctorId } = req.query;
      const appointmentsList = await storage.getAppointments({
        start: start ? new Date(start as string) : undefined,
        end: end ? new Date(end as string) : undefined,
        status: status as string,
        doctorId: doctorId as string,
      }, scope);

      // Enrich with patient data
      const patientsList = await storage.getPatients({}, scope);
      const patientMap = new Map(patientsList.map(p => [p.id, p]));

      // Enrich with doctor data
      let doctorMap = new Map();
      try {
        const doctorsList = await storage.getUsers({ role: "doctor" }, scope);
        doctorMap = new Map(doctorsList.map(d => [d.id, d]));
      } catch (docError) {
        console.error("Error fetching doctors for enrichment:", docError);
      }

      const enriched = appointmentsList.map(apt => ({
        ...apt,
        patient: patientMap.get(apt.patientId),
        doctor: apt.doctorId ? doctorMap.get(apt.doctorId) : null,
      }));

      res.json(enriched);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments", error: error.message });
    }
  });

  app.get("/api/appointments/today", requireClinicScope, async (req, res) => {
    try {
      const scope = getScope(req);
      const appointmentsList = await storage.getTodayAppointments(scope);
      
      // Enrich with patient data
      const patientsList = await storage.getPatients({}, scope);
      const patientMap = new Map(patientsList.map(p => [p.id, p]));

      // Enrich with doctor data
      let doctorMap = new Map();
      try {
        const doctorsList = await storage.getUsers({ role: "doctor" }, scope);
        doctorMap = new Map(doctorsList.map(d => [d.id, d]));
      } catch (docError) {
        console.error("Error fetching doctors for enrichment:", docError);
      }

      const enriched = appointmentsList.map(apt => ({
        ...apt,
        patient: patientMap.get(apt.patientId),
        doctor: apt.doctorId ? doctorMap.get(apt.doctorId) : null,
      }));

      res.json(enriched);
    } catch (error: any) {
      console.error("Error fetching today's appointments:", error);
      res.status(500).json({ message: "Failed to fetch today's appointments", error: error.message });
    }
  });

  app.get("/api/appointments/:id", requireClinicScope, async (req, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id, getScope(req));
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.post("/api/appointments", requireClinicScope, async (req, res) => {
    try {
      const scope = getScope(req);
      const parsed = insertAppointmentSchema.safeParse({
        ...req.body,
        createdById: (req.user as any).id,
        organizationId: scope.clinicId,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const user = req.user as any;
      const appointment = await storage.createAppointment(parsed.data);

      // Get patient for activity log
      const patient = await storage.getPatient(parsed.data.patientId, scope);

      // Log activity
      try {
        await storage.logActivity({
          userId: user.id,
          action: "created",
          entityType: "appointment",
          entityId: appointment.id,
          details: `Scheduled appointment for ${patient?.firstName || "Unknown"} ${patient?.lastName || "Patient"}`,
        });

        await storage.createAuditLog({
          userId: user.id,
          userRole: user.role,
          actionType: "CREATE",
          entityType: "appointment",
          entityId: appointment.id,
          previousValue: null,
          newValue: appointment,
          description: `Scheduled appointment for ${patient?.firstName || "Unknown"} ${patient?.lastName || "Patient"}`,
          ipAddress: req.ip || null,
        });
      } catch (logError) {
        console.error("Failed to log activity for appointment creation:", logError);
      }

      res.status(201).json(appointment);
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment", error: error.message });
    }
  });

  app.patch("/api/appointments/:id", requireClinicScope, async (req, res) => {
    try {
      const updateSchema = insertAppointmentSchema.pick({
        title: true,
        startTime: true,
        endTime: true,
        status: true,
        category: true,
        notes: true,
        doctorId: true,
      }).partial().strict();
      
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      // Get previous state for audit log
      const previousAppointment = await storage.getAppointment(req.params.id);
      
      const appointment = await storage.updateAppointment(req.params.id, parsed.data);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      const user = req.user as any;
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "UPDATE",
        entityType: "appointment",
        entityId: appointment.id,
        previousValue: previousAppointment,
        newValue: appointment,
        description: `Updated appointment ${appointment.title || appointment.id}`,
        ipAddress: req.ip || null,
      });

      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Invoices - restricted to admin, doctor, staff (not students)
  app.get("/api/invoices", requireClinicScope, async (req, res) => {
    try {
      const { patientId, status } = req.query;
      const scope = getScope(req);
      const invoicesList = await storage.getInvoices({
        patientId: patientId as string,
        status: status as string,
      }, scope);

      // Enrich with patient data
      const patientsList = await storage.getPatients({}, scope);
      const patientMap = new Map(patientsList.map(p => [p.id, p]));

      const enriched = invoicesList.map(inv => ({
        ...inv,
        patient: patientMap.get(inv.patientId),
      }));

      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", requireClinicScope, async (req, res) => {
    try {
      // Generate unique invoice number
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      const { items, ...invoiceData } = req.body;

      const parsed = insertInvoiceSchema.safeParse({
        ...invoiceData,
        invoiceNumber,
        createdById: (req.user as any).id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const invoice = await storage.createInvoice(parsed.data);

      // Create invoice items if provided
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const itemParsed = insertInvoiceItemSchema.safeParse({
            ...item,
            invoiceId: invoice.id,
          });
          if (itemParsed.success) {
            await storage.createInvoiceItem(itemParsed.data);
          }
        }
      }

      const user = req.user as any;
      
      // Activity log for dashboard
      await storage.logActivity({
        userId: user.id,
        action: "created",
        entityType: "invoice",
        entityId: invoice.id,
        details: `Created invoice ${invoice.invoiceNumber} for $${invoice.finalAmount}`,
      });

      // Immutable audit log for financial integrity
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "CREATE",
        entityType: "invoice",
        entityId: invoice.id,
        previousValue: null,
        newValue: invoice,
        description: `Created invoice ${invoice.invoiceNumber} for $${invoice.finalAmount}`,
        ipAddress: req.ip || null,
      });

      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Get single invoice with items
  app.get("/api/invoices/:id", requireClinicScope, async (req, res) => {
    try {
      const scope = getScope(req);
      const invoice = await storage.getInvoice(req.params.id, scope);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const items = await storage.getInvoiceItems(invoice.id, scope);
      const payments = await storage.getPayments({ invoiceId: invoice.id }, scope);
      const patientsList = await storage.getPatients({}, scope);
      const patient = patientsList.find(p => p.id === invoice.patientId);

      res.json({ ...invoice, items, payments, patient });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Update invoice (status changes, send/void, etc.)
  app.patch("/api/invoices/:id", requireClinicScope, async (req, res) => {
    try {
      const scope = getScope(req);
      const updateSchema = insertInvoiceSchema.pick({
        status: true,
        notes: true,
        dueDate: true,
        discountType: true,
        discountValue: true,
        totalAmount: true,
        finalAmount: true,
      }).partial().strict();

      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      // Get previous state for audit log
      const previousInvoice = await storage.getInvoice(req.params.id, scope);
      if (!previousInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const invoice = await storage.updateInvoice(req.params.id, parsed.data, scope);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const user = req.user as any;
      
      await storage.logActivity({
        userId: user.id,
        action: "updated",
        entityType: "invoice",
        entityId: invoice.id,
        details: `Updated invoice ${invoice.invoiceNumber}`,
      });

      // Immutable audit log for financial integrity
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "UPDATE",
        entityType: "invoice",
        entityId: invoice.id,
        previousValue: previousInvoice,
        newValue: invoice,
        description: `Updated invoice ${invoice.invoiceNumber}`,
        ipAddress: req.ip || null,
      });

      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Send invoice (change status from draft to sent)
  app.post("/api/invoices/:id/send", requireClinicScope, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status !== "draft") {
        return res.status(400).json({ message: "Only draft invoices can be sent" });
      }

      const updated = await storage.updateInvoice(req.params.id, { status: "sent" });

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "sent",
        entityType: "invoice",
        entityId: invoice.id,
        details: `Sent invoice ${invoice.invoiceNumber} to patient`,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to send invoice" });
    }
  });

  // Void/cancel invoice
  app.post("/api/invoices/:id/void", requireClinicScope, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status === "paid") {
        return res.status(400).json({ message: "Cannot void a paid invoice" });
      }

      const updated = await storage.updateInvoice(req.params.id, { status: "canceled" });

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "voided",
        entityType: "invoice",
        entityId: invoice.id,
        details: `Voided invoice ${invoice.invoiceNumber}`,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to void invoice" });
    }
  });

  // Invoice items management
  app.post("/api/invoices/:id/items", requireClinicScope, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status !== "draft") {
        return res.status(400).json({ message: "Can only add items to draft invoices" });
      }

      const parsed = insertInvoiceItemSchema.safeParse({
        ...req.body,
        invoiceId: req.params.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const item = await storage.createInvoiceItem(parsed.data);

      // Recalculate invoice totals
      const items = await storage.getInvoiceItems(invoice.id);
      const totalAmount = items.reduce((sum, i) => sum + Number(i.totalPrice), 0);
      let finalAmount = totalAmount;
      if (invoice.discountType && invoice.discountValue) {
        if (invoice.discountType === "percentage") {
          finalAmount = totalAmount * (1 - Number(invoice.discountValue) / 100);
        } else {
          finalAmount = totalAmount - Number(invoice.discountValue);
        }
      }
      await storage.updateInvoice(invoice.id, { 
        totalAmount: totalAmount.toFixed(2),
        finalAmount: finalAmount.toFixed(2)
      });

      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to add invoice item" });
    }
  });

  app.delete("/api/invoices/:invoiceId/items/:itemId", requireClinicScope, async (req, res) => {
    try {
      const scope = getScope(req);
      const invoice = await storage.getInvoice(req.params.invoiceId, scope);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status !== "draft") {
        return res.status(400).json({ message: "Can only remove items from draft invoices" });
      }

      await storage.deleteInvoiceItem(req.params.itemId, scope);

      // Recalculate invoice totals
      const items = await storage.getInvoiceItems(invoice.id, scope);
      const totalAmount = items.reduce((sum, i) => sum + Number(i.totalPrice), 0);
      let finalAmount = totalAmount;
      if (invoice.discountType && invoice.discountValue) {
        if (invoice.discountType === "percentage") {
          finalAmount = totalAmount * (1 - Number(invoice.discountValue) / 100);
        } else {
          finalAmount = totalAmount - Number(invoice.discountValue);
        }
      }
      await storage.updateInvoice(invoice.id, { 
        totalAmount: totalAmount.toFixed(2),
        finalAmount: finalAmount.toFixed(2)
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove invoice item" });
    }
  });

  // Payments - restricted to admin, doctor, staff (not students)
  app.get("/api/payments", requireClinicScope, async (req, res) => {
    try {
      const { invoiceId } = req.query;
      const paymentsList = await storage.getPayments({
        invoiceId: invoiceId as string,
      }, getScope(req));
      res.json(paymentsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const parsed = insertPaymentSchema.safeParse({
        ...req.body,
        createdById: user.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const payment = await storage.createPayment(parsed.data);

      await storage.logActivity({
        userId: user.id,
        action: "created",
        entityType: "payment",
        entityId: payment.id,
        details: `Recorded payment of $${payment.amount}`,
      });

      // Immutable audit log for financial integrity
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "CREATE",
        entityType: "payment",
        entityId: payment.id,
        previousValue: null,
        newValue: payment,
        description: `Recorded payment of $${payment.amount} via ${payment.paymentMethod}`,
        ipAddress: req.ip || null,
      });

      res.status(201).json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  // Refund payment
  app.post("/api/payments/:id/refund", requireClinicScope, async (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason || typeof reason !== 'string') {
        return res.status(400).json({ message: "Refund reason is required" });
      }

      // Get previous state for audit log
      const previousPayment = await storage.getPayment(req.params.id);
      if (!previousPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      const payment = await storage.refundPayment(req.params.id, reason);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found or already refunded" });
      }

      const user = req.user as any;

      await storage.logActivity({
        userId: user.id,
        action: "refunded",
        entityType: "payment",
        entityId: payment.id,
        details: `Refunded payment of $${payment.amount}: ${reason}`,
      });

      // Immutable audit log for financial integrity
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "UPDATE",
        entityType: "payment",
        entityId: payment.id,
        previousValue: previousPayment,
        newValue: payment,
        description: `Refunded payment of $${payment.amount}: ${reason}`,
        ipAddress: req.ip || null,
      });

      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to refund payment" });
    }
  });

  // Payment Plans
  app.get("/api/payment-plans", requireClinicScope, async (req, res) => {
    try {
      const { invoiceId, patientId, status } = req.query;
      const plans = await storage.getPaymentPlans({
        invoiceId: invoiceId as string,
        patientId: patientId as string,
        status: status as string,
      });

      // Enrich with patient and invoice data
      const enrichedPlans = await Promise.all(plans.map(async (plan) => {
        const [patient, invoice, installments] = await Promise.all([
          storage.getPatient(plan.patientId),
          storage.getInvoice(plan.invoiceId),
          storage.getPaymentPlanInstallments(plan.id),
        ]);
        return { ...plan, patient, invoice, installments };
      }));

      res.json(enrichedPlans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment plans" });
    }
  });

  app.get("/api/payment-plans/:id", requireClinicScope, async (req, res) => {
    try {
      const plan = await storage.getPaymentPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Payment plan not found" });
      }

      const [patient, invoice, installments] = await Promise.all([
        storage.getPatient(plan.patientId),
        storage.getInvoice(plan.invoiceId),
        storage.getPaymentPlanInstallments(plan.id),
      ]);

      res.json({ ...plan, patient, invoice, installments });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment plan" });
    }
  });

  app.post("/api/payment-plans", requireClinicScope, async (req, res) => {
    try {
      const { installments: installmentDates, ...planData } = req.body;

      const parsed = insertPaymentPlanSchema.safeParse({
        ...planData,
        createdById: (req.user as any).id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const plan = await storage.createPaymentPlan(parsed.data);

      // Create installments if provided
      if (installmentDates && Array.isArray(installmentDates)) {
        for (let i = 0; i < installmentDates.length; i++) {
          await storage.createPaymentPlanInstallment({
            paymentPlanId: plan.id,
            installmentNumber: i + 1,
            dueDate: installmentDates[i].dueDate,
            amount: installmentDates[i].amount || parsed.data.installmentAmount,
          });
        }
      } else {
        // Auto-generate installments based on frequency
        const startDate = new Date(parsed.data.startDate);
        const frequency = parsed.data.frequency;
        const numInstallments = parsed.data.numberOfInstallments;
        const amount = parsed.data.installmentAmount;

        for (let i = 0; i < numInstallments; i++) {
          const dueDate = new Date(startDate);
          if (frequency === 'weekly') {
            dueDate.setDate(dueDate.getDate() + (i * 7));
          } else if (frequency === 'biweekly') {
            dueDate.setDate(dueDate.getDate() + (i * 14));
          } else if (frequency === 'monthly') {
            dueDate.setMonth(dueDate.getMonth() + i);
          }

          await storage.createPaymentPlanInstallment({
            paymentPlanId: plan.id,
            installmentNumber: i + 1,
            dueDate: dueDate.toISOString().split('T')[0],
            amount: amount,
          });
        }
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "created",
        entityType: "payment_plan",
        entityId: plan.id,
        details: `Created payment plan with ${parsed.data.numberOfInstallments} installments`,
      });

      // Return enriched plan
      const installments = await storage.getPaymentPlanInstallments(plan.id);
      res.status(201).json({ ...plan, installments });
    } catch (error) {
      res.status(500).json({ message: "Failed to create payment plan" });
    }
  });

  app.patch("/api/payment-plans/:id", requireClinicScope, async (req, res) => {
    try {
      const updateSchema = insertPaymentPlanSchema.pick({
        status: true,
        notes: true,
      }).partial().strict();

      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const plan = await storage.updatePaymentPlan(req.params.id, parsed.data);
      if (!plan) {
        return res.status(404).json({ message: "Payment plan not found" });
      }

      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment plan" });
    }
  });

  // Payment plan installments - pay an installment
  app.post("/api/payment-plans/:planId/installments/:installmentId/pay", requireClinicScope, async (req, res) => {
    try {
      const { amount, paymentMethod, referenceNumber, notes } = req.body;
      
      const plan = await storage.getPaymentPlan(req.params.planId);
      if (!plan) {
        return res.status(404).json({ message: "Payment plan not found" });
      }

      // Create payment linked to installment
      const payment = await storage.createPayment({
        invoiceId: plan.invoiceId,
        paymentPlanInstallmentId: req.params.installmentId,
        amount: amount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'cash',
        referenceNumber,
        notes,
        createdById: (req.user as any).id,
      });

      // Check if all installments are paid
      const installments = await storage.getPaymentPlanInstallments(plan.id);
      const allPaid = installments.every(inst => inst.isPaid);
      if (allPaid) {
        await storage.updatePaymentPlan(plan.id, { status: 'completed' });
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "paid",
        entityType: "installment",
        entityId: req.params.installmentId,
        details: `Paid installment of $${amount}`,
      });

      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to record installment payment" });
    }
  });

  // Invoice Adjustments (write-offs, discounts, corrections, fees)
  app.get("/api/invoices/:id/adjustments", requireClinicScope, async (req, res) => {
    try {
      const adjustments = await storage.getInvoiceAdjustments(req.params.id, getScope(req));
      res.json(adjustments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch adjustments" });
    }
  });

  app.post("/api/invoices/:id/adjustments", requireClinicScope, async (req, res) => {
    try {
      const scope = getScope(req);
      const invoice = await storage.getInvoice(req.params.id, scope);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Cannot adjust paid or canceled invoices
      if (invoice.status === 'paid' || invoice.status === 'canceled') {
        return res.status(400).json({ message: "Cannot adjust paid or canceled invoices" });
      }

      const parsed = insertInvoiceAdjustmentSchema.safeParse({
        ...req.body,
        invoiceId: req.params.id,
        appliedDate: req.body.appliedDate || new Date().toISOString().split('T')[0],
        createdById: (req.user as any).id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const adjustment = await storage.createInvoiceAdjustment(parsed.data);

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "adjusted",
        entityType: "invoice",
        entityId: req.params.id,
        details: `Applied ${adjustment.type} of $${adjustment.amount}: ${adjustment.reason}`,
      });

      res.status(201).json(adjustment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create adjustment" });
    }
  });

  // Write-off invoice balance (shorthand for creating write-off adjustment)
  app.post("/api/invoices/:id/write-off", requireClinicScope, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      if (invoice.status === 'paid' || invoice.status === 'canceled') {
        return res.status(400).json({ message: "Cannot write off paid or canceled invoices" });
      }

      const balance = Number(invoice.finalAmount) - Number(invoice.paidAmount || 0);
      if (balance <= 0) {
        return res.status(400).json({ message: "No balance to write off" });
      }

      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ message: "Write-off reason is required" });
      }

      const adjustment = await storage.createInvoiceAdjustment({
        invoiceId: req.params.id,
        type: 'write_off',
        amount: balance.toFixed(2),
        reason,
        appliedDate: new Date().toISOString().split('T')[0],
        createdById: (req.user as any).id,
      });

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "wrote_off",
        entityType: "invoice",
        entityId: req.params.id,
        details: `Wrote off $${balance.toFixed(2)}: ${reason}`,
      });

      res.json(adjustment);
    } catch (error) {
      res.status(500).json({ message: "Failed to write off invoice" });
    }
  });

  // Expenses - restricted to admin only
  app.get("/api/expenses", requireClinicScope, async (req, res) => {
    try {
      const { category, startDate, endDate } = req.query;
      const expensesList = await storage.getExpenses({
        category: category as string,
        startDate: startDate as string,
        endDate: endDate as string,
      }, getScope(req));
      res.json(expensesList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/:id", requireClinicScope, async (req, res) => {
    try {
      const expense = await storage.getExpense(req.params.id, getScope(req));
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const parsed = insertExpenseSchema.safeParse({
        ...req.body,
        createdById: user.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const expense = await storage.createExpense(parsed.data);

      await storage.logActivity({
        userId: user.id,
        action: "created",
        entityType: "expense",
        entityId: expense.id,
        details: `Created expense: ${expense.description} ($${expense.amount})`,
      });

      // Immutable audit log for financial integrity
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "CREATE",
        entityType: "expense",
        entityId: expense.id,
        previousValue: null,
        newValue: expense,
        description: `Created expense: ${expense.description} ($${expense.amount})`,
        ipAddress: req.ip || null,
      });

      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.patch("/api/expenses/:id", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const scope = getScope(req);
      
      // Get previous state for audit log
      const previousExpense = await storage.getExpense(req.params.id, scope);
      if (!previousExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      const expense = await storage.updateExpense(req.params.id, req.body, scope);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      await storage.logActivity({
        userId: user.id,
        action: "updated",
        entityType: "expense",
        entityId: expense.id,
        details: `Updated expense: ${expense.description}`,
      });

      // Immutable audit log for financial integrity
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "UPDATE",
        entityType: "expense",
        entityId: expense.id,
        previousValue: previousExpense,
        newValue: expense,
        description: `Updated expense: ${expense.description}`,
        ipAddress: req.ip || null,
      });

      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const scope = getScope(req);
      
      // Get previous state for audit log
      const previousExpense = await storage.getExpense(req.params.id, scope);
      if (!previousExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      const success = await storage.deleteExpense(req.params.id, scope);
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }

      await storage.logActivity({
        userId: user.id,
        action: "deleted",
        entityType: "expense",
        entityId: req.params.id,
        details: "Deleted expense record",
      });

      // Immutable audit log for financial integrity
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "DELETE",
        entityType: "expense",
        entityId: req.params.id,
        previousValue: previousExpense,
        newValue: null,
        description: `Deleted expense: ${previousExpense.description} ($${previousExpense.amount})`,
        ipAddress: req.ip || null,
      });

      res.json({ message: "Expense deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Doctor Payments - restricted to admin only
  app.get("/api/doctor-payments", requireClinicScope, async (req, res) => {
    try {
      const { doctorId, startDate, endDate, paymentType } = req.query;
      const paymentsList = await storage.getDoctorPayments({
        doctorId: doctorId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        paymentType: paymentType as string,
      }, getScope(req));
      res.json(paymentsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctor payments" });
    }
  });

  app.get("/api/doctor-payments/:id", requireClinicScope, async (req, res) => {
    try {
      const payment = await storage.getDoctorPayment(req.params.id, getScope(req));
      if (!payment) {
        return res.status(404).json({ message: "Doctor payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctor payment" });
    }
  });

  app.post("/api/doctor-payments", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const parsed = insertDoctorPaymentSchema.safeParse({
        ...req.body,
        createdById: user.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const payment = await storage.createDoctorPayment(parsed.data);

      await storage.logActivity({
        userId: user.id,
        action: "created",
        entityType: "doctor_payment",
        entityId: payment.id,
        details: `Created doctor payment: $${payment.amount}`,
      });

      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "CREATE",
        entityType: "doctor_payment",
        entityId: payment.id,
        previousValue: null,
        newValue: payment,
        description: `Created doctor payment: $${payment.amount}`,
        ipAddress: req.ip || null,
      });

      // Send notification to doctor about the payment
      try {
        await notifyDoctorPaymentIssued(
          payment.doctorId,
          payment.amount,
          payment.paymentType,
          payment.paymentDate,
          payment.id,
          user.organizationId
        );
      } catch (notifyError) {
        console.error("Failed to send payment notification:", notifyError);
        // Don't fail the request if notification fails
      }

      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating doctor payment:", error);
      res.status(500).json({ message: "Failed to create doctor payment" });
    }
  });

  app.patch("/api/doctor-payments/:id", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const scope = getScope(req);
      
      const previousPayment = await storage.getDoctorPayment(req.params.id, scope);
      if (!previousPayment) {
        return res.status(404).json({ message: "Doctor payment not found" });
      }

      const payment = await storage.updateDoctorPayment(req.params.id, req.body, scope);
      if (!payment) {
        return res.status(404).json({ message: "Doctor payment not found" });
      }

      await storage.logActivity({
        userId: user.id,
        action: "updated",
        entityType: "doctor_payment",
        entityId: payment.id,
        details: `Updated doctor payment: $${payment.amount}`,
      });

      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "UPDATE",
        entityType: "doctor_payment",
        entityId: payment.id,
        previousValue: previousPayment,
        newValue: payment,
        description: `Updated doctor payment: $${payment.amount}`,
        ipAddress: req.ip || null,
      });

      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update doctor payment" });
    }
  });

  app.delete("/api/doctor-payments/:id", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const scope = getScope(req);
      
      const previousPayment = await storage.getDoctorPayment(req.params.id, scope);
      if (!previousPayment) {
        return res.status(404).json({ message: "Doctor payment not found" });
      }

      const success = await storage.deleteDoctorPayment(req.params.id, scope);
      if (!success) {
        return res.status(404).json({ message: "Doctor payment not found" });
      }

      await storage.logActivity({
        userId: user.id,
        action: "deleted",
        entityType: "doctor_payment",
        entityId: req.params.id,
        details: "Deleted doctor payment record",
      });

      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "DELETE",
        entityType: "doctor_payment",
        entityId: req.params.id,
        previousValue: previousPayment,
        newValue: null,
        description: `Deleted doctor payment: $${previousPayment.amount}`,
        ipAddress: req.ip || null,
      });

      res.json({ message: "Doctor payment deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete doctor payment" });
    }
  });

  // My Payments endpoint - doctors can view their own payments
  app.get("/api/my-payments", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const { startDate, endDate } = req.query;
      
      const paymentsList = await storage.getDoctorPayments({
        doctorId: user.id,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      
      res.json(paymentsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch your payments" });
    }
  });

  // Financial Reports - restricted to admin only
  app.get("/api/reports/revenue", requireClinicScope, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      const report = await storage.getRevenueReport(startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate revenue report" });
    }
  });

  app.get("/api/reports/ar-aging", requireClinicScope, async (req, res) => {
    try {
      const report = await storage.getARAgingReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate AR aging report" });
    }
  });

  app.get("/api/reports/production-by-doctor", requireClinicScope, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      const report = await storage.getProductionByDoctorReport(startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate production report" });
    }
  });

  // Detailed doctor report (for sending to doctors or admin viewing)
  app.get("/api/reports/doctor/:doctorId", requireClinicScope, async (req, res) => {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Doctors can only view their own report
      if (req.user?.role === 'doctor' && req.user.id !== doctorId) {
        return res.status(403).json({ message: "You can only view your own report" });
      }
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      
      const report = await storage.getDoctorDetailedReport(doctorId, startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      console.error("Error generating doctor report:", error);
      res.status(500).json({ message: "Failed to generate doctor report" });
    }
  });

  // Endpoint for doctor to view their own financial dashboard
  app.get("/api/my-production", requireClinicScope, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      
      const report = await storage.getDoctorDetailedReport(req.user!.id, startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      console.error("Error generating my production report:", error);
      res.status(500).json({ message: "Failed to generate production report" });
    }
  });

  app.get("/api/reports/expenses", requireClinicScope, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      const report = await storage.getExpenseReport(startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate expense report" });
    }
  });

  app.get("/api/reports/net-profit", requireClinicScope, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      const report = await storage.getNetProfitReport(startDate as string, endDate as string);
      res.json(report);
    } catch (error) {
      console.error("Error generating net profit report:", error);
      res.status(500).json({ message: "Failed to generate net profit report" });
    }
  });

  // Insurance Claims - restricted to admin and staff
  app.get("/api/insurance-claims", requireClinicScope, async (req, res) => {
    try {
      const { status, patientId } = req.query;
      const claims = await storage.getInsuranceClaims({
        status: status as string,
        patientId: patientId as string,
      }, getScope(req));
      res.json(claims);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch insurance claims" });
    }
  });

  app.get("/api/insurance-claims/:id", requireClinicScope, async (req, res) => {
    try {
      const claim = await storage.getInsuranceClaim(req.params.id, getScope(req));
      if (!claim) {
        return res.status(404).json({ message: "Insurance claim not found" });
      }
      res.json(claim);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch insurance claim" });
    }
  });

  app.post("/api/insurance-claims", requireClinicScope, async (req, res) => {
    try {
      const claimNumber = await storage.generateClaimNumber();
      const parsed = insertInsuranceClaimSchema.safeParse({
        ...req.body,
        claimNumber,
        createdById: (req.user as any).id,
      });
      if (!parsed.success) {
        console.error("Insurance claim validation error:", parsed.error.message);
        return res.status(400).json({ message: parsed.error.message });
      }

      const claim = await storage.createInsuranceClaim(parsed.data);

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "created",
        entityType: "insurance_claim",
        entityId: claim.id,
        details: `Created insurance claim ${claim.claimNumber} for $${claim.claimAmount}`,
      });

      res.status(201).json(claim);
    } catch (error) {
      console.error("Error creating insurance claim:", error);
      res.status(500).json({ message: "Failed to create insurance claim" });
    }
  });

  app.patch("/api/insurance-claims/:id", requireClinicScope, async (req, res) => {
    try {
      const claim = await storage.updateInsuranceClaim(req.params.id, req.body, getScope(req));
      if (!claim) {
        return res.status(404).json({ message: "Insurance claim not found" });
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "updated",
        entityType: "insurance_claim",
        entityId: claim.id,
        details: `Updated insurance claim ${claim.claimNumber} - status: ${claim.status}`,
      });

      res.json(claim);
    } catch (error) {
      res.status(500).json({ message: "Failed to update insurance claim" });
    }
  });

  app.delete("/api/insurance-claims/:id", requireClinicScope, async (req, res) => {
    try {
      const success = await storage.deleteInsuranceClaim(req.params.id, getScope(req));
      if (!success) {
        return res.status(404).json({ message: "Insurance claim not found" });
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "deleted",
        entityType: "insurance_claim",
        entityId: req.params.id,
        details: "Deleted insurance claim record",
      });

      res.json({ message: "Insurance claim deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete insurance claim" });
    }
  });

  // Inventory - restricted to admin, doctor, staff (not students)
  app.get("/api/inventory", requireClinicScope, async (req, res) => {
    try {
      const { category, status } = req.query;
      const items = await storage.getInventoryItems({
        category: category as string,
        status: status as string,
      }, getScope(req));
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/low-stock", requireClinicScope, async (req, res) => {
    try {
      const items = await storage.getInventoryItems({}, getScope(req));
      const lowStockItems = items.filter(item => 
        item.currentQuantity <= item.minimumQuantity
      );
      res.json(lowStockItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  app.post("/api/inventory", requireClinicScope, async (req, res) => {
    try {
      const parsed = insertInventoryItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const item = await storage.createInventoryItem(parsed.data);

      const user = req.user as any;
      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "CREATE",
        entityType: "inventory",
        entityId: item.id,
        previousValue: null,
        newValue: item,
        description: `Created inventory item: ${item.name}`,
        ipAddress: req.ip || null,
      });

      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.patch("/api/inventory/:id", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const scope = getScope(req);
      
      // Get previous state for audit log
      const previousItem = await storage.getInventoryItem(req.params.id, scope);

      const updateSchema = insertInventoryItemSchema.pick({
        name: true,
        category: true,
        currentQuantity: true,
        minimumQuantity: true,
        unit: true,
        unitCost: true,
        supplier: true,
        location: true,
        description: true,
        lastRestocked: true,
      }).partial().strict();
      
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const item = await storage.updateInventoryItem(req.params.id, parsed.data, scope);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "UPDATE",
        entityType: "inventory",
        entityId: item.id,
        previousValue: previousItem,
        newValue: item,
        description: `Updated inventory item: ${item.name}`,
        ipAddress: req.ip || null,
      });

      // Check if item is low on stock and notify admins
      const currentQty = item.currentQuantity ?? 0;
      const minQty = item.minimumQuantity ?? 0;
      if (currentQty <= minQty) {
        try {
          // Get all admins to notify
          const allUsers = await storage.getUsers();
          const admins = allUsers.filter((u: any) => u.role === "admin");
          for (const admin of admins) {
            await notifyLowStock(
              admin.id,
              item.name,
              currentQty,
              minQty,
              item.id,
              admin.organizationId ?? undefined
            );
          }
        } catch (notifyError) {
          console.error("Failed to send low stock notification:", notifyError);
        }
      }

      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory/:id", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const scope = getScope(req);
      const item = await storage.getInventoryItem(req.params.id, scope);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      const deleted = await storage.deleteInventoryItem(req.params.id, scope);
      if (!deleted) {
        return res.status(404).json({ message: "Item not found" });
      }

      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "DELETE",
        entityType: "inventory",
        entityId: req.params.id,
        previousValue: item,
        newValue: null,
        description: `Deleted inventory item: ${item.name}`,
        ipAddress: req.ip || null,
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Lab Cases - restricted to admin and doctor (not students or staff)
  app.get("/api/lab-cases", requireClinicScope, async (req, res) => {
    try {
      const { status, patientId } = req.query;
      const scope = getScope(req);
      const cases = await storage.getLabCases({
        status: status as string,
        patientId: patientId as string,
      }, scope);

      // Enrich with patient data
      const patientsList = await storage.getPatients({}, scope);
      const patientMap = new Map(patientsList.map(p => [p.id, p]));

      const enriched = cases.map(c => ({
        ...c,
        patient: patientMap.get(c.patientId),
      }));

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching lab cases:", error);
      res.status(500).json({ message: "Failed to fetch lab cases" });
    }
  });

  app.post("/api/lab-cases", requireClinicScope, async (req, res) => {
    try {
      console.log("Creating lab case with body:", JSON.stringify(req.body, null, 2));
      const parsed = insertLabCaseSchema.safeParse({
        ...req.body,
        doctorId: (req.user as any).role === 'doctor' ? (req.user as any).id : req.body.doctorId,
      });
      if (!parsed.success) {
        console.error("Validation failed for lab case:", parsed.error.flatten());
        return res.status(400).json({ message: parsed.error.message });
      }

      const labCase = await storage.createLabCase(parsed.data);

      const patient = await storage.getPatient(parsed.data.patientId);
      const user = req.user as any;

      await storage.logActivity({
        userId: user.id,
        action: "created",
        entityType: "lab_case",
        entityId: labCase.id,
        details: `Created lab case for ${patient?.firstName} ${patient?.lastName}`,
      });

      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "CREATE",
        entityType: "lab_case",
        entityId: labCase.id,
        previousValue: null,
        newValue: labCase,
        description: `Created lab case for ${patient?.firstName} ${patient?.lastName}`,
        ipAddress: req.ip || null,
      });

      res.status(201).json(labCase);
    } catch (error) {
      console.error("Critical error in POST /api/lab-cases:", error);
      res.status(500).json({ message: "Failed to create lab case" });
    }
  });

  app.patch("/api/lab-cases/:id", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const scope = getScope(req);
      
      // Get previous state for audit log
      const previousLabCase = await storage.getLabCase(req.params.id, scope);

      const updateSchema = insertLabCaseSchema.pick({
        patientId: true,
        externalLabId: true,
        labServiceId: true,
        labName: true,
        caseType: true,
        status: true,
        isPaid: true,
        sentDate: true,
        expectedReturnDate: true,
        actualReturnDate: true,
        cost: true,
        description: true,
        notes: true,
        toothNumbers: true,
      }).partial();
      
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const labCase = await storage.updateLabCase(req.params.id, parsed.data, scope);
      if (!labCase) {
        return res.status(404).json({ message: "Lab case not found" });
      }

      await storage.createAuditLog({
        userId: user.id,
        userRole: user.role,
        actionType: "UPDATE",
        entityType: "lab_case",
        entityId: labCase.id,
        previousValue: previousLabCase,
        newValue: labCase,
        description: `Updated lab case ${labCase.id}`,
        ipAddress: req.ip || null,
      });

      res.json(labCase);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lab case" });
    }
  });

  // External Labs - admin only for modifications
  app.get("/api/external-labs", requireClinicScope, async (req, res) => {
    try {
      const labs = await storage.getExternalLabs(getScope(req));
      res.json(labs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch external labs" });
    }
  });

  app.get("/api/external-labs/:id", requireClinicScope, async (req, res) => {
    try {
      const lab = await storage.getExternalLab(req.params.id, getScope(req));
      if (!lab) {
        return res.status(404).json({ message: "Lab not found" });
      }
      res.json(lab);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lab" });
    }
  });

  app.get("/api/external-labs/:id/services", requireClinicScope, async (req, res) => {
    try {
      const services = await storage.getLabServices(req.params.id, getScope(req));
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lab services" });
    }
  });

  app.post("/api/external-labs", requireClinicScope, async (req, res) => {
    try {
      const parsed = insertExternalLabSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }
      const lab = await storage.createExternalLab(parsed.data);
      res.status(201).json(lab);
    } catch (error) {
      res.status(500).json({ message: "Failed to create external lab" });
    }
  });

  app.patch("/api/external-labs/:id", requireClinicScope, async (req, res) => {
    try {
      const parsed = insertExternalLabSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }
      const lab = await storage.updateExternalLab(req.params.id, parsed.data, getScope(req));
      if (!lab) {
        return res.status(404).json({ message: "Lab not found" });
      }
      res.json(lab);
    } catch (error) {
      res.status(500).json({ message: "Failed to update external lab" });
    }
  });

  app.delete("/api/external-labs/:id", requireClinicScope, async (req, res) => {
    try {
      const deleted = await storage.deleteExternalLab(req.params.id, getScope(req));
      if (!deleted) {
        return res.status(404).json({ message: "Lab not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete external lab" });
    }
  });

  // Lab Services - admin only for modifications
  app.get("/api/lab-services", requireClinicScope, async (req, res) => {
    try {
      const labId = req.query.labId as string | undefined;
      const services = await storage.getLabServices(labId, getScope(req));
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lab services" });
    }
  });

  app.get("/api/lab-services/:id", requireClinicScope, async (req, res) => {
    try {
      const service = await storage.getLabService(req.params.id, getScope(req));
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post("/api/lab-services", requireClinicScope, async (req, res) => {
    try {
      const parsed = insertLabServiceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }
      const service = await storage.createLabService(parsed.data);
      res.status(201).json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to create lab service" });
    }
  });

  app.patch("/api/lab-services/:id", requireClinicScope, async (req, res) => {
    try {
      const parsed = insertLabServiceSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }
      const service = await storage.updateLabService(req.params.id, parsed.data, getScope(req));
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lab service" });
    }
  });

  app.delete("/api/lab-services/:id", requireClinicScope, async (req, res) => {
    try {
      const deleted = await storage.deleteLabService(req.params.id, getScope(req));
      if (!deleted) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete lab service" });
    }
  });

  // Doctors management - admin only for modifications
  app.get("/api/doctors", requireClinicScope, async (req, res) => {
    try {
      const doctors = await storage.getUsers({ role: "doctor" }, getScope(req));
      res.json(doctors.map(d => ({ ...d, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  app.post("/api/doctors", requireClinicScope, async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse({
        ...req.body,
        role: "doctor",
      });
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const existingUser = await storage.getUserByUsername(parsed.data.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

      const doctor = await storage.createUser({
        ...parsed.data,
        password: hashedPassword,
      });

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "created",
        entityType: "doctor",
        entityId: doctor.id,
        details: `Added doctor ${doctor.firstName} ${doctor.lastName}`,
      });

      res.status(201).json({ ...doctor, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to create doctor" });
    }
  });

  app.patch("/api/doctors/:id", requireClinicScope, async (req, res) => {
    try {
      const updateSchema = insertUserSchema.pick({
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        specialty: true,
        licenseNumber: true,
        bio: true,
        isActive: true,
      }).partial().strict();
      
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const doctor = await storage.updateUser(req.params.id, parsed.data);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      res.json({ ...doctor, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update doctor" });
    }
  });

  app.delete("/api/doctors/:id", requireClinicScope, async (req, res) => {
    try {
      // Check for assigned patients
      const assignedPatients = await storage.getPatients({ assignedDoctorId: req.params.id });
      if (assignedPatients.length > 0) {
        return res.status(409).json({
          message: `Cannot delete doctor. There are ${assignedPatients.length} patient(s) assigned to this doctor. Please reassign them first.`
        });
      }

      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "deleted",
        entityType: "doctor",
        entityId: req.params.id,
        details: `Deleted doctor`,
      });

      res.json({ message: "Doctor deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete doctor" });
    }
  });

  // Patient financial summary
  app.get("/api/patients/:id/financials", requireClinicScope, async (req, res) => {
    try {
      const patientId = req.params.id;
      
      // Get all treatments for this patient
      const treatments = await storage.getPatientTreatments(patientId);
      const treatmentsList = await storage.getTreatments();
      const treatmentMap = new Map(treatmentsList.map(t => [t.id, t]));
      
      // Get all invoices for this patient
      const invoicesList = await storage.getPatientInvoices(patientId);
      
      // Get all payments for patient's invoices
      const allPayments = await storage.getPayments({});
      const invoiceIds = new Set(invoicesList.map(inv => inv.id));
      const patientPayments = allPayments.filter(p => invoiceIds.has(p.invoiceId));
      
      // Calculate totals
      const totalTreatmentCost = treatments.reduce((sum, t) => sum + parseFloat(t.price || "0"), 0);
      const completedTreatments = treatments.filter(t => t.status === "completed");
      const completedCost = completedTreatments.reduce((sum, t) => sum + parseFloat(t.price || "0"), 0);
      const pendingTreatments = treatments.filter(t => t.status === "planned" || t.status === "in_progress");
      const pendingCost = pendingTreatments.reduce((sum, t) => sum + parseFloat(t.price || "0"), 0);
      
      const totalInvoiced = invoicesList.reduce((sum, inv) => sum + parseFloat(inv.finalAmount || "0"), 0);
      // Only count payments that haven't been refunded
      const nonRefundedPayments = patientPayments.filter(p => !p.isRefunded);
      const totalPaid = nonRefundedPayments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
      const outstandingBalance = totalInvoiced - totalPaid;
      
      // Group treatments by category
      const treatmentsByCategory: Record<string, { count: number; total: number }> = {};
      treatments.forEach(t => {
        const treatment = treatmentMap.get(t.treatmentId);
        const category = treatment?.category || "other";
        if (!treatmentsByCategory[category]) {
          treatmentsByCategory[category] = { count: 0, total: 0 };
        }
        treatmentsByCategory[category].count++;
        treatmentsByCategory[category].total += parseFloat(t.price || "0");
      });

      res.json({
        summary: {
          totalTreatmentCost,
          completedCost,
          pendingCost,
          totalInvoiced,
          totalPaid,
          outstandingBalance,
          treatmentCount: treatments.length,
          completedCount: completedTreatments.length,
          pendingCount: pendingTreatments.length,
          invoiceCount: invoicesList.length,
          paymentCount: nonRefundedPayments.length,
          refundedPaymentCount: patientPayments.length - nonRefundedPayments.length,
        },
        treatmentsByCategory,
        treatments: treatments.map(t => ({
          ...t,
          treatment: treatmentMap.get(t.treatmentId),
        })),
        invoices: invoicesList,
        payments: patientPayments,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient financials" });
    }
  });

  // Clinic Settings
  app.get("/api/clinic-settings", requireClinicScope, async (req, res) => {
    try {
      const settings = await storage.getClinicSettings(getScope(req));
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clinic settings" });
    }
  });

  app.patch("/api/clinic-settings", requireClinicScope, async (req, res) => {
    try {
      const settings = await storage.updateClinicSettings(req.body);
      
      await storage.logActivity({
        userId: (req.user as any).id,
        action: "updated",
        entityType: "clinic_settings",
        entityId: settings.id,
        details: "Updated clinic settings",
      });

      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update clinic settings" });
    }
  });

  // Clinic Rooms
  app.get("/api/clinic-rooms", requireClinicScope, async (req, res) => {
    try {
      const rooms = await storage.getClinicRooms(getScope(req));
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clinic rooms" });
    }
  });

  app.post("/api/clinic-rooms", requireClinicScope, async (req, res) => {
    try {
      // Auto-generate roomNumber based on existing rooms
      const existingRooms = await storage.getClinicRooms();
      const maxRoomNumber = existingRooms.reduce((max, r) => Math.max(max, r.roomNumber || 0), 0);
      const newRoomNumber = maxRoomNumber + 1;
      
      const room = await storage.createClinicRoom({
        ...req.body,
        roomNumber: newRoomNumber,
      });
      
      await storage.logActivity({
        userId: (req.user as any).id,
        action: "created",
        entityType: "clinic_room",
        entityId: room.id,
        details: `Created room: ${room.name}`,
      });

      res.status(201).json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to create clinic room" });
    }
  });

  app.patch("/api/clinic-rooms/:id", requireClinicScope, async (req, res) => {
    try {
      const room = await storage.updateClinicRoom(req.params.id, req.body, getScope(req));
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "updated",
        entityType: "clinic_room",
        entityId: room.id,
        details: `Updated room: ${room.name}`,
      });

      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to update clinic room" });
    }
  });

  app.delete("/api/clinic-rooms/:id", requireClinicScope, async (req, res) => {
    try {
      const scope = getScope(req);
      const room = await storage.getClinicRoom(req.params.id, scope);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      await storage.deleteClinicRoom(req.params.id, scope);

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "deleted",
        entityType: "clinic_room",
        entityId: req.params.id,
        details: `Deleted room: ${room.name}`,
      });

      res.json({ message: "Room deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete clinic room" });
    }
  });

  // Backup - Export all data as JSON (admin only)
  app.post("/api/backup", requireClinicScope, async (req, res) => {
    try {
      const { includeFiles } = req.body || {};
      
      // Helper to convert Object Storage URLs to base64 for full backup
      const convertUrlToBase64 = async (url: string | null | undefined): Promise<string | null> => {
        if (!url || !includeFiles) return url || null;
        
        // Already base64, return as-is
        if (url.startsWith("data:")) return url;
        
        // Object Storage URL - convert to base64
        if (url.startsWith("/objects/")) {
          try {
            const { getFileFromObjectPath, getObjectAsBase64 } = await import("./replit_integrations/object_storage/objectStorage");
            const file = await getFileFromObjectPath(url);
            if (file) {
              return await getObjectAsBase64(file);
            }
          } catch (e) {
            console.error("Error converting object storage file:", e);
          }
        }
        
        return url;
      };
      
      // Core clinical data
      const patientsList = await storage.getPatients({});
      const appointmentsList = await storage.getAppointments({});
      const treatmentsList = await storage.getTreatments();
      const inventoryList = await storage.getInventoryItems({});
      const labCasesList = await storage.getLabCases({});
      
      // Financial data
      const invoicesList = await storage.getInvoices({});
      const paymentsList = await storage.getPayments({});
      const paymentPlansList = await storage.getPaymentPlans({});
      const expensesList = await storage.getExpenses({});
      const insuranceClaimsList = await storage.getInsuranceClaims({});
      
      // Get invoice items and adjustments for each invoice
      const invoiceItemsMap: Record<string, any[]> = {};
      const invoiceAdjustmentsMap: Record<string, any[]> = {};
      for (const invoice of invoicesList) {
        invoiceItemsMap[invoice.id] = await storage.getInvoiceItems(invoice.id);
        invoiceAdjustmentsMap[invoice.id] = await storage.getInvoiceAdjustments(invoice.id);
      }
      
      // Get patient treatments and documents for each patient
      const patientTreatmentsMap: Record<string, any[]> = {};
      const patientDocumentsMap: Record<string, any[]> = {};
      for (const patient of patientsList) {
        patientTreatmentsMap[patient.id] = await storage.getPatientTreatments(patient.id);
        const docs = await storage.getPatientDocuments(patient.id);
        // Convert document file URLs to base64 if full backup
        if (includeFiles) {
          patientDocumentsMap[patient.id] = await Promise.all(
            docs.map(async (doc) => ({
              ...doc,
              fileUrl: await convertUrlToBase64(doc.fileUrl) || doc.fileUrl,
            }))
          );
        } else {
          patientDocumentsMap[patient.id] = docs;
        }
      }
      
      // Convert patient photos to base64 if full backup
      const patientsWithPhotos = includeFiles ? await Promise.all(
        patientsList.map(async (patient) => ({
          ...patient,
          photoUrl: await convertUrlToBase64(patient.photoUrl) || patient.photoUrl,
        }))
      ) : patientsList;
      
      // Get payment plan installments for each payment plan
      const paymentPlanInstallmentsMap: Record<string, any[]> = {};
      for (const plan of paymentPlansList) {
        paymentPlanInstallmentsMap[plan.id] = await storage.getPaymentPlanInstallments(plan.id);
      }
      
      // Lab and external services
      const externalLabsList = await storage.getExternalLabs();
      const labServicesList = await storage.getLabServices();
      
      // Doctor payments
      const doctorPaymentsList = await storage.getDoctorPayments({});
      
      // Users (exclude password hash for security)
      const usersList = await storage.getUsers({});
      // Convert user avatars to base64 if full backup
      const usersWithoutPasswords = includeFiles ? await Promise.all(
        usersList.map(async ({ password, ...user }) => ({
          ...user,
          avatarUrl: await convertUrlToBase64(user.avatarUrl) || user.avatarUrl,
        }))
      ) : usersList.map(({ password, ...user }) => user);
      
      // Settings and clinic configuration
      const clinicSettings = await storage.getClinicSettings();
      const clinicRooms = await storage.getClinicRooms();
      
      // Convert clinic logo to base64 if full backup
      const clinicSettingsWithLogo = includeFiles && clinicSettings?.logoUrl
        ? { ...clinicSettings, logoUrl: await convertUrlToBase64(clinicSettings.logoUrl) || clinicSettings.logoUrl }
        : clinicSettings;

      const backupData = {
        version: "2.4",
        includesFiles: !!includeFiles,
        exportedAt: new Date().toISOString(),
        data: {
          // Core clinical data
          patients: patientsWithPhotos,
          patientTreatments: patientTreatmentsMap,
          patientDocuments: patientDocumentsMap,
          appointments: appointmentsList,
          treatments: treatmentsList,
          inventory: inventoryList,
          
          // Lab data
          labCases: labCasesList,
          externalLabs: externalLabsList,
          labServices: labServicesList,
          
          // Financial data
          invoices: invoicesList,
          invoiceItems: invoiceItemsMap,
          invoiceAdjustments: invoiceAdjustmentsMap,
          payments: paymentsList,
          paymentPlans: paymentPlansList,
          paymentPlanInstallments: paymentPlanInstallmentsMap,
          expenses: expensesList,
          insuranceClaims: insuranceClaimsList,
          doctorPayments: doctorPaymentsList,
          
          // Users and settings
          users: usersWithoutPasswords,
          clinicSettings: clinicSettingsWithLogo,
          clinicRooms: clinicRooms,
        },
        summary: {
          patients: patientsList.length,
          appointments: appointmentsList.length,
          treatments: treatmentsList.length,
          invoices: invoicesList.length,
          payments: paymentsList.length,
          paymentPlans: paymentPlansList.length,
          expenses: expensesList.length,
          doctorPayments: doctorPaymentsList.length,
          users: usersWithoutPasswords.length,
          inventory: inventoryList.length,
          labCases: labCasesList.length,
          insuranceClaims: insuranceClaimsList.length,
          rooms: clinicRooms.length,
        },
      };

      await storage.logActivity({
        userId: (req.user as any).id,
        action: "exported",
        entityType: "backup",
        entityId: null,
        details: `Full backup exported: ${patientsList.length} patients, ${appointmentsList.length} appointments, ${treatmentsList.length} services, ${invoicesList.length} invoices, ${paymentsList.length} payments, ${expensesList.length} expenses, ${usersWithoutPasswords.length} users`,
      });

      res.json(backupData);
    } catch (error) {
      console.error("Backup error:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  // Restore - Import data from JSON backup (admin only)
  // This uses direct database inserts to preserve original IDs and relationships
  // All operations are wrapped in a transaction for consistency
  app.post("/api/restore", requireClinicScope, async (req, res) => {
    try {
      const { data } = req.body;

      if (!data) {
        return res.status(400).json({ message: "No backup data provided" });
      }

      // Helper function to convert date strings to Date objects
      // JSON.parse converts Date objects to ISO strings, but Drizzle expects Date objects
      const dateFieldPatterns = [
        'createdAt', 'created_at', 'updatedAt', 'updated_at',
        'date', 'Date', 'payment_date', 'expense_date', 'issued_date', 'due_date',
        'scheduled_date', 'start_time', 'end_time', 'sent_date', 'expected_return_date',
        'actual_return_date', 'submitted_date', 'processed_date', 'subscriber_dob',
        'dateOfBirth', 'date_of_birth', 'dueDate', 'paidDate', 'expiryDate'
      ];

      const convertDatesToObjects = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (Array.isArray(obj)) {
          return obj.map(item => convertDatesToObjects(item));
        }
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key of Object.keys(obj)) {
            const value = obj[key];
            // Check if this key is a date field and the value is a valid date string
            if (
              dateFieldPatterns.some(pattern => 
                key === pattern || key.toLowerCase().includes('date') || key.toLowerCase().includes('time')
              ) &&
              typeof value === 'string' &&
              !isNaN(Date.parse(value))
            ) {
              result[key] = new Date(value);
            } else if (typeof value === 'object' && value !== null) {
              result[key] = convertDatesToObjects(value);
            } else {
              result[key] = value;
            }
          }
          return result;
        }
        return obj;
      };

      const counts = {
        users: 0,
        patients: 0,
        patientTreatments: 0,
        patientDocuments: 0,
        appointments: 0,
        treatments: 0,
        invoices: 0,
        invoiceItems: 0,
        invoiceAdjustments: 0,
        payments: 0,
        paymentPlans: 0,
        paymentPlanInstallments: 0,
        expenses: 0,
        doctorPayments: 0,
        insuranceClaims: 0,
        inventory: 0,
        labCases: 0,
        externalLabs: 0,
        labServices: 0,
        clinicRooms: 0,
      };

      // Convert all date strings to Date objects before processing
      const processedData = convertDatesToObjects(data);

      // Wrap all imports in a transaction for consistency
      await db.transaction(async (tx) => {
        // 0. Import users first (many entities reference them via doctorId, createdById)
        // Users are imported without passwords - admin must reset them after restore
        if (processedData.users && Array.isArray(processedData.users)) {
          for (const user of processedData.users) {
            try {
              // If user doesn't have password, generate a valid bcrypt hash of a random string
              // Users will need password reset by admin after restore
              let passwordHash = user.password;
              if (!passwordHash) {
                // Generate a valid bcrypt hash for a random password (users must reset)
                const randomPassword = `RESET_REQUIRED_${Date.now()}_${Math.random().toString(36)}`;
                passwordHash = await bcrypt.hash(randomPassword, 10);
              }
              const userWithPassword = {
                ...user,
                password: passwordHash,
              };
              await tx.insert(users).values(userWithPassword).onConflictDoNothing();
              counts.users++;
            } catch (e) {
              console.error("Failed to import user:", e);
              throw e; // Re-throw to abort transaction
            }
          }
        }

        // 1. Import external labs first (lab cases depend on them)
        if (processedData.externalLabs && Array.isArray(processedData.externalLabs)) {
          for (const lab of processedData.externalLabs) {
            try {
              await tx.insert(externalLabs).values(lab).onConflictDoNothing();
              counts.externalLabs++;
            } catch (e) {
              console.error("Failed to import external lab:", e);
              throw e;
            }
          }
        }

        // 2. Import lab services
        if (processedData.labServices && Array.isArray(processedData.labServices)) {
          for (const service of processedData.labServices) {
            try {
              await tx.insert(labServices).values(service).onConflictDoNothing();
              counts.labServices++;
            } catch (e) {
              console.error("Failed to import lab service:", e);
              throw e;
            }
          }
        }

        // 3. Import treatments/services (they don't depend on other entities)
        if (processedData.treatments && Array.isArray(processedData.treatments)) {
          for (const treatment of processedData.treatments) {
            try {
              await tx.insert(treatments).values(treatment).onConflictDoNothing();
              counts.treatments++;
            } catch (e) {
              console.error("Failed to import treatment:", e);
              throw e;
            }
          }
        }

        // 4. Import clinic rooms
        if (processedData.clinicRooms && Array.isArray(processedData.clinicRooms)) {
          for (const room of processedData.clinicRooms) {
            try {
              await tx.insert(clinicRooms).values(room).onConflictDoNothing();
              counts.clinicRooms++;
            } catch (e) {
              console.error("Failed to import clinic room:", e);
              throw e;
            }
          }
        }

        // 5. Import patients
        if (processedData.patients && Array.isArray(processedData.patients)) {
          for (const patient of processedData.patients) {
            try {
              await tx.insert(patients).values(patient).onConflictDoNothing();
              counts.patients++;
            } catch (e) {
              console.error("Failed to import patient:", e);
              throw e;
            }
          }
        }

        // 6. Import patient treatments (links patients to treatments)
        if (processedData.patientTreatments && typeof processedData.patientTreatments === 'object') {
          for (const patientId of Object.keys(processedData.patientTreatments)) {
            const ptList = processedData.patientTreatments[patientId];
            if (Array.isArray(ptList)) {
              for (const pt of ptList) {
                try {
                  await tx.insert(patientTreatments).values(pt).onConflictDoNothing();
                  counts.patientTreatments++;
                } catch (e) {
                  console.error("Failed to import patient treatment:", e);
                  throw e;
                }
              }
            }
          }
        }

        // 7. Import patient documents
        if (processedData.patientDocuments && typeof processedData.patientDocuments === 'object') {
          for (const patientId of Object.keys(processedData.patientDocuments)) {
            const docList = processedData.patientDocuments[patientId];
            if (Array.isArray(docList)) {
              for (const doc of docList) {
                try {
                  await tx.insert(documents).values(doc).onConflictDoNothing();
                  counts.patientDocuments++;
                } catch (e) {
                  console.error("Failed to import patient document:", e);
                  throw e;
                }
              }
            }
          }
        }

        // 8. Import appointments
        if (processedData.appointments && Array.isArray(processedData.appointments)) {
          for (const appointment of processedData.appointments) {
            try {
              await tx.insert(appointments).values(appointment).onConflictDoNothing();
              counts.appointments++;
            } catch (e) {
              console.error("Failed to import appointment:", e);
              throw e;
            }
          }
        }

        // 9. Import inventory items
        if (processedData.inventory && Array.isArray(processedData.inventory)) {
          for (const item of processedData.inventory) {
            try {
              await tx.insert(inventoryItems).values(item).onConflictDoNothing();
              counts.inventory++;
            } catch (e) {
              console.error("Failed to import inventory item:", e);
              throw e;
            }
          }
        }

        // 10. Import lab cases
        if (processedData.labCases && Array.isArray(processedData.labCases)) {
          for (const labCase of processedData.labCases) {
            try {
              await tx.insert(labCases).values(labCase).onConflictDoNothing();
              counts.labCases++;
            } catch (e) {
              console.error("Failed to import lab case:", e);
              throw e;
            }
          }
        }

        // 11. Import invoices (before payments and claims which reference them)
        if (processedData.invoices && Array.isArray(processedData.invoices)) {
          for (const invoice of processedData.invoices) {
            try {
              await tx.insert(invoices).values(invoice).onConflictDoNothing();
              counts.invoices++;
            } catch (e) {
              console.error("Failed to import invoice:", e);
              throw e;
            }
          }
        }

        // 12. Import invoice items
        if (processedData.invoiceItems && typeof processedData.invoiceItems === 'object') {
          for (const invoiceId of Object.keys(processedData.invoiceItems)) {
            const itemList = processedData.invoiceItems[invoiceId];
            if (Array.isArray(itemList)) {
              for (const item of itemList) {
                try {
                  await tx.insert(invoiceItems).values(item).onConflictDoNothing();
                  counts.invoiceItems++;
                } catch (e) {
                  console.error("Failed to import invoice item:", e);
                  throw e;
                }
              }
            }
          }
        }

        // 13. Import invoice adjustments
        if (processedData.invoiceAdjustments && typeof processedData.invoiceAdjustments === 'object') {
          for (const invoiceId of Object.keys(processedData.invoiceAdjustments)) {
            const adjList = processedData.invoiceAdjustments[invoiceId];
            if (Array.isArray(adjList)) {
              for (const adj of adjList) {
                try {
                  await tx.insert(invoiceAdjustments).values(adj).onConflictDoNothing();
                  counts.invoiceAdjustments++;
                } catch (e) {
                  console.error("Failed to import invoice adjustment:", e);
                  throw e;
                }
              }
            }
          }
        }

        // 14. Import payments
        if (processedData.payments && Array.isArray(processedData.payments)) {
          for (const payment of processedData.payments) {
            try {
              await tx.insert(payments).values(payment).onConflictDoNothing();
              counts.payments++;
            } catch (e) {
              console.error("Failed to import payment:", e);
              throw e;
            }
          }
        }

        // 15. Import payment plans
        if (processedData.paymentPlans && Array.isArray(processedData.paymentPlans)) {
          for (const plan of processedData.paymentPlans) {
            try {
              await tx.insert(paymentPlans).values(plan).onConflictDoNothing();
              counts.paymentPlans++;
            } catch (e) {
              console.error("Failed to import payment plan:", e);
              throw e;
            }
          }
        }

        // 16. Import payment plan installments
        if (processedData.paymentPlanInstallments && typeof processedData.paymentPlanInstallments === 'object') {
          for (const planId of Object.keys(processedData.paymentPlanInstallments)) {
            const installmentList = processedData.paymentPlanInstallments[planId];
            if (Array.isArray(installmentList)) {
              for (const installment of installmentList) {
                try {
                  await tx.insert(paymentPlanInstallments).values(installment).onConflictDoNothing();
                  counts.paymentPlanInstallments++;
                } catch (e) {
                  console.error("Failed to import payment plan installment:", e);
                  throw e;
                }
              }
            }
          }
        }

        // 17. Import expenses
        if (processedData.expenses && Array.isArray(processedData.expenses)) {
          for (const expense of processedData.expenses) {
            try {
              await tx.insert(expenses).values(expense).onConflictDoNothing();
              counts.expenses++;
            } catch (e) {
              console.error("Failed to import expense:", e);
              throw e;
            }
          }
        }

        // 18. Import doctor payments
        if (processedData.doctorPayments && Array.isArray(processedData.doctorPayments)) {
          for (const payment of processedData.doctorPayments) {
            try {
              // Remove joined doctor data if present
              const { doctor, ...paymentData } = payment;
              await tx.insert(doctorPayments).values(paymentData).onConflictDoNothing();
              counts.doctorPayments++;
            } catch (e) {
              console.error("Failed to import doctor payment:", e);
              throw e;
            }
          }
        }

        // 19. Import insurance claims
        if (processedData.insuranceClaims && Array.isArray(processedData.insuranceClaims)) {
          for (const claim of processedData.insuranceClaims) {
            try {
              await tx.insert(insuranceClaims).values(claim).onConflictDoNothing();
              counts.insuranceClaims++;
            } catch (e) {
              console.error("Failed to import insurance claim:", e);
              throw e;
            }
          }
        }
      }); // End transaction

      // Update clinic settings outside transaction (uses storage method)
      if (processedData.clinicSettings) {
        try {
          await storage.updateClinicSettings(processedData.clinicSettings);
        } catch (e) {
          console.error("Failed to update clinic settings:", e);
        }
      }

      // Log activity after successful transaction
      await storage.logActivity({
        userId: (req.user as any).id,
        action: "restored",
        entityType: "backup",
        entityId: null,
        details: `Full restore: ${counts.users} users, ${counts.patients} patients, ${counts.patientTreatments} patient treatments, ${counts.appointments} appointments, ${counts.treatments} services, ${counts.invoices} invoices, ${counts.payments} payments, ${counts.expenses} expenses, ${counts.doctorPayments} doctor payments, ${counts.insuranceClaims} claims, ${counts.labCases} lab cases, ${counts.inventory} inventory`,
      });

      res.json({
        message: "Backup restored successfully",
        counts,
      });
    } catch (error) {
      console.error("Restore error:", error);
      res.status(500).json({ message: "Failed to restore backup" });
    }
  });

  // Delete all data with password verification (admin only)
  const deleteAllDataSchema = z.object({
    password: z.string().min(1, "Password is required"),
  });

  app.post("/api/delete-all-data", requireClinicScope, async (req, res) => {
    try {
      // Validate request body
      const parsed = deleteAllDataSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid request" });
      }

      const { password } = parsed.data;
      const userId = (req.user as any).id;

      // Verify the user's password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      // Delete all data in a transaction for atomicity
      await db.transaction(async (tx) => {
        // Delete in correct order (respecting foreign key constraints)
        // Start with dependent tables first
        await tx.delete(documents);
        await tx.delete(patientTreatments);
        await tx.delete(invoiceItems);
        await tx.delete(invoiceAdjustments);
        await tx.delete(paymentPlanInstallments);
        await tx.delete(payments);
        await tx.delete(paymentPlans);
        await tx.delete(insuranceClaims); // Must be before invoices (FK to invoices)
        await tx.delete(invoices);
        await tx.delete(appointments);
        await tx.delete(labCases);
        await tx.delete(patients);
        await tx.delete(treatments);
        await tx.delete(inventoryItems);
        await tx.delete(labServices);
        await tx.delete(externalLabs);
        await tx.delete(expenses);
        await tx.delete(doctorPayments); // Delete doctor payments
        await tx.delete(clinicRooms);
        await tx.delete(activityLog);
        await tx.delete(notifications);
        await tx.delete(notificationPreferences);
      });

      // Log the destructive action (after transaction completes)
      await storage.logActivity({
        userId,
        action: "deleted_all_data",
        entityType: "system",
        entityId: null,
        details: "All clinic data was permanently deleted",
      });

      res.json({ message: "All data has been permanently deleted" });
    } catch (error) {
      console.error("Delete all data error:", error);
      res.status(500).json({ message: "Failed to delete all data" });
    }
  });

  // ==================== SUBSCRIPTION & ORGANIZATION ROUTES ====================

  // Get all subscription plans (public)
  app.get("/api/subscription/plans", async (req, res) => {
    try {
      const plans = await subscriptionService.getAllPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Get current user's subscription context
  app.get("/api/subscription/context", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const context = await subscriptionService.getSubscriptionContext(user.id);
      res.json(context);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription context" });
    }
  });

  // Validate promo code
  app.post("/api/subscription/validate-promo", async (req, res) => {
    try {
      const { code, planType } = req.body;
      if (!code || !planType) {
        return res.status(400).json({ message: "Code and plan type required" });
      }
      const result = await subscriptionService.validatePromoCode(code, planType);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to validate promo code" });
    }
  });

  // Create organization (during signup)
  app.post("/api/subscription/create-organization", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const { name, planType, promoCodeId } = req.body;
      
      if (!name || !planType) {
        return res.status(400).json({ message: "Name and plan type required" });
      }

      if (!["clinic", "doctor", "student"].includes(planType)) {
        return res.status(400).json({ message: "Invalid plan type" });
      }

      // Check if user already has an organization
      if (user.organizationId) {
        return res.status(400).json({ message: "User already has an organization" });
      }

      const organization = await subscriptionService.createOrganization(
        name,
        user.id,
        planType,
        promoCodeId
      );

      res.json(organization);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create organization" });
    }
  });

  // Check if can add patient
  app.get("/api/subscription/can-add-patient", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.organizationId) {
        return res.json({ allowed: false, message: "No organization" });
      }
      const result = await subscriptionService.canAddPatient(user.organizationId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to check patient limit" });
    }
  });

  // Check if can add user
  app.get("/api/subscription/can-add-user", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.organizationId) {
        return res.json({ allowed: false, message: "No organization" });
      }
      const result = await subscriptionService.canAddUser(user.organizationId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to check user limit" });
    }
  });

  // Check feature access
  app.get("/api/subscription/has-feature/:feature", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const feature = req.params.feature as keyof PlanFeatures;
      
      if (!user.organizationId) {
        return res.json({ hasFeature: false });
      }
      
      const hasFeature = await subscriptionService.hasFeature(user.organizationId, feature);
      res.json({ hasFeature });
    } catch (error) {
      res.status(500).json({ message: "Failed to check feature access" });
    }
  });

  // Get organization details (admin/owner only)
  app.get("/api/organization", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.organizationId) {
        return res.status(404).json({ message: "No organization found" });
      }

      const org = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
      if (!org[0]) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Include subscription plan details
      let plan = null;
      if (org[0].subscriptionPlanId) {
        const planResult = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, org[0].subscriptionPlanId)).limit(1);
        plan = planResult[0] || null;
      }

      res.json({ organization: org[0], plan });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Update organization (owner only)
  app.patch("/api/organization", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user.organizationId || !user.isOrganizationOwner) {
        return res.status(403).json({ message: "Only organization owner can update" });
      }

      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Name required" });
      }

      await db.update(organizations)
        .set({ name, updatedAt: new Date() })
        .where(eq(organizations.id, user.organizationId));

      res.json({ message: "Organization updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update organization" });
    }
  });

  // ==================== STRIPE PAYMENT ROUTES ====================
  
  // Get Stripe publishable key
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const { getStripePublishableKey } = await import("./stripeClient");
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ message: "Failed to get Stripe configuration" });
    }
  });

  // Get products with prices from Stripe
  app.get("/api/stripe/products", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
        ORDER BY p.name, pr.unit_amount
      `);

      const productsMap = new Map();
      for (const row of result.rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unitAmount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            metadata: row.price_metadata,
          });
        }
      }

      res.json({ products: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Create checkout session
  app.post("/api/stripe/checkout", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const { priceId, planType, promoCode } = req.body;

      if (!priceId) {
        return res.status(400).json({ message: "Price ID required" });
      }

      // Check if promo code makes it free (bypass Stripe)
      if (promoCode) {
        const promoResult = await db.execute(sql`
          SELECT * FROM promo_codes 
          WHERE code = ${promoCode} 
          AND is_active = true
          AND (valid_from IS NULL OR valid_from <= NOW())
          AND (valid_until IS NULL OR valid_until >= NOW())
          AND (max_uses IS NULL OR current_uses < max_uses)
        `);

        if (promoResult.rows.length > 0) {
          const promo = promoResult.rows[0] as any;
          // 100% discount = free plan change
          if (promo.discount_type === 'percentage' && parseFloat(promo.discount_value) === 100) {
            // Determine the plan type from price ID
            let targetPlanType = planType;
            if (!targetPlanType) {
              if (priceId.includes('student')) targetPlanType = 'student';
              else if (priceId.includes('doctor')) targetPlanType = 'doctor';
              else if (priceId.includes('clinic')) targetPlanType = 'clinic';
            }

            // Find the subscription plan
            const plan = await db.query.subscriptionPlans.findFirst({
              where: eq(subscriptionPlans.type, targetPlanType)
            });

            if (plan && user.organizationId) {
              // Update the organization's subscription directly
              await db.execute(sql`
                UPDATE organizations 
                SET subscription_plan_id = ${plan.id},
                    subscription_status = 'active',
                    billing_cycle = 'annual',
                    updated_at = NOW()
                WHERE id = ${user.organizationId}
              `);

              // Increment promo code usage
              await db.execute(sql`
                UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = ${promo.id}
              `);

              return res.json({ url: "/pricing?success=true", freeUpgrade: true });
            }
          }
        }
      }

      // Check if this is a placeholder price (development bypass) - skip Stripe checkout
      if (priceId.startsWith('price_') && (priceId === 'price_student' || priceId === 'price_doctor' || priceId === 'price_clinic')) {
        return res.status(400).json({ 
          message: "Stripe prices not configured. Use promo code FREE2026 for 100% discount to bypass payment." 
        });
      }

      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();

      // Get organization's stripe customer ID
      const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, user.organizationId)
      });

      let customerId = organization?.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || `${user.username}@dentalcare.app`,
          metadata: { userId: user.id.toString() },
        });
        customerId = customer.id;

        await db.execute(sql`
          UPDATE organizations SET stripe_customer_id = ${customer.id} WHERE id = ${user.organizationId}
        `);
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const trialDays = planType === 'clinic' ? 15 : 0;

      const sessionConfig: any = {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/subscription/cancel`,
        metadata: { userId: user.id.toString(), planType },
      };

      if (trialDays > 0) {
        sessionConfig.subscription_data = {
          trial_period_days: trialDays,
        };
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Create customer portal session
  app.post("/api/stripe/portal", requireClinicScope, async (req, res) => {
    try {
      const user = req.user as any;
      const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, user.organizationId)
      });

      if (!organization?.stripeCustomerId) {
        return res.status(400).json({ message: "No Stripe customer found" });
      }

      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const session = await stripe.billingPortal.sessions.create({
        customer: organization.stripeCustomerId,
        return_url: `${baseUrl}/settings`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  // ==================== END SUBSCRIPTION ROUTES ====================

  // ==================== SIMPLE REGISTRATION (Free - No Stripe) ====================

  // Simple registration endpoint - creates organization and user directly
  app.post("/api/register", async (req, res) => {
    try {
      const { 
        mode, // 'create_clinic' or 'join_clinic'
        clinicName, // required for create_clinic mode
        clinicSlug, // required for join_clinic mode
        firstName,
        lastName,
        username,
        email,
        phone,
        password,
        role, // 'doctor', 'staff', 'student' for join_clinic mode
        specialty,
        university,
        yearOfStudy,
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !username || !password) {
        return res.status(400).json({ message: "First name, last name, username, and password are required" });
      }

      if (!mode || !['create_clinic', 'join_clinic'].includes(mode)) {
        return res.status(400).json({ message: "Mode must be 'create_clinic' or 'join_clinic'" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists (if provided)
      if (email) {
        const systemScope: ClinicScopeOptions = { isSuperAdmin: true };
        const allUsers = await storage.getUsers({}, systemScope);
        const emailExists = allUsers.some((u: any) => u.email === email);
        if (emailExists) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      let organizationId: string;
      let userRole: string;
      let isActive: boolean;

      if (mode === 'create_clinic') {
        // Create new organization - user becomes clinic_admin immediately
        if (!clinicName) {
          return res.status(400).json({ message: "Clinic name is required for creating a new clinic" });
        }

        // Generate slug from clinic name
        const slug = clinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        // Check if slug already exists
        const existingOrg = await db.execute(sql`
          SELECT id FROM organizations WHERE slug = ${slug}
        `);
        
        if (existingOrg.rows.length > 0) {
          return res.status(400).json({ message: "A clinic with this name already exists. Please choose a different name." });
        }

        // Create organization
        const orgId = crypto.randomUUID();
        await db.execute(sql`
          INSERT INTO organizations (id, name, slug, created_at, updated_at)
          VALUES (${orgId}, ${clinicName}, ${slug}, NOW(), NOW())
        `);
        
        organizationId = orgId;
        userRole = 'clinic_admin'; // First user becomes clinic admin - NO approval needed
        isActive = true; // Clinic admins are active immediately

        // Create default clinic settings via direct insert
        await db.execute(sql`
          INSERT INTO clinic_settings (organization_id, clinic_name, address, phone, email, website, updated_at)
          VALUES (${organizationId}, ${clinicName}, '', ${phone || ''}, ${email || ''}, '', NOW())
        `);

        console.log(`[Registration] Created new clinic "${clinicName}" (${slug}) with admin user "${username}"`);

      } else {
        // Join existing clinic - user is pending until approved
        if (!clinicSlug) {
          return res.status(400).json({ message: "Clinic identifier is required to join an existing clinic" });
        }

        // Find organization by slug
        const orgResult = await db.execute(sql`
          SELECT id FROM organizations WHERE slug = ${clinicSlug}
        `);
        
        if (orgResult.rows.length === 0) {
          return res.status(400).json({ message: "Clinic not found. Please check the clinic identifier." });
        }

        organizationId = (orgResult.rows[0] as any).id;
        userRole = 'pending'; // Needs approval from clinic admin
        isActive = false; // Pending users are NOT active until approved

        console.log(`[Registration] User "${username}" requested to join clinic (slug: ${clinicSlug})`);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        firstName,
        lastName,
        username,
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        role: userRole as "super_admin" | "clinic_admin" | "admin" | "doctor" | "staff" | "student" | "pending",
        organizationId,
        specialty: specialty || null,
        university: university || null,
        yearOfStudy: yearOfStudy || null,
        isActive, // Clinic admins are active, pending users are not
        isOrganizationOwner: mode === 'create_clinic', // Set as owner if creating clinic
      });

      // Log activity
      await storage.logActivity({
        userId: user.id,
        action: 'user_registered',
        entityType: 'user',
        entityId: user.id,
        details: mode === 'create_clinic' 
          ? `New clinic "${clinicName}" created with admin user ${username}` 
          : `User ${username} requested to join clinic`,
      });

      // If pending, notify clinic admins
      if (userRole === 'pending') {
        try {
          // Get clinic admins to notify
          const admins = await storage.getUsersByClinic(organizationId);
          const adminUsers = admins.filter((u: any) => ['clinic_admin', 'admin'].includes(u.role));
          
          for (const admin of adminUsers) {
            // Insert notification directly
            await db.execute(sql`
              INSERT INTO notifications (user_id, type, title, message, data, is_read, created_at)
              VALUES (${admin.id}, 'user_approval', 'New User Registration', 
                ${`${firstName} ${lastName} has requested to join your clinic and is awaiting approval.`},
                ${JSON.stringify({ userId: user.id, username })}, false, NOW())
            `);
          }
        } catch (notifyError) {
          console.error("Failed to notify admins:", notifyError);
        }
      }

      res.status(201).json({
        message: mode === 'create_clinic' 
          ? "Clinic and account created successfully! You can now sign in."
          : "Registration request submitted. A clinic administrator will review your request.",
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          isPending: userRole === 'pending',
        },
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  // Get list of clinics (for join clinic dropdown)
  app.get("/api/clinics", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT id, name, slug FROM organizations ORDER BY name
      `);
      res.json({ clinics: result.rows });
    } catch (error) {
      console.error("Error fetching clinics:", error);
      res.status(500).json({ message: "Failed to fetch clinics" });
    }
  });

  // ==================== END SIMPLE REGISTRATION ====================

  // ==================== REGISTRATION ROUTES (Payment-First Flow - LEGACY) ====================

  // Validate promo code for registration (no auth required)
  app.post("/api/registration/validate-promo", async (req, res) => {
    try {
      const { code, planType, priceId } = req.body;

      if (!code || !planType || !priceId) {
        return res.status(400).json({ valid: false, message: "Missing required fields" });
      }

      const promoResult = await db.execute(sql`
        SELECT * FROM promo_codes 
        WHERE code = ${code} 
        AND is_active = true
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
        AND (max_uses IS NULL OR current_uses < max_uses)
      `);

      if (promoResult.rows.length === 0) {
        return res.json({ valid: false, message: "Invalid or expired promo code" });
      }

      const promo = promoResult.rows[0] as any;

      // Check if applicable to this plan
      if (promo.applicable_plans && !promo.applicable_plans.includes(planType)) {
        return res.json({ valid: false, message: "This code is not valid for the selected plan" });
      }

      // Get price info from Stripe
      const priceResult = await db.execute(sql`
        SELECT unit_amount FROM stripe.prices WHERE id = ${priceId}
      `);

      // Default price for development if not found in DB
      let originalAmount = 0;
      if (priceResult.rows.length > 0) {
        originalAmount = (priceResult.rows[0] as any).unit_amount || 0;
      } else {
        // Fallback prices for development display
        if (planType === 'student') originalAmount = 100;
        else if (planType === 'doctor') originalAmount = 5000;
        else if (planType === 'clinic') originalAmount = 15000;
      }

      let finalAmount = originalAmount;

      if (promo.discount_type === "percentage") {
        finalAmount = Math.round(originalAmount * (1 - parseFloat(promo.discount_value) / 100));
      } else {
        finalAmount = Math.max(0, originalAmount - parseFloat(promo.discount_value) * 100);
      }

      res.json({
        valid: true,
        promoCode: {
          discountType: promo.discount_type,
          discountValue: promo.discount_value,
        },
        originalAmount,
        finalAmount,
      });
    } catch (error) {
      console.error("Error validating promo code:", error);
      res.status(500).json({ valid: false, message: "Error validating code" });
    }
  });

  // Start registration (no auth required - creates pending registration and redirects to Stripe)
  app.post("/api/registration/start", async (req, res) => {
    try {
      const { planType, formData, priceId, promoCode } = req.body;

      if (!planType || !formData || !priceId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate plan type
      if (!['student', 'doctor', 'clinic'].includes(planType)) {
        return res.status(400).json({ message: "Invalid plan type" });
      }

      // Validate required fields
      const { username, email, phone, password } = formData;
      if (!username || !email || !phone || !password) {
        return res.status(400).json({ message: "Username, email, phone, and password are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Validate role-specific required fields
      if (planType === 'student') {
        if (!formData.firstName || !formData.lastName) {
          return res.status(400).json({ message: "First name and last name are required" });
        }
        if (!formData.university) {
          return res.status(400).json({ message: "University is required for students" });
        }
        if (!formData.yearOfStudy) {
          return res.status(400).json({ message: "Year of study is required for students" });
        }
      } else if (planType === 'doctor') {
        if (!formData.firstName || !formData.lastName) {
          return res.status(400).json({ message: "First name and last name are required" });
        }
        if (!formData.specialty) {
          return res.status(400).json({ message: "Specialty is required for doctors" });
        }
      } else if (planType === 'clinic') {
        if (!formData.fullName) {
          return res.status(400).json({ message: "Full name is required" });
        }
        if (!formData.clinicName) {
          return res.status(400).json({ message: "Clinic name is required" });
        }
        if (!formData.city) {
          return res.status(400).json({ message: "City is required for clinics" });
        }
      }

      // Check if username already exists
      const existingUser = await db.execute(sql`
        SELECT id FROM users WHERE username = ${username}
      `);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await db.execute(sql`
        SELECT id FROM users WHERE email = ${email}
      `);
      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const registrationData = {
        ...formData,
        password: hashedPassword,
      };

      // Special case for Student Plan fallback: If priceId is "student-fallback"
      // or similar, we might want to handle it, but it's safer to ensure
      // the priceId is always valid from Stripe.
      
      // Get price info from database
      const priceResult = await db.execute(sql`
        SELECT id, unit_amount FROM stripe.prices WHERE id = ${priceId}
      `);

      let finalAmount = 0;
      if (priceResult.rows.length === 0) {
        // Log the error but provide more info
        console.warn(`Price not found in database: ${priceId}. Checking if it's a dev bypass.`);
        
        // If priceId is not found but we have a promo code, we might be able to calculate 
        // For development/bypass, if price is missing but we have a promo, we check promo below
        // This allows 'dev_bypass_price' to work if a 100% promo is applied
        finalAmount = 0; 
      } else {
        finalAmount = (priceResult.rows[0] as any).unit_amount || 0;
      }

      let promoCodeId = null;

      // Apply promo code if provided
      if (promoCode) {
        const promoResult = await db.execute(sql`
          SELECT * FROM promo_codes 
          WHERE code = ${promoCode} 
          AND is_active = true
          AND (valid_from IS NULL OR valid_from <= NOW())
          AND (valid_until IS NULL OR valid_until >= NOW())
          AND (max_uses IS NULL OR current_uses < max_uses)
        `);

        if (promoResult.rows.length > 0) {
          const promo = promoResult.rows[0] as any;
          promoCodeId = promo.id;

          if (promo.discount_type === "percentage") {
            finalAmount = Math.round(finalAmount * (1 - parseFloat(promo.discount_value) / 100));
          } else {
            finalAmount = Math.max(0, finalAmount - parseFloat(promo.discount_value) * 100);
          }
        }
      }

      // Final check: if price wasn't found AND it's not a free promo registration, then it's an error
      if (priceResult.rows.length === 0 && finalAmount > 0) {
        return res.status(400).json({ message: "Invalid price or price not synchronized yet. Please try again in a few moments." });
      }

      // If final amount is 0, create account directly without payment
      if (finalAmount === 0) {
        // Create organization
        const orgName = planType === "clinic" 
          ? formData.clinicName 
          : planType === "doctor"
            ? `Dr. ${formData.firstName} ${formData.lastName}`
            : `${formData.firstName} ${formData.lastName}`;
        
        const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

        // Get subscription plan
        const planResult = await db.execute(sql`
          SELECT id FROM subscription_plans WHERE type = ${planType} LIMIT 1
        `);
        const subscriptionPlanId = planResult.rows.length > 0 ? (planResult.rows[0] as any).id : null;

        // Create organization
        const orgResult = await db.execute(sql`
          INSERT INTO organizations (name, slug, subscription_plan_id, subscription_status, city, promo_code_id)
          VALUES (${orgName}, ${uniqueSlug}, ${subscriptionPlanId}, 'active', ${formData.city || null}, ${promoCodeId})
          RETURNING id
        `);
        const organizationId = (orgResult.rows[0] as any).id;

        // Determine user role
        const userRole = planType === "student" ? "student" : planType === "doctor" ? "doctor" : "admin";

        // Parse names for clinic
        let firstName = formData.firstName;
        let lastName = formData.lastName;
        if (planType === "clinic" && formData.fullName) {
          const nameParts = formData.fullName.split(' ');
          firstName = nameParts[0] || formData.fullName;
          lastName = nameParts.slice(1).join(' ') || '';
        }

        // Create user
        await db.execute(sql`
          INSERT INTO users (
            username, password, email, first_name, last_name, phone, role,
            specialty, university, year_of_study,
            organization_id, is_organization_owner, is_active
          )
          VALUES (
            ${username}, ${hashedPassword}, ${email}, ${firstName}, ${lastName}, ${phone}, ${userRole},
            ${formData.specialty || null}, ${formData.university || null}, ${formData.yearOfStudy ? parseInt(formData.yearOfStudy) : null},
            ${organizationId}, true, true
          )
        `);

        // Update promo code usage
        if (promoCodeId) {
          await db.execute(sql`
            UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = ${promoCodeId}
          `);
        }

        return res.json({ freeRegistration: true, message: "Account created successfully" });
      }

      // Create pending registration
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const pendingResult = await db.execute(sql`
        INSERT INTO pending_registrations (plan_type, registration_data, price_id, promo_code, final_amount, expires_at)
        VALUES (${planType}, ${JSON.stringify(registrationData)}, ${priceId}, ${promoCode || null}, ${finalAmount}, ${expiresAt})
        RETURNING id
      `);
      const pendingId = (pendingResult.rows[0] as any).id;

      // Create Stripe checkout session
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const trialDays = planType === 'clinic' ? 15 : 0;

      const sessionConfig: any = {
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/registration/success?session_id={CHECKOUT_SESSION_ID}&pending_id=${pendingId}`,
        cancel_url: `${baseUrl}/register`,
        customer_email: email,
        metadata: { 
          pendingRegistrationId: pendingId,
          planType,
        },
      };

      if (trialDays > 0) {
        sessionConfig.subscription_data = {
          trial_period_days: trialDays,
        };
      }

      // Apply promo code discount in Stripe if available
      if (promoCode && promoCodeId) {
        // For simplicity, we'll handle discount on our end during account creation
        // Stripe doesn't natively support our promo code system
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      // Update pending registration with session ID
      await db.execute(sql`
        UPDATE pending_registrations SET stripe_session_id = ${session.id} WHERE id = ${pendingId}
      `);

      res.json({ checkoutUrl: session.url });
    } catch (error) {
      console.error("Error starting registration:", error);
      res.status(500).json({ message: "Failed to start registration" });
    }
  });

  // Complete registration after successful payment
  app.post("/api/registration/complete", async (req, res) => {
    try {
      const { sessionId, pendingId } = req.body;

      if (!pendingId || !sessionId) {
        return res.status(400).json({ message: "Missing pending registration ID or session ID" });
      }

      // Get pending registration
      const pendingResult = await db.execute(sql`
        SELECT * FROM pending_registrations 
        WHERE id = ${pendingId} 
        AND status = 'pending'
        AND expires_at > NOW()
      `);

      if (pendingResult.rows.length === 0) {
        return res.status(400).json({ message: "Registration not found, already completed, or expired" });
      }

      const pending = pendingResult.rows[0] as any;
      const formData = pending.registration_data;
      const planType = pending.plan_type;

      // Verify payment with Stripe
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();

      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items'],
      });

      // SECURITY: Verify session metadata matches pending registration
      if (session.metadata?.pendingRegistrationId !== pendingId) {
        console.error(`Session mismatch: expected ${pendingId}, got ${session.metadata?.pendingRegistrationId}`);
        return res.status(400).json({ message: "Invalid session for this registration" });
      }

      // SECURITY: Verify session matches the stored session ID
      if (pending.stripe_session_id && pending.stripe_session_id !== sessionId) {
        console.error(`Stored session ID mismatch: expected ${pending.stripe_session_id}, got ${sessionId}`);
        return res.status(400).json({ message: "Session ID mismatch" });
      }

      // SECURITY: Verify plan type matches
      if (session.metadata?.planType !== planType) {
        console.error(`Plan type mismatch: expected ${planType}, got ${session.metadata?.planType}`);
        return res.status(400).json({ message: "Plan type mismatch" });
      }

      // SECURITY: Verify price ID matches (check line items)
      const lineItems = session.line_items?.data || [];
      const sessionPriceId = lineItems[0]?.price?.id;
      if (sessionPriceId && sessionPriceId !== pending.price_id) {
        console.error(`Price ID mismatch: expected ${pending.price_id}, got ${sessionPriceId}`);
        return res.status(400).json({ message: "Price mismatch" });
      }

      // SECURITY: For non-trial plans, require actual payment
      // For clinic plan (15-day trial), subscription creation is sufficient
      const isTrialPlan = planType === 'clinic';
      if (isTrialPlan) {
        // For trial plans, having a subscription is sufficient
        if (!session.subscription) {
          return res.status(400).json({ message: "Subscription not created" });
        }
      } else {
        // For non-trial plans, require actual payment
        if (session.payment_status !== 'paid') {
          return res.status(400).json({ message: "Payment not completed" });
        }
      }

      // Create organization
      const orgName = planType === "clinic" 
        ? formData.clinicName 
        : planType === "doctor"
          ? `Dr. ${formData.firstName} ${formData.lastName}`
          : `${formData.firstName} ${formData.lastName}`;
      
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

      // Get subscription plan
      const planResult = await db.execute(sql`
        SELECT id FROM subscription_plans WHERE type = ${planType} LIMIT 1
      `);
      const subscriptionPlanId = planResult.rows.length > 0 ? (planResult.rows[0] as any).id : null;

      // Get promo code ID if used
      let promoCodeId = null;
      if (pending.promo_code) {
        const promoResult = await db.execute(sql`
          SELECT id FROM promo_codes WHERE code = ${pending.promo_code}
        `);
        if (promoResult.rows.length > 0) {
          promoCodeId = (promoResult.rows[0] as any).id;
        }
      }

      // Create organization
      const orgResult = await db.execute(sql`
        INSERT INTO organizations (
          name, slug, subscription_plan_id, subscription_status, 
          stripe_customer_id, stripe_subscription_id, city, promo_code_id
        )
        VALUES (
          ${orgName}, ${uniqueSlug}, ${subscriptionPlanId}, 'active',
          ${session.customer}, ${session.subscription}, ${formData.city || null}, ${promoCodeId}
        )
        RETURNING id
      `);
      const organizationId = (orgResult.rows[0] as any).id;

      // Determine user role
      const userRole = planType === "student" ? "student" : planType === "doctor" ? "doctor" : "admin";

      // Parse names for clinic
      let firstName = formData.firstName;
      let lastName = formData.lastName;
      if (planType === "clinic" && formData.fullName) {
        const nameParts = formData.fullName.split(' ');
        firstName = nameParts[0] || formData.fullName;
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // Create user
      await db.execute(sql`
        INSERT INTO users (
          username, password, email, first_name, last_name, phone, role,
          specialty, university, year_of_study,
          organization_id, is_organization_owner, is_active
        )
        VALUES (
          ${formData.username}, ${formData.password}, ${formData.email}, ${firstName}, ${lastName}, ${formData.phone}, ${userRole},
          ${formData.specialty || null}, ${formData.university || null}, ${formData.yearOfStudy ? parseInt(formData.yearOfStudy) : null},
          ${organizationId}, true, true
        )
      `);

      // Update promo code usage
      if (promoCodeId) {
        await db.execute(sql`
          UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = ${promoCodeId}
        `);
      }

      // Mark registration as completed
      await db.execute(sql`
        UPDATE pending_registrations SET status = 'completed' WHERE id = ${pendingId}
      `);

      res.json({ success: true, message: "Account created successfully" });
    } catch (error) {
      console.error("Error completing registration:", error);
      res.status(500).json({ message: "Failed to complete registration" });
    }
  });

  // ==================== END REGISTRATION ROUTES ====================

  return httpServer;
}
