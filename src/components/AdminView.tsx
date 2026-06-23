import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import type { Category, Task } from '../types';
import { todoService } from '../services/todoService';

interface AdminViewProps {
  categories: Category[];
  tasks: Task[];
  onRefreshData: () => Promise<void>;
}

const COLOR_PRESETS = [
  {
    name: 'Azul',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-100',
    dotBg: 'bg-blue-500',
  },
  {
    name: 'Esmeralda',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-100',
    dotBg: 'bg-emerald-500',
  },
  {
    name: 'Âmbar',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-100',
    dotBg: 'bg-amber-500',
  },
  {
    name: 'Rosa/Vermelho',
    color: 'bg-rose-50 text-rose-700 border-rose-100',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-100',
    dotBg: 'bg-rose-500',
  },
  {
    name: 'Roxo',
    color: 'bg-purple-50 text-purple-700 border-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-100',
    dotBg: 'bg-purple-500',
  },
  {
    name: 'Índigo',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-100',
    dotBg: 'bg-indigo-500',
  },
  {
    name: 'Rosa',
    color: 'bg-pink-50 text-pink-700 border-pink-100',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-100',
    dotBg: 'bg-pink-500',
  },
  {
    name: 'Laranja',
    color: 'bg-orange-50 text-orange-700 border-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-100',
    dotBg: 'bg-orange-500',
  },
  {
    name: 'Ciano',
    color: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-100',
    dotBg: 'bg-cyan-500',
  },
];

export const AdminView: React.FC<AdminViewProps> = ({ categories, tasks, onRefreshData }) => {
  const [name, setName] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const activePreset = COLOR_PRESETS[selectedColorIndex];

  const handleEditClick = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    
    // Tenta encontrar o preset correspondente pelas classes de cor
    const presetIndex = COLOR_PRESETS.findIndex((p) => p.color === cat.color);
    if (presetIndex !== -1) {
      setSelectedColorIndex(presetIndex);
    }
    setError('');
    setSuccessMessage('');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName('');
    setSelectedColorIndex(0);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome da categoria é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const preset = COLOR_PRESETS[selectedColorIndex];
      
      if (editingCategory) {
        // Atualizar categoria existente
        const updated = await todoService.updateCategory({
          id: editingCategory.id,
          name: name.trim(),
          color: preset.color,
          textColor: preset.textColor,
          borderColor: preset.borderColor,
        });

        if (updated) {
          setSuccessMessage('Categoria atualizada com sucesso!');
          handleCancelEdit();
          await onRefreshData();
        } else {
          setError('Erro ao atualizar categoria.');
        }
      } else {
        // Criar nova categoria
        const created = await todoService.createCategory({
          name: name.trim(),
          color: preset.color,
          textColor: preset.textColor,
          borderColor: preset.borderColor,
        });

        if (created) {
          setSuccessMessage('Categoria criada com sucesso!');
          setName('');
          setSelectedColorIndex(0);
          await onRefreshData();
        } else {
          setError('Erro ao criar categoria.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Ocorreu um erro ao salvar a categoria.');
    } finally {
      setIsSubmitting(false);
      // Remove mensagens temporárias após 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  const handleDeleteClick = async (catId: string, catName: string) => {
    const taskCount = tasks.filter((t) => t.categoryId === catId).length;
    
    let confirmMsg = `Deseja realmente excluir a categoria "${catName}"?`;
    if (taskCount > 0) {
      confirmMsg = `Atenção: Existem ${taskCount} tarefas associadas à categoria "${catName}".\nSe você excluí-la, essas tarefas ficarão sem categoria vinculada no Kanban.\n\nDeseja continuar com a exclusão?`;
    }

    const confirm = window.confirm(confirmMsg);
    if (!confirm) return;

    try {
      setIsSubmitting(true);
      const ok = await todoService.deleteCategory(catId);
      if (ok) {
        setSuccessMessage('Categoria excluída com sucesso!');
        await onRefreshData();
      } else {
        setError('Erro ao excluir categoria.');
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao excluir a categoria.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  const getTaskCount = (catId: string) => {
    return tasks.filter((t) => t.categoryId === catId).length;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Tag className="h-6 w-6 text-brand-500" />
            Configurações de Categorias
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Adicione, edite ou remova as categorias que classificam suas tarefas.
          </p>
        </div>
        <button
          onClick={onRefreshData}
          disabled={isSubmitting}
          className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 active:bg-slate-100 transition-all duration-200"
        >
          <RefreshCw className={`h-4 w-4 ${isSubmitting ? 'animate-spin' : ''}`} />
          Sincronizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Formulário de Criação/Edição */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-5">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-3.5 text-xs font-semibold text-rose-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 text-xs font-semibold text-emerald-600 flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Nome */}
              <div>
                <label htmlFor="cat-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Nome da Categoria
                </label>
                <input
                  id="cat-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Marketing, Infra, Financeiro"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                  maxLength={25}
                />
              </div>

              {/* Cor (Paleta) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Selecione o Tema Visual
                </label>
                <div className="grid grid-cols-5 gap-2.5">
                  {COLOR_PRESETS.map((preset, index) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedColorIndex(index)}
                      className={`group relative flex h-10 w-full items-center justify-center rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                        selectedColorIndex === index
                          ? 'border-slate-800 scale-100 shadow-sm'
                          : 'border-slate-100 hover:border-slate-300'
                      }`}
                      title={preset.name}
                    >
                      <span className={`h-5 w-5 rounded-full ${preset.dotBg} shadow-inner flex items-center justify-center`}>
                        {selectedColorIndex === index && (
                          <Check className="h-3 w-3 text-white stroke-[3.5]" />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="pt-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Visualização da Tag
                </span>
                <div className="flex h-12 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-2">
                  <span className={`inline-block rounded-lg px-3 py-1 text-xs font-bold border transition-all duration-300 ${activePreset.color}`}>
                    {name.trim() ? name.toUpperCase() : 'NOME DA CATEGORIA'}
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-50">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-brand-500 py-2.5 text-xs font-semibold text-white hover:bg-brand-600 active:bg-brand-700 shadow-md shadow-brand-500/10 hover:shadow-lg hover:shadow-brand-500/20 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Lista de Categorias Cadastradas */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-5">
              Categorias Ativas ({categories.length})
            </h2>

            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Tag className="h-10 w-10 text-slate-300 mb-3 stroke-[1.5]" />
                <p className="text-sm font-semibold text-slate-600">Nenhuma categoria encontrada</p>
                <p className="text-xs text-slate-400 mt-1">Utilize o formulário ao lado para criar a primeira.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full border-collapse text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">Tag Visual</th>
                      <th className="px-6 py-3.5 font-semibold">Tarefas Vinculadas</th>
                      <th className="px-6 py-3.5 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {categories.map((cat) => {
                      const count = getTaskCount(cat.id);
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/40 transition-colors">
                          {/* Tag */}
                          <td className="px-6 py-4">
                            <span className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-semibold border ${cat.color}`}>
                              {cat.name.toUpperCase()}
                            </span>
                          </td>
                          {/* Tarefas Vinculadas */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              count > 0 ? 'bg-slate-100 text-slate-700 font-semibold' : 'bg-slate-50 text-slate-400'
                            }`}>
                              {count} {count === 1 ? 'tarefa' : 'tarefas'}
                            </span>
                          </td>
                          {/* Ações */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditClick(cat)}
                                title="Editar categoria"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 border border-slate-100 hover:border-slate-200 transition-all duration-200"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(cat.id, cat.name)}
                                title="Excluir categoria"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-slate-100 hover:border-rose-100 transition-all duration-200"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
