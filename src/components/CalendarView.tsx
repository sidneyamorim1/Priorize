import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock, Inbox, Plus } from 'lucide-react';
import type { Task, Category } from '../types';

interface CalendarViewProps {
  tasks: Task[];
  categories: Category[];
  onToggleComplete: (id: string) => void;
  onAddTaskClick: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  categories,
  onToggleComplete,
  onAddTaskClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Nomes dos meses e dias da semana
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Ir para o mês anterior
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Ir para o mês seguinte
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Obter dias do mês atual e preenchimento dos dias vizinhos
  const calendarDays = useMemo(() => {
    // Primeiro dia do mês
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Último dia do mês atual
    const lastDay = new Date(year, month + 1, 0).getDate();
    // Último dia do mês anterior
    const prevLastDay = new Date(year, month, 0).getDate();
    
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Preencher dias do mês anterior para iniciar na célula certa do calendário
    for (let i = firstDayIndex; i > 0; i--) {
      const d = prevLastDay - i + 1;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const mStr = String(prevMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({
        dateStr: `${prevYear}-${mStr}-${dStr}`,
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // Preencher dias do mês atual
    for (let i = 1; i <= lastDay; i++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      days.push({
        dateStr: `${year}-${mStr}-${dStr}`,
        dayNum: i,
        isCurrentMonth: true,
      });
    }

    // Preencher dias do próximo mês para fechar a grade (geralmente múltiplo de 7, total de 35 ou 42 células)
    const totalCells = days.length > 35 ? 42 : 35;
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const mStr = String(nextMonth + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      days.push({
        dateStr: `${nextYear}-${mStr}-${dStr}`,
        dayNum: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Mapeamento de tarefas por data para otimizar a renderização das bolinhas do calendário
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (!map[task.dueDate]) {
        map[task.dueDate] = [];
      }
      map[task.dueDate].push(task);
    });
    return map;
  }, [tasks]);

  // Tarefas do dia selecionado
  const selectedDayTasks = useMemo(() => {
    return tasksByDate[selectedDateStr] || [];
  }, [tasksByDate, selectedDateStr]);

  // Formatação de data legível
  const formatSelectedDate = (dateString: string) => {
    const [y, m, d] = dateString.split('-');
    return `${parseInt(d)} de ${monthNames[parseInt(m) - 1]} de ${y}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Calendário de Prazos</h1>
        <p className="text-sm text-slate-500">Visualize seus compromissos e prazos distribuídos pelo mês.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lado Esquerdo: O Calendário */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100/50 lg:col-span-2">
          {/* Navegação do Mês */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">
              {monthNames[month]} <span className="text-slate-400 font-normal">{year}</span>
            </h2>
            <div className="flex items-center gap-1 border border-slate-100 rounded-xl p-1 bg-slate-50/50">
              <button
                onClick={handlePrevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-white rounded-lg transition-colors"
              >
                Hoje
              </button>
              <button
                onClick={handleNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Grade Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-xs font-bold text-slate-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grade do Mês */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              const dayTasks = tasksByDate[cell.dateStr] || [];
              const isSelected = selectedDateStr === cell.dateStr;
              const isToday = new Date().toISOString().split('T')[0] === cell.dateStr;

              return (
                <button
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`relative flex flex-col justify-between items-center rounded-xl p-2 min-h-16 border text-center transition-all duration-200 hover:border-brand-300 hover:bg-brand-50/20 group ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/40 text-brand-700 shadow-sm shadow-brand-500/5'
                      : cell.isCurrentMonth
                      ? isToday
                        ? 'border-brand-200 bg-slate-50/30 text-brand-600 font-bold'
                        : 'border-slate-50 bg-white text-slate-700'
                      : 'border-transparent bg-slate-50/30 text-slate-400'
                  }`}
                >
                  {/* Número do Dia */}
                  <span className={`text-sm ${isToday && !isSelected ? 'underline decoration-2 underline-offset-4' : ''}`}>
                    {cell.dayNum}
                  </span>

                  {/* Indicador de Tarefas por Cores */}
                  <div className="flex flex-wrap justify-center gap-1 w-full mt-1.5 min-h-[6px]">
                    {dayTasks.slice(0, 3).map((task) => {
                      const cat = categories.find((c) => c.id === task.categoryId);
                      // Extrair a cor de fundo aproximada ou usar padrão
                      const dotBg = cat ? cat.color.split(' ')[0] : 'bg-slate-400';
                      return (
                        <span
                          key={task.id}
                          className={`h-1.5 w-1.5 rounded-full ${dotBg}`}
                          title={task.title}
                        />
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <span className="text-[8px] leading-none font-bold text-slate-400">
                        +{dayTasks.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lado Direito: Tarefas do Dia Selecionado */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100/50 flex flex-col h-fit">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
              <CalendarIcon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 leading-tight">Compromissos do Dia</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {formatSelectedDate(selectedDateStr)}
              </p>
            </div>
          </div>

          {/* Lista das Tarefas do Dia */}
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {selectedDayTasks.length > 0 ? (
              selectedDayTasks.map((task) => {
                const cat = categories.find((c) => c.id === task.categoryId);
                return (
                  <div
                    key={task.id}
                    className={`flex flex-col gap-2 rounded-xl border border-slate-100 p-3 hover:border-slate-200 transition-colors ${
                      task.completed ? 'opacity-65 bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => onToggleComplete(task.id)}
                          className={`flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 mt-0.5 shrink-0 transition-colors ${
                            task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'hover:border-brand-500'
                          }`}
                        >
                          {task.completed && (
                            <span className="block h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </button>
                        <h4
                          className={`text-xs font-bold text-slate-700 leading-normal break-words ${
                            task.completed ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>
                    </div>
                    {/* Tags Rápidas */}
                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-50/50">
                      {cat && (
                        <span className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold border ${cat.color}`}>
                          {cat.name.toUpperCase()}
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-semibold flex items-center gap-1 ${
                          task.completed ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {task.completed ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Concluída
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            Pendente
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Inbox className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-500">Sem prazos para hoje</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Nenhuma tarefa expira nesta data.
                </p>
                <button
                  onClick={onAddTaskClick}
                  className="mt-3 inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 px-3 py-1.5 text-[10px] font-bold transition-all duration-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agendar Tarefa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
