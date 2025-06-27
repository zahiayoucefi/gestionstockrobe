import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  Package, 
  BarChart3, 
  Receipt, 
  Settings, 
  LogOut,
  User,
  Users,
  Calendar,
  UserCheck
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { user, logout, isAdmin } = useAuth();

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, adminOnly: true },
    { id: 'pos', name: 'Point de Vente', icon: ShoppingBag, adminOnly: false },
    { id: 'products', name: 'Produits', icon: Package, adminOnly: true },
    { id: 'rentals', name: 'Locations', icon: Calendar, adminOnly: false },
    { id: 'transactions', name: 'Historique', icon: Receipt, adminOnly: false },
    { id: 'customers', name: 'Clients', icon: UserCheck, adminOnly: false },
    { id: 'users', name: 'Utilisateurs', icon: Users, adminOnly: true },
    { id: 'settings', name: 'Paramètres', icon: Settings, adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className=" text-white rounded-lg">
             <img
                src="/hali.jpg"
                alt="Logo HaliStock"
                className="w-24 h-24 rounded-full object-cover border-4 border-white"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">HaliStock</h1>
              <p className="text-sm text-gray-500">Gestion Boutique</p>
            </div>
          </div>
        </div>

        <nav className="mt-6">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-full">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role === 'admin' ? 'Administrateur' : 'Agent de vente'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center text-red-600 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}