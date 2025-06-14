
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Plus, Minus, Trash2, Coffee, UtensilsCrossed, Cookie, Droplets } from 'lucide-react';

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
  options: {
    ice?: boolean;
    lemon?: boolean;
    sugar?: boolean;
    hot?: boolean;
  };
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'Todos', icon: UtensilsCrossed },
    { id: 'bebidas', name: 'Bebidas', icon: Droplets },
    { id: 'comidas', name: 'Comidas', icon: UtensilsCrossed },
    { id: 'sobremesas', name: 'Sobremesas', icon: Cookie },
    { id: 'cafe', name: 'Cafés', icon: Coffee },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchMenuItems();
      fetchAvailableTables();
    }
  }, [isOpen]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          categories (name)
        `)
        .eq('is_available', true);

      if (error) throw error;
      
      const menuItemsData: MenuItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: Number(item.price) || 0,
        category: {
          name: item.categories?.name || 'Outros'
        }
      }));
      
      setMenuItems(menuItemsData);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar cardápio",
        variant: "destructive"
      });
    }
  };

  const fetchAvailableTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('status', 'available')
        .order('table_number');

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar mesas disponíveis",
        variant: "destructive"
      });
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.category.name.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const addItemToOrder = (menuItem: MenuItem, options = {}) => {
    const existingItemIndex = orderItems.findIndex(item => 
      item.menu_item_id === menuItem.id && 
      JSON.stringify(item.options) === JSON.stringify(options)
    );
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + 1,
        total_price: (updatedItems[existingItemIndex].quantity + 1) * updatedItems[existingItemIndex].unit_price
      };
      setOrderItems(updatedItems);
    } else {
      setOrderItems([...orderItems, {
        menu_item_id: menuItem.id,
        quantity: 1,
        unit_price: menuItem.price,
        total_price: menuItem.price,
        menu_item: menuItem,
        options
      }]);
    }
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    } else {
      const updatedItems = [...orderItems];
      updatedItems[index] = {
        ...updatedItems[index],
        quantity: newQuantity,
        total_price: newQuantity * updatedItems[index].unit_price
      };
      setOrderItems(updatedItems);
    }
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
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
      const orderNumber = `PED${Date.now().toString().slice(-6)}`;

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

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          orderItems.map(item => ({
            order_id: order.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            options: item.options
          }))
        );

      if (itemsError) throw itemsError;

      await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', selectedTable);

      toast({
        title: "Sucesso!",
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
    setSelectedCategory('all');
  };

  const DrinkOptionsButton = ({ item, option, children }: { item: MenuItem; option: any; children: React.ReactNode }) => (
    <Button
      size="sm"
      variant="outline"
      onClick={() => addItemToOrder(item, option)}
      className="h-8 text-xs"
    >
      {children}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">🍽️ Novo Pedido</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seleção de Mesa */}
          <div className="lg:col-span-3">
            <Label className="text-base font-semibold mb-3 block">📍 Selecione a Mesa</Label>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {tables.map((table) => (
                <Button
                  key={table.id}
                  variant={selectedTable === table.id ? "default" : "outline"}
                  onClick={() => setSelectedTable(table.id)}
                  className={`h-16 ${selectedTable === table.id ? 'bg-green-500 hover:bg-green-600' : ''}`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">Mesa</div>
                    <div className="text-xl">{table.table_number}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Categorias */}
          <div className="lg:col-span-3">
            <Label className="text-base font-semibold mb-3 block">🍴 Categorias</Label>
            <div className="grid grid-cols-5 gap-2">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`h-20 flex flex-col ${selectedCategory === category.id ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                  >
                    <IconComponent className="h-6 w-6 mb-1" />
                    <span className="text-xs">{category.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Menu Items */}
          <div className="lg:col-span-2">
            <Label className="text-base font-semibold mb-3 block">📋 Cardápio</Label>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredMenuItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum item disponível nesta categoria</p>
                </div>
              ) : (
                filteredMenuItems.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{item.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <Badge variant="outline" className="text-xs">
                            {item.category.name}
                          </Badge>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-xl text-green-600">
                            R$ {item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Opções especiais para bebidas */}
                      {item.category.name.toLowerCase().includes('bebida') && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-2">Opções:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <DrinkOptionsButton item={item} option={{ice: true}}>🧊 Com Gelo</DrinkOptionsButton>
                            <DrinkOptionsButton item={item} option={{ice: false}}>🚫 Sem Gelo</DrinkOptionsButton>
                            <DrinkOptionsButton item={item} option={{lemon: true}}>🍋 Com Limão</DrinkOptionsButton>
                            <DrinkOptionsButton item={item} option={{sugar: true}}>🍯 Com Açúcar</DrinkOptionsButton>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => addItemToOrder(item)}
                        className="w-full bg-green-500 hover:bg-green-600"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Pedido Atual */}
          <div className="lg:col-span-1">
            <Label className="text-base font-semibold mb-3 block">🛒 Pedido Atual</Label>
            
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {orderItems.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">
                      Nenhum item adicionado
                    </p>
                  ) : (
                    orderItems.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.menu_item.name}</p>
                            <p className="text-xs text-gray-600">
                              R$ {item.unit_price.toFixed(2)} cada
                            </p>
                            {Object.keys(item.options).length > 0 && (
                              <div className="text-xs text-blue-600 mt-1">
                                {Object.entries(item.options).map(([key, value]) => 
                                  value && (
                                    <span key={key} className="mr-2">
                                      {key === 'ice' && '🧊'} 
                                      {key === 'lemon' && '🍋'} 
                                      {key === 'sugar' && '🍯'}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeItem(index)}
                            className="text-red-600 h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(index, item.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(index, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="font-bold text-sm text-green-600">
                            R$ {item.total_price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      R$ {totalAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="notes" className="text-sm">Observações</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações do pedido..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                      Cancelar
                    </Button>
                    <Button 
                      onClick={createOrder} 
                      disabled={loading || !selectedTable || orderItems.length === 0}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      {loading ? 'Criando...' : 'Finalizar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
