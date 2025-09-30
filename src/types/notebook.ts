export interface NotebookCell {
  id: string;
  type: 'markdown' | 'code';
  source: string;
  outputs?: string[];
}
