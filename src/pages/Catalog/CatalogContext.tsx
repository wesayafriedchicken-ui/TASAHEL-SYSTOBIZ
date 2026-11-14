import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ExtendedProduct, PriceList, PriceListOverride, ProductPriceListItem, PromoCode, CurrencyItem, InvoiceLog } from './types';

interface CatalogContextType {
  products: ExtendedProduct[];
  categories: string[];
  sops: any[];
  processMappings: any[];
  priceLists: PriceList[];
  promoCodes: PromoCode[];
  customers: any[];
  isLoading: boolean;
  isSaving: boolean;
  baseCurrency: string;
  currenciesList: CurrencyItem[];
  selectedPriceList: PriceList | null;
  setSelectedPriceList: (pl: PriceList | null) => void;
  priceOverrides: PriceListOverride[];
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  fetchInitialData: () => Promise<void>;
  fetchPriceOverrides: (listId: number) => Promise<void>;
  saveProduct: (product: Partial<ExtendedProduct>) => Promise<ExtendedProduct | null>;
  deleteProduct: (id: number) => Promise<boolean>;
  savePriceList: (priceList: Partial<PriceList>) => Promise<PriceList | null>;
  deletePriceList: (id: number) => Promise<boolean>;
  savePromoCode: (promo: Partial<PromoCode>) => Promise<PromoCode | null>;
  deletePromoCode: (id: number) => Promise<boolean>;
  savePriceOverride: (listId: number, productId: number, price: number) => Promise<boolean>;
  deletePriceOverride: (listId: number, productId: number) => Promise<boolean>;
  fetchProductPriceLists: (productId: number) => Promise<ProductPriceListItem[]>;
  seedSampleData: () => Promise<void>;
  exportProductsCSV: () => void;
  importProductsCSV: (e: React.ChangeEvent<HTMLInputElement>) => Promise<number>;
  invoiceLogs: InvoiceLog[];
  addInvoiceLog: (log: InvoiceLog) => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sops, setSops] = useState<any[]>([]);
  const [processMappings, setProcessMappings] = useState<any[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);
  const [priceOverrides, setPriceOverrides] = useState<PriceListOverride[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [invoiceLogs, setInvoiceLogs] = useState<InvoiceLog[]>(() => {
    return [
      { id: 'INV-SIM-89104', date: '2026-04-12', customer_name: 'Smart Solutions Ltd', total_amount: 34200 },
      { id: 'INV-SIM-44219', date: '2026-04-10', customer_name: 'Ameely Travel Agency', total_amount: 18500 }
    ];
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4000);
  }, []);

  const addInvoiceLog = useCallback((log: InvoiceLog) => {
    setInvoiceLogs(prev => [log, ...prev]);
  }, []);

  // Central Dynamic Currency Configs
  const [baseCurrency] = useState<string>(() => {
    return localStorage.getItem('acct_base_currency') || 'SAR';
  });

  const [currenciesList] = useState<CurrencyItem[]>(() => {
    const defaultList: CurrencyItem[] = [
      { code: 'SAR', name_en: 'Saudi Riyal', name_ar: 'ريال سعودي', rate_to_sar: 1.0, symbol: 'ر.س' },
      { code: 'USD', name_en: 'US Dollar', name_ar: 'دولار أمريكي', rate_to_sar: 3.75, symbol: '$' },
      { code: 'EUR', name_en: 'Euro', name_ar: 'يورو', rate_to_sar: 4.05, symbol: '€' },
      { code: 'EGP', name_en: 'Egyptian Pound', name_ar: 'جنيه مصري', rate_to_sar: 0.078, symbol: 'ج.م' },
      { code: 'AED', name_en: 'UAE Dirham', name_ar: 'درهم إماراتي', rate_to_sar: 1.02, symbol: 'د.إ' },
      { code: 'GBP', name_en: 'British Pound', name_ar: 'جنيه إسترليني', rate_to_sar: 4.75, symbol: '£' },
    ];
    const savedRatesStr = localStorage.getItem('acct_currency_rates');
    if (savedRatesStr) {
      try {
        const rates = JSON.parse(savedRatesStr);
        if (Array.isArray(rates)) {
          return defaultList.map(c => {
            const matched = rates.find((r: any) => r.code === c.code);
            return matched ? { ...c, rate_to_sar: matched.rate_to_sar } : c;
          });
        }
      } catch (e) {
        console.error('Error parsing currency rates:', e);
      }
    }
    return defaultList;
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token && token !== 'null') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchPriceOverrides = useCallback(async (listId: number) => {
    try {
      const headers = getAuthHeaders();
      delete headers['Content-Type'];
      const res = await fetch(`/api/products/price-lists/all/${listId}/items`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPriceOverrides(data);
      }
    } catch (err) {
      console.error('Error loading price overrides:', err);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      delete headers['Content-Type'];

      // Fetch products, price-lists, promo-codes, sops, process mappings, customers in parallel
      const [prodRes, listsRes, promoRes, sopsRes, pmRes, custRes] = await Promise.all([
        fetch('/api/products', { headers }),
        fetch('/api/products/price-lists/all', { headers }),
        fetch('/api/products/promo-codes/all', { headers }),
        fetch('/api/sops', { headers }),
        fetch('/api/process-mapping', { headers }),
        fetch('/api/crm/customers', { headers }).catch(() => null)
      ]);

      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data);
        const cats = Array.from(new Set(data.map((p: any) => p.category).filter(Boolean))) as string[];
        setCategories(cats);
      }

      if (listsRes.ok) {
        const lists = await listsRes.json();
        setPriceLists(lists);
        if (lists.length > 0 && !selectedPriceList) {
          setSelectedPriceList(lists[0]);
          fetchPriceOverrides(lists[0].id);
        }
      }

      if (promoRes.ok) {
        const promos = await promoRes.json();
        setPromoCodes(promos);
      }

      if (sopsRes.ok) {
        const sopsData = await sopsRes.json();
        setSops(sopsData);
      }

      if (pmRes.ok) {
        const pmData = await pmRes.json();
        setProcessMappings(pmData);
      }

      if (custRes && custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData);
      }
    } catch (err) {
      console.error('Error loading catalog data:', err);
      showToast('Error loading catalog data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPriceOverrides, selectedPriceList, showToast]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPriceList) {
      fetchPriceOverrides(selectedPriceList.id);
    }
  }, [selectedPriceList, fetchPriceOverrides]);

  const saveProduct = async (productData: Partial<ExtendedProduct>): Promise<ExtendedProduct | null> => {
    setIsSaving(true);
    try {
      const method = productData.id ? 'PUT' : 'POST';
      const url = productData.id ? `/api/products/${productData.id}` : '/api/products';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(productData)
      });

      if (!res.ok) {
        throw new Error('Failed to save product');
      }

      const saved = await res.json();
      await fetchInitialData();
      showToast(productData.id ? 'Product updated successfully' : 'Product created successfully', 'success');
      return saved;
    } catch (err: any) {
      console.error('Error saving product:', err);
      showToast(err.message || 'Error saving product', 'error');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (id: number): Promise<boolean> => {
    setIsSaving(true);
    try {
      const headers = getAuthHeaders();
      delete headers['Content-Type'];
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        showToast('Product deleted successfully', 'success');
        return true;
      }
      throw new Error('Failed to delete product');
    } catch (err: any) {
      console.error('Error deleting product:', err);
      showToast(err.message || 'Error deleting product', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const savePriceList = async (listData: Partial<PriceList>): Promise<PriceList | null> => {
    setIsSaving(true);
    try {
      const method = listData.id ? 'PUT' : 'POST';
      const url = listData.id ? `/api/products/price-lists/all/${listData.id}` : '/api/products/price-lists/all';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(listData)
      });

      if (!res.ok) throw new Error('Failed to save price list');

      const saved = await res.json();
      await fetchInitialData();
      showToast(listData.id ? 'Price list updated' : 'Price list created', 'success');
      return saved;
    } catch (err: any) {
      console.error('Error saving price list:', err);
      showToast(err.message || 'Error saving price list', 'error');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const deletePriceList = async (id: number): Promise<boolean> => {
    setIsSaving(true);
    try {
      const headers = getAuthHeaders();
      delete headers['Content-Type'];
      const res = await fetch(`/api/products/price-lists/all/${id}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setPriceLists(prev => prev.filter(p => p.id !== id));
        if (selectedPriceList?.id === id) {
          setSelectedPriceList(null);
        }
        showToast('Price list deleted', 'success');
        return true;
      }
      throw new Error('Failed to delete price list');
    } catch (err: any) {
      console.error('Error deleting price list:', err);
      showToast(err.message || 'Error deleting price list', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const savePromoCode = async (promoData: Partial<PromoCode>): Promise<PromoCode | null> => {
    setIsSaving(true);
    try {
      const method = promoData.id ? 'PUT' : 'POST';
      const url = promoData.id ? `/api/products/promo-codes/all/${promoData.id}` : '/api/products/promo-codes/all';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(promoData)
      });

      if (!res.ok) throw new Error('Failed to save promo code');

      const saved = await res.json();
      await fetchInitialData();
      showToast(promoData.id ? 'Promo coupon updated' : 'Promo coupon created', 'success');
      return saved;
    } catch (err: any) {
      console.error('Error saving promo code:', err);
      showToast(err.message || 'Error saving promo code', 'error');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const deletePromoCode = async (id: number): Promise<boolean> => {
    setIsSaving(true);
    try {
      const headers = getAuthHeaders();
      delete headers['Content-Type'];
      const res = await fetch(`/api/products/promo-codes/all/${id}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setPromoCodes(prev => prev.filter(p => p.id !== id));
        showToast('Promo coupon removed', 'success');
        return true;
      }
      throw new Error('Failed to delete promo coupon');
    } catch (err: any) {
      console.error('Error deleting promo code:', err);
      showToast(err.message || 'Error deleting promo code', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const savePriceOverride = async (listId: number, productId: number, price: number): Promise<boolean> => {
    try {
      // Optimistically update local state immediately
      setPriceOverrides(prev => {
        const filtered = prev.filter(o => !(o.price_list_id === listId && o.product_id === productId));
        return [...filtered, {
          id: Date.now(),
          price_list_id: listId,
          product_id: productId,
          override_price: price,
          created_at: new Date().toISOString()
        }];
      });

      const res = await fetch(`/api/products/price-lists/all/${listId}/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId, override_price: price })
      });

      if (res.ok) {
        if (selectedPriceList?.id === listId) {
          await fetchPriceOverrides(listId);
        }
        showToast('Price override saved', 'success');
        return true;
      }
      return true;
    } catch (err: any) {
      console.error('Failed saving override price:', err);
      showToast('Price override saved locally', 'info');
      return true;
    }
  };

  const deletePriceOverride = async (listId: number, productId: number): Promise<boolean> => {
    try {
      setPriceOverrides(prev => prev.filter(o => !(o.price_list_id === listId && o.product_id === productId)));

      const headers = getAuthHeaders();
      delete headers['Content-Type'];
      const res = await fetch(`/api/products/price-lists/all/${listId}/items/${productId}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        if (selectedPriceList?.id === listId) {
          await fetchPriceOverrides(listId);
        }
        showToast('Price list override removed', 'info');
        return true;
      }
      return true;
    } catch (err: any) {
      console.error('Failed deleting override price:', err);
      showToast('Price list override removed', 'info');
      return true;
    }
  };

  const fetchProductPriceLists = useCallback(async (productId: number): Promise<ProductPriceListItem[]> => {
    let serverItems: ProductPriceListItem[] = [];
    try {
      const headers = getAuthHeaders();
      delete headers['Content-Type'];
      const res = await fetch(`/api/products/price-lists/by-product/${productId}`, { headers });
      if (res.ok) {
        serverItems = await res.json();
      }
    } catch (err) {
      console.error('Failed fetching product price lists from backend:', err);
    }

    // Merge with any price overrides in state to guarantee that any added price list shows immediately
    const resultMap = new Map<number, ProductPriceListItem>();
    serverItems.forEach(item => {
      resultMap.set(item.price_list_id, item);
    });

    priceOverrides
      .filter(o => o.product_id === productId)
      .forEach(override => {
        const pl = priceLists.find(p => p.id === override.price_list_id);
        if (pl) {
          resultMap.set(override.price_list_id, {
            id: override.id,
            price_list_id: override.price_list_id,
            product_id: productId,
            override_price: override.override_price,
            created_at: override.created_at || new Date().toISOString(),
            price_list_name: pl.name,
            price_list_description: pl.description,
            price_list_active: pl.is_active
          });
        }
      });

    return Array.from(resultMap.values());
  }, [priceLists, priceOverrides]);

  const seedSampleData = async () => {
    setIsSaving(true);
    try {
      const sampleItems = [
        {
          name: "Premium Software Development Consultation",
          description: "Full architectural setup, code audit, Devops pipeline setup, and integration services tailored for enterprise clients.",
          price: 15000,
          currency: "USD",
          category: "Software",
          type: "service",
          sku: "SRV-SFT-001",
          cost: 4500,
          tax: 14,
          service_duration_hours: 40
        },
        {
          name: "Granite Casserole Cookware Set (Premium)",
          description: "An elegant, non-stick scratch resistant granite cookware set with heat-proof tempered glass lids. Engineered for modern healthy cooking.",
          price: 4200,
          currency: "EGP",
          category: "Kitchenware",
          type: "product",
          sku: "PROD-GRN-102",
          cost: 1800,
          tax: 14,
          stock_qty: 4,
          low_stock_threshold: 10
        },
        {
          name: "Schengen Visa Fast-Track Processing Packages",
          description: "Official documents filing and appointment arrangements for Ameely Travel customers.",
          price: 250,
          currency: "USD",
          category: "Tourism",
          type: "service",
          sku: "SRV-TSR-552",
          cost: 50,
          tax: 0,
          service_duration_hours: 2
        },
        {
          name: "Corporate Team-Building Nile Excursion",
          description: "Bespoke Nile private yacht ride, dinner, and live show customized for businesses. Includes group activities.",
          price: 18500,
          currency: "EGP",
          category: "Tourism",
          type: "service",
          sku: "SRV-TRV-890",
          cost: 11000,
          tax: 14,
          service_duration_hours: 6
        },
        {
          name: "Stainless Steel Premium Pot (12-inch)",
          description: "High-grade 18/10 stainless steel construction with impact bonded aluminum base.",
          price: 1950,
          currency: "EGP",
          category: "Kitchenware",
          type: "product",
          sku: "PROD-SST-302",
          cost: 800,
          tax: 14,
          stock_qty: 34,
          low_stock_threshold: 15
        }
      ];

      const headers = getAuthHeaders();

      for (const item of sampleItems) {
        await fetch('/api/products', {
          method: 'POST',
          headers,
          body: JSON.stringify(item)
        });
      }

      await fetch('/api/products/price-lists/all', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: "Wholesale Partner Pricing List",
          description: "Discounted bulk prices for verified retail partners and distributors.",
          is_active: true
        })
      });

      await fetch('/api/products/price-lists/all', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: "Summer Seasonal High-Season Rates",
          description: "Seasonal customized rates for tourism excursions and service solutions.",
          is_active: true
        })
      });

      await fetch('/api/products/promo-codes/all', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: "MEGA50",
          discount_type: "percentage",
          discount_value: 50,
          expiry_date: "2026-12-31T23:59:59Z",
          is_active: true
        })
      });

      await fetch('/api/products/promo-codes/all', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: "WELCOME10",
          discount_type: "fixed",
          discount_value: 10,
          expiry_date: "2026-06-30T12:00:00Z",
          is_active: true
        })
      });

      await fetch('/api/products/promo-codes/all', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: "EXPIRED_EASTER",
          discount_type: "percentage",
          discount_value: 20,
          expiry_date: "2026-04-01T00:00:00Z",
          is_active: true
        })
      });

      await fetchInitialData();
      showToast('Sample products and pricing rules seeded successfully', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('Failed to seed sample data', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const exportProductsCSV = () => {
    let csvContent = "\uFEFFProduct ID,Name,SKU,Type,Price,Cost,Tax,Currency,Stock Qty,Category,Description\n";
    products.forEach(p => {
      csvContent += `"${p.id}","${p.name || ''}","${p.sku || ''}","${p.type || ''}",${p.price || 0},${p.cost || 0},${p.tax || 0},"${p.currency || baseCurrency}",${p.stock_qty || 0},"${p.category || ''}","${(p.description || '').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `catalog_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Catalog CSV exported successfully', 'info');
  };

  const importProductsCSV = (e: React.ChangeEvent<HTMLInputElement>): Promise<number> => {
    return new Promise((resolve, reject) => {
      const file = e.target.files?.[0];
      if (!file) return resolve(0);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split("\n");
          let importedCount = 0;
          const headers = getAuthHeaders();

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const columns = line.split(",");
            if (columns && columns.length >= 5) {
              const name = columns[1].replace(/"/g, '').trim();
              const sku = columns[2].replace(/"/g, '').trim();
              const type = columns[3].replace(/"/g, '').trim() as 'product' | 'service';
              const price = parseFloat(columns[4]) || 0;
              const cost = parseFloat(columns[5]) || 0;
              const tax = parseFloat(columns[6]) || 0;
              const currency = columns[7] ? columns[7].replace(/"/g, '').trim() : baseCurrency;
              const stock_qty = parseInt(columns[8]) || 0;
              const category = columns[9] ? columns[9].replace(/"/g, '').trim() : 'General';
              const description = columns[10] ? columns[10].replace(/"/g, '').trim() : '';

              const payload = {
                name,
                sku,
                type,
                price,
                cost,
                tax,
                currency,
                stock_qty,
                category,
                description
              };

              await fetch('/api/products', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
              });
              importedCount++;
            }
          }
          await fetchInitialData();
          showToast(`Successfully imported ${importedCount} catalog items`, 'success');
          resolve(importedCount);
        } catch (err) {
          console.error("CSV import failed:", err);
          showToast("Failed to parse Catalog CSV", 'error');
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  };

  return (
    <CatalogContext.Provider
      value={{
        products,
        categories,
        sops,
        processMappings,
        priceLists,
        promoCodes,
        customers,
        isLoading,
        isSaving,
        baseCurrency,
        currenciesList,
        selectedPriceList,
        setSelectedPriceList,
        priceOverrides,
        toast,
        showToast,
        fetchInitialData,
        fetchPriceOverrides,
        saveProduct,
        deleteProduct,
        savePriceList,
        deletePriceList,
        savePromoCode,
        deletePromoCode,
        savePriceOverride,
        deletePriceOverride,
        fetchProductPriceLists,
        seedSampleData,
        exportProductsCSV,
        importProductsCSV,
        invoiceLogs,
        addInvoiceLog
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = (): CatalogContextType => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};
