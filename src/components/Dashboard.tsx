import { useState } from 'react';
import type { BrandProject } from '../types';

interface DashboardProps {
  projects: BrandProject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewProject: () => void;
}

export function Dashboard({ projects, selectedId, onSelect, onDelete, onNewProject }: DashboardProps) {
  const [view] = useState<'grid' | 'list'>('grid');

  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === 'completed').length,
    draft: projects.filter(p => p.status === 'draft').length,
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mis Proyectos</h1>
            <p className="text-sm text-slate-500">{stats.total} proyectos en total</p>
          </div>
          <button
            onClick={onNewProject}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo Proyecto
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-sm text-slate-500">Total</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-sm text-green-600">Completados</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
            <p className="text-sm text-yellow-600">Borradores</p>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-6">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay proyectos aún</h3>
            <p className="text-slate-500 mb-4">Crea tu primer proyecto de branding</p>
            <button
              onClick={onNewProject}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors"
            >
              Crear Proyecto
            </button>
          </div>
        ) : (
          <div className={
            view === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isSelected={selectedId === project.id}
                onSelect={() => onSelect(project.id)}
                onDelete={() => onDelete(project.id)}
                view={view}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: BrandProject;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  view: 'grid' | 'list';
}

function ProjectCard({ project, isSelected, onSelect, onDelete, view }: ProjectCardProps) {
  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-700',
    generating: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    exported: 'bg-purple-100 text-purple-700',
  };

  const statusLabels = {
    draft: 'Borrador',
    generating: 'Generando',
    completed: 'Completado',
    exported: 'Exportado',
  };

  if (view === 'list') {
    return (
      <div
        onClick={onSelect}
        className={
          'group flex items-center gap-4 p-4 bg-white rounded-xl cursor-pointer transition-all hover:shadow-md ' +
          (isSelected ? 'ring-2 ring-violet-500 shadow-md' : 'border border-slate-200')
        }
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {project.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
          <p className="text-sm text-slate-500 truncate">{project.description}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={
        'group relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg ' +
        (isSelected ? 'ring-4 ring-violet-500 shadow-xl' : 'border border-slate-200 hover:border-violet-300')
      }
    >
      {/* Preview Header */}
      <div 
        className="h-24 relative"
        style={{ 
          background: project.branding 
            ? `linear-gradient(135deg, ${project.branding.colors[0].hex} 0%, ${project.branding.colors[1].hex} 100%)`
            : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-white/30">
            {project.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-3 right-3 p-2 rounded-lg bg-white/20 hover:bg-red-500 hover:text-white text-white/80 opacity-0 group-hover:opacity-100 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
        </div>
        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{project.description}</p>
        
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </span>
          <span className="text-xs text-slate-400">
            {new Date(project.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        {project.branding && (
          <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
            {project.branding.colors.slice(0, 4).map((color, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
