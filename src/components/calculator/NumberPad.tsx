import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';

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

  const NumberButton = ({ num }: { num: number }) => (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onPointerDown={() => handleNumberPress(num)}
      disabled={disabled}
      className={`
        w-20 h-20 sm:w-24 sm:h-24
        rounded-2xl
        text-3xl sm:text-4xl font-bold
        bg-gradient-to-b from-slate-700 to-slate-800
        text-white
        shadow-lg shadow-black/30
        border-2 border-slate-600
        hover:from-slate-600 hover:to-slate-700
        active:from-slate-800 active:to-slate-900
        disabled:opacity-50
        transition-colors duration-150
        select-none touch-manipulation
      `}
    >
      {num}
    </motion.button>
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

      {/* Number grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <NumberButton key={num} num={num} />
        ))}

        {/* Bottom row */}
        <motion.button
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onPointerDown={handleDelete}
          onDoubleClick={handleClear}
          disabled={disabled}
          className={`
            w-20 h-20 sm:w-24 sm:h-24
            rounded-2xl
            text-2xl font-bold
            bg-gradient-to-b from-red-600 to-red-700
            text-white
            shadow-lg shadow-black/30
            border-2 border-red-500
            hover:from-red-500 hover:to-red-600
            disabled:opacity-50
            flex items-center justify-center
            transition-colors duration-150
            select-none touch-manipulation
          `}
          title="Tap to delete, double-tap to clear"
        >
          <Delete size={32} />
        </motion.button>

        <NumberButton num={0} />

        <motion.button
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={onSubmit}
          disabled={disabled || value === ''}
          className={`
            w-20 h-20 sm:w-24 sm:h-24
            rounded-2xl
            text-xl font-bold
            bg-gradient-to-b from-emerald-500 to-emerald-600
            text-white
            shadow-lg shadow-black/30
            border-2 border-emerald-400
            hover:from-emerald-400 hover:to-emerald-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-150
            select-none touch-manipulation
          `}
        >
          GO!
        </motion.button>
      </div>
    </div>
  );
}
