import { useState, useEffect } from 'react';
import { BrandProvider, useBrand } from './context/BrandContext';
import { ChatWidget } from './components/ChatWidget';
import { BrandGuide } from './components/BrandGuide';
import { NewProjectModal, WelcomeScreen } from './components/NewProjectModal';
import { Settings } from './components/Settings';
import { ProjectList } from './components/ProjectList';
import { LoadingOverlay } from './components/LoadingOverlay';
import { cn } from './utils/cn';
import type { AppSettings } from './types';
import { isAIInitialized } from './services/brandingService';

const defaultSettings: AppSettings = {
  openaiApiKey: '',
  theme: 'light',
  language: 'es',
  webhooks: [],
};

function AppContent() {
  const [view, setView] = useState<'projects' | 'chat' | 'guide' | 'settings'>('projects');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [aiStatus, setAiStatus] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('brandgen_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const {
    projects,
    currentProject,
    isLoading,
    isGenerating,
    generationStep,
    createProject,
    selectProject,
    sendMessage,
    generateBrandingForProject,
    deleteProject,
    clearCurrentProject,
  } = useBrand();

  // Check AI status on mount
  useEffect(() => {
    setAiStatus(isAIInitialized());
  }, [settings]);

  const handleCreateProject = async (name: string, description: string) => {
    await createProject(name, description);
    setShowNewProjectModal(false);
    setView('chat');
  };

  const handleGenerateBranding = async () => {
    if (!aiStatus) {
      alert('⚠️ Por favor configura tu API Key de Google AI Studio en Ajustes antes de generar el branding.');
      setView('settings');
      return;
    }
    await generateBrandingForProject();
    setView('guide');
  };

  const handleSelectProject = (id: string) => {
    selectProject(id);
    const project = projects.find(p => p.id === id);
    if (project?.branding) {
      setView('guide');
    } else {
      setView('chat');
    }
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('brandgen_settings', JSON.stringify(updated));
      return updated;
    });
    // Check AI status after updating
    if (newSettings.openaiApiKey) {
      setTimeout(() => setAiStatus(isAIInitialized()), 100);
    }
  };

  // Render AI status indicator
  const renderAIStatus = () => (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${aiStatus
      ? 'bg-green-100 text-green-700'
      : 'bg-yellow-100 text-yellow-700'
      }`}>
      <span className={`w-2 h-2 rounded-full ${aiStatus ? 'bg-green-500' : 'bg-yellow-500'
        }`}></span>
      {aiStatus ? 'IA Activa' : 'IA Sin configurar'}
    </div>
  );

  // Effect to apply dark mode based on settings
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Render project list view (sidebar)
  const renderProjectList = () => (
    <div className={cn(
      "w-80 border-r flex flex-col h-full z-10 transition-colors duration-300",
      settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    )}>
      <div className="p-4 border-b border-slate-200">
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="w-full px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nuevo Proyecto
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <ProjectList
          projects={projects}
          selectedId={currentProject?.id || null}
          onSelect={handleSelectProject}
          onDelete={deleteProject}
        />
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <button
          onClick={() => setView('settings')}
          className={`w-full px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${view === 'settings' ? 'bg-violet-100 text-violet-700' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Configuración
        </button>
      </div>
    </div>
  );

  // Render main content based on view
  const renderMainContent = () => {
    if (view === 'settings') {
      return (
        <div className={cn(
          "p-8 overflow-y-auto h-full scrollbar-thin",
          settings.theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
        )}>
          <Settings
            settings={settings}
            onUpdate={handleUpdateSettings}
            aiStatus={aiStatus}
            onBack={() => setView('projects')}
          />
        </div>
      );
    }

    if (!currentProject) {
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <WelcomeScreen onCreateProject={() => setShowNewProjectModal(true)} />
        </div>
      );
    }

    if (view === 'guide' && currentProject.branding) {
      return (
        <div className="h-full overflow-y-auto scrollbar-thin">
          <BrandGuide
            branding={currentProject.branding}
            projectId={currentProject.id}
          />
        </div>
      );
    }

    // Chat view
    return (
      <div className="flex h-full">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Project Header */}
          <div className="px-6 py-4 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{currentProject.name}</h2>
                  <p className="text-sm text-slate-500 line-clamp-1">{currentProject.description}</p>
                </div>
                {renderAIStatus()}
              </div>
              <div className="flex items-center gap-3">
                {currentProject.branding && (
                  <button
                    onClick={() => setView('guide')}
                    className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors"
                  >
                    Ver Guía
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Status message */}
          {!aiStatus && currentProject.status === 'draft' && (
            <div className="mx-6 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-yellow-800 font-medium">API Key no configurada</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Para generar logos e iconos profesionales, configura tu API Key de Google AI Studio en{' '}
                    <button
                      onClick={() => setView('settings')}
                      className="underline font-medium hover:text-yellow-900"
                    >
                      Ajustes → API
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chat Widget */}
          <div className="flex-1 p-4 min-h-0 overflow-hidden">
            <ChatWidget
              messages={currentProject.messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
              onGenerate={handleGenerateBranding}
              isGenerating={isGenerating}
              canGenerate={currentProject.canGenerate}
              disabled={currentProject.status === 'completed' || currentProject.status === 'generating'}
              aiReady={aiStatus}
            />
          </div>
        </div>

        {/* Sidebar with project info */}
        <div className="w-80 bg-white border-l border-slate-200 p-4 overflow-y-auto scrollbar-thin">
          <h3 className="font-semibold text-slate-900 mb-4">Información del Proyecto</h3>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Estado</p>
              <p className="font-medium text-slate-900 capitalize">
                {currentProject.status === 'draft' ? 'Borrador' :
                  currentProject.status === 'generating' ? 'Generando' :
                    currentProject.status === 'completed' ? 'Completado' : 'Exportado'}
              </p>
            </div>

            {currentProject.branding && (
              <>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Colores</p>
                  <div className="flex -space-x-2">
                    {currentProject.branding.colors.map((c, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Tipografía</p>
                  <p className="font-medium text-slate-900 text-sm">
                    {currentProject.branding.typography.heading.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    + {currentProject.branding.typography.body.name}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Propuestas</p>
                  <p className="font-medium text-slate-900">{currentProject.branding.proposals.length} disponibles</p>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  clearCurrentProject();
                  setView('projects');
                }}
                className="w-full px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-sm"
              >
                ← Volver a proyectos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Project List Sidebar */}
      {renderProjectList()}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderMainContent()}
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSubmit={handleCreateProject}
        isLoading={isLoading}
      />

      {/* Modern Loading Overlay for AI Generation */}
      <LoadingOverlay isVisible={isGenerating} message={generationStep} />
    </div>
  );
}

export function App() {
  return (
    <BrandProvider>
      <AppContent />
    </BrandProvider>
  );
}
