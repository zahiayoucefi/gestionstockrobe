import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Filter, 
  Calendar,
  Eye,
  Download,
  TrendingUp,
  TrendingDown,
  Printer
} from 'lucide-react';
import { generateReceiptPDF } from '../utils/pdfGenerator';

export function TransactionHistory() {
  const { transactions, products } = useStore();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handlePrintReceipt = (transaction: any) => {
    generateReceiptPDF({
      customerName: transaction.customerName,
      customerPhone: transaction.customerPhone,
      customerEmail: transaction.customerEmail || '',
      items: [
        {
          name: transaction.productName,
          quantity: transaction.quantity,
          unitPrice: transaction.unitPrice + (transaction.discountAmount || 0),
          finalPrice: transaction.unitPrice,
          discount: transaction.discount || 0,
          discountAmount: transaction.discountAmount || 0,
          isRental: transaction.type === 'rental',
          rentalDays: transaction.rentalDays,
        }
      ],
      total: transaction.totalAmount,
      date: new Date(transaction.createdAt),
      agentName: transaction.agentName,
      receiptNumber: transaction.receiptNumber || `REC-${transaction.id}`,
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || transaction.type === filterType;
    const matchesStatus = !filterStatus || transaction.status === filterStatus;

    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(transaction.createdAt) >= new Date(dateFrom);
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(transaction.createdAt) <= endOfDay;
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalSales = filteredTransactions.filter(t => t.type === 'sale').length;
  const totalRentals = filteredTransactions.filter(t => t.type === 'rental').length;
  const totalDiscount = filteredTransactions.reduce((sum, t) => sum + (t.discountAmount || 0), 0);

  const statCards = [
    // Chiffre d'affaires seulement pour admin
    ...(isAdmin ? [{
      title: 'Chiffre d\'Affaires',
      value: `${totalRevenue.toLocaleString('fr-FR')} DA`,
      icon: TrendingUp,
      color: 'bg-green-500'
    }] : []),
    {
      title: 'Ventes',
      value: totalSales.toString(),
      icon: TrendingUp,
      color: 'bg-blue-500'
    },
    {
      title: 'Locations',
      value: totalRentals.toString(),
      icon: Calendar,
      color: 'bg-orange-500'
    },
    ...(isAdmin ? [{
      title: 'Réductions Accordées',
      value: `${totalDiscount.toLocaleString('fr-FR')} DA`,
      icon: TrendingDown,
      color: 'bg-red-500'
    }] : [])
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Historique des Transactions</h1>
        <p className="text-gray-600 mt-2">Consultez toutes les ventes et locations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les types</option>
            <option value="sale">Ventes</option>
            <option value="rental">Locations</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="completed">Terminé</option>
            <option value="pending">En attente</option>
            <option value="returned">Retourné</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-600">
            {filteredTransactions.length} transaction(s) trouvée(s)
          </p>
          <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'sale' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {transaction.type === 'sale' ? 'Vente' : 'Location'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.customerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.customerPhone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.quantity}
                    {transaction.type === 'rental' && transaction.rentalDays && (
                      <div className="text-xs text-gray-500">
                        {transaction.rentalDays} jour(s)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.totalAmount.toLocaleString('fr-FR')} DA
                    {transaction.discountAmount && transaction.discountAmount > 0 && (
                      <div className="text-xs text-green-600">
                        Réduction: -{transaction.discountAmount.toLocaleString('fr-FR')} DA ({transaction.discount}%)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.status === 'completed' ? 'Terminé' :
                       transaction.status === 'pending' ? 'En attente' : 'Retourné'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.agentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      className="text-green-600 hover:text-green-800 transition-colors"
                      title="Imprimer le reçu"
                      onClick={() => handlePrintReceipt(transaction)}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune transaction trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}