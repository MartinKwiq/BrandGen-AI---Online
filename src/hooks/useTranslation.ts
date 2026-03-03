import { useSettings } from '../context/SettingsContext';
import { translations, LanguageCode } from '../i18n/translations';

export function useTranslation() {
    const { settings } = useSettings();
    const lang = (settings.language as LanguageCode) || 'es';

    const t = (section: keyof typeof translations['es'], key: string): string => {
        try {
            const translation = (translations[lang] as any)?.[section]?.[key];
            return translation || (translations['es'] as any)[section][key] || `${section}.${key}`;
        } catch {
            return `${section}.${key}`;
        }
    };

    return { t, lang };
}
