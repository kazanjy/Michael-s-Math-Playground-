import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';
import type { KeypadConfig } from '../../types/gymnasium';

interface GymnasiumNumberPadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  maxLength?: number;
  keypadConfig: KeypadConfig;
}

export function GymnasiumNumberPad({
  value,
  onChange,
  onSubmit,
  disabled = false,
  maxLength = 10,
  keypadConfig,
}: GymnasiumNumberPadProps) {
  const { isTablet } = useDeviceDetect();
  const { hasDecimal, hasNegative, hasFraction } = keypadConfig;

  // Count special characters to determine columns
  const specialCount = (hasDecimal ? 1 : 0) + (hasNegative ? 1 : 0) + (hasFraction ? 1 : 0);

  const handleNumberPress = (num: number) => {
    if (disabled) return;
    if (value.length >= maxLength) return;

    // Handle leading zeros
    if (value === '0' && num === 0) return;
    if (value === '0') {
      onChange(String(num));
    } else if (value === '-0') {
      onChange('-' + num);
    } else if (value === '-' && num === 0) {
      onChange('-0');
    } else {
      onChange(value + num);
    }
  };

  const handleDecimal = () => {
    if (disabled || !hasDecimal) return;
    // Don't allow multiple decimals
    if (value.includes('.')) return;
    // Don't allow decimal after fraction
    if (value.includes('/')) return;
    // Add leading zero if empty or just negative
    if (value === '' || value === '-') {
      onChange(value + '0.');
    } else {
      onChange(value + '.');
    }
  };

  const handleNegative = () => {
    if (disabled || !hasNegative) return;
    // Toggle negative sign
    if (value.startsWith('-')) {
      onChange(value.slice(1));
    } else {
      onChange('-' + value);
    }
  };

  const handleFraction = () => {
    if (disabled || !hasFraction) return;
    // Don't allow multiple fraction slashes
    if (value.includes('/')) return;
    // Don't allow fraction with decimal
    if (value.includes('.')) return;
    // Don't allow starting with fraction
    if (value === '' || value === '-') return;
    onChange(value + '/');
  };

  const handleDelete = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
  };

  // On tablets, we shift the touch target down to compensate for finger angle
  const touchTargetClass = isTablet ? 'pt-4 pb-6' : '';

  const buttonBaseClass = `
    w-[60px] h-[60px] sm:w-20 sm:h-20 md:w-24 md:h-24
    rounded-2xl
    text-2xl sm:text-3xl md:text-4xl font-bold
    shadow-lg shadow-black/30
    flex items-center justify-center
    transition-colors duration-150
    select-none touch-manipulation
    pointer-events-none
  `;

  const NumberButton = ({ num }: { num: number }) => (
    <div
      className={`relative ${touchTargetClass}`}
      onPointerDown={(e) => {
        e.preventDefault();
        handleNumberPress(num);
      }}
    >
      <motion.div
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        className={`
          ${buttonBaseClass}
          bg-gradient-to-b from-slate-700 to-slate-800
          text-white
          border-2 border-slate-600
          ${disabled ? 'opacity-50' : ''}
          ${isTablet ? '-mt-4' : ''}
        `}
      >
        {num}
      </motion.div>
    </div>
  );

  const SpecialButton = ({
    label,
    onClick,
    isActive = false,
    color = 'blue',
  }: {
    label: string;
    onClick: () => void;
    isActive?: boolean;
    color?: 'blue' | 'purple' | 'amber';
  }) => {
    const colorClasses = {
      blue: isActive
        ? 'bg-gradient-to-b from-blue-500 to-blue-600 border-blue-400'
        : 'bg-gradient-to-b from-blue-600 to-blue-700 border-blue-500',
      purple: isActive
        ? 'bg-gradient-to-b from-purple-500 to-purple-600 border-purple-400'
        : 'bg-gradient-to-b from-purple-600 to-purple-700 border-purple-500',
      amber: isActive
        ? 'bg-gradient-to-b from-amber-500 to-amber-600 border-amber-400'
        : 'bg-gradient-to-b from-amber-600 to-amber-700 border-amber-500',
    };

    return (
      <div
        className={`relative ${touchTargetClass}`}
        onPointerDown={(e) => {
          e.preventDefault();
          onClick();
        }}
      >
        <motion.div
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          className={`
            ${buttonBaseClass}
            ${colorClasses[color]}
            text-white
            border-2
            ${disabled ? 'opacity-50' : ''}
            ${isTablet ? '-mt-4' : ''}
          `}
        >
          {label}
        </motion.div>
      </div>
    );
  };

  // Determine the value to display, formatting nicely
  const displayValue = value || <span className="text-slate-600">?</span>;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Display */}
      <div className="w-full max-w-sm mb-2">
        <div
          className={`
            w-full h-14 sm:h-16
            rounded-xl
            bg-slate-900
            border-2 border-slate-600
            flex items-center justify-end
            px-4
            text-3xl sm:text-4xl font-mono font-bold
            text-amber-400
            shadow-inner
          `}
        >
          {displayValue}
        </div>
      </div>

      {/* Main number grid */}
      <div className={`grid grid-cols-3 gap-2 sm:gap-3 ${isTablet ? '-mb-6' : ''}`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <NumberButton key={num} num={num} />
        ))}

        {/* Bottom row with 0 and special buttons */}
        {/* Delete button */}
        <div
          className={`relative ${touchTargetClass}`}
          onPointerDown={(e) => {
            e.preventDefault();
            handleDelete();
          }}
          onDoubleClick={handleClear}
        >
          <motion.div
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            className={`
              ${buttonBaseClass}
              bg-gradient-to-b from-red-600 to-red-700
              text-white
              border-2 border-red-500
              ${disabled ? 'opacity-50' : ''}
              ${isTablet ? '-mt-4' : ''}
            `}
            data-tip="Tap to delete, double-tap to clear"
          >
            <Delete className="w-6 h-6 sm:w-7 sm:h-7" />
          </motion.div>
        </div>

        <NumberButton num={0} />

        {/* Submit button */}
        <div
          className={`relative ${touchTargetClass}`}
          onClick={() => {
            if (!disabled && value !== '') {
              onSubmit();
            }
          }}
        >
          <motion.div
            whileTap={{ scale: disabled || value === '' ? 1 : 0.95 }}
            className={`
              ${buttonBaseClass}
              bg-gradient-to-b from-emerald-500 to-emerald-600
              text-white
              border-2 border-emerald-400
              ${disabled || value === '' ? 'opacity-50 cursor-not-allowed' : ''}
              ${isTablet ? '-mt-4' : ''}
            `}
            data-tip="Submit your answer"
          >
            GO!
          </motion.div>
        </div>
      </div>

      {/* Special buttons row (only if any are enabled) */}
      {specialCount > 0 && (
        <div className={`flex gap-2 sm:gap-3 mt-2 ${isTablet ? '-mb-6' : ''}`}>
          {hasNegative && (
            <SpecialButton
              label="+/−"
              onClick={handleNegative}
              isActive={value.startsWith('-')}
              color="purple"
            />
          )}
          {hasDecimal && (
            <SpecialButton
              label="."
              onClick={handleDecimal}
              isActive={value.includes('.')}
              color="blue"
            />
          )}
          {hasFraction && (
            <SpecialButton
              label="/"
              onClick={handleFraction}
              isActive={value.includes('/')}
              color="amber"
            />
          )}
        </div>
      )}
    </div>
  );
}
