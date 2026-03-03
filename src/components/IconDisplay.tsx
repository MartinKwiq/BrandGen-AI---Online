import { useState } from 'react';
import type { BrandIcon } from '../types';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ====== ICON LIGHTBOX MODAL ======
interface IconLightboxProps {
  icon: BrandIcon;
  color: string;
  onClose: () => void;
}

function IconLightbox({ icon, color, onClose }: IconLightboxProps) {
  const imgSrc = icon.svg.startsWith('/') ? `${BACKEND_URL}${icon.svg}` : icon.svg;
  const isImage = icon.svg.startsWith('/') || icon.svg.startsWith('http') || icon.svg.startsWith('data:');

  const handleDownload = () => {
    if (isImage) {
      const link = document.createElement('a');
      link.href = imgSrc;
      link.download = `${icon.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.click();
    } else {
      // Download SVG
      const svgContent = icon.svg;
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${icon.name.replace(/\s+/g, '-').toLowerCase()}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-10 flex flex-col items-center gap-6 shadow-2xl"
        style={{
          animation: 'lightboxIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          maxWidth: 380,
          width: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon display */}
        <div
          className="rounded-2xl flex items-center justify-center"
          style={{ width: 200, height: 200, background: `${color}12` }}
        >
          {isImage ? (
            <img
              src={imgSrc}
              alt={icon.name}
              className="object-contain"
              style={{ width: 160, height: 160 }}
            />
          ) : (
            <div
              style={{ width: 160, height: 160, color }}
              dangerouslySetInnerHTML={{
                __html: icon.svg
                  .replace(/currentColor/g, color)
                  .replace(/stroke-width="2"/g, `stroke-width="1.5"`)
                  .replace(/<svg/, `<svg width="160" height="160"`)
              }}
            />
          )}
        </div>

        <div className="text-center">
          <p className="text-xl font-bold text-slate-900">{icon.name}</p>
          {icon.description && (
            <p className="text-sm text-slate-500 mt-1">{icon.description}</p>
          )}
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Descargar
          </button>
          <button
            onClick={onClose}
            className="py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes lightboxIn {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ====== ICON SET ======
interface IconSetProps {
  icons: BrandIcon[];
  color?: string;
  size?: number;
}

export function IconSet({ icons, color = '#6366f1', size = 48 }: IconSetProps) {
  const [selectedIcon, setSelectedIcon] = useState<BrandIcon | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {icons.map((icon, index) => (
          <div
            key={index}
            className="group flex flex-col items-center p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
            onClick={() => setSelectedIcon(icon)}
            title={`Clic para ampliar ${icon.name}`}
          >
            <div
              className="p-3 rounded-xl bg-slate-50 group-hover:bg-violet-50 transition-colors flex items-center justify-center"
              style={{ width: size + 16, height: size + 16 }}
            >
              {icon.svg.startsWith('/') || icon.svg.startsWith('http') || icon.svg.startsWith('data:') ? (
                <img
                  src={icon.svg.startsWith('/') ? `${BACKEND_URL}${icon.svg}` : icon.svg}
                  alt={icon.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                  style={{ maxWidth: size, maxHeight: size }}
                />
              ) : (
                <div
                  className="group-hover:scale-110 transition-transform"
                  style={{ width: size, height: size, color }}
                  dangerouslySetInnerHTML={{
                    __html: icon.svg
                      .replace(/currentColor/g, color)
                      .replace(/stroke-width="2"/g, `stroke-width="1.5"`)
                      .replace(/<svg/, `<svg width="${size}" height="${size}"`)
                  }}
                />
              )}
            </div>
            <p className="mt-3 text-xs text-slate-600 font-medium text-center">{icon.name}</p>
          </div>
        ))}
      </div>

      {selectedIcon && (
        <IconLightbox
          icon={selectedIcon}
          color={color}
          onClose={() => setSelectedIcon(null)}
        />
      )}
    </>
  );
}

// ====== ICON GRID ======
interface IconGridProps {
  icons: BrandIcon[];
  color?: string;
}

export function IconGrid({ icons, color = '#6366f1' }: IconGridProps) {
  const [selectedIcon, setSelectedIcon] = useState<BrandIcon | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {icons.map((icon, index) => (
          <div
            key={index}
            className="flex flex-col items-center p-3 bg-slate-50 rounded-xl hover:bg-violet-50 transition-colors cursor-pointer"
            onClick={() => setSelectedIcon(icon)}
          >
            {icon.svg.startsWith('/') || icon.svg.startsWith('http') || icon.svg.startsWith('data:') ? (
              <img
                src={icon.svg.startsWith('/') ? `${BACKEND_URL}${icon.svg}` : icon.svg}
                alt={icon.name}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <div
                className="p-2"
                dangerouslySetInnerHTML={{
                  __html: icon.svg.replace(/currentColor/g, color).replace(/stroke-width="2"/g, `stroke-width="1.5"`)
                }}
                style={{ color }}
              />
            )}
            <p className="mt-2 text-xs text-slate-500 text-center truncate w-full">{icon.name}</p>
          </div>
        ))}
      </div>

      {selectedIcon && (
        <IconLightbox
          icon={selectedIcon}
          color={color}
          onClose={() => setSelectedIcon(null)}
        />
      )}
    </>
  );
}

// ====== SINGLE ICON ======
interface SingleIconProps {
  icon: BrandIcon;
  color?: string;
  size?: number;
  showName?: boolean;
}

export function SingleIcon({ icon, color = '#6366f1', size = 48, showName = true }: SingleIconProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="p-4 bg-white rounded-2xl shadow-md flex items-center justify-center"
        style={{ width: size + 32, height: size + 32 }}
      >
        {icon.svg.startsWith('/') || icon.svg.startsWith('http') || icon.svg.startsWith('data:') ? (
          <img
            src={icon.svg.startsWith('/') ? `${BACKEND_URL}${icon.svg}` : icon.svg}
            alt={icon.name}
            className="object-contain"
            style={{ maxWidth: size, maxHeight: size }}
          />
        ) : (
          <div
            dangerouslySetInnerHTML={{
              __html: icon.svg.replace(/currentColor/g, color).replace(/stroke-width="2"/g, `stroke-width="1.5"`)
            }}
          />
        )}
      </div>
      {showName && (
        <p className="mt-3 text-sm text-slate-600 font-medium">{icon.name}</p>
      )}
    </div>
  );
}

// ====== ICON SHOWCASE (used in BrandGuide icons section) ======
interface IconShowcaseProps {
  icons: BrandIcon[];
  title?: string;
  color?: string;
}

export function IconShowcase({ icons, title, color = '#6366f1' }: IconShowcaseProps) {
  const [selectedIcon, setSelectedIcon] = useState<BrandIcon | null>(null);

  if (!icons || icons.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{title || 'Iconos'}</h3>
        <p className="text-slate-500 text-center py-8">No hay iconos disponibles</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        {title && <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {icons.map((icon, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-4 bg-slate-50 rounded-xl hover:bg-violet-50 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelectedIcon(icon)}
              title={`Clic para ampliar: ${icon.name}`}
            >
              {icon.svg.startsWith('/') || icon.svg.startsWith('http') || icon.svg.startsWith('data:') ? (
                <img
                  src={icon.svg.startsWith('/') ? `${BACKEND_URL}${icon.svg}` : icon.svg}
                  alt={icon.name}
                  className="w-16 h-16 object-contain group-hover:scale-110 transition-transform"
                />
              ) : (
                <div
                  className="group-hover:scale-110 transition-transform flex items-center justify-center"
                  style={{ width: 64, height: 64, color }}
                  dangerouslySetInnerHTML={{
                    __html: icon.svg
                      .replace(/currentColor/g, color)
                      .replace(/stroke-width="2"/g, `stroke-width="1.5"`)
                      .replace(/<svg/, `<svg width="64" height="64"`)
                  }}
                />
              )}
              <p className="mt-3 text-xs text-slate-600 text-center truncate w-full">{icon.name}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedIcon && (
        <IconLightbox
          icon={selectedIcon}
          color={color}
          onClose={() => setSelectedIcon(null)}
        />
      )}
    </>
  );
}
