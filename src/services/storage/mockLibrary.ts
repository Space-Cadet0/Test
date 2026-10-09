import { CanonicalGame } from '../../contracts/game';

export const INITIAL_LIBRARY_GAMES: CanonicalGame[] = [
  {
    id: 'gears-of-war-e-day',
    title: 'Gears of War: E-Day',
    sortTitle: 'Gears of War E-Day',
    steamAppId: 3010850,
    platforms: [
      {
        platformId: 'steam',
        platformGameId: '3010850',
        installed: true,
        installPath: '/Games/Steam/GearsOfWarEDay',
        lastPlayed: '2026-10-08',
        playtimeMinutes: 240,
      },
      {
        platformId: 'xbox',
        platformGameId: 'ms-gearsofwar-eday',
        installed: false,
      },
    ],
    headerImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3010850/1abb0c5ef76c14f463dd6e3964adb64f984237d2/header.jpg?t=1791488050',
    shortDescription: 'Experience the brutal horror of Emergence Day through the eyes of Marcus Fenix in this origin story of one of gaming’s most acclaimed sagas.',
    releaseDate: 'Coming Soon (2026)',
    developers: ['The Coalition'],
    publishers: ['Xbox Game Studios'],
    genres: ['Action', 'Shooter', 'Gore'],
    tags: ['Third-Person Shooter', 'Action', 'Gore', 'Dark', 'Story Rich', 'Atmospheric', 'Sci-Fi'],
    reviewSummary: {
      reviewScore: 6,
      reviewScoreDesc: 'Mostly Positive',
      totalPositive: 3023,
      totalNegative: 1170,
      totalReviews: 4193,
      positivePercent: 72,
    },
    enrichedMetadata: {
      appId: 3010850,
      name: 'Gears of War: E-Day',
      shortDescription: 'Experience the brutal horror of Emergence Day through the eyes of Marcus Fenix in this origin story of one of gaming’s most acclaimed sagas.',
      detailedDescription: `
        <h2>ABOUT THIS GAME</h2>
        <p>Fourteen years before Gears of War, war heroes Marcus Fenix and Dom Santiago return home to face a new nightmare: the Locust Horde. These subterranean monsters, grotesque and relentless, erupt from below, laying siege on humanity itself.</p>
        <p>Built from the ground up with Unreal Engine 5, <strong>Gears of War: E-Day</strong> delivers unprecedented graphical fidelity, visceral third-person action, and an emotional, brutal campaign.</p>
        <h2>FEATURES</h2>
        <ul>
          <li><strong>Brutal Combat:</strong> Master the iconic Chainsaw Lancer and visceral cover-based combat.</li>
          <li><strong>Emotional Brotherhood:</strong> Revisit the unbreakable bond between Marcus Fenix and Dom Santiago.</li>
          <li><strong>Next-Gen Horror:</strong> Rediscover the terrifying dread of Emergence Day powered by Unreal Engine 5.</li>
        </ul>
      `,
      aboutTheGame: 'Experience the brutal horror of Emergence Day through the eyes of Marcus Fenix.',
      headerImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3010850/1abb0c5ef76c14f463dd6e3964adb64f984237d2/header.jpg?t=1791488050',
      developers: ['The Coalition'],
      publishers: ['Xbox Game Studios'],
      releaseDate: 'Coming Soon (2026)',
      genres: ['Action', 'Shooter', 'Gore'],
      tags: ['Third-Person Shooter', 'Action', 'Gore', 'Story Rich', 'Unreal Engine 5', 'Atmospheric'],
      screenshots: [
        {
          id: 0,
          pathThumbnail: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3010850/ss_8e3c66da31c70e060ca3eb1947b1c31d1ea02241.600x338.jpg?t=1791488050',
          pathFull: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3010850/ss_8e3c66da31c70e060ca3eb1947b1c31d1ea02241.1920x1080.jpg?t=1791488050',
        },
        {
          id: 1,
          pathThumbnail: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3010850/ss_02dc67873cebfa10b98263592bc2ea0e05244dd0.600x338.jpg?t=1791488050',
          pathFull: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3010850/ss_02dc67873cebfa10b98263592bc2ea0e05244dd0.1920x1080.jpg?t=1791488050',
        },
        {
          id: 2,
          pathThumbnail: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3010850/ss_37a916891eb63c4373418eeaa803ec2a8c3d806a.600x338.jpg?t=1791488050',
          pathFull: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3010850/ss_37a916891eb63c4373418eeaa803ec2a8c3d806a.1920x1080.jpg?t=1791488050',
        },
        {
          id: 3,
          pathThumbnail: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3010850/ss_e1e1a533bfd7454c6ee6802aa8944589d81d45e7.600x338.jpg?t=1791488050',
          pathFull: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3010850/ss_e1e1a533bfd7454c6ee6802aa8944589d81d45e7.1920x1080.jpg?t=1791488050',
        },
      ],
      movies: [
        {
          id: 257022201,
          name: 'Official Announce Trailer',
          thumbnail: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/257022201/movie.293x165.jpg?t=1717957973',
          webm: {
            480: 'https://video.akamai.steamstatic.com/store_trailers/3010850/1328685879/5112b43fa3d7dfc90c615c789011f02c82e63d4b/1790722579/dash_h264.mpd',
            max: 'https://video.akamai.steamstatic.com/store_trailers/3010850/1328685879/5112b43fa3d7dfc90c615c789011f02c82e63d4b/1790722579/hls_264_master.m3u8',
          },
          mp4: {
            480: '',
            max: '',
          },
        },
      ],
      systemRequirements: {
        minimum: `
          <strong>Minimum:</strong><br>
          <ul class="bb_ul">
            <li><strong>OS:</strong> Windows 10 64-bit (latest update)</li>
            <li><strong>Processor:</strong> AMD Ryzen 5 3600 or Intel Core i7-8700K</li>
            <li><strong>Memory:</strong> 16 GB RAM</li>
            <li><strong>Graphics:</strong> NVIDIA GeForce RTX 2060 or AMD Radeon RX 5700 XT</li>
            <li><strong>DirectX:</strong> Version 12</li>
            <li><strong>Storage:</strong> 120 GB available space (SSD required)</li>
          </ul>
        `,
        recommended: `
          <strong>Recommended:</strong><br>
          <ul class="bb_ul">
            <li><strong>OS:</strong> Windows 11 64-bit</li>
            <li><strong>Processor:</strong> AMD Ryzen 7 7800X3D or Intel Core i7-13700K</li>
            <li><strong>Memory:</strong> 32 GB RAM</li>
            <li><strong>Graphics:</strong> NVIDIA GeForce RTX 4070 Ti or AMD Radeon RX 7900 XT</li>
            <li><strong>DirectX:</strong> Version 12</li>
            <li><strong>Storage:</strong> 120 GB available NVMe SSD space</li>
          </ul>
        `,
      },
      reviewSummary: {
        reviewScore: 6,
        reviewScoreDesc: 'Mostly Positive',
        totalPositive: 3023,
        totalNegative: 1170,
        totalReviews: 4193,
        positivePercent: 72,
      },
      supportedLanguages: 'English<strong>*</strong>, French, Italian, German, Spanish - Spain, Japanese<br><strong>*</strong>languages with full audio support',
    },
  },
  {
    id: 'cyberpunk-2077',
    title: 'Cyberpunk 2077',
    sortTitle: 'Cyberpunk 2077',
    steamAppId: 1091500,
    platforms: [
      {
        platformId: 'gog',
        platformGameId: '1423049311',
        installed: true,
        installPath: '/Applications/Cyberpunk2077',
        lastPlayed: '2026-09-12',
        playtimeMinutes: 4850,
      },
      {
        platformId: 'steam',
        platformGameId: '1091500',
        installed: false,
      },
      {
        platformId: 'epic',
        platformGameId: 'cyberpunk-2077-epic',
        installed: false,
      },
    ],
    headerImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg',
    shortDescription: 'Cyberpunk 2077 is an open-world, action-adventure RPG set in the megalopolis of Night City, where you play as a cyberpunk mercenary wrapped up in a do-or-die fight for survival.',
    releaseDate: '10 Dec, 2020',
    developers: ['CD PROJEKT RED'],
    publishers: ['CD PROJEKT RED'],
    genres: ['RPG', 'Open World', 'Cyberpunk'],
    tags: ['Cyberpunk', 'Open World', 'RPG', 'Nudity', 'Sci-Fi', 'Story Rich', 'Singleplayer'],
    reviewSummary: {
      reviewScore: 9,
      reviewScoreDesc: 'Very Positive',
      totalPositive: 685000,
      totalNegative: 92000,
      totalReviews: 777000,
      positivePercent: 88,
    },
  },
  {
    id: 'the-witcher-3-wild-hunt',
    title: 'The Witcher 3: Wild Hunt',
    sortTitle: 'Witcher 3 Wild Hunt',
    steamAppId: 292030,
    platforms: [
      {
        platformId: 'gog',
        platformGameId: '1207664643',
        installed: true,
        lastPlayed: '2026-08-01',
        playtimeMinutes: 7200,
      },
      {
        platformId: 'steam',
        platformGameId: '292030',
        installed: false,
      },
    ],
    headerImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg',
    shortDescription: 'You are Geralt of Rivia, mercenary monster slayer. Before you stands a war-torn, monster-infested continent you can explore at will. Your current contract? Tracking down Ciri — the Child of Prophecy.',
    releaseDate: '18 May, 2015',
    developers: ['CD PROJEKT RED'],
    publishers: ['CD PROJEKT RED'],
    genres: ['RPG', 'Open World', 'Story Rich'],
    tags: ['Masterpiece', 'RPG', 'Open World', 'Story Rich', 'Atmospheric', 'Fantasy'],
    reviewSummary: {
      reviewScore: 9,
      reviewScoreDesc: 'Overwhelmingly Positive',
      totalPositive: 740000,
      totalNegative: 25000,
      totalReviews: 765000,
      positivePercent: 96,
    },
  },
  {
    id: 'hades-ii',
    title: 'Hades II',
    sortTitle: 'Hades II',
    steamAppId: 1145350,
    platforms: [
      {
        platformId: 'steam',
        platformGameId: '1145350',
        installed: true,
        lastPlayed: '2026-10-02',
        playtimeMinutes: 1820,
      },
      {
        platformId: 'epic',
        platformGameId: 'hades-ii-epic',
        installed: false,
      },
    ],
    headerImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145350/header.jpg',
    shortDescription: 'Battle beyond the Underworld using dark sorcery to take on the Titan of Time in this bewitching sequel to the award-winning rogue-like dungeon crawler.',
    releaseDate: '6 May, 2024 (Early Access)',
    developers: ['Supergiant Games'],
    publishers: ['Supergiant Games'],
    genres: ['Action', 'Roguelike', 'Indie'],
    tags: ['Roguelike', 'Action Roguelike', 'Mythology', 'Great Soundtrack', 'Female Protagonist'],
    reviewSummary: {
      reviewScore: 9,
      reviewScoreDesc: 'Overwhelmingly Positive',
      totalPositive: 65400,
      totalNegative: 2100,
      totalReviews: 67500,
      positivePercent: 96,
    },
  },
  {
    id: 'death-stranding-directors-cut',
    title: "Death Stranding: Director's Cut",
    sortTitle: 'Death Stranding Directors Cut',
    steamAppId: 1850570,
    platforms: [
      {
        platformId: 'epic',
        platformGameId: 'death-stranding-dc',
        installed: true,
        lastPlayed: '2026-07-15',
        playtimeMinutes: 2100,
      },
      {
        platformId: 'amazon',
        platformGameId: 'amzn-ds-dc',
        installed: false,
      },
    ],
    headerImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1850570/header.jpg',
    shortDescription: 'From legendary game creator Hideo Kojima comes a genre-defying experience, now expanded in this definitive DIRECTOR’S CUT. As Sam Bridges, your mission is to deliver hope to humanity.',
    releaseDate: '30 Mar, 2022',
    developers: ['KOJIMA PRODUCTIONS'],
    publishers: ['505 Games'],
    genres: ['Action', 'Open World', 'Sci-Fi'],
    tags: ['Atmospheric', 'Open World', 'Story Rich', 'Walking Simulator', 'Post-apocalyptic'],
    reviewSummary: {
      reviewScore: 9,
      reviewScoreDesc: 'Very Positive',
      totalPositive: 22000,
      totalNegative: 1900,
      totalReviews: 23900,
      positivePercent: 92,
    },
  },
  {
    id: 'diablo-iv',
    title: 'Diablo IV',
    sortTitle: 'Diablo IV',
    steamAppId: 2344520,
    platforms: [
      {
        platformId: 'bnet',
        platformGameId: 'Fenris',
        installed: true,
        lastPlayed: '2026-10-05',
        playtimeMinutes: 6400,
      },
      {
        platformId: 'xbox',
        platformGameId: 'ms-diablo-iv',
        installed: false,
      },
      {
        platformId: 'steam',
        platformGameId: '2344520',
        installed: false,
      },
    ],
    headerImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2344520/header.jpg',
    shortDescription: 'The endless battle between the High Heavens and the Burning Hells rages on as chaos threatens to consume Sanctuary. With evil to slaughter and abilities to master, darkness awaits.',
    releaseDate: '17 Oct, 2023',
    developers: ['Blizzard Entertainment'],
    publishers: ['Blizzard Entertainment'],
    genres: ['Action RPG', 'Hack and Slash', 'Dark Fantasy'],
    tags: ['Action RPG', 'Dark Fantasy', 'Hack and Slash', 'Loot', 'Multiplayer', 'Gore'],
    reviewSummary: {
      reviewScore: 6,
      reviewScoreDesc: 'Mixed',
      totalPositive: 24100,
      totalNegative: 12200,
      totalReviews: 36300,
      positivePercent: 66,
    },
  },
  {
    id: 'assassins-creed-mirage',
    title: "Assassin's Creed Mirage",
    sortTitle: 'Assassins Creed Mirage',
    steamAppId: 3035570,
    platforms: [
      {
        platformId: 'ubisoft',
        platformGameId: 'uplay-ac-mirage',
        installed: true,
        lastPlayed: '2026-06-20',
        playtimeMinutes: 1350,
      },
      {
        platformId: 'epic',
        platformGameId: 'epic-ac-mirage',
        installed: false,
      },
    ],
    headerImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3035570/header.jpg',
    shortDescription: 'Experience the story of Basim, a cunning street thief with nightmarish visions, seeking answers and justice as he navigates the bustling streets of ninth-century Baghdad.',
    releaseDate: '17 Oct, 2024',
    developers: ['Ubisoft Bordeaux'],
    publishers: ['Ubisoft'],
    genres: ['Action', 'Adventure', 'Stealth'],
    tags: ['Stealth', 'Action', 'Parkour', 'Historical', 'Open World', 'Assassins'],
    reviewSummary: {
      reviewScore: 7,
      reviewScoreDesc: 'Mostly Positive',
      totalPositive: 5800,
      totalNegative: 2100,
      totalReviews: 7900,
      positivePercent: 73,
    },
  },
  {
    id: 'dead-space-remake',
    title: 'Dead Space',
    sortTitle: 'Dead Space Remake',
    steamAppId: 1693980,
    platforms: [
      {
        platformId: 'ea',
        platformGameId: 'ea-dead-space-2023',
        installed: true,
        lastPlayed: '2026-05-11',
        playtimeMinutes: 890,
      },
      {
        platformId: 'steam',
        platformGameId: '1693980',
        installed: false,
      },
    ],
    headerImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1693980/header.jpg',
    shortDescription: 'The sci-fi survival-horror classic returns, completely rebuilt from the ground up to offer a deeper, more immersive experience.',
    releaseDate: '27 Jan, 2023',
    developers: ['Motive'],
    publishers: ['Electronic Arts'],
    genres: ['Survival Horror', 'Sci-Fi', 'Gore'],
    tags: ['Horror', 'Survival Horror', 'Sci-Fi', 'Space', 'Atmospheric', 'Remake'],
    reviewSummary: {
      reviewScore: 9,
      reviewScoreDesc: 'Very Positive',
      totalPositive: 34900,
      totalNegative: 3200,
      totalReviews: 38100,
      positivePercent: 91,
    },
  },
  {
    id: 'celeste',
    title: 'Celeste',
    sortTitle: 'Celeste',
    steamAppId: 504230,
    platforms: [
      {
        platformId: 'itch',
        platformGameId: 'itch-celeste',
        installed: true,
        lastPlayed: '2026-09-29',
        playtimeMinutes: 940,
      },
      {
        platformId: 'humble',
        platformGameId: 'humble-celeste',
        installed: false,
      },
      {
        platformId: 'steam',
        platformGameId: '504230',
        installed: false,
      },
    ],
    headerImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/504230/header.jpg',
    shortDescription: 'Help Madeline survive her inner demons on her journey to the top of Celeste Mountain, in this super-tight platformer from the creators of TowerFall.',
    releaseDate: '25 Jan, 2018',
    developers: ['Maddy Makes Games Inc.'],
    publishers: ['Maddy Makes Games Inc.'],
    genres: ['Platformer', 'Pixel Graphics', 'Indie'],
    tags: ['Precision Platformer', 'Difficult', 'Pixel Graphics', 'Great Soundtrack', 'Female Protagonist'],
    reviewSummary: {
      reviewScore: 9,
      reviewScoreDesc: 'Overwhelmingly Positive',
      totalPositive: 91000,
      totalNegative: 1400,
      totalReviews: 92400,
      positivePercent: 98,
    },
  },
];
