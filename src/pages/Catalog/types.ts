import { Product } from '../../types';

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  cost: number;
  currency?: string;
  tax?: number;
  service_duration_hours?: number;
  service_duration_unit?: 'hours' | 'days';
  stock_qty?: number;
  low_stock_threshold?: number;
  notes?: string;
}

export interface ExtendedProduct extends Product {
  sku?: string;
  cost?: number;
  tax?: number;
  stock_qty?: number;
  low_stock_threshold?: number;
  service_duration_hours?: number;
  service_duration_unit?: 'hours' | 'days';
  sop_id?: number | null;
  process_mapping_id?: number | null;
  is_cost_variable?: boolean;
  is_price_variable?: boolean;
  has_variants?: boolean;
  variants?: ProductVariant[];
}

export interface PriceList {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface PriceListOverride {
  id: number;
  price_list_id: number;
  product_id: number;
  override_price: number;
  created_at?: string;
}

export interface ProductPriceListItem {
  id: number;
  price_list_id: number;
  product_id: number;
  override_price: number;
  created_at?: string;
  price_list_name?: string;
  price_list_description?: string;
  price_list_active?: boolean;
}

export interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface CurrencyItem {
  code: string;
  name_en: string;
  name_ar: string;
  rate_to_sar: number;
  symbol: string;
}

export interface InvoiceLog {
  id: string;
  date: string;
  customer_name: string;
  total_amount: number;
}
