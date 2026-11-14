import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Search, 
  Plus, 
  Briefcase, 
  TrendingUp, 
  ArrowUpRight 
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';

export const AccountsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { customers, deals, stages, formatCurrency } = useSalesContext();

  const [searchQuery, setSearchQuery] = useState('');

  // Group customers by company to form Corporate Accounts
  const accounts = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      contactsCount: number;
      contacts: typeof customers;
      deals: typeof deals;
      totalValue: number;
      wonValue: number;
    }>();

    const wonStageIds = stages.filter(s => s.is_won || s.name.toLowerCase().includes('won')).map(s => s.id);

    customers.forEach(c => {
      const companyName = c.company?.trim() || c.name;
      if (!map.has(companyName)) {
        map.set(companyName, {
          id: String(c.id), // Use first customer id as anchor
          name: companyName,
          contactsCount: 0,
          contacts: [],
          deals: [],
          totalValue: 0,
          wonValue: 0
        });
      }

      const acc = map.get(companyName)!;
      acc.contactsCount++;
      acc.contacts.push(c);

      // Find deals for this customer
      const cDeals = deals.filter(d => d.customer_id === c.id);
      cDeals.forEach(d => {
        acc.deals.push(d);
        acc.totalValue += Number(d.value || 0);
        if (wonStageIds.includes(d.stage_id)) {
          acc.wonValue += Number(d.value || 0);
        }
      });
    });

    return Array.from(map.values());
  }, [customers, deals, stages]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      return !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [accounts, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          type="button"
          onClick={() => navigate('/sales/contacts-accounts/contacts')}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Individual Contacts
        </button>
        <button
          type="button"
          onClick={() => navigate('/sales/contacts-accounts/accounts')}
          className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-xs"
        >
          Corporate Accounts ({accounts.length})
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search corporate accounts by company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
          />
        </div>

        <button
          type="button"
          onClick={() => navigate('/sales/contacts-accounts/contacts')}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Company via Contact</span>
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs font-medium bg-white rounded-2xl border border-slate-200">
            No corporate accounts found.
          </div>
        ) : (
          filteredAccounts.map(account => (
            <div
              key={account.name}
              onClick={() => navigate(`/sales/contacts-accounts/accounts/${account.id}`)}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-sm">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {account.name}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{account.contactsCount} Associated Contact{account.contactsCount > 1 ? 's' : ''}</span>
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Deals</span>
                    <span className="font-bold text-slate-800">{account.deals.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Won Revenue</span>
                    <span className="font-black text-emerald-600">{formatCurrency(account.wonValue)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Total Pipeline Value</span>
                <span className="font-black text-slate-900">{formatCurrency(account.totalValue)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
