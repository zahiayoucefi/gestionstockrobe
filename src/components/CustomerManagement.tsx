import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  Search, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Eye,
  Calendar,
  CreditCard,
  Package,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Customer, Transaction, Rental, Payment } from '../types';

export function CustomerManagement() {
  const { customers, getCustomerHistory, loading } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerHistory, setCustomerHistory] = useState<{
    transactions: Transaction[];
    rentals: Rental[];
    payments: Payment[];
  } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewHistory = async (customer: Customer) => {
    setSelectedCustomer(customer);
    try {
      const history = await getCustomerHistory(customer.phone);
      setCustomerHistory(history);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      alert('Erreur lors du chargement de l\'historique du client');
    }
  };

  const calculateCustomerStats = (history: { transactions: Transaction[]; rentals: Rental[]; payments: Payment[] }) => {
    const totalSpent = history.transactions.reduce((sum, t) => sum + (t.amountPaid || t.totalAmount), 0) +
                     history.rentals.reduce((sum, r) => sum + (r.amountPaid || r.totalAmount), 0);
    
    const totalTransactions = history.transactions.length + history.rentals.length;
    
    const pendingAmount = history.transactions.reduce((sum, t) => sum + (t.remainingAmount || 0), 0) +
                         history.rentals.reduce((sum, r) => sum + (r.remainingAmount || 0), 0);
    
    const activeRentals = history.rentals.filter(r => r.status === 'active').length;

    return { totalSpent, totalTransactions, pendingAmount, activeRentals };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
        <p className="text-gray-600 mt-2">Consultez la liste des clients et leur historique</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {filteredCustomers.length} client(s) trouvé(s)
        </p>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    <p className="text-sm text-gray-600">Client depuis {customer.createdAt.toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleViewHistory(customer)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Voir l'historique"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phone}</span>
                </div>
                
                {customer.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{customer.email}</span>
                  </div>
                )}
                
                {customer.address && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}
              </div>

              {customer.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 italic">"{customer.notes}"</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun client trouvé</p>
        </div>
      )}

      {/* Customer History Modal */}
      {showHistoryModal && selectedCustomer && customerHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Historique de {selectedCustomer.name}
                  </h2>
                  <p className="text-gray-600">{selectedCustomer.phone}</p>
                </div>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedCustomer(null);
                    setCustomerHistory(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {(() => {
                  const stats = calculateCustomerStats(customerHistory);
                  return (
                    <>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm text-green-600">Total Dépensé</p>
                            <p className="font-semibold text-green-800">
                              {stats.totalSpent.toLocaleString('fr-FR')} DA
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-blue-600">Transactions</p>
                            <p className="font-semibold text-blue-800">{stats.totalTransactions}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <div>
                            <p className="text-sm text-orange-600">Locations Actives</p>
                            <p className="font-semibold text-orange-800">{stats.activeRentals}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-5 h-5 text-red-600" />
                          <div>
                            <p className="text-sm text-red-600">Montant Restant</p>
                            <p className="font-semibold text-red-800">
                              {stats.pendingAmount.toLocaleString('fr-FR')} DA
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Transactions History */}
              <div className="space-y-6">
                {/* Ventes */}
                {customerHistory.transactions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      Ventes ({customerHistory.transactions.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-left">Produit</th>
                            <th className="px-4 py-2 text-left">Quantité</th>
                            <th className="px-4 py-2 text-left">Montant</th>
                            <th className="px-4 py-2 text-left">Payé</th>
                            <th className="px-4 py-2 text-left">Restant</th>
                            <th className="px-4 py-2 text-left">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {customerHistory.transactions.map((transaction) => (
                            <tr key={transaction.id}>
                              <td className="px-4 py-2">
                                {transaction.createdAt.toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-4 py-2">{transaction.productName}</td>
                              <td className="px-4 py-2">{transaction.quantity}</td>
                              <td className="px-4 py-2">
                                {transaction.totalAmount.toLocaleString('fr-FR')} DA
                              </td>
                              <td className="px-4 py-2">
                                {(transaction.amountPaid || 0).toLocaleString('fr-FR')} DA
                              </td>
                              <td className="px-4 py-2">
                                {(transaction.remainingAmount || 0).toLocaleString('fr-FR')} DA
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  transaction.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                  transaction.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {transaction.paymentStatus === 'completed' ? 'Payé' :
                                   transaction.paymentStatus === 'partial' ? 'Partiel' : 'En attente'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Locations */}
                {customerHistory.rentals.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Locations ({customerHistory.rentals.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-left">Produit</th>
                            <th className="px-4 py-2 text-left">Période</th>
                            <th className="px-4 py-2 text-left">Montant</th>
                            <th className="px-4 py-2 text-left">Payé</th>
                            <th className="px-4 py-2 text-left">Restant</th>
                            <th className="px-4 py-2 text-left">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {customerHistory.rentals.map((rental) => (
                            <tr key={rental.id}>
                              <td className="px-4 py-2">
                                {rental.createdAt.toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-4 py-2">{rental.productName}</td>
                              <td className="px-4 py-2">
                                {rental.rentalStartDate.toLocaleDateString('fr-FR')} - {rental.rentalEndDate.toLocaleDateString('fr-FR')}
                                <br />
                                <span className="text-gray-500">({rental.rentalDays} jour{rental.rentalDays > 1 ? 's' : ''})</span>
                              </td>
                              <td className="px-4 py-2">
                                {rental.totalAmount.toLocaleString('fr-FR')} DA
                              </td>
                              <td className="px-4 py-2">
                                {(rental.amountPaid || 0).toLocaleString('fr-FR')} DA
                              </td>
                              <td className="px-4 py-2">
                                {(rental.remainingAmount || 0).toLocaleString('fr-FR')} DA
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  rental.status === 'active' ? 'bg-green-100 text-green-800' :
                                  rental.status === 'returned' ? 'bg-blue-100 text-blue-800' :
                                  rental.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {rental.status === 'active' ? 'Active' :
                                   rental.status === 'returned' ? 'Retournée' :
                                   rental.status === 'cancelled' ? 'Annulée' : 'En retard'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Paiements */}
                {customerHistory.payments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Historique des Paiements ({customerHistory.payments.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-left">Montant Payé</th>
                            <th className="px-4 py-2 text-left">Méthode</th>
                            <th className="px-4 py-2 text-left">Agent</th>
                            <th className="px-4 py-2 text-left">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {customerHistory.payments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="px-4 py-2">
                                {payment.paymentDate.toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-4 py-2">
                                {payment.amountPaid.toLocaleString('fr-FR')} DA
                              </td>
                              <td className="px-4 py-2 capitalize">{payment.paymentMethod}</td>
                              <td className="px-4 py-2">{payment.agentName}</td>
                              <td className="px-4 py-2">{payment.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {customerHistory.transactions.length === 0 && 
                 customerHistory.rentals.length === 0 && 
                 customerHistory.payments.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun historique trouvé pour ce client</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}