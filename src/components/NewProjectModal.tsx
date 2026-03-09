import { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
  isLoading: boolean;
}

export function NewProjectModal({ isOpen, onClose, onSubmit, isLoading }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && description.trim()) {
      onSubmit(name.trim(), description.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-kwiq-dark border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{t('newProjectModal', 'title')}</h2>
              <p className="text-white/70 text-sm">{t('newProjectModal', 'subtitle')}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              {t('newProjectModal', 'nameLabel')}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('newProjectModal', 'namePlaceholder')}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
              {t('newProjectModal', 'descLabel')}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('newProjectModal', 'descPlaceholder')}
              rows={4}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all resize-none"
              disabled={isLoading}
            />
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-600">
              <span className="font-medium">{t('newProjectModal', 'tipPrefix')}</span> {t('newProjectModal', 'tipText')}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors"
              disabled={isLoading}
            >
              {t('newProjectModal', 'cancel')}
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !description.trim() || isLoading}
              className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('newProjectModal', 'creating')}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {t('newProjectModal', 'createBtn')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface WelcomeScreenProps {
  onCreateProject: () => void;
}

export function WelcomeScreen({ onCreateProject }: WelcomeScreenProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-3xl">
      <div className="w-24 h-24 rounded-3xl bg-transparent flex items-center justify-center mb-6 transform hover:scale-105 transition-transform duration-500">
        <img src="/kwiq-logo.png" alt="Kwiq Logo" className="w-full h-full object-contain drop-shadow-2xl" />
      </div>

      <h2 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
        {t('welcomeScreen', 'title')}
      </h2>
      <p className="text-slate-600 max-w-md mb-10 text-lg">
        {t('welcomeScreen', 'subtitle')}
      </p>

      <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mb-12">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 text-left hover:border-kwiq hover:shadow-xl hover:shadow-kwiq/5 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-kwiq/10 flex items-center justify-center mb-4 group-hover:bg-kwiq group-hover:text-white transition-colors">
            <svg className="w-6 h-6 text-kwiq group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-900 text-lg">{t('welcomeScreen', 'feature1Title')}</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{t('welcomeScreen', 'feature1Desc')}</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 text-left hover:border-kwiq hover:shadow-xl hover:shadow-kwiq/5 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center mb-4 group-hover:bg-pink-500 group-hover:text-white transition-colors">
            <svg className="w-6 h-6 text-pink-600 group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-900 text-lg">{t('welcomeScreen', 'feature2Title')}</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{t('welcomeScreen', 'feature2Desc')}</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 text-left hover:border-kwiq hover:shadow-xl hover:shadow-kwiq/5 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center mb-4 group-hover:bg-pink-500 group-hover:text-white transition-colors">
            <svg className="w-6 h-6 text-pink-600 group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-900 text-lg">{t('welcomeScreen', 'feature3Title')}</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{t('welcomeScreen', 'feature3Desc')}</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 text-left hover:border-kwiq hover:shadow-xl hover:shadow-kwiq/5 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-kwiq/10 flex items-center justify-center mb-4 group-hover:bg-kwiq group-hover:text-white transition-colors">
            <svg className="w-6 h-6 text-kwiq group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-900 text-lg">{t('welcomeScreen', 'feature4Title')}</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{t('welcomeScreen', 'feature4Desc')}</p>
        </div>
      </div>

      <button
        onClick={onCreateProject}
        className="px-10 py-5 bg-kwiq hover:bg-kwiq-dark text-white rounded-2xl font-bold text-xl transition-all shadow-xl shadow-kwiq/20 hover:shadow-2xl hover:scale-105 flex items-center gap-3"
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {t('welcomeScreen', 'startBtn')}
      </button>
    </div>
  );
}
