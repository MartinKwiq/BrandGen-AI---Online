import { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';
import { useTranslation } from '../hooks/useTranslation';

interface ChatWidgetProps {
  messages: { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onGenerate?: () => void;
  isGenerating?: boolean;
  canGenerate?: boolean;
  disabled?: boolean;
  aiReady?: boolean;
}

export function ChatWidget({
  messages,
  onSendMessage,
  isLoading,
  onGenerate,
  isGenerating,
  canGenerate,
  disabled,
  aiReady = true
}: ChatWidgetProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, lang: language } = useTranslation();

  // Speech Recognition Setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'es' ? 'es-ES' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'network') {
          alert('Error de red en el micrófono. Tu navegador podría estar bloqueando el servicio de reconocimiento de voz de Google, no hay conexión a internet, o usas un entorno restringido. Por favor, usa el teclado mientras tanto.');
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          alert('Permiso de micrófono denegado. Por favor, verifica la configuración de tu navegador.');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
      } else {
        alert('Speech recognition is not supported in this browser.');
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-cyan-600 to-pink-600">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-cyan-600 rounded-full ${aiReady ? 'bg-green-400' : 'bg-yellow-400'
              }`}></span>
          </div>
          <div>
            <h3 className="text-white font-semibold">{t('chat', 'assistantName')}</h3>
            <p className="text-white/70 text-xs">{t('chat', 'assistantSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3 animate-fade-in',
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                message.role === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-md'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'
              )}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <span
                className={cn(
                  'text-xs mt-1 block',
                  message.role === 'user' ? 'text-white/60' : 'text-slate-400'
                )}
              >
                {new Date(message.timestamp).toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200">
        {canGenerate && !disabled && (
          <div className="px-4 pt-4 animate-fade-in-up">
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-700 hover:to-pink-700 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-200 hover:shadow-xl flex items-center justify-center gap-3 group"
            >
              {isGenerating ? (
                <>
                  <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('chat', 'generatingBrand')}
                </>
              ) : (
                <>
                  <span className="text-xl group-hover:scale-125 transition-transform">✨</span>
                  <span>{t('chat', 'generateBrand')}</span>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-medium">
              {t('chat', 'interviewFinished')}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={disabled ? t('chat', 'inputDisabled') : t('chat', 'inputPlaceholder')}
              disabled={disabled || isLoading}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all text-sm"
            />
            
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={disabled || isLoading}
              className={cn(
                "px-3 rounded-xl transition-all flex items-center justify-center border",
                isListening 
                  ? "bg-red-50 border-red-200 text-red-600 animate-pulse" 
                  : "bg-white border-slate-200 text-slate-400 hover:text-cyan-600 hover:border-cyan-200"
              )}
              title="Dictar mensaje"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isListening ? (
                  <>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                  </>
                ) : (
                  <>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </>
                )}
              </svg>
            </button>

            <button
              type="submit"
              disabled={!input.trim() || disabled || isLoading}
              className="px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white rounded-xl transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
