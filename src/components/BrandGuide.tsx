import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import { ColorPalette } from './ColorPalette';
import { TypographyDisplay } from './TypographyDisplay';
import { IconSet } from './IconDisplay';
import type { BrandBranding } from '../types';
import { useBrand } from '../context/BrandContext';

interface BrandGuideProps {
  branding: BrandBranding;
  projectId?: string;
}

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function BrandGuide({ branding, projectId }: BrandGuideProps) {
  const { currentProject, updateProject } = useBrand();
  const [activeSection, setActiveSection] = useState('overview');
  const [showExportModal, setShowExportModal] = useState(false);


  const sections = [
    { id: 'overview', label: 'Resumen', icon: '📋' },
    { id: 'logo', label: 'Logo', icon: '🎨' },
    { id: 'colors', label: 'Colores', icon: '🎭' },
    { id: 'typography', label: 'Tipografía', icon: '✍️' },
    { id: 'icons', label: 'Iconos', icon: '⬡' },
    { id: 'mixer', label: 'Personalizar Mix', icon: '⚙️' },
  ];

  useEffect(() => {
    // Scroll to top when branding changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [branding]);

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Brand Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white">
              <div className="flex items-center gap-6">
                {branding.logo.startsWith('/') || branding.logo.startsWith('http') || branding.logo.startsWith('data:') ? (
                  <img
                    src={branding.logo.startsWith('/') ? `${BACKEND_URL}${branding.logo}` : branding.logo}
                    alt={`${branding.brandName} logo`}
                    className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur object-contain p-2"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-4xl font-bold"
                    dangerouslySetInnerHTML={{ __html: branding.logo }}
                  />
                )}
                <div>
                  <h1 className="text-4xl font-bold">{branding.brandName}</h1>
                  <p className="text-xl text-white/80 mt-1">{branding.tagline}</p>
                  <p className="text-white/60 mt-2">{branding.proposals.length} propuestas de branding generadas</p>
                </div>
              </div>
            </div>

            {/* Quick Overview */}
            <div className="grid md:grid-cols-3 gap-4">
              <div
                className="bg-white rounded-xl p-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveSection('colors')}
              >
                <p className="text-sm text-slate-500 mb-2">🎨 Paleta</p>
                <div className="flex -space-x-2">
                  {currentColors.slice(0, 4).map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white" style={{ backgroundColor: c.hex }} />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">{currentColors.length} colores</p>
              </div>

              <div
                className="bg-white rounded-xl p-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveSection('typography')}
              >
                <p className="text-sm text-slate-500 mb-2">✍️ Tipografía</p>
                <p className="font-semibold text-slate-800">{currentTypo.heading.name}</p>
                <p className="text-xs text-slate-400 mt-1">{currentTypo.body.name}</p>
              </div>

              <div
                className="bg-white rounded-xl p-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveSection('icons')}
              >
                <p className="text-sm text-slate-500 mb-2">⬡ Iconos</p>
                <p className="font-semibold text-slate-800">{branding.icons.length} iconos</p>
                <p className="text-xs text-slate-400 mt-1">Estilo concordante</p>
              </div>
            </div>

            {/* Proposals Overview */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">✨ Propuestas ({branding.proposals.length})</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {branding.proposals.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveSection('mixer');
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-violet-500 hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="flex -space-x-1 mb-2">
                      {p.colorScheme.slice(0, 3).map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{p.mood}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'logo':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">🎨 Logo Principal</h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div
                    className="aspect-square rounded-2xl flex items-center justify-center p-8"
                    style={{ background: `linear-gradient(135deg, ${currentColors[0].hex}20, ${currentColors[1].hex}20)` }}
                  >
                    {branding.logo.startsWith('/') || branding.logo.startsWith('http') || branding.logo.startsWith('data:') ? (
                      <img
                        src={branding.logo.startsWith('/') ? `${BACKEND_URL}${branding.logo}` : branding.logo}
                        alt={`${branding.brandName} logo`}
                        className="w-full max-w-xs object-contain"
                      />
                    ) : (
                      <div
                        className="w-full max-w-xs"
                        dangerouslySetInnerHTML={{ __html: branding.logo }}
                      />
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (branding.logo.startsWith('data:')) {
                          const link = document.createElement('a');
                          link.href = branding.logo;
                          link.download = `${branding.brandName}-logo.png`;
                          link.click();
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Descargar PNG
                    </button>
                    <button className="flex-1 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                      Descargar SVG
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Variaciones de color</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900 rounded-xl">
                        <p className="text-xs text-white/60 mb-2">Sobre fondo oscuro</p>
                        <div className="w-16 h-16 mx-auto rounded-xl bg-white flex items-center justify-center text-2xl font-bold" style={{ color: currentColors[1].hex }}>
                          {branding.brandName.charAt(0)}
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2">Sobre fondo claro</p>
                        <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: currentColors[0].hex }}>
                          {branding.brandName.charAt(0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Tamaños</h3>
                    <div className="flex items-end gap-6">
                      {[64, 48, 32, 24].map((size) => (
                        <div key={size} className="text-center">
                          <div
                            className="mx-auto rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ width: size, height: size, backgroundColor: currentColors[0].hex, fontSize: size * 0.5 }}
                          >
                            {branding.brandName.charAt(0)}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{size}px</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'colors':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">🎭 Paleta de Colores</h2>
              <ColorPalette colors={currentColors} />
            </div>

            {/* Color Usage Guide */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">📖 Guía de Uso</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentColors.map((color, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div
                      className="w-16 h-16 rounded-xl shadow-md flex-shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div>
                      <p className="font-semibold text-slate-800">{color.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{color.hex}</p>
                      <p className="text-xs text-slate-400 mt-1">{color.usage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contrast Test */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">⚖️ Pruebas de Contraste</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {currentColors.slice(0, 3).map((color, i) => (
                  <div key={i} className="space-y-2">
                    <div
                      className="p-4 rounded-xl text-center"
                      style={{ backgroundColor: color.hex, color: i === 2 ? color.hex : '#fff' }}
                    >
                      <p className="font-semibold">Texto en {color.name}</p>
                      <p className="text-sm opacity-80">Sample text</p>
                    </div>
                    <p className="text-xs text-center text-slate-500">Ratio: {i === 2 ? '4.5:1' : 'Alto contraste'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'typography':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">✍️ Tipografía</h2>
              <TypographyDisplay typography={currentTypo} />
            </div>

            {/* Font Download */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">📥 Descargar Fuentes</h3>
              <div className="space-y-3">
                <a
                  href={`https://fonts.google.com/specimen/${currentTypo.heading.googleFont}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-800">{currentTypo.heading.name}</p>
                    <p className="text-sm text-slate-500">Google Fonts - Títulos</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
                <a
                  href={`https://fonts.google.com/specimen/${currentTypo.body.googleFont}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-800">{currentTypo.body.name}</p>
                    <p className="text-sm text-slate-500">Google Fonts - Cuerpo</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Usage Examples */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">📝 Ejemplos de Uso</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-slate-500 mb-2">Encabezados (H1)</p>
                  <p
                    className="text-4xl font-bold text-slate-900"
                    style={{ fontFamily: currentTypo.heading.fontFamily }}
                  >
                    Título Principal de Página
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-2">Subencabezados (H2)</p>
                  <p
                    className="text-2xl font-semibold text-slate-800"
                    style={{ fontFamily: currentTypo.heading.fontFamily }}
                  >
                    Subtítulo de Sección
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-2">Párrafos</p>
                  <p
                    className="text-base text-slate-600 leading-relaxed"
                    style={{ fontFamily: currentTypo.body.fontFamily }}
                  >
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-2">Botones</p>
                  <div className="flex gap-3">
                    <button
                      className="px-6 py-3 rounded-lg font-semibold"
                      style={{ backgroundColor: currentColors[0].hex, color: '#fff' }}
                    >
                      Botón Primario
                    </button>
                    <button
                      className="px-6 py-3 rounded-lg font-semibold border-2"
                      style={{ borderColor: currentColors[1].hex, color: currentColors[1].hex }}
                    >
                      Botón Secundario
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'icons':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">⬡ Sistema de Iconos</h2>
              <p className="text-slate-600 mb-6">
                Un conjunto de {branding.icons.length} iconos diseñados con un estilo concordante para mantener la consistencia visual de tu marca.
              </p>
              <IconSet icons={branding.icons} color={currentColors[0].hex} />
            </div>
          </div>
        );

      case 'mixer':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">⚙️ Branding Mixer</h2>
              <p className="text-slate-500 mb-8">Personaliza tu branding combinando lo mejor de cada propuesta generada.</p>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Color Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>🎨</span> Paleta de Colores
                  </h3>
                  <div className="space-y-2">
                    {branding.proposals.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const newBranding = {
                            ...branding,
                            selectedComponents: {
                              ...branding.selectedComponents,
                              colorProposalId: p.id
                            }
                          };
                          if (currentProject) {
                            updateProject({ ...currentProject, branding: newBranding });
                          }
                        }}
                        className={cn(
                          "w-full p-3 rounded-xl border-2 transition-all text-left flex items-center justify-between",
                          branding.selectedComponents?.colorProposalId === p.id
                            ? "border-violet-500 bg-violet-50"
                            : "border-slate-100 hover:border-slate-300"
                        )}
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">Propuesta {p.id}</p>
                          <div className="flex gap-1 mt-1">
                            {p.colorScheme.slice(0, 4).map((c, i) => (
                              <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                        {branding.selectedComponents?.colorProposalId === p.id && (
                          <span className="text-violet-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>✍️</span> Tipografía
                  </h3>
                  <div className="space-y-2">
                    {branding.proposals.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const newBranding = {
                            ...branding,
                            selectedComponents: {
                              ...branding.selectedComponents,
                              typographyProposalId: p.id
                            }
                          };
                          if (currentProject) {
                            updateProject({ ...currentProject, branding: newBranding });
                          }
                        }}
                        className={cn(
                          "w-full p-3 rounded-xl border-2 transition-all text-left flex items-center justify-between",
                          branding.selectedComponents?.typographyProposalId === p.id
                            ? "border-violet-500 bg-violet-50"
                            : "border-slate-100 hover:border-slate-300"
                        )}
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">Propuesta {p.id}</p>
                          <p className="text-sm font-medium mt-1 truncate">{p.typography.titulo}</p>
                        </div>
                        {branding.selectedComponents?.typographyProposalId === p.id && (
                          <span className="text-violet-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood/Style Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>✨</span> Estilo Visual (Mood)
                  </h3>
                  <div className="space-y-2">
                    {branding.proposals.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const newBranding = {
                            ...branding,
                            selectedComponents: {
                              ...branding.selectedComponents,
                              moodProposalId: p.id
                            }
                          };
                          if (currentProject) {
                            updateProject({ ...currentProject, branding: newBranding });
                          }
                        }}
                        className={cn(
                          "w-full p-3 rounded-xl border-2 transition-all text-left flex items-center justify-between",
                          branding.selectedComponents?.moodProposalId === p.id
                            ? "border-violet-500 bg-violet-50"
                            : "border-slate-100 hover:border-slate-300"
                        )}
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">Propuesta {p.id}</p>
                          <p className="text-sm font-medium mt-1 capitalize">{p.mood}</p>
                        </div>
                        {branding.selectedComponents?.moodProposalId === p.id && (
                          <span className="text-violet-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                <span className="text-xl">💡</span>
                <p className="text-sm text-amber-800">
                  Las selecciones que hagas aquí actualizarán automáticamente las pestañas de <b>Resumen</b>, <b>Colores</b> y <b>Tipografía</b> con la nueva combinación.
                </p>
              </div>
            </div>
          </div>
        );


      default:
        return null;
    }
  };

  // Combinar componentes si hay selección personalizada
  const getDisplayData = () => {
    const components = branding.selectedComponents;

    let displayColors = branding.colors;
    let displayTypography = branding.typography;

    if (components?.colorProposalId) {
      const p = branding.proposals.find(prop => prop.id === components.colorProposalId);
      if (p) {
        displayColors = p.colorScheme.map((hex, i) => ({
          name: i === 0 ? "Primario" : i === 1 ? "Secundario" : i === 2 ? "Acento" : `Color ${i + 1}`,
          hex,
          usage: i === 0 ? "Color principal" : "Color de apoyo"
        }));
      }
    }

    if (components?.typographyProposalId) {
      const p = branding.proposals.find(prop => prop.id === components.typographyProposalId);
      if (p) {
        displayTypography = {
          heading: {
            name: p.typography.titulo,
            fontFamily: `${p.typography.titulo}, sans-serif`,
            usage: "Títulos",
            googleFont: p.typography.titulo.replace(/\s+/g, '+')
          },
          body: {
            name: p.typography.cuerpo,
            fontFamily: `${p.typography.cuerpo}, sans-serif`,
            usage: "Cuerpo",
            googleFont: p.typography.cuerpo.replace(/\s+/g, '+')
          }
        };
      }
    }

    return { colors: displayColors, typography: displayTypography };
  };

  const { colors: currentColors, typography: currentTypo } = getDisplayData();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveSection('overview')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </div>
                <span className="font-bold text-slate-900">{branding.brandName}</span>
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exportar Branding
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8 overflow-x-auto">
          <nav className="flex gap-2 min-w-max">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap',
                  activeSection === section.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                )}
              >
                <span className="mr-2">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {renderSection()}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in">
            <h3 className="text-xl font-bold text-slate-900 mb-4">📥 Exportar Branding</h3>
            <p className="text-slate-600 mb-6">
              Descarga tu guía de marca completa en el formato que prefieras.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (projectId) {
                    window.open(`${BACKEND_URL}/api/projects/${projectId}/export/pdf`, '_blank');
                  }
                }}
                className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-violet-500 hover:bg-violet-50 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900">PDF</p>
                  <p className="text-sm text-slate-500">Documento profesional de marca</p>
                </div>
              </button>
              <button
                onClick={() => {
                  if (projectId) {
                    window.open(`${BACKEND_URL}/api/projects/${projectId}/export/contents`, '_blank');
                  }
                }}
                className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-violet-500 hover:bg-violet-50 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M8 13h8" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900">ZIP de Contenidos</p>
                  <p className="text-sm text-slate-500">Logotipo e iconos PNG</p>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowExportModal(false)}
              className="mt-4 w-full px-4 py-2 text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
