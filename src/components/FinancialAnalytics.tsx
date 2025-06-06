
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, Download } from 'lucide-react';

export const FinancialAnalytics = () => {
  // Mock data for charts
  const weeklyRevenue = [
    { day: 'Seg', revenue: 2150, orders: 45 },
    { day: 'Ter', revenue: 2400, orders: 52 },
    { day: 'Qua', revenue: 2850, orders: 61 },
    { day: 'Qui', revenue: 3100, orders: 68 },
    { day: 'Sex', revenue: 3800, orders: 82 },
    { day: 'Sab', revenue: 4200, orders: 95 },
    { day: 'Dom', revenue: 3900, orders: 87 }
  ];

  const monthlyComparison = [
    { month: 'Jan', thisYear: 45000, lastYear: 42000 },
    { month: 'Fev', thisYear: 48000, lastYear: 45000 },
    { month: 'Mar', thisYear: 52000, lastYear: 48000 },
    { month: 'Abr', thisYear: 55000, lastYear: 51000 },
    { month: 'Mai', thisYear: 58000, lastYear: 54000 },
    { month: 'Jun', thisYear: 62000, lastYear: 56000 }
  ];

  const topProducts = [
    { name: 'Pizza Margherita', value: 28, color: '#FF6B35' },
    { name: 'Hambúrguer Artesanal', value: 22, color: '#F7931E' },
    { name: 'Salada Caesar', value: 18, color: '#FFD23F' },
    { name: 'Pasta Carbonara', value: 15, color: '#06FFA5' },
    { name: 'Outros', value: 17, color: '#3D5A80' }
  ];

  const paymentMethods = [
    { method: 'Cartão de Crédito', percentage: 45, amount: 15480.50 },
    { method: 'PIX', percentage: 30, amount: 10320.30 },
    { method: 'Cartão de Débito', percentage: 20, amount: 6880.20 },
    { method: 'Dinheiro', percentage: 5, amount: 1720.10 }
  ];

  const kpis = {
    dailyRevenue: 3247.50,
    dailyGrowth: 12.5,
    monthlyRevenue: 62000,
    monthlyGrowth: 8.3,
    averageTicket: 37.32,
    ticketGrowth: -2.1,
    profitMargin: 22.8,
    marginGrowth: 3.2
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Análise Financeira</h2>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Período
          </Button>
          <Button className="bg-gradient-to-r from-green-500 to-green-600">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Receita Diária</p>
                <p className="text-2xl font-bold">
                  R$ {kpis.dailyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">+{kpis.dailyGrowth}%</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Receita Mensal</p>
                <p className="text-2xl font-bold">
                  R$ {kpis.monthlyRevenue.toLocaleString('pt-BR')}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">+{kpis.monthlyGrowth}%</span>
                </div>
              </div>
              <Target className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Ticket Médio</p>
                <p className="text-2xl font-bold">
                  R$ {kpis.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm">{kpis.ticketGrowth}%</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Margem de Lucro</p>
                <p className="text-2xl font-bold">{kpis.profitMargin}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">+{kpis.marginGrowth}%</span>
                </div>
              </div>
              <Target className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg">
          <TabsTrigger value="revenue">Receita Semanal</TabsTrigger>
          <TabsTrigger value="comparison">Comparação Anual</TabsTrigger>
          <TabsTrigger value="products">Produtos Top</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Receita da Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' 
                          ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                          : `${value} pedidos`,
                        name === 'revenue' ? 'Receita' : 'Pedidos'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#FF6B35" 
                      fill="#FF6B35" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Comparação Anual (Mensal)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [
                        `R$ ${Number(value).toLocaleString('pt-BR')}`,
                        'Receita'
                      ]}
                    />
                    <Bar dataKey="thisYear" fill="#4F46E5" name="2024" />
                    <Bar dataKey="lastYear" fill="#9CA3AF" name="2023" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topProducts}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{method.method}</span>
                      <div className="text-right">
                        <div className="font-bold">{method.percentage}%</div>
                        <div className="text-sm text-gray-600">
                          R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${method.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
