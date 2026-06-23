import React, { useEffect, useRef, useState } from 'react';
import { Network, Plus, Calendar, ChevronDown, ChevronRight, CheckSquare, ZoomIn, ZoomOut, RefreshCw, FileDown, StickyNote, Palette, X, Layers } from 'lucide-react';
import type { Task, Category, Priority } from '../types';

interface MindMapViewProps {
  categories: Category[];
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onAddTaskClick: () => void;
  onAddTaskWithCategory?: (categoryId: string) => void; // Callback para pré-selecionar categoria
}

interface PathData {
  id: string;
  d: string;
  colorClass: string;
  isHovered: boolean;
}

interface StickyNote {
  id: string;
  text: string;
  x: number;
  y: number;
  color: 'yellow' | 'green' | 'blue' | 'pink';
}

const priorityInfo = (priority: Priority) => {
  switch (priority) {
    case 'high':
      return { label: 'ALTA', bg: 'bg-rose-50 text-rose-700 border-rose-100' };
    case 'medium':
      return { label: 'MÉDIA', bg: 'bg-amber-50 text-amber-700 border-amber-100' };
    case 'low':
      return { label: 'BAIXA', bg: 'bg-slate-100 text-slate-500 border-slate-200' };
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Extrai uma cor hexadecimal/RGB para o path SVG com base no estilo de cor do Tailwind
const getPathColor = (colorClass: string) => {
  if (colorClass.includes('blue')) return '#3b82f6';
  if (colorClass.includes('emerald')) return '#10b981';
  if (colorClass.includes('amber')) return '#f59e0b';
  if (colorClass.includes('rose')) return '#ef4444';
  if (colorClass.includes('purple')) return '#a855f7';
  if (colorClass.includes('indigo')) return '#6366f1';
  if (colorClass.includes('pink')) return '#ec4899';
  if (colorClass.includes('orange')) return '#f97316';
  if (colorClass.includes('cyan')) return '#06b6d4';
  return '#94a3b8'; // Slate-400 fallback
};

// Helper para mapear classes de cor do nó central
const rootColorInfo = (color: string) => {
  switch (color) {
    case 'emerald':
      return 'bg-gradient-to-tr from-emerald-600 to-teal-400 border-emerald-400 shadow-emerald-500/20';
    case 'purple':
      return 'bg-gradient-to-tr from-purple-600 to-indigo-500 border-purple-400 shadow-purple-500/20';
    case 'pink':
      return 'bg-gradient-to-tr from-pink-600 to-rose-400 border-pink-400 shadow-pink-500/20';
    case 'dark':
      return 'bg-gradient-to-tr from-slate-800 to-slate-700 border-slate-600 shadow-slate-900/20';
    case 'blue':
    default:
      return 'bg-gradient-to-tr from-brand-600 to-sky-500 border-brand-400 shadow-brand-500/20';
  }
};

// Helper para cor da bolinha no nó central
const rootColorDotClass = (color: string) => {
  switch (color) {
    case 'emerald':
      return 'bg-emerald-500';
    case 'purple':
      return 'bg-purple-500';
    case 'pink':
      return 'bg-pink-500';
    case 'dark':
      return 'bg-slate-700';
    case 'blue':
    default:
      return 'bg-brand-500';
  }
};

// Helper para mapear classes de tamanho de fonte do nó central
const rootFontSizeClass = (size: string) => {
  switch (size) {
    case 'text-sm':
      return 'text-sm';
    case 'text-base':
      return 'text-base';
    case 'text-xl':
      return 'text-xl sm:text-2xl';
    case 'text-lg':
    default:
      return 'text-base sm:text-lg';
  }
};

export const MindMapView: React.FC<MindMapViewProps> = ({
  categories,
  tasks,
  onEditTask,
  onAddTaskClick,
  onAddTaskWithCategory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<PathData[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [spaceActive, setSpaceActive] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Update body cursor when space is active for global effect
  useEffect(() => {
    if (spaceActive) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = '';
    }
  }, [spaceActive]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  const [mindMapTitle, setMindMapTitle] = useState(() => {
    return localStorage.getItem('priorize_mindmap_title') || 'Minhas Tarefas';
  });

  const [rootColor, setRootColor] = useState<string>(() => {
    return localStorage.getItem('priorize_mindmap_root_color') || 'blue';
  });
  const [rootFontSize, setRootFontSize] = useState<string>(() => {
    return localStorage.getItem('priorize_mindmap_root_font_size') || 'text-base';
  });
  const [showRootStyles, setShowRootStyles] = useState<boolean>(false);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>(() => {
    const saved = localStorage.getItem('priorize_mindmap_stickies');
    return saved ? JSON.parse(saved) : [];
  });
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const dragNoteOffset = useRef({ x: 0, y: 0 });
  const [colorPickerNoteId, setColorPickerNoteId] = useState<string | null>(null);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleAddStickyNote = () => {
    const newNote: StickyNote = {
      id: `sticky-${Date.now()}`,
      text: '',
      x: 480,
      y: 120,
      color: 'yellow',
    };
    const updated = [...stickyNotes, newNote];
    setStickyNotes(updated);
    localStorage.setItem('priorize_mindmap_stickies', JSON.stringify(updated));
  };

  const handleUpdateNoteText = (id: string, text: string) => {
    const updated = stickyNotes.map((n) => (n.id === id ? { ...n, text } : n));
    setStickyNotes(updated);
    localStorage.setItem('priorize_mindmap_stickies', JSON.stringify(updated));
  };

  const handleUpdateNoteColor = (id: string, color: 'yellow' | 'green' | 'blue' | 'pink') => {
    const updated = stickyNotes.map((n) => (n.id === id ? { ...n, color } : n));
    setStickyNotes(updated);
    localStorage.setItem('priorize_mindmap_stickies', JSON.stringify(updated));
  };

  const handleDeleteNote = (id: string) => {
    const updated = stickyNotes.filter((n) => n.id !== id);
    setStickyNotes(updated);
    localStorage.setItem('priorize_mindmap_stickies', JSON.stringify(updated));
  };

  const handleNoteMouseDown = (e: React.MouseEvent, note: StickyNote) => {
    e.stopPropagation();
    setDraggingNoteId(note.id);
    dragNoteOffset.current = {
      x: e.clientX / zoom - note.x,
      y: e.clientY / zoom - note.y,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const closestNode = target.closest('[id^="node-"]');
    if (closestNode || target.closest('button') || target.closest('select') || target.closest('input') || target.closest('textarea')) {
      return;
    }
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNoteId) {
      const updatedNotes = stickyNotes.map((note) => {
        if (note.id === draggingNoteId) {
          return {
            ...note,
            x: e.clientX / zoom - dragNoteOffset.current.x,
            y: e.clientY / zoom - dragNoteOffset.current.y,
          };
        }
        return note;
      });
      setStickyNotes(updatedNotes);
      return;
    }

    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    if (draggingNoteId) {
      localStorage.setItem('priorize_mindmap_stickies', JSON.stringify(stickyNotes));
      setDraggingNoteId(null);
    }
    setIsDragging(false);
  };

  // Divide as categorias de forma equilibrada (Esquerda e Direita)
  const leftCategories = categories.slice(0, Math.ceil(categories.length / 2));
  const rightCategories = categories.slice(Math.ceil(categories.length / 2));

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleQuickAddTask = (e: React.MouseEvent, catId: string) => {
    e.stopPropagation();
    if (onAddTaskWithCategory) {
      onAddTaskWithCategory(catId);
    } else {
      onAddTaskClick();
    }
  };

  // Recalcular caminhos das curvas sempre que o layout renderiza
  const recalculatePaths = () => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newPaths: PathData[] = [];

    // Helper para obter coordenadas de borda de um nó, compensando a escala de zoom
    const getCoord = (id: string, side: 'left' | 'right' | 'center') => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      
      let x = 0;
      if (side === 'left') {
        x = (r.left - containerRect.left) / zoom;
      } else if (side === 'right') {
        x = (r.right - containerRect.left) / zoom;
      } else {
        x = ((r.left - containerRect.left) + r.width / 2) / zoom;
      }
      const y = ((r.top - containerRect.top) + r.height / 2) / zoom;
      return { x, y };
    };

    const rootCoord = getCoord('node-root', 'center');
    const rootLeft = getCoord('node-root', 'left');
    const rootRight = getCoord('node-root', 'right');
    if (!rootCoord || !rootLeft || !rootRight) return;

    // Função para gerar curva bezier cúbica (S-curve)
    const makeBezierPath = (startX: number, startY: number, endX: number, endY: number) => {
      const cpX = (startX + endX) / 2;
      return `M ${startX} ${startY} C ${cpX} ${startY}, ${cpX} ${endY}, ${endX} ${endY}`;
    };

    const processCategory = (cat: Category, side: 'left' | 'right') => {
      const catIdStr = `node-cat-${cat.id}`;
      const catCoord = getCoord(catIdStr, side === 'left' ? 'right' : 'left');
      
      if (catCoord) {
        // Conexão do nó central até a categoria
        const startX = side === 'left' ? rootLeft.x : rootRight.x;
        const pathString = makeBezierPath(startX, rootCoord.y, catCoord.x, catCoord.y);
        
        newPaths.push({
          id: `root-to-${cat.id}`,
          d: pathString,
          colorClass: cat.color,
          isHovered: hoveredCategory === cat.id,
        });

        // Conexões da categoria até suas respectivas tarefas (se não estiver colapsado)
        if (!collapsedCategories[cat.id]) {
          const catTasks = tasks.filter((t) => t.categoryId === cat.id);
          const catExitCoord = getCoord(catIdStr, side === 'left' ? 'left' : 'right');
          
          if (catExitCoord) {
            catTasks.forEach((task) => {
              const taskNodeId = `node-task-${task.id}`;
              const taskCoord = getCoord(taskNodeId, side === 'left' ? 'right' : 'left');
              
              if (taskCoord) {
                const taskPathStr = makeBezierPath(catExitCoord.x, catExitCoord.y, taskCoord.x, taskCoord.y);
                newPaths.push({
                  id: `cat-${cat.id}-to-task-${task.id}`,
                  d: taskPathStr,
                  colorClass: cat.color,
                  isHovered: hoveredCategory === cat.id || hoveredTask === task.id,
                });
              }
            });
          }
        }
      }
    };

    // Processar todas as categorias da esquerda e direita
    leftCategories.forEach((cat) => processCategory(cat, 'left'));
    rightCategories.forEach((cat) => processCategory(cat, 'right'));

    setPaths(newPaths);
  };

  // Recalcula ao mudar de tamanho de janela, dados das tarefas ou estados de retração
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      recalculatePaths();
    };

    window.addEventListener('resize', handleResize);
    
    // Pequeno delay para garantir que a renderização do layout terminou antes de medir o DOM
    const timer = setTimeout(() => {
      recalculatePaths();
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [tasks, categories, collapsedCategories, hoveredCategory, hoveredTask, windowWidth, zoom]);

  // Recalcula repetidamente em frames de animação iniciais para suavizar o carregamento
  useEffect(() => {
    let frameId: number;
    let count = 0;
    
    const tick = () => {
      recalculatePaths();
      count++;
      if (count < 15) {
        frameId = requestAnimationFrame(tick);
      }
    };
    
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [tasks, categories]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Network className="h-6 w-6 text-brand-500" />
            Mapa Mental de Tarefas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Veja suas tarefas agrupadas por categorias de forma visual e interativa.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto no-print">
          <button
            type="button"
            onClick={handleAddStickyNote}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all duration-200 active:scale-98 cursor-pointer"
          >
            <StickyNote className="h-4 w-4 text-slate-500" />
            Nova Nota
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all duration-200 active:scale-98 cursor-pointer"
          >
            <FileDown className="h-4 w-4 text-slate-500" />
            Exportar PDF
          </button>
          <button
            type="button"
            onClick={onAddTaskClick}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 active:bg-brand-700 shadow-md shadow-brand-500/10 hover:shadow-lg hover:shadow-brand-500/20 transition-all duration-200 active:scale-98 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </button>
        </div>
      </div>

      {/* Workspace do Mapa Mental (Aesthetics: Ampliado e Centralizado) */}
      <div 
        id="mindmap-print-area"
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onKeyDown={(e) => {
          if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            setSpaceActive(true);
          }
        }}
        onKeyUp={(e) => {
          if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            setSpaceActive(false);
          }
        }}
        style={{ cursor: spaceActive ? 'pointer' : 'grab' }}
        className={`w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white p-6 min-h-[580px] flex flex-col justify-center shadow-sm relative select-none mindmap-grab ${
          isDragging ? 'mindmap-grabbing' : ''
        }`}
      >
        
        {/* Painel de Controle de Zoom Flutuante (Aesthetics: Glassmorphism) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-xl border border-slate-100 bg-white/85 backdrop-blur-md p-1.5 shadow-lg select-none no-print">
          <button
            type="button"
            onClick={handleAddStickyNote}
            title="Adicionar Nota"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-all cursor-pointer border-r border-slate-100 pr-2"
          >
            <StickyNote className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowRootStyles(!showRootStyles)}
            title="Estilizar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <Palette className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={handleZoomOut}
            title="Diminuir Zoom"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={handleZoomReset}
            title="Resetar para 100%"
            className="text-xs font-bold text-slate-600 hover:text-brand-500 px-2 min-w-[48px] text-center transition-colors cursor-pointer"
          >
            {Math.round(zoom * 100)}%
          </button>
          
          <button
            type="button"
            onClick={handleZoomIn}
            title="Aumentar Zoom"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleZoomReset}
            title="Resetar Visualização"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-95 transition-all border-l border-slate-100 pl-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="w-full">
          <div 
            ref={containerRef} 
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="relative flex items-center justify-between gap-12 py-16 mx-auto min-w-[980px] max-w-[1200px]"
          >
          {/* Overlay SVG para desenhar os caminhos conectores */}
          <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
            {paths.map((p) => {
              const baseColor = getPathColor(p.colorClass);
              const isRootPath = p.id.startsWith('root-to-');
              const strokeWidth = p.isHovered 
                ? (isRootPath ? 5 : 3.5) 
                : (isRootPath ? 3.5 : 1.8);
              const strokeOpacity = p.isHovered 
                ? 0.95 
                : (isRootPath ? 0.75 : 0.5);
              return (
                <path
                  key={p.id}
                  d={p.d}
                  fill="none"
                  stroke={baseColor}
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                  className="transition-all duration-300 ease-out"
                />
              );
            })}
          </svg>

          {/* COLUNA ESQUERDA: TAREFAS */}
          <div className="flex flex-col gap-8 w-1/4 z-10">
            {leftCategories.map((cat) => {
              const catTasks = tasks.filter((t) => t.categoryId === cat.id);
              if (collapsedCategories[cat.id]) return null;
              return (
                <div key={`left-tasks-${cat.id}`} className="flex flex-col gap-3.5 my-2">
                  {catTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center text-[10px] text-slate-400">
                      Sem tarefas vinculadas
                    </div>
                  ) : (
                    catTasks.map((task) => (
                      <div
                        id={`node-task-${task.id}`}
                        key={task.id}
                        onClick={() => onEditTask(task)}
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        className={`group cursor-pointer rounded-lg border border-slate-100 bg-white p-3 shadow-sm hover:shadow hover:border-slate-350 transition-all duration-200 hover:-translate-y-0.5 select-none ${
                          task.status === 'encerrado' ? 'opacity-60' : ''
                        }`}
                      >
                        <h4 className={`text-xs font-semibold text-slate-700 leading-snug break-words group-hover:text-brand-500 transition-colors ${
                          task.status === 'encerrado' ? 'line-through text-slate-400' : ''
                        }`}>
                          {task.title}
                        </h4>
                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-50 pt-1.5 text-[9px] text-slate-400 font-medium">
                          <span className={`rounded px-1 py-0.2 border text-[8px] font-bold ${priorityInfo(task.priority).bg}`}>
                            {priorityInfo(task.priority).label}
                          </span>
                          <span className="flex items-center gap-0.8">
                            <Calendar className="h-2.5 w-2.5" />
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>

          {/* COLUNA ESQUERDA: CATEGORIAS */}
          <div className="flex flex-col gap-12 w-1/5 items-end z-10">
            {leftCategories.map((cat) => {
              const count = tasks.filter((t) => t.categoryId === cat.id).length;
              const isCollapsed = collapsedCategories[cat.id];
              return (
                <div
                  id={`node-cat-${cat.id}`}
                  key={cat.id}
                  onClick={() => toggleCategoryCollapse(cat.id)}
                  onMouseEnter={() => setHoveredCategory(cat.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`group flex items-center justify-between gap-3 cursor-pointer rounded-full border px-4 py-1.8 shadow-sm hover:shadow-md hover:-translate-x-0.5 transition-all duration-200 select-none ${cat.color}`}
                >
                  <div className="flex items-center gap-1.5">
                    {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    <span className="text-[12px] font-bold tracking-tight">{cat.name}</span>
                    <span className="rounded-full bg-white/70 px-1.5 py-0.1 text-[9px] font-extrabold">
                      {count}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleQuickAddTask(e, cat.id)}
                    title="Adicionar tarefa nesta categoria"
                    className="flex h-5 w-5 items-center justify-center rounded bg-white/80 hover:bg-white text-slate-700 shadow-sm transition-all hover:scale-105"
                  >
                    <Plus className="h-3 w-3 stroke-[2.5]" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* NÓ CENTRAL (RAIZ) */}
          <div className="flex flex-col items-center justify-center w-1/5 z-10 text-center relative">
            <div
              id="node-root"
              className={`flex flex-col items-center justify-center rounded-3xl px-8 py-5.5 text-white shadow-xl border select-none relative ${rootColorInfo(rootColor)}`}
            >
              <CheckSquare className="h-7 w-7 text-white/90 stroke-[2.5] mb-2" />
              
              {(() => {
                const lines = mindMapTitle.split('\n');
                const longestLine = Math.max(...lines.map((l) => l.length));
                return (
                  <textarea
                    value={mindMapTitle}
                    onChange={(e) => {
                      setMindMapTitle(e.target.value);
                      localStorage.setItem('priorize_mindmap_title', e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                    rows={lines.length || 1}
                    style={{ 
                      width: '100%',
                      maxWidth: '280px',
                      resize: 'none'
                    }}
                    className={`bg-transparent text-center font-bold text-white focus:outline-none focus:ring-0 focus-visible:outline-none rounded-lg px-2 py-0.5 max-w-[280px] w-full border-b border-dashed border-white/30 hover:border-b-white/60 focus:border-b-white/80 transition-all overflow-hidden block ${rootFontSizeClass(rootFontSize)}`}
                    placeholder="Minhas Tarefas"
                  />
                );
              })()}
              <p className="text-[10px] text-sky-100 font-semibold mt-1">
                {tasks.filter((t) => t.status !== 'encerrado').length} pendentes / {tasks.length} totais
              </p>
              
              

              {showRootStyles && (
                <div className="absolute top-[102%] z-30 flex flex-col gap-2.5 rounded-xl border border-slate-100 bg-white p-3.5 shadow-lg select-none no-print w-48 text-slate-700 font-sans">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Cor do Nó</div>
                  <div className="flex gap-1.5 justify-start">
                    {(['blue', 'emerald', 'purple', 'pink', 'dark'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setRootColor(c);
                          localStorage.setItem('priorize_mindmap_root_color', c);
                        }}
                        className={`w-5 h-5 rounded-full border border-slate-200 hover:scale-110 transition-transform cursor-pointer ${
                          c === 'blue' ? 'bg-brand-500' :
                          c === 'emerald' ? 'bg-emerald-500' :
                          c === 'purple' ? 'bg-purple-500' :
                          c === 'pink' ? 'bg-pink-500' : 'bg-slate-700'
                        } ${rootColor === c ? 'ring-2 ring-offset-1 ring-brand-500' : ''}`}
                      />
                    ))}
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left mt-1">Tamanho da Fonte</div>
                  <div className="grid grid-cols-4 gap-1">
                    {(['text-sm', 'text-base', 'text-lg', 'text-xl'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setRootFontSize(sz);
                          localStorage.setItem('priorize_mindmap_root_font_size', sz);
                        }}
                        className={`text-[9px] font-bold py-1 px-1.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors uppercase cursor-pointer ${
                          rootFontSize === sz ? 'bg-brand-50 border-brand-300 text-brand-700 font-extrabold' : 'text-slate-500'
                        }`}
                      >
                        {sz === 'text-sm' ? 'P' : sz === 'text-base' ? 'M' : sz === 'text-lg' ? 'G' : 'GG'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: CATEGORIAS */}
          <div className="flex flex-col gap-12 w-1/5 items-start z-10">
            {rightCategories.map((cat) => {
              const count = tasks.filter((t) => t.categoryId === cat.id).length;
              const isCollapsed = collapsedCategories[cat.id];
              return (
                <div
                  id={`node-cat-${cat.id}`}
                  key={cat.id}
                  onClick={() => toggleCategoryCollapse(cat.id)}
                  onMouseEnter={() => setHoveredCategory(cat.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`group flex items-center justify-between gap-3 cursor-pointer rounded-full border px-4 py-1.8 shadow-sm hover:shadow-md hover:translate-x-0.5 transition-all duration-200 select-none ${cat.color}`}
                >
                  <button
                    type="button"
                    onClick={(e) => handleQuickAddTask(e, cat.id)}
                    title="Adicionar tarefa nesta categoria"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-white/85 hover:bg-white text-slate-700 shadow-sm transition-all hover:scale-105"
                  >
                    <Plus className="h-3 w-3 stroke-[2.5]" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold tracking-tight">{cat.name}</span>
                    <span className="rounded-full bg-white/70 px-1.5 py-0.1 text-[9px] font-extrabold">
                      {count}
                    </span>
                    {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* COLUNA DIREITA: TAREFAS */}
          <div className="flex flex-col gap-8 w-1/4 z-10">
            {rightCategories.map((cat) => {
              const catTasks = tasks.filter((t) => t.categoryId === cat.id);
              if (collapsedCategories[cat.id]) return null;
              return (
                <div key={`right-tasks-${cat.id}`} className="flex flex-col gap-3.5 my-2">
                  {catTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center text-[10px] text-slate-400">
                      Sem tarefas vinculadas
                    </div>
                  ) : (
                    catTasks.map((task) => (
                      <div
                        id={`node-task-${task.id}`}
                        key={task.id}
                        onClick={() => onEditTask(task)}
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        className={`group cursor-pointer rounded-lg border border-slate-100 bg-white p-3 shadow-sm hover:shadow hover:border-slate-350 transition-all duration-200 hover:-translate-y-0.5 select-none ${
                          task.status === 'encerrado' ? 'opacity-60' : ''
                        }`}
                      >
                        <h4 className={`text-xs font-semibold text-slate-700 leading-snug break-words group-hover:text-brand-500 transition-colors ${
                          task.status === 'encerrado' ? 'line-through text-slate-400' : ''
                        }`}>
                          {task.title}
                        </h4>
                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-50 pt-1.5 text-[9px] text-slate-400 font-medium">
                          <span className="flex items-center gap-0.8">
                            <Calendar className="h-2.5 w-2.5" />
                            {formatDate(task.dueDate)}
                          </span>
                          <span className={`rounded px-1 py-0.2 border text-[8px] font-bold ${priorityInfo(task.priority).bg}`}>
                            {priorityInfo(task.priority).label}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>

          {/* NOTAS ADESIVAS (STICKY NOTES) */}
          {stickyNotes.map((note) => (
            <div
              key={note.id}
              style={{
                position: 'absolute',
                transform: `translate(${note.x}px, ${note.y}px)`,
                width: '180px',
                zIndex: draggingNoteId === note.id ? 40 : 30
              }}
              className={`sticky-note-paper sticky-note-${note.color} rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-200/80 transition-all duration-200`}
            >
              {/* Cabeçalho da Nota Adesiva: Área de Arrasto */}
              <div
                onMouseDown={(e) => handleNoteMouseDown(e, note)}
                className="flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-black/5 pb-1.5 mb-1.5 no-print"
              >
                {/* Botão de Excluir */}
                <button
                  type="button"
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-black/40 hover:text-black/80 transition-colors rounded p-0.5 hover:bg-black/5 cursor-pointer"
                  title="Excluir nota"
                >
                  <X className="h-3 w-3" />
                </button>
                {/* Botão de Cor */}
                <button
                  type="button"
                  onClick={() => setColorPickerNoteId(note.id)}
                  className="text-black/40 hover:text-black/80 transition-colors rounded p-0.5 hover:bg-black/5 cursor-pointer ml-1"
                  title="Mudar cor da nota"
                >
                  <Palette className="h-3 w-3" />
                </button>
                {colorPickerNoteId === note.id && (
                  <div className="absolute top-full left-0 mt-1 flex gap-1 bg-white p-1 rounded shadow-lg z-50">
                    {(['yellow', 'green', 'blue', 'pink'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { handleUpdateNoteColor(note.id, c); setColorPickerNoteId(null); }}
                        className={`w-5 h-5 rounded-full border border-slate-200 ${c === 'yellow' ? 'bg-yellow-200' : c === 'green' ? 'bg-green-200' : c === 'blue' ? 'bg-blue-200' : 'bg-pink-200'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Área de Texto da Nota Adesiva */}
              <textarea
                value={note.text}
                onChange={(e) => handleUpdateNoteText(note.id, e.target.value)}
                placeholder="Escreva uma nota..."
                rows={4}
                className="bg-transparent border-none outline-none resize-none w-full text-xs font-semibold focus:ring-0 placeholder-black/35 leading-normal text-slate-800"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
};
