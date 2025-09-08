import { type RefObject, useEffect } from 'react';

/**
 * 监听元素的宽度变化，仅在宽度值改变时执行回调
 * @param elementRef - 目标元素的 ref
 * @param fn - 宽度变化时的回调函数（仅在宽度变化时触发）
 */
export function useWidthChangeObserver<T extends HTMLElement>(
  elementRef: RefObject<T>,
  fn: (width: number) => void,
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let lastWidth = element.getBoundingClientRect().width;

    const observer = new ResizeObserver((entries) => {
      const currentWidth = entries[0].contentRect.width;
      if (currentWidth !== lastWidth) {
        lastWidth = currentWidth; // 更新记录值
        fn(currentWidth); // 仅在变化时执行回调
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, fn]); // 依赖项包含 elementRef 和 fn
}
