import { eq, and, gte, lte, like, or, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, leads, notifications, Lead, InsertLead, Notification, InsertNotification } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ LEADS QUERIES ============

export async function createLead(userId: number, data: Omit<InsertLead, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(leads).values({
    ...data,
    userId,
  });

  return result;
}

export async function updateLead(leadId: number, userId: number, data: Partial<Omit<Lead, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.update(leads)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(leads.id, leadId), eq(leads.userId, userId)));

  return result;
}

export async function deleteLead(leadId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.delete(leads)
    .where(and(eq(leads.id, leadId), eq(leads.userId, userId)));

  return result;
}

export async function getLead(leadId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export interface LeadFilters {
  search?: string; // Search by patient name or phone
  status?: string;
  treatmentType?: string;
  contactDateFrom?: Date;
  contactDateTo?: Date;
  appointmentDateFrom?: Date;
  appointmentDateTo?: Date;
  attended?: boolean;
  treatmentClosed?: boolean;
}

export async function getLeads(userId: number, filters: LeadFilters = {}, limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions: any[] = [eq(leads.userId, userId)];

  if (filters.search) {
    conditions.push(
      or(
        like(leads.patientName, `%${filters.search}%`),
        like(leads.phone, `%${filters.search}%`)
      )
    );
  }

  if (filters.status) {
    conditions.push(eq(leads.status, filters.status as any));
  }

  if (filters.treatmentType) {
    conditions.push(eq(leads.treatmentType, filters.treatmentType as any));
  }

  if (filters.contactDateFrom) {
    conditions.push(gte(leads.contactDate, filters.contactDateFrom));
  }

  if (filters.contactDateTo) {
    conditions.push(lte(leads.contactDate, filters.contactDateTo));
  }

  if (filters.appointmentDateFrom) {
    if (leads.appointmentDate) {
      conditions.push(gte(leads.appointmentDate, filters.appointmentDateFrom));
    }
  }

  if (filters.appointmentDateTo) {
    if (leads.appointmentDate) {
      conditions.push(lte(leads.appointmentDate, filters.appointmentDateTo));
    }
  }

  if (filters.attended !== undefined) {
    conditions.push(eq(leads.attended, filters.attended));
  }

  if (filters.treatmentClosed !== undefined) {
    conditions.push(eq(leads.treatmentClosed, filters.treatmentClosed));
  }

  const result = await db.select().from(leads)
    .where(and(...conditions))
    .orderBy(desc(leads.createdAt))
    .limit(limit)
    .offset(offset);

  return result;
}

export async function getLeadsCount(userId: number, filters: LeadFilters = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions: any[] = [eq(leads.userId, userId)];

  if (filters.search) {
    conditions.push(
      or(
        like(leads.patientName, `%${filters.search}%`),
        like(leads.phone, `%${filters.search}%`)
      )
    );
  }

  if (filters.status) {
    conditions.push(eq(leads.status, filters.status as any));
  }

  if (filters.treatmentType) {
    conditions.push(eq(leads.treatmentType, filters.treatmentType as any));
  }

  if (filters.contactDateFrom) {
    conditions.push(gte(leads.contactDate, filters.contactDateFrom));
  }

  if (filters.contactDateTo) {
    conditions.push(lte(leads.contactDate, filters.contactDateTo));
  }

  if (filters.appointmentDateFrom) {
    if (leads.appointmentDate) {
      conditions.push(gte(leads.appointmentDate, filters.appointmentDateFrom));
    }
  }

  if (filters.appointmentDateTo) {
    if (leads.appointmentDate) {
      conditions.push(lte(leads.appointmentDate, filters.appointmentDateTo));
    }
  }

  if (filters.attended !== undefined) {
    conditions.push(eq(leads.attended, filters.attended));
  }

  if (filters.treatmentClosed !== undefined) {
    conditions.push(eq(leads.treatmentClosed, filters.treatmentClosed));
  }

  const result = await db.select({ count: leads.id }).from(leads)
    .where(and(...conditions));

  return result.length > 0 ? result.length : 0;
}

export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allLeads = await db.select().from(leads)
    .where(eq(leads.userId, userId));

  const totalLeads = allLeads.length;
  const scheduled = allLeads.filter(l => l.status === "Agendado" || l.status === "A Confirmar").length;
  const attended = allLeads.filter(l => l.attended === true).length;
  const closed = allLeads.filter(l => l.treatmentClosed === true).length;
  const noInterest = allLeads.filter(l => l.status === "Sem Interesse").length;

  // Upcoming appointments (next 7 days)
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingAppointments = allLeads.filter(l => 
    l.appointmentDate && 
    l.appointmentDate >= now && 
    l.appointmentDate <= sevenDaysFromNow &&
    l.attended === false
  ).sort((a, b) => (a.appointmentDate?.getTime() || 0) - (b.appointmentDate?.getTime() || 0));

  return {
    totalLeads,
    scheduled,
    attended,
    closed,
    noInterest,
    upcomingAppointments: upcomingAppointments.slice(0, 5),
  };
}

// ============ NOTIFICATIONS QUERIES ============

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values(data);
  return result;
}

export async function getNotificationsByLead(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(notifications)
    .where(eq(notifications.leadId, leadId));

  return result;
}

export async function getPendingNotifications() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const result = await db.select().from(notifications)
    .where(and(
      eq(notifications.sent, false),
      lte(notifications.scheduledFor, now)
    ));

  return result;
}

export async function markNotificationAsSent(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.update(notifications)
    .set({
      sent: true,
      sentAt: new Date(),
    })
    .where(eq(notifications.id, notificationId));

  return result;
}
