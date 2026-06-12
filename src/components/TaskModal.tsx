import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Task, Category, Priority } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    description: string;
    priority: Priority;
    categoryId: string;
    dueDate: string;
  }) => void;
  categories: Category[];
  taskToEdit: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  taskToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [categoryId, setCategoryId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  // Sincronizar dados do formulário quando o modal abre ou muda de tarefa para edição
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setCategoryId(taskToEdit.categoryId);
      setDueDate(taskToEdit.dueDate);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      // Seleciona a primeira categoria como padrão se houver
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      // Define a data limite como o dia de hoje por padrão
      setDueDate(new Date().toISOString().split('T')[0]);
    }
    setError('');
  }, [taskToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('O título da tarefa é obrigatório.');
      return;
    }
    if (!categoryId) {
      setError('Por favor, selecione uma categoria.');
      return;
    }
    if (!dueDate) {
      setError('Por favor, informe uma data limite.');
      return;
    }

    setError('');
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      categoryId,
      dueDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Dimmed Overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Caixa do Modal */}
      <div className="relative w-full max-w-lg transform rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl transition-all duration-300 animate-scale-in">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabeçalho */}
        <h2 className="text-xl font-bold text-slate-800 mb-6 pr-8">
          {taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
        </h2>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-600 border border-rose-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Título */}
          <div>
            <label htmlFor="modal-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Título da Tarefa
            </label>
            <input
              id="modal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Finalizar relatório trimestral"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
            />
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="modal-description" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Descrição (Opcional)
            </label>
            <textarea
              id="modal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhes sobre a execução desta tarefa..."
              rows={3}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 resize-none"
            />
          </div>

          {/* Grid Categoria e Data */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Categoria */}
            <div>
              <label htmlFor="modal-category" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Categoria
              </label>
              <select
                id="modal-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
              >
                <option value="" disabled>Selecione...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Limite */}
            <div>
              <label htmlFor="modal-due-date" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Prazo de Conclusão
              </label>
              <div className="relative">
                <input
                  id="modal-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Prioridade da Tarefa
            </span>
            <div className="grid grid-cols-3 gap-2">
              {/* Baixa */}
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`rounded-xl border py-2.5 text-xs font-semibold tracking-wider transition-all duration-200 ${
                  priority === 'low'
                    ? 'border-slate-300 bg-slate-100 text-slate-700 font-bold shadow-sm'
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100/60'
                }`}
              >
                BAIXA
              </button>

              {/* Média */}
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`rounded-xl border py-2.5 text-xs font-semibold tracking-wider transition-all duration-200 ${
                  priority === 'medium'
                    ? 'border-amber-200 bg-amber-50 text-amber-700 font-bold shadow-sm'
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100/60'
                }`}
              >
                MÉDIA
              </button>

              {/* Alta */}
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`rounded-xl border py-2.5 text-xs font-semibold tracking-wider transition-all duration-200 ${
                  priority === 'high'
                    ? 'border-rose-200 bg-rose-50 text-rose-700 font-bold shadow-sm'
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100/60'
                }`}
              >
                ALTA
              </button>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-600 shadow-md shadow-brand-500/10 hover:shadow-lg hover:shadow-brand-500/20 transition-all duration-200"
            >
              {taskToEdit ? 'Salvar Alterações' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
