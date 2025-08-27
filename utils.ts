

export const formatCurrency = (value: number | string): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value).replace(/,/g, '');
  
  if (stringValue === '') return '';

  const numberValue = Number(stringValue);
  if (isNaN(numberValue)) {
    return ''; 
  }

  return new Intl.NumberFormat('ko-KR').format(numberValue);
};

export const parseCurrency = (value: string): number => {
  if (value === null || value === undefined) return 0;
  return Number(String(value).replace(/,/g, '')) || 0;
};

// Date utility functions
export const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

export const endOfMonth = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // adjust when week starts on Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfWeek = (date: Date): Date => {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const formatDateISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};