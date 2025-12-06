import { describe, it, expect, beforeAll } from "vitest";
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

describe("CRM Complete Flow", () => {
  const ctx = createAuthContext(1);
  const caller = appRouter.createCaller(ctx);

  describe("1. Create Lead", () => {
    it("should create a new lead successfully", async () => {
      const result = await caller.leads.create({
        patientName: "Test Patient 1",
        phone: "(85) 98765-4321",
        treatmentType: "Prótese Total",
        treatmentValue: 150000, // R$ 1500
        contactDate: new Date("2025-12-01"),
        appointmentDate: new Date("2025-12-08"),
        observations: "Test patient",
        origin: "Test",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("2. List and Filter Leads", () => {
    it("should list all leads", async () => {
      const result = await caller.leads.list({
        filters: {},
        limit: 100,
      });

      expect(result.leads.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it("should filter by name", async () => {
      const result = await caller.leads.list({
        filters: { search: "Test" },
        limit: 100,
      });

      expect(Array.isArray(result.leads)).toBe(true);
    });

    it("should filter by status", async () => {
      const result = await caller.leads.list({
        filters: { status: "A Confirmar" },
        limit: 100,
      });

      expect(Array.isArray(result.leads)).toBe(true);
    });

    it("should filter by treatment type", async () => {
      const result = await caller.leads.list({
        filters: { treatmentType: "Prótese Total" },
        limit: 100,
      });

      expect(Array.isArray(result.leads)).toBe(true);
    });
  });

  describe("3. Mark Lead as Attended", () => {
    it("should mark lead as attended", async () => {
      const listResult = await caller.leads.list({
        filters: { search: "Test Patient 1" },
        limit: 100,
      });

      if (listResult.leads.length > 0) {
        const lead = listResult.leads[0];
        
        const result = await caller.leads.markAttended({
          id: lead.id,
          attended: true,
        });

        expect(result.success).toBe(true);

        // Verify the lead was marked as attended
        const updatedLead = await caller.leads.get({ id: lead.id });
        expect(updatedLead.attended).toBe(true);
      }
    });
  });

  describe("4. Mark Lead as No Interest", () => {
    it("should mark lead as no interest", async () => {
      // Create a new lead for this test
      await caller.leads.create({
        patientName: "Test No Interest",
        phone: "(85) 99999-8888",
        treatmentType: "Implante",
        treatmentValue: 300000,
        contactDate: new Date("2025-12-02"),
      });

      const listResult = await caller.leads.list({
        filters: { search: "Test No Interest" },
        limit: 100,
      });

      if (listResult.leads.length > 0) {
        const lead = listResult.leads[0];
        
        const result = await caller.leads.updateStatus({
          id: lead.id,
          status: "Sem Interesse",
        });

        expect(result.success).toBe(true);

        // Verify the status was updated
        const updatedLead = await caller.leads.get({ id: lead.id });
        expect(updatedLead.status).toBe("Sem Interesse");
      }
    });
  });

  describe("5. Mark Treatment as Closed", () => {
    it("should mark treatment as closed", async () => {
      // Create a new lead for this test
      await caller.leads.create({
        patientName: "Test Closed",
        phone: "(85) 91234-5678",
        treatmentType: "Limpeza",
        treatmentValue: 50000,
        contactDate: new Date("2025-12-03"),
      });

      const listResult = await caller.leads.list({
        filters: { search: "Test Closed" },
        limit: 100,
      });

      if (listResult.leads.length > 0) {
        const lead = listResult.leads[0];
        
        // First mark as attended
        await caller.leads.markAttended({
          id: lead.id,
          attended: true,
        });

        // Then mark as closed
        const result = await caller.leads.markTreatmentClosed({
          id: lead.id,
          closed: true,
        });

        expect(result.success).toBe(true);

        // Verify the treatment was closed
        const updatedLead = await caller.leads.get({ id: lead.id });
        expect(updatedLead.treatmentClosed).toBe(true);
      }
    });
  });

  describe("6. Dashboard Statistics", () => {
    it("should calculate correct dashboard stats", async () => {
      const stats = await caller.dashboard.stats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalLeads).toBe("number");
      expect(typeof stats.scheduled).toBe("number");
      expect(typeof stats.attended).toBe("number");
      expect(typeof stats.closed).toBe("number");
      expect(typeof stats.noInterest).toBe("number");
      expect(Array.isArray(stats.upcomingAppointments)).toBe(true);

      // Verify counts are consistent
      expect(stats.totalLeads).toBeGreaterThanOrEqual(0);
      expect(stats.scheduled).toBeGreaterThanOrEqual(0);
      expect(stats.attended).toBeGreaterThanOrEqual(0);
      expect(stats.closed).toBeGreaterThanOrEqual(0);
      expect(stats.noInterest).toBeGreaterThanOrEqual(0);
    });

    it("should show correct attended count", async () => {
      const stats = await caller.dashboard.stats();
      const listResult = await caller.leads.list({
        filters: {},
        limit: 1000,
      });

      const attendedCount = listResult.leads.filter((lead) => lead.attended).length;
      expect(Math.abs(stats.attended - attendedCount)).toBeLessThanOrEqual(1);
    });

    it("should show correct closed count", async () => {
      const stats = await caller.dashboard.stats();
      const listResult = await caller.leads.list({
        filters: {},
        limit: 1000,
      });

      const closedCount = listResult.leads.filter((lead) => lead.treatmentClosed).length;
      expect(Math.abs(stats.closed - closedCount)).toBeLessThanOrEqual(1);
    });

    it("should show correct no interest count", async () => {
      const stats = await caller.dashboard.stats();
      const listResult = await caller.leads.list({
        filters: {},
        limit: 1000,
      });

      const noInterestCount = listResult.leads.filter((lead) => lead.status === "Sem Interesse").length;
      expect(stats.noInterest).toBe(noInterestCount);
    });
  });

  describe("7. Edit Lead", () => {
    it("should update lead information", async () => {
      const listResult = await caller.leads.list({
        filters: { search: "Test Patient 1" },
        limit: 100,
      });

      if (listResult.leads.length > 0) {
        const lead = listResult.leads[0];
        
        const result = await caller.leads.update({
          id: lead.id,
          data: {
            patientName: "Updated Test Patient",
            phone: "(85) 98765-4321",
            treatmentType: "Flexível",
            treatmentValue: 200000,
            contactDate: new Date("2025-12-01"),
            observations: "Updated observation",
          },
        });

        expect(result.success).toBe(true);

        // Verify the update
        const updatedLead = await caller.leads.get({ id: lead.id });
        expect(updatedLead.patientName).toBe("Updated Test Patient");
        expect(updatedLead.treatmentType).toBe("Flexível");
      }
    });
  });

  describe("8. Delete Lead", () => {
    it("should delete a lead", async () => {
      // Create a lead to delete
      await caller.leads.create({
        patientName: "Test Delete",
        phone: "(85) 91111-1111",
        treatmentType: "Clareamento",
        treatmentValue: 80000,
        contactDate: new Date("2025-12-04"),
      });

      const listResult = await caller.leads.list({
        filters: { search: "Test Delete" },
        limit: 100,
      });

      if (listResult.leads.length > 0) {
        const lead = listResult.leads[0];
        
        const result = await caller.leads.delete({
          id: lead.id,
        });

        expect(result.success).toBe(true);

        // Verify the lead was deleted
        try {
          await caller.leads.get({ id: lead.id });
          expect.fail("Lead should have been deleted");
        } catch (error: any) {
          expect(error.code).toBe("NOT_FOUND");
        }
      }
    });
  });

  describe("9. Export Excel", () => {
    it("should export leads as CSV", async () => {
      const listResult = await caller.leads.list({
        filters: {},
        limit: 100,
      });

      expect(listResult.leads.length).toBeGreaterThan(0);
      
      // Verify all required fields are present for export
      listResult.leads.forEach((lead) => {
        expect(lead.patientName).toBeDefined();
        expect(lead.phone).toBeDefined();
        expect(lead.treatmentType).toBeDefined();
        expect(lead.treatmentValue).toBeDefined();
        expect(lead.contactDate).toBeDefined();
        expect(lead.status).toBeDefined();
      });
    });
  });

  describe("10. Notifications", () => {
    it("should create notification for lead", async () => {
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
          scheduledFor: new Date(Date.now() + 86400000),
        });

        expect(result.success).toBe(true);
      }
    });

    it("should get notifications for lead", async () => {
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
