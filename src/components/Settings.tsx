import { useState } from 'react';
import { cn } from '../utils/cn';
import { useSettings } from '../context/SettingsContext';
import { useTranslation } from '../hooks/useTranslation';

interface SettingsProps {
  onBack?: () => void;
  // aiStatus ya no se usa aquí pero lo mantenemos por si acaso, o lo quitamos.
}

export function Settings({ onBack }: SettingsProps) {
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  const [showToast, setShowToast] = useState(false);

  const handleManualSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const tabs = [
    { id: 'general', label: t('settings', 'title'), icon: '⚙️' },
  ];

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
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t('settings', 'back')}
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
                    ? 'border-cyan-500 text-cyan-600'
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
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('settings', 'title')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('settings', 'language')}</label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSettings({ language: e.target.value })}
                      className="w-full max-w-xs px-4 py-2 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('settings', 'theme')}</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateSettings({ theme: 'light' })}
                        className={cn(
                          'px-4 py-2 rounded-xl border-2 transition-colors flex items-center gap-2',
                          settings.theme === 'light'
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        {t('settings', 'themeLight')}
                      </button>
                      <button
                        onClick={() => updateSettings({ theme: 'dark' })}
                        className={cn(
                          'px-4 py-2 rounded-xl border-2 transition-colors flex items-center gap-2',
                          settings.theme === 'dark'
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        {t('settings', 'themeDark')}
                      </button>
                      <button
                        onClick={() => updateSettings({ theme: 'system' })}
                        className={cn(
                          'px-4 py-2 rounded-xl border-2 transition-colors flex items-center gap-2',
                          settings.theme === 'system'
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        {t('settings', 'themeSystem')}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-end">
                  <button
                    onClick={handleManualSave}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors"
                  >
                    {t('settings', 'save')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Se han eliminado las pestañas de API, Webhooks e Integraciones */}
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in z-50">
          <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="font-medium">{t('settings', 'saveSuccess')}</span>
        </div>
      )}
    </div>
  );
}
