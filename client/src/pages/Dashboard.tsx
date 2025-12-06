import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, Calendar, CheckCircle, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusColor = (value: number, total: number) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    if (percentage >= 70) return "text-green-400";
    if (percentage >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold neon-glow">Magnata do Marketing Digital</h1>
              <p className="text-muted-foreground mt-1">Gestão Inteligente de Leads</p>
            </div>
            <Link href="/leads/new">
              <Button className="btn-neon">+ Novo Lead</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8 p-6 bg-card border border-border rounded-lg">
          <p className="text-lg">
            Bem-vindo, <span className="font-semibold text-primary neon-glow">{user?.name}</span>! 
            Gerencie seus leads com inteligência.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Leads */}
          <div className="card-glow scale-in hover:scale-105 transition-transform">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total de Leads</p>
                <p className="text-3xl font-bold text-primary">{stats?.totalLeads || 0}</p>
              </div>
              <Users className="w-8 h-8 text-primary/50" />
            </div>
          </div>

          {/* Scheduled */}
          <div className="card-glow scale-in hover:scale-105 transition-transform">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Agendados</p>
                <p className="text-3xl font-bold text-blue-400">{stats?.scheduled || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400/50" />
            </div>
          </div>

          {/* Attended */}
          <div className="card-glow scale-in hover:scale-105 transition-transform">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Compareceram</p>
                <p className={`text-3xl font-bold ${getStatusColor(stats?.attended || 0, stats?.totalLeads || 1)}`}>
                  {stats?.attended || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400/50" />
            </div>
          </div>

          {/* Closed */}
          <div className="card-glow scale-in hover:scale-105 transition-transform">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Fechados</p>
                <p className={`text-3xl font-bold ${getStatusColor(stats?.closed || 0, stats?.totalLeads || 1)}`}>
                  {stats?.closed || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400/50" />
            </div>
          </div>

          {/* No Interest */}
          <div className="card-glow scale-in hover:scale-105 transition-transform">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Sem Interesse</p>
                <p className="text-3xl font-bold text-red-400">{stats?.noInterest || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400/50" />
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="card-glow">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Próximas Consultas
          </h2>
          
          {stats?.upcomingAppointments && stats.upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-card/50 rounded border border-border/50 hover:border-primary/50 transition-colors">
                  <div>
                    <p className="font-semibold">{appointment.patientName}</p>
                    <p className="text-sm text-muted-foreground">{appointment.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">
                      {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">{appointment.treatmentType}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma consulta agendada nos próximos 7 dias</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/leads">
            <Button variant="outline" className="w-full h-12 border-primary/50 hover:bg-primary/10">
              Ver Todos os Leads
            </Button>
          </Link>
          <Link href="/leads/new">
            <Button className="btn-neon w-full h-12">
              Novo Lead
            </Button>
          </Link>
          <Link href="/leads">
            <Button variant="outline" className="w-full h-12 border-primary/50 hover:bg-primary/10">
              Exportar Excel
            </Button>
          </Link>
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
