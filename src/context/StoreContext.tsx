import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Transaction, Rental, StoreStats, ProductAvailability, Customer, Payment } from '../types';

interface StoreContextType {
  products: Product[];
  transactions: Transaction[];
  rentals: Rental[];
  customers: Customer[];
  payments: Payment[];
  loading: boolean;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<string>;
  addRental: (rental: Omit<Rental, 'id' | 'createdAt'>) => Promise<void>;
  updateRentalStatus: (id: string, status: Rental['status'], returnedAt?: Date) => Promise<void>;
  checkProductAvailability: (productId: string, startDate: Date, endDate: Date) => Promise<boolean>;
  getProductAvailability: (productId: string, month: Date) => Promise<ProductAvailability>;
  updateStock: (productId: string, quantity: number) => Promise<void>;
  getStats: (dateFrom?: Date, dateTo?: Date) => Promise<StoreStats>;
  refreshData: () => Promise<void>;
  getCustomerHistory: (customerPhone: string) => Promise<{ transactions: Transaction[], rentals: Rental[], payments: Payment[] }>;
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  updateTransactionPayment: (transactionId: string, amountPaid: number) => Promise<void>;
  updateRentalPayment: (rentalId: string, amountPaid: number) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProducts(),
        loadTransactions(),
        loadRentals(),
        loadCustomers(),
        loadPayments()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors du chargement des produits:', error);
      return;
    }

    const formattedProducts: Product[] = data.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      size: item.size,
      color: item.color,
      brand: item.brand,
      purchasePrice: item.purchase_price,
      salePrice: item.sale_price,
      rentalPricePerDay: item.rental_price_per_day,
      stock: item.stock,
      description: item.description,
      barcode: item.barcode,
      isAvailableForRental: item.is_available_for_rental,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));

    setProducts(formattedProducts);
  };

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      return;
    }

    const formattedTransactions: Transaction[] = data.map(item => ({
      id: item.id,
      type: item.type,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalAmount: item.total_amount,
      amountPaid: item.amount_paid || item.total_amount,
      remainingAmount: item.remaining_amount || 0,
      paymentStatus: item.payment_status || 'completed',
      discount: item.discount,
      discountAmount: item.discount_amount,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      customerEmail: item.customer_email,
      status: item.status,
      agentId: item.agent_id,
      agentName: item.agent_name,
      createdAt: new Date(item.created_at),
      notes: item.notes
    }));

    setTransactions(formattedTransactions);
  };

  const loadRentals = async () => {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        products!inner(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors du chargement des locations:', error);
      return;
    }

    const formattedRentals: Rental[] = data.map(item => ({
      id: item.id,
      transactionId: item.transaction_id,
      productId: item.product_id,
      productName: item.products?.name,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      customerEmail: item.customer_email,
      rentalStartDate: new Date(item.rental_start_date),
      rentalEndDate: new Date(item.rental_end_date),
      rentalDays: item.rental_days,
      dailyRate: item.daily_rate,
      totalAmount: item.total_amount,
      amountPaid: item.amount_paid || item.total_amount,
      remainingAmount: item.remaining_amount || 0,
      paymentStatus: item.payment_status || 'completed',
      discount: item.discount,
      discountAmount: item.discount_amount,
      depositAmount: item.deposit_amount,
      status: item.status,
      agentId: item.agent_id,
      agentName: item.agent_name,
      notes: item.notes,
      createdAt: new Date(item.created_at),
      returnedAt: item.returned_at ? new Date(item.returned_at) : undefined
    }));

    setRentals(formattedRentals);
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors du chargement des clients:', error);
      return;
    }

    const formattedCustomers: Customer[] = data.map(item => ({
      id: item.id,
      name: item.name,
      phone: item.phone,
      email: item.email,
      address: item.address,
      notes: item.notes,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));

    setCustomers(formattedCustomers);
  };

  const loadPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors du chargement des paiements:', error);
      return;
    }

    const formattedPayments: Payment[] = data.map(item => ({
      id: item.id,
      transactionId: item.transaction_id,
      rentalId: item.rental_id,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      amountPaid: item.amount_paid,
      remainingAmount: item.remaining_amount,
      paymentMethod: item.payment_method,
      paymentDate: new Date(item.payment_date),
      agentId: item.agent_id,
      agentName: item.agent_name,
      notes: item.notes,
      isCompleted: item.is_completed,
      createdAt: new Date(item.created_at)
    }));

    setPayments(formattedPayments);
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        category: productData.category,
        size: productData.size,
        color: productData.color,
        brand: productData.brand,
        purchase_price: productData.purchasePrice,
        sale_price: productData.salePrice,
        rental_price_per_day: productData.rentalPricePerDay,
        stock: productData.stock,
        description: productData.description,
        barcode: productData.barcode,
        is_available_for_rental: productData.isAvailableForRental ?? true
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'ajout du produit:', error);
      throw error;
    }

    await loadProducts();
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    const updateData: any = {};
    
    if (productData.name) updateData.name = productData.name;
    if (productData.category) updateData.category = productData.category;
    if (productData.size) updateData.size = productData.size;
    if (productData.color) updateData.color = productData.color;
    if (productData.brand) updateData.brand = productData.brand;
    if (productData.purchasePrice !== undefined) updateData.purchase_price = productData.purchasePrice;
    if (productData.salePrice !== undefined) updateData.sale_price = productData.salePrice;
    if (productData.rentalPricePerDay !== undefined) updateData.rental_price_per_day = productData.rentalPricePerDay;
    if (productData.stock !== undefined) updateData.stock = productData.stock;
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.barcode !== undefined) updateData.barcode = productData.barcode;
    if (productData.isAvailableForRental !== undefined) updateData.is_available_for_rental = productData.isAvailableForRental;

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw error;
    }

    await loadProducts();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      throw error;
    }

    await loadProducts();
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    // Créer ou mettre à jour le client
    await supabase.rpc('create_customer_if_not_exists', {
      customer_name: transactionData.customerName,
      customer_phone: transactionData.customerPhone,
      customer_email: transactionData.customerEmail
    });

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        type: transactionData.type,
        product_id: transactionData.productId,
        product_name: transactionData.productName,
        quantity: transactionData.quantity,
        unit_price: transactionData.unitPrice,
        total_amount: transactionData.totalAmount,
        amount_paid: transactionData.amountPaid || transactionData.totalAmount,
        remaining_amount: transactionData.remainingAmount || 0,
        payment_status: transactionData.paymentStatus || 'completed',
        discount: transactionData.discount,
        discount_amount: transactionData.discountAmount,
        customer_name: transactionData.customerName,
        customer_phone: transactionData.customerPhone,
        customer_email: transactionData.customerEmail,
        status: transactionData.status,
        agent_id: transactionData.agentId,
        agent_name: transactionData.agentName,
        notes: transactionData.notes
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'ajout de la transaction:', error);
      throw error;
    }

    if (transactionData.type === 'sale') {
      await updateStock(transactionData.productId, -transactionData.quantity);
    }

    await Promise.all([loadTransactions(), loadCustomers()]);
    return data.id;
  };

  const addRental = async (rentalData: Omit<Rental, 'id' | 'createdAt'>) => {
    const isAvailable = await checkProductAvailability(
      rentalData.productId,
      rentalData.rentalStartDate,
      rentalData.rentalEndDate
    );

    if (!isAvailable) {
      throw new Error('Le produit n\'est pas disponible pour ces dates');
    }

    const { data, error } = await supabase
      .from('rentals')
      .insert({
        transaction_id: rentalData.transactionId,
        product_id: rentalData.productId,
        customer_name: rentalData.customerName,
        customer_phone: rentalData.customerPhone,
        customer_email: rentalData.customerEmail,
        rental_start_date: rentalData.rentalStartDate.toISOString().split('T')[0],
        rental_end_date: rentalData.rentalEndDate.toISOString().split('T')[0],
        rental_days: rentalData.rentalDays,
        daily_rate: rentalData.dailyRate,
        total_amount: rentalData.totalAmount,
        amount_paid: rentalData.amountPaid || rentalData.totalAmount,
        remaining_amount: rentalData.remainingAmount || 0,
        payment_status: rentalData.paymentStatus || 'completed',
        discount: rentalData.discount,
        discount_amount: rentalData.discountAmount,
        deposit_amount: rentalData.depositAmount,
        status: rentalData.status,
        agent_id: rentalData.agentId,
        agent_name: rentalData.agentName,
        notes: rentalData.notes
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'ajout de la location:', error);
      throw error;
    }

    const dates = [];
    const currentDate = new Date(rentalData.rentalStartDate);
    while (currentDate <= rentalData.rentalEndDate) {
      dates.push({
        product_id: rentalData.productId,
        rental_id: data.id,
        reserved_date: currentDate.toISOString().split('T')[0],
        status: 'reserved' as const
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (dates.length > 0) {
      const { error: calendarError } = await supabase
        .from('rental_calendar')
        .insert(dates);

      if (calendarError) {
        console.error('Erreur lors de la création du calendrier:', calendarError);
      }
    }

    await loadRentals();
    return data.id;
  };

  const updateRentalStatus = async (id: string, status: Rental['status'], returnedAt?: Date) => {
    const updateData: any = { status };
    if (returnedAt) {
      updateData.returned_at = returnedAt.toISOString();
    }

    const { error } = await supabase
      .from('rentals')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la mise à jour du statut de location:', error);
      throw error;
    }

    if (status === 'returned') {
      const { error: calendarError } = await supabase
        .from('rental_calendar')
        .update({ status: 'available' })
        .eq('rental_id', id);

      if (calendarError) {
        console.error('Erreur lors de la libération du calendrier:', calendarError);
      }
    }

    await loadRentals();
  };

  const checkProductAvailability = async (productId: string, startDate: Date, endDate: Date): Promise<boolean> => {
    const { data, error } = await supabase
      .from('rental_calendar')
      .select('reserved_date')
      .eq('product_id', productId)
      .eq('status', 'reserved')
      .gte('reserved_date', startDate.toISOString().split('T')[0])
      .lte('reserved_date', endDate.toISOString().split('T')[0]);

    if (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error);
      return false;
    }

    return data.length === 0;
  };

  const getProductAvailability = async (productId: string, month: Date): Promise<ProductAvailability> => {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('rental_calendar')
      .select('reserved_date, status')
      .eq('product_id', productId)
      .gte('reserved_date', startOfMonth.toISOString().split('T')[0])
      .lte('reserved_date', endOfMonth.toISOString().split('T')[0]);

    if (error) {
      console.error('Erreur lors de la récupération de la disponibilité:', error);
      return {
        productId,
        availableDates: [],
        reservedDates: [],
        isAvailable: true
      };
    }

    const reservedDates = data
      .filter(item => item.status === 'reserved')
      .map(item => new Date(item.reserved_date));

    const availableDates: Date[] = [];
    const currentDate = new Date(startOfMonth);
    while (currentDate <= endOfMonth) {
      if (!reservedDates.some(date => date.toDateString() === currentDate.toDateString())) {
        availableDates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      productId,
      availableDates,
      reservedDates,
      isAvailable: availableDates.length > 0
    };
  };

  const updateStock = async (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newStock = Math.max(0, product.stock + quantity);

    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      throw error;
    }

    await loadProducts();
  };

  const getStats = async (dateFrom?: Date, dateTo?: Date): Promise<StoreStats> => {
    let transactionQuery = supabase.from('transactions').select('*');
    let rentalQuery = supabase.from('rentals').select('*');

    if (dateFrom) {
      transactionQuery = transactionQuery.gte('created_at', dateFrom.toISOString());
      rentalQuery = rentalQuery.gte('created_at', dateFrom.toISOString());
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      transactionQuery = transactionQuery.lte('created_at', endDate.toISOString());
      rentalQuery = rentalQuery.lte('created_at', endDate.toISOString());
    }

    const [transactionsResult, rentalsResult] = await Promise.all([
      transactionQuery,
      rentalQuery
    ]);

    const filteredTransactions = transactionsResult.data || [];
    const filteredRentals = rentalsResult.data || [];

    const totalSales = filteredTransactions.filter(t => t.type === 'sale').length;
    const totalRentals = filteredTransactions.filter(t => t.type === 'rental').length;
    const revenue = filteredTransactions.reduce((sum, t) => sum + (t.amount_paid || t.total_amount), 0);
    const lowStockItems = products.filter(p => p.stock <= 2).length;
    const totalProducts = products.length;
    const activeRentals = filteredRentals.filter(r => r.status === 'active').length;
    const overdueRentals = filteredRentals.filter(r => {
      if (r.status !== 'active') return false;
      const endDate = new Date(r.rental_end_date);
      return endDate < new Date();
    }).length;
    const pendingReturns = activeRentals;

    return {
      totalSales,
      totalRentals,
      revenue,
      lowStockItems,
      totalProducts,
      pendingReturns,
      activeRentals,
      overdueRentals
    };
  };

  const getCustomerHistory = async (customerPhone: string) => {
    const [transactionsResult, rentalsResult, paymentsResult] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('customer_phone', customerPhone)
        .order('created_at', { ascending: false }),
      supabase
        .from('rentals')
        .select('*, products!inner(name)')
        .eq('customer_phone', customerPhone)
        .order('created_at', { ascending: false }),
      supabase
        .from('payments')
        .select('*')
        .eq('customer_phone', customerPhone)
        .order('created_at', { ascending: false })
    ]);

    const customerTransactions = transactionsResult.data?.map(item => ({
      id: item.id,
      type: item.type,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalAmount: item.total_amount,
      amountPaid: item.amount_paid || item.total_amount,
      remainingAmount: item.remaining_amount || 0,
      paymentStatus: item.payment_status || 'completed',
      discount: item.discount,
      discountAmount: item.discount_amount,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      customerEmail: item.customer_email,
      status: item.status,
      agentId: item.agent_id,
      agentName: item.agent_name,
      createdAt: new Date(item.created_at),
      notes: item.notes
    })) || [];

    const customerRentals = rentalsResult.data?.map(item => ({
      id: item.id,
      transactionId: item.transaction_id,
      productId: item.product_id,
      productName: item.products?.name,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      customerEmail: item.customer_email,
      rentalStartDate: new Date(item.rental_start_date),
      rentalEndDate: new Date(item.rental_end_date),
      rentalDays: item.rental_days,
      dailyRate: item.daily_rate,
      totalAmount: item.total_amount,
      amountPaid: item.amount_paid || item.total_amount,
      remainingAmount: item.remaining_amount || 0,
      paymentStatus: item.payment_status || 'completed',
      discount: item.discount,
      discountAmount: item.discount_amount,
      depositAmount: item.deposit_amount,
      status: item.status,
      agentId: item.agent_id,
      agentName: item.agent_name,
      notes: item.notes,
      createdAt: new Date(item.created_at),
      returnedAt: item.returned_at ? new Date(item.returned_at) : undefined
    })) || [];

    const customerPayments = paymentsResult.data?.map(item => ({
      id: item.id,
      transactionId: item.transaction_id,
      rentalId: item.rental_id,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      amountPaid: item.amount_paid,
      remainingAmount: item.remaining_amount,
      paymentMethod: item.payment_method,
      paymentDate: new Date(item.payment_date),
      agentId: item.agent_id,
      agentName: item.agent_name,
      notes: item.notes,
      isCompleted: item.is_completed,
      createdAt: new Date(item.created_at)
    })) || [];

    return {
      transactions: customerTransactions,
      rentals: customerRentals,
      payments: customerPayments
    };
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    const { error } = await supabase
      .from('payments')
      .insert({
        transaction_id: paymentData.transactionId,
        rental_id: paymentData.rentalId,
        customer_name: paymentData.customerName,
        customer_phone: paymentData.customerPhone,
        amount_paid: paymentData.amountPaid,
        remaining_amount: paymentData.remainingAmount,
        payment_method: paymentData.paymentMethod,
        payment_date: paymentData.paymentDate.toISOString(),
        agent_id: paymentData.agentId,
        agent_name: paymentData.agentName,
        notes: paymentData.notes,
        is_completed: paymentData.isCompleted
      });

    if (error) {
      console.error('Erreur lors de l\'ajout du paiement:', error);
      throw error;
    }

    await loadPayments();
  };

  const updateTransactionPayment = async (transactionId: string, amountPaid: number) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const totalPaid = (transaction.amountPaid || 0) + amountPaid;
    const remaining = Math.max(0, transaction.totalAmount - totalPaid);
    const paymentStatus = remaining === 0 ? 'completed' : totalPaid > 0 ? 'partial' : 'pending';

    const { error } = await supabase
      .from('transactions')
      .update({
        amount_paid: totalPaid,
        remaining_amount: remaining,
        payment_status: paymentStatus
      })
      .eq('id', transactionId);

    if (error) {
      console.error('Erreur lors de la mise à jour du paiement:', error);
      throw error;
    }

    await loadTransactions();
  };

  const updateRentalPayment = async (rentalId: string, amountPaid: number) => {
    const rental = rentals.find(r => r.id === rentalId);
    if (!rental) return;

    const totalPaid = (rental.amountPaid || 0) + amountPaid;
    const remaining = Math.max(0, rental.totalAmount - totalPaid);
    const paymentStatus = remaining === 0 ? 'completed' : totalPaid > 0 ? 'partial' : 'pending';

    const { error } = await supabase
      .from('rentals')
      .update({
        amount_paid: totalPaid,
        remaining_amount: remaining,
        payment_status: paymentStatus
      })
      .eq('id', rentalId);

    if (error) {
      console.error('Erreur lors de la mise à jour du paiement:', error);
      throw error;
    }

    await loadRentals();
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  return (
    <StoreContext.Provider value={{
      products,
      transactions,
      rentals,
      customers,
      payments,
      loading,
      addProduct,
      updateProduct,
      deleteProduct,
      addTransaction,
      addRental,
      updateRentalStatus,
      checkProductAvailability,
      getProductAvailability,
      updateStock,
      getStats,
      refreshData,
      getCustomerHistory,
      addPayment,
      updateTransactionPayment,
      updateRentalPayment
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}