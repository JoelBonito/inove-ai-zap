import { CategoryColor } from '@/types';

type CategoryColorSet = {
  dot: string;
  badge: string;
  soft: string;
  ring: string;
  avatarBg: string;
  avatarText: string;
};

export const CATEGORY_COLOR_CLASSES: Record<CategoryColor, CategoryColorSet> = {
  blue: {
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-100 dark:border-blue-800/50',
    soft: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700',
    ring: 'ring-blue-500/30',
    avatarBg: 'bg-blue-100',
    avatarText: 'text-blue-600',
  },
  emerald: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/50',
    soft: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700',
    ring: 'ring-emerald-500/30',
    avatarBg: 'bg-emerald-100',
    avatarText: 'text-emerald-600',
  },
  amber: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-100 dark:border-amber-800/50',
    soft: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700',
    ring: 'ring-amber-500/30',
    avatarBg: 'bg-amber-100',
    avatarText: 'text-amber-700',
  },
  purple: {
    dot: 'bg-purple-500',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-100 dark:border-purple-800/50',
    soft: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700',
    ring: 'ring-purple-500/30',
    avatarBg: 'bg-purple-100',
    avatarText: 'text-purple-600',
  },
  red: {
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-100 dark:border-red-800/50',
    soft: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700',
    ring: 'ring-red-500/30',
    avatarBg: 'bg-red-100',
    avatarText: 'text-red-600',
  },
  pink: {
    dot: 'bg-pink-500',
    badge: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-100 dark:border-pink-800/50',
    soft: 'bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-200 border-pink-200 dark:border-pink-700',
    ring: 'ring-pink-500/30',
    avatarBg: 'bg-pink-100',
    avatarText: 'text-pink-600',
  },
  indigo: {
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800/50',
    soft: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700',
    ring: 'ring-indigo-500/30',
    avatarBg: 'bg-indigo-100',
    avatarText: 'text-indigo-600',
  },
  teal: {
    dot: 'bg-teal-500',
    badge: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-100 dark:border-teal-800/50',
    soft: 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-700',
    ring: 'ring-teal-500/30',
    avatarBg: 'bg-teal-100',
    avatarText: 'text-teal-600',
  },
  slate: {
    dot: 'bg-slate-500',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    soft: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    ring: 'ring-slate-400/30',
    avatarBg: 'bg-slate-200',
    avatarText: 'text-slate-600',
  },
};

export const DEFAULT_BADGE_CLASSES =
  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
