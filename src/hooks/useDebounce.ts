import { useEffect, useRef } from 'react';

// 防抖函数
export const useDebounce = (callback: () => void, delay: number) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(callback, delay);
  };
};
