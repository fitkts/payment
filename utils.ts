
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

export const formatTimeToHHMM = (timeStr: string): string => {
    if (!timeStr) return '';
    // If it's already in HH:mm format, just return it and ensure padding
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        const [hour, minute] = timeStr.split(':');
        return `${hour.padStart(2, '0')}:${minute}`;
    }
    // Try to parse it as a Date from an ISO string or other valid format
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
        // When Google Sheets time values are serialized, they can become full date-time strings in UTC.
        // Using getUTCHours and getUTCMinutes ensures we extract the time as it appears in the string,
        // ignoring the user's local timezone which would be applied by getHours/getMinutes.
        return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
    }
    // Return original string as fallback if it's not a parsable date and not in HH:mm format
    return timeStr;
};