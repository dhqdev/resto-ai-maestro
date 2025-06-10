import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
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
import { OrderManagement } from '@/components/OrderManagement';
import { TableLayout } from '@/components/tables/TableLayout';
import { StockManagement } from '@/components/StockManagement';
import { FinancialAnalytics } from '@/components/FinancialAnalytics';
import { NotificationCenter } from '@/components/NotificationCenter';
import { UserManagement } from '@/components/UserManagement';
import { IntegrationsPanel } from '@/components/IntegrationsPanel';
import { MenuManagement } from '@/components/MenuManagement';

const Index = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('orders');
  const [showNotifications, setShowNotifications] = useState(false);
  const { profile, signOut, hasPermission } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Mock data for dashboard metrics
  const todayMetrics = {
    revenue: 3247.50,
    orders: 87,
    avgTicket: 37.32,
    occupancy: 78
  };

  const activeNotifications = 5;

  const menuItems = [
    { id: 'orders', label: 'Pedidos', icon: ChefHat, permission: 'orders' },
    { id: 'tables', label: 'Mesas', icon: Coffee, permission: 'tables' },
    { id: 'stock', label: 'Estoque', icon: Package, permission: 'stock' },
    { id: 'analytics', label: 'Financeiro', icon: TrendingUp, permission: 'reports' },
    { id: 'menu', label: 'Cardápio', icon: MenuIcon, permission: 'menu' },
    { id: 'users', label: 'Usuários', icon: UserCog, permission: 'users' },
    { id: 'integrations', label: 'Integrações', icon: Zap, permission: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <MobileNavigation 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              activeNotifications={activeNotifications}
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
              onClick={() => setShowNotifications(true)}
            >
              <Bell className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Notificações</span>
              {activeNotifications > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                  {activeNotifications}
                </Badge>
              )}
            </Button>
            <Button 
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              onClick={() => setActiveTab('analytics')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Financeiro</span>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveTab('analytics')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm md:text-lg font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Faturamento</span>
                <span className="sm:hidden">Vendas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-3xl font-bold mb-1">
                R$ {todayMetrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-green-100 text-xs md:text-sm">+12% vs ontem</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveTab('orders')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm md:text-lg font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-3xl font-bold mb-1">{todayMetrics.orders}</div>
              <p className="text-blue-100 text-xs md:text-sm">8 em andamento</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveTab('analytics')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm md:text-lg font-medium flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Ticket Médio</span>
                <span className="sm:hidden">Ticket</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-3xl font-bold mb-1">
                R$ {todayMetrics.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-purple-100 text-xs md:text-sm">Meta: R$ 35,00</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveTab('tables')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm md:text-lg font-medium flex items-center gap-2">
                <Users className="h-4 w-4 md:h-5 md:w-5" />
                Ocupação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-3xl font-bold mb-1">{todayMetrics.occupancy}%</div>
              <p className="text-orange-100 text-xs md:text-sm">14/18 mesas</p>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white shadow-lg">
              {menuItems.map((item) => {
                if (item.permission && !hasPermission(item.permission)) {
                  return null;
                }

                const Icon = item.icon;
                return (
                  <TabsTrigger key={item.id} value={item.id} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

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
        </div>

        {/* Mobile Content */}
        <div className="md:hidden">
          {activeTab === 'orders' && <OrderManagement />}
          {activeTab === 'tables' && <TableLayout />}
          {activeTab === 'stock' && <StockManagement />}
          {activeTab === 'analytics' && <FinancialAnalytics />}
          {activeTab === 'menu' && <MenuManagement />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'integrations' && <IntegrationsPanel />}
          {activeTab === 'notifications' && <NotificationCenter />}
        </div>

        {/* Notifications Dialog */}
        <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
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