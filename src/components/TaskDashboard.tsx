import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, CheckCircle2, Clock, CheckSquare } from 'lucide-react';
import type { Task, Category } from '../types';
import { TaskItem } from './TaskItem';

interface TaskDashboardProps {
  tasks: Task[];
  categories: Category[];
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onAddTaskClick: () => void;
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({
  tasks,
  categories,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
  onAddTaskClick,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Cálculos estatísticos
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, rate };
  }, [tasks]);

  // Lista filtrada
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
        (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
      
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && task.completed) ||
        (statusFilter === 'pending' && !task.completed);
      
      const matchesCategory = categoryFilter === 'all' || task.categoryId === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [tasks, search, statusFilter, categoryFilter, priorityFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* 1. Header do Painel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Painel de Tarefas</h1>
          <p className="text-sm text-slate-500">Gerencie, filtre e acompanhe suas atividades diárias.</p>
        </div>
        <button
          onClick={onAddTaskClick}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/10 hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-500/20 active:scale-98 transition-all duration-200 self-start sm:self-auto"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
          Nova Tarefa
        </button>
      </div>

      {/* 2. Cartões de Estatísticas Rápidas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100/50 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Criadas</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
            <CheckSquare className="h-6 w-6" />
          </div>
        </div>

        {/* Pendentes */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100/50 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pendentes</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.pending}</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Concluídas */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100/50 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Concluídas</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.completed}</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Progresso Geral */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Taxa de Conclusão</p>
            <span className="text-sm font-bold text-slate-700">{stats.rate}%</span>
          </div>
          {/* Barra de Progresso */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-brand-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Filtros e Controles */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50 mb-6 flex flex-col gap-4">
        {/* Barra Superior de Busca e Status */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar tarefas pelo título ou descrição..."
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
            />
          </div>

          {/* Filtros de Status (Todas, Pendentes, Concluídas) */}
          <div className="flex rounded-xl bg-slate-100/80 p-1 self-start lg:self-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                statusFilter === 'all'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                statusFilter === 'pending'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                statusFilter === 'completed'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Concluídas
            </button>
          </div>
        </div>

        {/* Dropdowns de Filtro Adicionais */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-50 pt-4">
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            Filtros:
          </span>

          {/* Categoria */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 focus:border-brand-500 focus:outline-none transition-colors"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Prioridade */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 focus:border-brand-500 focus:outline-none transition-colors"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="high">Alta Prioridade</option>
            <option value="medium">Média Prioridade</option>
            <option value="low">Baixa Prioridade</option>
          </select>

          {/* Limpar Filtros se ativos */}
          {(search || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setCategoryFilter('all');
                setPriorityFilter('all');
              }}
              className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors ml-auto"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* 4. Lista de Tarefas */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              category={categories.find((c) => c.id === task.categoryId)}
              onToggleComplete={onToggleComplete}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3">
              <CheckSquare className="h-6 w-6 stroke-[1.5]" />
            </div>
            <p className="text-base font-semibold text-slate-700">Nenhuma tarefa encontrada</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Altere os filtros acima ou adicione uma nova tarefa para começar a organizar sua rotina.
            </p>
            <button
              onClick={onAddTaskClick}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 px-4 py-2 text-xs font-semibold transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Criar Primeira Tarefa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
