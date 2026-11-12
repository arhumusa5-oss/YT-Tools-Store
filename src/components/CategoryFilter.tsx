'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Wrench, Briefcase } from 'lucide-react';

interface CategoryFilterProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

const CATEGORIES = [
  { id: 'Tools', name: 'Tools & Subscriptions', icon: Wrench },
  { id: 'Services', name: 'Services & Solutions', icon: Briefcase },
];

function CategoryFilter({ activeCategory, setActiveCategory }: CategoryFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const updatePill = useCallback(() => {
    const activeIndex = CATEGORIES.findIndex(
      (cat) => cat.id.toLowerCase() === activeCategory.toLowerCase()
    );
    const activeBtn = btnRefs.current[activeIndex >= 0 ? activeIndex : 0];
    if (activeBtn) {
      setPillStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, [activeCategory]);

  useEffect(() => {
    updatePill();
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [updatePill]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex w-full sm:w-auto p-1 sm:p-1.5 rounded-full bg-[#f4efef] dark:bg-[#161622] border border-[#e8e1e1] dark:border-white/10 shadow-inner max-w-full justify-center"
    >
      {/* Animated Sliding Active Pill */}
      {pillStyle.width > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 sm:top-1.5 sm:bottom-1.5 rounded-full bg-gradient-to-r from-[#660000] to-[#800000] shadow-md shadow-[#660000]/25 transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: `${pillStyle.left}px`,
            width: `${pillStyle.width}px`,
          }}
        />
      )}

      {CATEGORIES.map((cat, index) => {
        const Icon = cat.icon;
        const isActive = activeCategory.toLowerCase() === cat.id.toLowerCase();
        const showFallbackBg = pillStyle.width === 0 && isActive;
        return (
          <button
            key={cat.id}
            ref={(el) => {
              btnRefs.current[index] = el;
            }}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`relative z-10 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 whitespace-nowrap cursor-pointer ${
              isActive
                ? `${showFallbackBg ? 'bg-[#660000] shadow-md shadow-[#660000]/25 ' : ''}text-white`
                : 'text-[#4b5563] dark:text-zinc-400 hover:text-[#0a0a0a] dark:hover:text-white'
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-200 ${
                isActive ? 'text-white scale-110' : 'text-[#6b7280] dark:text-zinc-400'
              }`}
            />
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export default React.memo(CategoryFilter);
