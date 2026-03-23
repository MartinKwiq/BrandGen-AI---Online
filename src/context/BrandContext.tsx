import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import type { BrandProject, Message, BrandBranding } from '../types';
import {
  generateBranding,
  getAIResponse,
  saveProject,
  getProjects,
  deleteProject as deleteProjectService,
  generateId,
  generateContextSummary,
  isAIInitialized
} from '../services/brandingService';

interface BrandContextType {
  projects: BrandProject[];
  currentProject: BrandProject | null;
  isLoading: boolean;
  isGenerating: boolean;
  generationStep: string;
  aiReady: boolean;
  createProject: (name: string, description: string) => Promise<void>;
  selectProject: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  generateBrandingForProject: () => Promise<void>;
  deleteProject: (id: string) => void;
  clearCurrentProject: () => void;
  updateProject: (project: BrandProject) => void;
  setGenerationStep: (step: string) => void;
  isMockMode: boolean;
  setIsMockMode: (value: boolean) => void;
}

const BrandContext = createContext<BrandContextType | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<BrandProject[]>([]);
  const [currentProject, setCurrentProject] = useState<BrandProject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [aiReady] = useState(isAIInitialized());
  const [isMockMode, setIsMockModeState] = useState(() => localStorage.getItem('is_mock_mode') === 'true');
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const conversationPhase = useRef<'values' | 'audience' | 'style' | 'complete'>('values');
  const askedTopics = useRef<Set<string>>(new Set());

  const setIsMockMode = useCallback((value: boolean) => {
    setIsMockModeState(value);
    localStorage.setItem('is_mock_mode', value.toString());
  }, []);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const loadedProjects = await getProjects();
        setProjects(loadedProjects);
        
        const lastActiveId = localStorage.getItem('active_project_id');
        if (lastActiveId) {
          const active = loadedProjects.find(p => p.id === lastActiveId);
          if (active) setCurrentProject(active);
        } else if (loadedProjects.length > 0 && !currentProject) {
          setCurrentProject(loadedProjects[0]);
        }
      } catch (error) {
        console.error('❌ Error loading projects:', error);
      }
    };
    loadProjects();
  }, []);

  const createProject = useCallback(async (name: string, description: string) => {
    setIsLoading(true);
    try {
      conversationPhase.current = 'values';
      askedTopics.current = new Set();

      const newProject: BrandProject = {
        id: generateId(),
        name,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
        updated_at: new Date(),
        status: 'draft',
        messages: [
          {
            id: generateId(),
            role: 'assistant',
            content: `¡Hola! Soy Kwiq Branding, tu consultor de branding. He creado el proyecto "${name}" basándome en tu descripción. Para empezar a diseñar tu identidad ideal, cuéntame un poco más sobre el propósito principal de tu negocio. ¿Qué es lo que quieres lograr con esta marca?`,
            timestamp: new Date(),
          },
        ],
      };

      await saveProject(newProject);
      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);
      localStorage.setItem('active_project_id', newProject.id);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectProject = useCallback((id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      conversationPhase.current = 'values';
      askedTopics.current = new Set();
      setCurrentProject(project);
      localStorage.setItem('active_project_id', project.id);
    }
  }, [projects]);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentProject) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const updatedProject = {
      ...currentProject,
      messages: [...currentProject.messages, userMessage],
      updatedAt: new Date(),
      updated_at: new Date(),
    };

    setCurrentProject(updatedProject);
    await saveProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));

    setIsLoading(true);
    try {
      const chatMessages = updatedProject.messages
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const userMessagesCount = updatedProject.messages.filter(m => m.role === 'user').length;
      if (userMessagesCount >= 10) {
        const limitMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: "¡Hemos conversado bastante! Creo que ya tengo lo suficiente. Por favor, haz clic en el botón **'✨ Generar Branding'** aquí abajo para ver tus propuestas.",
          timestamp: new Date(),
        };
        const finalProject = {
          ...updatedProject,
          messages: [...updatedProject.messages, limitMessage],
          canGenerate: true,
        };
        setCurrentProject(finalProject);
        await saveProject(finalProject);
        setProjects(prev => prev.map(p => p.id === finalProject.id ? finalProject : p));
        return;
      }

      const response = await getAIResponse(chatMessages, { 
        brandName: currentProject.name, 
        description: currentProject.description 
      });

      const isComplete = response.includes("Generar Branding");

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      const finalProject = {
        ...updatedProject,
        messages: [...updatedProject.messages, assistantMessage],
        canGenerate: isComplete,
      };

      setCurrentProject(finalProject);
      await saveProject(finalProject);
      setProjects(prev => prev.map(p => p.id === finalProject.id ? finalProject : p));
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  const generateBrandingForProject = useCallback(async () => {
    if (!currentProject) return;

    setIsGenerating(true);
    try {
      const chatMessages = currentProject.messages.map(m => ({ role: m.role, content: m.content }));
      const chatContext = generateContextSummary(chatMessages);

      console.log('🎯 Generating branding', {
        brandName: currentProject.name,
        isMockMode
      });

      let progressiveProposals: any[] = [];

      const branding = await generateBranding(
        currentProject.name,
        currentProject.description,
        undefined, 
        undefined, 
        chatContext, 
        (step) => setGenerationStep(step),
        (proposal, index) => {
          progressiveProposals = [...progressiveProposals];
          progressiveProposals[index] = proposal;

          const partialBranding = {
            brandName: currentProject.name,
            logo: progressiveProposals[0]?.logo || '',
            tagline: '',
            colors: progressiveProposals[0]?.colors || [],
            colorScheme: progressiveProposals[0]?.colorScheme || [],
            typography: progressiveProposals[0]?.typography || null,
            icons: [],
            proposals: progressiveProposals.filter(Boolean),
          };

          setCurrentProject(prev => {
            if (!prev) return prev;
            return { ...prev, status: 'generating', branding: partialBranding as any };
          });
        },
        isMockMode // Nuevo parámetro para el modo mock
      );

      const updatedProject: BrandProject = {
        ...currentProject,
        status: 'completed',
        branding,
        messages: [
          ...currentProject.messages,
          {
            id: generateId(),
            role: 'assistant',
            content: `¡He generado tu branding completo con 5 propuestas únicas! Explora las diferentes propuestas y elige la que mejor represente tu marca.`,
            timestamp: new Date(),
          },
        ],
        updatedAt: new Date(),
        updated_at: new Date(),
      };

      setCurrentProject(updatedProject);
      await saveProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    } catch (error) {
      console.error('❌ Error generating branding:', error);
      const errorProject: BrandProject = {
        ...currentProject,
        messages: [
          ...currentProject.messages,
          {
            id: generateId(),
            role: 'assistant',
            content: `Lo siento, hubo un error al generar el branding.`,
            timestamp: new Date(),
          },
        ],
      };
      setCurrentProject(errorProject);
      await saveProject(errorProject);
    } finally {
      setIsGenerating(false);
    }
  }, [currentProject, isMockMode]);

  const deleteProject = useCallback(async (id: string) => {
    await deleteProjectService(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
  }, [currentProject]);

  const clearCurrentProject = useCallback(() => {
    conversationPhase.current = 'values';
    askedTopics.current = new Set();
    setCurrentProject(null);
    localStorage.removeItem('active_project_id');
  }, []);

  const updateProject = useCallback((project: BrandProject) => {
    const updatedWithTimestamp = { ...project, updatedAt: new Date(), updated_at: new Date() };
    setCurrentProject(updatedWithTimestamp);
    setProjects(prev => prev.map(p => p.id === project.id ? updatedWithTimestamp : p));
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveProject(updatedWithTimestamp).catch(error => console.error("Error background saving project:", error));
    }, 1000);
  }, []);

  return (
    <BrandContext.Provider
      value={{
        projects,
        currentProject,
        isLoading,
        isGenerating,
        generationStep,
        aiReady,
        createProject,
        selectProject,
        sendMessage,
        generateBrandingForProject,
        deleteProject,
        clearCurrentProject,
        updateProject,
        setGenerationStep,
        isMockMode,
        setIsMockMode
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
