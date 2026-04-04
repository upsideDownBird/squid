import { useEffect, useRef, useState } from 'react';

export interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function VirtualScroll<T>({ items, itemHeight, containerHeight, renderItem }: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);
  const visibleItems = items.slice(visibleStart, visibleEnd);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => (
            <div key={visibleStart + i} style={{ height: itemHeight }}>
              {renderItem(item, visibleStart + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function useLazyLoad<T>(loader: () => Promise<T[]>, deps: any[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    loader().then(result => {
      setData(result);
      setLoading(false);
    });
  }, deps);

  return { data, loading };
}
