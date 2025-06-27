import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  ShoppingCart, 
  Calendar, 
  AlertTriangle,
  Package,
  Clock,
  Users
} from 'lucide-react';

export function Dashboard() {
  const { isAdmin } = useAuth();
  const [period, setPeriod] = useState<'all' | 'today' | 'month' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const { getStats, products, transactions, rentals, loading } = useStore();
  const [stats, setStats] = useState({
    revenue: 0,
    totalSales: 0,
    totalRentals: 0,
    lowStockItems: 0,
    activeRentals: 0,
    overdueRentals: 0
  });

  useEffect(() => {
    loadStats();
  }, [period, customDate]);

  const loadStats = async () => {
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    if (period === 'today') {
      dateFrom = new Date();
      dateFrom.setHours(0, 0, 0, 0);
      dateTo = new Date();
      dateTo.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      dateFrom = new Date();
      dateFrom.setDate(1);
      dateFrom.setHours(0, 0, 0, 0);
      dateTo = new Date();
      dateTo.setHours(23, 59, 59, 999);
    } else if (period === 'custom' && customDate) {
      dateFrom = new Date(customDate);
      dateFrom.setHours(0, 0, 0, 0);
      dateTo = new Date(customDate);
      dateTo.setHours(23, 59, 59, 999);
    }

    try {
      const newStats = await getStats(dateFrom, dateTo);
      setStats(newStats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  // Filtrer les transactions selon la période
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.createdAt);
    
    if (period === 'today') {
      const today = new Date();
      return transactionDate.toDateString() === today.toDateString();
    } else if (period === 'month') {
      const now = new Date();
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    } else if (period === 'custom' && customDate) {
      const selectedDate = new Date(customDate);
      return transactionDate.toDateString() === selectedDate.toDateString();
    }
    return true;
  });

  const recentTransactions = filteredTransactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const lowStockProducts = products.filter(p => p.stock <= 2);

  const statCards = [
    // Chiffre d'affaires seulement pour admin
    ...(isAdmin ? [{
      title: 'Chiffre d\'Affaires',
      value: `${stats.revenue.toLocaleString('fr-FR')} DA`,
      icon: TrendingUp,
      color: 'bg-green-500',
      change: ''
    }] : []),
    {
      title: 'Ventes',
      value: stats.totalSales.toString(),
      icon: ShoppingCart,
      color: 'bg-blue-500',
      change: ''
    },
    {
      title: 'Locations',
      value: stats.totalRentals.toString(),
      icon: Calendar,
      color: 'bg-orange-500',
      change: ''
    },
    {
      title: 'Stock Faible',
      value: stats.lowStockItems.toString(),
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: 'produits'
    },
    {
      title: 'Locations Actives',
      value: stats.activeRentals.toString(),
      icon: Users,
      color: 'bg-purple-500',
      change: 'en cours'
    },
    {
      title: 'En Retard',
      value: stats.overdueRentals.toString(),
      icon: Clock,
      color: 'bg-red-600',
      change: 'locations'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Vue d'ensemble de votre boutique</p>
      </div>

      {/* Sélecteur de période */}
      <div className="mb-4 flex gap-4 items-center">
        <button
          onClick={() => { setPeriod('today'); setCustomDate(''); }}
          className={`px-4 py-2 rounded ${period === 'today' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Aujourd'hui
        </button>
        <button
          onClick={() => { setPeriod('month'); setCustomDate(''); }}
          className={`px-4 py-2 rounded ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Ce mois
        </button>
        <button
          onClick={() => { setPeriod('all'); setCustomDate(''); }}
          className={`px-4 py-2 rounded ${period === 'all' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Tout le temps
        </button>
        <button
          onClick={() => { setPeriod('custom'); }}
          className={`px-4 py-2 rounded ${period === 'custom' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Personnalisée
        </button>
        {period === 'custom' && (
          <input
            type="date"
            value={customDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => {
              setCustomDate(e.target.value);
              setPeriod('custom');
            }}
            className="ml-2 px-2 py-1 border rounded"
          />
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  {stat.change && <p className="text-sm text-green-600 mt-1">{stat.change}</p>}
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transactions récentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Transactions Récentes
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <div className="text-gray-500 text-center">Aucune transaction pour cette période</div>
              ) : recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.productName}</p>
                    <p className="text-sm text-gray-600">{transaction.customerName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {transaction.totalAmount.toLocaleString('fr-FR')} DA
                    </p>
                    {transaction.discountAmount && transaction.discountAmount > 0 && (
                      <p className="text-xs text-green-600">
                        Réduction: -{transaction.discountAmount.toLocaleString('fr-FR')} DA
                      </p>
                    )}
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      transaction.type === 'sale' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {transaction.type === 'sale' ? 'Vente' : 'Location'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alertes stock faible */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Alertes Stock
            </h2>
          </div>
          <div className="p-6">
            {lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.category} - {product.size}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-600 font-semibold">{product.stock} restant(s)</p>
                      <p className="text-xs text-gray-500">Réapprovisionner</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Tous les produits sont bien approvisionnés</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}