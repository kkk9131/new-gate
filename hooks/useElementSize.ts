'use client';

import { useCallback, useEffect, useState } from 'react';

interface ElementSize {
  width: number;
  height: number;
}

export function useElementSize<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  const ref = useCallback((node: T | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element]);

  return {
    ref,
    width: size.width,
    height: size.height,
  };
}
