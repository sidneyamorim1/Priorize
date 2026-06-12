import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { KanbanBoard } from './components/KanbanBoard';
import { AnalyticsView } from './components/AnalyticsView';
import { CalendarView } from './components/CalendarView';
import { TaskModal } from './components/TaskModal';
import { todoService } from './services/todoService';
import type { Task, Category, User, KanbanStatus } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'analytics' | 'calendar'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados iniciais do Supabase
  useEffect(() => {
    const currentUser = todoService.getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedTasks, fetchedCategories] = await Promise.all([
        todoService.getTasks(),
        todoService.getCategories(),
      ]);
      setTasks(fetchedTasks);
      setCategories(fetchedCategories);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Login
  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return error.message;
      }
      // Supabase retorna informações do usuário
      const userInfo = data?.user;
      if (userInfo) {
        const name = userInfo.user_metadata?.full_name ?? userInfo.email ?? email;
        const loggedUser = todoService.login(name, userInfo.email ?? email);
        setUser(loggedUser as any);
        await loadData();
      }
      return null;
    } catch (e) {
      console.error('Login error', e);
      return 'Erro ao conectar ao servidor. Tente novamente.';
    }
  };

  // Logout
  const handleLogout = async () => {
    const confirmLogout = window.confirm('Deseja realmente sair?');
    if (confirmLogout) {
      await supabase.auth.signOut();
      todoService.logout();
      setUser(null);
      setTasks([]);
      setCategories([]);
      setActiveTab('tasks');
    }
  };

  // Mover tarefa entre colunas Kanban
  const handleMoveTask = async (id: string, status: KanbanStatus) => {
    const prev = tasks;
    // Atualização otimista imediata
    setTasks(tasks.map((t) =>
      t.id === id ? { ...t, status, completed: status === 'encerrado' } : t
    ));
    const ok = await todoService.updateTaskStatus(id, status);
    if (!ok) setTasks(prev);
  };

  // Alternar conclusão (usado pelo CalendarView)
  const handleToggleComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const newStatus: KanbanStatus = task.status === 'encerrado' ? 'inicio' : 'encerrado';
    await handleMoveTask(id, newStatus);
  };

  // Excluir tarefa
  const handleDeleteTask = async (id: string) => {
    const confirmDelete = window.confirm('Deseja realmente excluir esta tarefa?');
    if (!confirmDelete) return;

    // Atualização otimista
    const prev = tasks;
    setTasks(tasks.filter((t) => t.id !== id));

    const ok = await todoService.deleteTask(id);
    if (!ok) {
      setTasks(prev);
    }
  };

  // Clique para Adicionar
  const handleAddTaskClick = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  // Clique para Editar
  const handleEditTaskClick = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  // Submissão do Modal (Criar ou Editar)
  const handleModalSubmit = async (taskData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    categoryId: string;
    dueDate: string;
  }) => {
    if (taskToEdit) {
      const optimistic: Task = { ...taskToEdit, ...taskData };
      setTasks(tasks.map((t) => (t.id === optimistic.id ? optimistic : t)));
      setIsModalOpen(false);
      await todoService.updateTask(optimistic);
    } else {
      setIsModalOpen(false);
      const created = await todoService.createTask({
        ...taskData,
        completed: false,
        status: 'inicio',
      });
      if (created) {
        setTasks((prev) => [created, ...prev]);
      }
    }
  };

  // Tela de Carregamento
  if (isLoading && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" />
          <p className="text-sm font-medium text-slate-500">Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      {user ? (
        <>
          {/* Navbar Superior */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            onLogout={handleLogout}
          />

          {/* Conteúdo Dinâmico com base na aba ativa */}
          <main className="flex-1 pb-16">
            {activeTab === 'tasks' && (
              <KanbanBoard
                tasks={tasks}
                categories={categories}
                onMoveTask={handleMoveTask}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleEditTaskClick}
                onAddTaskClick={handleAddTaskClick}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView tasks={tasks} categories={categories} />
            )}

            {activeTab === 'calendar' && (
              <CalendarView
                tasks={tasks}
                categories={categories}
                onToggleComplete={handleToggleComplete}
                onAddTaskClick={handleAddTaskClick}
              />
            )}
          </main>

          {/* Modal para Criar/Editar */}
          <TaskModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleModalSubmit}
            categories={categories}
            taskToEdit={taskToEdit}
          />
        </>
      ) : (
        /* Tela de Autenticação Fictícia */
        <LoginView onLogin={handleLogin} />
      )}

      {/* Rodapé */}
      <footer className="w-full border-t border-slate-100 bg-white py-6 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Priorize Inc. Todos os direitos reservados.</p>
          <div className="flex justify-center gap-4">
            <span className="hover:text-slate-600 cursor-pointer transition-colors">Termos</span>
            <span className="hover:text-slate-600 cursor-pointer transition-colors">Privacidade</span>
            <span className="hover:text-slate-600 cursor-pointer transition-colors">Contato</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
