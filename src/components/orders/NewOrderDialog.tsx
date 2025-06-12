import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { Plus, Minus, ShoppingCart } from 'lucide-react';

interface Table {
  id: string;
  table_number: number;
  capacity: number;
  status: string;
}

interface Category {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
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
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export const NewOrderDialog: React.FC<NewOrderDialogProps> = ({ 
  isOpen, 
  onClose, 
  onOrderCreated 
}) => {
  const { profile } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTables();
      fetchCategories();
      fetchMenuItems();
    }
  }, [isOpen]);

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

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .order('name');

    if (error) {
      console.error('Error fetching menu items:', error);
    } else {
      setMenuItems(data || []);
    }
  };

  const filteredMenuItems = selectedCategory 
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems;

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
    return orderItems.reduce((total, item) => total + item.total_price, 0);
  };

  const handleCreateOrder = async () => {
    if (!selectedTable || orderItems.length === 0) {
      toast.error('Selecione uma mesa e adicione itens ao pedido');
      return;
    }

    setLoading(true);

    try {
      // Generate order number
      const orderNumber = `PED${Date.now()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: selectedTable,
          waiter_id: profile?.id,
          order_number: orderNumber,
          total_amount: getTotalAmount(),
          notes: notes,
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

      toast.success('Pedido criado com sucesso!');
      onOrderCreated();
      onClose();
      
      // Reset form
      setSelectedTable('');
      setOrderItems([]);
      setNotes('');
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Pedido</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - Menu selection */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <Label>Mesa</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma mesa disponível" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map(table => (
                    <SelectItem key={table.id} value={table.id}>
                      Mesa {table.table_number} ({table.capacity} lugares)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
                <TabsTrigger value="">Todos</TabsTrigger>
                {categories.slice(0, 4).map(category => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {filteredMenuItems.map(item => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    onAddToOrder={addItemToOrder}
                  />
                ))}
              </div>
            </Tabs>
          </div>

          {/* Right side - Order summary */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Resumo do Pedido
              </h3>
              
              {orderItems.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum item adicionado</p>
              ) : (
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {Object.keys(item.options).length > 0 && (
                          <p className="text-xs text-gray-500">
                            {Object.entries(item.options).map(([key, value]) => 
                              `${key}: ${value}`
                            ).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(index, -1)}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(index, 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="w-16 text-right">
                        R$ {item.total_price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {orderItems.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>R$ {getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
              )}
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

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateOrder} 
                disabled={loading || !selectedTable || orderItems.length === 0}
                className="flex-1"
              >
                {loading ? 'Criando...' : 'Criar Pedido'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MenuItemCard: React.FC<{ 
  item: MenuItem; 
  onAddToOrder: (item: MenuItem, options?: any) => void; 
}> = ({ item, onAddToOrder }) => {
  const [selectedOptions, setSelectedOptions] = useState<any>({});

  const handleAddToOrder = () => {
    onAddToOrder(item, selectedOptions);
    setSelectedOptions({});
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="space-y-2">
          <div>
            <h4 className="font-medium text-sm">{item.name}</h4>
            <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
            <p className="font-bold text-green-600">R$ {item.price.toFixed(2)}</p>
          </div>

          {item.options && Object.keys(item.options).length > 0 && (
            <div className="space-y-2">
              {Object.entries(item.options).map(([optionKey, optionValues]) => (
                <div key={optionKey}>
                  <Label className="text-xs">{optionKey}:</Label>
                  <Select 
                    value={selectedOptions[optionKey] || ''} 
                    onValueChange={(value) => 
                      setSelectedOptions({...selectedOptions, [optionKey]: value})
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {(optionValues as string[]).map(value => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          <Button 
            size="sm" 
            onClick={handleAddToOrder}
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};