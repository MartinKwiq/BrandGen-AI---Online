import { cn } from '../utils/cn';
import type { BrandProject } from '../types';

interface ProjectCardProps {
  project: BrandProject;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, isSelected, onSelect, onDelete }: ProjectCardProps) {
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

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative p-4 rounded-xl cursor-pointer transition-all duration-200',
        isSelected
          ? 'bg-violet-50 border-2 border-violet-500 shadow-md'
          : 'bg-white border-2 border-transparent hover:bg-slate-50 hover:border-slate-200 shadow-sm'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
          <p className="text-sm text-slate-500 line-clamp-2 mt-1">{project.description}</p>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <span className={cn('text-xs px-2 py-1 rounded-full font-medium', statusColors[project.status])}>
          {statusLabels[project.status]}
        </span>
        <span className="text-xs text-slate-400">
          {new Date(project.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {project.branding && (
        <div className="mt-3 flex gap-1">
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
  );
}

interface ProjectListProps {
  projects: BrandProject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectList({ projects, selectedId, onSelect, onDelete }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-slate-500 font-medium">No hay proyectos aún</p>
        <p className="text-slate-400 text-sm mt-1">Crea tu primer proyecto de branding</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isSelected={selectedId === project.id}
          onSelect={() => onSelect(project.id)}
          onDelete={() => onDelete(project.id)}
        />
      ))}
    </div>
  );
}
