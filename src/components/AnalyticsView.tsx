import React, { useMemo } from 'react';
import { BarChart2, TrendingUp, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import type { Task, Category, Priority } from '../types';

interface AnalyticsViewProps {
  tasks: Task[];
  categories: Category[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks, categories }) => {
  // 1. Estatísticas Básicas
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const today = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter((t) => !t.completed && t.dueDate < today).length;

    return { total, completed, pending, rate, overdue };
  }, [tasks]);

  // 2. Distribuição por Categoria
  const categoryData = useMemo(() => {
    return categories.map((cat) => {
      const catTasks = tasks.filter((t) => t.categoryId === cat.id);
      const total = catTasks.length;
      const completed = catTasks.filter((t) => t.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        ...cat,
        total,
        completed,
        rate,
      };
    });
  }, [tasks, categories]);

  // 3. Distribuição por Prioridade
  const priorityData = useMemo(() => {
    const priorities: Priority[] = ['high', 'medium', 'low'];
    const labels = { high: 'Alta', medium: 'Média', low: 'Baixa' };
    const colors = {
      high: 'bg-rose-500',
      medium: 'bg-amber-500',
      low: 'bg-slate-400',
    };
    const textColors = {
      high: 'text-rose-600',
      medium: 'text-amber-600',
      low: 'text-slate-500',
    };

    return priorities.map((p) => {
      const prioTasks = tasks.filter((t) => t.priority === p);
      const total = prioTasks.length;
      const completed = prioTasks.filter((t) => t.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        key: p,
        name: labels[p],
        total,
        completed,
        rate,
        colorClass: colors[p],
        textColorClass: textColors[p],
      };
    });
  }, [tasks]);

  // 4. Frase de Insight Motivacional
  const insight = useMemo(() => {
    if (stats.total === 0) {
      return {
        title: 'Nenhum dado disponível',
        desc: 'Crie tarefas e conclua-as para visualizar seus insights de produtividade aqui.',
        icon: <BarChart2 className="h-6 w-6 text-slate-400" />,
        color: 'bg-slate-50 border-slate-100',
      };
    }
    if (stats.overdue > 0) {
      return {
        title: 'Atenção aos prazos',
        desc: `Você tem ${stats.overdue} ${
          stats.overdue === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'
        }. Priorize a conclusão das tarefas com prazos vencidos para retomar o controle de sua rotina.`,
        icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
        color: 'bg-amber-50 border-amber-100',
      };
    }
    if (stats.rate >= 80) {
      return {
        title: 'Desempenho Extraordinário!',
        desc: 'Parabéns! Você concluiu a grande maioria de suas tarefas. Mantenha esse nível de foco e produtividade!',
        icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
        color: 'bg-emerald-50 border-emerald-100',
      };
    }
    if (stats.rate >= 50) {
      return {
        title: 'Ótimo Progresso',
        desc: 'Você completou mais da metade de suas tarefas. Continue avançando para fechar o dia com chave de ouro!',
        icon: <CheckCircle className="h-6 w-6 text-brand-500" />,
        color: 'bg-brand-50 border-brand-100',
      };
    }
    return {
      title: 'Dando os primeiros passos',
      desc: 'Marque mais tarefas como concluídas. Pequenas metas alcançadas levam a grandes resultados.',
      icon: <TrendingUp className="h-6 w-6 text-sky-500" />,
      color: 'bg-sky-50 border-sky-100',
    };
  }, [stats]);

  // Constantes para o gráfico de progresso circular SVG
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.rate / 100) * circumference;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Análises de Produtividade</h1>
        <p className="text-sm text-slate-500">Acompanhe seu desempenho e métricas de execução.</p>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        
        {/* Card 1: Progresso Circular SVG */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100/50 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Conclusão Geral</h3>
          <div className="relative flex items-center justify-center h-40 w-40 mb-4">
            {/* SVG Ring */}
            <svg className="h-full w-full -rotate-90">
              {/* Back Circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-100 fill-transparent"
                strokeWidth="10"
              />
              {/* Front Active Progress Circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-brand-500 fill-transparent transition-all duration-700 ease-out"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            {/* Texto Central */}
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-800">{stats.rate}%</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Concluído</span>
            </div>
          </div>
          <div className="text-xs font-medium text-slate-500">
            {stats.completed} de {stats.total} tarefas finalizadas
          </div>
        </div>

        {/* Card 2: Distribuição por Categoria */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100/50 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Desempenho por Categoria</h3>
          <div className="space-y-4.5">
            {categoryData.map((cat) => {
              // Porcentagem de tarefas dessa categoria sobre o total de tarefas


              return (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-3 w-3 rounded-full ${cat.color.split(' ')[0]}`} />
                      <span className="font-semibold text-slate-700">{cat.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {cat.completed}/{cat.total} tarefas ({cat.rate}%)
                    </span>
                  </div>
                  {/* Barra de Progresso */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.total > 0 ? cat.color.split(' ')[0] + ' ' + cat.color.split(' ')[1] : 'bg-slate-300'
                      }`}
                      style={{ width: `${cat.rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid Inferior: Prioridade & Card de Insight */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Card 3: Distribuição por Prioridade */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100/50 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Status por Prioridade</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {priorityData.map((prio) => (
              <div
                key={prio.key}
                className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4"
              >
                <div>
                  <span className={`text-xs font-bold uppercase ${prio.textColorClass}`}>
                    {prio.name}
                  </span>
                  <div className="text-2xl font-bold text-slate-800 mt-1">
                    {prio.completed} <span className="text-xs font-medium text-slate-400">/ {prio.total}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1.5">
                    <span>CONCLUÍDO</span>
                    <span>{prio.rate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${prio.colorClass}`}
                      style={{ width: `${prio.rate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Insight Inteligente */}
        <div className={`rounded-2xl border p-6 shadow-sm shadow-slate-100/50 flex flex-col justify-between ${insight.color}`}>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Insight do Dia</h3>
              <h4 className="text-base font-bold text-slate-700 pt-2">{insight.title}</h4>
              <p className="text-xs leading-relaxed text-slate-600">{insight.desc}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100/30">
              {insight.icon}
            </div>
          </div>
          <div className="text-[10px] font-semibold text-slate-400 mt-4">
            Dica: organize as prioridades no início do dia.
          </div>
        </div>
      </div>
    </div>
  );
};
