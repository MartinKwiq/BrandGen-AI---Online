import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import type { AppSettings, WebhookConfig } from '../types';
import { saveApiKey, getApiKey, deleteApiKey, isAIInitialized } from '../services/brandingService';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (settings: Partial<AppSettings>) => void;
  aiStatus?: boolean;
  onBack?: () => void;
}

export function Settings({ settings, onUpdate, aiStatus: externalAiStatus, onBack }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [aiStatus, setAiStatus] = useState(isAIInitialized());
  const [showToast, setShowToast] = useState(false);

  const handleManualSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    // Sync with external status if provided
    if (externalAiStatus !== undefined) {
      setAiStatus(externalAiStatus);
    }
  }, [externalAiStatus]);

  useEffect(() => {
    const storedKey = getApiKey();
    if (storedKey) {
      setGeminiApiKey(storedKey);
      setAiStatus(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (geminiApiKey.trim()) {
      saveApiKey(geminiApiKey.trim());
      setAiStatus(true);
      alert('✅ API Key guardada correctamente. La IA está lista para generar branding profesional.');
    }
  };

  const handleDeleteApiKey = () => {
    if (confirm('¿Estás seguro de eliminar la API Key?')) {
      deleteApiKey();
      setGeminiApiKey('');
      setAiStatus(false);
      alert('API Key eliminada');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'api', label: 'API', icon: '🔑' },
    { id: 'webhooks', label: 'Webhooks', icon: '🔗' },
    { id: 'integration', label: 'Integración', icon: '🔌' },
  ];

  const addWebhook = () => {
    if (webhookUrl.trim()) {
      const newWebhook: WebhookConfig = {
        id: Date.now().toString(),
        name: 'Nuevo Webhook',
        url: webhookUrl.trim(),
        events: ['project.created', 'project.completed'],
        active: true,
      };
      onUpdate({
        webhooks: [...settings.webhooks, newWebhook],
      });
      setWebhookUrl('');
    }
  };

  const removeWebhook = (id: string) => {
    onUpdate({
      webhooks: settings.webhooks.filter(w => w.id !== id),
    });
  };

  const toggleWebhook = (id: string) => {
    onUpdate({
      webhooks: settings.webhooks.map(w => 
        w.id === id ? { ...w, active: !w.active } : w
      ),
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      {onBack && (
        <div className="mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Volver al Dashboard
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-200 px-6">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-4 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Configuración General</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Idioma</label>
                    <select
                      value={settings.language}
                      onChange={(e) => onUpdate({ language: e.target.value })}
                      className="w-full max-w-xs px-4 py-2 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tema</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => onUpdate({ theme: 'light' })}
                        className={cn(
                          'px-4 py-2 rounded-xl border-2 transition-colors flex items-center gap-2',
                          settings.theme === 'light'
                            ? 'border-violet-500 bg-violet-50 text-violet-700'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        ☀️ Claro
                      </button>
                      <button
                        onClick={() => onUpdate({ theme: 'dark' })}
                        className={cn(
                          'px-4 py-2 rounded-xl border-2 transition-colors flex items-center gap-2',
                          settings.theme === 'dark'
                            ? 'border-violet-500 bg-violet-50 text-violet-700'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        🌙 Oscuro
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-end">
                  <button
                    onClick={handleManualSave}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors"
                  >
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6 animate-fade-in">
              {/* Google AI Studio (Gemini) - PRINCIPAL */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">Google AI Studio (Gemini)</h3>
                  {aiStatus && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      ✓ Activo
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  Conecta tu API de Google AI Studio para generar logos e iconos profesionales con IA.
                </p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="AIza..."
                      className="flex-1 max-w-xl px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none font-mono text-sm"
                    />
                    <button
                      onClick={handleSaveApiKey}
                      className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Guardar
                    </button>
                    {geminiApiKey && (
                      <button
                        onClick={handleDeleteApiKey}
                        className="px-4 py-3 border border-red-300 hover:bg-red-50 text-red-600 rounded-xl font-medium transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    🔒 Tu API key se almacena de forma segura en tu navegador (localStorage)
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl p-5 border border-violet-200">
                <h4 className="font-medium text-violet-900 mb-2 flex items-center gap-2"> 
                  <span>🚀</span> ¿Cómo obtener tu API Key?
                </h4>
                <ol className="text-sm text-violet-700 space-y-2 ml-4 list-decimal">
                  <li>
                    Ve a{' '}
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="underline font-semibold hover:text-violet-900"
                    >
                      Google AI Studio
                    </a>
                  </li>
                  <li>Inicia sesión con tu cuenta de Google</li>
                  <li>Haz clic en "Get API Key"</li>
                  <li>Copia la clave y pégala aquí arriba</li>
                </ol>
                <p className="text-xs text-violet-600 mt-3">
                  💡 <strong>Es gratis</strong> con un límite generoso de uso diario
                </p>
              </div>

              {/* OpenAI (Opcional) */}
              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">OpenAI (Opcional)</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Configura tu API key de OpenAI para usar modelos alternativos.
                </p>
                <div className="space-y-3">
                  <input
                    type="password"
                    value={settings.openaiApiKey}
                    onChange={(e) => onUpdate({ openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full max-w-xl px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    Obtén tu API key en{' '}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                      platform.openai.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Webhooks</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Configura webhooks para recibir notificaciones cuando ocurran eventos.
                </p>

                {/* Add Webhook */}
                <div className="flex gap-3 mb-6">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://tu-servidor.com/webhook"
                    className="flex-1 max-w-xl px-4 py-2 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none"
                  />
                  <button
                    onClick={addWebhook}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors"
                  >
                    Agregar
                  </button>
                </div>

                {/* Webhooks List */}
                <div className="space-y-3">
                  {settings.webhooks.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <p>No hay webhooks configurados</p>
                    </div>
                  ) : (
                    settings.webhooks.map((webhook) => (
                      <div
                        key={webhook.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleWebhook(webhook.id)}
                            className={cn(
                              'w-10 h-6 rounded-full transition-colors relative',
                              webhook.active ? 'bg-violet-600' : 'bg-slate-300'
                            )}
                          >
                            <span
                              className={cn(
                                'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                                webhook.active ? 'left-5' : 'left-1'
                              )}
                            />
                          </button>
                          <div>
                            <p className="font-medium text-slate-900">{webhook.name}</p>
                            <p className="text-sm text-slate-500 font-mono truncate max-w-xs">{webhook.url}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeWebhook(webhook.id)}
                          className="p-2 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integration' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Integración con GoHighLevel</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Conecta tu cuenta para sincronizar proyectos y automatizar flujos de trabajo.
                </p>

                {/* GoHighLevel Integration */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-2xl font-bold">G</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">GoHighLevel Integration</h4>
                      <p className="text-sm text-slate-600 mt-1">
                        Sincroniza tus proyectos de branding automáticamente con GoHighLevel.
                      </p>
                      <div className="flex gap-3 mt-4">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                          Conectar
                        </button>
                        <button className="px-4 py-2 border border-blue-300 hover:bg-blue-50 text-blue-700 rounded-lg font-medium transition-colors">
                          Ver Documentación
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Webhook Events */}
                <div className="mt-6">
                  <h4 className="font-medium text-slate-900 mb-3">Eventos disponibles</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { event: 'project.created', label: 'Proyecto creado' },
                      { event: 'project.completed', label: 'Proyecto completado' },
                      { event: 'branding.generated', label: 'Branding generado' },
                      { event: 'export.completed', label: 'Exportación completada' },
                    ].map((item) => (
                      <div key={item.event} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-sm text-slate-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in z-50">
          <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="font-medium">Configuración guardada exitosamente</span>
        </div>
      )}
    </div>
  );
}
