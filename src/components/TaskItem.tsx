import React from 'react';
import { Calendar, Trash2, Edit3, AlertCircle, Check } from 'lucide-react';
import type { Task, Category, Priority } from '../types';

interface TaskItemProps {
  task: Task;
  category?: Category;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  category,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
}) => {
  // Tradução e estilos da prioridade
  const priorityInfo = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return {
          label: 'ALTA',
          classes: 'bg-rose-50 text-rose-700 border-rose-100',
        };
      case 'medium':
        return {
          label: 'MÉDIA',
          classes: 'bg-amber-50 text-amber-700 border-amber-100',
        };
      case 'low':
        return {
          label: 'BAIXA',
          classes: 'bg-slate-100 text-slate-600 border-slate-200',
        };
    }
  };

  const priorityStyle = priorityInfo(task.priority);

  // Formatação de data legível
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Checagem se a tarefa está vencida e incompleta
  const isOverdue = React.useMemo(() => {
    if (task.completed) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate < today;
  }, [task.dueDate, task.completed]);

  return (
    <div
      className={`group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-200/80 transition-all duration-300 md:flex-row md:items-center md:justify-between ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      {/* Esquerda: Checkbox + Título + Info */}
      <div className="flex items-start gap-4 flex-1">
        {/* Checkbox Customizado */}
        <button
          onClick={() => onToggleComplete(task.id)}
          aria-label={task.completed ? "Marcar como pendente" : "Marcar como concluída"}
          className={`custom-checkbox mt-1 shrink-0 ${task.completed ? 'checked' : ''}`}
        >
          {task.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
        </button>

        {/* Informações da Tarefa */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-base font-bold text-slate-800 break-words ${
                task.completed ? 'line-through text-slate-400' : ''
              }`}
            >
              {task.title}
            </h3>
            {/* Indicador de Atraso */}
            {isOverdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-100">
                <AlertCircle className="h-3 w-3" />
                Atrasada
              </span>
            )}
          </div>

          {task.description && (
            <p className={`text-sm text-slate-500 break-words max-w-2xl ${task.completed ? 'text-slate-400' : ''}`}>
              {task.description}
            </p>
          )}

          {/* Tags e Prazos */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Tag Categoria */}
            {category && (
              <span
                className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-semibold border ${category.color}`}
              >
                {category.name.toUpperCase()}
              </span>
            )}

            {/* Tag Prioridade */}
            <span
              className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-semibold border ${priorityStyle.classes}`}
            >
              {priorityStyle.label}
            </span>

            {/* Data de Início */}
            {task.startDate && task.status === 'inicio' && (
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-lg border ${
                  task.autoStart 
                    ? 'text-brand-600 bg-brand-50/50 border-brand-100' 
                    : 'text-slate-500 bg-slate-50 border-slate-100'
                }`}
              >
                {task.autoStart ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                    </span>
                    <span>Inicia auto: {formatDate(task.startDate)}</span>
                  </>
                ) : (
                  <span>Início planejado: {formatDate(task.startDate)}</span>
                )}
              </div>
            )}

            {/* Data Limite */}
            <div
              className={`flex items-center gap-1.5 text-xs font-medium ${
                isOverdue ? 'text-rose-500 font-semibold' : 'text-slate-400'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Prazo: {formatDate(task.dueDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Direita: Ações Rápidas */}
      <div className="flex items-center gap-2 self-end md:self-auto border-t border-slate-50 pt-3 md:border-t-0 md:pt-0">
        {/* Editar */}
        <button
          onClick={() => onEditTask(task)}
          title="Editar tarefa"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 border border-slate-100 hover:border-slate-200 transition-all duration-200"
        >
          <Edit3 className="h-4 w-4" />
        </button>

        {/* Excluir */}
        <button
          onClick={() => onDeleteTask(task.id)}
          title="Excluir tarefa"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-slate-100 hover:border-rose-100 transition-all duration-200"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
