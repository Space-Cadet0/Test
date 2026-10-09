import { CanonicalGame } from '../../contracts/game';

// Re-export verified 314 GOG titles for mike.stokes85 matching https://www.gog.com/en/account
export { GOG_USER_LIBRARY } from './gogUserLibrary';

// Re-export verified 402 Epic Games Store titles matching official launcher library
export { EPIC_USER_LIBRARY } from './epicUserLibrary';

export const XBOX_USER_LIBRARY: CanonicalGame[] = [
  {
    id: 'xbox-halo-infinite',
    title: 'Halo Infinite',
    sortTitle: 'Halo Infinite',
    platforms: [
      {
        platformId: 'xbox',
        platformGameId: 'xbox-halo-infinite',
        installed: false,
        playtimeMinutes: 1100,
        lastPlayed: '2026-08-14T21:00:00Z',
      },
    ],
    headerImage: 'https://store-images.s-microsoft.com/image/apps.21536.13727851868390641.c11e64cf-2d3a-4424-9b2f-99f8d91c7a85.8e4c0792-6229-411a-a63e-6d43e2646d6a',
    capsuleImage: 'https://store-images.s-microsoft.com/image/apps.21536.13727851868390641.c11e64cf-2d3a-4424-9b2f-99f8d91c7a85.8e4c0792-6229-411a-a63e-6d43e2646d6a',
    shortDescription: 'When all hope is lost and humanity’s fate hangs in the balance, Master Chief is ready to confront the most ruthless foe he’s ever faced on Zeta Halo.',
    releaseDate: '8 Dec, 2021',
    developers: ['343 Industries'],
    publishers: ['Xbox Game Studios'],
    genres: ['FPS', 'Action', 'Sci-Fi'],
    tags: ['FPS', 'Multiplayer', 'Sci-Fi', 'First-Person'],
    reviewSummary: {
      reviewScore: 7,
      reviewScoreDesc: 'Mostly Positive',
      totalPositive: 160000,
      totalNegative: 45000,
      totalReviews: 205000,
      positivePercent: 78,
    },
  },
  {
    id: 'xbox-forza-horizon-5',
    title: 'Forza Horizon 5',
    sortTitle: 'Forza Horizon 5',
    platforms: [
      {
        platformId: 'xbox',
        platformGameId: 'xbox-forza-horizon-5',
        installed: false,
        playtimeMinutes: 2450,
        lastPlayed: '2026-09-24T17:15:00Z',
      },
    ],
    headerImage: 'https://store-images.s-microsoft.com/image/apps.43952.13727851868390641.a5b3f124-7e8c-4a11-85b4-d54b6d412d09.f8b3c104-5182-4bb3-bc52-19e48b301c22',
    capsuleImage: 'https://store-images.s-microsoft.com/image/apps.43952.13727851868390641.a5b3f124-7e8c-4a11-85b4-d54b6d412d09.f8b3c104-5182-4bb3-bc52-19e48b301c22',
    shortDescription: 'Your Ultimate Horizon Adventure awaits! Explore the vibrant and ever-evolving open world landscapes of Mexico with limitless, fun driving action.',
    releaseDate: '9 Nov, 2021',
    developers: ['Playground Games'],
    publishers: ['Xbox Game Studios'],
    genres: ['Racing', 'Open World', 'Driving'],
    tags: ['Racing', 'Open World', 'Multiplayer', 'Automobile Sim'],
    reviewSummary: {
      reviewScore: 9,
      reviewScoreDesc: 'Very Positive',
      totalPositive: 145000,
      totalNegative: 18000,
      totalReviews: 163000,
      positivePercent: 89,
    },
  },
  {
    id: 'xbox-gears-5',
    title: 'Gears 5',
    sortTitle: 'Gears 5',
    platforms: [
      {
        platformId: 'xbox',
        platformGameId: 'xbox-gears-5',
        installed: false,
        playtimeMinutes: 780,
        lastPlayed: '2026-06-19T22:00:00Z',
      },
    ],
    headerImage: 'https://store-images.s-microsoft.com/image/apps.34212.13727851868390641.b24c8851-9e23-455b-9d41-118c66e2c34d.e21b0682-1082-4299-8cfb-665e729ba9bc',
    capsuleImage: 'https://store-images.s-microsoft.com/image/apps.34212.13727851868390641.b24c8851-9e23-455b-9d41-118c66e2c34d.e21b0682-1082-4299-8cfb-665e729ba9bc',
    shortDescription: 'From one of gaming’s most acclaimed sagas, Gears is bigger than ever. With all-out war descending, Kait Diaz breaks away to uncover her connection to the enemy.',
    releaseDate: '10 Sep, 2019',
    developers: ['The Coalition'],
    publishers: ['Xbox Game Studios'],
    genres: ['Action', 'Third-Person Shooter', 'Co-op'],
    tags: ['Third-Person Shooter', 'Action', 'Gore', 'Co-op'],
    reviewSummary: {
      reviewScore: 7,
      reviewScoreDesc: 'Mostly Positive',
      totalPositive: 32000,
      totalNegative: 9800,
      totalReviews: 41800,
      positivePercent: 77,
    },
  },
  {
    id: 'xbox-sea-of-thieves',
    title: 'Sea of Thieves',
    sortTitle: 'Sea of Thieves',
    platforms: [
      {
        platformId: 'xbox',
        platformGameId: 'xbox-sea-of-thieves',
        installed: false,
        playtimeMinutes: 1890,
        lastPlayed: '2026-09-05T20:45:00Z',
      },
    ],
    headerImage: 'https://store-images.s-microsoft.com/image/apps.52189.13727851868390641.f50f4a4d-0453-4889-9b51-739c36279f10.1fa8e5b5-7c05-4c07-b286-90e666993cbe',
    capsuleImage: 'https://store-images.s-microsoft.com/image/apps.52189.13727851868390641.f50f4a4d-0453-4889-9b51-739c36279f10.1fa8e5b5-7c05-4c07-b286-90e666993cbe',
    shortDescription: 'Sea of Thieves offers the essential pirate experience, from sailing and fighting to exploring and looting – everything you need to live the pirate life and become a legend.',
    releaseDate: '20 Mar, 2018',
    developers: ['Rare Ltd'],
    publishers: ['Xbox Game Studios'],
    genres: ['Pirates', 'Open World', 'Multiplayer'],
    tags: ['Pirates', 'Multiplayer', 'Open World', 'Co-op', 'Adventure'],
    reviewSummary: {
      reviewScore: 9,
      reviewScoreDesc: 'Very Positive',
      totalPositive: 280000,
      totalNegative: 31000,
      totalReviews: 311000,
      positivePercent: 90,
    },
  },
];
