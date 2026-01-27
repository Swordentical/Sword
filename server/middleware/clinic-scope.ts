import { Request, Response, NextFunction } from "express";
import type { UserRole } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      clinicId?: string;
      isSuperAdmin?: boolean;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export function requireClinicScope(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const user = req.user as Express.User;
  const userRole = user.role as UserRole;

  if (userRole === "super_admin") {
    req.isSuperAdmin = true;
    req.clinicId = user.organizationId || undefined;
    return next();
  }

  if (!user.organizationId) {
    return res.status(403).json({ message: "User is not associated with any clinic" });
  }

  req.clinicId = user.organizationId;
  req.isSuperAdmin = false;
  next();
}

export function requireClinicScopeWithCrossClinicAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const user = req.user as Express.User;
  const userRole = user.role as UserRole;

  if (userRole === "super_admin") {
    req.isSuperAdmin = true;
    const requestedClinicId = req.query.clinicId as string || req.body?.organizationId;
    req.clinicId = requestedClinicId || user.organizationId || undefined;
    return next();
  }

  if (!user.organizationId) {
    return res.status(403).json({ message: "User is not associated with any clinic" });
  }

  req.clinicId = user.organizationId;
  req.isSuperAdmin = false;
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as Express.User;
    const userRole = user.role as UserRole;

    if (userRole === "super_admin") {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}

export function requireClinicAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const user = req.user as Express.User;
  const userRole = user.role as UserRole;

  if (userRole === "super_admin" || userRole === "clinic_admin" || userRole === "admin") {
    return next();
  }

  return res.status(403).json({ message: "Clinic admin access required" });
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const user = req.user as Express.User;
  const userRole = user.role as UserRole;

  if (userRole !== "super_admin") {
    return res.status(403).json({ message: "Super admin access required" });
  }

  req.isSuperAdmin = true;
  next();
}

export function getClinicIdFromRequest(req: Request): string | undefined {
  return req.clinicId;
}

export function isSuperAdminRequest(req: Request): boolean {
  return req.isSuperAdmin === true;
}
