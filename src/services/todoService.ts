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
const dbTaskToTask = (row: DbTask): Task => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  completed: row.completed,
  status: row.status ?? (row.completed ? 'encerrado' : 'inicio'),
  priority: row.priority,
  categoryId: row.category_id,
  dueDate: row.due_date,
  createdAt: row.created_at,
});

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
    return (data as DbTask[]).map(dbTaskToTask);
  },

  async createTask(
    taskData: Omit<Task, 'id' | 'createdAt'>
  ): Promise<Task | null> {
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const status: KanbanStatus = taskData.status ?? 'inicio';

    const { data, error } = await supabase
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

    if (error) {
      console.error('Erro ao criar tarefa:', error.message);
      return null;
    }
    return dbTaskToTask(data as DbTask);
  },

  async updateTask(task: Task): Promise<Task | null> {
    const { data, error } = await supabase
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

    if (error) {
      console.error('Erro ao atualizar tarefa:', error.message);
      return null;
    }
    return dbTaskToTask(data as DbTask);
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
