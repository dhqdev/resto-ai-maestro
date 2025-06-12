import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Package, AlertTriangle, TrendingDown, ShoppingCart, Truck, Plus, Edit, Trash2, Search } from 'lucide-react';

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
  created_at: string;
}

export const StockManagement = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setStockItems(data || []);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      toast.error('Erro ao carregar estoque');
    }
  };

  const getStockStatus = (item: StockItem) => {
    const percentage = (item.current_stock / item.max_stock) * 100;
    if (item.current_stock <= item.min_stock) return 'critical';
    if (percentage <= 30) return 'low';
    if (percentage <= 70) return 'medium';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'low': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'good': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'critical': return 'Crítico';
      case 'low': return 'Baixo';
      case 'medium': return 'Médio';
      case 'good': return 'Bom';
      default: return status;
    }
  };

  const getDaysUntilEmpty = (item: StockItem) => {
    if (item.consumption_rate <= 0) return Infinity;
    return Math.floor(item.current_stock / item.consumption_rate);
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredStock = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || getStockStatus(item) === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateItem = async () => {
    if (!newItem.name || !newItem.category) {
      toast.error('Nome e categoria são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('stock_items')
        .insert([{
          ...newItem,
          last_restocked: new Date().toISOString()
        }]);

      if (error) throw error;

      await fetchStockItems();
      toast.success('Item adicionado ao estoque!');
      setIsCreateDialogOpen(false);
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
    } catch (error) {
      console.error('Error creating stock item:', error);
      toast.error('Erro ao adicionar item');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('stock_items')
        .update(editingItem)
        .eq('id', editingItem.id);

      if (error) throw error;

      await fetchStockItems();
      toast.success('Item atualizado!');
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating stock item:', error);
      toast.error('Erro ao atualizar item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await fetchStockItems();
      toast.success('Item removido do estoque!');
    } catch (error) {
      console.error('Error deleting stock item:', error);
      toast.error('Erro ao remover item');
    } finally {
      setLoading(false);
    }
  };

  const restockItem = async (itemId: string, quantity: number) => {
    setLoading(true);
    try {
      const item = stockItems.find(i => i.id === itemId);
      if (!item) return;

      const { error } = await supabase
        .from('stock_items')
        .update({
          current_stock: item.current_stock + quantity,
          last_restocked: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      await fetchStockItems();
      toast.success('Estoque reabastecido!');
    } catch (error) {
      console.error('Error restocking item:', error);
      toast.error('Erro ao reabastecer');
    } finally {
      setLoading(false);
    }
  };

  const criticalItems = stockItems.filter(item => getStockStatus(item) === 'critical');
  const lowItems = stockItems.filter(item => getStockStatus(item) === 'low');
  const expiringItems = stockItems.filter(item => {
    if (!item.expiry_date) return false;
    const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date);
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  });

  const categories = [...new Set(stockItems.map(item => item.category))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Estoque</h2>
        <div className="flex gap-3">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Novo Item</span>
                <span className="md:hidden">Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
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
                      step="0.01"
                      value={newItem.current_stock}
                      onChange={(e) => setNewItem({ ...newItem, current_stock: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unidade</Label>
                    <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="g">Gramas</SelectItem>
                        <SelectItem value="l">Litros</SelectItem>
                        <SelectItem value="ml">ML</SelectItem>
                        <SelectItem value="unidades">Unidades</SelectItem>
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
                      step="0.01"
                      value={newItem.min_stock}
                      onChange={(e) => setNewItem({ ...newItem, min_stock: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_stock">Estoque Máximo</Label>
                    <Input
                      id="max_stock"
                      type="number"
                      step="0.01"
                      value={newItem.max_stock}
                      onChange={(e) => setNewItem({ ...newItem, max_stock: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => setNewItem({ ...newItem, cost_per_unit: parseFloat(e.target.value) || 0 })}
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
                <div>
                  <Label htmlFor="expiry_date">Data de Vencimento</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={newItem.expiry_date}
                    onChange={(e) => setNewItem({ ...newItem, expiry_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="consumption_rate">Taxa de Consumo (por dia)</Label>
                  <Input
                    id="consumption_rate"
                    type="number"
                    step="0.01"
                    value={newItem.consumption_rate}
                    onChange={(e) => setNewItem({ ...newItem, consumption_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Button onClick={handleCreateItem} disabled={loading} className="w-full">
                  {loading ? 'Adicionando...' : 'Adicionar Item'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar itens do estoque..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="critical">Crítico</SelectItem>
            <SelectItem value="low">Baixo</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="good">Bom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alert Cards */}
      {(criticalItems.length > 0 || lowItems.length > 0 || expiringItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {criticalItems.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Estoque Crítico ({criticalItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {criticalItems.slice(0, 3).map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-red-600">
                        {item.current_stock} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
                <Button size="sm" className="w-full mt-3 bg-red-500 hover:bg-red-600">
                  Reabastecer Agora
                </Button>
              </CardContent>
            </Card>
          )}

          {lowItems.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-800 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Estoque Baixo ({lowItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowItems.slice(0, 3).map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-orange-600">
                        {item.current_stock} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="w-full mt-3">
                  Programar Compra
                </Button>
              </CardContent>
            </Card>
          )}

          {expiringItems.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Vencendo ({expiringItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringItems.slice(0, 3).map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-yellow-600">
                        {getDaysUntilExpiry(item.expiry_date)} dias
                      </span>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="w-full mt-3">
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stock Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStock.map((item) => {
          const status = getStockStatus(item);
          const stockPercentage = (item.current_stock / item.max_stock) * 100;
          const daysUntilEmpty = getDaysUntilEmpty(item);
          const daysUntilExpiry = item.expiry_date ? getDaysUntilExpiry(item.expiry_date) : null;

          return (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{item.category}</p>
                  </div>
                  <Badge className={`${getStatusColor(status)} text-white`}>
                    {getStatusText(status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Estoque Atual</span>
                    <span className="text-lg font-bold">
                      {item.current_stock} {item.unit}
                    </span>
                  </div>
                  <Progress value={stockPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Min: {item.min_stock}</span>
                    <span>Máx: {item.max_stock}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Custo unitário:</p>
                    <p className="font-medium">R$ {item.cost_per_unit.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Consumo/dia:</p>
                    <p className="font-medium">{item.consumption_rate} {item.unit}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-gray-600">Fornecedor:</p>
                  <p className="font-medium">{item.supplier || 'Não informado'}</p>
                </div>

                {item.expiry_date && (
                  <div className="text-sm">
                    <p className="text-gray-600">Vencimento:</p>
                    <p className={`font-medium ${daysUntilExpiry && daysUntilExpiry <= 7 ? 'text-red-600' : ''}`}>
                      {new Date(item.expiry_date).toLocaleDateString('pt-BR')}
                      {daysUntilExpiry !== null && (
                        <span className="ml-2">
                          ({daysUntilExpiry > 0 ? `${daysUntilExpiry} dias` : 'Vencido'})
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-600">Previsão de esgotamento:</span>
                  </div>
                  <p className="font-bold text-lg mt-1">
                    {daysUntilEmpty === Infinity ? 'N/A' : `${daysUntilEmpty} dias`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setEditingItem(item)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                    onClick={() => {
                      const quantity = prompt('Quantidade a adicionar:');
                      if (quantity && !isNaN(Number(quantity))) {
                        restockItem(item.id, Number(quantity));
                      }
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Reabastecer
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Item Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Item do Estoque</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome do Item</Label>
                <Input
                  id="edit-name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Categoria</Label>
                <Input
                  id="edit-category"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-current">Estoque Atual</Label>
                  <Input
                    id="edit-current"
                    type="number"
                    step="0.01"
                    value={editingItem.current_stock}
                    onChange={(e) => setEditingItem({ ...editingItem, current_stock: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-unit">Unidade</Label>
                  <Select 
                    value={editingItem.unit} 
                    onValueChange={(value) => setEditingItem({ ...editingItem, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kg</SelectItem>
                      <SelectItem value="g">Gramas</SelectItem>
                      <SelectItem value="l">Litros</SelectItem>
                      <SelectItem value="ml">ML</SelectItem>
                      <SelectItem value="unidades">Unidades</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-min">Estoque Mínimo</Label>
                  <Input
                    id="edit-min"
                    type="number"
                    step="0.01"
                    value={editingItem.min_stock}
                    onChange={(e) => setEditingItem({ ...editingItem, min_stock: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-max">Estoque Máximo</Label>
                  <Input
                    id="edit-max"
                    type="number"
                    step="0.01"
                    value={editingItem.max_stock}
                    onChange={(e) => setEditingItem({ ...editingItem, max_stock: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-cost">Custo por Unidade (R$)</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  step="0.01"
                  value={editingItem.cost_per_unit}
                  onChange={(e) => setEditingItem({ ...editingItem, cost_per_unit: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit-supplier">Fornecedor</Label>
                <Input
                  id="edit-supplier"
                  value={editingItem.supplier}
                  onChange={(e) => setEditingItem({ ...editingItem, supplier: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-expiry">Data de Vencimento</Label>
                <Input
                  id="edit-expiry"
                  type="date"
                  value={editingItem.expiry_date}
                  onChange={(e) => setEditingItem({ ...editingItem, expiry_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-consumption">Taxa de Consumo (por dia)</Label>
                <Input
                  id="edit-consumption"
                  type="number"
                  step="0.01"
                  value={editingItem.consumption_rate}
                  onChange={(e) => setEditingItem({ ...editingItem, consumption_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <Button onClick={handleUpdateItem} disabled={loading} className="w-full">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {filteredStock.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nenhum item encontrado
            </h3>
            <p className="text-gray-600">
              Ajuste os filtros ou adicione novos itens ao estoque
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};