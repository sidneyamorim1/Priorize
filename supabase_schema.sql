-- supabase_schema.sql
-- Script de configuração do banco de dados no Supabase para o projeto Priorize.
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. Criar tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    text_color TEXT NOT NULL,
    border_color TEXT NOT NULL
);

-- 2. Criar tabela de Tarefas (Tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'inicio' CHECK (status IN ('inicio', 'fazendo', 'encerrado')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    due_date TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Habilitar Row Level Security (RLS)
-- Como o front-end consome diretamente via Supabase client, habilitar RLS é essencial.
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas simples para permitir acesso completo a usuários autenticados
-- (Caso queira permitir acesso anônimo, troque TO authenticated por TO anon)

-- Políticas para Categories
DROP POLICY IF EXISTS "Permitir leitura de categorias para todos os autenticados" ON public.categories;
CREATE POLICY "Permitir leitura de categorias para todos os autenticados" 
ON public.categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir inserção de categorias para todos os autenticados" ON public.categories;
CREATE POLICY "Permitir inserção de categorias para todos os autenticados" 
ON public.categories FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de categorias para todos os autenticados" ON public.categories;
CREATE POLICY "Permitir atualização de categorias para todos os autenticados" 
ON public.categories FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir exclusão de categorias para todos os autenticados" ON public.categories;
CREATE POLICY "Permitir exclusão de categorias para todos os autenticados" 
ON public.categories FOR DELETE TO authenticated USING (true);

-- Políticas para Tasks
DROP POLICY IF EXISTS "Permitir leitura de tarefas para todos os autenticados" ON public.tasks;
CREATE POLICY "Permitir leitura de tarefas para todos os autenticados" 
ON public.tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir inserção de tarefas para todos os autenticados" ON public.tasks;
CREATE POLICY "Permitir inserção de tarefas para todos os autenticados" 
ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de tarefas para todos os autenticados" ON public.tasks;
CREATE POLICY "Permitir atualização de tarefas para todos os autenticados" 
ON public.tasks FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir exclusão de tarefas para todos os autenticados" ON public.tasks;
CREATE POLICY "Permitir exclusão de tarefas para todos os autenticados" 
ON public.tasks FOR DELETE TO authenticated USING (true);

-- 5. Inserir categorias padrão iniciais (Seed Data)
INSERT INTO public.categories (id, name, color, text_color, border_color)
VALUES 
('cat-1', 'Trabalho', 'bg-blue-50 text-blue-700 border-blue-100', 'text-blue-700', 'border-blue-100'),
('cat-2', 'Estudos', 'bg-emerald-50 text-emerald-700 border-emerald-100', 'text-emerald-700', 'border-emerald-100'),
('cat-3', 'Pessoal', 'bg-amber-50 text-amber-700 border-amber-100', 'text-amber-700', 'border-amber-100'),
('cat-4', 'Urgente', 'bg-rose-50 text-rose-700 border-rose-100', 'text-rose-700', 'border-rose-100')
ON CONFLICT (id) DO NOTHING;
