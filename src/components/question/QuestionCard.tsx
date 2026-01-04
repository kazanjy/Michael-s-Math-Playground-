import { motion } from 'framer-motion';
import type { Question } from '../../types';

interface QuestionCardProps {
  question: Question;
  showHint?: boolean;
  attempts?: number;
}

export function QuestionCard({ question, showHint, attempts = 0 }: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      {/* Main question display */}
      <div className="mb-4">
        <span className="text-5xl sm:text-7xl font-bold text-white drop-shadow-lg">
          {question.displayString} = ?
        </span>
      </div>

      {/* Attempts indicator */}
      {attempts > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-amber-400 text-lg font-semibold mb-4"
        >
          {attempts < 3 ? (
            <span>Try again! ({3 - attempts} tries left for hint)</span>
          ) : (
            <span>Here's a hint!</span>
          )}
        </motion.div>
      )}

      {/* Visual hint after 3 attempts */}
      {showHint && question.operation === 'multiply' && (
        <VisualMultiplicationHint
          operand1={question.operand1}
          operand2={question.operand2}
        />
      )}

      {showHint && question.operation === 'divide' && (
        <VisualDivisionHint
          dividend={question.operand1}
          divisor={question.operand2}
        />
      )}

      {showHint && question.operation === 'add' && (
        <VisualAdditionHint
          operand1={question.operand1}
          operand2={question.operand2}
        />
      )}

      {showHint && question.operation === 'subtract' && (
        <VisualSubtractionHint
          operand1={question.operand1}
          operand2={question.operand2}
        />
      )}
    </motion.div>
  );
}

// Visual hint for multiplication - show groups of jets
function VisualMultiplicationHint({ operand1, operand2 }: { operand1: number; operand2: number }) {
  // Limit visualization for larger numbers
  const rows = Math.min(operand1, 10);
  const cols = Math.min(operand2, 10);

  if (operand1 > 10 || operand2 > 10) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-slate-800/80 rounded-xl p-4 mt-4"
      >
        <p className="text-white text-lg">
          Think: {operand1} groups of {operand2}
        </p>
        <p className="text-slate-400 text-sm mt-2">
          {operand1} × {operand2} = ?
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/80 rounded-xl p-4 mt-4"
    >
      <p className="text-slate-300 text-sm mb-3">
        Count the jets! {rows} rows of {cols}
      </p>
      <div className="flex flex-col items-center gap-1">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-1">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <motion.span
                key={colIndex}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (rowIndex * cols + colIndex) * 0.02 }}
                className="text-lg"
              >
                ✈️
              </motion.span>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Visual hint for division
function VisualDivisionHint({ dividend, divisor }: { dividend: number; divisor: number }) {
  const answer = dividend / divisor;

  if (dividend > 100 || divisor > 10) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-slate-800/80 rounded-xl p-4 mt-4"
      >
        <p className="text-white text-lg">
          How many groups of {divisor} fit in {dividend}?
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/80 rounded-xl p-4 mt-4"
    >
      <p className="text-slate-300 text-sm mb-3">
        Split {dividend} jets into groups of {divisor}. How many groups?
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({ length: answer }).map((_, groupIndex) => (
          <motion.div
            key={groupIndex}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="bg-slate-700 rounded-lg p-2 border border-slate-600"
          >
            {Array.from({ length: divisor }).map((_, i) => (
              <span key={i} className="text-sm">✈️</span>
            ))}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Visual hint for addition
function VisualAdditionHint({ operand1, operand2 }: { operand1: number; operand2: number }) {
  if (operand1 > 20 || operand2 > 20) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-slate-800/80 rounded-xl p-4 mt-4"
      >
        <p className="text-white text-lg">
          Start at {operand1}, count up {operand2} more
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/80 rounded-xl p-4 mt-4"
    >
      <p className="text-slate-300 text-sm mb-3">
        Count all the jets together!
      </p>
      <div className="flex gap-4 justify-center items-center">
        <div className="flex flex-wrap gap-1 max-w-32 justify-center">
          {Array.from({ length: operand1 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="text-sm"
            >
              ✈️
            </motion.span>
          ))}
        </div>
        <span className="text-2xl text-white">+</span>
        <div className="flex flex-wrap gap-1 max-w-32 justify-center">
          {Array.from({ length: operand2 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: (operand1 + i) * 0.02 }}
              className="text-sm"
            >
              🛩️
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Visual hint for subtraction
function VisualSubtractionHint({ operand1, operand2 }: { operand1: number; operand2: number }) {
  if (operand1 > 30) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-slate-800/80 rounded-xl p-4 mt-4"
      >
        <p className="text-white text-lg">
          Start at {operand1}, count back {operand2}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/80 rounded-xl p-4 mt-4"
    >
      <p className="text-slate-300 text-sm mb-3">
        {operand1} jets, {operand2} fly away. How many left?
      </p>
      <div className="flex flex-wrap gap-1 justify-center max-w-64">
        {Array.from({ length: operand1 }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 1 }}
            animate={{
              opacity: i < operand1 - operand2 ? 1 : 0.3,
              scale: i < operand1 - operand2 ? 1 : 0.8,
            }}
            transition={{ delay: i >= operand1 - operand2 ? (i - (operand1 - operand2)) * 0.05 : 0 }}
            className={`text-sm ${i >= operand1 - operand2 ? 'grayscale' : ''}`}
          >
            ✈️
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
