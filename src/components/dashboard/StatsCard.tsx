import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  className 
}: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'rounded-2xl border-0 overflow-hidden relative group cursor-default',
        'bg-card shadow-card',
        className
      )}
    >
      {/* Decorative gradient on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-gradient-to-br from-primary/5 to-transparent" />
      
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      <div className="p-5 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">{title}</p>
            <p className="text-2xl font-bold text-foreground font-display tracking-tight leading-none mt-2">{value}</p>
            {description && (
              <p className={cn(
                'text-xs font-medium mt-2',
                trend === 'up' && 'text-success',
                trend === 'down' && 'text-destructive',
                !trend && 'text-muted-foreground/60'
              )}>
                {description}
              </p>
            )}
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-3 group-hover:bg-primary/12 transition-all duration-150 ease-out">
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
