import { getSubjectExtract } from './subjectExtracts';
import { ResourceLink, ResourceType } from '../types/subject';

const SUBJECTS_ROOT = '../../subjects/';

const resourceTypeByExtension: Partial<Record<string, ResourceType>> = {
  pdf: 'pdf',
  ppt: 'slides',
  pptx: 'slides',
  pps: 'slides',
  ppsx: 'slides',
  key: 'slides',
  odp: 'slides',
  ipynb: 'worksheet',
  doc: 'worksheet',
  docx: 'worksheet',
  xls: 'worksheet',
  xlsx: 'worksheet',
  csv: 'worksheet',
  txt: 'worksheet',
  md: 'worksheet',
  png: 'slides',
  sql: 'worksheet',
  url: 'worksheet',
  archimate: 'worksheet',
};

const decodeSegment = (segment: string): string => decodeURIComponent(segment);

const tidySegment = (segment: string): string =>
  decodeSegment(segment)
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const formatFileName = (fileName: string): string => {
  const decoded = decodeSegment(fileName);
  const lastDotIndex = decoded.lastIndexOf('.');

  if (lastDotIndex <= 0) {
    return tidySegment(decoded);
  }

  const base = tidySegment(decoded.slice(0, lastDotIndex));
  const extension = decoded.slice(lastDotIndex + 1).toUpperCase();

  return extension ? `${base} (${extension})` : base;
};

const buildResourceLabel = (segments: string[]): string => {
  if (segments.length === 0) {
    return '';
  }

  return segments
    .map((segment, index) => (index === segments.length - 1 ? formatFileName(segment) : tidySegment(segment)))
    .join(' › ');
};

const assetModules = import.meta.glob('../../subjects/**/*.*', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

const resourcesBySubject = new Map<string, ResourceLink[]>();

Object.entries(assetModules).forEach(([path, href]) => {
  if (!path.startsWith(SUBJECTS_ROOT)) {
    return;
  }

  const relativePath = path.slice(SUBJECTS_ROOT.length);
  if (!relativePath) {
    return;
  }

  const segments = relativePath.split('/').filter(Boolean);
  if (segments.length < 2) {
    return;
  }

  const [subjectFolder, ...resourceSegments] = segments;
  const subjectId = subjectFolder.toLowerCase();
  const label = buildResourceLabel(resourceSegments);

  if (!label) {
    return;
  }

  const fileSegment = resourceSegments[resourceSegments.length - 1] ?? '';
  const extension = fileSegment.split('.').pop()?.toLowerCase() ?? '';
  const type = resourceTypeByExtension[extension];
  const extractSourcePath = ['subjects', ...segments.map(decodeSegment)].join('/');
  const extract = getSubjectExtract(extractSourcePath);

  const resource: ResourceLink = { label, href };
  if (type) {
    resource.type = type;
  }
  if (extract) {
    resource.extract = {
      source: extract.source,
      text: extract.text,
      ...(extract.notes ? { notes: extract.notes } : {}),
    };
  }

  const bucket = resourcesBySubject.get(subjectId) ?? [];
  bucket.push(resource);
  resourcesBySubject.set(subjectId, bucket);
});

export const subjectResourceLibrary: Record<string, ResourceLink[]> = Array.from(resourcesBySubject.entries()).reduce(
  (acc, [subjectId, resources]) => {
    acc[subjectId] = resources.slice().sort((a, b) => collator.compare(a.label, b.label));
    return acc;
  },
  {} as Record<string, ResourceLink[]>
);
