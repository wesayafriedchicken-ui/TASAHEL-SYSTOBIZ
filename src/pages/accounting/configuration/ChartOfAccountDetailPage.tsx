import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Plus, Check, X, Cloud, Bookmark, Menu, 
  HelpCircle, Send, Paperclip, Search, User, 
  Clock, MoreHorizontal, ArrowLeft, CheckCircle2,
  FileText, MessageSquare, AlertCircle
} from 'lucide-react';
import { DEFAULT_COA } from '../../../components/Accounting/AccountingSeeds';
import { cn } from '../../../lib/utils';
import { useAuth } from '../../../context/AuthContext';

export interface ChatterMessage {
  id: string;
  user: string;
  avatarInitial?: string;
  text: string;
  date: string;
  type?: 'message' | 'note' | 'activity' | 'system';
}

export const ChartOfAccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const isNew = !id || id === 'new';

  const currentUserName = authUser?.name || 'اسراء حسين';
  const currentUserInitial = currentUserName.charAt(0) || 'E';

  // Load existing accounts list
  const [allAccounts, setAllAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('acct_coa');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return DEFAULT_COA;
  });

  // Find account if editing
  const existingAccount = useMemo(() => {
    if (isNew) return null;
    return allAccounts.find((a: any) => String(a.id) === String(id));
  }, [allAccounts, id, isNew]);

  // Form State
  const [code, setCode] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [accountType, setAccountType] = useState('Current Assets');
  const [defaultTaxes, setDefaultTaxes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [paymentReconciliation, setPaymentReconciliation] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [parentAccount, setParentAccount] = useState('Root account');
  const [description, setDescription] = useState('');
  const [balance, setBalance] = useState(0.0);

  // UI State
  const [activeTab, setActiveTab] = useState<'accounting'>('accounting');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');

  // Chatter State
  const [activeChatterAction, setActiveChatterAction] = useState<'none' | 'message' | 'note' | 'activity'>('none');
  const [chatterText, setChatterText] = useState('');
  const [chatterMessages, setChatterMessages] = useState<ChatterMessage[]>([]);

  // Initialize Form Data
  useEffect(() => {
    if (existingAccount) {
      setCode(existingAccount.id || '');
      setNameEn(existingAccount.name_en || '');
      setNameAr(existingAccount.name_ar || '');
      
      // Map category type to detailed type
      const typeMap: Record<string, string> = {
        assets: 'Current Assets',
        liabilities: 'Current Liabilities',
        equity: 'Equity',
        revenue: 'Income',
        expenses: 'Expenses'
      };
      setAccountType(existingAccount.detailed_type || typeMap[existingAccount.type] || 'Current Assets');
      setDefaultTaxes(existingAccount.default_taxes || '');
      setTags(existingAccount.tags || []);
      setPaymentReconciliation(existingAccount.payment_reconciliation ?? (existingAccount.type === 'assets' || existingAccount.type === 'liabilities'));
      setIsActive(existingAccount.is_active ?? true);
      setParentAccount(existingAccount.parent_account || 'Root account');
      setDescription(existingAccount.description || '');
      setBalance(existingAccount.balance ?? 0.0);
      setIsBookmarked(existingAccount.is_bookmarked ?? false);

      setChatterMessages(existingAccount.chatter_messages || [
        {
          id: '1',
          user: currentUserName,
          avatarInitial: currentUserInitial,
          text: `Creating record ${existingAccount.id} - ${existingAccount.name_en}...`,
          date: 'Today',
          type: 'system'
        }
      ]);
      setSaveStatus('saved');
    } else if (isNew) {
      setCode('');
      setNameEn('');
      setNameAr('');
      setAccountType('Current Assets');
      setDefaultTaxes('');
      setTags([]);
      setPaymentReconciliation(false);
      setIsActive(true);
      setParentAccount('Root account');
      setDescription('');
      setBalance(0.0);
      setChatterMessages([
        {
          id: '1',
          user: currentUserName,
          avatarInitial: currentUserInitial,
          text: 'Creating a new record...',
          date: 'Today',
          type: 'system'
        }
      ]);
      setSaveStatus('dirty');
    }
  }, [existingAccount, isNew, currentUserName, currentUserInitial]);

  // Handle Save
  const handleSave = () => {
    if (!code.trim() || !nameEn.trim()) {
      setToastMessage('Please provide both Account Code and Account Name.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setSaveStatus('saving');

    // Determine category type
    let categoryType: 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expenses' = 'assets';
    const lowerType = accountType.toLowerCase();
    if (lowerType.includes('asset') || lowerType.includes('cash') || lowerType.includes('bank') || lowerType.includes('prepayment')) {
      categoryType = 'assets';
    } else if (lowerType.includes('liabilit')) {
      categoryType = 'liabilities';
    } else if (lowerType.includes('equity') || lowerType.includes('earning')) {
      categoryType = 'equity';
    } else if (lowerType.includes('income') || lowerType.includes('revenue')) {
      categoryType = 'revenue';
    } else {
      categoryType = 'expenses';
    }

    const updatedAccount = {
      id: code.trim(),
      name_en: nameEn.trim(),
      name_ar: nameAr.trim(),
      type: categoryType,
      detailed_type: accountType,
      default_taxes: defaultTaxes,
      tags: tags,
      payment_reconciliation: paymentReconciliation,
      is_active: isActive,
      parent_account: parentAccount,
      description: description,
      balance: balance,
      is_bookmarked: isBookmarked,
      chatter_messages: chatterMessages
    };

    let updatedList = [...allAccounts];
    const existingIndex = updatedList.findIndex((a: any) => String(a.id) === String(code.trim()));

    if (existingIndex >= 0) {
      updatedList[existingIndex] = updatedAccount;
    } else {
      // If was editing with different ID, replace old record
      if (!isNew && id && id !== code.trim()) {
        updatedList = updatedList.filter((a: any) => String(a.id) !== String(id));
      }
      updatedList.push(updatedAccount);
    }

    setAllAccounts(updatedList);
    try {
      localStorage.setItem('acct_coa', JSON.stringify(updatedList));
      setSaveStatus('saved');
      setToastMessage(`Account ${code.trim()} saved successfully.`);
      setTimeout(() => setToastMessage(null), 3000);

      // If we were on /new, seamlessly update path to the new ID
      if (isNew) {
        navigate(`/accounting/configuration/chart-of-accounts/${encodeURIComponent(code.trim())}`, { replace: true });
      }
    } catch (e) {
      setToastMessage('Error saving account to local storage.');
    }
  };

  // Add Tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Add Chatter Message
  const handlePostChatter = () => {
    if (!chatterText.trim()) return;

    const newMsg: ChatterMessage = {
      id: String(Date.now()),
      user: currentUserName,
      avatarInitial: currentUserInitial,
      text: chatterText.trim(),
      date: 'Today',
      type: activeChatterAction === 'message' ? 'message' : 'note'
    };

    const updated = [newMsg, ...chatterMessages];
    setChatterMessages(updated);
    setChatterText('');
    setActiveChatterAction('none');

    // Save updated chatter to record
    if (code) {
      const updatedList = allAccounts.map((a: any) => {
        if (String(a.id) === String(code)) {
          return { ...a, chatter_messages: updated };
        }
        return a;
      });
      setAllAccounts(updatedList);
      localStorage.setItem('acct_coa', JSON.stringify(updatedList));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f9fafb] dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header / Action Bar (Matching Image 2) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 sticky top-12 z-30 shadow-2xs">
        
        {/* Left Side: "New" button + Breadcrumbs + Save / Discard */}
        <div className="flex items-center gap-3">
          {/* "New" button */}
          <button
            type="button"
            onClick={() => navigate('/accounting/configuration/chart-of-accounts/new')}
            className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-2xs cursor-pointer transition-colors"
          >
            New
          </button>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Link 
              to="/accounting/configuration/chart-of-accounts"
              className="text-[#007A78] dark:text-emerald-400 hover:underline font-semibold"
            >
              Chart of Accounts
            </Link>
            <span>/</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {isNew ? 'New' : code || nameEn || 'Account'}
            </span>
            <button 
              type="button" 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
              title="More options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Save & Discard Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSave}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#007A78] dark:hover:text-emerald-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Save changes (auto-saves)"
            >
              <Cloud className={cn("w-4 h-4", saveStatus === 'saved' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/accounting/configuration/chart-of-accounts')}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Discard and return to list"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Smart Button (Balance) + Bookmark */}
        <div className="flex items-center gap-3">
          {/* Balance Smart Button (Matching Image 2) */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs select-none">
            <div className="flex flex-col items-center justify-center pr-1 text-slate-600 dark:text-slate-400">
              <Menu className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Balance</span>
              <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className="p-1.5 text-slate-400 hover:text-amber-500 rounded-md cursor-pointer transition-colors"
            title="Bookmark this account"
          >
            <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-amber-500 text-amber-500")} />
          </button>
        </div>

      </div>

      {/* Main Container: Split view with Form on Left (65%) and Chatter on Right (35%) */}
      <div className="flex-1 w-full max-w-[1700px] mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Account Form Card (approx 7-8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-6 sm:p-8 space-y-6">
          
          {/* Top Form Fields: Code and Account Name */}
          <div className="space-y-4">
            {/* Code Field */}
            <div className="max-w-xs space-y-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setSaveStatus('dirty');
                }}
                placeholder="10100"
                className="w-full text-sm font-mono font-bold text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 outline-none focus:border-[#007A78] dark:focus:border-emerald-400 transition-colors"
              />
            </div>

            {/* Account Name Field (Large input with subtle line, matching Image 2) */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Account Name
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => {
                  setNameEn(e.target.value);
                  setSaveStatus('dirty');
                }}
                placeholder="e.g. Current Assets"
                className="w-full text-xl sm:text-2xl font-normal text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent border-b border-[#007A78]/60 dark:border-emerald-500/60 pb-1.5 outline-none focus:border-[#007A78] dark:focus:border-emerald-400 transition-colors"
              />
            </div>

            {/* Optional Arabic Name */}
            <div className="max-w-md pt-1">
              <label className="block text-[11px] font-semibold text-slate-400">
                Account Name (Arabic)
              </label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => {
                  setNameAr(e.target.value);
                  setSaveStatus('dirty');
                }}
                dir="rtl"
                placeholder="الاسم باللغة العربية..."
                className="w-full text-xs font-medium text-slate-800 dark:text-slate-200 bg-transparent border-b border-slate-200 dark:border-slate-800 pb-1 outline-none focus:border-slate-400 transition-colors"
              />
            </div>
          </div>

          {/* Form Tabs: Accounting Tab (Matching Image 2) */}
          <div className="border-b border-slate-200 dark:border-slate-800 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('accounting')}
              className={cn(
                "pb-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer",
                activeTab === 'accounting'
                  ? "border-[#714B67] dark:border-emerald-400 text-[#714B67] dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              Accounting
            </button>
          </div>

          {/* Tab Content: Two Columns Grid (Matching Image 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5 text-xs pt-2">
            
            {/* Left Column */}
            <div className="space-y-4">
              
              {/* Type ? */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 w-28 shrink-0">
                  <span>Type</span>
                  <span title="Account category in financial statements">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
                <div className="flex-1 max-w-xs">
                  <select
                    value={accountType}
                    onChange={(e) => {
                      setAccountType(e.target.value);
                      setSaveStatus('dirty');
                    }}
                    className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 outline-none font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="Current Assets">Current Assets</option>
                    <option value="Bank and Cash">Bank and Cash</option>
                    <option value="Non-current Assets">Non-current Assets</option>
                    <option value="Prepayments">Prepayments</option>
                    <option value="Fixed Assets">Fixed Assets</option>
                    <option value="Current Liabilities">Current Liabilities</option>
                    <option value="Non-current Liabilities">Non-current Liabilities</option>
                    <option value="Equity">Equity</option>
                    <option value="Current Year Earnings">Current Year Earnings</option>
                    <option value="Income">Income</option>
                    <option value="Other Income">Other Income</option>
                    <option value="Expenses">Expenses</option>
                    <option value="Depreciation">Depreciation</option>
                    <option value="Cost of Revenue">Cost of Revenue</option>
                    <option value="Off-Balance Sheet">Off-Balance Sheet</option>
                  </select>
                </div>
              </div>

              {/* Default Taxes */}
              <div className="flex items-center justify-between gap-4">
                <div className="font-semibold text-slate-700 dark:text-slate-300 w-28 shrink-0">
                  Default Taxes
                </div>
                <div className="flex-1 max-w-xs">
                  <select
                    value={defaultTaxes}
                    onChange={(e) => {
                      setDefaultTaxes(e.target.value);
                      setSaveStatus('dirty');
                    }}
                    className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 outline-none font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="">None</option>
                    <option value="14% Sales Tax">14% Sales Tax</option>
                    <option value="14% Purchase Tax">14% Purchase Tax</option>
                    <option value="0% Exempt Tax">0% Exempt Tax</option>
                    <option value="1% WHT">1% Withholding Tax (WHT)</option>
                  </select>
                </div>
              </div>

              {/* Tags ? */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 w-28 shrink-0 pt-1">
                  <span>Tags</span>
                  <span title="Analytical and reporting tags">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
                <div className="flex-1 max-w-xs space-y-1.5">
                  <div className="flex flex-wrap gap-1">
                    {tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <span>{t}</span>
                        <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-rose-500">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Type tag and press Enter..."
                    className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 outline-none font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                  />
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-4">
              
              {/* Payment Reconciliation ? */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 w-36 shrink-0">
                  <span>Payment Reconciliation</span>
                  <span title="Allow this account to be reconciled with payments and invoices">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
                <div className="flex-1">
                  <input
                    type="checkbox"
                    checked={paymentReconciliation}
                    onChange={(e) => {
                      setPaymentReconciliation(e.target.checked);
                      setSaveStatus('dirty');
                    }}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#007A78] focus:ring-[#007A78] cursor-pointer"
                  />
                </div>
              </div>

              {/* Active Toggle Switch (Matching Image 2) */}
              <div className="flex items-center justify-between gap-4">
                <div className="font-semibold text-slate-700 dark:text-slate-300 w-36 shrink-0">
                  Active
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsActive(!isActive);
                      setSaveStatus('dirty');
                    }}
                    className={cn(
                      "w-9 h-5 rounded-full transition-colors relative cursor-pointer focus:outline-none",
                      isActive 
                        ? "bg-[#107c41] dark:bg-emerald-500" 
                        : "bg-slate-300 dark:bg-slate-700 border border-slate-400/40"
                    )}
                  >
                    <span 
                      className={cn(
                        "w-4 h-4 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform",
                        isActive ? "right-0.5" : "left-0.5"
                      )} 
                    />
                  </button>
                </div>
              </div>

              {/* Parent Account */}
              <div className="flex items-center justify-between gap-4">
                <div className="font-semibold text-slate-700 dark:text-slate-300 w-36 shrink-0">
                  Parent Account
                </div>
                <div className="flex-1 max-w-xs">
                  <select
                    value={parentAccount}
                    onChange={(e) => {
                      setParentAccount(e.target.value);
                      setSaveStatus('dirty');
                    }}
                    className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 outline-none font-medium text-slate-400 dark:text-slate-500 cursor-pointer"
                  >
                    <option value="Root account">Root account</option>
                    {allAccounts.filter((a: any) => String(a.id) !== String(code)).map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {a.id} - {a.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

          </div>

          {/* DESCRIPTION Section (Matching Image 2) */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              DESCRIPTION
            </span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setSaveStatus('dirty');
              }}
              placeholder="Enter description here..."
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#007A78] dark:focus:border-emerald-400 transition-colors"
            />
          </div>

          {/* Save Floating Action Bar */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/accounting/configuration/chart-of-accounts')}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-[#007A78] hover:bg-[#006664] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isNew ? 'Create Account' : 'Save Changes'}</span>
            </button>
          </div>

        </div>

        {/* Right Column: Odoo-Style Chatter & Activity Feed (approx 4-5 cols, Matching Image 2) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 space-y-4">
          
          {/* Chatter Action Buttons */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Send message button (Signature Odoo Plum #714B67) */}
              <button
                type="button"
                onClick={() => setActiveChatterAction(activeChatterAction === 'message' ? 'none' : 'message')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                  activeChatterAction === 'message'
                    ? "bg-[#593b51] text-white ring-2 ring-[#714B67]/40 shadow-xs"
                    : "bg-[#714B67] hover:bg-[#5f3f57] text-white shadow-xs"
                )}
              >
                <span>Send message</span>
              </button>

              {/* Log note button */}
              <button
                type="button"
                onClick={() => setActiveChatterAction(activeChatterAction === 'note' ? 'none' : 'note')}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                  activeChatterAction === 'note'
                    ? "border-[#714B67] bg-slate-50 dark:bg-slate-800 text-[#714B67] dark:text-purple-300"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                <span>Log note</span>
              </button>

              {/* Activity button */}
              <button
                type="button"
                onClick={() => setActiveChatterAction(activeChatterAction === 'activity' ? 'none' : 'activity')}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                  activeChatterAction === 'activity'
                    ? "border-[#714B67] bg-slate-50 dark:bg-slate-800 text-[#714B67] dark:text-purple-300"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                <span>Activity</span>
              </button>
            </div>

            {/* Utility Icons */}
            <div className="flex items-center gap-2 text-slate-400">
              <button type="button" className="hover:text-slate-600 dark:hover:text-slate-300 p-1" title="Search messages">
                <Search className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="hover:text-slate-600 dark:hover:text-slate-300 p-1" title="Attach file">
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-0.5 text-xs text-slate-400" title="Followers">
                <User className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">0</span>
              </div>
            </div>
          </div>

          {/* Interactive Message / Note Composer Box */}
          {activeChatterAction !== 'none' && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/80 dark:bg-slate-800/80 space-y-2 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {activeChatterAction === 'message' ? 'Send a public message to followers...' : 
                 activeChatterAction === 'note' ? 'Log an internal note...' : 'Schedule a follow-up activity...'}
              </div>
              <textarea
                rows={3}
                value={chatterText}
                onChange={(e) => setChatterText(e.target.value)}
                placeholder={activeChatterAction === 'message' ? 'Type your message...' : 'Write an internal note...'}
                className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-[#714B67]"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveChatterAction('none')}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePostChatter}
                  className="px-3 py-1 bg-[#714B67] hover:bg-[#5f3f57] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {/* "Today" Divider (Matching Image 2) */}
          <div className="relative py-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative px-3 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Today
            </span>
          </div>

          {/* Timeline Feed (Matching Image 2) */}
          <div className="space-y-4 pt-1">
            {chatterMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 text-xs">
                {/* Avatar with initial */}
                <div className="w-7 h-7 rounded-full bg-[#007A78] dark:bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs">
                  {msg.avatarInitial || currentUserInitial}
                </div>

                {/* Message Body */}
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {msg.user}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {msg.date}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};

export default ChartOfAccountDetailPage;
