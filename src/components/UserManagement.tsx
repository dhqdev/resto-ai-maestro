import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Search,
  Loader2
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'master' | 'admin' | 'manager' | 'waiter' | 'kitchen' | 'cashier';
  permissions: { [key: string]: boolean };
  is_active: boolean;
  created_at: string;
}

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const { data: users, isLoading, error } = useQuery<UserProfile[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userToUpdate: Partial<UserProfile> & { id: string }) => {
      const { id, ...updateData } = userToUpdate;
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Usuário atualizado." });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: `Não foi possível atualizar o usuário: ${err.message}`, variant: "destructive" });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string, newStatus: boolean }) => {
      const { error } = await supabase.from('profiles').update({ is_active: newStatus }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Status do usuário atualizado." });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: `Não foi possível atualizar o status: ${err.message}`, variant: "destructive" });
    },
  });
  
  const handleCreateUser = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A criação de usuários será implementada de forma segura em breve.",
    });
    setIsCreateDialogOpen(false);
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      updateUserMutation.mutate(editingUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    toggleUserStatusMutation.mutate({ userId, newStatus: false });
    toast({ title: "Usuário Desativado", description: "Para segurança, o usuário foi desativado em vez de excluído." });
  };

  const toggleUserStatus = (userId: string, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ userId, newStatus: !currentStatus });
  };
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'master': return 'bg-yellow-500';
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
      case 'master': return 'Master';
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'waiter': return 'Garçom';
      case 'kitchen': return 'Cozinha';
      case 'cashier': return 'Caixa';
      default: return role;
    }
  };

  const getStatusColor = (status: boolean) => status ? 'bg-green-500' : 'bg-gray-500';
  const getStatusText = (status: boolean) => status ? 'Ativo' : 'Inativo';

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? user.is_active : !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  const availablePermissions = [
    { id: 'orders', label: 'Gestão de Pedidos' },
    { id: 'tables', label: 'Controle de Mesas' },
    { id: 'stock', label: 'Gestão de Estoque' },
    { id: 'reports', label: 'Relatórios' },
    { id: 'payments', label: 'Pagamentos' },
    { id: 'users', label: 'Gestão de Usuários' },
    { id: 'settings', label: 'Configurações' }
  ];

  if (error) {
    return (
      <Card className="text-center py-12 bg-red-50 border-red-200">
        <CardContent>
          <h3 className="text-xl font-medium text-red-800 mb-2">
            Ocorreu um erro
          </h3>
          <p className="text-red-700">
            Não foi possível carregar os usuários. Tente recarregar a página.
          </p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

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
            <div className="space-y-4 py-4">
               <p className="text-sm text-gray-600">
                 Para adicionar um novo usuário, peça para que ele se cadastre na tela de login. 
                 O perfil será criado automaticamente e você poderá editar as permissões aqui.
               </p>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as funções</SelectItem>
            <SelectItem value="master">Master</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="manager">Gerente</SelectItem>
            <SelectItem value="waiter">Garçom</SelectItem>
            <SelectItem value="kitchen">Cozinha</SelectItem>
            <SelectItem value="cashier">Caixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
         </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers?.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{user.full_name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={`${getRoleColor(user.role)} text-white`}>
                        {getRoleText(user.role)}
                      </Badge>
                      <Badge className={`${getStatusColor(user.is_active)} text-white`}>
                        {getStatusText(user.is_active)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <div className="text-sm flex-1">
                    <p className="text-gray-600 mb-2">Permissões:</p>
                    <div className="flex flex-wrap gap-1">
                      {user.permissions?.all ? (
                        <Badge variant="secondary">Todas</Badge>
                      ) : user.permissions && Object.keys(user.permissions).length > 0 ? (
                        Object.keys(user.permissions)
                          .filter(p => user.permissions[p])
                          .map(permission => (
                          <Badge key={permission} variant="secondary" className="text-xs font-normal">
                            {availablePermissions.find(p => p.id === permission)?.label || permission}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">Nenhuma</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t mt-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingUser(user)}
                      className="flex-1"
                      disabled={updateUserMutation.isPending}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      className="flex-1"
                      disabled={toggleUserStatusMutation.isPending && toggleUserStatusMutation.variables?.userId === user.id}
                    >
                      {user.is_active ? (
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers?.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-gray-600">
                  Ajuste os filtros ou peça para um novo membro se cadastrar.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuário: {editingUser.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Nome Completo</Label>
                <Input
                  id="edit-name"
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Função</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({ ...editingUser, role: value as UserProfile['role'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="master">Master</SelectItem>
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
                <div className="space-y-2 mt-2 rounded-lg border p-4 max-h-60 overflow-y-auto">
                  {availablePermissions.map(permission => (
                    <div key={permission.id} className="flex items-center space-x-3">
                      <Switch
                        id={`perm-${permission.id}`}
                        checked={!!editingUser.permissions?.[permission.id]}
                        onCheckedChange={(checked) => {
                          const newPerms = { ...editingUser.permissions, [permission.id]: checked };
                          setEditingUser({ ...editingUser, permissions: newPerms });
                        }}
                      />
                      <Label htmlFor={`perm-${permission.id}`} className="font-normal text-sm">{permission.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
                <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
