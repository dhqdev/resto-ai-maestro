
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, MapPin, Phone, CheckCircle, AlertCircle, Timer } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  items: string[];
  total: number;
  type: 'dine-in' | 'delivery' | 'takeaway';
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  time: string;
  table?: number;
  address?: string;
  estimatedTime: number;
}

export const OrderManagement = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const mockOrders: Order[] = [
    {
      id: '001',
      customerName: 'Maria Silva',
      items: ['Pizza Margherita', 'Coca-Cola 2L'],
      total: 45.90,
      type: 'dine-in',
      status: 'preparing',
      time: '14:30',
      table: 5,
      estimatedTime: 15
    },
    {
      id: '002',
      customerName: 'João Santos',
      items: ['Hambúrguer Artesanal', 'Batata Frita', 'Suco Natural'],
      total: 32.50,
      type: 'delivery',
      status: 'ready',
      time: '14:25',
      address: 'Rua das Flores, 123',
      estimatedTime: 5
    },
    {
      id: '003',
      customerName: 'Ana Costa',
      items: ['Salada Caesar', 'Água com Gás'],
      total: 28.00,
      type: 'takeaway',
      status: 'pending',
      time: '14:35',
      estimatedTime: 20
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'preparing': return 'bg-blue-500';
      case 'ready': return 'bg-green-500';
      case 'delivered': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivered': return 'Entregue';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dine-in': return '🍽️';
      case 'delivery': return '🚚';
      case 'takeaway': return '🥡';
      default: return '📦';
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? mockOrders 
    : mockOrders.filter(order => order.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Pedidos</h2>
        <div className="flex gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os pedidos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="preparing">Preparando</SelectItem>
              <SelectItem value="ready">Prontos</SelectItem>
              <SelectItem value="delivered">Entregues</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-green-500 to-green-600">
            + Novo Pedido
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">{getTypeIcon(order.type)}</span>
                    #{order.id}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{order.customerName}</p>
                </div>
                <Badge className={`${getStatusColor(order.status)} text-white`}>
                  {getStatusText(order.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Itens:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  {order.time}
                </div>
                <div className="font-bold text-lg text-green-600">
                  R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {order.table && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  Mesa {order.table}
                </div>
              )}

              {order.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {order.address}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">
                    {order.estimatedTime} min restantes
                  </span>
                </div>
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                      Iniciar
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button size="sm" className="bg-green-500 hover:bg-green-600">
                      Finalizar
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                      Entregar
                    </Button>
                  )}
                </div>
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
    </div>
  );
};
