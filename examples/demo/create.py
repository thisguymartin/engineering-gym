"""Render a walkthrough from real CLI results in a disposable checkout.

Run: uv run --no-project --with pillow==12.3.0 python examples/demo/create.py
Only the GIF is needed to view the demo. Python/Pillow are authoring tools.
"""
from datetime import datetime, timedelta, timezone
from pathlib import Path
import json
import os
import shutil
import subprocess
import tempfile
import textwrap

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'examples/demo'
WIDTH, HEIGHT = 1120, 710
COLORS = dict(bg='#0c1423', panel='#121e30', ink='#dbe5f3', muted='#91a3bd',
              accent='#65dec2', warning='#ffcc85', border='#2a3b54')


def font(size, mono=False):
    candidates = ([os.environ.get('GYM_DEMO_MONO_FONT', ''),
                   '/System/Library/Fonts/Menlo.ttc',
                   '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'] if mono else
                  [os.environ.get('GYM_DEMO_FONT', ''),
                   '/System/Library/Fonts/Supplemental/Arial.ttf',
                   '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'])
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return ImageFont.truetype(candidate, size)
    raise RuntimeError('Set GYM_DEMO_FONT and GYM_DEMO_MONO_FONT to local TTF files.')


TITLE, BODY, MONO, SMALL = font(32), font(21), font(18, True), font(16)
scenes = []
transcript = []


def scene(title, subtitle, command, lines, note, hold=3300):
    scenes.append(dict(title=title, subtitle=subtitle, command=command,
                       lines=lines, note=note, hold=hold))


with tempfile.TemporaryDirectory(prefix='gym-demo-') as temp:
    gym = Path(temp)
    for name in ['scripts', 'exercises']:
        shutil.copytree(ROOT / name, gym / name)
    shutil.copy(ROOT / 'package.json', gym / 'package.json')
    env = {k: os.environ[k] for k in ['PATH', 'TMPDIR', 'TEMP', 'TMP', 'SystemRoot']
           if k in os.environ}
    env.update(NO_COLOR='1', FORCE_COLOR='0')

    def cli(*args, expected=0):
        command = ['npm', 'run', '--silent', 'gym', '--', *args]
        result = subprocess.run(command, cwd=gym, env=env, capture_output=True,
                                text=True, timeout=30)
        if result.returncode != expected:
            raise RuntimeError(f'{command}: {result.stdout}\n{result.stderr}')
        transcript.append(dict(command=' '.join(command), exit_code=result.returncode,
                               stdout=result.stdout, stderr=result.stderr))
        return ' '.join(command), result.stdout.strip()

    command, output = cli('list')
    scene('01  Pick a concept', 'Three small exercise families. Start with one behavior.',
          command, output.splitlines(), 'No model, API key or database server required.', 3400)

    command, output = cli('start', 'duplicate-delivery', '--mode', 'independent', '--id', 'demo')
    scene('02  Start a private attempt', 'A fresh starter, your own notes, no reference solution.',
          command, output.splitlines()[:5],
          'Close the agent and disable generative completion for independent practice.', 4000)

    prediction = ('# Before running\n\n'
                  'Prediction: two interleaved deliveries may both write.\n'
                  'Invariant: one persisted ledger entry per event ID.\n\n'
                  'Next experiment: run the supplied barrier check.\n')
    (gym / '.gym/demo/workspace/notes.md').write_text(prediction)
    scene('03  Predict before running', 'Example learner notes, entered in your own editor.',
          '.gym/demo/workspace/notes.md', prediction.strip().splitlines(),
          'Make a prediction, edit the starter, and add a regression when ready.', 3400)

    command, output = cli('check', 'demo', expected=1)
    cases = json.loads(output.splitlines()[0])
    failures = [case for case in cases if not case['passed']]
    assert len(failures) == 1 and failures[0]['name'] == 'interleaved duplicate writes once'
    results = [('PASS  ' if case['passed'] else 'FAIL  ') + case['name'] for case in cases]
    results += ['', failures[0]['error'].split(':', 1)[0], '2 !== 1', '',
                'Exit code: 1 (the starter intentionally contains a bug)']
    scene('04  Check the behavior', 'Actual acceptance results, condensed for readability.',
          command, results, 'A failing check is useful evidence. This demo does not show the solution.', 4500)

    revisit = (datetime.now(timezone.utc).date() + timedelta(days=7)).isoformat()
    review = dict(result='partial', evidence='Barrier check produced two ledger entries for one event.',
                  unresolved='Which writes must share an atomic boundary?', revisit=revisit)
    (gym / '.gym/demo/review.json').write_text(json.dumps(review, indent=2) + '\n')
    scene('05  Record what actually happened', 'Example review, entered in your editor. Partial is a valid result.',
          '.gym/demo/review.json', json.dumps(review, indent=2).splitlines(),
          'Record evidence and one open question. Choose your own revisit date.', 4500)

    command, output = cli('record', 'demo')
    assert json.loads(output)['independentlySolved'] is False
    due_command, due_output = cli('due')
    assert revisit in due_output and 'demo (base)' in due_output
    scene('06  Save it and plan a revisit', 'The helper saves a local record and reads the revisit date.',
          command, ['"result": "partial",', '"independentlySolved": false,',
                    '"independence": "self-reported"', '', '$ ' + due_command, '', due_output],
          'Record output excerpted. No mastery score and no background scheduler.', 4200)

    command, output = cli('start', 'duplicate-delivery', '--variation', 'rollback', '--id', 'later')
    scene('07  Later: change the failure boundary', 'A new attempt with a different requirement.',
          command, output.splitlines()[:5],
          'Try the variation in a later session. Can you explain it with less help?', 4200)

OUT.joinpath('session.json').write_text(json.dumps({
    'description': 'Synthetic demo captured in a temporary checkout. Not a learner assessment.',
    'commands': transcript,
}, indent=2) + '\n')


def render(index, command, show_output):
    item = scenes[index]
    image = Image.new('RGB', (WIDTH, HEIGHT), COLORS['bg'])
    draw = ImageDraw.Draw(image)
    draw.text((42, 28), 'engineering-gym', font=BODY, fill=COLORS['accent'])
    draw.text((890, 33), 'OFFLINE PRACTICE', font=SMALL, fill=COLORS['muted'])
    draw.text((42, 79), item['title'], font=TITLE, fill=COLORS['ink'])
    draw.text((42, 124), item['subtitle'], font=BODY, fill=COLORS['muted'])
    draw.rounded_rectangle((32, 171, 1088, 608), radius=14, fill=COLORS['panel'],
                           outline=COLORS['border'], width=1)
    for x, color in [(56, '#f78383'), (78, '#efc56b'), (100, '#65c9a5')]:
        draw.ellipse((x, 189, x + 10, 199), fill=color)
    draw.text((130, 184), 'engineering-gym / synthetic demo', font=SMALL, fill=COLORS['muted'])
    draw.line((48, 215, 1072, 215), fill=COLORS['border'])
    is_file = item['command'].startswith('.gym/')
    text = ('file: ' if is_file else '$ ') + command
    y = 235
    for line in textwrap.wrap(text, 91):
        draw.text((56, y), line, font=MONO, fill=COLORS['accent'])
        y += 28
    y += 17
    if show_output:
        for line in item['lines']:
            color = COLORS['warning'] if line.startswith(('FAIL', '2 !==', 'Exit code')) else COLORS['ink']
            for wrapped in textwrap.wrap(line, 90, replace_whitespace=False) or ['']:
                if y > 580:
                    raise RuntimeError(f'Text overflow in scene {index + 1}')
                draw.text((56, y), wrapped, font=MONO, fill=color)
                y += 27
    draw.text((42, 633), item['note'], font=SMALL, fill=COLORS['muted'])
    for step in range(len(scenes)):
        x = 42 + step * 151
        draw.rounded_rectangle((x, 674, x + 137, 679), radius=2,
                               fill=COLORS['accent'] if step <= index else COLORS['border'])
    return image


frames, durations = [], []
for index, item in enumerate(scenes):
    if item['command'].startswith('.gym/'):
        frames.append(render(index, item['command'], True)); durations.append(item['hold'])
    else:
        for end in range(0, len(item['command']), 5):
            frames.append(render(index, item['command'][:end] + '_', False)); durations.append(45)
        frames.append(render(index, item['command'], True)); durations.append(item['hold'])
    if index == 0:
        frames[-1].save(OUT / 'walkthrough.png')

# One palette avoids color flicker while letting GIF store compact changed rectangles.
palette = frames[0].quantize(colors=128)
frames = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
frames[0].save(OUT / 'walkthrough.gif', save_all=True, append_images=frames[1:],
               duration=durations, loop=0, optimize=True, disposal=1)
with Image.open(OUT / 'walkthrough.gif') as gif:
    total = 0
    for frame in range(gif.n_frames):
        gif.seek(frame); gif.load(); total += gif.info.get('duration', 0)
    assert gif.n_frames > 20 and gif.size == (WIDTH, HEIGHT)
    print(f'GIF: {gif.n_frames} frames, {total / 1000:.1f}s, '
          f'{(OUT / "walkthrough.gif").stat().st_size / 1024:.0f} KiB')
