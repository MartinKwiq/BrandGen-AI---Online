import { cn } from '../utils/cn';
import type { BrandProposal } from '../types';
import { ColorComparison } from './ColorPalette';

interface ProposalCardProps {
  proposal: BrandProposal;
  isSelected: boolean;
  onSelect: () => void;
  isCurrent: boolean;
}

export function ProposalCard({ proposal, isSelected, onSelect, isCurrent }: ProposalCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300',
        isSelected 
          ? 'ring-4 ring-violet-500 shadow-xl transform scale-[1.02]' 
          : 'hover:shadow-lg border border-slate-200 hover:border-violet-300'
      )}
    >
      {isCurrent && (
        <div className="absolute top-3 right-3 z-10">
          <span className="px-3 py-1 bg-violet-600 text-white text-xs font-semibold rounded-full shadow-lg">
            ✨ Activa
          </span>
        </div>
      )}
      
      <div 
        className="h-3"
        style={{ 
          background: `linear-gradient(90deg, ${proposal.colorScheme[0]} 0%, ${proposal.colorScheme[1]} 50%, ${proposal.colorScheme[2]} 100%)` 
        }}
      />
      
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg text-slate-900 group-hover:text-violet-700 transition-colors">
              {proposal.name}
            </h3>
            <p className="text-sm text-slate-500 capitalize">{proposal.mood}</p>
          </div>
          <div className="flex -space-x-2">
            {proposal.colorScheme.slice(0, 3).map((color, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        
        <p className="text-sm text-slate-600 line-clamp-2 mb-4">{proposal.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7V4h16v3" />
              <path d="M9 20h6" />
              <path d="M12 4v16" />
            </svg>
            <span>{proposal.typography}</span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {proposal.applications.slice(0, 3).map((app, i) => (
              <span 
                key={i}
                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
              >
                {app}
              </span>
            ))}
            {proposal.applications.length > 3 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                +{proposal.applications.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProposalDetailProps {
  proposal: BrandProposal;
  brandName: string;
}

export function ProposalDetail({ proposal, brandName }: ProposalDetailProps) {
  const colors = proposal.colorScheme.map((hex, i) => ({
    name: ['Primario', 'Secundario', 'Acento', 'Fondo 1', 'Fondo 2', 'Complemento'][i] || `Color ${i + 1}`,
    hex,
    usage: ['Color principal de marca', 'Color de apoyo', 'Llamadas de acción', 'Fondos claros', 'Fondos oscuros', 'Acentos'][i] || 'Uso general',
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{proposal.name}</h2>
        <p className="text-slate-600">{proposal.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-violet-100 text-violet-700 text-sm rounded-full capitalize">
            {proposal.mood}
          </span>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
            {proposal.typography}
          </span>
        </div>
      </div>

      <ColorComparison 
        colors={colors} 
        title="🎨 Paleta de Colores"
      />

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">📝 Tipografía</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Títulos</span>
            <p className="text-2xl font-bold text-slate-900 mt-1" style={{ fontFamily: proposal.typography.split(' + ')[0] }}>
              {brandName}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Cuerpo</span>
            <p className="text-base text-slate-600 mt-1" style={{ fontFamily: proposal.typography.split(' + ')[1] }}>
              El veloz murciélago hindú comía feliz cardillo y kiwi...
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">📱 Aplicaciones</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {proposal.applications.map((app, i) => (
            <div 
              key={i}
              className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl"
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: proposal.colorScheme[i % 3] }}
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-sm text-slate-700">{app}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">👁️ Vista Previa</h3>
        <div 
          className="rounded-xl p-6 border-2 border-dashed"
          style={{ backgroundColor: proposal.colorScheme[3] || '#f8fafc' }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: proposal.colorScheme[0] }}
            >
              {brandName.charAt(0)}
            </div>
            <div>
              <p 
                className="text-xl font-bold"
                style={{ color: proposal.colorScheme[0] }}
              >
                {brandName}
              </p>
              <p className="text-sm" style={{ color: proposal.colorScheme[1] }}>
                Tu tagline aquí
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: proposal.colorScheme[0] }}
            >
              Acción principal
            </button>
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium border-2"
              style={{ borderColor: proposal.colorScheme[1], color: proposal.colorScheme[1] }}
            >
              Secundario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProposalListProps {
  proposals: BrandProposal[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  currentId?: number;
}

export function ProposalList({ proposals, selectedId, onSelect, currentId }: ProposalListProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          isSelected={selectedId === proposal.id}
          onSelect={() => onSelect(proposal.id)}
          isCurrent={currentId === proposal.id}
        />
      ))}
    </div>
  );
}
