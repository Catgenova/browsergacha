# PWA icons: an original pixel crystal on the game's dark panel color,
# drawn on a 16x16 grid and scaled with NEAREST so it reads as pixel
# art at 192 and 512. No game spritesheets are touched or reused.
from PIL import Image, ImageDraw

BG = (28, 25, 38, 255)        # #1c1926 — the game's panel background
EDGE = (58, 52, 80, 255)      # #3a3450 — the game's panel border
CRYSTAL = {
    'lite': (200, 240, 255, 255),
    'main': (94, 194, 240, 255),
    'deep': (44, 120, 190, 255),
    'dark': (24, 70, 130, 255),
}
GOLD = (255, 215, 106, 255)

# 16x16 cell map: . bg, e edge, l/m/d/k crystal shades, g gold sparkle
GRID = [
    "................",
    "......g.........",
    ".......l........",
    "......lml.......",
    ".....lmmml......",
    "....lmmdmml.....",
    "....lmdmdml.....",
    "...lmmdmdmml....",
    "...lmdmmmdml....",
    "...lmdmdmdml....",
    "....kmdmdmk.....",
    "....kkmdmkk.....",
    ".....kkmkk......",
    "......kkk....g..",
    ".g.....k........",
    "................",
]
SHADE = {'l': 'lite', 'm': 'main', 'd': 'deep', 'k': 'dark'}


def build(size, path):
    cell = Image.new('RGBA', (16, 16), BG)
    px = cell.load()
    for y, row in enumerate(GRID):
        for x, ch in enumerate(row):
            if ch == 'g':
                px[x, y] = GOLD
            elif ch in SHADE:
                px[x, y] = CRYSTAL[SHADE[ch]]
    img = cell.resize((size, size), Image.NEAREST)
    # Rounded-corner border in the panel style.
    d = ImageDraw.Draw(img)
    r = size // 8
    w = max(2, size // 48)
    d.rounded_rectangle([w // 2, w // 2, size - 1 - w // 2, size - 1 - w // 2],
                        radius=r, outline=EDGE, width=w)
    # Knock the corners transparent outside the rounding.
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    img.putalpha(mask)
    img.save(path)
    print(path)


build(192, 'assets/icons/icon-192.png')
build(512, 'assets/icons/icon-512.png')
