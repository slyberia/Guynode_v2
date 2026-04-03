import React, { useState } from 'react';
import { ViewState } from '../types';
import { RouteParams } from '../utils/routing';
import { useCatalog } from '../context/CatalogContext';

interface AttributionPageProps {
  theme: 'light' | 'dark';
  navigate: (view: ViewState, params?: RouteParams) => void;
}

type CitationStyle = 'APA' | 'Chicago' | 'BibTeX' | 'MLA';

const STYLES: CitationStyle[] = ['APA', 'Chicago', 'BibTeX', 'MLA'];

function useCopyToClipboard(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return [copied, copy];
}

function TabBar({
  active,
  onChange,
}: {
  active: CitationStyle;
  onChange: (s: CitationStyle) => void;
}) {
  return (
    <div className="flex gap-1 mb-4" role="tablist">
      {STYLES.map((s) => (
        <button
          key={s}
          role="tab"
          aria-selected={active === s}
          onClick={() => onChange(s)}
          className={`px-3 py-1.5 text-xs font-mono font-semibold rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green-500 ${
            active === s
              ? 'bg-brand-green-600 dark:bg-gn-accent-dark text-white'
              : 'bg-gn-elevated dark:bg-gn-elevated-dark text-gn-foreground-muted dark:text-gn-foreground-muted-dark hover:text-gn-foreground dark:hover:text-gn-foreground-dark border border-gn-border dark:border-gn-border-dark'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function CitationBlock({ text }: { text: string }) {
  const [copied, copy] = useCopyToClipboard();
  return (
    <div className="relative">
      <pre className="font-mono text-sm bg-gn-surface-muted dark:bg-gn-surface-muted-dark border border-gn-border dark:border-gn-border-dark rounded p-4 whitespace-pre-wrap break-words text-gn-foreground dark:text-gn-foreground-dark leading-relaxed">
        {text}
      </pre>
      <button
        onClick={() => copy(text)}
        className="absolute top-3 right-3 text-xs font-mono px-2 py-1 rounded border border-gn-border dark:border-gn-border-dark bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground-muted dark:text-gn-foreground-muted-dark hover:text-gn-foreground dark:hover:text-gn-foreground-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green-500"
        aria-label="Copy citation to clipboard"
      >
        {copied ? 'copied ✓' : 'copy'}
      </button>
    </div>
  );
}

function platformCitation(style: CitationStyle): string {
  const year = new Date().getFullYear();
  const accessed = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const accessedDay = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const url = 'https://www.guynode.com';

  switch (style) {
    case 'APA':
      return `HPS Geospatial. (${year}). Guynode: Guyana Spatial Data Archive [Data archive]. ${url}`;
    case 'Chicago':
      return `HPS Geospatial. "Guynode: Guyana Spatial Data Archive." Data archive. Accessed ${accessed}. ${url}`;
    case 'BibTeX':
      return `@misc{guynode${year},\n  author    = {HPS Geospatial},\n  title     = {Guynode: Guyana Spatial Data Archive},\n  year      = {${year}},\n  url       = {${url}},\n  note      = {Accessed: ${accessed}}\n}`;
    case 'MLA':
      return `HPS Geospatial. "Guynode: Guyana Spatial Data Archive." www.guynode.com. Accessed ${accessedDay}.`;
  }
}

function datasetCitation(
  style: CitationStyle,
  dataset: {
    id: string;
    title: string;
    source: string;
    downloadUrl?: string;
    year?: string | number;
  }
): string {
  const source =
    dataset.source && dataset.source !== 'Unknown Source'
      ? dataset.source
      : 'HPS Geospatial';
  const year =
    dataset.year !== undefined && dataset.year !== null
      ? String(dataset.year)
      : String(new Date().getFullYear());
  const url = dataset.downloadUrl ?? 'https://www.guynode.com';
  const title = dataset.title;
  const id = dataset.id.replace(/[^a-zA-Z0-9]/g, '');

  const accessed = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const accessedDay = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  switch (style) {
    case 'APA':
      return `${source}. (${year}). ${title} [Dataset]. HPS Geospatial Guynode Archive. ${url}`;
    case 'Chicago':
      return `${source}. "${title}." Dataset. HPS Geospatial Guynode Archive, ${year}. ${url}`;
    case 'BibTeX':
      return `@dataset{${id}${year},\n  author    = {${source}},\n  title     = {${title}},\n  year      = {${year}},\n  publisher = {HPS Geospatial Guynode Archive},\n  url       = {${url}},\n  note      = {Accessed: ${accessed}}\n}`;
    case 'MLA':
      return `${source}. "${title}." HPS Geospatial Guynode Archive, ${year}. ${url}. Accessed ${accessedDay}.`;
  }
}

const LICENSE_ROWS = [
  {
    tag: 'CC BY 4.0',
    tagColor: 'bg-brand-green-600/10 dark:bg-gn-accent-dark/10 text-brand-green-600 dark:text-gn-accent-dark border border-brand-green-600/30 dark:border-gn-accent-dark/30',
    title: 'Original HPS Geospatial datasets',
    body: 'Data produced directly by HPS Geospatial is released under Creative Commons Attribution 4.0. You may use, share, and adapt it freely with attribution.',
  },
  {
    tag: 'Gov open data',
    tagColor: 'bg-brand-gold-500/10 dark:bg-gn-accent-gold/10 text-brand-gold-600 dark:text-gn-accent-gold border border-brand-gold-500/30 dark:border-gn-accent-gold/30',
    title: 'Aggregated government and institutional sources',
    body: 'Data sourced from government agencies (Guyana Lands and Surveys, Ministry of Natural Resources, etc.) is subject to each agency\'s open data terms. These datasets are redistributed as-is for research access.',
  },
  {
    tag: 'Verify before use',
    tagColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30',
    title: 'Datasets with unverified provenance',
    body: 'Some datasets are still undergoing source verification. For publication, confirm the primary source directly. Contact us if you need provenance documentation.',
  },
];

export const AttributionPage: React.FC<AttributionPageProps> = () => {
  const { datasets } = useCatalog();

  const [platformStyle, setPlatformStyle] = useState<CitationStyle>('APA');
  const [datasetStyle, setDatasetStyle] = useState<CitationStyle>('APA');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  type DatasetWithYear = typeof datasets[number] & { year?: string | number };

  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">

        {/* ── Section 1: Platform Citation ── */}
        <section>
          <h1 className="text-3xl font-serif font-bold mb-3 text-gn-foreground dark:text-gn-foreground-dark">
            Citing this archive
          </h1>
          <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-6 leading-relaxed">
            Use the formats below to cite the Guynode platform or individual
            datasets in academic work, reports, and publications.
          </p>

          <TabBar active={platformStyle} onChange={setPlatformStyle} />
          <CitationBlock text={platformCitation(platformStyle)} />
        </section>

        {/* ── Section 2: Dataset Citation Generator ── */}
        <section>
          <h2 className="text-2xl font-serif font-bold mb-3 text-gn-foreground dark:text-gn-foreground-dark">
            Cite a specific dataset
          </h2>

          <div className="mb-6">
            <label
              htmlFor="dataset-select"
              className="sr-only"
            >
              Select a dataset
            </label>
            <select
              id="dataset-select"
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="w-full max-w-md bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded px-3 py-2 text-sm text-gn-foreground dark:text-gn-foreground-dark focus:outline-none focus:border-brand-green-500 transition-colors"
            >
              <option value="">— select a dataset —</option>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          {selectedDataset ? (
            <>
              <TabBar active={datasetStyle} onChange={setDatasetStyle} />
              <CitationBlock
                text={datasetCitation(datasetStyle, selectedDataset as DatasetWithYear)}
              />
              <p className="mt-4 font-mono text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark leading-relaxed border-l-2 border-gn-border dark:border-gn-border-dark pl-3">
                Dataset source attribution is being populated as part of the
                Guynode Provenance Registry. Citations will be updated as source
                information is verified. Access date should reflect the date you
                downloaded or accessed the data.
              </p>
            </>
          ) : (
            <div className="font-mono text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark bg-gn-surface-muted dark:bg-gn-surface-muted-dark border border-gn-border dark:border-gn-border-dark rounded p-4">
              Select a dataset above to generate a citation.
            </div>
          )}
        </section>

        {/* ── Section 3: Licensing and Attribution ── */}
        <section>
          <h2 className="text-2xl font-serif font-bold mb-6 text-gn-foreground dark:text-gn-foreground-dark">
            Licensing and attribution
          </h2>

          <div className="space-y-4">
            {LICENSE_ROWS.map((row) => (
              <div
                key={row.tag}
                className="flex gap-4 p-5 bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded"
              >
                <div className="pt-0.5 shrink-0">
                  <span
                    className={`inline-block text-xs font-mono font-semibold px-2 py-1 rounded ${row.tagColor}`}
                  >
                    {row.tag}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1 text-gn-foreground dark:text-gn-foreground-dark">
                    {row.title}
                  </p>
                  <p className="text-sm text-gn-foreground-muted dark:text-gn-foreground-muted-dark leading-relaxed">
                    {row.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 4: Contact ── */}
        <section>
          <h2 className="text-2xl font-serif font-bold mb-3 text-gn-foreground dark:text-gn-foreground-dark">
            Attribution questions
          </h2>
          <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark leading-relaxed">
            For provenance documentation, data use agreements, or citation
            questions, contact HPS Geospatial at{' '}
            <a
              href="mailto:info@hpsgeospatial.com"
              className="text-brand-green-600 dark:text-gn-accent-dark underline underline-offset-2 hover:text-brand-green-500 dark:hover:text-gn-accent-gold transition-colors"
            >
              info@hpsgeospatial.com
            </a>
            .
          </p>
        </section>

      </div>
    </div>
  );
};

export default AttributionPage;
