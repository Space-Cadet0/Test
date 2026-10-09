import os, json, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

steam_dir = os.path.expanduser("~/Library/Application Support/Steam")
libcache = os.path.join(steam_dir, "appcache/librarycache")

# Gather all app IDs from librarycache directories and files
app_ids = set()
if os.path.exists(libcache):
    for f in os.listdir(libcache):
        part = f.split("_")[0]
        if part.isdigit() and len(part) >= 2:
            app_ids.add(int(part))
        p = os.path.join(libcache, f)
        if os.path.isdir(p) and f.isdigit():
            app_ids.add(int(f))

# Gather from localconfig
user_cfg = os.path.join(steam_dir, "userdata/284583470/config/localconfig.vdf")
if os.path.exists(user_cfg):
    with open(user_cfg, errors="ignore") as f:
        import re
        for m in re.findall(r"\"(\d{3,8})\"\s*\{", f.read()):
            app_ids.add(int(m))

sorted_ids = sorted(list(app_ids))
print(f"Total Unique Steam App IDs to index: {len(sorted_ids)}")

def fetch_game_info(aid):
    # Check if we already have local files in librarycache
    local_dir = os.path.join(libcache, str(aid))
    has_local_art = os.path.isdir(local_dir)
    header_file = os.path.join(libcache, f"{aid}_header.jpg")
    has_header = os.path.exists(header_file)

    url = f"https://store.steampowered.com/api/appdetails?appids={aid}&filters=basic,genres"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            app = data.get(str(aid), {}).get("data")
            if app:
                name = app.get("name")
                app_type = app.get("type", "game")
                # Filter out tools, config files, or non-playable test apps
                if app_type in ["game", "dlc", "demo", "mod"]:
                    genres = [g["description"] for g in app.get("genres", [])]
                    header_img = app.get("header_image") or f"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{aid}/header.jpg"
                    return {
                        "appId": aid,
                        "title": name,
                        "headerImage": header_img,
                        "type": app_type,
                        "genres": genres,
                        "releaseDate": app.get("release_date", {}).get("date", "TBA"),
                        "shortDescription": app.get("short_description", ""),
                        "hasLocalArt": has_local_art,
                    }
    except Exception as e:
        pass
    return None

print("Fetching metadata for all Steam titles with ThreadPoolExecutor...")
games = []
batch_size = 30
with ThreadPoolExecutor(max_workers=12) as ex:
    results = list(ex.map(fetch_game_info, sorted_ids))
    for r in results:
        if r and r.get("title"):
            games.append(r)

print(f"Successfully resolved {len(games)} Steam games!")

with open("src/services/storage/fullUserSteamGames.json", "w") as f:
    json.dump(games, f, indent=2)

# Convert to TypeScript
lines = [
    "import { CanonicalGame } from '../../contracts/game';",
    "",
    "export const FULL_USER_STEAM_GAMES: CanonicalGame[] = ["
]

for g in games:
    aid = g["appId"]
    entry = f"""  {{
    id: 'steam-{aid}',
    title: {json.dumps(g['title'])},
    sortTitle: {json.dumps(g['title'])},
    steamAppId: {aid},
    platforms: [
      {{
        platformId: 'steam',
        platformGameId: '{aid}',
        installed: {json.dumps(g.get('hasLocalArt', False))},
      }}
    ],
    headerImage: {json.dumps(g.get('headerImage', ''))},
    shortDescription: {json.dumps(g.get('shortDescription', ''))},
    releaseDate: {json.dumps(g.get('releaseDate', 'TBA'))},
    developers: [],
    publishers: [],
    genres: {json.dumps(g.get('genres', []))},
    tags: {json.dumps(g.get('genres', []))},
  }},"""
    lines.append(entry)

lines.append("];\n")

with open("src/services/storage/fullUserSteamGames.ts", "w") as out:
    out.write("\n".join(lines))

print("Saved to src/services/storage/fullUserSteamGames.ts!")
