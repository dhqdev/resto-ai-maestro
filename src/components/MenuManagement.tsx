import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  UtensilsCrossed, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Search,
  Filter,
  Star,
  Clock,
  DollarSign
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  preparationTime: number;
  ingredients: string[];
  allergens: string[];
  calories?: number;
  rating: number;
  popularity: number;
  createdAt: string;
}

export const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: '001',
      name: 'Pizza Margherita',
      description: 'Pizza tradicional com molho de tomate, mussarela e manjericão fresco',
      price: 32.90,
      category: 'pizzas',
      available: true,
      preparationTime: 25,
      ingredients: ['Massa de pizza', 'Molho de tomate', 'Mussarela', 'Manjericão', 'Azeite'],
      allergens: ['Glúten', 'Lactose'],
      calories: 280,
      rating: 4.8,
      popularity: 95,
      createdAt: '2024-01-15'
    },
    {
      id: '002',
      name: 'Hambúrguer Artesanal',
      description: 'Hambúrguer 180g, queijo cheddar, alface, tomate, cebola caramelizada',
      price: 28.50,
      category: 'hamburguers',
      available: true,
      preparationTime: 15,
      ingredients: ['Pão brioche', 'Carne 180g', 'Queijo cheddar', 'Alface', 'Tomate', 'Cebola'],
      allergens: ['Glúten', 'Lactose'],
      calories: 520,
      rating: 4.6,
      popularity: 88,
      createdAt: '2024-02-01'
    },
    {
      id: '003',
      name: 'Salada Caesar',
      description: 'Alface romana, croutons, parmesão, molho caesar e peito de frango grelhado',
      price: 24.90,
      category: 'saladas',
      available: true,
      preparationTime: 10,
      ingredients: ['Alface romana', 'Frango grelhado', 'Croutons', 'Parmesão', 'Molho caesar'],
      allergens: ['Lactose', 'Ovos'],
      calories: 320,
      rating: 4.4,
      popularity: 72,
      createdAt: '2024-02-10'
    },
    {
      id: '004',
      name: 'Pasta Carbonara',
      description: 'Espaguete com bacon, ovos, parmesão e pimenta do reino',
      price: 26.90,
      category: 'massas',
      available: false,
      preparationTime: 20,
      ingredients: ['Espaguete', 'Bacon', 'Ovos', 'Parmesão', 'Pimenta do reino'],
      allergens: ['Glúten', 'Lactose', 'Ovos'],
      calories: 450,
      rating: 4.7,
      popularity: 85,
      createdAt: '2024-01-20'
    },
    {
      id: '005',
      name: 'Coca-Cola 350ml',
      description: 'Refrigerante Coca-Cola gelado',
      price: 6.50,
      category: 'bebidas',
      available: true,
      preparationTime: 2,
      ingredients: ['Coca-Cola'],
      allergens: [],
      calories: 140,
      rating: 4.2,
      popularity: 90,
      createdAt: '2024-01-10'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    preparationTime: 0,
    ingredients: '',
    allergens: '',
    calories: 0
  });

  const categories = [
    { id: 'pizzas', name: 'Pizzas' },
    { id: 'hamburguers', name: 'Hambúrguers' },
    { id: 'saladas', name: 'Saladas' },
    { id: 'massas', name: 'Massas' },
    { id: 'bebidas', name: 'Bebidas' },
    { id: 'sobremesas', name: 'Sobremesas' },
    { id: 'entradas', name: 'Entradas' }
  ];

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || categoryId;
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesAvailability = filterAvailability === 'all' || 
                               (filterAvailability === 'available' && item.available) ||
                               (filterAvailability === 'unavailable' && !item.available);
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const handleCreateItem = () => {
    const item: MenuItem = {
      id: (menuItems.length + 1).toString().padStart(3, '0'),
      name: newItem.name,
      description: newItem.description,
      price: newItem.price,
      category: newItem.category,
      available: true,
      preparationTime: newItem.preparationTime,
      ingredients: newItem.ingredients.split(',').map(i => i.trim()),
      allergens: newItem.allergens.split(',').map(a => a.trim()).filter(a => a),
      calories: newItem.calories,
      rating: 0,
      popularity: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setMenuItems([...menuItems, item]);
    setNewItem({
      name: '',
      description: '',
      price: 0,
      category: '',
      preparationTime: 0,
      ingredients: '',
      allergens: '',
      calories: 0
    });
    setIsCreateDialogOpen(false);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
  };

  const handleUpdateItem = () => {
    if (editingItem) {
      setMenuItems(menuItems.map(item => item.id === editingItem.id ? editingItem : item));
      setEditingItem(null);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setMenuItems(menuItems.filter(item => item.id !== itemId));
  };

  const toggleAvailability = (itemId: string) => {
    setMenuItems(menuItems.map(item => 
      item.id === itemId 
        ? { ...item, available: !item.available }
        : item
    ));
  };

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 80) return 'text-green-600';
    if (popularity >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Gestão do Cardápio</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-red-500">
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Item ao Cardápio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Item</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Ex: Pizza Margherita"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Descreva os ingredientes e características do prato"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="prep-time">Tempo de Preparo (min)</Label>
                  <Input
                    id="prep-time"
                    type="number"
                    value={newItem.preparationTime}
                    onChange={(e) => setNewItem({ ...newItem, preparationTime: parseInt(e.target.value) || 0 })}
                    placeholder="15"
                  />
                </div>
                <div>
                  <Label htmlFor="calories">Calorias</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={newItem.calories}
                    onChange={(e) => setNewItem({ ...newItem, calories: parseInt(e.target.value) || 0 })}
                    placeholder="250"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ingredients">Ingredientes (separados por vírgula)</Label>
                <Textarea
                  id="ingredients"
                  value={newItem.ingredients}
                  onChange={(e) => setNewItem({ ...newItem, ingredients: e.target.value })}
                  placeholder="Massa de pizza, molho de tomate, mussarela, manjericão"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="allergens">Alérgenos (separados por vírgula)</Label>
                <Input
                  id="allergens"
                  value={newItem.allergens}
                  onChange={(e) => setNewItem({ ...newItem, allergens: e.target.value })}
                  placeholder="Glúten, Lactose"
                />
              </div>

              <Button onClick={handleCreateItem} className="w-full">
                Adicionar ao Cardápio
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar itens do cardápio..."
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
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAvailability} onValueChange={setFilterAvailability}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Disponibilidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="available">Disponível</SelectItem>
            <SelectItem value="unavailable">Indisponível</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {item.name}
                    {!item.available && (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        Indisponível
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>
                <Badge className="bg-orange-100 text-orange-800">
                  {getCategoryName(item.category)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold text-green-600">
                  R$ {item.price.toFixed(2)}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {item.preparationTime}min
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {item.rating.toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="text-sm">
                <p className="text-gray-600 mb-1">Popularidade:</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.popularity}%` }}
                    ></div>
                  </div>
                  <span className={`font-medium ${getPopularityColor(item.popularity)}`}>
                    {item.popularity}%
                  </span>
                </div>
              </div>

              {item.allergens.length > 0 && (
                <div className="text-sm">
                  <p className="text-gray-600 mb-1">Alérgenos:</p>
                  <div className="flex flex-wrap gap-1">
                    {item.allergens.map(allergen => (
                      <Badge key={allergen} variant="outline" className="text-xs text-red-600 border-red-200">
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm">
                <p className="text-gray-600">Ingredientes principais:</p>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {item.ingredients.slice(0, 3).join(', ')}
                  {item.ingredients.length > 3 && '...'}
                </p>
              </div>

              {item.calories && (
                <div className="text-sm">
                  <p className="text-gray-600">Calorias: <span className="font-medium">{item.calories} kcal</span></p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditItem(item)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleAvailability(item.id)}
                  className="flex-1"
                >
                  {item.available ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Mostrar
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Item Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Item do Cardápio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Select 
                    value={editingItem.category} 
                    onValueChange={(value) => setEditingItem({ ...editingItem, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-price">Preço (R$)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-prep-time">Tempo de Preparo (min)</Label>
                  <Input
                    id="edit-prep-time"
                    type="number"
                    value={editingItem.preparationTime}
                    onChange={(e) => setEditingItem({ ...editingItem, preparationTime: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-calories">Calorias</Label>
                  <Input
                    id="edit-calories"
                    type="number"
                    value={editingItem.calories || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, calories: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-ingredients">Ingredientes</Label>
                <Textarea
                  id="edit-ingredients"
                  value={editingItem.ingredients.join(', ')}
                  onChange={(e) => setEditingItem({ 
                    ...editingItem, 
                    ingredients: e.target.value.split(',').map(i => i.trim()) 
                  })}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="edit-allergens">Alérgenos</Label>
                <Input
                  id="edit-allergens"
                  value={editingItem.allergens.join(', ')}
                  onChange={(e) => setEditingItem({ 
                    ...editingItem, 
                    allergens: e.target.value.split(',').map(a => a.trim()).filter(a => a) 
                  })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingItem.available}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, available: checked })}
                />
                <Label>Item disponível no cardápio</Label>
              </div>

              <Button onClick={handleUpdateItem} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {filteredItems.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nenhum item encontrado
            </h3>
            <p className="text-gray-600">
              Ajuste os filtros ou adicione novos itens ao cardápio
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
