import { db } from "./db";
import { notifications, notificationPreferences, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

type NotificationType = "password_reset" | "low_stock" | "appointment_reminder" | "security_alert" | "payment_received";
type NotificationPriority = "low" | "medium" | "high" | "urgent";

interface CreateNotificationParams {
  userId: string;
  organizationId?: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

const preferenceKeys: Record<NotificationType, string> = {
  password_reset: "passwordResetInApp",
  low_stock: "lowStockInApp",
  appointment_reminder: "appointmentReminderInApp",
  security_alert: "securityAlertInApp",
  payment_received: "paymentReceivedInApp",
};

async function shouldSendNotification(userId: string, type: NotificationType): Promise<boolean> {
  const prefs = await db.select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  
  if (!prefs.length) {
    return true;
  }
  
  const prefKey = preferenceKeys[type] as keyof typeof prefs[0];
  return prefs[0][prefKey] !== false;
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const shouldSend = await shouldSendNotification(params.userId, params.type);
  
  if (!shouldSend) {
    return;
  }
  
  await db.insert(notifications).values({
    userId: params.userId,
    organizationId: params.organizationId,
    type: params.type,
    title: params.title,
    message: params.message,
    priority: params.priority || "medium",
    relatedEntityType: params.relatedEntityType,
    relatedEntityId: params.relatedEntityId,
    metadata: params.metadata,
  });
}

export async function notifyPasswordResetRequest(
  userId: string, 
  requestedBy: string,
  organizationId?: string
): Promise<void> {
  await createNotification({
    userId,
    organizationId,
    type: "password_reset",
    title: "Password Reset Requested",
    message: `A password reset was requested for your account by ${requestedBy}. If this wasn't you, please contact support immediately.`,
    priority: "high",
    relatedEntityType: "user",
    relatedEntityId: userId,
  });
}

export async function notifyPasswordResetByAdmin(
  userId: string,
  adminName: string,
  organizationId?: string
): Promise<void> {
  await createNotification({
    userId,
    organizationId,
    type: "password_reset",
    title: "Password Reset by Administrator",
    message: `Your password has been reset by ${adminName}. Please sign in with your new password.`,
    priority: "high",
    relatedEntityType: "user",
    relatedEntityId: userId,
  });
}

export async function notifyLowStock(
  userId: string,
  itemName: string,
  currentQuantity: number,
  minQuantity: number,
  itemId: string,
  organizationId?: string
): Promise<void> {
  await createNotification({
    userId,
    organizationId,
    type: "low_stock",
    title: "Low Stock Alert",
    message: `${itemName} is running low (${currentQuantity} remaining, minimum is ${minQuantity}). Please reorder soon.`,
    priority: currentQuantity === 0 ? "urgent" : "high",
    relatedEntityType: "inventory_item",
    relatedEntityId: itemId,
    metadata: { itemName, currentQuantity, minQuantity },
  });
}

export async function notifyAppointmentReminder(
  userId: string,
  patientName: string,
  appointmentDate: string,
  appointmentTime: string,
  appointmentId: string,
  organizationId?: string
): Promise<void> {
  await createNotification({
    userId,
    organizationId,
    type: "appointment_reminder",
    title: "Upcoming Appointment",
    message: `Reminder: You have an appointment with ${patientName} on ${appointmentDate} at ${appointmentTime}.`,
    priority: "medium",
    relatedEntityType: "appointment",
    relatedEntityId: appointmentId,
    metadata: { patientName, appointmentDate, appointmentTime },
  });
}

export async function notifySecurityAlert(
  userId: string,
  alertType: string,
  details: string,
  organizationId?: string
): Promise<void> {
  await createNotification({
    userId,
    organizationId,
    type: "security_alert",
    title: "Security Alert",
    message: `${alertType}: ${details}`,
    priority: "urgent",
    relatedEntityType: "security",
    metadata: { alertType, details },
  });
}

export async function notifyAdminsPasswordResetRequest(
  requestingUserId: string,
  identifier: string,
  organizationId?: string
): Promise<void> {
  const admins = await db.select()
    .from(users)
    .where(
      organizationId 
        ? and(eq(users.role, "admin"), eq(users.organizationId, organizationId))
        : eq(users.role, "admin")
    );
  
  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      organizationId,
      type: "password_reset",
      title: "Password Reset Request",
      message: `A user has requested a password reset for account: ${identifier}. Please review and assist if needed.`,
      priority: "medium",
      relatedEntityType: "user",
      relatedEntityId: requestingUserId,
      metadata: { identifier },
    });
  }
}

export async function notifyDoctorPaymentIssued(
  doctorId: string,
  amount: string,
  paymentType: string,
  paymentDate: string,
  paymentId: string,
  organizationId?: string
): Promise<void> {
  const paymentTypeLabels: Record<string, string> = {
    salary: "Salary",
    bonus: "Bonus",
    commission: "Commission",
    deduction: "Deduction",
    reimbursement: "Reimbursement",
    other: "Payment",
  };
  
  const typeLabel = paymentTypeLabels[paymentType] || "Payment";
  
  await createNotification({
    userId: doctorId,
    organizationId,
    type: "payment_received",
    title: `${typeLabel} Issued`,
    message: `A ${typeLabel.toLowerCase()} of $${amount} has been issued to you on ${paymentDate}.`,
    priority: "medium",
    relatedEntityType: "doctor_payment",
    relatedEntityId: paymentId,
    metadata: { amount, paymentType, paymentDate },
  });
}
