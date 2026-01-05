import { getDb } from './db';
import { eq, and, gte, lt } from 'drizzle-orm';
import { leads, notifications } from '../drizzle/schema';

// Horários para enviar notificações (em horas)
const NOTIFICATION_TIMES = [8, 9.67, 11.5, 13, 14, 16.5, 17.5]; // 08:00, 09:40, 11:30, 13:00, 14:00, 16:30, 17:30

/**
 * Converte hora decimal para minutos
 * Ex: 9.67 = 9 horas e 40 minutos
 */
function decimalHourToMinutes(decimalHour: number): number {
  const hours = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hours) * 60);
  return hours * 60 + minutes;
}

/**
 * Cria notificações para consultas agendadas 1 dia depois
 */
async function generateNotifications() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  try {
    // Buscar leads com consulta agendada para amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    const leadsWithAppointments = await db
      .select()
      .from(leads)
      .where(
        and(
          gte(leads.appointmentDate, tomorrow),
          lt(leads.appointmentDate, tomorrowEnd),
          eq(leads.status, 'Agendado')
        )
      );

    console.log(`Found ${leadsWithAppointments.length} leads with appointments tomorrow`);

    // Para cada lead, criar notificações nos horários especificados
    for (const lead of leadsWithAppointments) {
      for (const decimalHour of NOTIFICATION_TIMES) {
        const notificationTime = new Date();
        const minutes = decimalHourToMinutes(decimalHour);
        notificationTime.setHours(
          Math.floor(minutes / 60),
          minutes % 60,
          0,
          0
        );

        // Verificar se a notificação já existe
        const existingNotification = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.leadId, lead.id),
              eq(notifications.type, 'appointment_reminder'),
              gte(notifications.scheduledFor, new Date(notificationTime.getTime() - 60000)),
              lt(notifications.scheduledFor, new Date(notificationTime.getTime() + 60000))
            )
          )
          .limit(1);

        if (existingNotification.length === 0) {
          // Criar nova notificação
          await db.insert(notifications).values({
            leadId: lead.id,
            userId: lead.userId,
            type: 'appointment_reminder',
            title: `Lembrete: Consulta de ${lead.treatmentType}`,
            message: `Consulta com ${lead.patientName} amanhã às ${lead.appointmentDate?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
            scheduledFor: notificationTime,
            sent: false,
          });

          console.log(`Created notification for lead ${lead.id} at ${notificationTime.toLocaleTimeString('pt-BR')}`);
        }
      }
    }

    console.log('Notification generation completed');
  } catch (error) {
    console.error('Error generating notifications:', error);
    process.exit(1);
  }
}

// Executar script
generateNotifications().then(() => {
  process.exit(0);
});
