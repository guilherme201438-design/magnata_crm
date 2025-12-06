import { getPendingNotifications, markNotificationAsSent, getLead } from "./db";
import { notifyOwner } from "./_core/notification";

/**
 * Process pending notifications and send them
 * This should be called periodically (e.g., every minute via a cron job)
 */
export async function processPendingNotifications() {
  try {
    const pendingNotifications = await getPendingNotifications();

    if (pendingNotifications.length === 0) {
      console.log("[Notifications] No pending notifications");
      return;
    }

    console.log(`[Notifications] Processing ${pendingNotifications.length} pending notifications`);

    for (const notification of pendingNotifications) {
      try {
        // Get lead details
        const lead = await getLead(notification.leadId, notification.userId);
        
        if (!lead) {
          console.warn(`[Notifications] Lead ${notification.leadId} not found`);
          continue;
        }

        // Send notification via owner notification system
        // In a real app, you might send SMS, email, push notification, etc.
        const success = await notifyOwner({
          title: notification.title,
          content: `${notification.message}\n\nPaciente: ${lead.patientName}\nTelefone: ${lead.phone}`,
        });

        if (success) {
          // Mark as sent
          await markNotificationAsSent(notification.id);
          console.log(`[Notifications] Notification ${notification.id} sent successfully`);
        } else {
          console.warn(`[Notifications] Failed to send notification ${notification.id}`);
        }
      } catch (error) {
        console.error(`[Notifications] Error processing notification ${notification.id}:`, error);
      }
    }
  } catch (error) {
    console.error("[Notifications] Error processing pending notifications:", error);
  }
}

/**
 * Schedule automatic appointment reminders
 * Call this when creating or updating an appointment
 */
export async function scheduleAppointmentReminder(
  leadId: number,
  userId: number,
  patientName: string,
  appointmentDate: Date
) {
  try {
    // Calculate reminder date (1 day before)
    const reminderDate = new Date(appointmentDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0); // 9 AM

    // Only schedule if reminder date is in the future
    if (reminderDate > new Date()) {
      const { createNotification } = await import("./db");
      
      await createNotification({
        leadId,
        userId,
        type: "appointment_reminder",
        title: `Lembrete de Consulta - ${patientName}`,
        message: `Consulta agendada para ${appointmentDate.toLocaleDateString("pt-BR")} às ${appointmentDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
        scheduledFor: reminderDate,
        sent: false,
      });

      console.log(`[Notifications] Appointment reminder scheduled for ${reminderDate}`);
    }
  } catch (error) {
    console.error("[Notifications] Error scheduling appointment reminder:", error);
  }
}
