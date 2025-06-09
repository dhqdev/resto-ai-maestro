import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Smartphone, 
  Printer, 
  Truck, 
  CreditCard, 
  Wifi, 
  Settings, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Zap,
  MessageSquare,
  ShoppingBag,
  QrCode
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  icon: any;
  category: 'delivery' | 'payment' | 'communication' | 'hardware' | 'pos';
  config?: any;
}

export const IntegrationsPanel = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Receba pedidos e envie notificações via WhatsApp',
      status: 'connected',
      icon: MessageSquare,
      category: 'communication',
      config: { phone: '+5511999999999', apiKey: '***' }
    },
    {
      id: 'ifood',
      name: 'iFood',
      description: 'Sincronize pedidos do iFood automaticamente',
      status: 'connected',
      icon: ShoppingBag,
      category: 'delivery',
      config: { merchantId: '12345', token: '***' }
    },
    {
      id: 'printer',
      name: 'Impressora Térmica',
      description: 'Imprima pedidos automaticamente na cozinha',
      status: 'connected',
      icon: Printer,
      category: 'hardware',
      config: { ip: '192.168.1.100', port: '9100' }
    },
    {
      id: 'mercadopago',
      name: 'Mercado Pago',
      description: 'Processe pagamentos com PIX, cartão e boleto',
      status: 'connected',
      icon: CreditCard,
      category: 'payment',
      config: { accessToken: '***', publicKey: '***' }
    },
    {
      id: 'uber-eats',
      name: 'Uber Eats',
      description: 'Receba pedidos do Uber Eats',
      status: 'disconnected',
      icon: Truck,
      category: 'delivery'
    },
    {
      id: 'rappi',
      name: 'Rappi',
      description: 'Integração com delivery Rappi',
      status: 'error',
      icon: Truck,
      category: 'delivery'
    },
    {
      id: 'pix',
      name: 'PIX Automático',
      description: 'Gere QR codes PIX automaticamente',
      status: 'connected',
      icon: QrCode,
      category: 'payment',
      config: { pixKey: 'restaurante@email.com' }
    },
    {
      id: 'wifi-printer',
      name: 'Impressora WiFi',
      description: 'Impressora secundária para comandas',
      status: 'disconnected',
      icon: Wifi,
      category: 'hardware'
    }
  ]);

  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'disconnected': return 'Desconectado';
      case 'error': return 'Erro';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'disconnected': return <XCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'delivery': return 'Delivery';
      case 'payment': return 'Pagamentos';
      case 'communication': return 'Comunicação';
      case 'hardware': return 'Hardware';
      case 'pos': return 'PDV';
      default: return category;
    }
  };

  const toggleIntegration = (integrationId: string) => {
    setIntegrations(integrations.map(integration => {
      if (integration.id === integrationId) {
        const newStatus = integration.status === 'connected' ? 'disconnected' : 'connected';
        return { ...integration, status: newStatus };
      }
      return integration;
    }));
  };

  const openConfig = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsConfigDialogOpen(true);
  };

  const categories = ['delivery', 'payment', 'communication', 'hardware', 'pos'];

  const getIntegrationsByCategory = (category: string) => {
    return integrations.filter(integration => integration.category === category);
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const errorCount = integrations.filter(i => i.status === 'error').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrações</h2>
          <p className="text-gray-600 mt-1">
            {connectedCount} conectadas • {errorCount} com erro
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-blue-600">
          <Zap className="h-4 w-4 mr-2" />
          Testar Todas
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Conectadas</p>
                <p className="text-2xl font-bold text-green-900">{connectedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Desconectadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {integrations.filter(i => i.status === 'disconnected').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Com Erro</p>
                <p className="text-2xl font-bold text-red-900">{errorCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total</p>
                <p className="text-2xl font-bold text-blue-900">{integrations.length}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations by Category */}
      <Tabs defaultValue="delivery" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-white shadow-lg">
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="payment">Pagamentos</TabsTrigger>
          <TabsTrigger value="communication">Comunicação</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
          <TabsTrigger value="pos">PDV</TabsTrigger>
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getIntegrationsByCategory(category).map((integration) => {
                const IconComponent = integration.icon;
                return (
                  <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <IconComponent className="h-6 w-6 text-gray-700" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {integration.description}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(integration.status)} text-white flex items-center gap-1`}>
                          {getStatusIcon(integration.status)}
                          <span className="text-xs">{getStatusText(integration.status)}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm">
                        <p className="text-gray-600">Categoria:</p>
                        <p className="font-medium">{getCategoryText(integration.category)}</p>
                      </div>

                      {integration.config && (
                        <div className="text-sm">
                          <p className="text-gray-600 mb-2">Configuração:</p>
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            {Object.entries(integration.config).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key}:</span>
                                <span className="font-mono">
                                  {typeof value === 'string' && value.includes('*') ? value : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openConfig(integration)}
                          className="flex-1"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Configurar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => toggleIntegration(integration.id)}
                          className={`flex-1 ${
                            integration.status === 'connected' 
                              ? 'bg-red-500 hover:bg-red-600' 
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {integration.status === 'connected' ? 'Desconectar' : 'Conectar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Configuration Dialog */}
      {selectedIntegration && (
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configurar {selectedIntegration.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <selectedIntegration.icon className="h-8 w-8 text-gray-700" />
                <div>
                  <h3 className="font-medium">{selectedIntegration.name}</h3>
                  <p className="text-sm text-gray-600">{selectedIntegration.description}</p>
                </div>
              </div>

              {selectedIntegration.id === 'whatsapp' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="whatsapp-phone">Número do WhatsApp</Label>
                    <Input
                      id="whatsapp-phone"
                      placeholder="+55 11 99999-9999"
                      defaultValue={selectedIntegration.config?.phone}
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp-token">Token da API</Label>
                    <Input
                      id="whatsapp-token"
                      type="password"
                      placeholder="Token do WhatsApp Business API"
                      defaultValue={selectedIntegration.config?.apiKey}
                    />
                  </div>
                </div>
              )}

              {selectedIntegration.id === 'printer' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="printer-ip">IP da Impressora</Label>
                    <Input
                      id="printer-ip"
                      placeholder="192.168.1.100"
                      defaultValue={selectedIntegration.config?.ip}
                    />
                  </div>
                  <div>
                    <Label htmlFor="printer-port">Porta</Label>
                    <Input
                      id="printer-port"
                      placeholder="9100"
                      defaultValue={selectedIntegration.config?.port}
                    />
                  </div>
                </div>
              )}

              {selectedIntegration.id === 'mercadopago' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="mp-access-token">Access Token</Label>
                    <Input
                      id="mp-access-token"
                      type="password"
                      placeholder="Access Token do Mercado Pago"
                      defaultValue={selectedIntegration.config?.accessToken}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mp-public-key">Public Key</Label>
                    <Input
                      id="mp-public-key"
                      placeholder="Public Key do Mercado Pago"
                      defaultValue={selectedIntegration.config?.publicKey}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsConfigDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => setIsConfigDialogOpen(false)}
                  className="flex-1"
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};