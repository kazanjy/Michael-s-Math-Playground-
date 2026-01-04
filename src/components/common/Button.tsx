import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30',
  secondary: 'bg-slate-600 hover:bg-slate-700 text-white shadow-lg shadow-slate-500/30',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30',
  ghost: 'bg-transparent hover:bg-white/10 text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  onClick,
  type = 'button',
  title,
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-xl font-bold
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={disabled}
      onClick={onClick}
      type={type}
      title={title}
    >
      {children}
    </motion.button>
  );
}
