
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  cost_per_unit: number;
  supplier: string;
  expiry_date: string;
  last_restocked: string;
  consumption_rate: number;
}

export const StockManagement = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    current_stock: 0,
    min_stock: 0,
    max_stock: 100,
    unit: 'kg',
    cost_per_unit: 0,
    supplier: ''
  });

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching stock items:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar estoque: " + error.message,
          variant: "destructive"
        });
        return;
      }

      const stockData: StockItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        current_stock: Number(item.current_stock) || 0,
        min_stock: Number(item.min_stock) || 0,
        max_stock: Number(item.max_stock) || 0,
        unit: item.unit || 'kg',
        cost_per_unit: Number(item.cost_per_unit) || 0,
        supplier: item.supplier || '',
        expiry_date: item.expiry_date || '',
        last_restocked: item.last_restocked || '',
        consumption_rate: Number(item.consumption_rate) || 0
      }));

      setStockItems(stockData);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar estoque",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addStockItem = async () => {
    if (!newItem.name || !newItem.category) {
      toast({
        title: "Erro",
        description: "Nome e categoria são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('stock_items')
        .insert([{
          name: newItem.name,
          category: newItem.category,
          current_stock: newItem.current_stock,
          min_stock: newItem.min_stock,
          max_stock: newItem.max_stock,
          unit: newItem.unit,
          cost_per_unit: newItem.cost_per_unit,
          supplier: newItem.supplier
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item adicionado ao estoque!",
      });

      setIsAddDialogOpen(false);
      setNewItem({
        name: '',
        category: '',
        current_stock: 0,
        min_stock: 0,
        max_stock: 100,
        unit: 'kg',
        cost_per_unit: 0,
        supplier: ''
      });
      fetchStockItems();
    } catch (error) {
      console.error('Error adding stock item:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar item",
        variant: "destructive"
      });
    }
  };

  const getStockStatus = (current: number, min: number, max: number) => {
    if (current <= min) return { status: 'Baixo', color: 'bg-red-500', icon: <AlertTriangle className="h-4 w-4" /> };
    if (current >= max * 0.8) return { status: 'Alto', color: 'bg-green-500', icon: <TrendingUp className="h-4 w-4" /> };
    return { status: 'Normal', color: 'bg-blue-500', icon: <Package className="h-4 w-4" /> };
  };

  const filteredItems = stockItems.filter(item => 
    filterCategory === 'all' || item.category === filterCategory
  );

  const categories = [...new Set(stockItems.map(item => item.category))];
  const lowStockItems = stockItems.filter(item => item.current_stock <= item.min_stock);
  const totalValue = stockItems.reduce((sum, item) => sum + (item.current_stock * item.cost_per_unit), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando estoque...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Estoque</h2>
          <p className="text-gray-600 mt-1">
            {lowStockItems.length} itens com estoque baixo • Valor total: R$ {totalValue.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-500 to-green-600">
                <Plus className="h-4 w-4 mr-2" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Item ao Estoque</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Item</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Ex: Queijo Mussarela"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    placeholder="Ex: Laticínios"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="current_stock">Estoque Atual</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      value={newItem.current_stock}
                      onChange={(e) => setNewItem({ ...newItem, current_stock: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unidade</Label>
                    <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="unidades">unidades</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_stock">Estoque Mínimo</Label>
                    <Input
                      id="min_stock"
                      type="number"
                      value={newItem.min_stock}
                      onChange={(e) => setNewItem({ ...newItem, min_stock: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_stock">Estoque Máximo</Label>
                    <Input
                      id="max_stock"
                      type="number"
                      value={newItem.max_stock}
                      onChange={(e) => setNewItem({ ...newItem, max_stock: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost_per_unit">Custo por Unidade</Label>
                    <Input
                      id="cost_per_unit"
                      type="number"
                      step="0.01"
                      value={newItem.cost_per_unit}
                      onChange={(e) => setNewItem({ ...newItem, cost_per_unit: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Fornecedor</Label>
                    <Input
                      id="supplier"
                      value={newItem.supplier}
                      onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                      placeholder="Nome do fornecedor"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={addStockItem} className="flex-1">
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total de Itens</p>
                <p className="text-2xl font-bold text-blue-900">{stockItems.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Estoque Baixo</p>
                <p className="text-2xl font-bold text-red-900">{lowStockItems.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Categorias</p>
                <p className="text-2xl font-bold text-green-900">{categories.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Valor Total</p>
                <p className="text-2xl font-bold text-purple-900">
                  R$ {totalValue.toFixed(2)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const status = getStockStatus(item.current_stock, item.min_stock, item.max_stock);
          return (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                  <Badge className={`${status.color} text-white flex items-center gap-1`}>
                    {status.icon}
                    {status.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estoque Atual:</span>
                  <span className="font-bold">{item.current_stock} {item.unit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mínimo:</span>
                  <span className="text-sm">{item.min_stock} {item.unit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Máximo:</span>
                  <span className="text-sm">{item.max_stock} {item.unit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Custo/Unidade:</span>
                  <span className="text-sm font-medium">R$ {item.cost_per_unit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Valor Total:</span>
                  <span className="text-sm font-bold text-green-600">
                    R$ {(item.current_stock * item.cost_per_unit).toFixed(2)}
                  </span>
                </div>
                {item.supplier && (
                  <div className="text-xs text-gray-500">
                    Fornecedor: {item.supplier}
                  </div>
                )}
                <div className="pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.current_stock <= item.min_stock ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min((item.current_stock / item.max_stock) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nenhum item encontrado
            </h3>
            <p className="text-gray-600">
              {filterCategory === 'all' 
                ? 'Não há itens no estoque' 
                : `Não há itens na categoria "${filterCategory}"`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
