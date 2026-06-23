import React, { useState } from 'react';
import { Calendar, Trash2, Edit3, AlertCircle, GripVertical, Play } from 'lucide-react';
import type { Task, Category, Priority, KanbanStatus } from '../types';

interface KanbanCardProps {
  task: Task;
  category?: Category;
  onMoveTask: (id: string, status: KanbanStatus) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

const priorityInfo = (priority: Priority) => {
  switch (priority) {
    case 'high':
      return { label: 'ALTA', classes: 'bg-rose-50 text-rose-700 border-rose-100' };
    case 'medium':
      return { label: 'MÉDIA', classes: 'bg-amber-50 text-amber-700 border-amber-100' };
    case 'low':
      return { label: 'BAIXA', classes: 'bg-slate-100 text-slate-500 border-slate-200' };
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  category,
  onMoveTask,
  onDeleteTask,
  onEditTask,
  onDragStart,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pStyle = priorityInfo(task.priority);

  const isOverdue = React.useMemo(() => {
    if (task.status === 'encerrado') return false;
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate < today;
  }, [task.dueDate, task.status]);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="group relative flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 cursor-grab active:cursor-grabbing active:scale-[0.98] active:shadow-lg active:rotate-1"
    >
      {/* Alça de drag */}
      <div className="absolute top-3 right-3 text-slate-200 group-hover:text-slate-400 transition-colors">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Título */}
      <h3
        className={`text-sm font-semibold text-slate-800 leading-snug pr-5 ${
          task.status === 'encerrado' ? 'line-through text-slate-400' : ''
        }`}
      >
        {task.title}
        {isOverdue && (
          <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-100">
            <AlertCircle className="h-2.5 w-2.5" />
            Atrasada
          </span>
        )}
      </h3>

      {/* Descrição */}
      {task.description && (
        <div className="text-xs text-slate-400 leading-relaxed">
          <p className={isExpanded ? '' : 'line-clamp-2'}>
            {task.description}
          </p>
          {task.description.length > 60 && (
            <button
              type="button"
              onClick={(e) => {
                // Impede o drag ou outras ações indesejadas ao clicar
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="mt-1 text-[10px] font-bold text-brand-500 hover:text-brand-600 transition-colors uppercase tracking-wider block cursor-pointer"
            >
              {isExpanded ? 'Ler menos' : 'Ler mais...'}
            </button>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        {category && (
          <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold border ${category.color}`}>
            {category.name.toUpperCase()}
          </span>
        )}
        <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold border ${pStyle.classes}`}>
          {pStyle.label}
        </span>
        {task.startDate && task.status === 'inicio' && (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
              task.autoStart
                ? 'bg-brand-50 text-brand-600 border-brand-100'
                : 'bg-slate-50 text-slate-500 border-slate-100'
            }`}
          >
            {task.autoStart && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500"></span>
              </span>
            )}
            <span>INICIA: {formatDate(task.startDate)}</span>
          </span>
        )}
      </div>

      {/* Rodapé: data + ações */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
        <div className={`flex items-center gap-1 text-[11px] font-medium ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
          <Calendar className="h-3 w-3" />
          {formatDate(task.dueDate)}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {task.status === 'inicio' && (
            <button
              onClick={() => onMoveTask(task.id, 'fazendo')}
              title="Iniciar Tarefa"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-500 hover:bg-brand-50 hover:text-brand-600 transition-all"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
            </button>
          )}
          <button
            onClick={() => onEditTask(task)}
            title="Editar"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDeleteTask(task.id)}
            title="Excluir"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
