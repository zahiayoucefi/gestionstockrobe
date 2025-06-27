import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search,
  Calendar,
  User,
  Phone,
  Mail,
  Receipt as ReceiptIcon,
  Printer,
  Barcode,
  AlertCircle,
  Percent
} from 'lucide-react';
import { Product } from '../types';
import { generateReceiptPDF } from '../utils/pdfGenerator';

interface CartItem extends Product {
  cartQuantity: number;
  isRental: boolean;
  rentalDays?: number;
  rentalStartDate?: Date;
  rentalEndDate?: Date;
  discount?: number;
  discountAmount?: number;
}

export function PointOfSale() {
  const { products, addTransaction, addRental, checkProductAvailability, loading } = useStore();
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeFilter, setBarcodeFilter] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [availabilityCheck, setAvailabilityCheck] = useState<{[key: string]: boolean}>({});

  const filteredProducts = products.filter(product => {
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
      || product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBarcode = !barcodeFilter || (product.barcode ?? '').toLowerCase().includes(barcodeFilter.toLowerCase());
    return matchSearch && matchBarcode;
  });

  const addToCart = async (product: Product, isRental: boolean = false) => {
    if (product.stock <= 0) return;
    
    if (isRental && !product.isAvailableForRental) {
      alert('Ce produit n\'est pas disponible pour la location');
      return;
    }
    
    const existingItem = cart.find(item => 
      item.id === product.id && item.isRental === isRental
    );
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id && item.isRental === isRental
          ? { ...item, cartQuantity: Math.min(item.cartQuantity + 1, product.stock) }
          : item
      ));
    } else {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setCart([...cart, { 
        ...product, 
        cartQuantity: 1, 
        isRental, 
        rentalDays: isRental ? 1 : undefined,
        rentalStartDate: isRental ? today : undefined,
        rentalEndDate: isRental ? tomorrow : undefined,
        discount: 0,
        discountAmount: 0
      }]);
    }
  };

  const updateCartQuantity = (id: string, isRental: boolean, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id, isRental);
      return;
    }
    
    setCart(cart.map(item => 
      item.id === id && item.isRental === isRental
        ? { ...item, cartQuantity: Math.min(quantity, item.stock) }
        : item
    ));
  };

  const updateDiscount = (id: string, isRental: boolean, discount: number) => {
    setCart(cart.map(item => {
      if (item.id === id && item.isRental === isRental) {
        const basePrice = isRental 
          ? item.rentalPricePerDay * (item.rentalDays || 1)
          : item.salePrice;
        const discountAmount = (basePrice * discount) / 100;
        return { 
          ...item, 
          discount: Math.max(0, Math.min(100, discount)),
          discountAmount
        };
      }
      return item;
    }));
  };

  const updateRentalDates = async (id: string, startDate: Date, days: number) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    
    const isAvailable = await checkProductAvailability(id, startDate, endDate);
    setAvailabilityCheck(prev => ({ ...prev, [id]: isAvailable }));
    
    setCart(cart.map(item => 
      item.id === id && item.isRental
        ? { 
            ...item, 
            rentalDays: Math.max(1, days),
            rentalStartDate: startDate,
            rentalEndDate: endDate
          }
        : item
    ));
  };

  const removeFromCart = (id: string, isRental: boolean) => {
    setCart(cart.filter(item => !(item.id === id && item.isRental === isRental)));
    if (isRental) {
      setAvailabilityCheck(prev => {
        const newCheck = { ...prev };
        delete newCheck[id];
        return newCheck;
      });
    }
  };

  const calculateItemTotal = (item: CartItem) => {
    const basePrice = item.isRental 
      ? item.rentalPricePerDay * (item.rentalDays || 1)
      : item.salePrice;
    const discountAmount = item.discountAmount || 0;
    return (basePrice - discountAmount) * item.cartQuantity;
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const handleCheckout = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert('Veuillez renseigner au minimum le nom et téléphone du client');
      return;
    }

    if (cart.length === 0) {
      alert('Le panier est vide');
      return;
    }

    if (!user) {
      alert('Utilisateur non connecté');
      return;
    }

    // Vérifier la disponibilité pour toutes les locations
    for (const item of cart.filter(i => i.isRental)) {
      if (!item.rentalStartDate || !item.rentalEndDate) {
        alert(`Veuillez définir les dates de location pour ${item.name}`);
        return;
      }
      
      const isAvailable = await checkProductAvailability(item.id, item.rentalStartDate, item.rentalEndDate);
      if (!isAvailable) {
        alert(`Le produit ${item.name} n'est pas disponible pour les dates sélectionnées`);
        return;
      }
    }

    try {
      const receiptItems = [];
      
      for (const item of cart) {
        const basePrice = item.isRental 
          ? item.rentalPricePerDay * (item.rentalDays || 1)
          : item.salePrice;
        
        const unitPrice = basePrice - (item.discountAmount || 0);
        
        const transactionId = await addTransaction({
          type: item.isRental ? 'rental' : 'sale',
          productId: item.id,
          productName: item.name,
          quantity: item.cartQuantity,
          unitPrice,
          totalAmount: unitPrice * item.cartQuantity,
          discount: item.discount,
          discountAmount: (item.discountAmount || 0) * item.cartQuantity,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          customerEmail: customerInfo.email,
          status: 'completed',
          agentId: user.id,
          agentName: user.name
        });

        if (item.isRental && item.rentalStartDate && item.rentalEndDate && item.rentalDays) {
          await addRental({
            transactionId,
            productId: item.id,
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            customerEmail: customerInfo.email,
            rentalStartDate: item.rentalStartDate,
            rentalEndDate: item.rentalEndDate,
            rentalDays: item.rentalDays,
            dailyRate: item.rentalPricePerDay,
            totalAmount: unitPrice * item.cartQuantity,
            discount: item.discount,
            discountAmount: (item.discountAmount || 0) * item.cartQuantity,
            depositAmount: 0,
            status: 'active',
            agentId: user.id,
            agentName: user.name
          });
        }

        receiptItems.push({
          name: item.name,
          quantity: item.cartQuantity,
          unitPrice: basePrice,
          finalPrice: unitPrice,
          discount: item.discount || 0,
          discountAmount: item.discountAmount || 0,
          isRental: item.isRental,
          rentalDays: item.rentalDays,
          barcode: item.barcode
        });
      }

      const receiptData = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        items: receiptItems,
        total: calculateTotal(),
        date: new Date(),
        agentName: user.name,
        receiptNumber: `REC-${Date.now()}`
      };

      setLastTransaction(receiptData);
      setShowReceipt(true);
      
      setCart([]);
      setCustomerInfo({ name: '', phone: '', email: '' });
      setAvailabilityCheck({});
      
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      alert('Erreur lors de la finalisation de la vente');
    }
  };

  const handlePrintReceipt = () => {
    if (lastTransaction) {
      generateReceiptPDF(lastTransaction);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Products */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Point de Vente</h1>
          <p className="text-gray-600 mt-2">Sélectionnez les produits pour vente ou location</p>
        </div>

        {/* Zone de recherche */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Filtrer par code-barres"
              value={barcodeFilter}
              onChange={(e) => setBarcodeFilter(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.brand} - {product.size}</p>
                  <p className="text-xs text-gray-500">{product.color}</p>
                  {product.barcode && (
                    <p className="text-xs text-gray-500">Code-barres : {product.barcode}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  Stock: {product.stock}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Prix vente:</span>
                  <span className="font-medium">{product.salePrice} DA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Location/jour:</span>
                  <span className="font-medium">{product.rentalPricePerDay} DA</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => addToCart(product, false)}
                  disabled={product.stock <= 0}
                  className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Vendre
                </button>
                <button
                  onClick={() => addToCart(product, true)}
                  disabled={product.stock <= 0 || !product.isAvailableForRental}
                  className="flex-1 bg-orange-600 text-white py-2 px-3 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Louer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
        <div className="flex items-center mb-6">
          <ShoppingCart className="w-6 h-6 text-gray-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Panier ({cart.length})</h2>
        </div>

        {/* Customer Info */}
        <div className="space-y-4 mb-6">
          <h3 className="font-medium text-gray-900 flex items-center">
            <User className="w-4 h-4 mr-2" />
            Informations Client
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nom du client *"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="tel"
                placeholder="Téléphone *"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                placeholder="Email (optionnel)"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
          {cart.map((item, index) => (
            <div key={`${item.id}-${item.isRental}-${index}`} className="border border-gray-100 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                  <p className="text-xs text-gray-600">{item.size} - {item.color}</p>
                  {item.barcode && (
                    <p className="text-xs text-gray-500">Code-barres : {item.barcode}</p>
                  )}
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                    item.isRental ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.isRental ? 'Location' : 'Vente'}
                  </span>
                </div>
                <button
                  onClick={() => removeFromCart(item.id, item.isRental)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateCartQuantity(item.id, item.isRental, item.cartQuantity - 1)}
                    className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium">{item.cartQuantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.id, item.isRental, item.cartQuantity + 1)}
                    className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {calculateItemTotal(item).toLocaleString('fr-FR')} DA
                  </p>
                  {item.discountAmount && item.discountAmount > 0 && (
                    <p className="text-xs text-green-600">
                      -{(item.discountAmount * item.cartQuantity).toLocaleString('fr-FR')} DA
                    </p>
                  )}
                </div>
              </div>

              {/* Réduction */}
              <div className="flex items-center space-x-2 mb-2">
                <Percent className="w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.discount || 0}
                  onChange={(e) => updateDiscount(item.id, item.isRental, Number(e.target.value))}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="0"
                />
                <span className="text-xs text-gray-600">% de réduction</span>
              </div>

              {item.isRental && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={item.rentalStartDate?.toISOString().split('T')[0] || ''}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        const startDate = new Date(e.target.value);
                        updateRentalDates(item.id, startDate, item.rentalDays || 1);
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">Durée:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.rentalDays || 1}
                      onChange={(e) => {
                        const days = parseInt(e.target.value);
                        if (item.rentalStartDate) {
                          updateRentalDates(item.id, item.rentalStartDate, days);
                        }
                      }}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-xs text-gray-600">jour(s)</span>
                  </div>
                  {availabilityCheck[item.id] === false && (
                    <div className="flex items-center space-x-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>Produit non disponible pour ces dates</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {cart.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Votre panier est vide</p>
            </div>
          )}
        </div>

        {/* Total & Checkout */}
        {cart.length > 0 && (
          <div className="space-y-4">
            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>{calculateTotal().toLocaleString('fr-FR')} DA</span>
              </div>
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={Object.values(availabilityCheck).some(available => !available)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Finaliser la Vente
            </button>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-100 text-center">
              <ReceiptIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">Vente Terminée</h2>
              <p className="text-gray-600">HaliStock Boutique</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center text-sm text-gray-600">
                <p>N° Reçu: {lastTransaction.receiptNumber}</p>
                <p>{new Date(lastTransaction.date).toLocaleString('fr-FR')}</p>
                <p>Agent: {lastTransaction.agentName}</p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-medium text-gray-900 mb-2">Client:</h3>
                <p className="text-sm text-gray-600">{lastTransaction.customerName}</p>
                <p className="text-sm text-gray-600">{lastTransaction.customerPhone}</p>
                {lastTransaction.customerEmail && (
                  <p className="text-sm text-gray-600">{lastTransaction.customerEmail}</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-medium text-gray-900 mb-2">Articles:</h3>
                <div className="space-y-2">
                  {lastTransaction.items.map((item: any, index: number) => (
                    <div key={index} className="text-sm">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-gray-600">
                            {item.quantity}x {item.unitPrice}DA
                            {item.isRental && ` (${item.rentalDays} jour${item.rentalDays > 1 ? 's' : ''})`}
                            {item.barcode && <> | Code-barres: {item.barcode}</>}
                          </p>
                          {item.discount > 0 && (
                            <p className="text-green-600 text-xs">
                              Réduction {item.discount}%: -{(item.discountAmount * item.quantity).toLocaleString('fr-FR')} DA
                            </p>
                          )}
                        </div>
                        <span className="font-medium">
                          {((item.finalPrice || item.unitPrice) * item.quantity).toLocaleString('fr-FR')} DA
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>{lastTransaction.total.toLocaleString('fr-FR')} DA</span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-100">
                <p>Merci pour votre achat !</p>
                <p>Conservez ce reçu comme preuve d'achat</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 space-y-3">
              <button
                onClick={handlePrintReceipt}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le Reçu PDF</span>
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}