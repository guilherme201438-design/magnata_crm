import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

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
  origin: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function NewLead() {
  const [, navigate] = useLocation();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  });

  const createLeadMutation = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Lead criado com sucesso!");
      navigate("/leads");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar lead");
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    createLeadMutation.mutate({
      ...data,
      treatmentValue: Math.round(data.treatmentValue * 100), // Convert to cents
      contactDate: new Date(data.contactDate),
      appointmentDate: data.appointmentDate ? new Date(data.appointmentDate) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 hover:bg-card rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold neon-glow">Novo Lead</h1>
              <p className="text-muted-foreground mt-1">Cadastre um novo paciente/lead</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container py-8">
        <div className="max-w-2xl mx-auto card-glow">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Patient Name */}
            <div className="space-y-2">
              <Label htmlFor="patientName">Nome do Paciente *</Label>
              <Input
                id="patientName"
                placeholder="João Silva"
                {...register("patientName")}
                className="bg-input border-border"
              />
              {errors.patientName && (
                <p className="text-red-400 text-sm">{errors.patientName.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                placeholder="(85) 98765-4321"
                {...register("phone")}
                className="bg-input border-border"
              />
              {errors.phone && (
                <p className="text-red-400 text-sm">{errors.phone.message}</p>
              )}
            </div>

             // Treatment Type */
            <div className="space-y-2">
              <Label htmlFor="treatmentType">Tipo de Tratamento *</Label>
              <Select value={watch("treatmentType") || ""} onValueChange={(value) => setValue("treatmentType", value as any)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecione o tipo de tratamento" />
                </SelectTrigger>
                <SelectContent>
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
              {errors.treatmentType && (
                <p className="text-red-400 text-sm">{errors.treatmentType.message}</p>
              )}
            </div>

            {/* Treatment Value */}
            <div className="space-y-2">
              <Label htmlFor="treatmentValue">Valor do Tratamento (R$) *</Label>
              <Input
                id="treatmentValue"
                type="number"
                placeholder="1500"
                {...register("treatmentValue", { valueAsNumber: true })}
                className="bg-input border-border"
              />
              {errors.treatmentValue && (
                <p className="text-red-400 text-sm">{errors.treatmentValue.message}</p>
              )}
            </div>

            {/* Contact Date */}
            <div className="space-y-2">
              <Label htmlFor="contactDate">Data de Contato *</Label>
              <Input
                id="contactDate"
                type="date"
                {...register("contactDate")}
                className="bg-input border-border"
              />
              {errors.contactDate && (
                <p className="text-red-400 text-sm">{errors.contactDate.message}</p>
              )}
            </div>

            {/* Appointment Date */}
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Data da Consulta</Label>
              <Input
                id="appointmentDate"
                type="date"
                {...register("appointmentDate")}
                className="bg-input border-border"
              />
              {errors.appointmentDate && (
                <p className="text-red-400 text-sm">{errors.appointmentDate.message}</p>
              )}
            </div>

            {/* Origin */}
            <div className="space-y-2">
              <Label htmlFor="origin">Origem do Lead</Label>
              <Input
                id="origin"
                placeholder="Facebook, Google, Indicação, etc"
                {...register("origin")}
                className="bg-input border-border"
              />
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                placeholder="Adicione observações sobre o paciente..."
                {...register("observations")}
                className="bg-input border-border min-h-24"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="flex-1 border-border"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createLeadMutation.isPending}
                className="btn-neon flex-1"
              >
                {createLeadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Lead"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
