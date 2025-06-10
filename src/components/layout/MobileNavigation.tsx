import { useState } from 'react';
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
  activeNotifications: number;
}

export const MobileNavigation = ({ activeTab, setActiveTab, activeNotifications }: MobileNavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut, profile, hasPermission } = useAuth();

  const menuItems = [
    { id: 'orders', label: 'Pedidos', icon: ChefHat, permission: 'orders' },
    { id: 'tables', label: 'Mesas', icon: Coffee, permission: 'tables' },
    { id: 'stock', label: 'Estoque', icon: Package, permission: 'stock' },
    { id: 'analytics', label: 'Financeiro', icon: TrendingUp, permission: 'reports' },
    { id: 'menu', label: 'Cardápio', icon: MenuIcon, permission: 'menu' },
    { id: 'users', label: 'Usuários', icon: UserCog, permission: 'users' },
    { id: 'integrations', label: 'Integrações', icon: Zap, permission: 'settings' },
  ];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  const handleNotifications = () => {
    setActiveTab('notifications');
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
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
                <h2 className="font-bold text-lg">Restaurant AI</h2>
                <p className="text-sm text-gray-600">{profile?.full_name}</p>
              </div>
            </div>

            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => {
                if (item.permission && !hasPermission(item.permission)) {
                  return null;
                }

                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleTabChange(item.id)}
                  >
                    <Icon className="h-4 w-4 mr-3" />
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
                {activeNotifications > 0 && (
                  <Badge className="absolute right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-xs">
                    {activeNotifications}
                  </Badge>
                )}
              </Button>
            </nav>

            <div className="border-t pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleSignOut}
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