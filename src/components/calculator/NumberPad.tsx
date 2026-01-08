import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';

interface NumberPadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  maxLength?: number;
}

export function NumberPad({
  value,
  onChange,
  onSubmit,
  disabled = false,
  maxLength = 6,
}: NumberPadProps) {
  const { isTablet } = useDeviceDetect();

  const handleNumberPress = (num: number) => {
    if (disabled) return;
    if (value.length >= maxLength) return;
    // Don't allow leading zeros
    if (value === '0' && num === 0) return;
    if (value === '0') {
      onChange(String(num));
    } else {
      onChange(value + num);
    }
  };

  const handleDelete = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
  };

  // On tablets, we extend the touch target downward to compensate for finger angle
  // The visual button is positioned at the top of the touch area
  const touchTargetClass = isTablet
    ? 'pt-0 pb-3' // Extra padding at bottom extends touch target down
    : '';

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
          w-[72px] h-[72px] sm:w-24 sm:h-24 md:w-28 md:h-28
          rounded-2xl
          text-3xl sm:text-4xl md:text-5xl font-bold
          bg-gradient-to-b from-slate-700 to-slate-800
          text-white
          shadow-lg shadow-black/30
          border-2 border-slate-600
          flex items-center justify-center
          ${disabled ? 'opacity-50' : ''}
          transition-colors duration-150
          select-none touch-manipulation
          pointer-events-none
        `}
      >
        {num}
      </motion.div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Display */}
      <div className="w-full max-w-xs mb-2">
        <div
          className={`
            w-full h-16 sm:h-20
            rounded-xl
            bg-slate-900
            border-2 border-slate-600
            flex items-center justify-end
            px-6
            text-4xl sm:text-5xl font-mono font-bold
            text-amber-400
            shadow-inner
          `}
        >
          {value || <span className="text-slate-600">?</span>}
        </div>
      </div>

      {/* Number grid - larger gaps prevent mis-taps on touch devices */}
      <div className={`grid grid-cols-3 gap-3 sm:gap-4 md:gap-5 ${isTablet ? '-mb-3' : ''}`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <NumberButton key={num} num={num} />
        ))}

        {/* Bottom row */}
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
              w-[72px] h-[72px] sm:w-24 sm:h-24 md:w-28 md:h-28
              rounded-2xl
              text-2xl font-bold
              bg-gradient-to-b from-red-600 to-red-700
              text-white
              shadow-lg shadow-black/30
              border-2 border-red-500
              ${disabled ? 'opacity-50' : ''}
              flex items-center justify-center
              transition-colors duration-150
              select-none touch-manipulation
              pointer-events-none
            `}
            data-tip="Tap to delete, double-tap to clear"
          >
            <Delete className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" />
          </motion.div>
        </div>

        <NumberButton num={0} />

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
              w-[72px] h-[72px] sm:w-24 sm:h-24 md:w-28 md:h-28
              rounded-2xl
              text-xl sm:text-2xl md:text-3xl font-bold
              bg-gradient-to-b from-emerald-500 to-emerald-600
              text-white
              shadow-lg shadow-black/30
              border-2 border-emerald-400
              ${disabled || value === '' ? 'opacity-50 cursor-not-allowed' : ''}
              flex items-center justify-center
              transition-colors duration-150
              select-none touch-manipulation
              pointer-events-none
            `}
            data-tip="Submit your answer (or press Enter)"
          >
            GO!
          </motion.div>
        </div>
      </div>
    </div>
  );
}
