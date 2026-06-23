import React, { useEffect, useRef, useState } from 'react';
import { Network, Plus, Calendar, ChevronDown, ChevronRight, CheckSquare, ZoomIn, ZoomOut, RefreshCw, FileDown, StickyNote, Palette, X, Layers, Bold, Italic, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
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
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'brand';
  fontSize?: 'text-xs' | 'text-sm' | 'text-base' | 'text-lg';
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface MindMapHistoryState {
  mindMapTitle: string;
  rootColor: string;
  rootFontSize: string;
  stickyNotes: StickyNote[];
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [mindMapTitle, setMindMapTitle] = useState(() => {
    return localStorage.getItem('priorize_mindmap_title') || 'Minhas Tarefas';
  });

  const [rootColor, setRootColor] = useState<string>(() => {
    return localStorage.getItem('priorize_mindmap_root_color') || 'blue';
  });
  const [rootFontSize, setRootFontSize] = useState<string>(() => {
    return localStorage.getItem('priorize_mindmap_root_font_size') || 'text-base';
  });

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [mindMapTitle, rootFontSize]);

  const [showRootStyles, setShowRootStyles] = useState<boolean>(false);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>(() => {
    const saved = localStorage.getItem('priorize_mindmap_stickies');
    return saved ? JSON.parse(saved) : [];
  });

  const [undoStack, setUndoStack] = useState<MindMapHistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<MindMapHistoryState[]>([]);

  const saveToHistory = (
    currentTitle = mindMapTitle,
    currentColor = rootColor,
    currentFontSize = rootFontSize,
    currentNotes = stickyNotes
  ) => {
    const snapshot: MindMapHistoryState = {
      mindMapTitle: currentTitle,
      rootColor: currentColor,
      rootFontSize: currentFontSize,
      stickyNotes: JSON.parse(JSON.stringify(currentNotes)),
    };
    setUndoStack((prev) => [...prev, snapshot]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    const currentSnapshot: MindMapHistoryState = {
      mindMapTitle,
      rootColor,
      rootFontSize,
      stickyNotes: JSON.parse(JSON.stringify(stickyNotes)),
    };
    setRedoStack((prev) => [...prev, currentSnapshot]);

    const previousSnapshot = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    setMindMapTitle(previousSnapshot.mindMapTitle);
    setRootColor(previousSnapshot.rootColor);
    setRootFontSize(previousSnapshot.rootFontSize);
    setStickyNotes(previousSnapshot.stickyNotes);

    localStorage.setItem('priorize_mindmap_title', previousSnapshot.mindMapTitle);
    localStorage.setItem('priorize_mindmap_root_color', previousSnapshot.rootColor);
    localStorage.setItem('priorize_mindmap_root_font_size', previousSnapshot.rootFontSize);
    localStorage.setItem('priorize_mindmap_stickies', JSON.stringify(previousSnapshot.stickyNotes));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const currentSnapshot: MindMapHistoryState = {
      mindMapTitle,
      rootColor,
      rootFontSize,
      stickyNotes: JSON.parse(JSON.stringify(stickyNotes)),
    };
    setUndoStack((prev) => [...prev, currentSnapshot]);

    const nextSnapshot = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    setMindMapTitle(nextSnapshot.mindMapTitle);
    setRootColor(nextSnapshot.rootColor);
    setRootFontSize(nextSnapshot.rootFontSize);
    setStickyNotes(nextSnapshot.stickyNotes);

    localStorage.setItem('priorize_mindmap_title', nextSnapshot.mindMapTitle);
    localStorage.setItem('priorize_mindmap_root_color', nextSnapshot.rootColor);
    localStorage.setItem('priorize_mindmap_root_font_size', nextSnapshot.rootFontSize);
    localStorage.setItem('priorize_mindmap_stickies', JSON.stringify(nextSnapshot.stickyNotes));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInsideMindmap = activeEl && (
        activeEl.closest('#mindmap-print-area') !== null ||
        activeEl === document.body
      );

      if (!isInsideMindmap) return;

      const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey;
      const isRedo = 
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z');

      if (isUndo) {
        e.preventDefault();
        handleUndo();
      } else if (isRedo) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undoStack, redoStack, mindMapTitle, rootColor, rootFontSize, stickyNotes]);

  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const dragNoteOffset = useRef({ x: 0, y: 0 });
  const [colorPickerNoteId, setColorPickerNoteId] = useState<string | null>(null);
  // Estado para panning (arrastar a visualização)
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

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
    saveToHistory();
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

  const handleUpdateNoteColor = (id: string, color: 'yellow' | 'green' | 'blue' | 'pink' | 'brand') => {
    saveToHistory();
    const updated = stickyNotes.map((n) => (n.id === id ? { ...n, color } : n));
    setStickyNotes(updated);
    localStorage.setItem('priorize_mindmap_stickies', JSON.stringify(updated));
  };

  const handleUpdateNoteStyle = (id: string, styles: Partial<Omit<StickyNote, 'id' | 'text' | 'x' | 'y'>>) => {
    saveToHistory();
    const updated = stickyNotes.map((n) => (n.id === id ? { ...n, ...styles } : n));
    setStickyNotes(updated);
    localStorage.setItem('priorize_mindmap_stickies', JSON.stringify(updated));
  };

  const handleDeleteNote = (id: string) => {
    saveToHistory();
    const updated = stickyNotes.filter((n) => n.id !== id);
    setStickyNotes(updated);
    localStorage.setItem('priorize_mindmap_stickies', JSON.stringify(updated));
  };

  const handleUpdateNotePosition = (id: string, x: number, y: number) => {
    const updated = stickyNotes.map((n) => (n.id === id ? { ...n, x, y } : n));
    setStickyNotes(updated);
  };

  const handleNoteMouseDown = (e: React.MouseEvent, note: StickyNote) => {
    e.stopPropagation();
    saveToHistory();
    setDraggingNoteId(note.id);
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    dragNoteOffset.current = {
      x: (e.clientX - rect.left) / zoom - note.x,
      y: (e.clientY - rect.top) / zoom - note.y,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const closestNode = target.closest('[id^="node-"]');
    if (closestNode || target.closest('button') || target.closest('select') || target.closest('input') || target.closest('textarea')) {
      return;
    }
    
    // Inicia panning se for na área vazia (fundo)
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Panning (arrasto do canvas completo estilo Figma)
    if (isPanning) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      panStart.current = { x: e.clientX, y: e.clientY };
    }
    // Arrasto de notas adesivas
    if (draggingNoteId) {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const newX = (e.clientX - rect.left) / zoom - dragNoteOffset.current.x;
        const newY = (e.clientY - rect.top) / zoom - dragNoteOffset.current.y;
        handleUpdateNotePosition(draggingNoteId, newX, newY);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
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
          const target = e.target as HTMLElement;
          if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable) {
            return;
          }
          if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            setSpaceActive(true);
          }
        }}
        onKeyUp={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable) {
            return;
          }
          if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            setSpaceActive(false);
          }
        }}
        style={{ cursor: spaceActive ? 'pointer' : isPanning ? 'grabbing' : 'grab' }}
        className={`w-full overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 min-h-[580px] flex flex-col justify-center shadow-sm relative select-none mindmap-grab ${
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
              transition: (isDragging || isPanning || !!draggingNoteId) ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
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
              className={`flex flex-col items-center justify-center rounded-3xl px-6 py-3.5 text-white shadow-xl border select-none relative ${rootColorInfo(rootColor)}`}
            >
              <CheckSquare className="h-7 w-7 text-white/90 stroke-[2.5] mb-2" />
              
              {(() => {
                const lines = mindMapTitle.split('\n');
                const longestLine = Math.max(...lines.map((l) => l.length));
                
                // Lógica para medir largura proporcional ao tamanho da fonte
                const getCharWidth = (size: string) => {
                  switch (size) {
                    case 'text-sm': return 7.5;
                    case 'text-xl': return 13;
                    case 'text-lg': return 11;
                    case 'text-base':
                    default:
                      return 9.5;
                  }
                };
                const charWidth = getCharWidth(rootFontSize);
                const calculatedWidth = Math.min(Math.max(longestLine * charWidth + 20, 100), 240);

                return (
                  <textarea
                    ref={textareaRef}
                    value={mindMapTitle}
                    onChange={(e) => {
                      setMindMapTitle(e.target.value);
                      localStorage.setItem('priorize_mindmap_title', e.target.value);
                    }}
                    onFocus={() => {
                      saveToHistory();
                      setShowRootStyles(true);
                    }}
                    onBlur={() => {
                      // Pequeno delay para permitir o clique nas opções do menu de estilo
                      setTimeout(() => setShowRootStyles(false), 200);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                    rows={1}
                    style={{ 
                      width: `${calculatedWidth}px`,
                      resize: 'none',
                      overflow: 'hidden'
                    }}
                    className={`bg-transparent text-center font-bold text-white focus:outline-none focus:ring-0 focus-visible:outline-none rounded-lg px-2 py-0.5 border-none transition-all overflow-hidden block ${rootFontSizeClass(rootFontSize)}`}
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
          {/* NOTAS ADESIVAS (STICKY NOTES) */}
          {stickyNotes.map((note) => (
            <div
              key={note.id}
              onMouseDown={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON' && !target.closest('button')) {
                  handleNoteMouseDown(e, note);
                }
              }}
              style={{
                position: 'absolute',
                transform: `translate(${note.x}px, ${note.y}px)`,
                width: '180px',
                zIndex: draggingNoteId === note.id ? 40 : 30,
                cursor: draggingNoteId === note.id ? 'grabbing' : 'grab'
              }}
              className={`sticky-note-paper sticky-note-${note.color} rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-200/80 transition-all duration-200`}
            >
              {/* Cabeçalho da Nota Adesiva */}
              <div
                className="flex items-center justify-between border-b border-black/5 pb-1.5 mb-1.5 no-print"
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
                {/* Botão de Formatação */}
                <button
                  type="button"
                  onClick={() => setColorPickerNoteId(colorPickerNoteId === note.id ? null : note.id)}
                  className={`text-black/40 hover:text-black/80 transition-colors rounded p-0.5 hover:bg-black/5 cursor-pointer ml-1 ${
                    colorPickerNoteId === note.id ? 'bg-black/5 text-black/85' : ''
                  }`}
                  title="Formatar texto e cores"
                >
                  <Palette className="h-3 w-3" />
                </button>
                {colorPickerNoteId === note.id && (
                  <div
                    className="absolute left-0 mt-2 flex flex-col gap-2.5 bg-white p-3 rounded-xl shadow-xl border border-slate-100 z-50 text-slate-700 w-52 select-none"
                    style={
                      note.y > (window.innerHeight - 300)
                        ? { bottom: '100%', top: 'auto', marginBottom: '8px' }
                        : { top: '100%', marginTop: '8px' }
                    }
                  >
                    {/* Tamanho da Fonte */}
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-left">Tamanho da Fonte</div>
                    <div className="grid grid-cols-4 gap-1">
                      {(['text-xs', 'text-sm', 'text-base', 'text-lg'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            handleUpdateNoteStyle(note.id, { fontSize: sz });
                          }}
                          className={`text-[9px] font-bold py-1 px-1.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors uppercase cursor-pointer ${
                            (note.fontSize || 'text-xs') === sz ? 'bg-brand-50 border-brand-300 text-brand-750 font-extrabold' : 'text-slate-500'
                          }`}
                        >
                          {sz === 'text-xs' ? 'P' : sz === 'text-sm' ? 'M' : sz === 'text-base' ? 'G' : 'GG'}
                        </button>
                      ))}
                    </div>

                    {/* Estilo de Texto */}
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-left">Estilo</div>
                    <div className="flex gap-1.5 items-center">
                      <button
                        type="button"
                        onClick={() => handleUpdateNoteStyle(note.id, { bold: !note.bold })}
                        className={`w-7 h-7 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-all cursor-pointer font-bold ${
                          note.bold ? 'bg-brand-50 border-brand-300 text-brand-750 font-extrabold' : 'text-slate-550'
                        }`}
                        title="Negrito"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateNoteStyle(note.id, { italic: !note.italic })}
                        className={`w-7 h-7 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-all cursor-pointer italic ${
                          note.italic ? 'bg-brand-50 border-brand-300 text-brand-750 font-extrabold' : 'text-slate-550'
                        }`}
                        title="Itálico"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-px h-6 bg-slate-100 mx-0.5" />

                      {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => handleUpdateNoteStyle(note.id, { align })}
                          className={`w-7 h-7 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-all cursor-pointer ${
                            (note.align || 'left') === align ? 'bg-brand-50 border-brand-300 text-brand-750 font-extrabold' : 'text-slate-550'
                          }`}
                          title={`Alinhar à ${align === 'left' ? 'esquerda' : align === 'center' ? 'centro' : 'direita'}`}
                        >
                          {align === 'left' ? <AlignLeft className="w-3.5 h-3.5" /> :
                           align === 'center' ? <AlignCenter className="w-3.5 h-3.5" /> :
                           <AlignRight className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>

                    {/* Cores da Nota */}
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-left">Cores do Tema</div>
                    <div className="flex gap-1.5 justify-start">
                      {(['yellow', 'green', 'blue', 'pink', 'brand'] as const).map((c) => {
                        const colorInfo = {
                          yellow: { bg: '#fefca3', border: '#eab308' },
                          green: { bg: '#e6fcf0', border: '#22c55e' },
                          blue: { bg: '#ecf3fe', border: '#3b82f6' },
                          pink: { bg: '#fdf2f8', border: '#ec4899' },
                          brand: { bg: '#e0f2fe', border: '#0ea5e9' }
                        }[c];
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => { handleUpdateNoteColor(note.id, c); }}
                            style={{ backgroundColor: colorInfo.bg, borderColor: colorInfo.border }}
                            className={`w-5 h-5 rounded-full border hover:scale-110 transition-transform cursor-pointer ${
                              note.color === c ? 'ring-2 ring-offset-1 ring-brand-500' : ''
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Área de Texto da Nota Adesiva */}
              <textarea
                value={note.text}
                onChange={(e) => handleUpdateNoteText(note.id, e.target.value)}
                onFocus={() => setColorPickerNoteId(note.id)}
                onBlur={() => {
                  // Pequeno delay para permitir o clique nas opções do menu de estilo da nota
                  setTimeout(() => {
                    setColorPickerNoteId((current) => (current === note.id ? null : current));
                  }, 200);
                }}
                placeholder="Escreva uma nota..."
                rows={4}
                style={{
                  textAlign: note.align || 'left',
                  fontWeight: note.bold ? 'bold' : 'normal',
                  fontStyle: note.italic ? 'italic' : 'normal',
                }}
                className={`bg-transparent border-none outline-none resize-none w-full font-semibold focus:ring-0 placeholder-black/35 leading-normal text-slate-800 ${
                  note.fontSize || 'text-xs'
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
};
