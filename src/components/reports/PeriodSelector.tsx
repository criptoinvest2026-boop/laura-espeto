import { format, endOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Período dos relatórios: últimos 7 dias, mês (comportamento original, com
// "Todos os meses") ou intervalo personalizado escolhido no calendário.
export type Period =
  | { mode: 'month'; month: string } // month = 'yyyy-MM' ou 'all'
  | { mode: '7d' }
  | { mode: 'custom'; from?: Date; to?: Date };

/**
 * Converte o período em limites de data como strings 'yyyy-MM-dd' (inclusivos),
 * comparáveis diretamente com sale_date/expense_date. null = sem filtro (tudo).
 */
export function periodToInterval(period: Period): { from: string; to: string } | null {
  switch (period.mode) {
    case 'month': {
      if (period.month === 'all') return null;
      const [year, month] = period.month.split('-').map(Number);
      const start = new Date(year, month - 1, 1);
      return { from: format(start, 'yyyy-MM-dd'), to: format(endOfMonth(start), 'yyyy-MM-dd') };
    }
    case '7d': {
      const today = new Date();
      return { from: format(subDays(today, 6), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') };
    }
    case 'custom':
      if (period.from && period.to) {
        return { from: format(period.from, 'yyyy-MM-dd'), to: format(period.to, 'yyyy-MM-dd') };
      }
      return null;
  }
}

interface Props {
  value: Period;
  onChange: (p: Period) => void;
  availableMonths: string[];
  formatMonth: (m: string) => string;
}

export default function PeriodSelector({ value, onChange, availableMonths, formatMonth }: Props) {
  const currentMonth = format(new Date(), 'yyyy-MM');

  const handleModeChange = (mode: string) => {
    if (mode === '7d') onChange({ mode: '7d' });
    else if (mode === 'custom') onChange({ mode: 'custom' });
    else onChange({ mode: 'month', month: availableMonths[0] || currentMonth });
  };

  const rangeLabel =
    value.mode === 'custom' && value.from
      ? value.to
        ? `${format(value.from, 'dd/MM/yy')} – ${format(value.to, 'dd/MM/yy')}`
        : format(value.from, 'dd/MM/yy')
      : 'Escolher datas';

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <Select value={value.mode} onValueChange={handleModeChange}>
        <SelectTrigger className="w-full sm:w-44 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">🗓 Últimos 7 dias</SelectItem>
          <SelectItem value="month">📅 Mensal</SelectItem>
          <SelectItem value="custom">✏️ Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {value.mode === 'month' && (
        <Select value={value.month} onValueChange={(month) => onChange({ mode: 'month', month })}>
          <SelectTrigger className="w-full sm:w-56 rounded-xl">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">📊 Todos os meses</SelectItem>
            {availableMonths.length > 0 ? (
              availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {formatMonth(month)}
                </SelectItem>
              ))
            ) : (
              <SelectItem value={currentMonth}>{formatMonth(currentMonth)}</SelectItem>
            )}
          </SelectContent>
        </Select>
      )}

      {value.mode === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-56 rounded-xl justify-start font-normal">
              <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
              {rangeLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={{ from: value.from, to: value.to }}
              onSelect={(range) => onChange({ mode: 'custom', from: range?.from, to: range?.to })}
              numberOfMonths={1}
              locale={ptBR}
              defaultMonth={value.from || new Date()}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
