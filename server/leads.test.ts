import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Leads API", () => {
  let leadId: number;
  const ctx = createAuthContext(1);
  const caller = appRouter.createCaller(ctx);

  describe("Create Lead", () => {
    it("should create a new lead", async () => {
      const result = await caller.leads.create({
        patientName: "João Silva",
        phone: "(85) 98765-4321",
        treatmentType: "Prótese Total",
        treatmentValue: 150000, // R$ 1500
        contactDate: new Date("2025-12-01"),
        appointmentDate: new Date("2025-12-08"),
        observations: "Paciente interessado",
        origin: "Facebook",
      });

      expect(result.success).toBe(true);
    });

    it("should fail when creating lead without required fields", async () => {
      try {
        await caller.leads.create({
          patientName: "",
          phone: "(85) 98765-4321",
          treatmentType: "Prótese Total",
          treatmentValue: 150000,
          contactDate: new Date("2025-12-01"),
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("required");
      }
    });
  });

  describe("List Leads", () => {
    it("should list all leads for user", async () => {
      const result = await caller.leads.list({
        filters: {},
        limit: 100,
      });

      expect(result.leads).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.leads)).toBe(true);
    });

    it("should filter leads by search", async () => {
      const result = await caller.leads.list({
        filters: {
          search: "João",
        },
        limit: 100,
      });

      expect(Array.isArray(result.leads)).toBe(true);
    });

    it("should filter leads by status", async () => {
      const result = await caller.leads.list({
        filters: {
          status: "A Confirmar",
        },
        limit: 100,
      });

      expect(Array.isArray(result.leads)).toBe(true);
    });

    it("should filter leads by treatment type", async () => {
      const result = await caller.leads.list({
        filters: {
          treatmentType: "Prótese Total",
        },
        limit: 100,
      });

      expect(Array.isArray(result.leads)).toBe(true);
    });
  });

  describe("Update Lead", () => {
    it("should update lead status", async () => {
      // First create a lead
      const createResult = await caller.leads.create({
        patientName: "Maria Santos",
        phone: "(85) 99999-8888",
        treatmentType: "Implante",
        treatmentValue: 300000,
        contactDate: new Date("2025-12-02"),
      });

      expect(createResult.success).toBe(true);

      // Get the leads to find the ID
      const listResult = await caller.leads.list({
        filters: { search: "Maria" },
        limit: 100,
      });

      if (listResult.leads.length > 0) {
        const lead = listResult.leads[0];
        
        // Update status
        const updateResult = await caller.leads.updateStatus({
          id: lead.id,
          status: "Agendado",
        });

        expect(updateResult.success).toBe(true);
      }
    });

    it("should mark lead as attended", async () => {
      const listResult = await caller.leads.list({
        filters: {},
        limit: 1,
      });

      if (listResult.leads.length > 0) {
        const lead = listResult.leads[0];
        
        const result = await caller.leads.markAttended({
          id: lead.id,
          attended: true,
        });

        expect(result.success).toBe(true);
      }
    });

    it("should mark treatment as closed", async () => {
      const listResult = await caller.leads.list({
        filters: {},
        limit: 1,
      });

      if (listResult.leads.length > 0) {
        const lead = listResult.leads[0];
        
        const result = await caller.leads.markTreatmentClosed({
          id: lead.id,
          closed: true,
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe("Dashboard Stats", () => {
    it("should return dashboard statistics", async () => {
      const stats = await caller.dashboard.stats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalLeads).toBe("number");
      expect(typeof stats.scheduled).toBe("number");
      expect(typeof stats.attended).toBe("number");
      expect(typeof stats.closed).toBe("number");
      expect(typeof stats.noInterest).toBe("number");
      expect(Array.isArray(stats.upcomingAppointments)).toBe(true);
    });

    it("should show correct total count", async () => {
      const stats = await caller.dashboard.stats();
      const listResult = await caller.leads.list({
        filters: {},
        limit: 1000,
      });

      expect(stats.totalLeads).toBe(listResult.total);
    });
  });

  describe("Delete Lead", () => {
    it("should delete a lead", async () => {
      // Create a lead first
      const createResult = await caller.leads.create({
        patientName: "Test Delete",
        phone: "(85) 91234-5678",
        treatmentType: "Limpeza",
        treatmentValue: 50000,
        contactDate: new Date("2025-12-03"),
      });

      expect(createResult.success).toBe(true);

      // Get the leads to find the ID
      const listResult = await caller.leads.list({
        filters: { search: "Test Delete" },
        limit: 100,
      });

      if (listResult.leads.length > 0) {
        const lead = listResult.leads[0];
        
        // Delete it
        const deleteResult = await caller.leads.delete({
          id: lead.id,
        });

        expect(deleteResult.success).toBe(true);
      }
    });

    it("should fail to delete non-existent lead", async () => {
      try {
        await caller.leads.delete({
          id: 999999,
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("Notifications", () => {
    it("should create a notification", async () => {
      const listResult = await caller.leads.list({
        filters: {},
        limit: 1,
      });

      if (listResult.leads.length > 0) {
        const lead = listResult.leads[0];
        
        const result = await caller.notifications.create({
          leadId: lead.id,
          type: "appointment_reminder",
          title: "Test Notification",
          message: "This is a test notification",
          scheduledFor: new Date(Date.now() + 86400000), // Tomorrow
        });

        expect(result.success).toBe(true);
      }
    });

    it("should get notifications for a lead", async () => {
      const listResult = await caller.leads.list({
        filters: {},
        limit: 1,
      });

      if (listResult.leads.length > 0) {
        const lead = listResult.leads[0];
        
        const result = await caller.notifications.getByLead({
          leadId: lead.id,
        });

        expect(Array.isArray(result)).toBe(true);
      }
    });
  });
});
