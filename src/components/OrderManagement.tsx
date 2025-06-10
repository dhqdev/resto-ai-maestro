import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, MapPin, Phone, CheckCircle, AlertCircle, Timer, Plus, Edit, Trash2, User, DollarSign } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  type: 'dine-in' | 'delivery' | 'takeaway';
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  time: string;
  table?: number;
  address?: string;
  estimatedTime: number;
  notes?: string;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'paid' | 'cancelled';
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export const OrderManagement = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    type: 'dine-in' as Order['type'],
    table: '',
    address: '',
    notes: '',
    items: [] as OrderItem[]
  });

  const [orders, setOrders] = useState<Order[]>([
    {
      id: '001',
      customerName: 'Maria Silva',
      customerPhone: '(11) 99999-9999',
      items: [
        { id: '1', name: 'Pizza Margherita', quantity: 1, price: 32.90 },
        { id: '2', name: 'Coca-Cola 2L', quantity: 1, price: 8.50 }
      ],
      total: 41.40,
      type: 'dine-in',
      status: 'preparing',
      time: '14:30',
      table: 5,
      estimatedTime: 15,
      paymentMethod: 'Cartão de Crédito',
      paymentStatus: 'pending'
    },
    {
      id: '002',
      customerName: 'João Santos',
      customerPhone: '(11) 88888-8888',
      items: [
        { id: '1', name: 'Hambúrguer Artesanal', quantity: 2, price: 28.50 },
        { id: '2', name: 'Batata Frita', quantity: 1, price: 12.90 },
        { id: '3', name: 'Suco Natural', quantity: 2, price: 8.00 }
      ],
      total: 85.90,
      type: 'delivery',
      status: 'ready',
      time: '14:25',
      address: 'Rua das Flores, 123 - Centro',
      estimatedTime: 5,
      notes: 'Sem cebola no hambúrguer',
      paymentMethod: 'PIX',
      paymentStatus: 'paid'
    },
    {
      id: '003',
      customerName: 'Ana Costa',
      customerPhone: '(11) 77777-7777',
      items: [
        { id: '1', name: 'Salada Caesar', quantity: 1, price: 24.90 },
        { id: '2', name: 'Água com Gás', quantity: 1, price: 4.50 }
      ],
      total: 29.40,
      type: 'takeaway',
      status: 'pending',
      time: '14:35',
      estimatedTime: 20,
      paymentMethod: 'Dinheiro',
      paymentStatus: 'pending'
    },
    {
      id: '004',
      customerName: 'Carlos Oliveira',
      customerPhone: '(11) 66666-6666',
      items: [
        { id: '1', name: 'Pasta Carbonara', quantity: 1, price: 26.90 },
        { id: '2', name: 'Vinho Tinto', quantity: 1, price: 45.00 }
      ],
      total: 71.90,
      type: 'dine-in',
      status: 'delivered',
      time: '13:45',
      table: 8,
      estimatedTime: 0,
      paymentMethod: 'Cartão de Débito',
      paymentStatus: 'paid'
    }
  ]);

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dine-in': return '🍽️';
      case 'delivery': return '🚚';
      case 'takeaway': return '🥡';
      default: return '📦';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'dine-in': return 'Balcão';
      case 'delivery': return 'Delivery';
      case 'takeaway': return 'Retirada';
      default: return type;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    const statusMatch = filterStatus === 'all' || order.status === filterStatus;
    const typeMatch = filterType === 'all' || order.type === filterType;
    return statusMatch && typeMatch;
  });

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus, estimatedTime: newStatus === 'delivered' ? 0 : order.estimatedTime }
        : order
    ));
  };

  const updatePaymentStatus = (orderId: string, newStatus: Order['paymentStatus']) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, paymentStatus: newStatus }
        : order
    ));
  };

  const handleCreateOrder = () => {
    const order: Order = {
      id: (orders.length + 1).toString().padStart(3, '0'),
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      items: newOrder.items,
      total: newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      type: newOrder.type,
      status: 'pending',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      table: newOrder.type === 'dine-in' ? parseInt(newOrder.table) : undefined,
      address: newOrder.type === 'delivery' ? newOrder.address : undefined,
      estimatedTime: 30,
      notes: newOrder.notes,
      paymentStatus: 'pending'
    };

    setOrders([...orders, order]);
    setNewOrder({
      customerName: '',
      customerPhone: '',
      type: 'dine-in',
      table: '',
      address: '',
      notes: '',
      items: []
    });
    setIsCreateDialogOpen(false);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
  };

  const handleUpdateOrder = () => {
    if (editingOrder) {
      setOrders(orders.map(order => order.id === editingOrder.id ? editingOrder : order));
      setEditingOrder(null);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders(orders.filter(order => order.id !== orderId));
  };

  const addItemToNewOrder = () => {
    const newItem: OrderItem = {
      id: (newOrder.items.length + 1).toString(),
      name: '',
      quantity: 1,
      price: 0
    };
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, newItem]
    });
  };

  const updateNewOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = newOrder.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const removeNewOrderItem = (index: number) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter((_, i) => i !== index)
    });
  };

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Pedidos</h2>
          <p className="text-gray-600 mt-1">
            {pendingOrders} pendentes • {preparingOrders} preparando • {readyOrders} prontos
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="dine-in">Balcão</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="takeaway">Retirada</SelectItem>
            </SelectContent>
          </Select>
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
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-500 to-green-600">
                <Plus className="h-4 w-4 mr-2" />
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Pedido</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer-name">Nome do Cliente</Label>
                    <Input
                      id="customer-name"
                      value={newOrder.customerName}
                      onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                      placeholder="Digite o nome do cliente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-phone">Telefone</Label>
                    <Input
                      id="customer-phone"
                      value={newOrder.customerPhone}
                      onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="order-type">Tipo do Pedido</Label>
                  <Select value={newOrder.type} onValueChange={(value) => setNewOrder({ ...newOrder, type: value as Order['type'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dine-in">Balcão</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="takeaway">Retirada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newOrder.type === 'dine-in' && (
                  <div>
                    <Label htmlFor="table">Mesa</Label>
                    <Input
                      id="table"
                      type="number"
                      value={newOrder.table}
                      onChange={(e) => setNewOrder({ ...newOrder, table: e.target.value })}
                      placeholder="Número da mesa"
                    />
                  </div>
                )}

                {newOrder.type === 'delivery' && (
                  <div>
                    <Label htmlFor="address">Endereço de Entrega</Label>
                    <Textarea
                      id="address"
                      value={newOrder.address}
                      onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
                      placeholder="Endereço completo para entrega"
                      rows={2}
                    />
                  </div>
                )}

                <div>
                  <Label>Itens do Pedido</Label>
                  <div className="space-y-2 mt-2">
                    {newOrder.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <Input
                            placeholder="Nome do item"
                            value={item.name}
                            onChange={(e) => updateNewOrderItem(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Qtd"
                            value={item.quantity}
                            onChange={(e) => updateNewOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Preço"
                            value={item.price}
                            onChange={(e) => updateNewOrderItem(index, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeNewOrderItem(index)}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addItemToNewOrder}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={newOrder.notes}
                    onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                    placeholder="Observações especiais do pedido"
                    rows={2}
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total do Pedido:</span>
                    <span className="text-xl font-bold text-green-600">
                      R$ {newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button onClick={handleCreateOrder} className="w-full" disabled={!newOrder.customerName || newOrder.items.length === 0}>
                  Criar Pedido
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-2xl font-bold text-purple-900">
                  R$ {orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0).toFixed(2)}
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
                    <span className="text-2xl">{getTypeIcon(order.type)}</span>
                    #{order.id}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-500" />
                    <p className="text-gray-600">{order.customerName}</p>
                  </div>
                  {order.customerPhone && (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">{order.customerPhone}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={`${getStatusColor(order.status)} text-white`}>
                    {getStatusText(order.status)}
                  </Badge>
                  <Badge variant="outline" className={getPaymentStatusColor(order.paymentStatus)}>
                    {getPaymentStatusText(order.paymentStatus)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Itens ({order.items.length}):</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </span>
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

              {order.notes && (
                <div className="text-sm">
                  <p className="text-gray-600 font-medium">Observações:</p>
                  <p className="text-gray-700 bg-gray-50 p-2 rounded text-xs">{order.notes}</p>
                </div>
              )}

              {order.paymentMethod && (
                <div className="text-sm">
                  <p className="text-gray-600">Pagamento: <span className="font-medium">{order.paymentMethod}</span></p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">
                    {order.estimatedTime > 0 ? `${order.estimatedTime} min restantes` : 'Finalizado'}
                  </span>
                </div>
              </div>

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
                {order.paymentStatus === 'pending' && order.status !== 'cancelled' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => updatePaymentStatus(order.id, 'paid')}
                  >
                    Marcar Pago
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditOrder(order)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Order Dialog */}
      {editingOrder && (
        <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Pedido #{editingOrder.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-customer">Nome do Cliente</Label>
                <Input
                  id="edit-customer"
                  value={editingOrder.customerName}
                  onChange={(e) => setEditingOrder({ ...editingOrder, customerName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={editingOrder.customerPhone || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, customerPhone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editingOrder.status} 
                  onValueChange={(value) => setEditingOrder({ ...editingOrder, status: value as Order['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="preparing">Preparando</SelectItem>
                    <SelectItem value="ready">Pronto</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-payment">Status do Pagamento</Label>
                <Select 
                  value={editingOrder.paymentStatus} 
                  onValueChange={(value) => setEditingOrder({ ...editingOrder, paymentStatus: value as Order['paymentStatus'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-notes">Observações</Label>
                <Textarea
                  id="edit-notes"
                  value={editingOrder.notes || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingOrder(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateOrder}
                  className="flex-1"
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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