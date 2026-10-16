import React from 'react';
import { DrinkType } from '../types';

export interface DrinkTypeMetadata {
  id: DrinkType;
  label: string;
  shortLabel: string;
  category: string;
  description: string;
  colorName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBg: string;
  iconColor: string;
  barColor: string;
  accentGradient: string;
}

export const DRINK_TYPE_METADATA: Record<DrinkType, DrinkTypeMetadata> = {
  water: {
    id: 'water',
    label: 'Pure Water',
    shortLabel: 'Water',
    category: 'Essential',
    description: 'Pure optimal hydration',
    colorName: 'sky',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/60',
    badgeText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-800',
    iconBg: 'bg-sky-100 dark:bg-sky-950',
    iconColor: 'text-sky-600 dark:text-sky-400',
    barColor: 'bg-sky-500',
    accentGradient: 'from-sky-500 to-cyan-400'
  },
  tea: {
    id: 'tea',
    label: 'Herbal & Tea',
    shortLabel: 'Tea',
    category: 'Botanical',
    description: 'Green, black & herbal infusions',
    colorName: 'emerald',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    barColor: 'bg-emerald-500',
    accentGradient: 'from-emerald-500 to-teal-400'
  },
  coffee: {
    id: 'coffee',
    label: 'Coffee & Espresso',
    shortLabel: 'Coffee',
    category: 'Brewed',
    description: 'Espresso, Americano & brew',
    colorName: 'amber',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-950',
    iconColor: 'text-amber-700 dark:text-amber-400',
    barColor: 'bg-amber-600',
    accentGradient: 'from-amber-600 to-yellow-500'
  },
  juice: {
    id: 'juice',
    label: 'Fruit & Veg Juice',
    shortLabel: 'Juice',
    category: 'Nutrient',
    description: 'Fresh squeezed & natural nectar',
    colorName: 'orange',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/60',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-200 dark:border-orange-800',
    iconBg: 'bg-orange-100 dark:bg-orange-950',
    iconColor: 'text-orange-600 dark:text-orange-400',
    barColor: 'bg-orange-500',
    accentGradient: 'from-orange-500 to-amber-400'
  },
  infused: {
    id: 'infused',
    label: 'Infused Water',
    shortLabel: 'Infused',
    category: 'Botanical',
    description: 'Cucumber, mint, lemon & berries',
    colorName: 'teal',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/60',
    badgeText: 'text-teal-700 dark:text-teal-300',
    badgeBorder: 'border-teal-200 dark:border-teal-800',
    iconBg: 'bg-teal-100 dark:bg-teal-950',
    iconColor: 'text-teal-600 dark:text-teal-400',
    barColor: 'bg-teal-500',
    accentGradient: 'from-teal-500 to-emerald-400'
  },
  electrolyte: {
    id: 'electrolyte',
    label: 'Electrolytes',
    shortLabel: 'Electrolyte',
    category: 'Performance',
    description: 'Hydration salts & sports minerals',
    colorName: 'yellow',
    badgeBg: 'bg-yellow-50 dark:bg-yellow-950/60',
    badgeText: 'text-yellow-800 dark:text-yellow-300',
    badgeBorder: 'border-yellow-200 dark:border-yellow-800',
    iconBg: 'bg-yellow-100 dark:bg-yellow-950',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    barColor: 'bg-yellow-500',
    accentGradient: 'from-yellow-500 to-amber-400'
  },
  mineral: {
    id: 'mineral',
    label: 'Mineral & Sparkling',
    shortLabel: 'Mineral',
    category: 'Essential',
    description: 'Sparkling & natural spring mineral',
    colorName: 'indigo',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
    iconBg: 'bg-indigo-100 dark:bg-indigo-950',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    barColor: 'bg-indigo-500',
    accentGradient: 'from-indigo-500 to-sky-400'
  }
};

export const ALL_DRINK_TYPES: DrinkType[] = [
  'water',
  'tea',
  'coffee',
  'juice',
  'infused',
  'electrolyte',
  'mineral'
];

/**
 * Returns metadata config for a drink type, with fallback to water
 */
export function getDrinkTypeMetadata(type?: string): DrinkTypeMetadata {
  if (type && type in DRINK_TYPE_METADATA) {
    return DRINK_TYPE_METADATA[type as DrinkType];
  }
  return DRINK_TYPE_METADATA.water;
}

/**
 * Distinct custom SVG icons for each drink category
 */
export const DrinkTypeIcon: React.FC<{
  type: DrinkType | string;
  className?: string;
}> = ({ type, className = 'w-4 h-4' }) => {
  const normType = (type || 'water').toLowerCase();

  switch (normType) {
    case 'tea':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Teacup & Saucer with Leaf */}
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <path d="M6 2v3" />
          <path d="M10 2v3" />
          <path d="M14 2v3" />
          <path d="M2 21h18" />
        </svg>
      );

    case 'coffee':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Coffee Mug with aromatic aroma */}
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <path d="M6 1v3" />
          <path d="M10 1v3" />
          <path d="M14 1v3" />
        </svg>
      );

    case 'juice':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Juice Cup with Straw & Citrus Accent */}
          <path d="M7 8l2-6h6l2 6" />
          <path d="M6 8h12l-1.5 13a2 2 0 0 1-2 1.8H9.5a2 2 0 0 1-2-1.8L6 8z" />
          <path d="M9 13a3 3 0 0 0 6 0" />
          <line x1="12" y1="2" x2="15" y2="8" />
        </svg>
      );

    case 'infused':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Fruit / Mint Infused Sparkle Water */}
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
          <path d="M5 3v4" />
          <path d="M3 5h4" />
        </svg>
      );

    case 'electrolyte':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Energy & Hydration Bolt */}
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );

    case 'mineral':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Mineral Effervescent Waves */}
          <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        </svg>
      );

    case 'water':
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Water Droplet */}
          <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
        </svg>
      );
  }
};
