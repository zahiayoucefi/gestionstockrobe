import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'admin' | 'agent';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          email: string;
          role: 'admin' | 'agent';
          is_active?: boolean;
        };
        Update: {
          name?: string;
          email?: string;
          role?: 'admin' | 'agent';
          is_active?: boolean;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          category: string;
          size: string;
          color: string;
          brand: string;
          purchase_price: number;
          sale_price: number;
          rental_price_per_day: number;
          stock: number;
          description: string;
          barcode: string | null;
          is_available_for_rental: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          category: string;
          size: string;
          color: string;
          brand: string;
          purchase_price: number;
          sale_price: number;
          rental_price_per_day: number;
          stock: number;
          description?: string;
          barcode?: string;
          is_available_for_rental?: boolean;
        };
        Update: {
          name?: string;
          category?: string;
          size?: string;
          color?: string;
          brand?: string;
          purchase_price?: number;
          sale_price?: number;
          rental_price_per_day?: number;
          stock?: number;
          description?: string;
          barcode?: string;
          is_available_for_rental?: boolean;
        };
      };
      transactions: {
        Row: {
          id: string;
          type: 'sale' | 'rental';
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          total_amount: number;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          status: 'completed' | 'pending' | 'returned' | 'cancelled';
          agent_id: string;
          agent_name: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          type: 'sale' | 'rental';
          product_id: string;
          product_name: string;
          quantity?: number;
          unit_price: number;
          total_amount: number;
          customer_name: string;
          customer_phone: string;
          customer_email?: string;
          status?: 'completed' | 'pending' | 'returned' | 'cancelled';
          agent_id: string;
          agent_name: string;
          notes?: string;
        };
        Update: {
          status?: 'completed' | 'pending' | 'returned' | 'cancelled';
          notes?: string;
        };
      };
      rentals: {
        Row: {
          id: string;
          transaction_id: string;
          product_id: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          rental_start_date: string;
          rental_end_date: string;
          rental_days: number;
          daily_rate: number;
          total_amount: number;
          deposit_amount: number;
          status: 'active' | 'returned' | 'overdue' | 'cancelled';
          agent_id: string;
          agent_name: string;
          notes: string | null;
          created_at: string;
          returned_at: string | null;
        };
        Insert: {
          transaction_id: string;
          product_id: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string;
          rental_start_date: string;
          rental_end_date: string;
          rental_days: number;
          daily_rate: number;
          total_amount: number;
          deposit_amount?: number;
          status?: 'active' | 'returned' | 'overdue' | 'cancelled';
          agent_id: string;
          agent_name: string;
          notes?: string;
        };
        Update: {
          status?: 'active' | 'returned' | 'overdue' | 'cancelled';
          returned_at?: string;
          notes?: string;
        };
      };
      rental_calendar: {
        Row: {
          id: string;
          product_id: string;
          rental_id: string;
          reserved_date: string;
          status: 'reserved' | 'occupied' | 'available';
          created_at: string;
        };
        Insert: {
          product_id: string;
          rental_id: string;
          reserved_date: string;
          status?: 'reserved' | 'occupied' | 'available';
        };
        Update: {
          status?: 'reserved' | 'occupied' | 'available';
        };
      };
    };
  };
};