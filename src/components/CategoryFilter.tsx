'use client';

import React from 'react';
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
  return (
    <div className="inline-flex w-full sm:w-auto p-1 sm:p-1.5 rounded-full bg-[#0C0C0E] border border-[#222228] shadow-inner max-w-full justify-center">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory.toLowerCase() === cat.id.toLowerCase();
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-150 whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white shadow-md shadow-[#FF5500]/25'
                : 'text-zinc-400 hover:text-white hover:bg-[#141418]'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export default React.memo(CategoryFilter);
