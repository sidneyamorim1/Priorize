import React, { useState, useMemo, useRef } from 'react';
import { Plus, Search, Filter, Columns2, CircleDot, Zap, CheckCircle2 } from 'lucide-react';
import type { Task, Category, KanbanStatus } from '../types';
import { KanbanCard } from './KanbanCard';

interface KanbanBoardProps {
  tasks: Task[];
  categories: Category[];
  onMoveTask: (id: string, status: KanbanStatus) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onAddTaskClick: () => void;
}

interface Column {
  id: KanbanStatus;
  label: string;
  icon: React.ReactNode;
  headerClass: string;
  badgeClass: string;
  dropBorderClass: string;
  emptyIcon: React.ReactNode;
}

const COLUMNS: Column[] = [
  {
    id: 'inicio',
    label: 'Início',
    icon: <CircleDot className="h-4 w-4" />,
    headerClass: 'from-slate-500 to-slate-400',
    badgeClass: 'bg-slate-100 text-slate-600',
    dropBorderClass: 'border-slate-400 bg-slate-50/50',
    emptyIcon: <CircleDot className="h-6 w-6 text-slate-300" />,
  },
  {
    id: 'fazendo',
    label: 'Fazendo',
    icon: <Zap className="h-4 w-4" />,
    headerClass: 'from-amber-500 to-amber-400',
    badgeClass: 'bg-amber-100 text-amber-700',
    dropBorderClass: 'border-amber-400 bg-amber-50/50',
    emptyIcon: <Zap className="h-6 w-6 text-amber-200" />,
  },
  {
    id: 'encerrado',
    label: 'Encerrado',
    icon: <CheckCircle2 className="h-4 w-4" />,
    headerClass: 'from-emerald-500 to-emerald-400',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    dropBorderClass: 'border-emerald-400 bg-emerald-50/50',
    emptyIcon: <CheckCircle2 className="h-6 w-6 text-emerald-200" />,
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  categories,
  onMoveTask,
  onDeleteTask,
  onEditTask,
  onAddTaskClick,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStatus | null>(null);
  const dragTaskId = useRef<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesCategory = categoryFilter === 'all' || task.categoryId === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [tasks, search, categoryFilter, priorityFilter]);

  const tasksForColumn = (colId: KanbanStatus) =>
    filteredTasks.filter((t) => t.status === colId);

  // ── Drag & Drop handlers ──────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    dragTaskId.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: KanbanStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(colId);
  };

  const handleDrop = (e: React.DragEvent, colId: KanbanStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (dragTaskId.current) {
      const task = tasks.find((t) => t.id === dragTaskId.current);
      if (task && task.status !== colId) {
        onMoveTask(dragTaskId.current, colId);
      }
      dragTaskId.current = null;
    }
  };

  const handleDragLeave = () => setDragOverColumn(null);

  const hasActiveFilters = search || categoryFilter !== 'all' || priorityFilter !== 'all';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-sky-400 text-white shadow-md shadow-brand-500/20">
            <Columns2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Quadro Kanban</h1>
            <p className="text-sm text-slate-500">{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} no total</p>
          </div>
        </div>
        <button
          onClick={onAddTaskClick}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/10 hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-500/20 active:scale-98 transition-all duration-200 self-start sm:self-auto"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
          Nova Tarefa
        </button>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar tarefas..."
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Filter className="h-3.5 w-3.5" />
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 focus:border-brand-500 focus:outline-none transition-colors"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 focus:border-brand-500 focus:outline-none transition-colors"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setCategoryFilter('all'); setPriorityFilter('all'); }}
              className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Colunas Kanban */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = tasksForColumn(col.id);
          const isDragTarget = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              className="flex flex-col gap-3"
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              onDragLeave={handleDragLeave}
            >
              {/* Cabeçalho da coluna */}
              <div className={`flex items-center justify-between rounded-xl bg-gradient-to-r ${col.headerClass} p-3.5 text-white shadow-sm`}>
                <div className="flex items-center gap-2 font-semibold text-sm">
                  {col.icon}
                  {col.label}
                </div>
                <span className={`rounded-lg px-2.5 py-0.5 text-xs font-bold ${col.badgeClass}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Drop zone + cards */}
              <div
                className={`flex flex-col gap-3 min-h-[200px] rounded-xl border-2 border-dashed p-3 transition-all duration-200 ${
                  isDragTarget
                    ? `${col.dropBorderClass} scale-[1.01]`
                    : 'border-transparent'
                }`}
              >
                {colTasks.length > 0 ? (
                  colTasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      category={categories.find((c) => c.id === task.categoryId)}
                      onMoveTask={onMoveTask}
                      onDeleteTask={onDeleteTask}
                      onEditTask={onEditTask}
                      onDragStart={handleDragStart}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/50 py-10 px-4 text-center gap-2">
                    {col.emptyIcon}
                    <p className="text-xs text-slate-400 font-medium">
                      {isDragTarget ? 'Solte aqui!' : 'Nenhuma tarefa'}
                    </p>
                  </div>
                )}

                {/* Hint de arrastar quando há tarefas */}
                {isDragTarget && colTasks.length > 0 && (
                  <div className="rounded-xl border-2 border-dashed border-current py-4 text-center text-xs font-medium opacity-60">
                    Solte aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
