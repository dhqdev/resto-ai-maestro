
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddTableDialog } from './AddTableDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Users, Clock, DollarSign, CheckCircle, AlertCircle, Plus, Trash2, Eye } from 'lucide-react';

interface Table {
  id: string;
  table_number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  position_x: number;
  position_y: number;
}

interface Order {
  id: string;
  table_id: string;
  total_amount: number;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export const TableLayout = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTables();
    fetchOrders();
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_number');

      if (error) throw error;
      
      const tablesData: Table[] = (data || []).map(item => ({
        id: item.id,
        table_number: item.table_number,
        capacity: item.capacity,
        status: item.status as Table['status'],
        position_x: item.position_x,
        position_y: item.position_y
      }));
      
      setTables(tablesData);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar mesas",
        variant: "destructive"
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          table_id,
          total_amount,
          created_at,
          profiles:waiter_id (
            full_name
          )
        `)
        .in('status', ['pending', 'preparing', 'ready']);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const getTableOrder = (tableId: string) => {
    return orders.find(order => order.table_id === tableId);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'available': 
        return { 
          color: 'bg-green-500 border-green-400', 
          text: 'Livre', 
          icon: <CheckCircle className="h-4 w-4" />,
          textColor: 'text-white'
        };
      case 'occupied': 
        return { 
          color: 'bg-red-500 border-red-400', 
          text: 'Ocupada', 
          icon: <Users className="h-4 w-4" />,
          textColor: 'text-white'
        };
      case 'reserved': 
        return { 
          color: 'bg-yellow-500 border-yellow-400', 
          text: 'Reservada', 
          icon: <Clock className="h-4 w-4" />,
          textColor: 'text-white'
        };
      case 'cleaning': 
        return { 
          color: 'bg-blue-500 border-blue-400', 
          text: 'Limpeza', 
          icon: <AlertCircle className="h-4 w-4" />,
          textColor: 'text-white'
        };
      default: 
        return { 
          color: 'bg-gray-500 border-gray-400', 
          text: status, 
          icon: null,
          textColor: 'text-white'
        };
    }
  };

  const deleteTable = async (tableId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);

      if (error) throw error;

      await fetchTables();
      toast({
        title: "Sucesso",
        description: "Mesa removida com sucesso!",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error deleting table:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover mesa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTableStatus = async (tableId: string, newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tables')
        .update({ status: newStatus })
        .eq('id', tableId);

      if (error) throw error;

      await fetchTables();
      toast({
        title: "Sucesso",
        description: "Status da mesa atualizado!",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating table:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar mesa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const closeTable = async (tableId: string) => {
    setLoading(true);
    try {
      await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('table_id', tableId)
        .in('status', ['pending', 'preparing', 'ready']);

      await supabase
        .from('tables')
        .update({ status: 'available' })
        .eq('id', tableId);

      await fetchTables();
      await fetchOrders();
      toast({
        title: "Sucesso",
        description: "Mesa fechada com sucesso!",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error closing table:', error);
      toast({
        title: "Erro",
        description: "Erro ao fechar mesa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (table: Table) => {
    const order = getTableOrder(table.id);
    const statusInfo = getStatusInfo(table.status);
    const isRound = table.capacity <= 4;
    
    return (
      <div
        key={table.id}
        className="relative cursor-pointer transform hover:scale-105 transition-all duration-200 hover:shadow-lg"
        onClick={() => {
          setSelectedTable(table);
          setIsDialogOpen(true);
        }}
      >
        {/* Mesa principal */}
        <div
          className={`
            ${isRound ? 'rounded-full' : 'rounded-xl'}
            ${statusInfo.color}
            border-4 flex items-center justify-center shadow-lg
            ${isRound ? 'w-24 h-24' : 'w-28 h-20'}
            relative overflow-hidden
          `}
        >
          {/* Efeito de brilho para mesa ocupada */}
          {table.status === 'occupied' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
          )}
          
          <div className={`text-center z-10 ${statusInfo.textColor}`}>
            <div className="font-bold text-lg">{table.table_number}</div>
            <div className="text-xs opacity-90">{table.capacity} lugares</div>
          </div>
        </div>

        {/* Cadeiras ao redor da mesa */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: table.capacity }).map((_, index) => {
            const angle = (360 / table.capacity) * index;
            const radius = isRound ? 50 : 45;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            
            return (
              <div
                key={index}
                className={`absolute w-5 h-5 rounded-md transform -translate-x-1/2 -translate-y-1/2 
                  ${table.status === 'occupied' ? 'bg-red-300' : 'bg-gray-400'} 
                  shadow-sm`}
                style={{
                  left: `50%`,
                  top: `50%`,
                  transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                }}
              />
            );
          })}
        </div>

        {/* Badge de status */}
        <div className="absolute -top-3 -right-3">
          <Badge className={`${statusInfo.color} ${statusInfo.textColor} text-xs px-2 py-1 shadow-md`}>
            {statusInfo.icon}
          </Badge>
        </div>

        {/* Informações do pedido */}
        {order && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-center">
            <div className="bg-white px-3 py-1 rounded-full shadow-md border border-gray-200">
              <div className="font-semibold text-green-600">R$ {order.total_amount.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Indicador de tempo para mesas ocupadas */}
        {table.status === 'occupied' && order && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs">
            <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs">
              <Clock className="h-3 w-3 inline mr-1" />
              {new Date(order.created_at).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const occupiedTables = tables.filter(table => table.status === 'occupied');
  const availableTables = tables.filter(table => table.status === 'available');
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🏪 Layout do Restaurante</h2>
          <p className="text-gray-600 mt-1">Visão em tempo real das mesas</p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Mesa
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            🔄 Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-800">Mesas Livres</p>
                <p className="text-3xl font-bold text-green-900">{availableTables.length}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-800">Mesas Ocupadas</p>
                <p className="text-3xl font-bold text-red-900">{occupiedTables.length}</p>
              </div>
              <div className="p-3 bg-red-500 rounded-full">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-800">Taxa de Ocupação</p>
                <p className="text-3xl font-bold text-blue-900">
                  {tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-800">Receita Ativa</p>
                <p className="text-2xl font-bold text-purple-900">
                  R$ {totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layout das Mesas */}
      <Card className="overflow-hidden">
        <CardContent className="p-8">
          {tables.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">🪑</div>
              <h3 className="text-2xl font-medium text-gray-900 mb-4">
                Nenhuma mesa cadastrada
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                Comece criando suas primeiras mesas
              </p>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Criar Primeira Mesa
              </Button>
            </div>
          ) : (
            <div className="min-h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 relative">
              {/* Mini-mapa das mesas */}
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-12 place-items-center">
                {tables.map(renderTable)}
              </div>
              
              {/* Legenda */}
              <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
                <h4 className="font-semibold mb-2 text-sm">Legenda:</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Livre</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Ocupada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Reservada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Limpeza</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes da Mesa */}
      {selectedTable && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Mesa {selectedTable.table_number}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Capacidade:</span>
                  <p className="text-lg">{selectedTable.capacity} pessoas</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge className={`mt-1 ${getStatusInfo(selectedTable.status).color} ${getStatusInfo(selectedTable.status).textColor}`}>
                    {getStatusInfo(selectedTable.status).icon}
                    <span className="ml-1">{getStatusInfo(selectedTable.status).text}</span>
                  </Badge>
                </div>
              </div>

              {getTableOrder(selectedTable.id) && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pedido Ativo
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-bold text-green-600">
                          R$ {getTableOrder(selectedTable.id)?.total_amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Garçom:</span>
                        <span>{getTableOrder(selectedTable.id)?.profiles?.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Início:</span>
                        <span>{new Date(getTableOrder(selectedTable.id)?.created_at || '').toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 pt-4">
                {selectedTable.status === 'available' && (
                  <>
                    <Button
                      onClick={() => updateTableStatus(selectedTable.id, 'occupied')}
                      disabled={loading}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      Ocupar
                    </Button>
                    <Button
                      onClick={() => deleteTable(selectedTable.id)}
                      disabled={loading}
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                
                {selectedTable.status === 'occupied' && (
                  <>
                    <Button
                      onClick={() => closeTable(selectedTable.id)}
                      disabled={loading}
                      className="flex-1 bg-purple-500 hover:bg-purple-600"
                    >
                      Fechar Conta
                    </Button>
                    <Button
                      onClick={() => updateTableStatus(selectedTable.id, 'cleaning')}
                      disabled={loading}
                      variant="outline"
                      className="flex-1"
                    >
                      Limpeza
                    </Button>
                  </>
                )}
                
                {selectedTable.status === 'cleaning' && (
                  <Button
                    onClick={() => updateTableStatus(selectedTable.id, 'available')}
                    disabled={loading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    Finalizar Limpeza
                  </Button>
                )}
                
                {selectedTable.status === 'reserved' && (
                  <Button
                    onClick={() => updateTableStatus(selectedTable.id, 'occupied')}
                    disabled={loading}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                  >
                    Check-in
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para Adicionar Mesa */}
      <AddTableDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onTableAdded={fetchTables}
        existingNumbers={tables.map(t => t.table_number)}
      />
    </div>
  );
};
