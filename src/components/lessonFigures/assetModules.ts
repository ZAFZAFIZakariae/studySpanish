const subjectAssetModules = import.meta.glob('../../../subjects/**/*.{png,jpg,jpeg,svg,webp}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const publicAssetModules = import.meta.glob(
  '../../../public/subject-assets/**/*.{png,jpg,jpeg,svg,webp}',
  {
    eager: true,
    import: 'default',
    query: '?url',
  },
) as Record<string, string>;

const figureAssetModules = {
  ...subjectAssetModules,
  ...publicAssetModules,
} as Record<string, string>;

export default figureAssetModules;
