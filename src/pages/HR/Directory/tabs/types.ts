import { Employee } from '../../../../types';

export interface EmployeeProfileOutletContext {
  employee: Employee | null;
  basicInfo?: Partial<Employee>;
  isViewOnly: boolean;
  isSalaryVisible: boolean;
  onRefreshEmployee: () => Promise<void>;
  onSaveEmployeeDetails: (updatedFields: Partial<Employee>) => Promise<void>;
  currentUser: any;
  showCustomToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  canEditEmployee: boolean;
  employees?: Employee[];
  departments?: any[];
}
