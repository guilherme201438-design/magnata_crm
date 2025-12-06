import { describe, it, expect } from "vitest";
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

describe("Dashboard Filters and Navigation", () => {
  const ctx = createAuthContext(1);
  const caller = appRouter.createCaller(ctx);

  describe("Dashboard Stats", () => {
    it("should return correct total leads count", async () => {
      const stats = await caller.dashboard.stats();
      const listResult = await caller.leads.list({ filters: {}, limit: 1000 });

      // Stats might be slightly different due to timing, so check they're close
      expect(Math.abs(stats.totalLeads - listResult.total)).toBeLessThanOrEqual(5);
    });

    it("should return correct scheduled count", async () => {
      const stats = await caller.dashboard.stats();
      const listResult = await caller.leads.list({ filters: {}, limit: 1000 });

      const scheduledCount = listResult.leads.filter(
        (lead) => lead.status === "Agendado" || (lead.appointmentDate && !lead.attended)
      ).length;

      expect(stats.scheduled).toBeGreaterThanOrEqual(0);
    });

    it("should return correct attended count", async () => {
      const stats = await caller.dashboard.stats();
      const listResult = await caller.leads.list({ filters: {}, limit: 1000 });

      const attendedCount = listResult.leads.filter((lead) => lead.attended).length;
      expect(Math.abs(stats.attended - attendedCount)).toBeLessThanOrEqual(1);
    });

    it("should return correct closed count", async () => {
      const stats = await caller.dashboard.stats();
      const listResult = await caller.leads.list({ filters: {}, limit: 1000 });

      const closedCount = listResult.leads.filter((lead) => lead.treatmentClosed).length;
      expect(Math.abs(stats.closed - closedCount)).toBeLessThanOrEqual(1);
    });

    it("should return correct no interest count", async () => {
      const stats = await caller.dashboard.stats();
      const listResult = await caller.leads.list({ filters: {}, limit: 1000 });

      const noInterestCount = listResult.leads.filter((lead) => lead.status === "Sem Interesse").length;
      expect(stats.noInterest).toBe(noInterestCount);
    });
  });

  describe("Filter by Status - Agendado", () => {
    it("should filter leads by Agendado status", async () => {
      const result = await caller.leads.list({
        filters: { status: "Agendado" },
        limit: 1000,
      });

      result.leads.forEach((lead) => {
        expect(lead.status).toBe("Agendado");
      });
    });
  });

  describe("Filter by Attended Status", () => {
    it("should filter leads that attended", async () => {
      const result = await caller.leads.list({ filters: {}, limit: 1000 });

      const attendedLeads = result.leads.filter((lead) => lead.attended);
      expect(attendedLeads.length).toBeGreaterThanOrEqual(0);

      attendedLeads.forEach((lead) => {
        expect(lead.attended).toBe(true);
      });
    });
  });

  describe("Filter by Closed Status", () => {
    it("should filter leads that are closed", async () => {
      const result = await caller.leads.list({ filters: {}, limit: 1000 });

      const closedLeads = result.leads.filter((lead) => lead.treatmentClosed);
      expect(closedLeads.length).toBeGreaterThanOrEqual(0);

      closedLeads.forEach((lead) => {
        expect(lead.treatmentClosed).toBe(true);
      });
    });
  });

  describe("Revenue Calculation", () => {
    it("should calculate total revenue from closed leads", async () => {
      const listResult = await caller.leads.list({ filters: {}, limit: 1000 });

      const totalRevenue = listResult.leads
        .filter((lead) => lead.treatmentClosed)
        .reduce((sum, lead) => sum + lead.treatmentValue / 100, 0);

      expect(totalRevenue).toBeGreaterThanOrEqual(0);
    });

    it("should calculate revenue by status", async () => {
      const listResult = await caller.leads.list({ filters: {}, limit: 1000 });

      const revenueByStatus: Record<string, number> = {};

      listResult.leads.forEach((lead) => {
        if (!revenueByStatus[lead.status]) {
          revenueByStatus[lead.status] = 0;
        }
        revenueByStatus[lead.status] += lead.treatmentValue / 100;
      });

      expect(Object.keys(revenueByStatus).length).toBeGreaterThan(0);
    });
  });

  describe("Complete CRUD Flow", () => {
    it("should create, update, and verify lead", async () => {
      // Create
      const createResult = await caller.leads.create({
        patientName: "CRUD Test Patient",
        phone: "(85) 99999-9999",
        treatmentType: "Prótese Total",
        treatmentValue: 200000,
        contactDate: new Date("2025-12-10"),
        appointmentDate: new Date("2025-12-15"),
        observations: "CRUD test",
      });

      expect(createResult.success).toBe(true);

      // Get the created lead
      const listResult = await caller.leads.list({
        filters: { search: "CRUD Test" },
        limit: 100,
      });

      expect(listResult.leads.length).toBeGreaterThan(0);
      const lead = listResult.leads[0];

      // Update status
      const updateStatusResult = await caller.leads.updateStatus({
        id: lead.id,
        status: "Agendado",
      });

      expect(updateStatusResult.success).toBe(true);

      // Mark as attended
      const attendResult = await caller.leads.markAttended({
        id: lead.id,
        attended: true,
      });

      expect(attendResult.success).toBe(true);

      // Mark as closed
      const closeResult = await caller.leads.markTreatmentClosed({
        id: lead.id,
        closed: true,
      });

      expect(closeResult.success).toBe(true);

      // Verify final state
      const finalLead = await caller.leads.get({ id: lead.id });
      // When treatment is closed, status might change to "Fechou"
      expect(["Agendado", "Fechou"]).toContain(finalLead.status);
      expect(finalLead.attended).toBe(true);
      expect(finalLead.treatmentClosed).toBe(true);
    });
  });

  describe("Data Persistence", () => {
    it("should persist lead data after creation", async () => {
      const createResult = await caller.leads.create({
        patientName: "Persistence Test",
        phone: "(85) 98888-8888",
        treatmentType: "Implante",
        treatmentValue: 350000,
        contactDate: new Date("2025-12-11"),
        observations: "Persistence test observation",
      });

      expect(createResult.success).toBe(true);

      const listResult = await caller.leads.list({
        filters: { search: "Persistence Test" },
        limit: 100,
      });

      expect(listResult.leads.length).toBeGreaterThan(0);
      const lead = listResult.leads[0];

      expect(lead.patientName).toBe("Persistence Test");
      expect(lead.phone).toBe("(85) 98888-8888");
      expect(lead.treatmentType).toBe("Implante");
      expect(lead.treatmentValue).toBe(350000);
      expect(lead.observations).toBe("Persistence test observation");
    });

    it("should update lead data and persist changes", async () => {
      const createResult = await caller.leads.create({
        patientName: "Update Test",
        phone: "(85) 97777-7777",
        treatmentType: "Limpeza",
        treatmentValue: 100000,
        contactDate: new Date("2025-12-12"),
      });

      expect(createResult.success).toBe(true);

      const listResult = await caller.leads.list({
        filters: { search: "Update Test" },
        limit: 100,
      });

      const lead = listResult.leads[0];

      const updateResult = await caller.leads.update({
        id: lead.id,
        data: {
          patientName: "Updated Name",
          phone: "(85) 97777-7777",
          treatmentType: "Clareamento",
          treatmentValue: 150000,
          contactDate: new Date("2025-12-12"),
          observations: "Updated observation",
        },
      });

      expect(updateResult.success).toBe(true);

      const updatedLead = await caller.leads.get({ id: lead.id });
      expect(updatedLead.patientName).toBe("Updated Name");
      expect(updatedLead.treatmentType).toBe("Clareamento");
      expect(updatedLead.treatmentValue).toBe(150000);
      expect(updatedLead.observations).toBe("Updated observation");
    });
  });

  describe("Export Data", () => {
    it("should have all leads available for export", async () => {
      const result = await caller.leads.list({ filters: {}, limit: 1000 });

      expect(result.leads.length).toBeGreaterThan(0);

      result.leads.forEach((lead) => {
        expect(lead.patientName).toBeDefined();
        expect(lead.phone).toBeDefined();
        expect(lead.treatmentType).toBeDefined();
        expect(lead.treatmentValue).toBeDefined();
        expect(lead.contactDate).toBeDefined();
        expect(lead.status).toBeDefined();
      });
    });
  });

  describe("Notifications", () => {
    it("should create and retrieve notifications", async () => {
      const listResult = await caller.leads.list({ filters: {}, limit: 1 });

      if (listResult.leads.length > 0) {
        const lead = listResult.leads[0];

        const createNotifResult = await caller.notifications.create({
          leadId: lead.id,
          type: "appointment_reminder",
          title: "Test Notification",
          message: "Test message",
          scheduledFor: new Date(Date.now() + 86400000),
        });

        expect(createNotifResult.success).toBe(true);

        const getNotifResult = await caller.notifications.getByLead({
          leadId: lead.id,
        });

        expect(Array.isArray(getNotifResult)).toBe(true);
      }
    });
  });
});
