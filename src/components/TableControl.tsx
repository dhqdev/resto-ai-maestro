
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

interface Table {
  id: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentGuests?: number;
  waiter?: string;
  orderValue?: number;
  timeOccupied?: string;
  reservationTime?: string;
}

export const TableControl = () => {
  const [tables, setTables] = useState<Table[]>([
    { id: 1, capacity: 2, status: 'occupied', currentGuests: 2, waiter: 'Carlos', orderValue: 67.50, timeOccupied: '13:45' },
    { id: 2, capacity: 4, status: 'available', currentGuests: 0 },
    { id: 3, capacity: 6, status: 'reserved', reservationTime: '15:30' },
    { id: 4, capacity: 2, status: 'cleaning' },
    { id: 5, capacity: 4, status: 'occupied', currentGuests: 3, waiter: 'Ana', orderValue: 89.20, timeOccupied: '14:10' },
    { id: 6, capacity: 8, status: 'available', currentGuests: 0 },
    { id: 7, capacity: 2, status: 'occupied', currentGuests: 2, waiter: 'Bruno', orderValue: 45.80, timeOccupied: '14:20' },
    { id: 8, capacity: 4, status: 'available', currentGuests: 0 },
    { id: 9, capacity: 6, status: 'occupied', currentGuests: 4, waiter: 'Carlos', orderValue: 134.90, timeOccupied: '13:30' },
    { id: 10, capacity: 2, status: 'available', currentGuests: 0 },
    { id: 11, capacity: 4, status: 'reserved', reservationTime: '16:00' },
    { id: 12, capacity: 8, status: 'available', currentGuests: 0 },
    { id: 13, capacity: 2, status: 'occupied', currentGuests: 1, waiter: 'Ana', orderValue: 28.50, timeOccupied: '14:25' },
    { id: 14, capacity: 4, status: 'cleaning' },
    { id: 15, capacity: 6, status: 'available', currentGuests: 0 },
    { id: 16, capacity: 2, status: 'available', currentGuests: 0 },
    { id: 17, capacity: 4, status: 'occupied', currentGuests: 4, waiter: 'Bruno', orderValue: 97.30, timeOccupied: '13:50' },
    { id: 18, capacity: 8, status: 'available', currentGuests: 0 }
  ]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'occupied': return <Users className="h-4 w-4" />;
      case 'reserved': return <Clock className="h-4 w-4" />;
      case 'cleaning': return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const occupiedTables = tables.filter(table => table.status === 'occupied');
  const availableTables = tables.filter(table => table.status === 'available');
  const totalRevenue = occupiedTables.reduce((sum, table) => sum + (table.orderValue || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Controle de Mesas</h2>
        <div className="flex gap-3">
          <Button variant="outline">
            📊 Relatório de Ocupação
          </Button>
          <Button className="bg-gradient-to-r from-purple-500 to-purple-600">
            + Nova Reserva
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Mesas Disponíveis</p>
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
                <p className="text-sm font-medium text-red-800">Mesas Ocupadas</p>
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
                  {Math.round((occupiedTables.length / tables.length) * 100)}%
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
                  R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {tables.map((table) => (
          <Card 
            key={table.id} 
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${
              table.status === 'occupied' ? 'border-red-200 bg-red-50' :
              table.status === 'available' ? 'border-green-200 bg-green-50' :
              table.status === 'reserved' ? 'border-yellow-200 bg-yellow-50' :
              'border-blue-200 bg-blue-50'
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold">Mesa {table.id}</CardTitle>
                <Badge className={`${getStatusColor(table.status)} text-white flex items-center gap-1`}>
                  {getStatusIcon(table.status)}
                  <span className="text-xs">{getStatusText(table.status)}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Capacidade:</span>
                <span className="font-medium">{table.capacity} pessoas</span>
              </div>

              {table.status === 'occupied' && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Ocupação:</span>
                    <span className="font-medium">{table.currentGuests}/{table.capacity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Garçom:</span>
                    <span className="font-medium">{table.waiter}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Desde:</span>
                    <span className="font-medium">{table.timeOccupied}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Conta:</span>
                    <span className="font-bold text-green-600">
                      R$ {table.orderValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}

              {table.status === 'reserved' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Reserva:</span>
                  <span className="font-medium">{table.reservationTime}</span>
                </div>
              )}

              <div className="pt-2">
                {table.status === 'available' && (
                  <Button size="sm" className="w-full bg-green-500 hover:bg-green-600">
                    Ocupar Mesa
                  </Button>
                )}
                {table.status === 'occupied' && (
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" className="w-full">
                      Ver Pedido
                    </Button>
                    <Button size="sm" className="w-full bg-red-500 hover:bg-red-600">
                      Fechar Conta
                    </Button>
                  </div>
                )}
                {table.status === 'cleaning' && (
                  <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600">
                    Finalizar Limpeza
                  </Button>
                )}
                {table.status === 'reserved' && (
                  <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600">
                    Check-in
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
