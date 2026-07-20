import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ShoppingCart, Package, ClipboardList, Wallet, Menu, X, BarChart3, Smartphone, Download, Moon, Sun } from 'lucide-react';
import { useDevicePresence } from '@/hooks/useDevicePresence';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pdv', icon: ShoppingCart, label: 'PDV' },
  { to: '/comandas', icon: ClipboardList, label: 'Comandas' },
  { to: '/caixa', icon: Wallet, label: 'Fluxo de Caixa' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/instalar', icon: Download, label: 'Instalar App' },
];

const sidebarVariants = {
  closed: {
    x: '-100%',
    transition: { type: 'spring' as const, stiffness: 400, damping: 35 },
  },
  open: {
    x: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
  },
};

const overlayVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1, transition: { duration: 0.1 } },
};

const navItemVariants = {
  closed: { opacity: 0, x: -12 },
  open: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.03 + i * 0.02, duration: 0.15, ease: [0.25, 0.8, 0.25, 1] as [number, number, number, number] },
  }),
};

export default function Sidebar() {
  const location = useLocation();
  const { connectedDevices, deviceCount } = useDevicePresence();
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleClose = useCallback(() => setMobileOpen(false), []);

  const NavContent = ({ animated }: { animated?: boolean }) => (
    <>
      {/* Logo area */}
      <div className="p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-sidebar-foreground/20" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-sidebar-foreground/10" />
        </div>
        <h1 className="font-display text-sidebar-foreground tracking-[0.15em] text-4xl relative">
          TOP
        </h1>
        <p className="font-display text-sidebar-primary tracking-[0.35em] uppercase mt-1 text-2xl relative">
          Espetos
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className="text-xs opacity-60">🍢</span>
          <div className="w-8 h-0.5 rounded-full bg-sidebar-primary/40" />
          <span className="text-xs opacity-60">🔥</span>
          <div className="w-8 h-0.5 rounded-full bg-sidebar-primary/40" />
          <span className="text-xs opacity-60">🍺</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.to;
          const linkContent = (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-100 relative group',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-soft'
                  : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground active:scale-[0.97]'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-sidebar-foreground/80" />
              )}
              <item.icon className={cn(
                "w-[18px] h-[18px] transition-transform duration-100",
                !isActive && "group-hover:scale-110"
              )} />
              {item.label}
            </NavLink>
          );

          if (animated) {
            return (
              <motion.div
                key={item.to}
                custom={index}
                variants={navItemVariants}
                initial="closed"
                animate="open"
              >
                {linkContent}
              </motion.div>
            );
          }
          return <div key={item.to}>{linkContent}</div>;
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-all duration-100 active:scale-[0.97]"
          onClick={toggleTheme}
        >
          {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {isDark ? 'Modo Claro' : 'Modo Noturno'}
        </Button>
      </div>

      {/* Connected Devices */}
      <div className="px-3 py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sidebar-accent/20 border border-sidebar-border/30 cursor-default transition-colors hover:bg-sidebar-accent/30">
              <div className="relative">
                <Smartphone className="w-4 h-4 text-sidebar-foreground/60" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-pulse" />
              </div>
              <span className="text-xs text-sidebar-foreground/60">
                {deviceCount} {deviceCount === 1 ? 'dispositivo' : 'dispositivos'}
              </span>
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-success/20 text-success border-0 font-semibold">
                online
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium text-sm">Dispositivos conectados:</p>
              {connectedDevices.map((device, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <span className="w-1.5 h-1.5 bg-success rounded-full" />
                  <span>{device.device_type}</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="p-4 border-t border-sidebar-border/40">
        <div className="px-3">
          <p className="text-sm font-medium text-sidebar-foreground/90">
            Top Espetos
          </p>
          <p className="text-[11px] text-sidebar-foreground/50">
            Gestão da Barraca
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle - animated icon */}
      <motion.div
        className="fixed top-4 left-4 z-50 lg:hidden"
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="shadow-elevated bg-card/90 backdrop-blur-md rounded-xl border border-border/50"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Menu className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Mobile overlay + sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-40 lg:hidden"
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={handleClose}
              style={{
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />
            <motion.aside
              key="mobile-sidebar"
              className="fixed top-0 left-0 z-40 h-screen w-[280px] bg-sidebar border-r border-sidebar-border/50 flex flex-col lg:hidden shadow-elevated overflow-hidden"
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              style={{
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              }}
            >
              <NavContent animated />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar (always visible) */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-40 h-screen w-64 bg-sidebar glass-sidebar border-r border-sidebar-border/50 flex-col">
        <NavContent />
      </aside>
    </>
  );
}
