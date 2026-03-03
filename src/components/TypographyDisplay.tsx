interface TypographyDisplayProps {
  typography: {
    heading: { name: string; fontFamily: string; usage: string; googleFont: string };
    body: { name: string; fontFamily: string; usage: string; googleFont: string };
  };
}

export function TypographyDisplay({ typography }: TypographyDisplayProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Heading Font */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded-lg">Títulos</span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Preview</p>
            <p
              className="text-2xl font-bold text-slate-900 leading-tight overflow-hidden break-words"
              style={{ fontFamily: typography.heading.fontFamily }}
            >
              ABCDEFGHIJKLM<br />NÑOPQRSTUVWXYZ
            </p>
            <p
              className="text-2xl font-bold text-slate-900 leading-tight mt-2"
              style={{ fontFamily: typography.heading.fontFamily }}
            >
              0123456789
            </p>
          </div>

          <hr className="border-slate-100" />

          <div>
            <p className="text-sm text-slate-600">{typography.heading.name}</p>
            <p className="text-xs text-slate-400 mt-1">{typography.heading.usage}</p>
          </div>

          <code className="block bg-slate-100 p-2 rounded-lg text-xs text-slate-600 font-mono overflow-x-auto">
            font-family: '{typography.heading.name}', sans-serif;
          </code>
        </div>
      </div>

      {/* Body Font */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg">Cuerpo</span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Preview</p>
            <p
              className="text-base text-slate-700 leading-relaxed"
              style={{ fontFamily: typography.body.fontFamily }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
            </p>
            <p
              className="text-sm text-slate-500 mt-3"
              style={{ fontFamily: typography.body.fontFamily }}
            >
              ABCDEFGHIJKLMNÑOPQRSTUVWXYZ<br />
              abcdefghijklmnñopqrstuvwxyz<br />
              0123456789
            </p>
          </div>

          <hr className="border-slate-100" />

          <div>
            <p className="text-sm text-slate-600">{typography.body.name}</p>
            <p className="text-xs text-slate-400 mt-1">{typography.body.usage}</p>
          </div>

          <code className="block bg-slate-100 p-2 rounded-lg text-xs text-slate-600 font-mono overflow-x-auto">
            font-family: '{typography.body.name}', sans-serif;
          </code>
        </div>
      </div>
    </div>
  );
}

interface TypographyComparisonProps {
  typography: {
    heading: { name: string; fontFamily: string; usage: string };
    body: { name: string; fontFamily: string; usage: string };
  };
  title?: string;
}

export function TypographyComparison({ typography, title }: TypographyComparisonProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
      {title && <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded-lg">Títulos</span>
            <span className="text-sm text-slate-600">{typography.heading.name}</span>
          </div>
          <p
            className="text-3xl font-bold text-slate-900"
            style={{ fontFamily: typography.heading.fontFamily }}
          >
            El veloz murciélago hindú
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg">Texto</span>
            <span className="text-sm text-slate-600">{typography.body.name}</span>
          </div>
          <p
            className="text-base text-slate-600 leading-relaxed"
            style={{ fontFamily: typography.body.fontFamily }}
          >
            La cigüeña tocaba un saxofón detrás del palenque de paja.
          </p>
        </div>
      </div>
    </div>
  );
}
