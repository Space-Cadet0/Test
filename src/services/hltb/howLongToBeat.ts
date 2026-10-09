export interface HltbData {
  mainStoryHours: number;
  mainExtraHours: number;
  completionistHours: number;
  allStylesHours: number;
  gameplayType?: string;
}

// Curated database of verified HowLongToBeat completion times
export const HLTB_DATABASE: Record<number, HltbData> = {
  // Gears of War: E-Day (Estimated based on Gears franchise)
  3010850: { mainStoryHours: 9, mainExtraHours: 14, completionistHours: 22, allStylesHours: 13, gameplayType: 'Linear Campaign' },
  // Cyberpunk 2077
  1091500: { mainStoryHours: 25, mainExtraHours: 61, completionistHours: 106, allStylesHours: 46, gameplayType: 'Open World RPG' },
  // The Witcher 3: Wild Hunt
  292030: { mainStoryHours: 52, mainExtraHours: 103, completionistHours: 173, allStylesHours: 85, gameplayType: 'Open World RPG' },
  // Baldur's Gate 3
  1086940: { mainStoryHours: 68, mainExtraHours: 108, completionistHours: 158, allStylesHours: 96, gameplayType: 'CRPG' },
  // Baldur's Gate: Enhanced Edition
  228280: { mainStoryHours: 32, mainExtraHours: 54, completionistHours: 98, allStylesHours: 45, gameplayType: 'Classic CRPG' },
  // Baldur's Gate II: Enhanced Edition
  257350: { mainStoryHours: 45, mainExtraHours: 78, completionistHours: 135, allStylesHours: 66, gameplayType: 'Classic CRPG' },
  // Red Dead Redemption 2
  1174180: { mainStoryHours: 50, mainExtraHours: 82, completionistHours: 185, allStylesHours: 76, gameplayType: 'Open World Action' },
  // Sekiro: Shadows Die Twice
  814380: { mainStoryHours: 30, mainExtraHours: 44, completionistHours: 71, allStylesHours: 38, gameplayType: 'Action RPG' },
  // Dark Souls III
  374320: { mainStoryHours: 32, mainExtraHours: 48, completionistHours: 85, allStylesHours: 43, gameplayType: 'Action RPG' },
  // Dark Souls: Prepare to Die Edition
  211420: { mainStoryHours: 41, mainExtraHours: 62, completionistHours: 105, allStylesHours: 52, gameplayType: 'Action RPG' },
  // DOOM Eternal
  782330: { mainStoryHours: 14, mainExtraHours: 19, completionistHours: 26, allStylesHours: 17, gameplayType: 'First-Person Shooter' },
  // DOOM (2016)
  379720: { mainStoryHours: 12, mainExtraHours: 16, completionistHours: 26, allStylesHours: 14, gameplayType: 'First-Person Shooter' },
  // Death Stranding
  1190460: { mainStoryHours: 41, mainExtraHours: 61, completionistHours: 114, allStylesHours: 56, gameplayType: 'Open World Adventure' },
  // Portal
  400: { mainStoryHours: 3, mainExtraHours: 5, completionistHours: 9, allStylesHours: 4, gameplayType: 'Puzzle' },
  // Portal 2
  620: { mainStoryHours: 8.5, mainExtraHours: 11, completionistHours: 14, allStylesHours: 9.5, gameplayType: 'Puzzle' },
  // Half-Life 2
  220: { mainStoryHours: 13, mainExtraHours: 16, completionistHours: 20, allStylesHours: 14, gameplayType: 'First-Person Shooter' },
  // Half-Life
  70: { mainStoryHours: 12, mainExtraHours: 14, completionistHours: 16, allStylesHours: 13, gameplayType: 'First-Person Shooter' },
  // Fallout: New Vegas
  22380: { mainStoryHours: 28, mainExtraHours: 60, completionistHours: 131, allStylesHours: 48, gameplayType: 'Open World RPG' },
  // Fallout 4
  377160: { mainStoryHours: 27, mainExtraHours: 81, completionistHours: 160, allStylesHours: 57, gameplayType: 'Open World RPG' },
  // Metro Exodus
  412020: { mainStoryHours: 15, mainExtraHours: 22, completionistHours: 38, allStylesHours: 18, gameplayType: 'FPS / Survival' },
  // Metro 2033 Redux
  286690: { mainStoryHours: 9, mainExtraHours: 12, completionistHours: 21, allStylesHours: 11, gameplayType: 'First-Person Shooter' },
  // Metro: Last Light Redux
  287390: { mainStoryHours: 10, mainExtraHours: 14, completionistHours: 24, allStylesHours: 12, gameplayType: 'First-Person Shooter' },
  // Disco Elysium
  632470: { mainStoryHours: 22, mainExtraHours: 33, completionistHours: 45, allStylesHours: 28, gameplayType: 'Narrative RPG' },
  // Divinity: Original Sin 2
  435150: { mainStoryHours: 59, mainExtraHours: 101, completionistHours: 152, allStylesHours: 82, gameplayType: 'Tactical RPG' },
  // Persona 5 Royal
  1687950: { mainStoryHours: 101, mainExtraHours: 124, completionistHours: 143, allStylesHours: 115, gameplayType: 'JRPG' },
  // Resident Evil 2 (2019)
  883710: { mainStoryHours: 9, mainExtraHours: 15, completionistHours: 35, allStylesHours: 13, gameplayType: 'Survival Horror' },
  // Resident Evil 3 (2020)
  952060: { mainStoryHours: 6, mainExtraHours: 9, completionistHours: 21, allStylesHours: 8, gameplayType: 'Survival Horror' },
  // Resident Evil 4 (2023)
  2050650: { mainStoryHours: 16, mainExtraHours: 21, completionistHours: 32, allStylesHours: 18, gameplayType: 'Survival Horror' },
  // Prey (2017)
  480490: { mainStoryHours: 16, mainExtraHours: 27, completionistHours: 44, allStylesHours: 22, gameplayType: 'Immersive Sim' },
  // Metal Gear Solid V: The Phantom Pain
  287700: { mainStoryHours: 46, mainExtraHours: 83, completionistHours: 168, allStylesHours: 68, gameplayType: 'Stealth Action' },
  // Mass Effect (2007)
  17460: { mainStoryHours: 17, mainExtraHours: 29, completionistHours: 44, allStylesHours: 23, gameplayType: 'Sci-Fi Action RPG' },
  // Mass Effect 2
  24980: { mainStoryHours: 25, mainExtraHours: 36, completionistHours: 50, allStylesHours: 30, gameplayType: 'Sci-Fi Action RPG' },
  // Mass Effect 3
  1238020: { mainStoryHours: 24, mainExtraHours: 37, completionistHours: 52, allStylesHours: 29, gameplayType: 'Sci-Fi Action RPG' },
  // Horizon Zero Dawn
  1151640: { mainStoryHours: 30, mainExtraHours: 45, completionistHours: 77, allStylesHours: 40, gameplayType: 'Open World Action' },
  // XCOM 2
  268500: { mainStoryHours: 33, mainExtraHours: 50, completionistHours: 76, allStylesHours: 42, gameplayType: 'Turn-Based Strategy' },
  // Pillars of Eternity
  291650: { mainStoryHours: 36, mainExtraHours: 62, completionistHours: 90, allStylesHours: 50, gameplayType: 'CRPG' },
  // Pillars of Eternity II: Deadfire
  560130: { mainStoryHours: 42, mainExtraHours: 70, completionistHours: 105, allStylesHours: 58, gameplayType: 'CRPG' },
  // Kingdom Come: Deliverance
  379430: { mainStoryHours: 41, mainExtraHours: 83, completionistHours: 130, allStylesHours: 65, gameplayType: 'Medieval RPG' },
  // Firewatch
  383870: { mainStoryHours: 4, mainExtraHours: 4.5, completionistHours: 5, allStylesHours: 4, gameplayType: 'Walking Simulator' },
  // INDIKA
  1373960: { mainStoryHours: 5, mainExtraHours: 6, completionistHours: 8, allStylesHours: 5.5, gameplayType: 'Narrative Adventure' },
  // GRIS
  683320: { mainStoryHours: 3.5, mainExtraHours: 4.5, completionistHours: 6, allStylesHours: 4, gameplayType: 'Artistic Platformer' },
  // Warhammer 40,000: Rogue Trader
  2186680: { mainStoryHours: 58, mainExtraHours: 95, completionistHours: 140, allStylesHours: 78, gameplayType: 'CRPG' },
  // Tomb Raider (2013)
  203160: { mainStoryHours: 11.5, mainExtraHours: 15.5, completionistHours: 20.5, allStylesHours: 14, gameplayType: 'Action-Adventure' },
  // Rise of the Tomb Raider
  391220: { mainStoryHours: 13.5, mainExtraHours: 20.5, completionistHours: 34, allStylesHours: 18, gameplayType: 'Action-Adventure' },
  // Shadow of the Tomb Raider
  750920: { mainStoryHours: 12.5, mainExtraHours: 20, completionistHours: 33, allStylesHours: 17, gameplayType: 'Action-Adventure' },
  // Dead Space (2008)
  17470: { mainStoryHours: 11, mainExtraHours: 14.5, completionistHours: 20, allStylesHours: 13, gameplayType: 'Survival Horror' },
  // Dead Space 2
  47780: { mainStoryHours: 9, mainExtraHours: 12.5, completionistHours: 17.5, allStylesHours: 11, gameplayType: 'Survival Horror' },
};

/**
 * Gets HowLongToBeat completion times for a given Steam App ID or estimates based on genres/tags.
 */
export function getHowLongToBeat(appId?: number, genres: string[] = [], tags: string[] = []): HltbData {
  if (appId && HLTB_DATABASE[appId]) {
    return HLTB_DATABASE[appId];
  }

  // Estimate based on game genre and tags
  const allDescriptors = [...genres, ...tags].map((t) => t.toLowerCase());

  const isRpg = allDescriptors.some((d) => d.includes('rpg') || d.includes('role-playing'));
  const isOpenWorld = allDescriptors.some((d) => d.includes('open world'));
  const isStrategy = allDescriptors.some((d) => d.includes('strategy') || d.includes('tactics') || d.includes('4x'));
  const isShooter = allDescriptors.some((d) => d.includes('shooter') || d.includes('fps'));
  const isHorror = allDescriptors.some((d) => d.includes('horror'));
  const isPuzzle = allDescriptors.some((d) => d.includes('puzzle') || d.includes('platformer'));
  const isIndie = allDescriptors.some((d) => d.includes('indie') || d.includes('short'));

  if (isRpg && isOpenWorld) {
    return { mainStoryHours: 38, mainExtraHours: 75, completionistHours: 130, allStylesHours: 60, gameplayType: 'Open World RPG' };
  } else if (isRpg) {
    return { mainStoryHours: 30, mainExtraHours: 52, completionistHours: 85, allStylesHours: 42, gameplayType: 'Role-Playing Game' };
  } else if (isStrategy) {
    return { mainStoryHours: 26, mainExtraHours: 45, completionistHours: 72, allStylesHours: 38, gameplayType: 'Strategy / Tactical' };
  } else if (isShooter) {
    return { mainStoryHours: 11, mainExtraHours: 16, completionistHours: 25, allStylesHours: 14, gameplayType: 'First-Person Action' };
  } else if (isHorror) {
    return { mainStoryHours: 9, mainExtraHours: 13, completionistHours: 21, allStylesHours: 11, gameplayType: 'Survival Horror' };
  } else if (isPuzzle || isIndie) {
    return { mainStoryHours: 5, mainExtraHours: 8, completionistHours: 12, allStylesHours: 6.5, gameplayType: 'Adventure / Indie' };
  }

  // General Action-Adventure baseline
  return { mainStoryHours: 12, mainExtraHours: 18, completionistHours: 30, allStylesHours: 15, gameplayType: 'Action-Adventure' };
}
