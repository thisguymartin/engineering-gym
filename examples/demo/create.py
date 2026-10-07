"""Render two illustrative learning routes, not a live-model recording.

uv run --no-project --with pillow==12.3.0 python examples/demo/create.py
"""

from pathlib import Path
import os

from PIL import Image, ImageDraw, ImageFont


HERE = Path(__file__).resolve().parent
SIZE = (1100, 620)
BG = '#101827'
PANEL = '#1c2a3e'
INK = '#f1f5fa'
MUTED = '#aec0d3'
ACCENT = '#72e0bd'


def font(size, mono=False):
    options = ([os.environ.get('GYM_DEMO_MONO_FONT', ''),
                '/System/Library/Fonts/Menlo.ttc',
                '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'] if mono else
               [os.environ.get('GYM_DEMO_FONT', ''),
                '/System/Library/Fonts/Supplemental/Arial.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'])
    for option in options:
        if option and Path(option).is_file():
            return ImageFont.truetype(option, size)
    raise RuntimeError('Set GYM_DEMO_FONT and GYM_DEMO_MONO_FONT to local TTF fonts.')


TITLE = font(36)
BODY = font(27)
SMALL = font(20)
MONO = font(25, True)

SCENES = [
    ('01 / INVOKE ON REAL WORK', 'You',
     ['$engineering-gym I am fixing duplicate webhook delivery.',
      'Make me reason about the failure, then implement with me.'],
     'No exercise setup. Use the task you are already doing.'),
    ('02 / ONE USEFUL QUESTION', 'Agent',
     ['Two workers receive the same event at once.',
      'Where could both pass a duplicate check?'],
     'The agent waits for your prediction before showing its answer.'),
    ('03 / YOU MAKE THE DECISION', 'You',
     ['Both can read “absent” before either inserts.',
      'Invariant: one local ledger row per event ID.'],
     'A brief hypothesis is enough. This is not a quiz.'),
    ('04 / DELIVER THE CHANGE', 'Agent',
     ['Check the actual code and reproduce the interleaving.',
      'Then implement the fix and run relevant checks.'],
     'You can code, or AI can code after the checkpoint.'),
    ('05 / CHECK UNDERSTANDING', 'Agent',
     ['What changes if the side effect is an external email',
      'rather than a local database row?'],
     'A changed failure boundary is a better follow-up than retyping the patch.'),
    ('06 / LATER, DO A HANDS-ON REP', 'You',
     ['$engineering-rep Give me an independent retry bug.',
      'Use synthetic data and runnable checks.'],
     'This time the agent sets the task; you write or debug the code.'),
    ('07 / REVIEW THE REAL EVIDENCE', 'Agent',
     ['You run the checks and explain the behavior.',
      'I review after your attempt, not during it.'],
     'Independent work and assisted delivery are different evidence.'),
]


def frame(index):
    title, speaker, lines, footer = SCENES[index]
    im = Image.new('RGB', SIZE, BG)
    draw = ImageDraw.Draw(im)
    draw.text((54, 38), 'engineering-gym', font=SMALL, fill=ACCENT)
    draw.text((850, 38), 'EXPLICIT SKILL', font=SMALL, fill=MUTED)
    draw.text((54, 100), title, font=TITLE, fill=INK)
    draw.rounded_rectangle((54, 183, 1046, 471), radius=22,
                           fill=PANEL, outline='#364b66', width=2)
    draw.text((88, 220), speaker.upper(), font=SMALL, fill=ACCENT)
    for n, line in enumerate(lines):
        face = MONO if index == 0 else BODY
        draw.text((88, 290 + n * 56), line, font=face, fill=INK)
    draw.text((54, 511), footer, font=SMALL, fill=MUTED)
    for n in range(len(SCENES)):
        x = 54 + n * 143
        draw.rounded_rectangle((x, 575, x + 124, 582), radius=3,
                               fill=ACCENT if n <= index else '#31435a')
    return im


frames = [frame(i) for i in range(len(SCENES))]
frames[0].save(HERE / 'daily-workflow.png')
palette = frames[0].quantize(colors=128)
frames = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in frames]
frames[0].save(HERE / 'daily-workflow.gif', save_all=True,
               append_images=frames[1:], duration=[4000] * (len(frames) - 1) + [5000],
               loop=0, optimize=True, disposal=2)
with Image.open(HERE / 'daily-workflow.gif') as gif:
    assert gif.n_frames == len(SCENES) and gif.size == SIZE
print(f"Wrote {HERE / 'daily-workflow.gif'}")
