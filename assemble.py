"""Assemble a standalone static site from the existing, packaged bot release.

Reads the original project; writes only inside this website directory.
"""
from pathlib import Path
import argparse
import hashlib
import json
import mimetypes
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'dist'
SNAPSHOT = ROOT / '.snapshot'


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')


def assemble(bot):
    bot = bot.resolve()
    archive = bot / 'artifacts/OfflineShowdown-source.zip'
    upstream = bot / 'dist'
    for target in (OUT, SNAPSHOT):
        # Do not remove a source project, parent, or an arbitrary computed path.
        if target.resolve().parent != ROOT or target.name not in {'dist', '.snapshot'}:
            raise RuntimeError('Unexpected generated output path')
        if target.exists():
            shutil.rmtree(target)
        target.mkdir()
    with zipfile.ZipFile(archive) as source:
        for entry in source.infolist():
            if entry.filename.startswith('models/'):
                continue
            dest = (SNAPSHOT / entry.filename).resolve()
            if not dest.is_relative_to(SNAPSHOT.resolve()):
                raise RuntimeError('Source archive contains a path outside the snapshot')
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not entry.is_dir():
                dest.write_bytes(source.read(entry))

    main_path = SNAPSHOT / 'src/showdown-main.js'
    main = main_path.read_text(encoding='utf-8')
    assert "['Medium','Strong','Very Strong','Neural Preview']" in main
    main = main.replace("['Medium','Strong','Very Strong','Neural Preview']", "['Medium','Strong','Very Strong']")
    anchor = "Dex.resourcePrefix='/'; Dex.fxPrefix='/fx/';"
    assert anchor in main
    main = main.replace(anchor, anchor + "\n// Browser edition: enforce bundled static graphics and silent play.\nconst nativePrefs=Dex.prefs.bind(Dex);\nDex.prefs=(key)=>['bwgfx','noanim','nogif'].includes(key)?true:nativePrefs(key);\nStorage.prefs('mute',true);\nif(window.BattleSound){window.BattleSound.setMute(true);window.BattleSound.getSound=()=>undefined;}\n")
    anchor = "  return data;\n};"
    if anchor not in main:
        raise RuntimeError('Expected sprite adapter not found')
    main = main.replace(anchor, "  data.cryurl='';\n" + anchor, 1)
    main_path.write_text(main, encoding='utf-8')

    for directory in ('config', 'data', 'js', 'style', 'fx'):
        shutil.copytree(upstream / directory, OUT / directory)
    sprite_dirs = {'gen5','gen5-back','gen5-shiny','gen5-back-shiny','gen6bgs','trainers','types','typeicons','categories','misc'}
    for entry in (upstream / 'sprites').iterdir():
        dest = OUT / 'sprites' / entry.name
        dest.parent.mkdir(parents=True, exist_ok=True)
        if entry.is_dir() and entry.name in sprite_dirs:
            shutil.copytree(entry,dest)
        elif entry.is_file():
            shutil.copy2(entry,dest)
    for filename in ('LICENSE','LICENSE.fontawesome-font','SHOWDOWN-CLIENT-LICENSE.txt','THIRD_PARTY_NOTICES.txt','ASSET-NOTICES.txt','pokemonshowdownbeta.png','pokemonshowdownbeta@2x.png','favicon.ico','favicon-256.png'):
        shutil.copy2(upstream / filename, OUT / filename)
    subprocess.run(['node', str(ROOT / 'build-browser.mjs'), str(SNAPSHOT), str(bot / 'node_modules'), str(OUT)], check=True, cwd=ROOT)

    battle = (upstream / 'index.html').read_text(encoding='utf-8')
    battle = battle.replace('<title>Pokémon Showdown — Offline Practice</title>', '<title>Play Offline Showdown · Math &amp; Play</title>')
    battle = battle.replace('<meta id="viewport" name="viewport" content="width=device-width" />', '<meta id="viewport" name="viewport" content="width=device-width,initial-scale=1" />')
    battle += '''\n<style>#personal-home{position:fixed;bottom:9px;right:12px;z-index:1000;background:#f4f1e9;color:#365c48;padding:8px 12px;border:1px solid #9cab8d;border-radius:4px;font:12px Arial,sans-serif;text-decoration:none}#personal-home:focus-visible{outline:3px solid #756a9c}</style><a class="no-panel-intercept" id="personal-home" href="/">← Math &amp; Play</a>\n'''
    (OUT / 'battle.html').write_text(battle, encoding='utf-8')
    # Both substitute sprite variants and all effect overlays used by the renderer.
    images = ['/' + p.relative_to(OUT).as_posix() for p in sorted(OUT.rglob('*')) if p.is_file() and p.suffix.lower() in {'.png','.jpg','.jpeg','.gif'} and (p.relative_to(OUT).parts[0] == 'fx' or '/sprites/gen6bgs/' in str(p).replace('\\','/') or '/sprites/types/' in str(p).replace('\\','/') or p.stem == 'substitute')]
    write_json(OUT / 'battle-assets.json', {'images':images})
    for p in (ROOT / 'web').iterdir():
        if p.name != 'sw-template.js':
            if p.is_dir(): shutil.copytree(p, OUT / p.name, dirs_exist_ok=True)
            else: shutil.copy2(p, OUT / p.name)
    # Raster home screen icons are generated from native vector shapes, not AI art.
    from PIL import Image, ImageDraw, ImageFont
    for size in (192,512):
        image=Image.new('RGB',(size,size),'#365c48')
        draw=ImageDraw.Draw(image)
        font=ImageFont.truetype('C:/Windows/Fonts/georgiai.ttf',round(size*.43))
        draw.text((size/2,size/2),'m/p',font=font,fill='#f4f1e9',anchor='mm',stroke_width=0)
        image.save(OUT / f'icon-{size}.png')
    write_json(OUT / 'manifest.webmanifest', {'name':'my site','short_name':'my site','start_url':'/','scope':'/','display':'standalone','background_color':'#ffffff','theme_color':'#365c48','icons':[{'src':f'/icon-{s}.png','sizes':f'{s}x{s}','type':'image/png','purpose':'any'} for s in (192,512)]})
    (OUT / '.nojekyll').touch()
    finalize()


def update_bot(bot):
    """Refresh only the battle workers; retain the website's browser adapter/assets.

    Read committed bot files, never private teams, credentials or training data.
    The previous matching source ZIP restores the pinned client/build material.
    """
    bot = bot.resolve()
    archive = OUT / 'downloads/OfflineShowdown-browser-source.zip'
    if SNAPSHOT.exists():
        raise RuntimeError('Use a fresh website checkout for --update-bot; existing snapshot is preserved')
    SNAPSHOT.mkdir()
    with zipfile.ZipFile(archive) as source:
        for entry in source.infolist():
            if entry.filename.startswith(('browser-edition/', 'models/')):
                continue
            dest = (SNAPSHOT / entry.filename).resolve()
            if not dest.is_relative_to(SNAPSHOT.resolve()):
                raise RuntimeError('Source archive escaped the snapshot')
            if not entry.is_dir():
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(source.read(entry))
    paths = ['src/ai', 'src/core', 'src/data', 'src/ai.worker.js',
             'src/engine.worker.js', 'package.json', 'package-lock.json']
    subprocess.run(['git', '-C', str(bot), 'diff', '--exit-code', 'HEAD', '--', *paths], check=True, stdout=subprocess.DEVNULL)
    commit = subprocess.check_output(['git', '-C', str(bot), 'rev-parse', 'HEAD'], text=True).strip()
    patch = ROOT / '.bot-update.zip'
    subprocess.run(['git', '-C', str(bot), 'archive', '--format=zip', '--output=' + str(patch), 'HEAD', *paths], check=True)
    try:
        with zipfile.ZipFile(patch) as source:
            for entry in source.infolist():
                dest = (SNAPSHOT / entry.filename).resolve()
                if not dest.is_relative_to(SNAPSHOT.resolve()):
                    raise RuntimeError('Bot archive escaped the snapshot')
                if not entry.is_dir():
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    dest.write_bytes(source.read(entry))
    finally:
        patch.unlink()
    metadata = {'sourceCommit':commit, 'updated':'2026-11-10',
                'policy':'public-set response search for Very Strong RandBats',
                'otherFormats':'unchanged stable singles/doubles controllers',
                'browserAdapter':'preserved from previous browser edition',
                'championsArena':'Node server controller; not hosted by static GitHub Pages'}
    write_json(SNAPSHOT / 'BROWSER-BOT-UPDATE.json', metadata)
    subprocess.run(['node', str(ROOT / 'build-browser.mjs'), str(SNAPSHOT), str(bot / 'node_modules'), str(OUT)], check=True, cwd=ROOT)
    finalize()


def finalize():
    metadata_path = SNAPSHOT / 'BROWSER-BOT-UPDATE.json'
    metadata = json.loads(metadata_path.read_text(encoding='utf-8')) if metadata_path.exists() else None

    # Deliver matching human-readable source, excluding undeployed neural weights.
    source_readme = '''Browser edition\n===============\nThis archive preserves the packaged September 2026 source release.\nChanges: static sprite preferences; silent battles; no Neural Preview menu item;\npersonal homepage; complete offline game download. Source uses AGPL-3.0.\n\nTo rebuild JS: install Node, run npm ci, then:\n  node browser-edition/build-browser.mjs . node_modules OUTPUT_DIRECTORY\nCopy the upstream prepared assets and use browser-edition/assemble.py with the\noriginal prepared bot directory to reproduce the whole static website. Prepared\nmedia is distributed in the site itself with separate artwork notices.\nThe server-backed Champions option and optional neural models are not deployed.\nFull website source and assembly script are in browser-edition/.\n'''
    if metadata:
        source_readme = source_readme.replace('This archive preserves the packaged September 2026 source release.',
            'The browser adapter and pinned client are preserved from the packaged release.\nBattle-worker sources were updated from bot commit ' + metadata['sourceCommit'] + '.\nSee BROWSER-BOT-UPDATE.json. No Arena token, team or learned weights are included.\nChampions VGC: src/champions-browser + scripts/lib, built with scripts/build-champions-browser.mjs\nagainst the pinned Pokemon Showdown simulator (MIT; commit in scripts/lib/champions-reconstruction.mjs of the bot repo).')
    (SNAPSHOT / 'BROWSER-EDITION.txt').write_text(source_readme,encoding='utf-8')
    source_out = OUT / 'downloads/OfflineShowdown-browser-source.zip'
    source_out.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(source_out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p in sorted(SNAPSHOT.rglob('*')):
            if p.is_file() and 'node_modules' not in p.relative_to(SNAPSHOT).parts: z.write(p,p.relative_to(SNAPSHOT).as_posix())
        for p in [ROOT / 'assemble.py', ROOT / 'apply-bot-update.py', ROOT / 'build-browser.mjs', ROOT / 'README.md', ROOT / 'verify-practice.mjs', ROOT / 'verify-offline.mjs', *(p for p in (ROOT / 'web').rglob('*') if p.is_file() and p.name != 'champions.worker.js')]:
            z.write(p,'browser-edition/' + p.relative_to(ROOT).as_posix())
    if source_out.stat().st_size > 25*1024*1024:
        raise RuntimeError('Source archive exceeds the hosting asset size limit')

    files = [p for p in sorted(OUT.rglob('*')) if p.is_file() and not {'downloads','offline-packs'}.intersection(p.relative_to(OUT).parts) and p.name not in {'sw.js','offline-manifest.json','browser-build-info.json'}]
    hasher = hashlib.sha256()
    for p in files:
        hasher.update(p.relative_to(OUT).as_posix().encode());hasher.update(p.read_bytes())
    version = hasher.hexdigest()[:16]
    pack_dir = OUT / 'offline-packs';pack_dir.mkdir(exist_ok=True)
    packs, index = [], {}
    payload = bytearray()
    def flush():
        if not payload: return
        name=f'{version}-{len(packs)}.bin'
        (pack_dir / name).write_bytes(payload)
        packs.append({'url':'/offline-packs/'+name,'bytes':len(payload),'sha256':hashlib.sha256(payload).hexdigest()})
        payload.clear()
    for p in files:
        content = p.read_bytes()
        if payload and len(payload)+len(content)>19*1024*1024: flush()
        mime = mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
        if p.suffix=='.js': mime='text/javascript; charset=utf-8'
        if p.suffix=='.html': mime='text/html; charset=utf-8'
        if p.suffix=='.css': mime='text/css; charset=utf-8'
        if p.suffix=='.json': mime='application/json'
        index['/'+p.relative_to(OUT).as_posix()]={'pack':len(packs),'offset':len(payload),'bytes':len(content),'type':mime}
        payload.extend(content)
    flush()
    write_json(OUT / 'offline-manifest.json', {'version':version,'totalBytes':sum(p['bytes'] for p in packs),'packs':packs,'files':index})
    worker = (ROOT / 'web/sw-template.js').read_text(encoding='utf-8').replace('__VERSION__',version)
    (OUT / 'sw.js').write_text(worker,encoding='utf-8')
    write_json(OUT / 'browser-build-info.json', {'source':'November 2026 RandBats worker update' if metadata else 'Existing packaged September 2026 source release','botUpdate':metadata,'formats':['gen9championsvgc2026regmc','gen9ou','gen9randombattle','gen9randomdoublesbattle'],'version':version,'staticSprites':True,'sound':False,'neuralModels':False,'sourceArchiveBytes':source_out.stat().st_size,'offlineBytes':sum(p['bytes'] for p in packs),'offlineFiles':len(index)})
    print(json.dumps({'version':version,'offlineMiB':round(sum(p['bytes'] for p in packs)/1048576,1),'files':len(index),'packs':len(packs),'sourceMiB':round(source_out.stat().st_size/1048576,1)}))


if __name__ == '__main__':
    parser=argparse.ArgumentParser();parser.add_argument('bot',type=Path,nargs='?');parser.add_argument('--refresh',action='store_true');parser.add_argument('--update-bot',action='store_true')
    args=parser.parse_args()
    if args.update_bot:
        if not args.bot or args.refresh: parser.error('--update-bot requires the existing bot directory, without --refresh')
        update_bot(args.bot)
    elif args.refresh:
        for p in (ROOT / 'web').iterdir():
            if p.name != 'sw-template.js':
                if p.is_dir(): shutil.copytree(p,OUT / p.name,dirs_exist_ok=True)
                else: shutil.copy2(p,OUT / p.name)
        battle_path=OUT / 'battle.html'
        battle=battle_path.read_text(encoding='utf-8').replace('.personal-home','#personal-home').replace('class="personal-home"','class="no-panel-intercept" id="personal-home"').replace('← Math &amp; Play','← my site')
        battle_path.write_text(battle,encoding='utf-8')
        finalize()
    elif args.bot: assemble(args.bot)
    else: parser.error('Supply the original bot directory, or --refresh for homepage-only edits.')
