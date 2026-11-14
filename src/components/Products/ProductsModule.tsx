import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, Package, Tag, 
  Edit3, Trash2, X, Save, Loader2, 
  CheckCircle2, AlertTriangle, Info,
  MoreVertical, Box, Briefcase, DollarSign,
  Layers, Percent, Calendar, ShieldCheck, 
  ArrowRight, FileText, Activity, AlertCircle, 
  RefreshCw, TrendingUp, Check, LayoutGrid, List,
  TrendingDown, Sparkles, Printer
} from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import DeleteConfirmation from '../Common/DeleteConfirmation';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip
} from 'recharts';

interface ExtendedProduct extends Product {
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
}

interface PriceList {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface PriceListOverride {
  id: number;
  price_list_id: number;
  product_id: number;
  override_price: number;
}

interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
}

const ProductsModule: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sops, setSops] = useState<any[]>([]);
  const [processMappings, setProcessMappings] = useState<any[]>([]);
  const [ncrList, setNcrList] = useState<any[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Central Dynamic Currency Configs ---
  const [baseCurrency, setBaseCurrency] = useState<string>(() => {
    return localStorage.getItem('acct_base_currency') || 'SAR';
  });

  const [currenciesList, setCurrenciesList] = useState<{
    code: string;
    name_en: string;
    name_ar: string;
    rate_to_sar: number;
    symbol: string;
  }[]>(() => {
    const defaultList = [
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
      } catch (e) {}
    }
    const saved = localStorage.getItem('acct_currencies');
    if (saved) return JSON.parse(saved);
    return defaultList;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setBaseCurrency(localStorage.getItem('acct_base_currency') || 'SAR');
      
      const defaultList = [
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
            setCurrenciesList(defaultList.map(c => {
              const matched = rates.find((r: any) => r.code === c.code);
              return matched ? { ...c, rate_to_sar: matched.rate_to_sar } : c;
            }));
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        const saved = localStorage.getItem('acct_currencies');
        if (saved) {
          try {
            setCurrenciesList(JSON.parse(saved));
          } catch (e) {}
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    handleStorageChange();
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Navigation & View Toggles
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog' | 'pricing' | 'profitability' | 'integrations'>('dashboard');
  const [layoutStyle, setLayoutStyle] = useState<'board' | 'list'>('board');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dynamic Override Management
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);
  const [priceOverrides, setPriceOverrides] = useState<PriceListOverride[]>([]);
  const [overrideForms, setOverrideForms] = useState<{ [prodId: number]: string }>({});

  // Modals & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<ExtendedProduct> | null>(null);
  const [isPriceListModalOpen, setIsPriceListModalOpen] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<Partial<PriceList> | null>(null);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Partial<PromoCode> | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<'product' | 'pricelist' | 'promo'>('product');

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Integration Simulator States
  const [simCustomer, setSimCustomer] = useState<string>('');
  const [simPriceList, setSimPriceList] = useState<string>('standard');
  const [simPromo, setSimPromo] = useState<string>('');
  const [simSelectedItems, setSimSelectedItems] = useState<{ product: ExtendedProduct; qty: number }[]>([]);
  const [simInvoiceLogs, setSimInvoiceLogs] = useState<any[]>([]);
  const [invoicePostedNotif, setInvoicePostedNotif] = useState<string | null>(null);

  const loadedProductTabsRef = useRef<Set<string>>(new Set());

  const fetchProductTabData = useCallback(async (tab: string, force = false) => {
    if (!force && loadedProductTabsRef.current.has(tab)) {
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      // Core products and categories are always required for list/dashboard
      if (products.length === 0) {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products', { headers }).then(res => res.ok ? res.json() : []),
          fetch('/api/products/categories', { headers }).then(res => res.ok ? res.json() : [])
        ]);
        setProducts(Array.isArray(productsRes) ? productsRes : []);
        const uniqueCats = Array.from(
          new Set(
            (Array.isArray(categoriesRes) ? categoriesRes : [])
              .filter((c): c is string => typeof c === 'string' && !!c.trim())
              .map(c => c.trim())
          )
        );
        setCategories(uniqueCats);
      }

      switch (tab) {
        case 'dashboard':
        case 'catalog': {
          const sopsRes = await fetch('/api/sops', { headers }).then(res => res.ok ? res.json() : []);
          setSops(Array.isArray(sopsRes) ? sopsRes : []);
          break;
        }
        case 'pricing': {
          const [priceListsRes, promoCodesRes, customersRes] = await Promise.all([
            fetch('/api/products/price-lists/all', { headers }).then(res => res.ok ? res.json() : []),
            fetch('/api/products/promo-codes/all', { headers }).then(res => res.ok ? res.json() : []),
            fetch('/api/crm/customers', { headers }).then(res => res.ok ? res.json() : [])
          ]);
          setPriceLists(Array.isArray(priceListsRes) ? priceListsRes : []);
          setPromoCodes(Array.isArray(promoCodesRes) ? promoCodesRes : []);
          setCustomers(Array.isArray(customersRes) ? customersRes : []);
          if (Array.isArray(priceListsRes) && priceListsRes.length > 0 && !selectedPriceList) {
            setSelectedPriceList(priceListsRes[0]);
          }
          break;
        }
        case 'profitability':
        case 'integrations': {
          const [ncrRes, processMappingsRes] = await Promise.all([
            fetch('/api/qa/ncr', { headers }).then(res => res.ok ? res.json() : []),
            fetch('/api/process-mapping', { headers }).then(res => res.ok ? res.json() : [])
          ]);
          setNcrList(Array.isArray(ncrRes) ? ncrRes : []);
          setProcessMappings(Array.isArray(processMappingsRes) ? processMappingsRes : []);
          break;
        }
        default:
          break;
      }

      loadedProductTabsRef.current.add(tab);
    } catch (err) {
      console.error('Error fetching products tab dataset:', err);
    } finally {
      setIsLoading(false);
    }
  }, [products.length, selectedPriceList]);

  const fetchInitialData = useCallback(async () => {
    await fetchProductTabData(activeTab, true);
  }, [activeTab, fetchProductTabData]);

  useEffect(() => {
    fetchProductTabData(activeTab);
  }, [activeTab, fetchProductTabData]);

  useEffect(() => {
    if (selectedPriceList) {
      fetchPriceOverrides(selectedPriceList.id);
    }
  }, [selectedPriceList]);

  const fetchPriceOverrides = async (listId: number) => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/products/price-lists/all/${listId}/items`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPriceOverrides(data);
        
        // Populate overrides local form input map
        const formObj: { [prodId: number]: string } = {};
        data.forEach((ov: any) => {
          formObj[ov.product_id] = ov.override_price.toString();
        });
        setOverrideForms(formObj);
      }
    } catch (err) {
      console.error('Error loading price overrides:', err);
    }
  };

  // Seed sample products to let the user play with real integrations immediately
  const handleSeedSampleData = async () => {
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
          stock_qty: 4, // triggers low stock warning since < threshold 10
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

      const token = localStorage.getItem('token');
      const headers = { 
        'Content-Type': 'application/json',
        ...(token && token !== 'null' ? { 'Authorization': `Bearer ${token}` } : {})
      };

      // Seed products
      for (const item of sampleItems) {
        await fetch('/api/products', {
          method: 'POST',
          headers,
          body: JSON.stringify(item)
        });
      }

      // Seed sample price lists
      const wholesaleList = await fetch('/api/products/price-lists/all', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: "Wholesale Partner Pricing List",
          description: "Discounted bulk prices for verified retail partners and distributors.",
          is_active: true
        })
      }).then(res => res.json());

      await fetch('/api/products/price-lists/all', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: "Summer Seasonal High-Season Rates",
          description: "Seasonal customized rates for tourism excursions and service solutions.",
          is_active: true
        })
      });

      // Seed promo codes
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

      // Sample expired code to demonstrate auto-expiration
      await fetch('/api/products/promo-codes/all', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: "EXPIRED_EASTER",
          discount_type: "percentage",
          discount_value: 20,
          expiry_date: "2026-04-01T00:00:00Z", // Already expired
          is_active: true
        })
      });

      await fetchInitialData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handler for products, pricing lists, or promo codes
  const openDeletePrompt = (id: number, type: 'product' | 'pricelist' | 'promo') => {
    setDeleteType(type);
    setShowDeleteConfirm(id);
  };

  const handleDeleteConfirm = async () => {
    if (!showDeleteConfirm) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        ...(token && token !== 'null' ? { 'Authorization': `Bearer ${token}` } : {})
      };

      let url = '';
      if (deleteType === 'product') {
        url = `/api/products/${showDeleteConfirm}`;
      } else if (deleteType === 'pricelist') {
        url = `/api/products/price-lists/all/${showDeleteConfirm}`;
      } else if (deleteType === 'promo') {
        url = `/api/products/promo-codes/all/${showDeleteConfirm}`;
      }

      const res = await fetch(url, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        if (deleteType === 'product') {
          setProducts(prev => prev.filter(p => p.id !== showDeleteConfirm));
        } else if (deleteType === 'pricelist') {
          setPriceLists(prev => prev.filter(p => p.id !== showDeleteConfirm));
          if (selectedPriceList?.id === showDeleteConfirm) {
            setSelectedPriceList(null);
          }
        } else if (deleteType === 'promo') {
          setPromoCodes(prev => prev.filter(p => p.id !== showDeleteConfirm));
        }
        setShowDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Error deleting element:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name) return;
    
    setIsSaving(true);
    try {
      const method = editingProduct.id ? 'PUT' : 'POST';
      const url = editingProduct.id ? `/api/products/${editingProduct.id}` : '/api/products';
      
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(editingProduct)
      });

      if (!res.ok) throw new Error('Failed to save product');
      
      await fetchInitialData();
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportProducts = () => {
    let csvContent = "\uFEFFProduct ID,Name,SKU,Type,Price,Cost,Tax,Currency,Stock Qty,Category,Description\n";
    products.forEach(p => {
      csvContent += `"${p.id}","${p.name || ''}","${p.sku || ''}","${p.type || ''}",${p.price || 0},${p.cost || 0},${p.tax || 0},"${p.currency || baseCurrency}",${p.stock_qty || 0},"${p.category || ''}","${(p.description || '').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n");
        let importedCount = 0;
        
        const token = localStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

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
        alert(`Successfully imported ${importedCount} products into Catalog!`);
      } catch (err) {
        console.error("CSV import failed:", err);
        alert("Failed to parse Catalog CSV.");
      }
    };
    reader.readAsText(file);
  };

  const handleSavePriceList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPriceList?.name) return;
    
    setIsSaving(true);
    try {
      const method = editingPriceList.id ? 'PUT' : 'POST';
      const url = editingPriceList.id 
        ? `/api/products/price-lists/all/${editingPriceList.id}` 
        : '/api/products/price-lists/all';
      
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(editingPriceList)
      });

      if (!res.ok) throw new Error('Failed to save pricing profile');
      
      await fetchInitialData();
      setIsPriceListModalOpen(false);
      setEditingPriceList(null);
    } catch (err) {
      console.error('Error saving pricing profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo?.code) return;
    
    setIsSaving(true);
    try {
      const method = editingPromo.id ? 'PUT' : 'POST';
      const url = editingPromo.id 
        ? `/api/products/promo-codes/all/${editingPromo.id}` 
        : '/api/products/promo-codes/all';
      
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(editingPromo)
      });

      if (!res.ok) throw new Error('Failed to save promo discount');
      
      await fetchInitialData();
      setIsPromoModalOpen(false);
      setEditingPromo(null);
    } catch (err) {
      console.error('Error saving promo code:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePriceOverride = async (productId: number) => {
    if (!selectedPriceList) return;
    const priceVal = parseFloat(overrideForms[productId]);
    if (isNaN(priceVal)) return;

    try {
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/products/price-lists/all/${selectedPriceList.id}/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ product_id: productId, override_price: priceVal })
      });
      fetchPriceOverrides(selectedPriceList.id);
    } catch (err) {
      console.error('Failed saving override price:', err);
    }
  };

  // INTEGRATION SIMULATOR: Sales Quotation calculations
  const getProductPriceWithPriceList = (p: ExtendedProduct, plId: string) => {
    if (plId === 'standard') return p.price;
    const ov = priceOverrides.find(o => o.price_list_id === parseInt(plId) && o.product_id === p.id);
    return ov ? ov.override_price : p.price;
  };

  const addSimItem = (p: ExtendedProduct) => {
    const exists = simSelectedItems.find(i => i.product.id === p.id);
    if (exists) {
      setSimSelectedItems(prev => prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setSimSelectedItems(prev => [...prev, { product: p, qty: 1 }]);
    }
  };

  const removeSimItem = (pid: number) => {
    setSimSelectedItems(prev => prev.filter(i => i.product.id !== pid));
  };

  const handleQuoteToInvoice = () => {
    if (simSelectedItems.length === 0) return;
    
    // Calculate final fields
    let subtotal = 0;
    let totalTax = 0;
    
    const itemsList = simSelectedItems.map(item => {
      const rawPrice = getProductPriceWithPriceList(item.product, simPriceList);
      const totalItemRaw = rawPrice * item.qty;
      const taxRate = item.product.tax || 0;
      const itemTax = totalItemRaw * (taxRate / 100);
      
      subtotal += totalItemRaw;
      totalTax += itemTax;

      return {
        product_id: item.product.id.toString(),
        product_name: item.product.name,
        quantity: item.qty,
        price: rawPrice,
        vat_rate: taxRate,
        discount_rate: 0
      };
    });

    // Check discount from promo code
    let discountVal = 0;
    if (simPromo) {
      const codeMatch = promoCodes.find(c => c.code === simPromo);
      if (codeMatch && codeMatch.is_active) {
        const isExpired = codeMatch.expiry_date && new Date(codeMatch.expiry_date) < new Date();
        if (!isExpired) {
          if (codeMatch.discount_type === 'percentage') {
            discountVal = subtotal * (codeMatch.discount_value / 100);
          } else {
            discountVal = codeMatch.discount_value;
          }
        }
      }
    }

    const docTotal = Math.max(0, subtotal - discountVal + totalTax);
    const invoiceId = `INV-SIM-${Date.now().toString().slice(-6)}`;
    const custName = customers.find(c => c.id.toString() === simCustomer)?.name || simCustomer || 'Walk-In Client';

    const cleanInvoiceObj = {
      id: invoiceId,
      customer_name: custName,
      customer_id: simCustomer || '999',
      date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: itemsList,
      subtotal,
      vat_amount: totalTax,
      discount_amount: discountVal,
      total_amount: docTotal,
      status: 'sent'
    };

    // Push into CRM deals & post to local accounting ledger localStorage context
    try {
      const existingInvoicesStr = localStorage.getItem('acct_invoices');
      const existingInvoices = existingInvoicesStr ? JSON.parse(existingInvoicesStr) : [];
      localStorage.setItem('acct_invoices', JSON.stringify([cleanInvoiceObj, ...existingInvoices]));
      
      setInvoicePostedNotif(`Quotation ${invoiceId} successfully converted & Posted to Accounting general ledger! Accounts Receivables updated.`);
      
      // Save logs
      setSimInvoiceLogs(prev => [cleanInvoiceObj, ...prev]);

      // Reset
      setSimSelectedItems([]);
      setSimPromo('');
      setSimCustomer('');
      
      setTimeout(() => setInvoicePostedNotif(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper selectors and groupings for Catalog Dashboard stats/charts
  const filteredProducts = products.filter(product => {
    const searchLow = (searchTerm || '').toLowerCase();
    const matchesSearch = (product.name || '').toLowerCase().includes(searchLow) || 
                          (product.sku || '').toLowerCase().includes(searchLow) ||
                          (product.description || '').toLowerCase().includes(searchLow);
    const matchesType = filterType === 'all' || product.type === filterType;
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  // Calculate dynamic dashboard markers
  const activeCount = products.length;
  
  const lowStockCount = products.filter(p => p.type === 'product' && (p.stock_qty || 0) <= (p.low_stock_threshold || 10)).length;
  
  // Avg. Profit Margin = sum(p.price - p.cost)/sum(p.price)
  const calculateAvgProfitMargin = () => {
    const valid = products.filter(p => p.price > 0);
    if (valid.length === 0) return 0;
    const totalMarginPercent = valid.reduce((acc, p) => {
      const cost = p.cost || 0;
      const margin = ((p.price - cost) / p.price) * 100;
      return acc + margin;
    }, 0);
    return Math.round(totalMarginPercent / valid.length);
  };

  const getTopSellingItemName = () => {
    if (products.length === 0) return 'No items loaded';
    // Fallback: select product with highest margin or price as mock top-seller
    const sorted = [...products].sort((a,b) => (b.price - (b.cost || 0)) - (a.price - (a.cost || 0)));
    return sorted[0]?.name || 'N/A';
  };

  // Chart data: Distribution between physical products and services
  const getProductDistributionChartData = () => {
    const serviceRevenueCount = products.filter(p => p.type === 'service').length;
    const productRevenueCount = products.filter(p => p.type === 'product').length;
    
    return [
      { name: 'Services', value: serviceRevenueCount, color: '#6366f1' },
      { name: 'Physical Products', value: productRevenueCount, color: '#f59e0b' }
    ];
  };

  const getMarginsChartData = () => {
    const catsAndPrices = products.reduce((acc: { [cat: string]: { cost: number; price: number; count: number } }, p) => {
      const cat = p.category || 'General';
      if (!acc[cat]) acc[cat] = { cost: 0, price: 0, count: 0 };
      acc[cat].cost += p.cost || 0;
      acc[cat].price += p.price;
      acc[cat].count += 1;
      return acc;
    }, {});

    return Object.entries(catsAndPrices).map(([cat, val]) => {
      const marginAvg = val.price > 0 ? Math.round(((val.price - val.cost) / val.price) * 100) : 0;
      return {
        category: cat,
        'Margin %': marginAvg,
        items: val.count
      };
    }).slice(0, 5); // display top 5 categories
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50" dir="ltr">
      {/* Header and Core Branding */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
          <div>
            <div className="flex items-center gap-2">
              <div className="bg-amber-100 text-amber-700 p-2 rounded-xl">
                <Package className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Products & Services Management</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Construct corporate catalog items, price profiles, promo discounts, and watch real billing ledger workflows.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {products.length === 0 && (
              <button 
                onClick={handleSeedSampleData}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-md text-xs"
              >
                <Sparkles className="w-4 h-4 animate-pulse" /> Seed Enterprise Samples
              </button>
            )}
            <button 
              onClick={() => { 
                setEditingProduct({ 
                  type: 'product', 
                  price: 0, 
                  cost: 0, 
                  tax: 14, 
                  currency: baseCurrency, 
                  status: 'active',
                  stock_qty: 10,
                  low_stock_threshold: 5
                }); 
                setIsModalOpen(true); 
              }}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg text-xs"
            >
              <Plus className="w-4 h-4" /> Add Product/Service
            </button>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="flex gap-1 bg-slate-100/80 p-1.5 rounded-2xl w-fit mt-6">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            📊 Catalog Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('catalog')} 
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'catalog' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            📦 Items Directory
          </button>
          <button 
            onClick={() => {
              setActiveTab('pricing');
              if (priceLists.length > 0 && !selectedPriceList) {
                setSelectedPriceList(priceLists[0]);
              }
            }} 
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'pricing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            🏷️ Prices & Promo Codes
          </button>
          <button 
            onClick={() => setActiveTab('profitability')} 
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'profitability' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            📈 Profitability Analytics
          </button>
          <button 
            onClick={() => {
              setActiveTab('integrations');
              if (customers.length > 0 && !simCustomer) {
                setSimCustomer(customers[0].id.toString());
              }
            }} 
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'integrations' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            ⚡ Cross-Module Integrations
          </button>
        </div>
      </div>

      {/* Primary Dashboard Panel */}
      <div className="flex-1 overflow-auto p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-80 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-slate-400 font-bold text-sm">Synchronizing system catalog...</p>
          </div>
        ) : (
          <div>
            {/* TAB 1: DASHBOARD COMPONENT */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 text-left">
                {/* Seed Alert if Catalog is empty */}
                {products.length === 0 && (
                  <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 text-amber-800 p-2.5 rounded-full">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Your Product & Service Catalog is empty!</h4>
                        <p className="text-xs text-slate-500 mt-1">Seed sample data to explore complete integrations such as automated CRM quoting, SOP execution mappings, and margin logs.</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleSeedSampleData}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md"
                    >
                      Generate Demo Data Instantly
                    </button>
                  </div>
                )}

                {/* KPI Metrics List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Active Items</span>
                      <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                        <Layers className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mt-3">{activeCount}</div>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <span className="text-emerald-500 font-bold">Standardized</span> products & services
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Selling Item</span>
                      <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-sm font-black text-slate-800 mt-4 line-clamp-1">{getTopSellingItemName()}</div>
                    <p className="text-xs text-slate-400 mt-3">High profitability margins</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg. Profit Margin</span>
                      <div className="bg-purple-50 text-purple-600 p-2 rounded-xl">
                        <Percent className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-purple-600 mt-3">{calculateAvgProfitMargin()}%</div>
                    <p className="text-xs text-slate-400 mt-2">Deducted production costs</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Low Stock Alerts</span>
                      <div className={`p-2 rounded-xl ${lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'}`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mt-3">{lowStockCount}</div>
                    <p className="text-xs text-slate-400 mt-2">Physical catalog elements</p>
                  </div>
                </div>

                {/* Double Chart Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Revenue / Catalog distribution */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Catalog Distribution Matrix</h3>
                    <div className="h-64 flex flex-col md:flex-row items-center justify-around gap-4">
                      {products.length > 0 ? (
                        <>
                          <div className="w-1/2 h-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie 
                                  data={getProductDistributionChartData()} 
                                  cx="50%" 
                                  cy="50%" 
                                  innerRadius={60} 
                                  outerRadius={80} 
                                  paddingAngle={5} 
                                  dataKey="value"
                                >
                                  {getProductDistributionChartData().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-3">
                            {getProductDistributionChartData().map((e, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: e.color }} />
                                <span className="text-xs font-medium text-slate-700">{e.name} ({e.value} items)</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400">Add products to view distribution analytics.</p>
                      )}
                    </div>
                  </div>

                  {/* Profit Margin Chart */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Top Merchandising Margins</h3>
                    <div className="h-64">
                      {products.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getMarginsChartData()}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="category" tick={{ fontSize: 10, fontWeight: '700' }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="Margin %" fill="#6366f1" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-xs text-slate-400">Add products to view margins breakdown.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quality warning alerts connected from QA module */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                    <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-800">Quality Assurance Warnings & Compliance Logs</h3>
                  </div>
                  
                  {ncrList.length === 0 ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <p className="text-xs text-emerald-700 font-bold">Excellent: No active Quality NC (Non-Conformance) warnings or defect complains for your SKUs.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ncrList.slice(0, 3).map((ncr, index) => (
                        <div key={index} className="p-4 border border-amber-200 bg-amber-50/40 rounded-2xl flex items-start gap-3">
                          <AlertTriangle className="text-amber-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black uppercase text-amber-800">QA ALERT REF-{ncr.id}</span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-[10px] text-amber-700 font-bold capitalize">{ncr.severity}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">Quality complains logged on catalog elements: {ncr.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ITEMS DIRECTORY WITH BOARD vs LIST LAYOUT TOGGLE */}
            {activeTab === 'catalog' && (
              <div className="space-y-6 text-left">
                {/* Search, Filter & Layout toggle bar */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-4 flex-1">
                    <div className="relative min-w-[260px] flex-1 max-w-sm">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search SKU model, name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <select 
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      >
                        <option value="all">All Types</option>
                        <option value="product">Physical Product</option>
                        <option value="service">Service Catalog</option>
                      </select>

                      <select 
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* layout and premium data utilities buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleExportProducts}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow-xs"
                      title="Export Catalog to CSV"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      تصدير (Export)
                    </button>
                    
                    <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow-xs cursor-pointer" title="Import Catalog from CSV">
                      <Plus className="w-3.5 h-3.5" />
                      استيراد (Import)
                      <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleImportProducts} 
                        className="hidden" 
                      />
                    </label>

                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow-xs"
                      title="Print Catalog Specification report"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      طباعة (Print Catalog)
                    </button>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setLayoutStyle('board')}
                        className={`p-1.5 rounded-lg transition-all ${layoutStyle === 'board' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setLayoutStyle('list')}
                        className={`p-1.5 rounded-lg transition-all ${layoutStyle === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items collection rendering */}
                {filteredProducts.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
                    <Briefcase className="w-12 h-12 text-slate-300 mb-3" />
                    <h4 className="text-base font-bold text-slate-800">No Catalog elements found</h4>
                    <p className="text-xs text-slate-500 mt-1">Modify your filters or insert standard items to show catalog directory.</p>
                  </div>
                ) : layoutStyle === 'board' ? (
                  /* BOARD VIEW: Modern grid Cards */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map(p => {
                      const isLowStock = p.type === 'product' && (p.stock_qty || 0) <= (p.low_stock_threshold || 10);
                      const relatedSopTitle = sops.find(s => s.id === p.sop_id)?.title;
                      
                      return (
                        <div 
                          key={p.id}
                          className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between group"
                        >
                          <div>
                            {/* Type header badge */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex flex-col gap-1.5">
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider w-max ${p.type === 'product' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                                  {p.type === 'product' ? 'Physical Pot/Product' : 'Service Solution'}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {p.is_cost_variable && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-pink-50 text-pink-700 border border-pink-100">
                                      Var Cost
                                    </span>
                                  )}
                                  {p.is_price_variable && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-violet-50 text-violet-700 border border-violet-100">
                                      Var Price
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                                  className="p-1 hover:bg-slate-50 rounded text-slate-500 hover:text-indigo-600"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => openDeletePrompt(p.id, 'product')}
                                  className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 h-10 leading-tight">{p.name}</h3>
                            <span className="text-[10px] font-mono text-slate-400 font-bold tracking-wider mt-1 block">SKU: {p.sku || 'N/A'}</span>
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2 h-8 leading-relaxed">{p.description || 'No custom description provided for this items directory.'}</p>
                            
                            {/* Physical stock tracker */}
                            {p.type === 'product' && (
                              <div className="mt-3 p-2 bg-slate-50 rounded-xl flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500">Available Stock:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-slate-800">{p.stock_qty || 0}</span>
                                  {isLowStock && (
                                    <span className="bg-red-100 text-red-700 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">
                                      Low
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Service hours tracker */}
                            {p.type === 'service' && (
                              <div className="mt-3 p-2 bg-slate-50 rounded-xl flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-slate-500">Service Duration:</span>
                                <span className="text-xs font-black text-slate-800">
                                  {p.service_duration_hours || 0} {p.service_duration_unit === 'days' ? ((p.service_duration_hours || 0) === 1 ? 'day' : 'days') : 'hrs'}
                                </span>
                              </div>
                            )}

                            {/* Mapped work guidelines */}
                            {p.sop_id && (
                              <div className="mt-3 text-[10px] text-slate-500 bg-emerald-50/50 p-2 border border-emerald-100/60 rounded-xl flex items-center gap-1">
                                <FileText className="w-3 h-3 text-emerald-600" />
                                <span className="truncate font-semibold">Mapped SOP: <strong className="text-emerald-700">{relatedSopTitle || p.sop_id}</strong></span>
                              </div>
                            )}

                            {/* Linked Process Mapping */}
                            {p.process_mapping_id && (
                              <div className="mt-2 text-[10px] text-slate-500 bg-indigo-50/55 p-2 border border-indigo-100/60 rounded-xl flex items-center gap-1">
                                <Layers className="w-3 h-3 text-indigo-600" />
                                <span className="truncate font-semibold">
                                  Process Mapping: <strong className="text-indigo-700">{processMappings.find(pm => pm.id === p.process_mapping_id)?.title || `Process Ref: ${p.process_mapping_id}`}</strong>
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Pricing footer details */}
                          <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between">
                            <div className="text-left">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Price Rate</span>
                              <span className="text-base font-black text-slate-950">
                                {Number(p.price || 0).toLocaleString()} <span className="text-[10px] text-slate-500 ml-0.5">{baseCurrency}</span>
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Tax Vat</span>
                              <span className="text-xs font-bold text-slate-800">{p.tax || 0}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* LIST VIEW: Professional tabular directory */
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-6 py-4">Item Name / SKU</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Stock Status / Hours</th>
                          <th className="px-6 py-4 text-right">Operation Cost</th>
                          <th className="px-6 py-4 text-right">General Price</th>
                          <th className="px-6 py-4">SOP Guidelines</th>
                          <th className="px-6 py-4">Linked Process Mapping</th>
                          <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {filteredProducts.map(p => {
                          const isLowStock = p.type === 'product' && (p.stock_qty || 0) <= (p.low_stock_threshold || 10);
                          const relatedSopTitle = sops.find(s => s.id === p.sop_id)?.title;
                          
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-900">{p.name}</div>
                                <div className="font-mono text-[10px] text-slate-400 mt-0.5">{p.sku || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase w-max ${p.type === 'product' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                    {p.type}
                                  </span>
                                  {p.is_cost_variable && (
                                    <span className="px-1.5 py-0.2 rounded text-[8px] font-semibold uppercase bg-pink-50 text-pink-700 border border-pink-100 w-max">
                                      Var Cost
                                    </span>
                                  )}
                                  {p.is_price_variable && (
                                    <span className="px-1.5 py-0.2 rounded text-[8px] font-semibold uppercase bg-violet-50 text-violet-700 border border-violet-100 w-max">
                                      Var Price
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-600">{p.category || 'General'}</td>
                              <td className="px-6 py-4">
                                {p.type === 'product' ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold">{p.stock_qty || 0} left</span>
                                    {isLowStock && (
                                      <span className="bg-red-100 text-red-700 px-1 py-0.2 rounded text-[8px] font-bold animate-pulse uppercase">
                                        Low
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span>
                                    {p.service_duration_hours || 0} {p.service_duration_unit === 'days' ? ((p.service_duration_hours || 0) === 1 ? 'day' : 'days') : 'hrs'}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right font-semibold text-slate-500">
                                {p.cost ? `${p.cost.toLocaleString()} ${baseCurrency}` : '—'}
                              </td>
                              <td className="px-6 py-4 text-right font-black text-slate-900">
                                {p.price.toLocaleString()} {baseCurrency}
                              </td>
                              <td className="px-6 py-4 max-w-[140px] truncate font-bold text-emerald-700">
                                {relatedSopTitle || (p.sop_id ? `SOP Ref: ${p.sop_id}` : '—')}
                              </td>
                              <td className="px-6 py-4 max-w-[140px] truncate font-bold text-indigo-700">
                                {p.process_mapping_id ? (processMappings.find(pm => pm.id === p.process_mapping_id)?.title || `Process Ref: ${p.process_mapping_id}`) : '—'}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                                    className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => openDeletePrompt(p.id, 'product')}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PRICING & PROMO CODES */}
            {activeTab === 'pricing' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                {/* Left side: Custom Price Lists override profiles */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <h3 className="font-black text-base text-slate-900">Custom Price Override Sheets</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Control wholesale margins or seasonal rates for direct clients.</p>
                    </div>
                    <button 
                      onClick={() => { setEditingPriceList({ name: '', description: '', is_active: true }); setIsPriceListModalOpen(true); }}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Profile
                    </button>
                  </div>

                  {priceLists.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl">
                      <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No custom price profiles configured.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Pricing groups carousel select */}
                      <div className="flex gap-2 pb-2 overflow-x-auto">
                        {priceLists.map(pl => (
                          <button 
                            key={pl.id}
                            onClick={() => setSelectedPriceList(pl)}
                            className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all border ${selectedPriceList?.id === pl.id ? 'bg-slate-950 text-white border-slate-950' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                          >
                            🏷️ {pl.name}
                          </button>
                        ))}
                      </div>

                      {/* Display products with override fields */}
                      {selectedPriceList && (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">{selectedPriceList.name} Details</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">{selectedPriceList.description || 'Active rate modifications'}</p>
                            </div>
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => { setEditingPriceList(selectedPriceList); setIsPriceListModalOpen(true); }}
                                className="p-1 hover:bg-slate-200 rounded text-slate-500"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => openDeletePrompt(selectedPriceList.id, 'pricelist')}
                                className="p-1 hover:bg-slate-200 rounded text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[400px]">
                            {products.map(p => {
                              const originalPrice = p.price;
                              const currentValue = overrideForms[p.id] || '';
                              const ovItem = priceOverrides.find(o => o.product_id === p.id);
                              
                              return (
                                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40">
                                  <div className="max-w-[70%]">
                                    <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
                                    <div className="text-[10px] text-slate-400 mt-1">Base Price: {originalPrice.toLocaleString()} {baseCurrency}</div>
                                  </div>
                                  
                                  {/* Input field to set override */}
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="number"
                                      placeholder={originalPrice.toString()}
                                      value={currentValue}
                                      onChange={e => setOverrideForms(prev => ({ ...prev, [p.id]: e.target.value }))}
                                      className="w-24 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-right"
                                    />
                                    <button 
                                      onClick={() => handleSavePriceOverride(p.id)}
                                      className="p-1.5 bg-slate-900 border border-slate-900 text-white rounded-lg hover:opacity-90 font-bold text-[10px] flex items-center justify-center shrink-0"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side: Promo codes creator */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <h3 className="font-black text-base text-slate-900">Promo Discount Coupons</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Auto-expires codes based on absolute date targets.</p>
                    </div>
                    <button 
                      onClick={() => { setEditingPromo({ code: '', discount_type: 'percentage', discount_value: 10, is_active: true }); setIsPromoModalOpen(true); }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Promo
                    </button>
                  </div>

                  {promoCodes.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl">
                      <Percent className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No active coupons available.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {promoCodes.map(code => {
                        const isExpired = code.expiry_date && new Date(code.expiry_date) < new Date();
                        
                        return (
                          <div 
                            key={code.id}
                            className={`p-4 rounded-2xl border ${isExpired ? 'bg-red-50/30 border-red-100/60' : 'bg-indigo-50/20 border-indigo-100'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-black tracking-wide ${isExpired ? 'bg-red-200 text-red-900' : 'bg-indigo-200 text-indigo-900'}`}>
                                  {code.code}
                                </span>
                                
                                {isExpired && (
                                  <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5">
                                    <AlertCircle className="w-3 h-3" /> Expired
                                  </span>
                                )}
                              </div>

                              <div className="flex gap-1">
                                <button 
                                  onClick={() => { setEditingPromo(code); setIsPromoModalOpen(true); }}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                >
                                  <Edit3 className="w-3 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => openDeletePrompt(code.id, 'promo')}
                                  className="p-1 hover:bg-slate-100 rounded text-red-600"
                                >
                                  <Trash2 className="w-3 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
                              <div>
                                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Benefit</span>
                                <span className="font-extrabold text-slate-800">
                                  {code.discount_type === 'percentage' ? `${code.discount_value}% OFF` : `Flat -${code.discount_value}`}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Expiry</span>
                                <span className="font-semibold text-slate-600">
                                  {code.expiry_date ? new Date(code.expiry_date).toLocaleDateString() : 'Never'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: PROFITABILITY LOGS */}
            {activeTab === 'profitability' && (
              <div className="space-y-6 text-left">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-black text-base text-slate-900">Direct Profit Margin Audit Sheet</h3>
                  <p className="text-xs text-slate-500 mt-1">Verify catalog performance and easily isolate items with thin margins or dangerous negative rates.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  {products.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">Add products to view financial analytics.</div>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-6 py-4">Item (SKU)</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4 text-right">Production Cost</th>
                          <th className="px-6 py-4 text-right">Consumer Price</th>
                          <th className="px-6 py-4 text-right">Markup Value</th>
                          <th className="px-6 py-4 text-right">Net Margin</th>
                          <th className="px-6 py-4 text-center">Profitability Badge</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {products.map(p => {
                          const cost = p.cost || 0;
                          const price = p.price;
                          const netMargin = price - cost;
                          const marginPercent = price > 0 ? Math.round((netMargin / price) * 100) : 0;
                          
                          let statusText = 'Thin (0-20%)';
                          let alertStyle = 'bg-slate-50 text-slate-600 border-slate-200';
                          
                          if (netMargin < 0) {
                            statusText = 'Negative (Wtf)';
                            alertStyle = 'bg-red-100 text-red-800 border-red-200';
                          } else if (marginPercent >= 50) {
                            statusText = 'High Margin (>50%)';
                            alertStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                          } else if (marginPercent >= 20) {
                            statusText = 'Healthy (20-50%)';
                            alertStyle = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                          } else {
                            statusText = 'Thin Margin (<20%)';
                            alertStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                          }

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/60">
                              <td className="px-6 py-4">
                                <div className="font-extrabold text-slate-900">{p.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600`}>
                                  {p.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-slate-500">
                                {cost.toLocaleString()} {baseCurrency}
                              </td>
                              <td className="px-6 py-4 text-right font-black text-slate-900">
                                {price.toLocaleString()} {baseCurrency}
                              </td>
                              <td className="px-6 py-4 text-right text-slate-500">
                                {netMargin >= 0 ? `+${marginPercent}%` : `${marginPercent}%`}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={`font-black ${netMargin < 0 ? 'text-red-600 font-black' : 'text-emerald-700'}`}>
                                  {netMargin.toLocaleString()} {baseCurrency}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${alertStyle}`}>
                                  {statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: DYNAMIC SYSTEM INTEGRATIONS */}
            {activeTab === 'integrations' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                {/* Simulator console */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="border-b border-slate-100 pb-3 mb-6">
                    <h3 className="font-black text-base text-slate-900">Quote & Invoice Workflow Generator</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Pull catalog prices, apply custom wholesale list overrides, evaluate live expiring promo codes, and post a formal Sales Invoice straight to Accounting.
                    </p>
                  </div>

                  {invoicePostedNotif && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-4 rounded-2xl mb-6 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-bounce" />
                      <span>{invoicePostedNotif}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* Customer Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">1. Selected Lead / Customer</label>
                        <select 
                          value={simCustomer}
                          onChange={e => setSimCustomer(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black"
                        >
                          {customers.map(c => (
                            <option key={c.id} value={c.id.toString()}>{c.name} ({c.company || 'Private'})</option>
                          ))}
                          <option value="Smart Solutions Ltd">Smart Solutions Ltd (Distributors)</option>
                          <option value="Ameely Travel Agency">Ameely Travel Agency (Partners)</option>
                          <option value="Inbound CRM Ticket client">Walk-In CRM Ticket Client</option>
                        </select>
                      </div>

                      {/* Custom Price List overrides selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">2. Apply Pricing Profile</label>
                        <select 
                          value={simPriceList}
                          onChange={e => setSimPriceList(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black"
                        >
                          <option value="standard">Standard Catalog Pricing</option>
                          {priceLists.map(pl => (
                            <option key={pl.id} value={pl.id.toString()}>{pl.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Promo discounts */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">3. Promo Code Coupon</label>
                        <input 
                          type="text"
                          placeholder="e.g. MEGA50"
                          value={simPromo}
                          onChange={e => setSimPromo(e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase"
                        />
                      </div>

                      {/* Add Item Select */}
                      <div className="space-y-1.5 pt-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">4. Add Catalog elements</label>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto border border-slate-200 p-3 rounded-xl divide-y divide-slate-100">
                          {products.map(p => {
                            const actualListedPrice = getProductPriceWithPriceList(p, simPriceList);
                            return (
                              <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-900 truncate max-w-[170px]">{p.name}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-black text-slate-700">{actualListedPrice.toLocaleString()} {baseCurrency}</span>
                                  <button 
                                    onClick={() => addSimItem(p)}
                                    type="button" 
                                    className="p-1 px-2.5 bg-slate-900 border border-slate-900 text-white rounded font-bold hover:opacity-80"
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Cart / Invoice preview sheet */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">Invoice Summary</h4>
                        
                        {simSelectedItems.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 font-bold text-xs">Choose items to fill invoice list.</div>
                        ) : (
                          <div className="space-y-3 max-h-[240px] overflow-y-auto">
                            {simSelectedItems.map(item => {
                              const itemPrice = getProductPriceWithPriceList(item.product, simPriceList);
                              return (
                                <div key={item.product.id} className="text-xs flex items-center justify-between">
                                  <div className="text-left">
                                    <div className="font-bold text-slate-800 line-clamp-1 max-w-[180px]">{item.product.name}</div>
                                    <div className="text-slate-400 text-[10px] mt-0.5">{item.qty} x {itemPrice.toLocaleString()} {baseCurrency}</div>
                                  </div>
                                  <button onClick={() => removeSimItem(item.product.id)} className="text-red-500 font-semibold hover:underline">Remove</button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Calculations total */}
                      {simSelectedItems.length > 0 && (
                        <div className="border-t border-slate-200 mt-6 pt-4 space-y-2 text-xs">
                          {/* Invoice calculator summaries */}
                          <div className="flex justify-between text-slate-500 font-bold">
                            <span>Subtotal:</span>
                            <span>
                              {simSelectedItems.reduce((acc, i) => acc + (getProductPriceWithPriceList(i.product, simPriceList) * i.qty), 0).toLocaleString()} {baseCurrency}
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-slate-500 font-bold">
                            <span>VAT Applied:</span>
                            <span>
                              {Math.round(simSelectedItems.reduce((acc, i) => {
                                const price = getProductPriceWithPriceList(i.product, simPriceList);
                                return acc + (price * i.qty * ((i.product.tax || 0)/100));
                              }, 0)).toLocaleString()} {baseCurrency}
                            </span>
                          </div>

                          {simPromo && (
                            <div className="flex justify-between text-indigo-600 font-bold">
                              <span>Promo coupon {simPromo}:</span>
                              <span>Discount Match</span>
                            </div>
                          )}

                          <div className="flex justify-between text-slate-900 border-t border-dashed border-slate-300 pt-2 font-black text-sm">
                            <span>Est. Grand Total:</span>
                            <span className="text-amber-600">
                              {Math.round(simSelectedItems.reduce((acc, i) => {
                                const price = getProductPriceWithPriceList(i.product, simPriceList);
                                const tax = price * i.qty * ((i.product.tax || 0)/100);
                                return acc + (price * i.qty) + tax;
                              }, 0)).toLocaleString()} {baseCurrency}
                            </span>
                          </div>

                          <button 
                            type="button"
                            onClick={handleQuoteToInvoice}
                            className="w-full mt-4 bg-slate-950 hover:bg-slate-800 text-white font-black py-3 rounded-xl transition-all shadow-md text-xs flex items-center justify-center gap-1.5"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Post Quote to General Ledger
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Active Integration Logs */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Accounting Ledger Stream */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-3 mb-4">Posted Ledger Stream</h3>
                    
                    {simInvoiceLogs.length === 0 ? (
                      <p className="text-xs text-slate-400">Generate and post invoices from left console to stream active accounting ledger entries.</p>
                    ) : (
                      <div className="space-y-3">
                        {simInvoiceLogs.map((log, ix) => (
                          <div key={ix} className="p-3 border border-slate-100 bg-slate-50/60 rounded-xl">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-indigo-700">{log.id}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{log.date}</span>
                            </div>
                            <div className="text-xs font-bold text-slate-800 mt-1 truncate">To: {log.customer_name}</div>
                            <div className="flex justify-between items-center mt-3 text-xs">
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black font-sans">COGS SENT</span>
                              <span className="font-black text-slate-950">{Math.round(log.total_amount).toLocaleString()} {baseCurrency}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SOP connections explanations */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-3 mb-3">Service SOP Connections</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      We auto-link service catalog execution parameters with SOP guidelines from SOP module. This guarantees team operations strictly adhere to business steps without delays or pricing errors.
                    </p>
                    
                    <div className="mt-4 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/60">
                      <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Active System Link Verified
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                        Reps can map any Service item to standard action checklists to execute on deals won instantly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden text-left"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-150 text-slate-800 rounded-xl">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      {editingProduct?.id ? 'Edit Catalog Specifications' : 'Insert Standard Catalog Spec'}
                    </h2>
                    <p className="text-xs text-slate-500">Provide real catalog specifications to map against CRM details.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 shadow-sm transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-8 space-y-5 max-h-[500px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" /> Name
                    </label>
                    <input 
                      type="text" 
                      required
                      value={editingProduct?.name || ''}
                      onChange={e => setEditingProduct(prev => ({ ...prev!, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-700"
                      placeholder="e.g. Elegant Granite Pot..."
                    />
                  </div>

                  {/* SKU */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      SKU Code
                    </label>
                    <input 
                      type="text" 
                      required
                      value={editingProduct?.sku || ''}
                      onChange={e => setEditingProduct(prev => ({ ...prev!, sku: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold font-mono text-slate-700"
                      placeholder="e.g. GRN-POT-101"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Billing Type
                    </label>
                    <select 
                      value={editingProduct?.type || 'product'}
                      onChange={e => setEditingProduct(prev => ({ ...prev!, type: e.target.value as 'product' | 'service' }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-700"
                    >
                      <option value="product">Physical Product</option>
                      <option value="service">Service Catalog</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Selling Price
                    </label>
                    <input 
                      type="number" 
                      required
                      value={editingProduct?.price || 0}
                      onChange={e => setEditingProduct(prev => ({ ...prev!, price: parseFloat(e.target.value) }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-700 text-right"
                    />
                  </div>

                  {/* Currency */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Currency
                    </label>
                    <select 
                      value={editingProduct?.currency || baseCurrency}
                      onChange={e => setEditingProduct(prev => ({ ...prev!, currency: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-700 font-mono"
                    >
                      {currenciesList.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code} - {curr.name_ar} / {curr.name_en} ({curr.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Production/Operation Cost */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Production / Operation Cost
                    </label>
                    <input 
                      type="number" 
                      required
                      value={editingProduct?.cost || 0}
                      onChange={e => setEditingProduct(prev => ({ ...prev!, cost: parseFloat(e.target.value) }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-700 text-right"
                    />
                  </div>

                  {/* Tax Vat */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Vat Rate (%)
                    </label>
                    <input 
                      type="number" 
                      required
                      value={editingProduct?.tax || 0}
                      onChange={e => setEditingProduct(prev => ({ ...prev!, tax: parseFloat(e.target.value) }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-700 text-right"
                    />
                  </div>

                  {/* Physical fields: Stock & Alert thresholds */}
                  {editingProduct?.type === 'product' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          Initial Stock Quantity
                        </label>
                        <input 
                          type="number" 
                          required
                          value={editingProduct?.stock_qty || 0}
                          onChange={e => setEditingProduct(prev => ({ ...prev!, stock_qty: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-700 text-right"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          Low Stock Warning Level
                        </label>
                        <input 
                          type="number" 
                          required
                          value={editingProduct?.low_stock_threshold || 10}
                          onChange={e => setEditingProduct(prev => ({ ...prev!, low_stock_threshold: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-700 text-right"
                        />
                      </div>
                    </>
                  )}

                  {/* Service fields: hours & SOP mapper */}
                  {editingProduct?.type === 'service' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          Estimated Service Duration
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            step="0.5"
                            min="0"
                            value={editingProduct?.service_duration_hours || 0}
                            onChange={e => setEditingProduct(prev => ({ ...prev!, service_duration_hours: parseFloat(e.target.value) }))}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-700"
                          />
                          <select
                            value={editingProduct?.service_duration_unit || 'hours'}
                            onChange={e => setEditingProduct(prev => ({ ...prev!, service_duration_unit: e.target.value as 'hours' | 'days' }))}
                            className="w-28 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-700"
                          >
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          Workflow Standard SOP Link
                        </label>
                        <select 
                          value={editingProduct?.sop_id || ''}
                          onChange={e => setEditingProduct(prev => ({ ...prev!, sop_id: e.target.value ? parseInt(e.target.value) : null }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-700"
                        >
                          <option value="">No SOP Assigned</option>
                          {sops.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Category
                    </label>
                    <input 
                      type="text" 
                      list="categoriesOpt"
                      value={editingProduct?.category || ''}
                      onChange={e => setEditingProduct(prev => ({ ...prev!, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-700"
                      placeholder="e.g. Kitchenware, Consultants..."
                    />
                    <datalist id="categoriesOpt">
                      {categories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  {/* Linked Process Mapping */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" /> Linked Process Mapping / ربط بمخطط العمليات
                    </label>
                    <select 
                      value={editingProduct?.process_mapping_id || ''}
                      onChange={e => setEditingProduct(prev => ({ ...prev!, process_mapping_id: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-700"
                    >
                      <option value="">No Process Mapping Linked</option>
                      {processMappings.map(pm => (
                        <option key={pm.id} value={pm.id}>{pm.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Flexiblity settings */}
                  <div className="col-span-2 bg-slate-50/55 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">
                      Flexibility Settings / إعدادات مرونة التسعير والتكلفة
                    </span>

                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Variable Cost */}
                      <label className="flex-1 flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-indigo-100 transition-all cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={editingProduct?.is_cost_variable || false}
                          onChange={e => setEditingProduct(prev => ({ ...prev!, is_cost_variable: e.target.checked }))}
                          className="mt-1 accent-indigo-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">Variable Cost / تكلفة متغيرة</span>
                          <span className="text-[9px] text-slate-400 leading-normal block mt-0.5">
                            Allows modifying the production/operation cost in other connected modules (e.g. Sales CRM, SOPs).
                          </span>
                        </div>
                      </label>

                      {/* Variable Price */}
                      <label className="flex-1 flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-indigo-100 transition-all cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={editingProduct?.is_price_variable || false}
                          onChange={e => setEditingProduct(prev => ({ ...prev!, is_price_variable: e.target.checked }))}
                          className="mt-1 accent-indigo-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">Variable Price / سعر بيع متغير</span>
                          <span className="text-[9px] text-slate-400 leading-normal block mt-0.5">
                            Allows overriding the selling price dynamically when creating quotations, deals, or invoices.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Description
                    </label>
                    <textarea 
                      rows={3}
                      value={editingProduct?.description || ''}
                      onChange={e => setEditingProduct(prev => ({ ...prev!, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-700 resize-none"
                      placeholder="Specify deliverables or materials composition..."
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-5 py-3 bg-slate-100 text-slate-650 rounded-xl text-xs font-black hover:bg-slate-250 transition-all text-center"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-center"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingProduct?.id ? 'Save Specifications' : 'Confirm Entry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: PRICING SHEET CREATOR */}
      <AnimatePresence>
        {isPriceListModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPriceListModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden text-left"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-extrabold text-sm uppercase tracking-widest text-slate-900">Custom Price Sheet</h3>
                <button onClick={() => setIsPriceListModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePriceList} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Sheet Name</label>
                  <input 
                    type="text" 
                    required
                    value={editingPriceList?.name || ''}
                    onChange={e => setEditingPriceList(prev => ({ ...prev!, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    placeholder="e.g. VIP Seasonal Discounts"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Description</label>
                  <textarea 
                    rows={2}
                    value={editingPriceList?.description || ''}
                    onChange={e => setEditingPriceList(prev => ({ ...prev!, description: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 resize-none"
                    placeholder="Wording details..."
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button type="button" onClick={() => setIsPriceListModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 rounded-xl text-xs font-bold">Cancel</button>
                  <button type="submit" className="flex-2 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">Save Sheet</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: PROMO CODE CREATOR */}
      <AnimatePresence>
        {isPromoModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPromoModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden text-left"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-extrabold text-sm uppercase tracking-widest text-slate-900">Promo Discount Coupon</h3>
                <button onClick={() => setIsPromoModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePromo} className="p-6 space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Coupon Code</label>
                  <input 
                    type="text" 
                    required
                    value={editingPromo?.code || ''}
                    onChange={e => setEditingPromo(prev => ({ ...prev!, code: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black"
                    placeholder="e.g. SAVE20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Discount Type</label>
                  <select 
                    value={editingPromo?.discount_type || 'percentage'}
                    onChange={e => setEditingPromo(prev => ({ ...prev!, discount_type: e.target.value as 'percentage' | 'fixed' }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="percentage">Percentage OFF (%)</option>
                    <option value="fixed">Fixed Cash OFF (Cash)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Discount Amount / Value</label>
                  <input 
                    type="number" 
                    required
                    value={editingPromo?.discount_value || 0}
                    onChange={e => setEditingPromo(prev => ({ ...prev!, discount_value: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Expiry Date</label>
                  <input 
                    type="date"
                    value={editingPromo?.expiry_date ? editingPromo.expiry_date.split('T')[0] : ''}
                    onChange={e => setEditingPromo(prev => ({ ...prev!, expiry_date: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button type="button" onClick={() => setIsPromoModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 rounded-xl text-xs font-bold">Cancel</button>
                  <button type="submit" className="flex-2 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">Confirm Code</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CORE SOP-STYLE DELETE CONFIRMATION */}
      <DeleteConfirmation 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title={deleteType === 'product' ? 'Wipe Catalog Specification' : deleteType === 'pricelist' ? 'Delete Override Sheet' : 'Revoke Promo Coupon'}
        message="Are you sure you want to perform a permanent removal? Historical database relations mapped to this record ID cannot be reverted."
      />
    </div>
  );
};

export default ProductsModule;
