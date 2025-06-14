import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddTableDialog } from './AddTableDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Users, Clock, DollarSign, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';

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

  const getTableOrder = (tableId: string) => {
    return orders.find(order => order.table_id === tableId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-300 text-green-800';
      case 'occupied': return 'bg-red-100 border-red-300 text-red-800';
      case 'reserved': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'cleaning': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'occupied': return 'Ocupada';
      case 'reserved': return 'Reservada';
      case 'cleaning': return 'Limpeza';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'occupied': return <Users className="h-4 w-4" />;
      case 'reserved': return <Clock className="h-4 w-4" />;
      case 'cleaning': return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setIsDialogOpen(true);
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
    const isRound = table.capacity <= 4;
    
    return (
      <div
        key={table.id}
        className="relative cursor-pointer transform hover:scale-105 transition-transform"
        onClick={() => handleTableClick(table)}
      >
        <div
          className={`
            ${isRound ? 'rounded-full' : 'rounded-lg'}
            ${getStatusColor(table.status)}
            border-2 flex items-center justify-center
            ${isRound ? 'w-20 h-20' : 'w-24 h-16'}
            shadow-lg
          `}
        >
          <div className="text-center">
            <div className="font-bold text-lg">{table.table_number}</div>
            <div className="text-xs">{table.capacity} lugares</div>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: table.capacity }).map((_, index) => {
            const angle = (360 / table.capacity) * index;
            const radius = isRound ? 45 : 35;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            
            return (
              <div
                key={index}
                className="absolute w-4 h-4 bg-gray-400 rounded-sm transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `50%`,
                  top: `50%`,
                  transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                }}
              />
            );
          })}
        </div>

        <div className="absolute -top-2 -right-2">
          <Badge className={`${getStatusColor(table.status)} text-xs px-1 py-0`}>
            {getStatusIcon(table.status)}
          </Badge>
        </div>

        {order && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-center">
            <div className="bg-white px-2 py-1 rounded shadow border">
              R$ {order.total_amount.toFixed(2)}
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Layout das Mesas</h2>
        <div className="flex gap-3">
          <Button 
            className="bg-gradient-to-r from-green-500 to-green-600"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Mesa
          </Button>
          <Button variant="outline">
            📊 Relatório de Ocupação
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Disponíveis</p>
                <p className="text-2xl font-bold text-green-900">{availableTables.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Ocupadas</p>
                <p className="text-2xl font-bold text-red-900">{occupiedTables.length}</p>
              </div>
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Taxa de Ocupação</p>
                <p className="text-2xl font-bold text-blue-900">
                  {tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0}%
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Receita Ativa</p>
                <p className="text-2xl font-bold text-purple-900">
                  R$ {totalRevenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Layout */}
      <Card>
        <CardContent className="p-8">
          {tables.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🪑</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Nenhuma mesa cadastrada
              </h3>
              <p className="text-gray-600 mb-4">
                Comece adicionando suas primeiras mesas
              </p>
              <Button 
                className="bg-gradient-to-r from-green-500 to-green-600"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Mesa
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-8 place-items-center min-h-96">
              {tables.map(renderTable)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table Details Dialog */}
      {selectedTable && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Mesa {selectedTable.table_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Capacidade:</span>
                <span className="font-medium">{selectedTable.capacity} pessoas</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <Badge className={getStatusColor(selectedTable.status)}>
                  {getStatusIcon(selectedTable.status)}
                  <span className="ml-1">{getStatusText(selectedTable.status)}</span>
                </Badge>
              </div>

              {getTableOrder(selectedTable.id) && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium mb-2">Pedido Ativo</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-bold">
                        R$ {getTableOrder(selectedTable.id)?.total_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Garçom:</span>
                      <span>{getTableOrder(selectedTable.id)?.profiles?.full_name}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedTable.status === 'available' && (
                  <>
                    <Button
                      onClick={() => updateTableStatus(selectedTable.id, 'occupied')}
                      disabled={loading}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      Ocupar Mesa
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

      {/* Add Table Dialog */}
      <AddTableDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onTableAdded={fetchTables}
        existingNumbers={tables.map(t => t.table_number)}
      />
    </div>
  );
};
