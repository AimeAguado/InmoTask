import React, { useMemo } from 'react';
import { FinancialEntry } from '../../types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  CalendarDays,
} from 'lucide-react';

interface MonthlyFinancialsCardProps {
  entries: FinancialEntry[];
  month?: string;
}

const MONTH_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const formatARS = (value: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);

const formatCompactARS = (value: number): string => {
  const absolute = Math.abs(value);
  if (absolute >= 1000000) {
    return `$${(value / 1000000).toFixed(2).replace('.', ',')} M`;
  }
  if (absolute >= 1000) {
    return `$${(value / 1000).toFixed(0)} k`;
  }
  return `$${value}`;
};

export const MonthlyFinancialsCard: React.FC<MonthlyFinancialsCardProps> = ({
  entries,
}) => {
  const summary = useMemo(() => {
    const income = entries
      .filter((e) => e.type === 'ingreso')
      .reduce((acc, e) => acc + e.amount, 0);

    const expenses = entries
      .filter((e) => e.type === 'egreso')
      .reduce((acc, e) => acc + e.amount, 0);

    const balance = income - expenses;
    const margin = income > 0 ? (balance / income) * 100 : 0;

    return { income, expenses, balance, margin };
  }, [entries]);

  const topExpenseCategory = useMemo(() => {
    const byCategory = new Map<string, number>();
    entries
      .filter((e) => e.type === 'egreso')
      .forEach((e) => {
        byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
      });

    return [...byCategory.entries()].reduce<{ category: string; amount: number } | null>(
      (top, [category, amount]) => (!top || amount > top.amount ? { category, amount } : top),
      null
    );
  }, [entries]);

  const monthLabel = useMemo(() => {
    const now = new Date();
    return `${MONTH_LABELS[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  const expenseShare =
    summary.income > 0 ? (summary.expenses / summary.income) * 100 : 0;

  const isProfitable = summary.balance >= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 mt-0.5">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Resultado Financiero del Mes
              </h3>
              <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                <CalendarDays className="w-3 h-3 text-slate-400" />
                {monthLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingresos, gastos y balance neto registrados en el mes en curso.
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 self-start text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            isProfitable
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {isProfitable ? 'En ganancia' : 'En déficit'}
        </span>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-2.5 mt-3.5">
        {/* Ingresos */}
        <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Ganancias del Mes
          </span>
          <div className="mt-1 text-lg xl:text-xl font-extrabold font-mono text-emerald-700 tabular-nums leading-tight">
            {formatCompactARS(summary.income)}
          </div>
          <span className="mt-0.5 block text-[10px] text-slate-400 font-mono">
            {formatARS(summary.income)}
          </span>
        </div>

        {/* Gastos */}
        <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            Gastos del Mes
          </span>
          <div className="mt-1 text-lg xl:text-xl font-extrabold font-mono text-rose-700 tabular-nums leading-tight">
            {formatCompactARS(summary.expenses)}
          </div>
          <span className="mt-0.5 block text-[10px] text-slate-400 font-mono">
            {expenseShare.toFixed(0)}% de los ingresos
          </span>
        </div>

        {/* Balance Neto */}
        <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <PiggyBank className="w-3.5 h-3.5 text-slate-700" />
            Balance Neto
          </span>
          <div
            className={`mt-1 text-lg xl:text-xl font-extrabold font-mono tabular-nums leading-tight ${
              isProfitable ? 'text-slate-900' : 'text-rose-700'
            }`}
          >
            {formatCompactARS(summary.balance)}
          </div>
          <span className="mt-0.5 block text-[10px] text-slate-400 font-mono">
            Ingresos menos gastos
          </span>
        </div>

        {/* Margen */}
        <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-200/70">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-blue-500" />
            Margen Neto
          </span>
          <div className="mt-1 text-lg xl:text-xl font-extrabold font-mono text-slate-900 tabular-nums leading-tight">
            {summary.margin.toFixed(1)}%
          </div>
          <span className="mt-0.5 block text-[10px] text-slate-400">
            {summary.margin >= 40 ? 'Dentro del rango objetivo' : 'Por debajo del objetivo (40%)'}
          </span>
        </div>
      </div>

      {/* Gasto principal del mes */}
      {topExpenseCategory && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="text-slate-500">Principal partida de gasto</span>
          <span className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold">
              {topExpenseCategory.category}
            </span>
            <span className="font-mono tabular-nums text-slate-900 font-bold">
              {formatCompactARS(topExpenseCategory.amount)}
            </span>
            <span className="text-slate-400 font-mono">
              (
              {summary.expenses > 0
                ? ((topExpenseCategory.amount / summary.expenses) * 100).toFixed(0)
                : 0}
              % del total)
            </span>
          </span>
        </div>
      )}
    </div>
  );
};
