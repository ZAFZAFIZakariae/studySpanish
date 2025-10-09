const subjectExtractModules = import.meta.glob('./**/*.txt', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

export default subjectExtractModules;
