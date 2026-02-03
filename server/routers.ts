import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createLead,
  updateLead,
  deleteLead,
  getLead,
  getLeads,
  getLeadsCount,
  getDashboardStats,
  createNotification,
  getNotificationsByLead,
  getPendingNotifications,
  markNotificationAsSent,
} from "./db";
import { TRPCError } from "@trpc/server";

// Validation schemas
const leadSchema = z.object({
  patientName: z.string().min(1, "Patient name is required"),
  phone: z.string().min(1, "Phone is required"),
  treatmentType: z.enum([
    "Flexível",
    "PPR",
    "Prótese Total",
    "Implante",
    "Limpeza",
    "Clareamento",
    "Restauração",
    "Outro"
  ]),
  treatmentValue: z.number().int().positive("Treatment value must be positive"),
  contactDate: z.date(),
  appointmentDate: z.date().optional(),
  attended: z.boolean().optional(),
  treatmentClosed: z.boolean().optional(),
  status: z.enum([
    "A Confirmar",
    "Agendado",
    "Compareceu",
    "Fechou",
    "Sem Interesse"
  ]).optional(),
  observations: z.string().optional(),
  origin: z.string().optional(),
});

const leadFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  treatmentType: z.string().optional(),
  contactDateFrom: z.date().optional(),
  contactDateTo: z.date().optional(),
  appointmentDateFrom: z.date().optional(),
  appointmentDateTo: z.date().optional(),
  attended: z.boolean().optional(),
  treatmentClosed: z.boolean().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ LEADS ROUTES ============
  leads: router({
    // Create a new lead
    create: protectedProcedure
      .input(leadSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          await createLead(ctx.user.id, {
            patientName: input.patientName,
            phone: input.phone,
            treatmentType: input.treatmentType,
            treatmentValue: input.treatmentValue,
            contactDate: input.contactDate,
            appointmentDate: input.appointmentDate,
            attended: input.attended ?? false,
            treatmentClosed: input.treatmentClosed ?? false,
            status: input.status ?? "A Confirmar",
            observations: input.observations,
            origin: input.origin,
          });
          return { success: true };
        } catch (error) {
          console.error("Error creating lead:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create lead",
          });
        }
      }),

    // Get all leads with filters
    list: protectedProcedure
      .input(z.object({
        filters: leadFiltersSchema.optional(),
        limit: z.number().int().positive().default(100),
        offset: z.number().int().nonnegative().default(0),
      }))
      .query(async ({ ctx, input }) => {
        try {
          const leadsList = await getLeads(
            ctx.user.id,
            input.filters || {},
            input.limit,
            input.offset
          );
          const count = await getLeadsCount(ctx.user.id, input.filters || {});
          
          return {
            leads: leadsList,
            total: count,
            limit: input.limit,
            offset: input.offset,
          };
        } catch (error) {
          console.error("Error fetching leads:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch leads",
          });
        }
      }),

    // Get single lead
    get: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ ctx, input }) => {
        try {
          const lead = await getLead(input.id, ctx.user.id);
          if (!lead) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Lead not found",
            });
          }
          return lead;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Error fetching lead:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch lead",
          });
        }
      }),

    // Update lead
    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        data: leadSchema.partial(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify lead belongs to user
          const lead = await getLead(input.id, ctx.user.id);
          if (!lead) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Lead not found",
            });
          }

          await updateLead(input.id, ctx.user.id, input.data);
          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Error updating lead:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update lead",
          });
        }
      }),

    // Delete lead
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify lead belongs to user
          const lead = await getLead(input.id, ctx.user.id);
          if (!lead) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Lead not found",
            });
          }

          await deleteLead(input.id, ctx.user.id);
          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Error deleting lead:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete lead",
          });
        }
      }),

    // Update lead status
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        status: z.enum([
          "A Confirmar",
          "Agendado",
          "Compareceu",
          "Fechou",
          "Sem Interesse"
        ]),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const lead = await getLead(input.id, ctx.user.id);
          if (!lead) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Lead not found",
            });
          }

          await updateLead(input.id, ctx.user.id, { status: input.status });
          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Error updating lead status:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update lead status",
          });
        }
      }),

    // Mark as attended
    markAttended: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        attended: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const lead = await getLead(input.id, ctx.user.id);
          if (!lead) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Lead not found",
            });
          }

          await updateLead(input.id, ctx.user.id, { 
            attended: input.attended,
            status: input.attended ? "Compareceu" : lead.status,
          });
          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Error marking lead as attended:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to mark lead as attended",
          });
        }
      }),

    // Mark treatment as closed
    markTreatmentClosed: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        closed: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const lead = await getLead(input.id, ctx.user.id);
          if (!lead) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Lead not found",
            });
          }

          await updateLead(input.id, ctx.user.id, { 
            treatmentClosed: input.closed,
            status: input.closed ? "Fechou" : lead.status,
          });
          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Error marking treatment as closed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to mark treatment as closed",
          });
        }
      }),

    // Get tomorrow's appointments for notifications
    getTomorrowAppointments: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const leads = await getLeads(ctx.user.id, {});
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);

          const tomorrowEnd = new Date(tomorrow);
          tomorrowEnd.setHours(23, 59, 59, 999);

          const tomorrowAppointments = leads.filter((lead: any) => {
            if (!lead.appointmentDate) return false;
            const appointmentDate = new Date(lead.appointmentDate);
            return appointmentDate >= tomorrow && appointmentDate <= tomorrowEnd;
          });

          return tomorrowAppointments;
        } catch (error) {
          console.error("Error fetching tomorrow appointments:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch tomorrow appointments",
          });
        }
      }),
  }),

  // ============ DASHBOARD ROUTES ============
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      try {
        const stats = await getDashboardStats(ctx.user.id);
        return stats;
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch dashboard stats",
        });
      }
    }),
  }),

  // ============ NOTIFICATIONS ROUTES ============
  notifications: router({
    create: protectedProcedure
      .input(z.object({
        leadId: z.number().int(),
        type: z.enum(["appointment_reminder", "follow_up", "custom"]),
        title: z.string(),
        message: z.string().optional(),
        scheduledFor: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          await createNotification({
            leadId: input.leadId,
            userId: ctx.user.id,
            type: input.type,
            title: input.title,
            message: input.message,
            scheduledFor: input.scheduledFor,
            sent: false,
          });

          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Error creating notification:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create notification",
          });
        }
      }),

    getByLead: protectedProcedure
      .input(z.object({ leadId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        try {
          const lead = await getLead(input.leadId, ctx.user.id);
          if (!lead) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Lead not found",
            });
          }

          const notifications = await getNotificationsByLead(input.leadId);
          return notifications;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("Error fetching notifications:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch notifications",
          });
        }
      }),

    getPending: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const notifications = await getPendingNotifications();
          return notifications;
        } catch (error) {
          console.error("Error fetching pending notifications:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch pending notifications",
          });
        }
      }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await markNotificationAsSent(parseInt(input.id));
          return { success: true };
        } catch (error) {
          console.error("Error marking notification as read:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to mark notification as read",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
