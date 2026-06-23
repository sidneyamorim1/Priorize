export type Priority = 'low' | 'medium' | 'high';
export type KanbanStatus = 'inicio' | 'fazendo' | 'encerrado';

export interface Category {
  id: string;
  name: string;
  color: string;
  textColor: string;
  borderColor: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  status: KanbanStatus;
  priority: Priority;
  categoryId: string;
  dueDate: string;
  startDate?: string;
  autoStart?: boolean;
  createdAt: string;
}

export interface User {
  email: string;
  name: string;
}

export interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}
