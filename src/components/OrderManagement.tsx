import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewOrderDialog } from '@/components/orders/NewOrderDialog';
import { supabase } from '@/integrations/supabase/client';
import { Clock, DollarSign, CheckCircle, Timer, Plus, Users } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  notes: string;
  table: { table_number: number } | null;
  waiter: { full_name: string } | null;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    menu_item: { name: string };
    options: any;
    notes: string;
  }>;
}

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          table:tables(table_number),
          waiter:profiles(full_name),
          order_items(
            *,
            menu_item:menu_items(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // If order is completed, free the table
      if (newStatus === 'delivered') {
        const order = orders.find(o => o.id === orderId);
        if (order?.table) {
          await supabase
            .from('tables')
            .update({ status: 'cleaning' })
            .eq('id', order.table.table_number);
        }
      }

      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'preparing': return 'bg-blue-500';
      case 'ready': return 'bg-green-500';
      case 'delivered': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Pedidos</h2>
          <p className="text-gray-600 mt-1">
            {pendingOrders} pendentes • {preparingOrders} preparando • {readyOrders} prontos
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os pedidos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="preparing">Preparando</SelectItem>
              <SelectItem value="ready">Prontos</SelectItem>
              <SelectItem value="delivered">Entregues</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className="bg-gradient-to-r from-green-500 to-green-600 whitespace-nowrap"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Novo Pedido</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Preparando</p>
                <p className="text-2xl font-bold text-blue-900">{preparingOrders}</p>
              </div>
              <Timer className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Prontos</p>
                <p className="text-2xl font-bold text-green-900">{readyOrders}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Receita Hoje</p>
                <p className="text-xl md:text-2xl font-bold text-purple-900">
                  R$ {orders
                    .filter(o => o.status === 'delivered')
                    .reduce((sum, o) => sum + o.total_amount, 0)
                    .toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    #{order.order_number.split('-')[1]?.slice(-4) || order.order_number}
                  </CardTitle>
                  {order.table && (
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <p className="text-gray-600">Mesa {order.table.table_number}</p>
                    </div>
                  )}
                  {order.waiter && (
                    <p className="text-sm text-gray-500">Garçom: {order.waiter.full_name}</p>
                  )}
                </div>
                <Badge className={`${getStatusColor(order.status)} text-white`}>
                  {getStatusText(order.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Itens ({order.order_items.length}):</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {order.order_items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                        {item.quantity}x {item.menu_item.name}
                        {Object.keys(item.options || {}).length > 0 && (
                          <span className="text-xs text-gray-500">
                            ({Object.entries(item.options).map(([k, v]) => `${v}`).join(', ')})
                          </span>
                        )}
                      </span>
                      <span className="font-medium">
                        R$ {item.total_price.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  {new Date(order.created_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="font-bold text-lg text-green-600">
                  R$ {order.total_amount.toFixed(2)}
                </div>
              </div>

              {order.notes && (
                <div className="text-sm">
                  <p className="text-gray-600 font-medium">Observações:</p>
                  <p className="text-gray-700 bg-gray-50 p-2 rounded text-xs">{order.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {order.status === 'pending' && (
                  <Button 
                    size="sm" 
                    className="bg-blue-500 hover:bg-blue-600 flex-1"
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                  >
                    Iniciar Preparo
                  </Button>
                )}
                {order.status === 'preparing' && (
                  <Button 
                    size="sm" 
                    className="bg-green-500 hover:bg-green-600 flex-1"
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                  >
                    Marcar Pronto
                  </Button>
                )}
                {order.status === 'ready' && (
                  <Button 
                    size="sm" 
                    className="bg-purple-500 hover:bg-purple-600 flex-1"
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                  >
                    Entregar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-gray-600">
              {filterStatus === 'all' 
                ? 'Não há pedidos no momento' 
                : `Não há pedidos com status "${getStatusText(filterStatus)}"`
              }
            </p>
          </CardContent>
        </Card>
      )}

      <NewOrderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onOrderCreated={fetchOrders}
      />
    </div>
  );
};