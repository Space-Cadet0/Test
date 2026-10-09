import os, struct, json, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

# 1. Parse appids from packageinfo.vdf
pkg_path = os.path.expanduser('~/Library/Application Support/Steam/appcache/packageinfo.vdf')
with open(pkg_path, 'rb') as f:
    buf = f.read()

pkg_appids = set()
idx = 0
while True:
    idx = buf.find(b'\x00appids\x00', idx)
    if idx == -1: break
    idx += len(b'\x00appids\x00')
    while idx < len(buf) and buf[idx] != 8:
        if buf[idx] == 2:
            idx += 1
            k_end = buf.find(b'\x00', idx)
            idx = k_end + 1
            aid = struct.unpack('<I', buf[idx:idx+4])[0]
            pkg_appids.add(aid)
            idx += 4
        else:
            idx += 1

# 2. Parse appinfo.vdf
app_path = os.path.expanduser('~/Library/Application Support/Steam/appcache/appinfo.vdf')
with open(app_path, 'rb') as f:
    buf = f.read()

str_table_offset = struct.unpack('<Q', buf[8:16])[0]
offset = str_table_offset
num_strings = struct.unpack('<I', buf[offset:offset+4])[0]
offset += 4
strings = []
for i in range(num_strings):
    end = buf.find(b'\x00', offset)
    strings.append(buf[offset:end].decode('utf-8', errors='ignore'))
    offset = end + 1

name_idx = strings.index('name')
type_idx = strings.index('type')
name_pat = b'\x01' + struct.pack('<I', name_idx)
type_pat = b'\x01' + struct.pack('<I', type_idx)

offset = 16
apps = {}
while offset < str_table_offset:
    appid = struct.unpack('<I', buf[offset:offset+4])[0]
    if appid == 0: break
    offset += 4
    size = struct.unpack('<I', buf[offset:offset+4])[0]
    offset += 4
    app_data = buf[offset:offset+size]
    offset += size

    name = ''
    n_pos = app_data.find(name_pat)
    if n_pos != -1:
        v_start = n_pos + len(name_pat)
        v_end = app_data.find(b'\x00', v_start)
        name = app_data[v_start:v_end].decode('utf-8', errors='ignore')

    app_type = ''
    t_pos = app_data.find(type_pat)
    if t_pos != -1:
        v_start = t_pos + len(type_pat)
        v_end = app_data.find(b'\x00', v_start)
        app_type = app_data[v_start:v_end].decode('utf-8', errors='ignore')

    if name:
        apps[appid] = {'name': name, 'type': app_type}

# 3. Read localconfig for playtime & last played
local_cfg = os.path.expanduser('~/Library/Application Support/Steam/userdata/284583470/config/localconfig.vdf')
import re
playtimes = {}
last_played = {}
if os.path.exists(local_cfg):
    with open(local_cfg, errors='ignore') as f:
        cfg_text = f.read()
    for m in re.finditer(r'\"(\d+)\"\s*\{([^}]+)\}', cfg_text):
        aid = int(m.group(1))
        content = m.group(2)
        pt = re.search(r'\"Playtime\"\s*\"(\d+)\"', content)
        lp = re.search(r'\"LastPlayed\"\s*\"(\d+)\"', content)
        if pt: playtimes[aid] = int(pt.group(1))
        if lp: last_played[aid] = int(lp.group(1))

# 4. Verified owned games strictly
verified_games = []
for aid in sorted(list(pkg_appids)):
    if aid in apps and apps[aid]['type'].lower() == 'game':
        verified_games.append({
            'appId': aid,
            'title': apps[aid]['name'],
            'playtimeMinutes': playtimes.get(aid, 0),
            'lastPlayed': last_played.get(aid, 0),
        })

print(f"Total verified owned games: {len(verified_games)}")

# Existing cache check
cache_file = 'src/services/storage/steamEnrichedCache.json'
existing_cache = {}
if os.path.exists(cache_file):
    try:
        with open(cache_file) as f:
            existing_cache = json.load(f)
    except:
        pass

def enrich_game(game_meta):
    aid = game_meta['appId']
    aid_str = str(aid)
    if aid_str in existing_cache and existing_cache[aid_str].get('aboutTheGame'):
        return aid, existing_cache[aid_str]

    baseUrl = 'https://store.steampowered.com'
    url = f'{baseUrl}/api/appdetails?appids={aid}&l=english'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
    
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            res = json.loads(r.read().decode())
            app = res.get(aid_str, {}).get('data')
            if not app:
                return aid, None

            # User reviews summary
            rev_url = f'{baseUrl}/appreviews/{aid}?json=1&language=all'
            rev_req = urllib.request.Request(rev_url, headers={'User-Agent': 'Mozilla/5.0'})
            rev_data = {}
            try:
                with urllib.request.urlopen(rev_req, timeout=5) as rr:
                    rd = json.loads(rr.read().decode())
                    rev_data = rd.get('query_summary', {})
            except:
                pass

            total_rev = rev_data.get('total_reviews', 0)
            total_pos = rev_data.get('total_positive', 0)
            percent = round((total_pos / total_rev) * 100) if total_rev > 0 else 0

            entry = {
                'appId': aid,
                'name': app.get('name') or game_meta['title'],
                'shortDescription': app.get('short_description', ''),
                'aboutTheGame': app.get('about_the_game', ''),
                'detailedDescription': app.get('detailed_description', ''),
                'headerImage': app.get('header_image', ''),
                'capsuleImage': app.get('capsule_image', ''),
                'developers': app.get('developers', []),
                'publishers': app.get('publishers', []),
                'releaseDate': app.get('release_date', {}).get('date', 'TBA'),
                'genres': [g['description'] for g in app.get('genres', [])],
                'categories': [{'id': c['id'], 'description': c['description']} for c in app.get('categories', [])],
                'screenshots': [{'id': s['id'], 'pathThumbnail': s.get('path_thumbnail'), 'pathFull': s.get('path_full')} for s in app.get('screenshots', [])],
                'movies': [{
                    'id': m['id'],
                    'name': m.get('name'),
                    'thumbnail': m.get('thumbnail'),
                    'webm': m.get('webm', {}),
                    'mp4': m.get('mp4', {})
                } for m in app.get('movies', [])],
                'systemRequirements': {
                    'minimum': app.get('pc_requirements', {}).get('minimum') if isinstance(app.get('pc_requirements'), dict) else None,
                    'recommended': app.get('pc_requirements', {}).get('recommended') if isinstance(app.get('pc_requirements'), dict) else None,
                },
                'supportedLanguages': app.get('supported_languages'),
                'reviewSummary': {
                    'reviewScore': rev_data.get('review_score', 0),
                    'reviewScoreDesc': rev_data.get('review_score_desc', 'No User Reviews'),
                    'totalPositive': total_pos,
                    'totalNegative': rev_data.get('total_negative', 0),
                    'totalReviews': total_rev,
                    'positivePercent': percent,
                }
            }
            return aid, entry
    except Exception as e:
        print(f"Error fetching appId {aid} ({game_meta['title']}): {e}")
        return aid, None

print(f"Starting enrichment for {len(verified_games)} verified owned titles...")
enriched_dict = dict(existing_cache)
count = 0

with ThreadPoolExecutor(max_workers=6) as executor:
    results = executor.map(enrich_game, verified_games)
    for aid, data in results:
        count += 1
        if data:
            enriched_dict[str(aid)] = data
        if count % 20 == 0 or count == len(verified_games):
            print(f"Processed {count}/{len(verified_games)} games (Enriched: {len(enriched_dict)})...")
            # Save periodic progress
            with open(cache_file, 'w') as out_f:
                json.dump(enriched_dict, out_f, indent=2)

print(f"Completed! Enriched {len(enriched_dict)} games successfully.")
