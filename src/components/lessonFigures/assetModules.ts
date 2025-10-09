const figureAssetModules = import.meta.glob('../../subjects/**/*.{png,jpg,jpeg,svg,webp}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

export default figureAssetModules;
