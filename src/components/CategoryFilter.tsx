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

export default function CategoryFilter({ activeCategory, setActiveCategory }: CategoryFilterProps) {
  return (
    <div className="inline-flex w-full sm:w-auto p-1 sm:p-1.5 rounded-full bg-[#f4efef] dark:bg-[#161622] border border-[#e8e1e1] dark:border-white/10 shadow-inner max-w-full justify-center">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory.toLowerCase() === cat.id.toLowerCase();
        return (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap active:scale-95 cursor-pointer ${
              isActive
                ? 'bg-[#660000] text-white shadow-md shadow-[#660000]/25 scale-[1.01] sm:scale-[1.02]'
                : 'text-[#4b5563] dark:text-zinc-400 hover:text-[#0a0a0a] dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#6b7280] dark:text-zinc-400'}`} />
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
