/**
 * Accurate tenure calculation utility
 * Calculates duration between hire date and current date (or offboarding date if inactive/terminated/archived/suspended)
 */

export interface TenureResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  tenureStr: string;
  formattedStartDate: string;
  formattedEndDate: string;
  isOffboarded: boolean;
}

export function calculateExactTenure(
  startDateInput?: string | Date | null,
  endDateInput?: string | Date | null,
  statusStr?: string | null
): TenureResult | null {
  if (!startDateInput) return null;
  const startDate = typeof startDateInput === 'string' ? new Date(startDateInput) : startDateInput;
  if (isNaN(startDate.getTime()) || startDate.getFullYear() <= 1970) return null;

  const isOffboarded = ['inactive', 'terminated', 'archived', 'suspended', 'deleted'].includes((statusStr || '').toLowerCase().trim());
  let targetEndDate: Date;
  if (isOffboarded && endDateInput) {
    const parsedEnd = typeof endDateInput === 'string' ? new Date(endDateInput) : endDateInput;
    targetEndDate = !isNaN(parsedEnd.getTime()) && parsedEnd.getFullYear() > 1970 ? parsedEnd : new Date();
  } else {
    targetEndDate = new Date();
  }

  const formattedStartDate = startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedEndDate = targetEndDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  if (targetEndDate < startDate) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      tenureStr: '0 days',
      formattedStartDate,
      formattedEndDate,
      isOffboarded
    };
  }

  let years = targetEndDate.getFullYear() - startDate.getFullYear();
  let months = targetEndDate.getMonth() - startDate.getMonth();
  let days = targetEndDate.getDate() - startDate.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(targetEndDate.getFullYear(), targetEndDate.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  if (days > 0 || parts.length === 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }

  const totalDays = Math.max(0, Math.ceil(Math.abs(targetEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    years,
    months,
    days,
    totalDays,
    tenureStr: parts.join(', '),
    formattedStartDate,
    formattedEndDate,
    isOffboarded
  };
}
