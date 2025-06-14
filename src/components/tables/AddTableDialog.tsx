
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AddTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTableAdded: () => void;
  existingNumbers: number[];
}

export const AddTableDialog = ({ isOpen, onClose, onTableAdded, existingNumbers }: AddTableDialogProps) => {
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [capacity, setCapacity] = useState<number>(4);
  const [loading, setLoading] = useState(false);

  // Encontrar o próximo número disponível
  const getNextAvailableNumber = () => {
    let num = 1;
    while (existingNumbers.includes(num)) {
      num++;
    }
    return num;
  };

  const resetForm = () => {
    setTableNumber(getNextAvailableNumber());
    setCapacity(4);
  };

  const handleSubmit = async () => {
    if (existingNumbers.includes(tableNumber)) {
      toast({
        title: "Erro",
        description: "Já existe uma mesa com este número",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tables')
        .insert([{
          table_number: tableNumber,
          capacity: capacity,
          status: 'available'
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Mesa ${tableNumber} criada com sucesso!`,
      });

      onTableAdded();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating table:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar mesa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Mesa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="tableNumber">Número da Mesa</Label>
            <Input
              id="tableNumber"
              type="number"
              min="1"
              value={tableNumber}
              onChange={(e) => setTableNumber(Number(e.target.value))}
              placeholder="Ex: 1"
            />
            {existingNumbers.includes(tableNumber) && (
              <p className="text-sm text-red-600 mt-1">
                Este número já está em uso
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="capacity">Capacidade</Label>
            <Select value={capacity.toString()} onValueChange={(value) => setCapacity(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 pessoas</SelectItem>
                <SelectItem value="4">4 pessoas</SelectItem>
                <SelectItem value="6">6 pessoas</SelectItem>
                <SelectItem value="8">8 pessoas</SelectItem>
                <SelectItem value="10">10 pessoas</SelectItem>
                <SelectItem value="12">12 pessoas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || existingNumbers.includes(tableNumber)}
              className="flex-1"
            >
              {loading ? 'Criando...' : 'Criar Mesa'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
