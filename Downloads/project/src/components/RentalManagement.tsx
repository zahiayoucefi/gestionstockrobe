import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  
  Edit2,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Rental, Product } from '../types';
import { generateReceiptPDF } from '../utils/pdf';

export function RentalManagement() {
  const { rentals, products, updateRentalStatus, getProductAvailability, loading } = useStore();
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [productAvailability, setProductAvailability] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const filteredRentals = rentals.filter(rental => {
    if (filterStatus && rental.status !== filterStatus) return false;
    return true;
  });

  const activeRentals = rentals.filter(r => r.status === 'active');
  const overdueRentals = rentals.filter(r => {
    if (r.status !== 'active') return false;
    return new Date(r.rentalEndDate) < new Date();
  });

  const handleStatusUpdate = async (rentalId: string, newStatus: Rental['status']) => {
  try {
    const returnedAt = newStatus === 'returned' ? new Date() : undefined;
    await updateRentalStatus(rentalId, newStatus, returnedAt);

    const rental = rentals.find(r => r.id === rentalId);
    if (!rental) return;

    // ➕ Génération de reçu si annulation
    if (newStatus === 'cancelled') {
      const receiptData = {
        customerName: rental.customerName,
        customerPhone: rental.customerPhone,
        customerEmail: rental.customerEmail,
        items: [{
          name: rental.productName ?? 'Produit inconnu',
          quantity: 1,
          unitPrice: rental.dailyRate,
          isRental: true,
          rentalDays: rental.rentalDays,
        }],
        total: rental.totalAmount,
        date: new Date(),
        agentName: user?.name || 'Agent inconnu',
        receiptNumber: `ANNUL-${rentalId}`
      };

      generateReceiptPDF(receiptData);
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    alert('Erreur lors de la mise à jour du statut');
  }
};
  const loadProductAvailability = async (productId: string) => {
    try {
      const availability = await getProductAvailability(productId, selectedMonth);
      setProductAvailability(availability);
    } catch (error) {
      console.error('Erreur lors du chargement de la disponibilité:', error);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    if (productId) {
      loadProductAvailability(productId);
      setShowCalendar(true);
    } else {
      setShowCalendar(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(selectedMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setSelectedMonth(newMonth);
    if (selectedProduct) {
      loadProductAvailability(selectedProduct);
    }
  };

  const renderCalendar = () => {
    if (!productAvailability) return null;

    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDay || days.length < 42) {
      const isCurrentMonth = currentDate.getMonth() === month;
      const isReserved = productAvailability.reservedDates.some((date: Date) => 
        date.toDateString() === currentDate.toDateString()
      );
      const isToday = currentDate.toDateString() === new Date().toDateString();

      days.push({
        date: new Date(currentDate),
        isCurrentMonth,
        isReserved,
        isToday
      });

      currentDate.setDate(currentDate.getDate() + 1);
      if (days.length >= 42) break;
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Calendrier de Disponibilité - {products.find(p => p.id === selectedProduct)?.name}
          </h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="font-medium">
              {selectedMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              className={`p-2 text-center text-sm border rounded-lg ${
                !day.isCurrentMonth
                  ? 'text-gray-300 bg-gray-50'
                  : day.isReserved
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : day.isToday
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'
              }`}
            >
              {day.date.getDate()}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center space-x-6 mt-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>Réservé</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Aujourd'hui</span>
          </div>
        </div>
      </div>
    );
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
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Locations</h1>
        <p className="text-gray-600 mt-2">Gérez les locations et consultez la disponibilité des produits</p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Locations Actives</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{activeRentals.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Retard</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{overdueRentals.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Locations</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{rentals.length}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Package className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Calendrier de disponibilité */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vérifier la Disponibilité</h2>
        <div className="mb-4">
          <select
            value={selectedProduct}
            onChange={(e) => handleProductSelect(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Sélectionner un produit</option>
            {products
              .filter(p => p.isAvailableForRental)
              .map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.size} ({product.color})
                </option>
              ))}
          </select>
        </div>
      </div>

      {showCalendar && renderCalendar()}

      {/* Liste des locations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Locations en Cours</h2>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="returned">Retournées</option>
              <option value="overdue">En retard</option>
              <option value="cancelled">Annulées</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredRentals.map((rental) => {
                const isOverdue = rental.status === 'active' && new Date(rental.rentalEndDate) < new Date();
                
                return (
                  <tr key={rental.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {rental.customerName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {rental.customerPhone}
                        </div>
                        {rental.customerEmail && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {rental.customerEmail}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {rental.productName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {rental.rentalDays} jour(s) - {rental.dailyRate}DA/jour
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Du {new Date(rental.rentalStartDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        Au {new Date(rental.rentalEndDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {rental.totalAmount.toLocaleString('fr-FR')} DA
                      </div>
                      {rental.depositAmount > 0 && (
                        <div className="text-sm text-gray-500">
                          Caution: {rental.depositAmount}DA
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rental.status === 'active'
                          ? isOverdue
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                          : rental.status === 'returned'
                          ? 'bg-blue-100 text-blue-800'
                          : rental.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {rental.status === 'active'
                          ? isOverdue
                            ? 'En retard'
                            : 'Active'
                          : rental.status === 'returned'
                          ? 'Retournée'
                          : rental.status === 'cancelled'
                          ? 'Annulée'
                          : 'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {rental.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(rental.id, 'returned')}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Marquer comme retourné"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {rental.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(rental.id, 'cancelled')}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Annuler"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRentals.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune location trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}