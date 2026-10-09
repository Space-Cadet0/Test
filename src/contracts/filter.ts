export interface ActiveGameFilter {
  type: 'developer' | 'publisher' | 'genre' | 'tag' | 'feature';
  label: string; // e.g. 'Developer', 'Publisher', 'Genre', 'Tag', 'Feature'
  value: string; // e.g. 'Larian Studios', 'HDR available', 'RPG', 'CD PROJEKT RED'
}
