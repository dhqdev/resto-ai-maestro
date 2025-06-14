
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Plus, Minus, Trash2 } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: {
    name: string;
  };
}

interface Table {
  id: string;
  table_number: number;
  status: string;
}

interface OrderItem {
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  menu_item: MenuItem;
}

interface NewOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export const NewOrderDialog = ({ isOpen, onClose, onOrderCreated }: NewOrderDialogProps) => {
  const { profile } = useAuth();
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMenuItems();
      fetchTables();
    }
  }, [isOpen]);

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        categories (name)
      `)
      .eq('is_available', true);

    if (error) {
      console.error('Error fetching menu items:', error);
    } else {
      setMenuItems(data || []);
    }
  };

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('status', 'available')
      .order('table_number');

    if (error) {
      console.error('Error fetching tables:', error);
    } else {
      setTables(data || []);
    }
  };

  const addItemToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menu_item_id === menuItem.id);
    
    if (existingItem) {
      setOrderItems(orderItems.map(item => 
        item.menu_item_id === menuItem.id 
          ? { 
              ...item, 
              quantity: item.quantity + 1,
              total_price: (item.quantity + 1) * item.unit_price
            }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        menu_item_id: menuItem.id,
        quantity: 1,
        unit_price: menuItem.price,
        total_price: menuItem.price,
        menu_item: menuItem
      }]);
    }
  };

  const updateItemQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setOrderItems(orderItems.filter(item => item.menu_item_id !== menuItemId));
    } else {
      setOrderItems(orderItems.map(item => 
        item.menu_item_id === menuItemId 
          ? { 
              ...item, 
              quantity: newQuantity,
              total_price: newQuantity * item.unit_price
            }
          : item
      ));
    }
  };

  const removeItem = (menuItemId: string) => {
    setOrderItems(orderItems.filter(item => item.menu_item_id !== menuItemId));
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.total_price, 0);

  const createOrder = async () => {
    if (!selectedTable || orderItems.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione uma mesa e adicione itens ao pedido",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Generate order number
      const orderNumber = `PED${Date.now().toString().slice(-6)}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: selectedTable,
          waiter_id: profile?.id,
          order_number: orderNumber,
          total_amount: totalAmount,
          notes: notes,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          orderItems.map(item => ({
            order_id: order.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }))
        );

      if (itemsError) throw itemsError;

      // Update table status
      await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', selectedTable);

      toast({
        title: "Sucesso",
        description: `Pedido ${orderNumber} criado com sucesso!`,
      });

      onOrderCreated();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar pedido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedTable('');
    setNotes('');
    setOrderItems([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Pedido</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Menu items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cardápio</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {menuItems.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {item.categories?.name}
                        </Badge>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-lg text-green-600">
                          R$ {item.price.toFixed(2)}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => addItemToOrder(item)}
                          className="mt-2"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right column - Order details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detalhes do Pedido</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="table">Mesa</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        Mesa {table.table_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações especiais do pedido..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Itens do Pedido</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {orderItems.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4 text-center">
                      Nenhum item adicionado
                    </p>
                  ) : (
                    orderItems.map((item) => (
                      <div key={item.menu_item_id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.menu_item.name}</p>
                          <p className="text-xs text-gray-600">
                            R$ {item.unit_price.toFixed(2)} cada
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.menu_item_id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.menu_item_id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeItem(item.menu_item_id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="ml-4">
                          <p className="font-bold text-sm">
                            R$ {item.total_price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-green-600">
                    R$ {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={createOrder} 
                  disabled={loading || !selectedTable || orderItems.length === 0}
                  className="flex-1"
                >
                  {loading ? 'Criando...' : 'Criar Pedido'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
