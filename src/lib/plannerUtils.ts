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

export type DueDescriptorTone = 'none' | 'future' | 'urgent' | 'overdue';

export interface DueDescriptor {
  label: string;
  tone: DueDescriptorTone;
}

const DAY_IN_MS = 86_400_000;

export const describeDueDate = (value?: string): DueDescriptor => {
  if (!value) {
    return { label: 'No due date', tone: 'none' };
  }

  const due = new Date(value);
  if (Number.isNaN(due.getTime())) {
    return { label: 'Date unavailable', tone: 'none' };
  }

  const now = Date.now();
  const diff = due.getTime() - now;
  const absDiff = Math.abs(diff);

  if (absDiff < 60_000) {
    return { label: diff >= 0 ? 'Due now' : 'Just closed', tone: diff >= 0 ? 'urgent' : 'overdue' };
  }

  if (diff >= 0) {
    if (absDiff < DAY_IN_MS) {
      const hours = Math.ceil(absDiff / (1000 * 60 * 60));
      return { label: `Due in ${hours} hour${hours === 1 ? '' : 's'}`, tone: 'urgent' };
    }
    const days = Math.ceil(absDiff / DAY_IN_MS);
    const tone: DueDescriptorTone = days <= 3 ? 'urgent' : 'future';
    return { label: `Due in ${days} day${days === 1 ? '' : 's'}`, tone };
  }

  if (absDiff < DAY_IN_MS) {
    const hours = Math.ceil(absDiff / (1000 * 60 * 60));
    return { label: `Overdue by ${hours} hour${hours === 1 ? '' : 's'}`, tone: 'overdue' };
  }

  const days = Math.ceil(absDiff / DAY_IN_MS);
  return { label: `Overdue by ${days} day${days === 1 ? '' : 's'}`, tone: 'overdue' };
};
