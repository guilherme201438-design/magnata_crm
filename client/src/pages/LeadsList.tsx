import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Edit2, Trash2, Download, Phone } from "lucide-react";
import { Link } from "wouter";

export default function LeadsList() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [treatmentFilter, setTreatmentFilter] = useState("");

  const { data: leadsData, isLoading, refetch } = trpc.leads.list.useQuery({
    filters: {
      search: search || undefined,
      status: statusFilter || undefined,
      treatmentType: treatmentFilter || undefined,
    },
    limit: 100,
  });

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
    if (!leadsData?.leads || leadsData.leads.length === 0) {
      toast.error("Nenhum lead para exportar");
      return;
    }

    try {
      // Create CSV content
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

      const rows = leadsData.leads.map((lead) => [
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
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      // Download CSV
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
            <div>
              <h1 className="text-3xl font-bold neon-glow">Leads</h1>
              <p className="text-muted-foreground mt-1">
                {leadsData?.total || 0} leads cadastrados
              </p>
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
              <Link href="/leads/new">
                <Button className="btn-neon">+ Novo Lead</Button>
              </Link>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="A Confirmar">A Confirmar</SelectItem>
                <SelectItem value="Agendado">Agendado</SelectItem>
                <SelectItem value="Compareceu">Compareceu</SelectItem>
                <SelectItem value="Fechou">Fechou</SelectItem>
                <SelectItem value="Sem Interesse">Sem Interesse</SelectItem>
              </SelectContent>
            </Select>
            <Select value={treatmentFilter} onValueChange={setTreatmentFilter}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Tipo de tratamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                <SelectItem value="Flexível">Flexível</SelectItem>
                <SelectItem value="PPR">PPR</SelectItem>
                <SelectItem value="Prótese Total">Prótese Total</SelectItem>
                <SelectItem value="Implante">Implante</SelectItem>
                <SelectItem value="Limpeza">Limpeza</SelectItem>
                <SelectItem value="Clareamento">Clareamento</SelectItem>
                <SelectItem value="Restauração">Restauração</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setTreatmentFilter("");
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
        ) : leadsData?.leads && leadsData.leads.length > 0 ? (
          <div className="overflow-x-auto card-glow">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">Nome</th>
                  <th className="text-left py-4 px-4 font-semibold">Telefone</th>
                  <th className="text-left py-4 px-4 font-semibold">Tipo</th>
                  <th className="text-left py-4 px-4 font-semibold">Valor</th>
                  <th className="text-left py-4 px-4 font-semibold">Contato</th>
                  <th className="text-left py-4 px-4 font-semibold">Consulta</th>
                  <th className="text-left py-4 px-4 font-semibold">Status</th>
                  <th className="text-left py-4 px-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {leadsData.leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border/50 hover:bg-card/50 transition-colors"
                  >
                    <td className="py-4 px-4">{lead.patientName}</td>
                    <td className="py-4 px-4">
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Phone className="w-4 h-4" />
                        {lead.phone}
                      </a>
                    </td>
                    <td className="py-4 px-4 text-sm">{lead.treatmentType}</td>
                    <td className="py-4 px-4">R$ {(lead.treatmentValue / 100).toFixed(2)}</td>
                    <td className="py-4 px-4 text-sm">
                      {new Date(lead.contactDate).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-4 px-4 text-sm">
                      {lead.appointmentDate
                        ? new Date(lead.appointmentDate).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <Link href={`/leads/${lead.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-400 hover:bg-red-400/10"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 card-glow">
            <p className="text-muted-foreground mb-4">Nenhum lead encontrado</p>
            <Link href="/leads/new">
              <Button className="btn-neon">Criar Primeiro Lead</Button>
            </Link>
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
