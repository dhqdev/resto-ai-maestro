
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { OrderManagement } from '@/components/OrderManagement';
import { TableLayout } from '@/components/tables/TableLayout';
import { StockManagement } from '@/components/StockManagement';
import { FinancialAnalytics } from '@/components/FinancialAnalytics';
import { NotificationCenter } from '@/components/NotificationCenter';
import { UserManagement } from '@/components/UserManagement';
import { IntegrationsPanel } from '@/components/IntegrationsPanel';
import { MenuManagement } from '@/components/MenuManagement';
import { 
  ChefHat, 
  Users, 
  DollarSign, 
  Package, 
  Clock, 
  TrendingUp,
  Coffee,
  UtensilsCrossed,
  ShoppingCart,
  Bell,
  UserCog,
  Zap,
  Menu as MenuIcon,
  LogOut
} from 'lucide-react';

const Index = () => {
  const { profile, signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('orders');
  const [todayMetrics, setTodayMetrics] = useState({
    revenue: 0,
    orders: 0,
    avgTicket: 0,
    occupancy: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodayMetrics();
    fetchNotifications();
  }, []);

  const fetchTodayMetrics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's orders
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', today)
        .lt('created_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      // Fetch table occupancy
      const { data: tables } = await supabase
        .from('tables')
        .select('status');

      const completedOrders = orders?.filter(o => o.status === 'delivered') || [];
      const revenue = completedOrders.reduce((sum, order) => sum + order.total_amount, 0);
      const orderCount = orders?.length || 0;
      const avgTicket = orderCount > 0 ? revenue / orderCount : 0;
      
      const occupiedTables = tables?.filter(t => t.status === 'occupied').length || 0;
      const totalTables = tables?.length || 1;
      const occupancy = Math.round((occupiedTables / totalTables) * 100);

      setTodayMetrics({
        revenue,
        orders: orderCount,
        avgTicket,
        occupancy
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = () => {
    setIsNotificationDialogOpen(true);
  };

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <MobileNavigation 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              notificationCount={unreadNotifications}
            />
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
                🍽️ AI Restaurant Manager
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                {currentTime.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} - {currentTime.toLocaleTimeString('pt-BR')}
              </p>
              <p className="text-sm text-gray-500">
                Bem-vindo, {profile?.full_name} ({profile?.role})
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="relative"
              onClick={handleNotificationClick}
            >
              <Bell className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Notificações</span>
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
            <Button 
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              onClick={() => setActiveTab('analytics')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Relatório</span>
            </Button>
            <Button 
              variant="outline"
              onClick={signOut}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveTab('analytics')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-lg font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden md:inline">Faturamento</span>
                <span className="md:hidden">Vendas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg md:text-3xl font-bold mb-1">
                R$ {todayMetrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-green-100 text-xs md:text-sm">Hoje</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveTab('orders')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-lg font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg md:text-3xl font-bold mb-1">{todayMetrics.orders}</div>
              <p className="text-blue-100 text-xs md:text-sm">Hoje</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveTab('analytics')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-lg font-medium flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden md:inline">Ticket Médio</span>
                <span className="md:hidden">Ticket</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg md:text-3xl font-bold mb-1">
                R$ {todayMetrics.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-purple-100 text-xs md:text-sm">Média</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveTab('tables')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-lg font-medium flex items-center gap-2">
                <Users className="h-4 w-4 md:h-5 md:w-5" />
                Ocupação
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg md:text-3xl font-bold mb-1">{todayMetrics.occupancy}%</div>
              <p className="text-orange-100 text-xs md:text-sm">Mesas</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="hidden md:block">
            <TabsList className="grid w-full grid-cols-7 bg-white shadow-lg">
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                Pedidos
              </TabsTrigger>
              <TabsTrigger value="tables" className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Mesas
              </TabsTrigger>
              <TabsTrigger value="stock" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Estoque
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Financeiro
              </TabsTrigger>
              <TabsTrigger value="menu" className="flex items-center gap-2">
                <MenuIcon className="h-4 w-4" />
                Cardápio
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Integrações
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="tables">
            <TableLayout />
          </TabsContent>

          <TabsContent value="stock">
            <StockManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <FinancialAnalytics />
          </TabsContent>

          <TabsContent value="menu">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="integrations">
            <IntegrationsPanel />
          </TabsContent>
        </Tabs>

        {/* Notifications Dialog */}
        <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Notificações</DialogTitle>
            </DialogHeader>
            <NotificationCenter />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
