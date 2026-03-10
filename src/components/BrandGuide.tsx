import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import { ColorPalette } from './ColorPalette';
import { TypographyDisplay } from './TypographyDisplay';
import { IconSet } from './IconDisplay';
import type { BrandBranding } from '../types';
import { useBrand } from '../context/BrandContext';
import { useTranslation } from '../hooks/useTranslation';

interface BrandGuideProps {
  branding: BrandBranding;
  projectId?: string;
}

const BACKEND_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

export function BrandGuide({ branding, projectId }: BrandGuideProps) {
  const { currentProject, updateProject } = useBrand();
  const [activeSection, setActiveSection] = useState('guideline');
  const [showExportModal, setShowExportModal] = useState(false);
  const { t } = useTranslation();

  const sections = [
    { id: 'guideline', label: 'Guía de Marca', icon: '📖' },
    { id: 'mockups', label: 'Aplicaciones', icon: '🖼️' },
    { id: 'logo', label: t('brandGuide', 'tabLogo'), icon: '🎨' },
    { id: 'colors', label: t('brandGuide', 'tabColors'), icon: '🎭' },
    { id: 'typography', label: t('brandGuide', 'tabTypography'), icon: '✍️' },
    { id: 'icons', label: t('brandGuide', 'tabIcons'), icon: '⬡' },
    { id: 'mixer', label: t('brandGuide', 'tabMixer'), icon: '⚙️' },
  ];

  // CENTRALIZED FINAL BRAND SYSTEM BUILDER
  const getFinalBrandSystem = () => {
    const components = branding.selectedComponents;

    // 1. Base Strategy & Main Terrace
    const selectedProposalId = components?.moodProposalId || branding.selectedProposalId || branding.proposals[0].id;
    const selectedProposal = branding.proposals.find(p => p.id === selectedProposalId) || branding.proposals[0];

    // 2. Resolve Logo
    let logo = branding.logo;
    if (components?.logoProposalId) {
      const p = branding.proposals.find(prop => prop.id === components.logoProposalId);
      if (p?.logo) logo = p.logo;
    }

    // 3. Resolve Palette
    let colors = branding.colors;
    if (components?.colorProposalId) {
      const p = branding.proposals.find(prop => prop.id === components.colorProposalId);
      if (p) {
        colors = p.colorScheme.map((hex, i) => ({
          name: i === 0 ? "Primario" : i === 1 ? "Secundario" : i === 2 ? "Acento" : i === 3 ? "Neutral Light" : i === 4 ? "Neutral Dark" : "Background",
          hex,
          usage: i === 0 ? "Identidad" : i === 1 ? "Apoyo" : i === 2 ? "Acento" : "Superficies"
        }));
      }
    }

    // 4. Resolve Typography
    let typography = branding.typography;
    if (components?.typographyProposalId) {
      const p = branding.proposals.find(prop => prop.id === components.typographyProposalId);
      if (p) {
        typography = {
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

    // 5. Resolve Icons
    let icons = branding.icons;
    if (components?.iconsProposalId) {
      const p = branding.proposals.find(prop => prop.id === components.iconsProposalId);
      if (p?.icons) icons = p.icons;
    }

    return {
      logo,
      colors,
      typography,
      icons,
      strategy: branding.strategy,
      currentProposal: selectedProposal
    };
  };

  const finalSystem = getFinalBrandSystem();
  const { colors: currentColors, typography: currentTypo, logo: currentLogo, icons: currentIcons, currentProposal } = finalSystem;

  useEffect(() => {
    // Scroll to top when branding changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [branding]);

  const renderSection = () => {
    switch (activeSection) {
      case 'guideline':
        return (
          <div className="space-y-12 animate-fade-in pb-20">
            {/* 1. Brand Overview & DNA */}
            <section className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-pink-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                  <div>
                    <span className="text-cyan-600 font-bold tracking-widest text-sm uppercase mb-2 block">Brand Identity</span>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">{branding.brandName}</h1>
                    <p className="text-xl text-slate-500 mt-2 font-medium italic">"{branding.tagline}"</p>
                  </div>
                  {branding.strategy && (
                    <div className="flex flex-wrap gap-2">
                      {branding.strategy.brand_personality.map((p, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold uppercase tracking-wider">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600 text-sm">🎯</span>
                      Posicionamiento
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-lg">
                      {branding.strategy?.brand_positioning || "Identidad estratégica única enfocada en la innovación y excelencia visual."}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 text-sm">👥</span>
                      Audiencia Objetivo
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-lg">
                      {branding.strategy?.target_audience || "Público moderno que valora el diseño de vanguardia y la funcionalidad intuitiva."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Logo Universe */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg">L</span>
                Universo de Logo
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-slate-900 rounded-3xl p-12 flex items-center justify-center min-h-[400px] shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                  <div className="relative z-10 transition-transform duration-500 group-hover:scale-110">
                    {currentLogo.startsWith('/') || currentLogo.startsWith('http') || currentLogo.startsWith('data:') ? (
                      <img
                        src={currentLogo.startsWith('/') ? `${BACKEND_URL}${currentLogo}` : currentLogo}
                        alt={branding.brandName}
                        className="max-w-[280px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/5 p-8 rounded-[40px] backdrop-blur-sm border border-white/10"
                      />
                    ) : (
                      <div
                        className="max-w-xs w-full drop-shadow-2xl"
                        dangerouslySetInnerHTML={{ __html: currentLogo }}
                      />
                    )}
                  </div>
                  <div className="absolute bottom-6 left-8">
                    <p className="text-white/40 text-xs font-mono uppercase tracking-[0.3em]">Primary Symbol / Master Logo</p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-2 block">Creative Direction</span>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">{currentProposal.name}</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Mood / Feeling</p>
                        <p className="text-slate-700 font-medium capitalize">{currentProposal.mood}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Visual Concept</p>
                        <p className="text-slate-600 text-sm leading-relaxed">{currentProposal.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 shadow-sm" />
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-400 shadow-sm" />
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-white shadow-sm" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">VER. 1.0</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Master Palette & 4. Typography */}
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Palette */}
              <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center text-lg">P</span>
                  Sistema Cromático
                </h2>
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {currentColors.slice(0, 4).map((c, i) => (
                      <div key={i} className="group relative">
                        <div className="aspect-[4/3] rounded-2xl shadow-inner transition-transform group-hover:scale-[1.02]" style={{ backgroundColor: c.hex }} />
                        <div className="mt-3">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{c.name}</p>
                          <p className="text-sm font-black text-slate-800 font-mono">{c.hex.toUpperCase()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-100">
                    {currentColors.slice(4, 6).map((c, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl border border-slate-200 shadow-sm" style={{ backgroundColor: c.hex }} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{c.name}</p>
                          <p className="text-xs font-black text-slate-700 font-mono">{c.hex.toUpperCase()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Typography */}
              <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center text-lg">T</span>
                  Arquitectura Tipográfica
                </h2>
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 h-full flex flex-col justify-between">
                  <div className="space-y-8">
                    <div>
                      <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-[10px] font-bold rounded-lg uppercase tracking-wider mb-4 inline-block">Headline / Primary</span>
                      <h3 className="text-4xl font-black text-slate-900 leading-tight mb-2 truncate" style={{ fontFamily: currentTypo.heading.fontFamily }}>
                        {currentTypo.heading.name}
                      </h3>
                      <p className="text-slate-500 font-medium text-sm">Uso principal para títulos, encabezados y elementos de alto impacto.</p>
                    </div>
                    <div>
                      <span className="px-3 py-1 bg-pink-100 text-pink-700 text-[10px] font-bold rounded-lg uppercase tracking-wider mb-4 inline-block">Body / Secondary</span>
                      <p className="text-lg text-slate-700 leading-relaxed mb-2" style={{ fontFamily: currentTypo.body.fontFamily }}>
                        {currentTypo.body.name} - Diseñada para legibilidad óptima en bloques de texto y contenido extenso.
                      </p>
                      <p className="text-slate-400 text-xs italic">ABCDEFGHIJKLMNÑOPQRSTUVWXYZ / abcdefghijklmnñopqrstuvwxyz</p>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-mono text-slate-400 text-right uppercase tracking-[0.2em]">Google Fonts Hierarchy System</p>
                  </div>
                </div>
              </section>
            </div>

            {/* 5. Icon System */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white flex items-center justify-center text-lg">I</span>
                Sistema Visual de Iconos
              </h2>
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                  {branding.icons.map((icon, i) => (
                    <div key={i} className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center group hover:bg-cyan-500 transition-all duration-300">
                      {icon.svg.startsWith('/') || icon.svg.startsWith('http') || icon.svg.startsWith('data:') ? (
                        <img src={icon.svg.startsWith('/') ? `${BACKEND_URL}${icon.svg}` : icon.svg} alt={icon.name} className="w-10 h-10 object-contain group-hover:invert group-hover:brightness-200 transition-all" />
                      ) : (
                        <div
                          className="w-10 h-10 text-slate-400 group-hover:text-white transition-all"
                          dangerouslySetInnerHTML={{ __html: icon.svg.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"') }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-200 md:w-fit">
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full animate-pulse bg-cyan-500" />
                    Estilo visual coherente basado en el territorio '{currentProposal.mood}'
                  </p>
                </div>
              </div>
            </section>
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
                    {currentLogo.startsWith('/') || currentLogo.startsWith('http') || currentLogo.startsWith('data:') ? (
                      <img
                        src={currentLogo.startsWith('/') ? `${BACKEND_URL}${currentLogo}` : currentLogo}
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
                        if (currentLogo.startsWith('data:')) {
                          const link = document.createElement('a');
                          link.href = currentLogo;
                          link.download = `${branding.brandName}-logo.png`;
                          link.click();
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Descargar PNG
                    </button>
                    <button
                      onClick={() => {
                        if (projectId) {
                          window.open(`${window.location.origin}/api/projects/${projectId}/export/pdf`, '_blank');
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Descargar Guía
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
                Un conjunto de {currentIcons.length} iconos diseñados con un estilo concordante para mantener la consistencia visual de tu marca.
              </p>
              <IconSet icons={currentIcons} color={currentColors[0].hex} />
            </div>
          </div>
        );

      case 'mockups':
        return (
          <div className="space-y-16 animate-fade-in pb-20">
            {/* 1. Website Hero Mockup */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center text-lg">W</span>
                Website Experience
              </h2>
              <div className="bg-white rounded-[2.5rem] p-4 shadow-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-3 flex items-center gap-2 rounded-t-[2rem]">
                  <div className="flex gap-1.5 px-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 max-w-md mx-auto h-6 bg-white rounded-md border border-slate-200 flex items-center px-3 text-[10px] text-slate-400 font-mono italic">
                    https://{branding.brandName.toLowerCase().replace(/\s+/g, '')}.com
                  </div>
                </div>
                <div
                  className="min-h-[400px] flex flex-col"
                  style={{ backgroundColor: currentColors[5].hex }}
                >
                  <nav className="p-6 flex items-center justify-between border-b border-black/5">
                    <div className="h-8 w-auto">
                      {currentLogo.startsWith('/') || currentLogo.startsWith('http') || currentLogo.startsWith('data:') ? (
                        <img src={currentLogo.startsWith('/') ? `${BACKEND_URL}${currentLogo}` : currentLogo} className="h-full object-contain" alt="Logo" />
                      ) : (
                        <div className="h-full" dangerouslySetInnerHTML={{ __html: currentLogo.replace(/width="\d+"/, 'height="100%"') }} />
                      )}
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-900" style={{ fontFamily: currentTypo.body.fontFamily }}>
                      <span>Home</span>
                      <span>Product</span>
                      <span>About</span>
                      <button className="px-6 py-2 rounded-full text-white transition-opacity hover:opacity-90" style={{ backgroundColor: currentColors[0].hex }}>Start</button>
                    </div>
                  </nav>
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
                    <h1 className="text-6xl font-black text-slate-900 leading-[1.1] max-w-3xl" style={{ fontFamily: currentTypo.heading.fontFamily }}>
                      Elevate your <span style={{ color: currentColors[0].hex }}>digital journey</span> today.
                    </h1>
                    <p className="text-slate-500 text-lg max-w-xl" style={{ fontFamily: currentTypo.body.fontFamily }}>
                      Revolutionizing the industry with a focus on {branding.tagline.toLowerCase()}.
                    </p>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-lg border border-slate-100" style={{ color: currentColors[2].hex }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* 2. Mobile Mockup */}
              <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center text-lg">M</span>
                  Mobile Interface
                </h2>
                <div className="flex justify-center">
                  <div className="w-[280px] h-[580px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl relative border-[6px] border-slate-800">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />
                    <div
                      className="w-full h-full rounded-[2.2rem] overflow-hidden flex flex-col"
                      style={{ backgroundColor: currentColors[5].hex }}
                    >
                      <div className="h-32 p-6 flex items-end" style={{ backgroundColor: currentColors[0].hex }}>
                        <div className="w-10 h-10 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center text-white">
                          {currentIcons[0] && (
                            <div className="w-6 h-6" dangerouslySetInnerHTML={{ __html: currentIcons[0].svg.replace(/currentColor/g, '#fff') }} />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 p-6 space-y-6">
                        <div className="space-y-2">
                          <div className="h-6 w-3/4 bg-slate-900/10 rounded-md" />
                          <h4 className="text-xl font-black text-slate-900" style={{ fontFamily: currentTypo.heading.fontFamily }}>Upcoming Tasks</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {currentIcons.slice(1, 5).map((icon, i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${currentColors[i + 1]?.hex || currentColors[0].hex}15`, color: currentColors[i + 1]?.hex || currentColors[0].hex }}>
                                <div className="w-5 h-5 font-bold" dangerouslySetInnerHTML={{ __html: icon.svg }} />
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{icon.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="h-20 bg-white border-t border-slate-100 px-6 flex items-center justify-between">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ color: currentColors[0].hex }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                        </div>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-white" style={{ backgroundColor: currentColors[0].hex }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Social Media & Card Mockup */}
              <div className="space-y-12">
                <section className="space-y-6">
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center text-lg">S</span>
                    Social Presence
                  </h2>
                  <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                    <div className="relative">
                      <div className="h-32 w-full rounded-2xl bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${currentColors[0].hex}, ${currentColors[1].hex})` }} />
                      <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-2xl bg-white p-1.5 shadow-xl">
                        <div className="w-full h-full rounded-xl flex items-center justify-center overflow-hidden bg-slate-900">
                          {currentLogo.startsWith('/') || currentLogo.startsWith('http') || currentLogo.startsWith('data:') ? (
                            <img src={currentLogo.startsWith('/') ? `${BACKEND_URL}${currentLogo}` : currentLogo} className="w-12 h-12 object-contain" alt="Ava" />
                          ) : (
                            <div className="w-12 h-12" dangerouslySetInnerHTML={{ __html: currentLogo }} />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-14 space-y-1 px-2">
                      <h3 className="text-xl font-black text-slate-900" style={{ fontFamily: currentTypo.heading.fontFamily }}>{branding.brandName}</h3>
                      <p className="text-cyan-600 font-bold text-xs uppercase tracking-widest">@{branding.brandName.toLowerCase().replace(/\s+/g, '')}</p>
                      <p className="text-slate-500 text-sm mt-3 leading-relaxed" style={{ fontFamily: currentTypo.body.fontFamily }}>
                        {branding.tagline}. Professional solution for modern businesses.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center text-lg">B</span>
                    Personal Branding
                  </h2>
                  <div className="bg-slate-100 rounded-3xl p-8 flex flex-col items-center gap-6">
                    <div className="w-full max-w-sm aspect-[1.75/1] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900 rounded-bl-[100px] transition-all group-hover:w-full group-hover:h-full group-hover:rounded-none group-hover:opacity-10 opacity-5" />
                      <div className="h-full flex flex-col justify-between p-8 relative z-10">
                        <div className="h-10 w-auto">
                          <div className="h-full flex items-center" dangerouslySetInnerHTML={{ __html: currentLogo.replace(/currentColor/g, currentColors[0].hex).replace(/width="\d+"/, 'height="100%"') }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Corporate Identity</p>
                          <h4 className="text-lg font-black text-slate-900" style={{ fontFamily: currentTypo.heading.fontFamily }}>{branding.brandName}</h4>
                        </div>
                      </div>
                      <div className="absolute bottom-0 right-0 w-2 h-full" style={{ backgroundColor: currentColors[2].hex }} />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        );

      case 'mixer':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">⚙️ Branding Mixer</h2>
              <p className="text-slate-500 mb-8">Personaliza tu branding combinando lo mejor de cada propuesta generada.</p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* 1. Logotipo Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>🎨</span> Logotipo
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
                              logoProposalId: p.id
                            }
                          };
                          if (currentProject) {
                            updateProject({ ...currentProject, branding: newBranding });
                          }
                        }}
                        className={cn(
                          "w-full p-3 rounded-xl border-2 transition-all text-left flex items-center justify-between",
                          (branding.selectedComponents?.logoProposalId === p.id || (!branding.selectedComponents?.logoProposalId && p.id === 1))
                            ? "border-cyan-500 bg-cyan-50"
                            : "border-slate-100 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-900 p-1 flex items-center justify-center">
                            {p.logo && (
                              <img src={p.logo.startsWith('/') ? `${BACKEND_URL}${p.logo}` : p.logo} className="w-full h-full object-contain" alt="Logo" />
                            )}
                          </div>
                          <p className="text-xs font-semibold uppercase text-slate-400">Propuesta {p.id}</p>
                        </div>
                        {(branding.selectedComponents?.logoProposalId === p.id || (!branding.selectedComponents?.logoProposalId && p.id === 1)) && (
                          <span className="text-cyan-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Color Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>🌈</span> Paleta de Colores
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
                          (branding.selectedComponents?.colorProposalId === p.id || (!branding.selectedComponents?.colorProposalId && p.id === 1))
                            ? "border-cyan-500 bg-cyan-50"
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
                        {(branding.selectedComponents?.colorProposalId === p.id || (!branding.selectedComponents?.colorProposalId && p.id === 1)) && (
                          <span className="text-cyan-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Typography Selection */}
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
                          (branding.selectedComponents?.typographyProposalId === p.id || (!branding.selectedComponents?.typographyProposalId && p.id === 1))
                            ? "border-cyan-500 bg-cyan-50"
                            : "border-slate-100 hover:border-slate-300"
                        )}
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">Propuesta {p.id}</p>
                          <p className="text-[10px] font-medium mt-1 truncate">{p.typography.titulo}</p>
                        </div>
                        {(branding.selectedComponents?.typographyProposalId === p.id || (!branding.selectedComponents?.typographyProposalId && p.id === 1)) && (
                          <span className="text-cyan-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Icon System Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>⬡</span> Iconografía
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
                              iconsProposalId: p.id
                            }
                          };
                          if (currentProject) {
                            updateProject({ ...currentProject, branding: newBranding });
                          }
                        }}
                        className={cn(
                          "w-full p-3 rounded-xl border-2 transition-all text-left flex items-center justify-between",
                          (branding.selectedComponents?.iconsProposalId === p.id || (!branding.selectedComponents?.iconsProposalId && p.id === 1))
                            ? "border-cyan-500 bg-cyan-50"
                            : "border-slate-100 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                            {p.icons?.slice(0, 3).map((icon, i) => (
                              <div key={i} className="w-5 h-5 rounded-md bg-slate-100 p-0.5 border border-white" dangerouslySetInnerHTML={{ __html: icon.svg }} />
                            ))}
                          </div>
                          <p className="text-xs font-semibold uppercase text-slate-400">Propuesta {p.id}</p>
                        </div>
                        {(branding.selectedComponents?.iconsProposalId === p.id || (!branding.selectedComponents?.iconsProposalId && p.id === 1)) && (
                          <span className="text-cyan-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Territory Strategy (Base) */}
              <div className="mt-8 pt-8 border-t border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span>✨</span> Estrategia Visual de Base (DNA)
                </h3>
                <div className="flex flex-wrap gap-3">
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
                        "px-6 py-3 rounded-2xl border-2 transition-all flex flex-col gap-1",
                        (branding.selectedComponents?.moodProposalId === p.id || (!branding.selectedComponents?.moodProposalId && p.id === 1))
                          ? "border-kwiq bg-kwiq text-white shadow-lg shadow-kwiq/20"
                          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Territorio {p.id}</span>
                      <span className="font-bold text-sm tracking-tight capitalize">{p.mood}</span>
                    </button>
                  ))}
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

};

return (
  <div className="min-h-screen bg-slate-50">
    {/* Header */}
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSection('logo')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/kwiq-logo.png" alt="Kwiq Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-slate-900">{branding.brandName}</span>
            </button>
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-kwiq hover:bg-kwiq-dark text-white rounded-xl font-medium transition-all shadow-md shadow-kwiq/10 hover:shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t('brandGuide', 'exportBranding')}
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
                  ? 'bg-kwiq text-white shadow-lg shadow-kwiq/20'
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
          <h3 className="text-xl font-bold text-slate-900 mb-4">📥 {t('brandGuide', 'exportBranding')}</h3>
          <p className="text-slate-600 mb-6">
            Descarga tu guía de marca completa en el formato que prefieras.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                if (projectId) {
                  const exportUrl = `${window.location.origin}/api/projects/${projectId}/export/pdf`;
                  window.open(exportUrl, '_blank');
                }
              }}
              className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-kwiq hover:bg-kwiq/5 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-900">{t('brandGuide', 'downloadPdf')}</p>
                <p className="text-sm text-slate-500">Documento profesional de marca</p>
              </div>
            </button>
            <button
              onClick={() => {
                if (projectId) {
                  const exportUrl = `${window.location.origin}/api/projects/${projectId}/export/contents`;
                  window.open(exportUrl, '_blank');
                }
              }}
              className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-kwiq hover:bg-kwiq/5 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M8 13h8" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-900">{t('brandGuide', 'downloadZip')}</p>
                <p className="text-sm text-slate-500">Logotipo e iconos PNG</p>
              </div>
            </button>
          </div>
          <button
            onClick={() => setShowExportModal(false)}
            className="mt-4 w-full px-4 py-2 text-slate-500 hover:text-slate-700 transition-colors"
          >
            {t('brandGuide', 'cancel')}
          </button>
        </div>
      </div>
    )}
  </div>
);
}
