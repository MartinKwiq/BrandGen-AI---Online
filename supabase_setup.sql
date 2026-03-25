-- Este script SQL asegura que la tabla brandgen_projects exista con todas las columnas
-- necesarias para que Render pueda guardar los proyectos sin fallar silenciosamente.
-- También asegura que el RLS esté deshabilitado o configurado para permitir a la API
-- guardar y leer sin problemas.

CREATE TABLE IF NOT EXISTS public.brandgen_projects (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    industry text,
    target_audience text,
    status text,
    proposals jsonb,
    images jsonb,
    colors jsonb,
    typography jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Si la tabla ya existía, pero con RLS bloqueando el acceso, lo deshabilitamos
-- para asegurar que la API desde Render pueda guardar y leer los datos libremente.
ALTER TABLE public.brandgen_projects DISABLE ROW LEVEL SECURITY;

-- Aseguramos que el bucket para las imágenes también exista sin bloqueos RLS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('brandgen-storage', 'brandgen-storage', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR ALL 
USING (bucket_id = 'brandgen-storage');
