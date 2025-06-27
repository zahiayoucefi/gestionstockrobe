export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent';
  createdAt: Date;
  isActive: boolean;
  password?: string;
}

export type Product = {
  id: string;
  name: string;
  category: string;
  size: string;
  color: string;
  brand: string;
  purchasePrice: number;
  salePrice: number;
  rentalPricePerDay: number;
  stock: number;
  description: string;
  barcode?: string;
  isAvailableForRental?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface Transaction {
  id: string;
  type: 'sale' | 'rental';
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  discount?: number;
  discountAmount?: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  status: 'completed' | 'pending' | 'returned' | 'cancelled';
  agentId: string;
  agentName: string;
  createdAt: Date;
  notes?: string;
}

export interface Rental {
  id: string;
  transactionId: string;
  productId: string;
  productName?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  rentalStartDate: Date;
  rentalEndDate: Date;
  rentalDays: number;
  dailyRate: number;
  totalAmount: number;
  discount?: number;
  discountAmount?: number;
  depositAmount: number;
  status: 'active' | 'returned' | 'overdue' | 'cancelled';
  agentId: string;
  agentName: string;
  notes?: string;
  createdAt: Date;
  returnedAt?: Date;
}

export interface RentalCalendar {
  id: string;
  productId: string;
  rentalId: string;
  reservedDate: Date;
  status: 'reserved' | 'occupied' | 'available';
  createdAt: Date;
}

export interface Receipt {
  id: string;
  transactionId: string;
  receiptNumber: string;
  customerName: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  type: 'sale' | 'rental';
  rentalInfo?: {
    days: number;
    returnDate: Date;
  };
  createdAt: Date;
}

export interface StoreStats {
  totalSales: number;
  totalRentals: number;
  revenue: number;
  lowStockItems: number;
  totalProducts: number;
  pendingReturns: number;
  activeRentals: number;
  overdueRentals: number;
}

export interface ProductAvailability {
  productId: string;
  availableDates: Date[];
  reservedDates: Date[];
  isAvailable: boolean;
}