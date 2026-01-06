import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { DogfightBackground } from '../components/backgrounds/DogfightBackground';

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
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-600 to-slate-800 flex flex-col items-center justify-center p-4">
      {/* Epic dogfight background! */}
      <DogfightBackground />

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
              {/* Explosions behind the jet */}
              <motion.span
                className="absolute -left-12 top-2 text-4xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                💥
              </motion.span>
              <motion.span
                className="absolute -left-8 -top-4 text-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
              >
                💥
              </motion.span>

              {/* The jet */}
              <motion.span
                className="text-7xl relative z-10"
                animate={{ x: [0, 5, 0], y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                ✈️
              </motion.span>

              {/* Missiles chasing from behind */}
              <motion.span
                className="absolute -left-16 top-1 text-2xl"
                animate={{ x: [0, 15, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🚀
              </motion.span>
              <motion.span
                className="absolute -left-20 top-6 text-xl"
                animate={{ x: [0, 12, 0], opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }}
              >
                🚀
              </motion.span>
              <motion.span
                className="absolute -left-14 -top-2 text-lg"
                animate={{ x: [0, 10, 0], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.3, repeat: Infinity, delay: 0.7 }}
              >
                🚀
              </motion.span>
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Michael's Math Dogfight
          </h1>
          <p className="text-sky-100 text-lg font-medium">
            Times Tables and Mental Math with Missiles
          </p>
          <p className="text-sky-200 text-base mt-1">
            Ready for takeoff, pilot?
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
                    placeholder="pilot@example.com"
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
