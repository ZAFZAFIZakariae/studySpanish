import { To } from 'react-router-dom';

export type PlannerQuickAction = {
  key: string;
  to?: To;
  label: string;
  hint: string;
  icon: string;
  badge?: string;
  disabled?: boolean;
};

export type PlannerTimelineCard = {
  id: 'yesterday' | 'today' | 'tomorrow';
  label: string;
  title: string;
  description: string;
  actionTo: To;
  actionLabel: string;
  goal?: {
    id: PlannerTimelineCard['id'];
    note: string;
    scheduledFor?: string | null;
    reminder?: string | null;
  };
};
