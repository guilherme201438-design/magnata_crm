import { useState, useEffect } from "react";
import { Bell, X, Calendar, Clock, User, Building2, Phone } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function FloatingNotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: tomorrowAppointments, isLoading } =
    trpc.leads.getTomorrowAppointments.useQuery(undefined, {
      refetchInterval: 60000, // Refetch every minute
    });

  const appointments = tomorrowAppointments || [];
  const hasAppointments = appointments.length > 0;

  const handleWhatsAppClick = (appointment: any) => {
    const date = new Date(appointment.appointmentDate);
    const time = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = date.toLocaleDateString("pt-BR");

    const message = `Olá ${appointment.patientName}! 👋\n\n📋 Lembrete de Consulta\n\nPaciente: ${appointment.patientName}\nData: ${dateStr}\nHorário: ${time}\nProcedimento: ${appointment.treatmentType}\n\n📍 Endereço:\nR. Guilherme Rocha 218\nEdifício Jalcy Metrópole, Sala 902\n\nAguardamos sua presença! 😊`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${appointment.phone.replace(/\D/g, "")}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % appointments.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? appointments.length - 1 : prev - 1
    );
  };

  const currentAppointment = appointments[currentIndex];

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!hasAppointments) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 flex-col"
        aria-label="Notificações"
      >
        <Bell className="w-6 h-6 text-white" />
        <span className="text-xs text-white font-bold mt-1">
          {appointments.length}
        </span>
      </button>

      {/* Notification Panel */}
      {isOpen && currentAppointment && (
        <div className="fixed bottom-32 right-8 w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6" />
                <h3 className="text-lg font-bold">Lembrete de Consulta</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-purple-700 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-purple-100">
              {currentIndex + 1} de {appointments.length} agendamentos
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Patient Name */}
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Paciente</p>
                <p className="font-semibold text-foreground">
                  {currentAppointment.patientName}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-semibold text-foreground">
                  {currentAppointment.appointmentDate && formatDate(currentAppointment.appointmentDate)}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Horário</p>
                <p className="font-semibold text-foreground">
                  {currentAppointment.appointmentDate && formatTime(currentAppointment.appointmentDate)}
                </p>
              </div>
            </div>

            {/* Procedure */}
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Procedimento</p>
                <p className="font-semibold text-foreground">
                  {currentAppointment.treatmentType}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-semibold text-foreground">
                  {currentAppointment.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Dots */}
          {appointments.length > 1 && (
            <div className="flex justify-center gap-2 py-4">
              {appointments.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-purple-500 w-6"
                      : "bg-border hover:bg-muted-foreground"
                  }`}
                  aria-label={`Go to appointment ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Navigation Buttons */}
          {appointments.length > 1 && (
            <div className="flex justify-between px-6 pb-4">
              <button
                onClick={handlePrev}
                className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 flex items-center justify-center transition-colors"
              >
                ‹
              </button>
              <button
                onClick={handleNext}
                className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 flex items-center justify-center transition-colors"
              >
                ›
              </button>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={() => handleWhatsAppClick(currentAppointment)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-4 hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Entendi
          </button>
        </div>
      )}
    </>
  );
}
