import type { Task } from '../types';

// Helper para exibir toast visual no frontend
function showNotificationToast(message: string, type: 'success' | 'warning' | 'info' = 'info') {
  if (typeof window === 'undefined') return;

  let container = document.getElementById('notification-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-toast-container';
    container.className = 'fixed top-20 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 shadow-xl transition-all duration-300 transform translate-x-12 opacity-0 font-semibold text-xs tracking-wide uppercase';
  
  if (type === 'success') {
    toast.className += ' bg-emerald-50 text-emerald-800 border-emerald-100';
  } else if (type === 'warning') {
    toast.className += ' bg-rose-50 text-rose-800 border-rose-100';
  } else {
    toast.className += ' bg-blue-50 text-blue-800 border-blue-100';
  }

  const emoji = type === 'success' ? '✉️ ✅' : type === 'warning' ? '✉️ ⏳' : '✉️ ℹ️';
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="text-sm font-normal">${emoji}</span>
      <span>${message}</span>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-x-12', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('translate-x-12', 'opacity-0');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
}

function triggerSimulatedEmail(subject: string, message: string, recipientEmail: string) {
  console.log(
    `%c[EMAIL SIMULADO - RESEND FALLBACK]
Para: ${recipientEmail}
Assunto: ${subject}
Mensagem: ${message}
---------------------------------------------
(Para ativar o envio real em produção, configure a variável RESEND_API_KEY no servidor de hospedagem. Localmente, o endpoint /api/send-email retornou 404 ou falhou na rede)`,
    'background: #eff6ff; color: #1e40af; padding: 10px; border-radius: 8px; border: 1px solid #bfdbfe;'
  );
  showNotificationToast(`E-mail Simulado: ${subject}`, 'info');
}

const formatPriority = (prio: string) => {
  switch (prio) {
    case 'high': return 'ALTA';
    case 'medium': return 'MÉDIA';
    case 'low': return 'BAIXA';
    default: return prio;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export const notificationService = {
  async sendEmail(subject: string, message: string, recipientEmail: string): Promise<boolean> {
    try {
      console.log(`[Resend Proxy] Tentando enviar e-mail para ${recipientEmail}: "${subject}"`);
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_email: recipientEmail,
          subject,
          message,
        }),
      });

      if (response.status === 404) {
        // Se a rota não existe localmente (comum no dev server do Vite)
        triggerSimulatedEmail(subject, message, recipientEmail);
        return true;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro do servidor com status ${response.status}`);
      }

      showNotificationToast(`E-mail enviado: ${subject}`, 'success');
      return true;
    } catch (err: any) {
      const isNetworkError = err instanceof TypeError || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');
      if (isNetworkError) {
        // Trata erro de conexão/resolução local também caindo no modo simulado
        triggerSimulatedEmail(subject, message, recipientEmail);
        return true;
      }

      console.error('[Resend Proxy] Falha ao enviar e-mail:', err);
      showNotificationToast('Erro ao enviar e-mail real', 'warning');
      return false;
    }
  },

  async notifyTaskCreated(task: Task, recipientEmail: string) {
    const subject = `Priorize: Nova Tarefa Criada - ${task.title}`;
    const message = `Uma nova tarefa foi criada no seu painel Priorize:
    
Título: ${task.title}
Descrição: ${task.description || 'Sem descrição'}
Prioridade: ${formatPriority(task.priority)}
Prazo de Conclusão: ${formatDate(task.dueDate)}

Mantenha o foco e bons trabalhos!`;

    return this.sendEmail(subject, message, recipientEmail);
  },

  async notifyTaskCompleted(task: Task, recipientEmail: string) {
    const subject = `Priorize: Tarefa Concluída! - ${task.title}`;
    const message = `Parabéns! Você concluiu uma tarefa importante:
    
Título: ${task.title}
Prazo planejado: ${formatDate(task.dueDate)}
Data de conclusão: ${formatDate(new Date().toISOString().split('T')[0])}

Parabéns pelo esforço e continue assim!`;

    return this.sendEmail(subject, message, recipientEmail);
  },

  async checkExpiringTasks(tasks: Task[], recipientEmail: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Calcula a data de amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const STORAGE_KEY = 'priorize_notified_expiring_tasks';
    const notifiedListRaw = localStorage.getItem(STORAGE_KEY);
    const notifiedIds: string[] = notifiedListRaw ? JSON.parse(notifiedListRaw) : [];
    const newNotifiedIds = [...notifiedIds];
    let triggeredAny = false;

    // Filtra tarefas incompletas que vencem hoje ou amanhã e que ainda não notificamos
    const expiringTasks = tasks.filter((t) => {
      if (t.status === 'encerrado' || t.completed) return false;
      if (notifiedIds.includes(t.id)) return false;
      return t.dueDate === todayStr || t.dueDate === tomorrowStr;
    });

    for (const task of expiringTasks) {
      const subject = `🚨 Urgente: Tarefa Prestes a Vencer - ${task.title}`;
      const message = `Atenção! Você tem uma tarefa importante prestes a expirar:

Título: ${task.title}
Descrição: ${task.description || 'Sem descrição'}
Prioridade: ${formatPriority(task.priority)}
Data Limite: ${formatDate(task.dueDate)} (${task.dueDate === todayStr ? 'HOJE' : 'AMANHÃ'})

Evite atrasos finalizando-a o quanto antes!`;

      const ok = await this.sendEmail(subject, message, recipientEmail);
      if (ok) {
        newNotifiedIds.push(task.id);
        triggeredAny = true;
      }
    }

    if (triggeredAny) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifiedIds));
    }
  }
};
