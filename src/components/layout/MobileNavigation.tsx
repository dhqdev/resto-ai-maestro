import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Menu, 
  ChefHat, 
  Coffee, 
  Package, 
  TrendingUp, 
  MenuIcon, 
  UserCog, 
  Zap, 
  Bell,
  LogOut
} from 'lucide-react';

interface MobileNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notificationCount: number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  activeTab, 
  setActiveTab, 
  notificationCount 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut, profile } = useAuth();

  const menuItems = [
    { id: 'orders', label: 'Pedidos', icon: ChefHat },
    { id: 'tables', label: 'Mesas', icon: Coffee },
    { id: 'stock', label: 'Estoque', icon: Package },
    { id: 'analytics', label: 'Financeiro', icon: TrendingUp },
    { id: 'menu', label: 'Cardápio', icon: MenuIcon },
    { id: 'users', label: 'Usuários', icon: UserCog },
    { id: 'integrations', label: 'Integrações', icon: Zap },
  ];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  const handleNotifications = () => {
    setActiveTab('notifications');
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold">Restaurant AI</h2>
                <p className="text-sm text-gray-600">{profile?.full_name}</p>
              </div>
            </div>

            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleTabChange(item.id)}
                  >
                    <IconComponent className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                );
              })}

              <Button
                variant={activeTab === 'notifications' ? "default" : "ghost"}
                className="w-full justify-start relative"
                onClick={handleNotifications}
              >
                <Bell className="h-4 w-4 mr-3" />
                Notificações
                {notificationCount > 0 && (
                  <Badge className="ml-auto h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </nav>

            <div className="border-t pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sair
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};