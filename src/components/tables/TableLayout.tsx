import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Users, Clock, DollarSign, CheckCircle } from 'lucide-react';

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
  order_number: string;
  total_amount: number;
  created_at: string;
  status: string;
  waiter: { full_name: string } | null;
}

export const TableLayout = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableOrder, setTableOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    const { data } = await supabase
      .from('tables')
      .select('*')
      .order('table_number');
    
    setTables(data || []);
  };

  const fetchTableOrder = async (tableId: string) => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        waiter:profiles(full_name)
      `)
      .eq('table_id', tableId)
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    setTableOrder(data);
  };

  const handleTableClick = async (table: Table) => {
    setSelectedTable(table);
    if (table.status === 'occupied') {
      await fetchTableOrder(table.id);
    } else {
      setTableOrder(null);
    }
    setIsDialogOpen(true);
  };

  const updateTableStatus = async (tableId: string, newStatus: Table['status']) => {
    await supabase
      .from('tables')
      .update({ status: newStatus })
      .eq('id', tableId);
    
    fetchTables();
    setIsDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'reserved': return 'bg-yellow-500';
      case 'cleaning': return 'bg-blue-500';
      default: return 'bg-gray-500';
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

  const renderTable = (table: Table) => {
    const isRound = table.capacity <= 4;
    
    return (
      <div
        key={table.id}
        className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${(table.position_x / 800) * 100}%`,
          top: `${(table.position_y / 600) * 100}%`,
        }}
        onClick={() => handleTableClick(table)}
      >
        {/* Table */}
        <div
          className={`
            ${isRound ? 'rounded-full' : 'rounded-lg'}
            ${table.status === 'available' ? 'bg-green-100 border-green-300' : ''}
            ${table.status === 'occupied' ? 'bg-red-100 border-red-300' : ''}
            ${table.status === 'reserved' ? 'bg-yellow-100 border-yellow-300' : ''}
            ${table.status === 'cleaning' ? 'bg-blue-100 border-blue-300' : ''}
            border-2 shadow-lg hover:shadow-xl transition-all duration-200
            flex items-center justify-center
            ${isRound ? 'w-16 h-16' : 'w-20 h-16'}
          `}
        >
          <div className="text-center">
            <div className="font-bold text-sm">{table.table_number}</div>
            <div className="text-xs opacity-75">{table.capacity}p</div>
          </div>
        </div>

        {/* Chairs */}
        {Array.from({ length: table.capacity }).map((_, index) => {
          const angle = (360 / table.capacity) * index;
          const radius = isRound ? 35 : 40;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;

          return (
            <div
              key={index}
              className="absolute w-4 h-4 bg-gray-300 rounded-full border border-gray-400"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          );
        })}

        {/* Status indicator */}
        <div
          className={`
            absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white
            ${getStatusColor(table.status)}
          `}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Layout das Mesas</h2>
        <div className="flex gap-2 flex-wrap">
          <Badge className="bg-green-500 text-white">Disponível</Badge>
          <Badge className="bg-red-500 text-white">Ocupada</Badge>
          <Badge className="bg-yellow-500 text-white">Reservada</Badge>
          <Badge className="bg-blue-500 text-white">Limpeza</Badge>
        </div>
      </div>

      {/* Restaurant Layout */}
      <Card className="h-96 md:h-[500px] relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <CardContent className="p-4 h-full relative">
          {tables.map(renderTable)}
        </CardContent>
      </Card>

      {/* Table Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mesa {selectedTable?.table_number}</DialogTitle>
          </DialogHeader>
          
          {selectedTable && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <Badge className={`${getStatusColor(selectedTable.status)} text-white`}>
                  {getStatusText(selectedTable.status)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Capacidade:</span>
                <span>{selectedTable.capacity} pessoas</span>
              </div>

              {tableOrder && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium">Pedido Ativo</h4>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {new Date(tableOrder.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="font-bold text-green-600">
                      R$ {tableOrder.total_amount.toFixed(2)}
                    </span>
                  </div>
                  
                  {tableOrder.waiter && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{tableOrder.waiter.full_name}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedTable.status === 'available' && (
                  <Button
                    onClick={() => updateTableStatus(selectedTable.id, 'cleaning')}
                    className="flex-1"
                  >
                    Marcar para Limpeza
                  </Button>
                )}
                
                {selectedTable.status === 'occupied' && (
                  <Button
                    onClick={() => updateTableStatus(selectedTable.id, 'cleaning')}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    Finalizar e Limpar
                  </Button>
                )}
                
                {selectedTable.status === 'cleaning' && (
                  <Button
                    onClick={() => updateTableStatus(selectedTable.id, 'available')}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Limpeza Concluída
                  </Button>
                )}
                
                {selectedTable.status === 'reserved' && (
                  <Button
                    onClick={() => updateTableStatus(selectedTable.id, 'occupied')}
                    className="flex-1"
                  >
                    Check-in
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};