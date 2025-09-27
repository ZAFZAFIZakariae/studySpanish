export const deckLabel = (deck: string) => {
  switch (deck) {
    case 'verbs':
      return 'Verb drills';
    case 'vocab':
      return 'Vocabulary';
    case 'presentations':
      return 'Presentation phrases';
    case 'culture':
      return 'Culture & register';
    case 'grammar':
    default:
      return 'Grammar focus';
  }
};

export const formatRelativeTime = (value?: string) => {
  if (!value) return 'Never';
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs <= 0) return 'Just now';
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  }
  return date.toLocaleDateString();
};
