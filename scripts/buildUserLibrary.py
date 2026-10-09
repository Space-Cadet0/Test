import json

with open("src/services/storage/resolvedUserSteamGames.json") as f:
    games = json.load(f)

lines = [
    "import { CanonicalGame } from '../../contracts/game';",
    "",
    "export const USER_SCANNED_STEAM_GAMES: CanonicalGame[] = ["
]

for g in games:
    installed = "true" if g.get("playtimeMinutes", 0) > 60 else "false"
    app_id = g["appId"]
    entry = f"""  {{
    id: 'steam-{app_id}',
    title: {json.dumps(g['title'])},
    sortTitle: {json.dumps(g['title'])},
    steamAppId: {app_id},
    platforms: [
      {{
        platformId: 'steam',
        platformGameId: '{app_id}',
        installed: {installed},
        playtimeMinutes: {g.get('playtimeMinutes', 0)},
      }}
    ],
    headerImage: {json.dumps(g.get('headerImage', ''))},
    shortDescription: {json.dumps(g.get('shortDescription', ''))},
    releaseDate: {json.dumps(g.get('releaseDate', 'TBA'))},
    developers: {json.dumps(g.get('developers', []))},
    publishers: {json.dumps(g.get('publishers', []))},
    genres: {json.dumps(g.get('genres', []))},
    tags: {json.dumps(g.get('categories', []))},
  }},"""
    lines.append(entry)

lines.append("];\n")

with open("src/services/storage/userScannedLibrary.ts", "w") as out:
    out.write("\n".join(lines))

print("Successfully written userScannedLibrary.ts")
