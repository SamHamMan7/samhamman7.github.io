"""Build a reviewed bot-source update in Pages CI without hosting credentials.

The original prepared media/browser adapter remain in dist; current AI/core
sources are supplied by a small committed ZIP with an explicit commit/hash.
"""
from pathlib import Path
import hashlib
import json
import os
import shutil
import subprocess
import sys
import zipfile
from assemble import ROOT, OUT, SNAPSHOT, write_json, finalize


def extract(archive, overlay=False):
    with zipfile.ZipFile(archive) as source:
        for entry in source.infolist():
            name = entry.filename
            if entry.is_dir() or name.startswith(('browser-edition/', 'models/')):
                continue
            if overlay and not (name.startswith(('src/ai/', 'src/core/', 'src/data/')) or name in
                                {'src/ai.worker.js', 'src/engine.worker.js', 'package.json', 'package-lock.json'}):
                raise RuntimeError('Unexpected bot-source path: ' + name)
            dest = (SNAPSHOT / name).resolve()
            if not dest.is_relative_to(SNAPSHOT.resolve()):
                raise RuntimeError('Archive escaped its source directory')
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(source.read(entry))


def main():
    manifest_path = ROOT / 'bot-updates/current.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    archive = (ROOT / manifest['archive']).resolve()
    if not archive.is_relative_to((ROOT / 'bot-updates').resolve()):
        raise RuntimeError('Unexpected update archive location')
    if hashlib.sha256(archive.read_bytes()).hexdigest() != manifest['sha256']:
        raise RuntimeError('Bot source archive fingerprint mismatch')
    if SNAPSHOT.exists():
        raise RuntimeError('Use a fresh checkout; existing source snapshot is preserved')
    SNAPSHOT.mkdir()
    extract(OUT / 'downloads/OfflineShowdown-browser-source.zip')
    extract(archive, overlay=True)
    modules = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else SNAPSHOT / 'node_modules'
    if len(sys.argv) == 1:
        subprocess.run(['npm.cmd' if os.name == 'nt' else 'npm', 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], cwd=SNAPSHOT, check=True)
    write_json(SNAPSHOT / 'BROWSER-BOT-UPDATE.json', manifest['botUpdate'])
    subprocess.run(['node', str(ROOT / 'build-browser.mjs'), str(SNAPSHOT), str(modules), str(OUT)], cwd=ROOT, check=True)
    for filename, expected in manifest['expectedWorkers'].items():
        if hashlib.sha256((OUT / filename).read_bytes()).hexdigest() != expected:
            raise RuntimeError('Built worker differs from the reviewed browser test: ' + filename)
    for entry in (ROOT / 'web').iterdir():
        if entry.name == 'sw-template.js':
            continue
        if entry.is_dir():
            shutil.copytree(entry, OUT / entry.name, dirs_exist_ok=True)
        else:
            shutil.copyfile(entry, OUT / entry.name)
    finalize()


if __name__ == '__main__':
    main()
