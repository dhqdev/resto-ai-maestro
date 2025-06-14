
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  Package, 
  Calendar,
  TrendingDown,
  Filter,
  Edit,
  Trash2
} from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    current_stock: 0,
    min_stock: 0,
    max_stock: 100,
    unit: 'kg',
    cost_per_unit: 0,
    supplier: '',
    expiry_date: '',
    consumption_rate: 0
  });

  const categories = [
    'Carnes', 'Vegetais', 'Laticínios', 'Grãos', 'Temperos', 
    'Bebidas', 'Limpeza', 'Descartáveis', 'Outros'
  ];

  const units = ['kg', 'g', 'L', 'ml', 'unidade', 'caixa', 'pacote'];

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
        console.error('Supabase error:', error);
        throw error;
      }

      const stockData: StockItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        current_stock: Number(item.current_stock) || 0,
        min_stock: Number(item.min_stock) || 0,
        max_stock: Number(item.max_stock) || 100,
        unit: item.unit,
        cost_per_unit: Number(item.cost_per_unit) || 0,
        supplier: item.supplier || '',
        expiry_date: item.expiry_date || '',
        last_restocked: item.last_restocked || '',
        consumption_rate: Number(item.consumption_rate) || 0
      }));

      setStockItems(stockData);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar itens do estoque",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
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
          ...newItem,
          last_restocked: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item adicionado ao estoque",
      });

      setIsAddDialogOpen(false);
      resetForm();
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

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('stock_items')
        .update(editingItem)
        .eq('id', editingItem.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso",
      });

      setEditingItem(null);
      fetchStockItems();
    } catch (error) {
      console.error('Error updating stock item:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar item",
        variant: "destructive"
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item removido do estoque",
      });

      fetchStockItems();
    } catch (error) {
      console.error('Error deleting stock item:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover item",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setNewItem({
      name: '',
      category: '',
      current_stock: 0,
      min_stock: 0,
      max_stock: 100,
      unit: 'kg',
      cost_per_unit: 0,
      supplier: '',
      expiry_date: '',
      consumption_rate: 0
    });
  };

  const getStockStatus = (item: StockItem) => {
    if (item.current_stock <= item.min_stock) {
      return { status: 'low', color: 'bg-red-500', text: 'Estoque Baixo' };
    }
    if (item.current_stock >= item.max_stock) {
      return { status: 'high', color: 'bg-yellow-500', text: 'Estoque Alto' };
    }
    return { status: 'normal', color: 'bg-green-500', text: 'Normal' };
  };

  const getDaysToExpiry = (expiryDate: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'low') {
      matchesStatus = item.current_stock <= item.min_stock;
    } else if (statusFilter === 'expiring') {
      const days = getDaysToExpiry(item.expiry_date);
      matchesStatus = days !== null && days <= 7;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockCount = stockItems.filter(item => item.current_stock <= item.min_stock).length;
  const expiringCount = stockItems.filter(item => {
    const days = getDaysToExpiry(item.expiry_date);
    return days !== null && days <= 7;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">📦 Gestão de Estoque</h2>
          <p className="text-gray-600 mt-1">
            {stockItems.length} itens • {lowStockCount} com estoque baixo • {expiringCount} próximos do vencimento
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
        </Button>
      </div>

      {/* Alertas */}
      {(lowStockCount > 0 || expiringCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockCount > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <h3 className="font-semibold text-red-800">Estoque Baixo</h3>
                    <p className="text-sm text-red-600">{lowStockCount} itens precisam de reposição</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {expiringCount > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-orange-500" />
                  <div>
                    <h3 className="font-semibold text-orange-800">Próximos ao Vencimento</h3>
                    <p className="text-sm text-orange-600">{expiringCount} itens vencem em 7 dias</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="low">Estoque baixo</SelectItem>
                <SelectItem value="expiring">Próximos ao vencimento</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline"
              onClick={fetchStockItems}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Itens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const stockStatus = getStockStatus(item);
          const daysToExpiry = getDaysToExpiry(item.expiry_date);
          
          return (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estoque atual:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{item.current_stock} {item.unit}</span>
                    <Badge className={`${stockStatus.color} text-white text-xs`}>
                      {stockStatus.text}
                    </Badge>
                  </div>
                </div>

                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mínimo:</span>
                    <span>{item.min_stock} {item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Máximo:</span>
                    <span>{item.max_stock} {item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Custo unitário:</span>
                    <span className="font-medium">R$ {item.cost_per_unit.toFixed(2)}</span>
                  </div>
                </div>

                {item.supplier && (
                  <div className="text-xs text-gray-500">
                    Fornecedor: {item.supplier}
                  </div>
                )}

                {daysToExpiry !== null && (
                  <div className={`text-xs p-2 rounded ${
                    daysToExpiry <= 3 ? 'bg-red-100 text-red-800' :
                    daysToExpiry <= 7 ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {daysToExpiry <= 0 ? 'Vencido!' :
                     daysToExpiry === 1 ? 'Vence amanhã' :
                     `Vence em ${daysToExpiry} dias`}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nenhum item encontrado
            </h3>
            <p className="text-gray-600">
              {stockItems.length === 0 
                ? 'Comece adicionando itens ao seu estoque'
                : 'Tente ajustar os filtros de busca'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog para Adicionar Item */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>➕ Adicionar Novo Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Item</Label>
              <Input
                id="name"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                placeholder="Nome do item"
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={newItem.category} onValueChange={(value) => setNewItem({...newItem, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="current_stock">Estoque Atual</Label>
                <Input
                  id="current_stock"
                  type="number"
                  value={newItem.current_stock}
                  onChange={(e) => setNewItem({...newItem, current_stock: Number(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="unit">Unidade</Label>
                <Select value={newItem.unit} onValueChange={(value) => setNewItem({...newItem, unit: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="min_stock">Estoque Mínimo</Label>
                <Input
                  id="min_stock"
                  type="number"
                  value={newItem.min_stock}
                  onChange={(e) => setNewItem({...newItem, min_stock: Number(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="max_stock">Estoque Máximo</Label>
                <Input
                  id="max_stock"
                  type="number"
                  value={newItem.max_stock}
                  onChange={(e) => setNewItem({...newItem, max_stock: Number(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cost_per_unit">Custo por Unidade (R$)</Label>
              <Input
                id="cost_per_unit"
                type="number"
                step="0.01"
                value={newItem.cost_per_unit}
                onChange={(e) => setNewItem({...newItem, cost_per_unit: Number(e.target.value)})}
              />
            </div>

            <div>
              <Label htmlFor="supplier">Fornecedor</Label>
              <Input
                id="supplier"
                value={newItem.supplier}
                onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                placeholder="Nome do fornecedor"
              />
            </div>

            <div>
              <Label htmlFor="expiry_date">Data de Validade</Label>
              <Input
                id="expiry_date"
                type="date"
                value={newItem.expiry_date}
                onChange={(e) => setNewItem({...newItem, expiry_date: e.target.value})}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleAddItem} className="flex-1 bg-green-500 hover:bg-green-600">
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Item */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>✏️ Editar Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_name">Nome do Item</Label>
                <Input
                  id="edit_name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="edit_current_stock">Estoque Atual</Label>
                <Input
                  id="edit_current_stock"
                  type="number"
                  value={editingItem.current_stock}
                  onChange={(e) => setEditingItem({...editingItem, current_stock: Number(e.target.value)})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit_min_stock">Estoque Mínimo</Label>
                  <Input
                    id="edit_min_stock"
                    type="number"
                    value={editingItem.min_stock}
                    onChange={(e) => setEditingItem({...editingItem, min_stock: Number(e.target.value)})}
                  />
                </div>

                <div>
                  <Label htmlFor="edit_max_stock">Estoque Máximo</Label>
                  <Input
                    id="edit_max_stock"
                    type="number"
                    value={editingItem.max_stock}
                    onChange={(e) => setEditingItem({...editingItem, max_stock: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_cost_per_unit">Custo por Unidade (R$)</Label>
                <Input
                  id="edit_cost_per_unit"
                  type="number"
                  step="0.01"
                  value={editingItem.cost_per_unit}
                  onChange={(e) => setEditingItem({...editingItem, cost_per_unit: Number(e.target.value)})}
                />
              </div>

              <div>
                <Label htmlFor="edit_expiry_date">Data de Validade</Label>
                <Input
                  id="edit_expiry_date"
                  type="date"
                  value={editingItem.expiry_date}
                  onChange={(e) => setEditingItem({...editingItem, expiry_date: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditingItem(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleUpdateItem} className="flex-1 bg-blue-500 hover:bg-blue-600">
                  Atualizar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
