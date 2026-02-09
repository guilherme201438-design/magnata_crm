import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2, Edit2, Trash2, Download, Phone, CheckCircle, XCircle } from "lucide-react";

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
      {/* Header Bar */}
      <div className="header-bar">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">MAGNATA DO CRM</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-white hover:text-gray-200 transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-gray-900 border-b-2 border-blue-700">
        <div className="container py-3">
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={() => navigate("/dashboard")}
              className="nav-button nav-button-inactive"
            >
              🏠 Dashboard
            </button>
            <button 
              onClick={() => navigate("/leads/new")}
              className="nav-button nav-button-inactive"
            >
              ➕ Novo Paciente
            </button>
            <button 
              onClick={() => navigate("/leads")}
              className="nav-button nav-button-active"
            >
              📋 Agendados
            </button>
            <button 
              onClick={() => navigate("/leads")}
              className="nav-button nav-button-inactive"
            >
              ❌ Sem Interesse
            </button>
            <button 
              onClick={() => navigate("/leads")}
              className="nav-button nav-button-inactive"
            >
              ✅ Fechados
            </button>
            <button 
              onClick={() => navigate("/leads")}
              className="nav-button nav-button-inactive"
            >
              📊 Todos
            </button>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div className="container py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Leads</h2>
            <p className="text-gray-400 text-sm">{filteredLeads?.length || 0} leads encontrados</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportExcel}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </Button>
            <Button 
              onClick={() => navigate("/leads/new")}
              className="btn-success flex items-center gap-2"
            >
              ➕ Novo Lead
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border-b-2 border-blue-700">
        <div className="container py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800 border-2 border-blue-600 text-white placeholder-gray-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border-2 border-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-3 py-2 bg-gray-800 border-2 border-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="btn-primary"
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
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredLeads && filteredLeads.length > 0 ? (
          <div className="space-y-4">
            {filteredLeads.map((lead: any) => (
              <div
                key={lead.id}
                className="card-blue p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-white">{lead.patientName}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Telefone</p>
                      <a href={`tel:${lead.phone}`} className="text-blue-400 hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </a>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Tipo</p>
                      <p className="text-white">{lead.treatmentType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Valor</p>
                      <p className="text-green-400 font-semibold">R$ {(lead.treatmentValue / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
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
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Veio
                    </Button>
                  )}
                  {!lead.treatmentClosed && lead.attended && (
                    <Button
                      size="sm"
                      onClick={() => markClosedMutation.mutate({ id: lead.id, closed: true })}
                      disabled={markClosedMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Fechou
                    </Button>
                  )}
                  {lead.status !== "Sem Interesse" && (
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: lead.id, status: "Sem Interesse" })}
                      disabled={updateStatusMutation.isPending}
                      className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Sem Interesse
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (confirm("Tem certeza que deseja deletar este lead?")) {
                        deleteLeadMutation.mutate({ id: lead.id });
                      }
                    }}
                    disabled={deleteLeadMutation.isPending}
                    className="bg-red-700 hover:bg-red-800 text-white flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Deletar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">Nenhum lead encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
