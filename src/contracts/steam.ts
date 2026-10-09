export interface SteamScreenshot {
  id: number;
  pathThumbnail: string;
  pathFull: string;
}

export interface SteamMovie {
  id: number;
  name: string;
  thumbnail: string;
  webm: {
    480: string;
    max: string;
  };
  mp4: {
    480: string;
    max: string;
  };
}

export interface SteamReviewSummary {
  reviewScore: number;
  reviewScoreDesc: string; // e.g. "Very Positive", "Overwhelmingly Positive"
  totalPositive: number;
  totalNegative: number;
  totalReviews: number;
  positivePercent: number;
}

export interface SteamSystemRequirements {
  minimum?: string;
  recommended?: string;
}

export interface SteamEnrichedMetadata {
  appId: number;
  name: string;
  shortDescription: string;
  detailedDescription: string;
  aboutTheGame: string;
  headerImage: string;
  capsuleImage?: string;
  developers: string[];
  publishers: string[];
  releaseDate: string;
  genres: string[];
  tags: string[];
  screenshots: SteamScreenshot[];
  movies: SteamMovie[];
  systemRequirements: SteamSystemRequirements;
  reviewSummary: SteamReviewSummary;
  supportedLanguages?: string;
  pcRequirementsHtml?: string;
}
