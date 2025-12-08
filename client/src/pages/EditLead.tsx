import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Home } from "lucide-react";
import { useEffect } from "react";

const leadSchema = z.object({
  patientName: z.string().min(1, "Nome do paciente é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
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
  treatmentValue: z.number().int().positive("Valor deve ser positivo"),
  contactDate: z.string().min(1, "Data de contato é obrigatória"),
  appointmentDate: z.string().optional(),
  observations: z.string().optional(),
  status: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

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

export default function EditLead() {
  const params = useParams();
  const leadId = params?.id ? parseInt(params.id) : null;
  const [, navigate] = useLocation();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  });

  const { data: lead, isLoading: isLoadingLead } = trpc.leads.get.useQuery(
    { id: leadId! },
    { enabled: !!leadId }
  );

  const updateLeadMutation = trpc.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Lead atualizado com sucesso!");
      navigate("/leads");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar lead");
    },
  });

  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const markAttendedMutation = trpc.leads.markAttended.useMutation({
    onSuccess: () => {
      toast.success("Comparecimento registrado!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar comparecimento");
    },
  });

  const markClosedMutation = trpc.leads.markTreatmentClosed.useMutation({
    onSuccess: () => {
      toast.success("Tratamento fechado!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fechar tratamento");
    },
  });

  useEffect(() => {
    if (lead) {
      reset({
        patientName: lead.patientName,
        phone: lead.phone,
        treatmentType: lead.treatmentType as any,
        treatmentValue: lead.treatmentValue / 100,
        contactDate: new Date(lead.contactDate).toISOString().split("T")[0],
        appointmentDate: lead.appointmentDate 
          ? new Date(lead.appointmentDate).toISOString().split("T")[0]
          : "",
        observations: lead.observations || "",
        status: lead.status,
      });
    }
  }, [lead, reset]);

  const onSubmit = async (data: LeadFormData) => {
    if (!leadId) return;
    updateLeadMutation.mutate({
      id: leadId,
      data: {
        patientName: data.patientName,
        phone: data.phone,
        treatmentType: data.treatmentType,
        treatmentValue: Math.round(data.treatmentValue * 100),
        contactDate: new Date(data.contactDate),
        appointmentDate: data.appointmentDate ? new Date(data.appointmentDate) : undefined,
        observations: data.observations,
      },
    });
  };

  if (isLoadingLead) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Lead não encontrado</p>
          <Button onClick={() => navigate("/leads")} className="btn-neon">
            Voltar para Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 hover:bg-card rounded transition-colors text-primary hover:text-primary/80"
              title="Voltar ao Início"
            >
              <Home className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold neon-glow">Editar Lead</h1>
              <p className="text-muted-foreground mt-1">{lead.patientName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Status Actions */}
          <div className="card-glow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
            <div className="flex flex-wrap gap-2">
              {!lead.attended && lead.status !== "Sem Interesse" && (
                <Button
                  onClick={() => markAttendedMutation.mutate({ id: leadId!, attended: true })}
                  disabled={markAttendedMutation.isPending}
                  className="bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar como Veio
                </Button>
              )}

              {lead.status !== "Sem Interesse" && !lead.treatmentClosed && (
                <Button
                  onClick={() => updateStatusMutation.mutate({ id: leadId!, status: "Sem Interesse" })}
                  disabled={updateStatusMutation.isPending}
                  className="bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Sem Interesse
                </Button>
              )}

              {lead.attended && !lead.treatmentClosed && (
                <Button
                  onClick={() => markClosedMutation.mutate({ id: leadId!, closed: true })}
                  disabled={markClosedMutation.isPending}
                  className="bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                >
                  ✓ Marcar como Fechou
                </Button>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <div className="card-glow p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Nome do Paciente */}
              <div>
                <Label htmlFor="patientName">Nome do Paciente *</Label>
                <Input
                  id="patientName"
                  placeholder="João Silva"
                  {...register("patientName")}
                  className="mt-2 bg-input border-border"
                />
                {errors.patientName && (
                  <p className="text-red-400 text-sm mt-1">{errors.patientName.message}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  placeholder="(85) 98765-4321"
                  {...register("phone")}
                  className="mt-2 bg-input border-border"
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Tipo de Tratamento */}
              <div>
                <Label htmlFor="treatmentType">Tipo de Tratamento *</Label>
                <select
                  id="treatmentType"
                  {...register("treatmentType")}
                  className="w-full mt-2 px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {TREATMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.treatmentType && (
                  <p className="text-red-400 text-sm mt-1">{errors.treatmentType.message}</p>
                )}
              </div>

              {/* Valor do Tratamento */}
              <div>
                <Label htmlFor="treatmentValue">Valor do Tratamento (R$) *</Label>
                <Input
                  id="treatmentValue"
                  type="number"
                  placeholder="1500"
                  {...register("treatmentValue", { valueAsNumber: true })}
                  className="mt-2 bg-input border-border"
                />
                {errors.treatmentValue && (
                  <p className="text-red-400 text-sm mt-1">{errors.treatmentValue.message}</p>
                )}
              </div>

              {/* Data de Contato */}
              <div>
                <Label htmlFor="contactDate">Data de Contato *</Label>
                <Input
                  id="contactDate"
                  type="date"
                  {...register("contactDate")}
                  className="mt-2 bg-input border-border"
                />
                {errors.contactDate && (
                  <p className="text-red-400 text-sm mt-1">{errors.contactDate.message}</p>
                )}
              </div>

              {/* Data da Consulta */}
              <div>
                <Label htmlFor="appointmentDate">Data da Consulta</Label>
                <Input
                  id="appointmentDate"
                  type="date"
                  {...register("appointmentDate")}
                  className="mt-2 bg-input border-border"
                />
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  {...register("status")}
                  className="w-full mt-2 px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  placeholder="Adicione observações sobre o paciente..."
                  {...register("observations")}
                  className="mt-2 bg-input border-border min-h-24"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-border"
                  onClick={() => navigate("/leads")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 btn-neon"
                  disabled={updateLeadMutation.isPending}
                >
                  {updateLeadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
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
