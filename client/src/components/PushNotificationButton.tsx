import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function PushNotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const { data: tomorrowAppointments, isLoading } =
    trpc.leads.getTomorrowAppointments.useQuery(undefined, {
      enabled: isOpen,
    });

  useEffect(() => {
    if (tomorrowAppointments && tomorrowAppointments.length > 0) {
      setNotificationCount(tomorrowAppointments.length);
    }
  }, [tomorrowAppointments]);

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-purple-400 hover:text-purple-300 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-6 h-6" />
        {notificationCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {notificationCount > 99 ? "99+" : notificationCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-900 border border-purple-500 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-gray-900 border-b border-purple-500 p-4 flex justify-between items-center">
            <h3 className="text-lg font-bold text-purple-400">
              Consultas de Amanhã
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
              </div>
            ) : tomorrowAppointments && tomorrowAppointments.length > 0 ? (
              <div className="space-y-3">
                {tomorrowAppointments.map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className="bg-gray-800 border border-purple-500 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-white">
                          {appointment.patientName}
                        </p>
                        <p className="text-sm text-purple-300">
                          {appointment.treatmentType}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          📅 {formatDate(appointment.appointmentDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-400">
                          R$ {(appointment.treatmentValue / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">Nenhuma consulta agendada para amanhã</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
