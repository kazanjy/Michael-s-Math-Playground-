import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2, Dumbbell } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export function LoginPage() {
  const { signInWithMagicLink, enterDemoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setMessage(null);

    const result = await signInWithMagicLink(email);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Check your email for a magic link!' });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 via-purple-700 to-slate-900 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-block mb-4"
          >
            <div className="relative inline-block">
              {/* Animated stars around the icon */}
              <motion.span
                className="absolute -left-8 top-0 text-2xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ⭐
              </motion.span>
              <motion.span
                className="absolute -right-8 top-0 text-2xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              >
                ⭐
              </motion.span>

              {/* The dumbbell icon */}
              <motion.div
                className="text-7xl relative z-10"
                animate={{ y: [0, -5, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Dumbbell className="w-20 h-20 text-white" />
              </motion.div>

              {/* Math symbols floating around */}
              <motion.span
                className="absolute -left-12 top-8 text-xl text-amber-300"
                animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ➕
              </motion.span>
              <motion.span
                className="absolute -right-12 top-8 text-xl text-amber-300"
                animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                ✖️
              </motion.span>
              <motion.span
                className="absolute -left-6 -bottom-2 text-lg text-amber-300"
                animate={{ y: [0, -8, 0], opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
              >
                ➗
              </motion.span>
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Michael's Math Gymnasium
          </h1>
          <p className="text-purple-100 text-lg font-medium">
            AI-Powered Word Problems for Every Grade
          </p>
          <p className="text-purple-200 text-base mt-1">
            Ready to train your brain?
          </p>
        </div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          {isSupabaseConfigured() ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>
              </div>

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl ${
                    message.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : 'bg-red-500/20 text-red-200'
                  }`}
                >
                  {message.text}
                </motion.div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Send Login Magic Link'
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-slate-300 mb-6">
                Supabase not configured yet. Start with demo mode!
              </p>
            </div>
          )}

          {/* Demo mode button */}
          <div className="mt-6">
            <Button
              variant="ghost"
              size="lg"
              className="w-full border border-white/20"
              onClick={enterDemoMode}
            >
              🎮 Try Demo Mode
            </Button>
            <p className="text-center text-slate-400 text-sm mt-2">
              No account needed - data saved locally
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
