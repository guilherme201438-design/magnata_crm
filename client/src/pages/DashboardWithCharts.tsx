import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Users, Calendar, CheckCircle, TrendingUp, Loader2 } from "lucide-react";
import { MagnataLogo } from "@/components/MagnataLogo";
import { NotificationCenter } from "@/components/NotificationCenter";
import PushNotificationButton from "@/components/PushNotificationButton";
import { useLocation } from "wouter";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

export default function DashboardWithCharts() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: leadsData } = trpc.leads.list.useQuery({
    filters: {},
    limit: 1000,
  });

  // Calculate revenue by status
  const revenueByStatus = useMemo(() => {
    if (!leadsData?.leads) return [];

    const data: Record<string, number> = {
      "Fechou": 0,
      "Compareceu": 0,
      "Agendado": 0,
      "A Confirmar": 0,
      "Sem Interesse": 0,
    };

    leadsData.leads.forEach((lead) => {
      if (data[lead.status] !== undefined) {
        data[lead.status] += lead.treatmentValue / 100;
      }
    });

    return Object.entries(data)
      .map(([status, value]) => ({
        name: status,
        value: parseFloat(value.toFixed(2)),
      }))
      .filter((item) => item.value > 0);
  }, [leadsData]);

  // Calculate conversion funnel
  const conversionFunnel = useMemo(() => {
    if (!stats) return [];

    return [
      { name: "Total de Leads", value: stats.totalLeads },
      { name: "Agendados", value: stats.scheduled },
      { name: "Compareceram", value: stats.attended },
      { name: "Fechados", value: stats.closed },
    ];
  }, [stats]);

  // Calculate total revenue
  const totalRevenue = useMemo(() => {
    if (!leadsData?.leads) return 0;
    return leadsData.leads
      .filter((lead) => lead.treatmentClosed)
      .reduce((sum, lead) => sum + lead.treatmentValue / 100, 0);
  }, [leadsData]);

  // Revenue by treatment type
  const revenueByTreatment = useMemo(() => {
    if (!leadsData?.leads) return [];

    const data: Record<string, number> = {};

    leadsData.leads
      .filter((lead) => lead.treatmentClosed)
      .forEach((lead) => {
        if (!data[lead.treatmentType]) {
          data[lead.treatmentType] = 0;
        }
        data[lead.treatmentType] += lead.treatmentValue / 100;
      });

    return Object.entries(data)
      .map(([type, value]) => ({
        name: type,
        value: parseFloat(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [leadsData]);

  const COLORS = ["#9333ea", "#3b82f6", "#22d3ee", "#10b981", "#f59e0b", "#ef4444"];

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

  // Handle card clicks with proper navigation
  const handleCardClick = (filter: string) => {
    const params = new URLSearchParams();
    if (filter === "all") {
      navigate("/leads");
    } else if (filter === "scheduled") {
      params.set("status", "Agendado");
      navigate(`/leads?${params.toString()}`);
    } else if (filter === "attended") {
      params.set("attended", "true");
      navigate(`/leads?${params.toString()}`);
    } else if (filter === "closed") {
      params.set("closed", "true");
      navigate(`/leads?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NotificationCenter />
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <MagnataLogo />
              <div>
                <h1 className="text-3xl font-bold neon-glow">CRM PREMIUM</h1>
                <p className="text-muted-foreground mt-1">Magnata do Marketing Digital - Dashboard com Análise de Faturamento</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <PushNotificationButton />
              <Button onClick={() => navigate("/leads/new")} className="btn-neon">
                + Novo Lead
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8 p-6 bg-card border border-border rounded-lg">
          <p className="text-lg">
            Bem-vindo, <span className="font-semibold text-primary neon-glow">{user?.name}</span>! 
            Acompanhe o desempenho dos seus leads e faturamento.
          </p>
        </div>

        {/* Stats Grid - Clickable Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Leads */}
          <button
            onClick={() => handleCardClick("all")}
            className="card-glow scale-in hover:scale-105 transition-transform cursor-pointer text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total de Leads</p>
                <p className="text-3xl font-bold text-primary">{stats?.totalLeads || 0}</p>
              </div>
              <Users className="w-8 h-8 text-primary/50" />
            </div>
          </button>

          {/* Scheduled */}
          <button
            onClick={() => handleCardClick("scheduled")}
            className="card-glow scale-in hover:scale-105 transition-transform cursor-pointer text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Agendados</p>
                <p className="text-3xl font-bold text-blue-400">{stats?.scheduled || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400/50" />
            </div>
          </button>

          {/* Attended */}
          <button
            onClick={() => handleCardClick("attended")}
            className="card-glow scale-in hover:scale-105 transition-transform cursor-pointer text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Compareceram</p>
                <p className={`text-3xl font-bold ${getStatusColor(stats?.attended || 0, stats?.totalLeads || 1)}`}>
                  {stats?.attended || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400/50" />
            </div>
          </button>

          {/* Closed */}
          <button
            onClick={() => handleCardClick("closed")}
            className="card-glow scale-in hover:scale-105 transition-transform cursor-pointer text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Fechados</p>
                <p className={`text-3xl font-bold ${getStatusColor(stats?.closed || 0, stats?.totalLeads || 1)}`}>
                  {stats?.closed || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400/50" />
            </div>
          </button>

          {/* Total Revenue */}
          <div className="card-glow scale-in hover:scale-105 transition-transform">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Faturamento</p>
                <p className="text-3xl font-bold text-green-400">R$ {totalRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400/50" />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Conversion Funnel */}
          <div className="card-glow">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Funil de Conversão
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionFunnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(147, 51, 234, 0.1)" />
                <XAxis dataKey="name" stroke="rgba(147, 51, 234, 0.5)" />
                <YAxis stroke="rgba(147, 51, 234, 0.5)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(20, 20, 40, 0.9)", border: "1px solid rgba(147, 51, 234, 0.5)" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="value" fill="#9333ea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Status */}
          <div className="card-glow">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Faturamento por Status
            </h2>
            {revenueByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: R$ ${value.toFixed(0)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    contentStyle={{ backgroundColor: "rgba(20, 20, 40, 0.9)", border: "1px solid rgba(147, 51, 234, 0.5)" }}
                    labelStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Revenue by Treatment Type */}
        {revenueByTreatment.length > 0 && (
          <div className="card-glow mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Faturamento por Tipo de Tratamento
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByTreatment}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(147, 51, 234, 0.1)" />
                <XAxis dataKey="name" stroke="rgba(147, 51, 234, 0.5)" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="rgba(147, 51, 234, 0.5)" />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: "rgba(20, 20, 40, 0.9)", border: "1px solid rgba(147, 51, 234, 0.5)" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-12 border-primary/50 hover:bg-primary/10"
            onClick={() => navigate("/leads")}
          >
            Ver Todos os Leads
          </Button>
          <Button 
            className="btn-neon h-12"
            onClick={() => navigate("/leads/new")}
          >
            Novo Lead
          </Button>
          <Button 
            variant="outline" 
            className="h-12 border-primary/50 hover:bg-primary/10"
            onClick={() => navigate("/leads")}
          >
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6 bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Magnata do Marketing Digital I.A</p>
          <div className="flex gap-6 items-center">
            <a href="https://wa.me/+5585991126516" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors neon-glow">
              Suporte via WhatsApp
            </a>
            <a href="https://www.instagram.com/guilherme__magnata?igsh=eXJtZzFmcGhkOHdy" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors neon-glow">
              Instagram
            </a>
            <p className="neon-glow-cyan">Sistema de Gestão de Leads</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
