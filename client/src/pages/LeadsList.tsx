import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2, Edit2, Trash2, Download, Phone, CheckCircle, XCircle, Home } from "lucide-react";

const TREATMENT_TYPES = [
  "Flexível",
  "PPR",
  "Prótese Total",
  "Implante",
  "Limpeza",
  "Clareamento",
  "Restauração",
  "Outro"
];

const STATUS_OPTIONS = [
  "A Confirmar",
  "Agendado",
  "Compareceu",
  "Fechou",
  "Sem Interesse"
];

export default function LeadsList() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [treatmentFilter, setTreatmentFilter] = useState("");
  const [attendedFilter, setAttendedFilter] = useState("");
  const [closedFilter, setClosedFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const attended = params.get("attended");
    const closed = params.get("closed");

    if (status) setStatusFilter(status);
    if (attended === "true") setAttendedFilter("true");
    if (closed === "true") setClosedFilter("true");
  }, []);

  const { data: leadsData, isLoading, refetch } = trpc.leads.list.useQuery({
    filters: {
      search: search || undefined,
      status: statusFilter || undefined,
      treatmentType: treatmentFilter || undefined,
    },
    limit: 100,
  });

  const filteredLeads = leadsData?.leads?.filter((lead) => {
    if (attendedFilter === "true" && !lead.attended) return false;
    if (closedFilter === "true" && !lead.treatmentClosed) return false;
    return true;
  }) || [];

  const deleteLeadMutation = trpc.leads.delete.useMutation({
    onSuccess: () => {
      toast.success("Lead deletado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar lead");
    },
  });

  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const markAttendedMutation = trpc.leads.markAttended.useMutation({
    onSuccess: () => {
      toast.success("Comparecimento registrado!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar comparecimento");
    },
  });

  const markClosedMutation = trpc.leads.markTreatmentClosed.useMutation({
    onSuccess: () => {
      toast.success("Tratamento fechado!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fechar tratamento");
    },
  });

  const handleExportExcel = async () => {
    if (!filteredLeads || filteredLeads.length === 0) {
      toast.error("Nenhum lead para exportar");
      return;
    }

    try {
      const headers = [
        "Nome",
        "Telefone",
        "Tipo de Tratamento",
        "Valor (R$)",
        "Data de Contato",
        "Data da Consulta",
        "Status",
        "Compareceu",
        "Fechou",
        "Observações",
      ];

      const rows = filteredLeads.map((lead: any) => [
        lead.patientName,
        lead.phone,
        lead.treatmentType,
        (lead.treatmentValue / 100).toFixed(2),
        new Date(lead.contactDate).toLocaleDateString("pt-BR"),
        lead.appointmentDate ? new Date(lead.appointmentDate).toLocaleDateString("pt-BR") : "",
        lead.status,
        lead.attended ? "Sim" : "Não",
        lead.treatmentClosed ? "Sim" : "Não",
        lead.observations || "",
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row: any) =>
          row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `leads_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Leads exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar leads");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "A Confirmar":
        return "badge-confirmed";
      case "Agendado":
        return "badge-scheduled";
      case "Compareceu":
        return "badge-attended";
      case "Fechou":
        return "badge-closed";
      case "Sem Interesse":
        return "badge-no-interest";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-card rounded transition-colors text-primary hover:text-primary/80"
                title="Voltar ao Início"
              >
                <Home className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold neon-glow">Leads</h1>
                <p className="text-muted-foreground mt-1">
                  {filteredLeads?.length || 0} leads encontrados
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="border-border"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
              <Button 
                onClick={() => navigate("/leads/new")}
                className="btn-neon"
              >
                + Novo Lead
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-card/30">
        <div className="container py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-input border-border"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos os status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={treatmentFilter}
              onChange={(e) => setTreatmentFilter(e.target.value)}
              className="px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos os tipos</option>
              {TREATMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <Button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setTreatmentFilter("");
                setAttendedFilter("");
                setClosedFilter("");
              }}
              variant="outline"
              className="border-border"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredLeads && filteredLeads.length > 0 ? (
          <div className="space-y-4">
            {filteredLeads.map((lead: any) => (
              <div
                key={lead.id}
                className="card-glow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{lead.patientName}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-muted-foreground">
                    <div>
                      <p className="text-xs">Telefone</p>
                      <a href={`tel:${lead.phone}`} className="text-primary hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </a>
                    </div>
                    <div>
                      <p className="text-xs">Tipo</p>
                      <p>{lead.treatmentType}</p>
                    </div>
                    <div>
                      <p className="text-xs">Valor</p>
                      <p className="text-primary font-semibold">R$ {(lead.treatmentValue / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs">Status</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {!lead.attended && lead.status !== "Sem Interesse" && (
                    <Button
                      size="sm"
                      onClick={() => markAttendedMutation.mutate({ id: lead.id, attended: true })}
                      disabled={markAttendedMutation.isPending}
                      className="bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Veio
                    </Button>
                  )}

                  {lead.status !== "Sem Interesse" && !lead.treatmentClosed && (
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: lead.id, status: "Sem Interesse" })}
                      disabled={updateStatusMutation.isPending}
                      className="bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Sem Interesse
                    </Button>
                  )}

                  {lead.attended && !lead.treatmentClosed && (
                    <Button
                      size="sm"
                      onClick={() => markClosedMutation.mutate({ id: lead.id, closed: true })}
                      disabled={markClosedMutation.isPending}
                      className="bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                    >
                      ✓ Fechou
                    </Button>
                  )}

                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-9"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 text-red-400 hover:bg-red-400/10"
                    onClick={() => {
                      if (confirm("Tem certeza que deseja deletar este lead?")) {
                        deleteLeadMutation.mutate({ id: lead.id });
                      }
                    }}
                    disabled={deleteLeadMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 card-glow">
            <p className="text-muted-foreground mb-4">Nenhum lead encontrado</p>
            <Button 
              onClick={() => navigate("/leads/new")}
              className="btn-neon"
            >
              Criar Primeiro Lead
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6 bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Magnata do Marketing Digital I.A</p>
          <p className="neon-glow-cyan">Sistema de Gestão de Leads</p>
        </div>
      </footer>
    </div>
  );
}
