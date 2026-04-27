import { getCategoryImage } from '@/utils/categoryImages';

interface Category {
  id: string;
  label: string;
  emoji: string;
  count: number;
}

interface CuisineCategoryBarProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}

export default function CuisineCategoryBar({ categories, activeCategory, onCategoryChange }: CuisineCategoryBarProps) {
  return (
    <div className="flex gap-5 overflow-x-auto px-2 pt-2 pb-4 mb-8 scrollbar-none">
      {categories.map(cat => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            {/* Circular image */}
            <div
              className={`w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full overflow-hidden transition-all duration-200 ${
                isActive
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105'
                  : 'ring-1 ring-border/40 group-hover:ring-primary/50'
              }`}
            >
              <img
                src={getCategoryImage(cat.id)}
                alt={cat.label}
                className="w-full h-full object-cover"
                loading="lazy"
                width={80}
                height={80}
              />
            </div>
            {/* Label */}
            <span
              className={`text-xs sm:text-sm font-medium text-center leading-tight max-w-[80px] truncate ${
                isActive ? 'text-primary font-semibold' : 'text-muted-foreground group-hover:text-foreground'
              }`}
            >
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
