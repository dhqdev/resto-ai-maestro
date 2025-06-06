
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Package, 
  Users,
  DollarSign,
  Bell,
  Settings,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'stock' | 'orders' | 'financial' | 'staff' | 'system';
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '001',
      title: 'Estoque Crítico',
      message: 'Queijo Mussarela está abaixo do estoque mínimo (5kg restantes)',
      type: 'error',
      category: 'stock',
      timestamp: '2024-06-06 14:30',
      isRead: false,
      priority: 'high',
      actionRequired: true
    },
    {
      id: '002',
      title: 'Meta de Vendas Atingida',
      message: 'Parabéns! A meta diária de R$ 3.000 foi superada em 8%',
      type: 'success',
      category: 'financial',
      timestamp: '2024-06-06 14:15',
      isRead: false,
      priority: 'medium'
    },
    {
      id: '003',
      title: 'Pedido com Atraso',
      message: 'Mesa 9 aguarda há mais de 45 minutos. Verificar com a cozinha.',
      type: 'warning',
      category: 'orders',
      timestamp: '2024-06-06 14:10',
      isRead: false,
      priority: 'high',
      actionRequired: true
    },
    {
      id: '004',
      title: 'Novo Funcionário',
      message: 'Bruno Santos foi adicionado à equipe como garçom',
      type: 'info',
      category: 'staff',
      timestamp: '2024-06-06 13:45',
      isRead: true,
      priority: 'low'
    },
    {
      id: '005',
      title: 'Pico de Demanda Previsto',
      message: 'IA detectou padrão: expect alta demanda entre 19h-21h hoje',
      type: 'info',
      category: 'system',
      timestamp: '2024-06-06 13:30',
      isRead: true,
      priority: 'medium'
    },
    {
      id: '006',
      title: 'Avaliação Negativa',
      message: 'Cliente deu 2 estrelas no delivery. Motivo: "Comida fria"',
      type: 'warning',
      category: 'orders',
      timestamp: '2024-06-06 13:15',
      isRead: false,
      priority: 'medium',
      actionRequired: true
    }
  ]);

  const [notificationSettings, setNotificationSettings] = useState({
    stock: true,
    orders: true,
    financial: true,
    staff: true,
    system: true
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'info': return <Bell className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'stock': return <Package className="h-4 w-4" />;
      case 'orders': return <Clock className="h-4 w-4" />;
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'staff': return <Users className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'stock': return 'Estoque';
      case 'orders': return 'Pedidos';
      case 'financial': return 'Financeiro';
      case 'staff': return 'Equipe';
      case 'system': return 'Sistema';
      default: return category;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-200';
      case 'medium': return 'bg-yellow-100 border-yellow-200';
      case 'low': return 'bg-gray-100 border-gray-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const priorityNotifications = notifications.filter(n => n.priority === 'high' && !n.isRead);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Central de Notificações</h2>
          <p className="text-gray-600 mt-1">
            {unreadCount} notificações não lidas
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={markAllAsRead}>
            Marcar Todas como Lidas
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Priority Alerts */}
      {priorityNotifications.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alertas Prioritários ({priorityNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {priorityNotifications.map(notification => (
                <div 
                  key={notification.id}
                  className="bg-white p-3 rounded-lg border border-red-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900">{notification.title}</h4>
                      <p className="text-sm text-red-700 mt-1">{notification.message}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="ml-3 bg-red-500 hover:bg-red-600"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Ação Rápida
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(notificationSettings).map(([category, enabled]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <span className="font-medium">{getCategoryText(category)}</span>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, [category]: checked }))
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card 
            key={notification.id}
            className={`${getPriorityColor(notification.priority)} ${
              !notification.isRead ? 'shadow-lg' : 'opacity-75'
            } transition-all duration-200`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getTypeIcon(notification.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className={`text-sm ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                        {notification.message}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        {getCategoryIcon(notification.category)}
                        <span>{getCategoryText(notification.category)}</span>
                      </div>
                      <span>{notification.timestamp}</span>
                      <Badge variant="outline" className="text-xs">
                        {notification.priority === 'high' ? 'Alta' : 
                         notification.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Marcar como Lida
                        </Button>
                      )}
                      {notification.actionRequired && (
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          Ação Necessária
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nenhuma notificação
            </h3>
            <p className="text-gray-600">
              Todas as notificações foram processadas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
