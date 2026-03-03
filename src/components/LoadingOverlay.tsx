// import { cn } from '../utils/cn';

interface LoadingOverlayProps {
    isVisible: boolean;
    message: string;
}

export function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md transition-all duration-500">
            <div className="max-w-md w-full mx-4 p-8 bg-white/90 dark:bg-slate-800/90 rounded-3xl shadow-2xl border border-white/20 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                {/* Animated Loader */}
                <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-slate-700"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-violet-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                </div>

                {/* Text content */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Creando tu Marca</h3>
                <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse min-h-[1.5rem]">
                    {message || 'Iniciando proceso de IA...'}
                </p>

                {/* Progress bar indocator (visual only) */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-8 overflow-hidden">
                    <div className="h-full bg-violet-600 rounded-full animate-progress-indeterminate"></div>
                </div>

                <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-semibold">
                    Powered by Gemini 2.0 Flash
                </p>
            </div>
        </div>
    );
}

// Ensure you add this keyframe to your tailwind config or global CSS if not present:
// @keyframes progress-indeterminate {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
