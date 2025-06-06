
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, AlertTriangle, TrendingDown, ShoppingCart, Truck } from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  category: 'food' | 'beverage' | 'packaging' | 'cleaning';
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  cost: number;
  supplier: string;
  lastRestocked: string;
  consumptionRate: number; // units per day
}

export const StockManagement = () => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const mockStock: StockItem[] = [
    {
      id: '001',
      name: 'Massa para Pizza',
      category: 'food',
      currentStock: 15,
      minStock: 20,
      maxStock: 100,
      unit: 'kg',
      cost: 8.50,
      supplier: 'Fornecedor ABC',
      lastRestocked: '2024-06-05',
      consumptionRate: 12
    },
    {
      id: '002',
      name: 'Queijo Mussarela',
      category: 'food',
      currentStock: 5,
      minStock: 10,
      maxStock: 50,
      unit: 'kg',
      cost: 28.90,
      supplier: 'Laticínios XYZ',
      lastRestocked: '2024-06-04',
      consumptionRate: 8
    },
    {
      id: '003',
      name: 'Coca-Cola 2L',
      category: 'beverage',
      currentStock: 48,
      minStock: 24,
      maxStock: 120,
      unit: 'unidades',
      cost: 6.20,
      supplier: 'Bebidas Ltda',
      lastRestocked: '2024-06-06',
      consumptionRate: 15
    },
    {
      id: '004',
      name: 'Caixas de Pizza',
      category: 'packaging',
      currentStock: 200,
      minStock: 100,
      maxStock: 500,
      unit: 'unidades',
      cost: 1.20,
      supplier: 'Embalagens Pro',
      lastRestocked: '2024-06-05',
      consumptionRate: 25
    },
    {
      id: '005',
      name: 'Detergente',
      category: 'cleaning',
      currentStock: 3,
      minStock: 5,
      maxStock: 20,
      unit: 'litros',
      cost: 12.50,
      supplier: 'Limpeza Total',
      lastRestocked: '2024-06-03',
      consumptionRate: 2
    }
  ];

  const getStockStatus = (item: StockItem) => {
    const percentage = (item.currentStock / item.maxStock) * 100;
    if (item.currentStock <= item.minStock) return 'critical';
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return '🍕';
      case 'beverage': return '🥤';
      case 'packaging': return '📦';
      case 'cleaning': return '🧽';
      default: return '📦';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'food': return 'Alimentos';
      case 'beverage': return 'Bebidas';
      case 'packaging': return 'Embalagens';
      case 'cleaning': return 'Limpeza';
      default: return category;
    }
  };

  const getDaysUntilEmpty = (item: StockItem) => {
    return Math.floor(item.currentStock / item.consumptionRate);
  };

  const filteredStock = mockStock.filter(item => {
    const categoryMatch = filterCategory === 'all' || item.category === filterCategory;
    const statusMatch = filterStatus === 'all' || getStockStatus(item) === filterStatus;
    return categoryMatch && statusMatch;
  });

  const criticalItems = mockStock.filter(item => getStockStatus(item) === 'critical');
  const lowItems = mockStock.filter(item => getStockStatus(item) === 'low');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Estoque</h2>
        <div className="flex gap-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              <SelectItem value="food">Alimentos</SelectItem>
              <SelectItem value="beverage">Bebidas</SelectItem>
              <SelectItem value="packaging">Embalagens</SelectItem>
              <SelectItem value="cleaning">Limpeza</SelectItem>
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
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600">
            <Truck className="h-4 w-4 mr-2" />
            Gerar Pedido
          </Button>
        </div>
      </div>

      {/* Alert Cards */}
      {(criticalItems.length > 0 || lowItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criticalItems.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Estoque Crítico ({criticalItems.length} itens)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {criticalItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-red-600">
                        {item.currentStock} {item.unit}
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
                  Estoque Baixo ({lowItems.length} itens)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-orange-600">
                        {item.currentStock} {item.unit}
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
        </div>
      )}

      {/* Stock Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStock.map((item) => {
          const status = getStockStatus(item);
          const stockPercentage = (item.currentStock / item.maxStock) * 100;
          const daysUntilEmpty = getDaysUntilEmpty(item);

          return (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                      {item.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {getCategoryText(item.category)}
                    </p>
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
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <Progress value={stockPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Min: {item.minStock}</span>
                    <span>Máx: {item.maxStock}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Custo unitário:</p>
                    <p className="font-medium">R$ {item.cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Consumo/dia:</p>
                    <p className="font-medium">{item.consumptionRate} {item.unit}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-gray-600">Fornecedor:</p>
                  <p className="font-medium">{item.supplier}</p>
                </div>

                <div className="text-sm">
                  <p className="text-gray-600">Último reabastecimento:</p>
                  <p className="font-medium">
                    {new Date(item.lastRestocked).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-600">Previsão de esgotamento:</span>
                  </div>
                  <p className="font-bold text-lg mt-1">
                    {daysUntilEmpty} dias
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Comprar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredStock.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nenhum item encontrado
            </h3>
            <p className="text-gray-600">
              Ajuste os filtros para ver outros itens do estoque
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
