import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function NewLead() {
  const [, navigate] = useLocation();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      treatmentType: "Flexível",
      origin: "Outro",
    }
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
      treatmentValue: Math.round(data.treatmentValue * 100),
      contactDate: new Date(data.contactDate),
      appointmentDate: data.appointmentDate ? new Date(data.appointmentDate) : undefined,
    });
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
            title="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
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
              className="nav-button nav-button-active"
            >
              ➕ Novo Paciente
            </button>
            <button 
              onClick={() => navigate("/leads")}
              className="nav-button nav-button-inactive"
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

      {/* Form */}
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Novo Lead</h2>
          <div className="card-blue p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Nome do Paciente */}
              <div>
                <Label htmlFor="patientName" className="text-white font-semibold">Nome do Paciente *</Label>
                <Input
                  id="patientName"
                  placeholder="Ex: João Silva"
                  {...register("patientName")}
                  className="mt-2 bg-gray-800 border-2 border-blue-600 text-white placeholder-gray-500"
                />
                {errors.patientName && (
                  <p className="text-red-400 text-sm mt-1">{errors.patientName.message}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <Label htmlFor="phone" className="text-white font-semibold">Telefone *</Label>
                <Input
                  id="phone"
                  placeholder="Ex: (85) 98765-4321"
                  {...register("phone")}
                  className="mt-2 bg-gray-800 border-2 border-blue-600 text-white placeholder-gray-500"
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Tipo de Tratamento */}
              <div>
                <Label htmlFor="treatmentType" className="text-white font-semibold">Tipo de Tratamento *</Label>
                <select
                  id="treatmentType"
                  {...register("treatmentType")}
                  className="w-full mt-2 px-3 py-2 bg-gray-800 border-2 border-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <Label htmlFor="treatmentValue" className="text-white font-semibold">Valor do Tratamento (R$) *</Label>
                <Input
                  id="treatmentValue"
                  type="number"
                  placeholder="Ex: 1500"
                  {...register("treatmentValue", { valueAsNumber: true })}
                  className="mt-2 bg-gray-800 border-2 border-blue-600 text-white placeholder-gray-500"
                />
                {errors.treatmentValue && (
                  <p className="text-red-400 text-sm mt-1">{errors.treatmentValue.message}</p>
                )}
              </div>

              {/* Data de Contato */}
              <div>
                <Label htmlFor="contactDate" className="text-white font-semibold">Data de Contato *</Label>
                <Input
                  id="contactDate"
                  type="date"
                  {...register("contactDate")}
                  className="mt-2 bg-gray-800 border-2 border-blue-600 text-white"
                />
                {errors.contactDate && (
                  <p className="text-red-400 text-sm mt-1">{errors.contactDate.message}</p>
                )}
              </div>

              {/* Data da Consulta */}
              <div>
                <Label htmlFor="appointmentDate" className="text-white font-semibold">Data da Consulta</Label>
                <Input
                  id="appointmentDate"
                  type="date"
                  {...register("appointmentDate")}
                  className="mt-2 bg-gray-800 border-2 border-blue-600 text-white"
                />
              </div>

              {/* Origem */}
              <div>
                <Label htmlFor="origin" className="text-white font-semibold">Origem do Lead</Label>
                <select
                  id="origin"
                  {...register("origin")}
                  className="w-full mt-2 px-3 py-2 bg-gray-800 border-2 border-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Google">Google</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="observations" className="text-white font-semibold">Observações</Label>
                <Textarea
                  id="observations"
                  placeholder="Adicione observações sobre o paciente..."
                  {...register("observations")}
                  className="mt-2 bg-gray-800 border-2 border-blue-600 text-white placeholder-gray-500 min-h-24"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  className="flex-1 btn-danger"
                  onClick={() => navigate("/leads")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 btn-success"
                  disabled={createLeadMutation.isPending}
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
    </div>
  );
}
