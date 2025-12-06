import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Leads/Pacientes table for CRM
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Reference to user who created/owns this lead
  
  // Basic patient info
  patientName: varchar("patientName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  
  // Treatment info
  treatmentType: mysqlEnum("treatmentType", [
    "Flexível",
    "PPR",
    "Prótese Total",
    "Implante",
    "Limpeza",
    "Clareamento",
    "Restauração",
    "Outro"
  ]).notNull(),
  treatmentValue: int("treatmentValue").notNull(), // Store as cents to avoid decimal precision issues
  
  // Contact and appointment dates
  contactDate: timestamp("contactDate").notNull(), // Date patient first contacted
  appointmentDate: timestamp("appointmentDate"), // Scheduled appointment date
  
  // Status tracking
  attended: boolean("attended").default(false), // Did patient show up?
  treatmentClosed: boolean("treatmentClosed").default(false), // Did patient complete treatment?
  
  // Status enum for more granular tracking
  status: mysqlEnum("status", [
    "A Confirmar",
    "Agendado",
    "Compareceu",
    "Fechou",
    "Sem Interesse"
  ]).default("A Confirmar").notNull(),
  
  // General notes
  observations: text("observations"),
  
  // Source/origin of lead
  origin: varchar("origin", { length: 100 }),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Notifications table to track sent notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  userId: int("userId").notNull(),
  
  // Notification type
  type: mysqlEnum("type", [
    "appointment_reminder", // 1 day before appointment
    "follow_up",
    "custom"
  ]).notNull(),
  
  // Notification status
  sent: boolean("sent").default(false),
  sentAt: timestamp("sentAt"),
  
  // Notification content
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  scheduledFor: timestamp("scheduledFor"), // When to send the notification
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
