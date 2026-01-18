export interface ResearchItem {
  title: string;
  authors: string[];
  journal: string;
  year: string | number;
  doi: string;
  abstract?: string;
  url?: string;
}

export interface SearchResult {
  total: number;
  results: ResearchItem[];
}