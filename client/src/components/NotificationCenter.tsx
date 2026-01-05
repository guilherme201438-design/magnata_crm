import { useEffect, useState } from "react";
import { X, Bell, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export interface Notification {
  id: string;
  leadId: number;
  patientName: string;
  treatmentType: string;
  appointmentDate: Date;
  message: string;
  createdAt: Date;
  read: boolean;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch pending notifications
  const { data: pendingNotifications, refetch } = trpc.notifications.getPending.useQuery(
    undefined,
    {
      refetchInterval: 60000, // Check every minute
    }
  );

  // Mark notification as read
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Update notifications when data changes
  useEffect(() => {
    if (pendingNotifications) {
      const formattedNotifications = pendingNotifications.map((n: any, index: number) => {
        const appointmentDate = typeof n.appointmentDate === 'string' 
          ? new Date(n.appointmentDate) 
          : n.appointmentDate;
        
        return {
          id: `${n.leadId}-${n.appointmentDate}-${index}`,
          leadId: n.leadId,
          patientName: n.patientName || 'Paciente',
          treatmentType: n.treatmentType || 'Consulta',
          appointmentDate: appointmentDate,
          message: `Consulta de ${n.treatmentType} com ${n.patientName} amanhã!`,
          createdAt: new Date(),
          read: false,
        };
      });
      setNotifications(formattedNotifications);
      setUnreadCount(pendingNotifications.length);
    }
  }, [pendingNotifications, unreadCount]);

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate({ id: notificationId });
    setNotifications(notifications.filter((n) => n.id !== notificationId));
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* Notification Bell Icon */}
      <div className="fixed top-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-3 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors border border-primary/50"
        >
          <Bell className="w-6 h-6 text-primary" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center neon-glow">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <div className="fixed top-20 right-6 w-96 max-h-96 bg-card border-2 border-primary/50 rounded-lg shadow-2xl z-50 overflow-y-auto neon-glow">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-bold text-primary">Notificações</h3>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-card-foreground/10 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 hover:bg-card-foreground/5 transition-colors border-l-4 border-primary"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{notification.patientName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Consulta de <span className="text-primary font-semibold">{notification.treatmentType}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      📅 {notification.appointmentDate instanceof Date && !isNaN(notification.appointmentDate.getTime())
                        ? notification.appointmentDate.toLocaleDateString("pt-BR")
                        : 'Data inválida'}
                    </p>
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="mt-3 text-xs px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded transition-colors"
                    >
                      Marcar como lido
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
