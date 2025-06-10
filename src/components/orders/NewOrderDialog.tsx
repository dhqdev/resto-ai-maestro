import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Minus, Search } from 'lucide-react';

interface Table {
  id: string;
  table_number: number;
  capacity: number;
  status: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: { name: string };
  options: any;
  is_available: boolean;
}

interface OrderItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  options: any;
  notes: string;
}

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: () => void;
}

export const NewOrderDialog = ({ open, onOpenChange, onOrderCreated }: NewOrderDialogProps) => {
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [orderNotes, setOrderNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailableTables();
      fetchMenuItems();
    }
  }, [open]);

  const fetchAvailableTables = async () => {
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('status', 'available')
      .order('table_number');
    
    setAvailableTables(data || []);
  };

  const fetchMenuItems = async () => {
    const { data } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:categories(name)
      `)
      .eq('is_available', true);
    
    setMenuItems(data || []);
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(menuItems.map(item => item.category.name))];

  const addItemToOrder = (menuItem: MenuItem, selectedOptions: any = {}) => {
    const existingItemIndex = orderItems.findIndex(
      item => item.menu_item_id === menuItem.id && 
      JSON.stringify(item.options) === JSON.stringify(selectedOptions)
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total_price = 
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unit_price;
      setOrderItems(updatedItems);
    } else {
      const newItem: OrderItem = {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        unit_price: menuItem.price,
        total_price: menuItem.price,
        options: selectedOptions,
        notes: ''
      };
      setOrderItems([...orderItems, newItem]);
    }
  };

  const updateItemQuantity = (index: number, change: number) => {
    const updatedItems = [...orderItems];
    updatedItems[index].quantity += change;
    
    if (updatedItems[index].quantity <= 0) {
      updatedItems.splice(index, 1);
    } else {
      updatedItems[index].total_price = 
        updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    setOrderItems(updatedItems);
  };

  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleCreateOrder = async () => {
    if (!selectedTable || orderItems.length === 0) return;

    setLoading(true);
    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: selectedTable,
          order_number: orderNumber,
          total_amount: getTotalAmount(),
          notes: orderNotes,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsData = orderItems.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        options: item.options,
        notes: item.notes
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      // Update table status
      await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', selectedTable);

      // Reset form
      setSelectedTable('');
      setOrderItems([]);
      setOrderNotes('');
      onOrderCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Pedido</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Menu Items */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="table">Mesa</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma mesa disponível" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map(table => (
                    <SelectItem key={table.id} value={table.id}>
                      Mesa {table.table_number} ({table.capacity} lugares)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar itens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {filteredMenuItems.map(item => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-bold text-green-600">
                            R$ {item.price.toFixed(2)}
                          </span>
                          <Badge variant="outline">{item.category.name}</Badge>
                        </div>
                        
                        {/* Options for drinks */}
                        {item.options && Object.keys(item.options).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {Object.entries(item.options).map(([key, values]: [string, any]) => (
                              <div key={key} className="text-xs">
                                <span className="font-medium capitalize">{key}: </span>
                                {Array.isArray(values) && values.map((value, index) => (
                                  <Button
                                    key={value}
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 mr-1 text-xs"
                                    onClick={() => addItemToOrder(item, { [key]: value })}
                                  >
                                    {value}
                                  </Button>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => addItemToOrder(item)}
                        className="ml-2"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <h3 className="font-medium">Itens do Pedido</h3>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {orderItems.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        {Object.keys(item.options).length > 0 && (
                          <p className="text-xs text-gray-600">
                            {Object.entries(item.options).map(([key, value]) => 
                              `${key}: ${value}`
                            ).join(', ')}
                          </p>
                        )}
                        <p className="text-sm font-bold text-green-600">
                          R$ {item.total_price.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(index, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(index, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Label htmlFor="notes">Observações do Pedido</Label>
              <Textarea
                id="notes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Observações especiais..."
                rows={3}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-green-600">R$ {getTotalAmount().toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={handleCreateOrder}
              disabled={!selectedTable || orderItems.length === 0 || loading}
              className="w-full"
            >
              {loading ? 'Criando Pedido...' : 'Criar Pedido'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};