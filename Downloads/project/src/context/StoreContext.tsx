import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Transaction, Rental, StoreStats, ProductAvailability } from '../types';

interface StoreContextType {
  products: Product[];
  transactions: Transaction[];
  rentals: Rental[];
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
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
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
        loadRentals()
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
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        type: transactionData.type,
        product_id: transactionData.productId,
        product_name: transactionData.productName,
        quantity: transactionData.quantity,
        unit_price: transactionData.unitPrice,
        total_amount: transactionData.totalAmount,
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

    await loadTransactions();
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
    const revenue = filteredTransactions.reduce((sum, t) => sum + t.total_amount, 0);
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

  const refreshData = async () => {
    await loadInitialData();
  };

  return (
    <StoreContext.Provider value={{
      products,
      transactions,
      rentals,
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
      refreshData
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