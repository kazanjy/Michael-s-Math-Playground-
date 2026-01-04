import { motion } from 'framer-motion';
import type { JetResources } from '../../types';
import { getResourceIcon } from '../../lib/jetResources';

interface ResourceDisplayProps {
  resources: JetResources;
  compact?: boolean;
}

export function ResourceDisplay({ resources, compact = false }: ResourceDisplayProps) {
  const items = [
    { type: 'missiles' as const, value: resources.missiles, color: 'text-red-400' },
    { type: 'bullets' as const, value: resources.bullets, color: 'text-amber-400' },
    { type: 'flares' as const, value: resources.flares, color: 'text-orange-400' },
    { type: 'chaff' as const, value: resources.chaff, color: 'text-cyan-400' },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2">
        {items.map(item => (
          <div key={item.type} className="flex items-center gap-1">
            <span className="text-sm">{getResourceIcon(item.type)}</span>
            <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {items.map(item => (
        <motion.div
          key={item.type}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2"
        >
          <span className="text-xl">{getResourceIcon(item.type)}</span>
          <div className="flex flex-col items-start">
            <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
            <span className="text-xs text-slate-400 capitalize">{item.type}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
