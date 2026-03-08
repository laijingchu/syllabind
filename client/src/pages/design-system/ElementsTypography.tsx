import DesignSystemLayout, { CodeBlock, TokenRow } from './DesignSystemLayout';

const fontFamilies = [
  {
    name: 'Display',
    token: '--font-display',
    value: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif',
    tw: 'font-display',
    usage: 'Headings, page titles, branding',
    personality: 'Warm and distinctive. Bricolage Grotesque has subtle quirkiness in its letterforms that gives Syllabind a human, editorial feel — like the cover of a well-designed book.',
  },
  {
    name: 'Text',
    token: '--font-text',
    value: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    tw: 'font-text',
    usage: 'Body text, UI labels, descriptions, form inputs',
    personality: 'Rounded and contemporary. Plus Jakarta Sans has soft, geometric letterforms that complement Bricolage Grotesque\'s warmth while staying clean and readable at small sizes.',
  },
];

const typeScale = [
  { label: 'text-xs', size: '12px', classes: 'text-xs', usage: 'Captions, timestamps, fine print' },
  { label: 'text-sm', size: '14px', classes: 'text-sm', usage: 'Secondary text, helper labels, descriptions' },
  { label: 'text-base', size: '16px', classes: 'text-base', usage: 'Default body text, paragraph content' },
  { label: 'text-lg', size: '18px', classes: 'text-lg', usage: 'Lead paragraphs, emphasized content' },
  { label: 'text-xl', size: '20px', classes: 'text-xl', usage: 'Section subheadings' },
  { label: 'text-2xl', size: '24px', classes: 'text-2xl', usage: 'Card titles, secondary headings' },
  { label: 'text-3xl', size: '30px', classes: 'text-3xl', usage: 'Page titles, primary headings' },
  { label: 'text-4xl', size: '36px', classes: 'text-4xl', usage: 'Hero headings, marketing display' },
];

export default function ElementsTypography() {
  return (
    <DesignSystemLayout>
      <div className="space-y-12">
        <div>
          <h1 className="font-display text-3xl font-medium mb-2">Typography</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Two typefaces create a clear visual hierarchy: one for personality and emphasis, one for
            clarity and reading comfort. This pairing gives the product editorial warmth
            without sacrificing the readability of a functional interface.
          </p>
        </div>

        {/* Font Families */}
        <section className="space-y-6">
          <h2 className="font-display text-xl font-medium">Typefaces</h2>
          {fontFamilies.map(f => (
            <div key={f.name} className="border border-border rounded-lg overflow-hidden">
              <div className="p-6 space-y-3">
                <p className={`text-3xl ${f.tw}`}>
                  The quick brown fox jumps over the lazy dog
                </p>
                <p className={`text-lg text-muted-foreground ${f.tw}`}>
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
                </p>
              </div>
              <div className="border-t border-border p-4 bg-muted space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{f.name}</span>
                  <code className="text-xs font-mono text-primary bg-muted px-1.5 py-0.5 rounded">{f.tw}</code>
                  <span className="text-sm text-muted-foreground">{f.usage}</span>
                </div>
                <p className="text-base text-muted-foreground">{f.personality}</p>
              </div>
            </div>
          ))}
        </section>

        {/* How they work together */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">How They Work Together</h2>
          <p className="text-base text-muted-foreground">
            The body font (Plus Jakarta Sans) is the global default — all text renders in Plus Jakarta Sans unless explicitly
            changed. Display (Bricolage Grotesque) is applied selectively to headings and branded elements.
            This keeps the reading experience clean while letting key moments stand out.
          </p>
          <div className="border border-border rounded-lg p-6 space-y-4 bg-card">
            <h3 className="font-display text-2xl font-medium">Digital Minimalism</h3>
            <p className="text-muted-foreground text-sm">by Jane Smith &middot; 6 weeks &middot; 24 steps</p>
            <p>
              Learn to build a healthier relationship with technology through intentional
              practices and mindful screen habits. Each week introduces a new concept with
              readings and reflective exercises.
            </p>
            <p className="text-sm text-muted-foreground italic mt-2">
              The heading uses font-display (Bricolage Grotesque). Everything else uses font-text (Plus Jakarta Sans).
            </p>
          </div>
        </section>

        {/* Type Scale */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Size Scale</h2>
          <p className="text-base text-muted-foreground">
            A consistent size scale creates visual hierarchy. Smaller sizes are for supporting information,
            larger sizes draw the eye to primary content. Most UI text should live in the 14–16px range.
          </p>
          <div className="space-y-0 border border-border rounded-lg overflow-hidden">
            {typeScale.map((t, i) => (
              <div
                key={t.label}
                className={`flex items-baseline gap-6 px-4 py-3 ${i !== typeScale.length - 1 ? 'border-b border-border' : ''}`}
              >
                <code className="text-xs font-mono text-primary w-20 shrink-0">{t.label}</code>
                <span className="text-sm text-muted-foreground w-12 shrink-0">{t.size}</span>
                <span className={`${t.classes} flex-1`}>The quick brown fox</span>
                <span className="text-sm text-muted-foreground hidden sm:block">{t.usage}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Font Weights */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Weight Scale</h2>
          <p className="text-base text-muted-foreground">
            Font weight is a primary tool for creating hierarchy within the same size.
            Medium (500) is the most-used weight for interactive labels and section headers.
            Bold is reserved for strong emphasis and should be used sparingly.
          </p>
          <div className="border border-border rounded-lg overflow-hidden">
            {[
              { label: 'font-normal', weight: '400', classes: 'font-normal', usage: 'Body text, descriptions, long-form reading' },
              { label: 'font-medium', weight: '500', classes: 'font-medium', usage: 'Section headings, button labels, nav items' },
              { label: 'font-semibold', weight: '600', classes: 'font-semibold', usage: 'Strong emphasis, card titles' },
              { label: 'font-bold', weight: '700', classes: 'font-bold', usage: 'Reserved. Use sparingly for maximum contrast' },
            ].map((w, i, arr) => (
              <div
                key={w.label}
                className={`flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 ${i !== arr.length - 1 ? 'border-b border-border' : ''}`}
              >
                <code className="text-xs font-mono text-primary w-32 shrink-0">{w.label}</code>
                <span className="text-sm text-muted-foreground w-12 shrink-0">{w.weight}</span>
                <span className={`text-lg font-display ${w.classes} w-36 md:w-48 shrink-0`}>Bricolage Grotesque</span>
                <span className={`text-lg font-text ${w.classes} w-40 shrink-0`}>Plus Jakarta Sans</span>
                <span className="text-sm text-muted-foreground hidden lg:block">{w.usage}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Letter Spacing */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Letter Spacing</h2>
          <p className="text-base text-muted-foreground">
            Headings use tighter letter spacing (<code className="bg-muted px-1 rounded">tracking-tight</code>) to
            feel more compact and intentional. Body text uses the default spacing for optimal readability.
          </p>
          <div className="border border-border rounded-lg p-6 bg-card space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">tracking-tight (headings)</p>
              <p className="font-display text-2xl font-medium tracking-tight">Digital Minimalism for the Modern Reader</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">tracking-normal (body)</p>
              <p className="font-display text-2xl font-medium tracking-normal">Digital Minimalism for the Modern Reader</p>
            </div>
          </div>
        </section>

        {/* Prose Styling */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-medium">Rich Content Lists</h2>
          <p className="text-base text-muted-foreground">
            Inside binder descriptions and step content, the <code className="bg-muted px-1 rounded">.prose</code> class
            restores native list formatting. This matters for curator-authored content where nested lists
            are common for learning objectives and reading breakdowns.
          </p>
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="prose">
              <ul>
                <li>First level uses disc markers
                  <ul>
                    <li>Second level uses circle markers
                      <ul>
                        <li>Third level uses square markers</li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li>Another top-level item</li>
              </ul>
              <ol>
                <li>Ordered lists use decimal numbers</li>
                <li>Second item</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </DesignSystemLayout>
  );
}
