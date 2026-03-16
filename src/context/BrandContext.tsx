import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import type { BrandProject, Message } from '../types';
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
}

const BrandContext = createContext<BrandContextType | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<BrandProject[]>([]);
  const [currentProject, setCurrentProject] = useState<BrandProject | null>(null);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const loadedProjects = await getProjects();
        setProjects(loadedProjects);
      } catch (error) {
        console.error('❌ Error loading projects:', error);
      }
    };
    loadProjects();
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [aiReady] = useState(isAIInitialized());

  // Track conversation state to avoid repetition
  const conversationPhase = useRef<'values' | 'audience' | 'style' | 'complete'>('values');
  const askedTopics = useRef<Set<string>>(new Set());

  const createProject = useCallback(async (name: string, description: string) => {
    setIsLoading(true);
    try {
      // Reset conversation state
      conversationPhase.current = 'values';
      askedTopics.current = new Set();

      const newProject: BrandProject = {
        id: generateId(),
        name,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectProject = useCallback((id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      // Reset conversation state when selecting project
      conversationPhase.current = 'values';
      askedTopics.current = new Set();
      setCurrentProject(project);
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
    };

    setCurrentProject(updatedProject);
    await saveProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));

    setIsLoading(true);
    try {
      // Generate context summary from conversation for smart responses
      const chatMessages = updatedProject.messages.map(m => ({ role: m.role, content: m.content }));

      // Limit to 10 interactions
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

      // Check for success phrase
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
      // Generate context summary from chat for better branding
      const chatMessages = currentProject.messages.map(m => ({ role: m.role, content: m.content }));
      const chatContext = generateContextSummary(chatMessages);

      console.log('🎯 Generating branding with context:', {
        brandName: currentProject.name,
        description: currentProject.description,
        chatContextLength: chatContext.length,
      });

      // Progressive state for proposal-by-proposal rendering
      let progressiveProposals: any[] = [];

      // Navigate to guide immediately when generation starts
      // (the parent App will switch views once isGenerating = true)

      const branding = await generateBranding(
        currentProject.name,
        currentProject.description,
        undefined, // industry
        undefined, // targetAudience
        chatContext, // Pass chat context
        (step) => setGenerationStep(step), // onStep progress callback
        (proposal, index) => {
          // ===== onProposalReady: emit proposal to UI immediately =====
          console.log(`🟢 onProposalReady triggered for proposal ${index + 1}`);
          progressiveProposals = [...progressiveProposals];
          progressiveProposals[index] = proposal;

          // Build a partial branding object with what we have so far
          const partialBranding = {
            brandName: currentProject.name,
            logo: progressiveProposals[0]?.logo || '',
            tagline: '',
            colors: progressiveProposals[0]?.colors || [],
            colorScheme: progressiveProposals[0]?.colorScheme || [],
            typography: progressiveProposals[0]?.typography || null,
            icons: [],
            proposals: progressiveProposals.filter(Boolean),
            brandStrategy: null,
            finalBrandSystem: null,
          };

          // Update the project state immediately so the UI can render
          setCurrentProject(prev => {
            if (!prev) return prev;
            return { ...prev, status: 'generating', branding: partialBranding as any };
          });
        }
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
            content: `¡He generado tu branding completo con 5 propuestas únicas! Cada propuesta incluye un logo profesional, paleta de 6 colores, 2 tipografías y 6 iconos concordantes. Explora las diferentes propuestas y elige la que mejor represente tu marca.`,
            timestamp: new Date(),
          },
        ],
        updatedAt: new Date(),
      };

      setCurrentProject(updatedProject);
      await saveProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));

      console.log('✅ Branding generation complete:', {
        proposalsCount: branding.proposals.length,
        hasLogo: !!branding.logo,
        colorsCount: branding.colors.length,
        iconsCount: branding.icons.length,
      });
    } catch (error) {
      console.error('❌ Error generating branding:', error);
      // Add error message
      const errorProject: BrandProject = {
        ...currentProject,
        messages: [
          ...currentProject.messages,
          {
            id: generateId(),
            role: 'assistant',
            content: `Lo siento, hubo un error al generar el branding. Por favor verifica tu API Key en Ajustes y vuelve a intentar.`,
            timestamp: new Date(),
          },
        ],
      };
      setCurrentProject(errorProject);
      await saveProject(errorProject);
    } finally {
      setIsGenerating(false);
    }
  }, [currentProject]);

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
  }, []);

  const updateProject = useCallback(async (project: BrandProject) => {
    setCurrentProject(project);
    await saveProject(project);
    setProjects(prev => prev.map(p => p.id === project.id ? project : p));
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
