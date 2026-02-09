import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Users, Calendar, CheckCircle, TrendingUp, Loader2, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

export default function DashboardWithCharts() {
  const { user, logout } = useAuth();
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

  const COLORS = ["#0066cc", "#00ccff", "#00ff99", "#ffcc00", "#ff6600", "#ff3333"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
      {/* Header Bar - Blue Professional */}
      <div className="header-bar">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold">📋</div>
              <h1 className="text-xl font-bold">MAGNATA DO CRM</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">Usuário: <strong>{user?.name}</strong></span>
              <Button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-gray-900 border-b-2 border-blue-700">
        <div className="container py-3">
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={() => navigate("/dashboard")}
              className="nav-button nav-button-active"
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

      {/* Main Content */}
      <div className="container py-8">
        {/* Dashboard Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-gray-400 text-sm">Selecione o Mês</p>
        </div>

        {/* Month and Year Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-semibold mb-2">Selecione o Mês</label>
            <select className="w-full px-4 py-2 bg-card border-2 border-blue-600 rounded-lg text-white">
              <option>Fevereiro</option>
              <option>Janeiro</option>
              <option>Dezembro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Selecione o Ano</label>
            <select className="w-full px-4 py-2 bg-card border-2 border-blue-600 rounded-lg text-white">
              <option>2026</option>
              <option>2025</option>
              <option>2024</option>
            </select>
          </div>
        </div>

        {/* Stats Grid - Blue Cards with Green Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Leads */}
          <button
            onClick={() => handleCardClick("all")}
            className="card-blue text-left hover:scale-105 transition-transform cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-2">Total de Leads</p>
                <p className="stats-value">{stats?.totalLeads || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </button>

          {/* Scheduled */}
          <button
            onClick={() => handleCardClick("scheduled")}
            className="card-blue text-left hover:scale-105 transition-transform cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-2">Agendados</p>
                <p className="stats-value">{stats?.scheduled || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </button>

          {/* Attended */}
          <button
            onClick={() => handleCardClick("attended")}
            className="card-blue text-left hover:scale-105 transition-transform cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-2">Sem Interesse</p>
                <p className="stats-value">{stats?.attended || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
          </button>

          {/* Closed */}
          <button
            onClick={() => handleCardClick("closed")}
            className="card-blue text-left hover:scale-105 transition-transform cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-2">Fechados</p>
                <p className="stats-value">{stats?.closed || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </button>

          {/* Total Revenue */}
          <div className="card-blue">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-2">Faturamento</p>
                <p className="stats-value">R$ {totalRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Conversion Funnel */}
          <div className="card-blue">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Funil de Conversão
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionFunnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 102, 204, 0.2)" />
                <XAxis dataKey="name" stroke="rgba(200, 200, 200, 0.7)" />
                <YAxis stroke="rgba(200, 200, 200, 0.7)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(22, 33, 62, 0.95)", border: "2px solid #0066cc" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="value" fill="#0066cc" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Status */}
          <div className="card-blue">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
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
                    contentStyle={{ backgroundColor: "rgba(22, 33, 62, 0.95)", border: "2px solid #0066cc" }}
                    labelStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-12">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Revenue by Treatment Type */}
        {revenueByTreatment.length > 0 && (
          <div className="card-blue mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Faturamento por Tipo de Tratamento
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByTreatment}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 102, 204, 0.2)" />
                <XAxis dataKey="name" stroke="rgba(200, 200, 200, 0.7)" />
                <YAxis stroke="rgba(200, 200, 200, 0.7)" />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: "rgba(22, 33, 62, 0.95)", border: "2px solid #0066cc" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="value" fill="#00ff99" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
