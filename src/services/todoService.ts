import { supabase } from '../lib/supabase';
import type { Task, Category, KanbanStatus } from '../types';

// ─── Tipos de linha do banco (snake_case) ────────────────────────────────────
interface DbTask {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  status: KanbanStatus;
  priority: 'low' | 'medium' | 'high';
  category_id: string;
  due_date: string;
  start_date: string | null;
  auto_start: boolean;
  created_at: string;
}

interface DbCategory {
  id: string;
  name: string;
  color: string;
  text_color: string;
  border_color: string;
}

// ─── Conversores ─────────────────────────────────────────────────────────────
// Chave localStorage para campos locais (fallback)
const LOCAL_TASK_FIELDS_KEY = 'todo_premium_local_fields';

const getLocalFields = (): Record<string, { startDate?: string; autoStart?: boolean }> => {
  try {
    const data = localStorage.getItem(LOCAL_TASK_FIELDS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

const saveLocalField = (id: string, startDate?: string, autoStart?: boolean) => {
  try {
    const fields = getLocalFields();
    fields[id] = { startDate, autoStart };
    localStorage.setItem(LOCAL_TASK_FIELDS_KEY, JSON.stringify(fields));
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
  }
};

const dbTaskToTask = (row: DbTask, localFields?: Record<string, { startDate?: string; autoStart?: boolean }>): Task => {
  const lf = localFields || getLocalFields();
  const local = lf[row.id];
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    completed: row.completed,
    status: row.status ?? (row.completed ? 'encerrado' : 'inicio'),
    priority: row.priority,
    categoryId: row.category_id,
    dueDate: row.due_date,
    startDate: local?.startDate ?? row.start_date ?? undefined,
    autoStart: local?.autoStart ?? row.auto_start ?? false,
    createdAt: row.created_at,
  };
};

const dbCategoryToCategory = (row: DbCategory): Category => ({
  id: row.id,
  name: row.name,
  color: row.color,
  textColor: row.text_color,
  borderColor: row.border_color,
});

// ─── Chave localStorage para usuário ─────────────────────────────────────────
const USER_KEY = 'todo_premium_user';

// ─── Serviço principal ────────────────────────────────────────────────────────
export const todoService = {
  // --- Categorias ---
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar categorias:', error.message);
      return [];
    }
    return (data as DbCategory[]).map(dbCategoryToCategory);
  },

  // --- Tarefas ---
  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar tarefas:', error.message);
      return [];
    }
    const lf = getLocalFields();
    return (data as DbTask[]).map((row) => dbTaskToTask(row, lf));
  },

  async createTask(
    taskData: Omit<Task, 'id' | 'createdAt'>
  ): Promise<Task | null> {
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const status: KanbanStatus = taskData.status ?? 'inicio';

    // Salva localmente primeiro como fallback
    saveLocalField(id, taskData.startDate, taskData.autoStart);

    // Tentativa 1: Inserir com as colunas novas
    let result = await supabase
      .from('tasks')
      .insert({
        id,
        title: taskData.title,
        description: taskData.description ?? null,
        completed: status === 'encerrado',
        status,
        priority: taskData.priority,
        category_id: taskData.categoryId,
        due_date: taskData.dueDate,
        start_date: taskData.startDate ?? null,
        auto_start: taskData.autoStart ?? false,
      })
      .select()
      .single();

    // Se der erro de coluna inexistente ou outro no Supabase, tenta sem as colunas novas
    if (result.error) {
      console.warn('Erro ao inserir colunas novas no Supabase, executando em modo local/fallback:', result.error.message);
      result = await supabase
        .from('tasks')
        .insert({
          id,
          title: taskData.title,
          description: taskData.description ?? null,
          completed: status === 'encerrado',
          status,
          priority: taskData.priority,
          category_id: taskData.categoryId,
          due_date: taskData.dueDate,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Erro ao criar tarefa (fallback):', result.error.message);
      return null;
    }
    return dbTaskToTask(result.data as DbTask, getLocalFields());
  },

  async updateTask(task: Task): Promise<Task | null> {
    // Salva localmente primeiro como fallback
    saveLocalField(task.id, task.startDate, task.autoStart);

    // Tentativa 1: Atualizar com as colunas novas
    let result = await supabase
      .from('tasks')
      .update({
        title: task.title,
        description: task.description ?? null,
        completed: task.status === 'encerrado',
        status: task.status,
        priority: task.priority,
        category_id: task.categoryId,
        due_date: task.dueDate,
        start_date: task.startDate ?? null,
        auto_start: task.autoStart ?? false,
      })
      .eq('id', task.id)
      .select()
      .single();

    // Se der erro de coluna inexistente, tenta atualizar sem elas
    if (result.error) {
      console.warn('Erro ao atualizar colunas novas no Supabase, executando em modo local/fallback:', result.error.message);
      result = await supabase
        .from('tasks')
        .update({
          title: task.title,
          description: task.description ?? null,
          completed: task.status === 'encerrado',
          status: task.status,
          priority: task.priority,
          category_id: task.categoryId,
          due_date: task.dueDate,
        })
        .eq('id', task.id)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Erro ao atualizar tarefa (fallback):', result.error.message);
      return null;
    }
    return dbTaskToTask(result.data as DbTask, getLocalFields());
  },

  async updateTaskStatus(id: string, status: KanbanStatus): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .update({ status, completed: status === 'encerrado' })
      .eq('id', id);

    if (error) {
      console.error('Erro ao mover tarefa:', error.message);
      return false;
    }
    return true;
  },

  async deleteTask(id: string): Promise<boolean> {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir tarefa:', error.message);
      return false;
    }
    return true;
  },

  // --- Categorias CRUD ---
  async createCategory(category: Omit<Category, 'id'>): Promise<Category | null> {
    const id = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const { data, error } = await supabase
      .from('categories')
      .insert({
        id,
        name: category.name,
        color: category.color,
        text_color: category.textColor,
        border_color: category.borderColor,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria:', error.message);
      return null;
    }
    return dbCategoryToCategory(data as DbCategory);
  },

  async updateCategory(category: Category): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: category.name,
        color: category.color,
        text_color: category.textColor,
        border_color: category.borderColor,
      })
      .eq('id', category.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar categoria:', error.message);
      return null;
    }
    return dbCategoryToCategory(data as DbCategory);
  },

  async deleteCategory(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir categoria:', error.message);
      return false;
    }
    return true;
  },

  // --- Usuário ---
  getCurrentUser() {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  login(name: string, email: string) {
    const user = { name, email };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem(USER_KEY);
  },
};
