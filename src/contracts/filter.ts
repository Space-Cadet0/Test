export interface ActiveGameFilter {
  type: 'developer' | 'publisher' | 'genre' | 'tag' | 'feature' | 'opencritic' | 'review';
  label: string; // e.g. 'Developer', 'Publisher', 'Genre', 'Tag', 'Feature', 'OpenCritic', 'Reviews'
  value: string; // e.g. 'Larian Studios', 'HDR available', 'Mighty', 'Mostly Positive', 'RPG'
}
