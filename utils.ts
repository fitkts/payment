
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
