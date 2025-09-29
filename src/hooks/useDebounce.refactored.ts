import { useState, useEffect } from 'react';
import { DebouncedValue } from '@/types/utils.types';

export function useDebounce<T>(value: T, delay: number): DebouncedValue<T> {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;