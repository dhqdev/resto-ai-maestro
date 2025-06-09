import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  Eye, 
  EyeOff,
  Search,
  Filter
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'waiter' | 'kitchen' | 'cashier';
  status: 'active' | 'inactive';
  lastLogin: string;
  permissions: string[];
  createdAt: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: '001',
      name: 'João Silva',
      email: 'joao@restaurante.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-06-06 14:30',
      permissions: ['all'],
      createdAt: '2024-01-15'
    },
    {
      id: '002',
      name: 'Maria Santos',
      email: 'maria@restaurante.com',
      role: 'manager',
      status: 'active',
      lastLogin: '2024-06-06 13:45',
      permissions: ['orders', 'tables', 'reports'],
      createdAt: '2024-02-20'
    },
    {
      id: '003',
      name: 'Carlos Oliveira',
      email: 'carlos@restaurante.com',
      role: 'waiter',
      status: 'active',
      lastLogin: '2024-06-06 14:15',
      permissions: ['orders', 'tables'],
      createdAt: '2024-03-10'
    },
    {
      id: '004',
      name: 'Ana Costa',
      email: 'ana@restaurante.com',
      role: 'kitchen',
      status: 'active',
      lastLogin: '2024-06-06 12:30',
      permissions: ['orders'],
      createdAt: '2024-03-15'
    },
    {
      id: '005',
      name: 'Bruno Lima',
      email: 'bruno@restaurante.com',
      role: 'cashier',
      status: 'inactive',
      lastLogin: '2024-06-05 18:00',
      permissions: ['payments', 'reports'],
      createdAt: '2024-04-01'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'waiter' as User['role'],
    password: '',
    permissions: [] as string[]
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'manager': return 'bg-blue-500';
      case 'waiter': return 'bg-green-500';
      case 'kitchen': return 'bg-orange-500';
      case 'cashier': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'waiter': return 'Garçom';
      case 'kitchen': return 'Cozinha';
      case 'cashier': return 'Caixa';
      default: return role;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-500' : 'bg-gray-500';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? 'Ativo' : 'Inativo';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = () => {
    const user: User = {
      id: (users.length + 1).toString().padStart(3, '0'),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'active',
      lastLogin: 'Nunca',
      permissions: newUser.permissions,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers([...users, user]);
    setNewUser({ name: '', email: '', role: 'waiter', password: '', permissions: [] });
    setIsCreateDialogOpen(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
      setEditingUser(null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ));
  };

  const availablePermissions = [
    { id: 'orders', label: 'Gestão de Pedidos' },
    { id: 'tables', label: 'Controle de Mesas' },
    { id: 'stock', label: 'Gestão de Estoque' },
    { id: 'reports', label: 'Relatórios' },
    { id: 'payments', label: 'Pagamentos' },
    { id: 'users', label: 'Gestão de Usuários' },
    { id: 'settings', label: 'Configurações' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600">
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Digite o nome completo"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Digite o email"
                />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Digite a senha"
                />
              </div>
              <div>
                <Label htmlFor="role">Função</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value as User['role'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="waiter">Garçom</SelectItem>
                    <SelectItem value="kitchen">Cozinha</SelectItem>
                    <SelectItem value="cashier">Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Permissões</Label>
                <div className="space-y-2 mt-2">
                  {availablePermissions.map(permission => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Switch
                        checked={newUser.permissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewUser({
                              ...newUser,
                              permissions: [...newUser.permissions, permission.id]
                            });
                          } else {
                            setNewUser({
                              ...newUser,
                              permissions: newUser.permissions.filter(p => p !== permission.id)
                            });
                          }
                        }}
                      />
                      <Label className="text-sm">{permission.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateUser} className="w-full">
                Criar Usuário
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
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as funções</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="manager">Gerente</SelectItem>
            <SelectItem value="waiter">Garçom</SelectItem>
            <SelectItem value="kitchen">Cozinha</SelectItem>
            <SelectItem value="cashier">Caixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={`${getRoleColor(user.role)} text-white`}>
                    {getRoleText(user.role)}
                  </Badge>
                  <Badge className={`${getStatusColor(user.status)} text-white`}>
                    {getStatusText(user.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p className="text-gray-600">Último acesso:</p>
                <p className="font-medium">{user.lastLogin}</p>
              </div>
              
              <div className="text-sm">
                <p className="text-gray-600">Criado em:</p>
                <p className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="text-sm">
                <p className="text-gray-600 mb-2">Permissões:</p>
                <div className="flex flex-wrap gap-1">
                  {user.permissions.includes('all') ? (
                    <Badge variant="outline\" className="text-xs">Todas</Badge>
                  ) : (
                    user.permissions.map(permission => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {availablePermissions.find(p => p.id === permission)?.label}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditUser(user)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleUserStatus(user.id)}
                  className="flex-1"
                >
                  {user.status === 'active' ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Ativar
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteUser(user.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome Completo</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Função</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value) => setEditingUser({ ...editingUser, role: value as User['role'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="waiter">Garçom</SelectItem>
                    <SelectItem value="kitchen">Cozinha</SelectItem>
                    <SelectItem value="cashier">Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Permissões</Label>
                <div className="space-y-2 mt-2">
                  {availablePermissions.map(permission => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Switch
                        checked={editingUser.permissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditingUser({
                              ...editingUser,
                              permissions: [...editingUser.permissions, permission.id]
                            });
                          } else {
                            setEditingUser({
                              ...editingUser,
                              permissions: editingUser.permissions.filter(p => p !== permission.id)
                            });
                          }
                        }}
                      />
                      <Label className="text-sm">{permission.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleUpdateUser} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {filteredUsers.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nenhum usuário encontrado
            </h3>
            <p className="text-gray-600">
              Ajuste os filtros ou crie um novo usuário
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};