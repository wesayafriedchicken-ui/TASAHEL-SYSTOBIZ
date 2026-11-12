import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';

interface AppContextType {
  departments: any[];
  roles: any[];
  users: any[];
  statuses: any[];
  refreshData: (type?: 'departments' | 'roles' | 'users' | 'all', force?: boolean) => Promise<void>;
  loading: boolean;
  selectedTaskId: number | null;
  setSelectedTaskId: (id: number | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Master Data In-Memory Cache (15-minute TTL to drastically reduce query volume and DB egress)
const MASTER_DATA_TTL_MS = 15 * 60 * 1000;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const lastFetchTimes = useRef<{ [key: string]: number }>({});

  const fetchData = useCallback(async (type: 'departments' | 'roles' | 'users' | 'all' = 'all', force = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const now = Date.now();
    const shouldFetch = (key: string) => force || !lastFetchTimes.current[key] || (now - lastFetchTimes.current[key] > MASTER_DATA_TTL_MS);

    const needDepartments = (type === 'departments' || type === 'all') && shouldFetch('departments');
    const needRoles = (type === 'roles' || type === 'all') && shouldFetch('roles');
    const needUsers = (type === 'users' || type === 'all') && shouldFetch('users');
    const needStatuses = (type === 'all') && shouldFetch('statuses');

    if (!needDepartments && !needRoles && !needUsers && !needStatuses && !force) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const headers = {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      };

      // 1. Bulk fast path: use pre-aggregated and cached /api/admin/all endpoint to eliminate 4 parallel queries
      if (type === 'all' && (needDepartments || needRoles || needUsers || needStatuses)) {
        try {
          const res = await fetch('/api/admin/all', { headers });
          if (res.ok) {
            const data = await res.json();
            if (data) {
              if (data.departments) {
                setDepartments(data.departments);
                lastFetchTimes.current['departments'] = Date.now();
              }
              if (data.roles) {
                setRoles(data.roles);
                lastFetchTimes.current['roles'] = Date.now();
              }
              if (data.users) {
                setUsers(data.users);
                lastFetchTimes.current['users'] = Date.now();
              }
              if (data.statuses) {
                setStatuses(data.statuses);
                lastFetchTimes.current['statuses'] = Date.now();
              }
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          // Fallback to sequential fetching below
        }
      }

      // 2. Progressive Sequential Loading for specific requested types (no Promise.all spike)
      if (needDepartments) {
        try {
          const res = await fetch('/api/departments', { headers });
          if (res.ok) {
            const data = await res.json();
            if (data) {
              setDepartments(data);
              lastFetchTimes.current['departments'] = Date.now();
            }
          }
        } catch {}
      }

      if (needRoles) {
        try {
          const res = await fetch('/api/admin/roles', { headers });
          if (res.ok) {
            const data = await res.json();
            if (data) {
              setRoles(data);
              lastFetchTimes.current['roles'] = Date.now();
            }
          }
        } catch {}
      }

      if (needUsers) {
        try {
          const res = await fetch('/api/admin/users', { headers });
          if (res.ok) {
            const data = await res.json();
            if (data) {
              setUsers(data);
              lastFetchTimes.current['users'] = Date.now();
            }
          }
        } catch {}
      }

      if (needStatuses) {
        try {
          const res = await fetch('/api/admin/statuses', { headers });
          if (res.ok) {
            const data = await res.json();
            if (data) {
              setStatuses(data);
              lastFetchTimes.current['statuses'] = Date.now();
            }
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Failed to fetch global data', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData('all');
  }, [fetchData]);

  const value = useMemo(() => ({
    departments,
    roles,
    users,
    statuses,
    refreshData: fetchData,
    loading,
    selectedTaskId,
    setSelectedTaskId
  }), [departments, roles, users, statuses, fetchData, loading, selectedTaskId, setSelectedTaskId]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

