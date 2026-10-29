#!/usr/bin/env python3
"""Build the stage backgrounds from the images listed in tools/stages.config.js.

    python3 tools/build_stages.py                 # every stage
    python3 tools/build_stages.py puente          # only these

Each stage's image (the ChatGPT art in images/fondos/arte/, or the photo while the art is missing) is cut
to the strip the game draws behind the fight and written to assets/stages/<id>.png. The log suggests the
haze and floor colours for the stage's entry in STAGES (js/story.js).

Needs Google Chrome, like build_sprites.py. To see the crop: python3 serve.py, then open
http://localhost:8765/tools/stage-cutter.html?stage=puente&debug=1
"""
import os, re, sys

from build_sprites import ROOT, find_chrome, run_page, start_server, write_png

OUT_DIR = os.path.join(ROOT, 'assets', 'stages')


def config_ids():
    src = open(os.path.join(ROOT, 'tools', 'stages.config.js'), encoding='utf-8').read()
    return re.findall(r'^  (\w+): \{', src, re.M)


def main():
    ids = sys.argv[1:] or config_ids()
    os.makedirs(OUT_DIR, exist_ok=True)
    chrome, srv = find_chrome(), start_server()
    try:
        for sid in ids:
            print(f'building {sid} ...', flush=True)
            r = run_page(chrome, srv.server_address[1], f'tools/stage-cutter.html?stage={sid}', sid)
            write_png(os.path.join(OUT_DIR, f'{sid}.png'), r['png'])
            for line in r['log']:
                print('  ' + line)
    finally:
        srv.shutdown()


if __name__ == '__main__':
    main()
