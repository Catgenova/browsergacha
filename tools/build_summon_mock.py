# Summoning Hall — a design mock of the summon screen composed from the
# uploaded medieval pixel-UI kits (PixelRPGDialogueUI + PixelSkillIcons
# BookUI + PixelHUDUI). Assets are embedded as data URIs, untouched
# except for scaling/cropping at render time.
import base64, io, os
from PIL import Image

ROOT = '/home/user/browsergacha'
UI = f'{ROOT}/assets/UI'
DLG = f'{UI}/PixelRPGDialogueUI_Resource'
BOOK = f'{UI}/PixelSkillIcons_BookUI_PNG/UI Elements'
HUD = f'{UI}/PixelHUDUI_v1.0_FreeDemo'

def b64(path, maxw=None):
    im = Image.open(path).convert('RGBA')
    if maxw and im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.NEAREST)
    buf = io.BytesIO()
    im.save(buf, format='PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

def font64(path):
    return 'data:font/ttf;base64,' + base64.b64encode(open(path, 'rb').read()).decode()

# Hero portrait: first idle frame, alpha-cropped, flipped right when the
# art is authored facing left (same flags as the game defs).
FACE_LEFT = {'lucian', 'esmerelda', 'koe', 'angelica', 'florence',
             'javarious', 'artur', 'franz', 'lin', 'slick',
             'andrew', 'cain', 'catherine'}
IDLE = {
    'polarus': 'Polarus/polarusidle.png', 'echo': 'Echo/Echoidle.png',
    'florence': 'florence/KnightIdle.png', 'angelica': 'Angelica/angelicaidle.png',
    'javarious': 'Javarious/javariousidle.png', 'silas': 'Silas/silasidle.png',
    'artur': 'Artur/arturidle.png', 'lucian': 'Lucian/lucianidle.png',
    'esmerelda': 'Esmerelda/esmereldaidle.png', 'koe': 'Koe/koeidle.png',
    'samuels': 'Samuels/samuelsidle.png', 'rat_spearman': 'rat_spearman/ratspearmanidle.png',
}
def hero64(hid, size=150):
    path = f'{ROOT}/assets/heroes/{IDLE[hid]}'
    im = Image.open(path).convert('RGBA')
    n = max(1, round(im.width / im.height))
    fw = im.width // n
    cell = im.crop((0, 0, fw, im.height))
    box = cell.getbbox()
    if box: cell = cell.crop(box)
    if hid in FACE_LEFT: cell = cell.transpose(Image.FLIP_LEFT_RIGHT)
    cell.thumbnail((size, size), Image.NEAREST)
    buf = io.BytesIO(); cell.save(buf, format='PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

A = {
  'bg':        b64(f'{BOOK}/UI_Image_Bg.png', 1400),
  'book':      b64(f'{BOOK}/UI_Image_MagicBook.png', 1100),
  'drape_b':   b64(f'{BOOK}/UI_Image_Drape_Blue.png', 420),
  'drape_r':   b64(f'{BOOK}/UI_Image_Drape_Red.png', 420),
  'ribbon_r':  b64(f'{DLG}/UI Elements/Components/UI_Dialogue_TitleRibbon_Red.png'),
  'ribbon_w':  b64(f'{DLG}/UI Elements/Components/UI_Dialogue_TitleRibbon_White.png'),
  'corner_l':  b64(f'{DLG}/UI Elements/Deco/UI_Decoration_Corner_L.png'),
  'corner_r':  b64(f'{DLG}/UI Elements/Deco/UI_Decoration_Corner_R.png'),
  'line_orn':  b64(f'{DLG}/UI Elements/Deco/UI_Decoration_Line_Ornament.png'),
  'diamond':   b64(f'{DLG}/UI Elements/Deco/UI_Decoration_Diamond.png'),
  'scroll':    b64(f'{DLG}/Icons/UI_Icon_Scroll.png'),
  'book_icon': b64(f'{DLG}/Icons/UI_Icon_Book.png'),
  'close':     b64(f'{DLG}/Icons/UI_Icon_Close.png'),
  'check':     b64(f'{DLG}/Icons/UI_Icon_Check.png'),
  'choice':    b64(f'{BOOK}/../../PixelRPGDialogueUI_Resource/UI Elements/Buttons/UI_Dialogue_ChoiceButton.png'),
  'choice_h':  b64(f'{DLG}/UI Elements/Buttons/UI_Dialogue_ChoiceButton_Hover.png'),
  'btn_red':   b64(f'{DLG}/UI Elements/Buttons/UI_Dialogue_Button_Red.png'),
  'bar_bg':    b64(f'{HUD}/UI_StatusBar_Bg.png'),
  'bar_fill':  b64(f'{HUD}/UI_StatusBar_Fill_HP.png'),
  'slot':      b64(f'{BOOK}/UI_Slot_Normal.png'),
  'slot_h':    b64(f'{BOOK}/UI_Slot_hover.png'),
  'slotdeco':  b64(f'{BOOK}/UI_SkillSlot_Deco.png'),
  'octagon':   b64(f'{DLG}/UI Elements/Panel/UI_Panel_Slot.png'),
  'star':      b64(f'{BOOK}/UI_badge_Star.png'),
  'star_off':  b64(f'{BOOK}/UI_badge_Star_Off.png'),
  'pagedeco':  b64(f'{BOOK}/UI_Image_PageDeco.png', 300),
  'pocus_lt':  b64(f'{BOOK}/UI_Pocus_Corner_LT.png'),
  'pocus_rt':  b64(f'{BOOK}/UI_Pocus_Corner_RT.png'),
  'pocus_lb':  b64(f'{BOOK}/UI_Pocus_Corner_LB.png'),
  'pocus_rb':  b64(f'{BOOK}/UI_Pocus_Corner_RB.png'),
}
H = {hid: hero64(hid) for hid in IDLE}
FONT = font64(f'{DLG}/Font/NeoDunggeunmoPro-Regular.ttf')

def stars(n, total):
    out = ''
    for i in range(total):
        src = A['star'] if i < n else A['star_off']
        out += f'<img class="star" src="{src}" alt="">'
    return out

def octo(hid, name, claimed=False):
    x = f'<img class="octo-x" src="{A["close"]}" alt="pity claimed">' if claimed else ''
    cls = ' claimed' if claimed else ''
    return (f'<div class="octo{cls}"><img class="octo-frame" src="{A["octagon"]}" alt="">'
            f'<img class="octo-hero" src="{H[hid]}" alt="{name}">{x}'
            f'<span class="octo-name">{name}</span></div>')

def result(hid, name, star_n, five=False):
    frame = A['slot_h'] if five else A['slot']
    deco = f'<img class="res-deco" src="{A["slotdeco"]}" alt="">' if five else ''
    pocus = (f'<img class="pc lt" src="{A["pocus_lt"]}" alt=""><img class="pc rt" src="{A["pocus_rt"]}" alt="">'
             f'<img class="pc lb" src="{A["pocus_lb"]}" alt=""><img class="pc rb" src="{A["pocus_rb"]}" alt="">') if five else ''
    return (f'<div class="res{" res-five" if five else ""}">{deco}'
            f'<img class="res-frame" src="{frame}" alt="">'
            f'<img class="res-hero" src="{H[hid]}" alt="{name}">{pocus}'
            f'<div class="res-stars">{stars(star_n, 5 if five else star_n)}</div>'
            f'<span class="res-name">{name}</span></div>')

html = f'''<title>Summoning Hall</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,500;0,700;1,400&display=swap">
<style>
@font-face {{
  font-family: 'NeoDunggeunmo';
  src: url('{FONT}') format('truetype');
  font-display: swap;
}}
/* Summoning Hall — a committed single-theme mock: the kit's own
   parchment, oxblood and brass over dark oak. Every color painted. */
:root {{
  --oak: #241a12;
  --parchment: #ecdcae;
  --parchment-deep: #d9bf8a;
  --ink: #3b2618;
  --ink-soft: #6b4a2e;
  --oxblood: #6e1b26;
  --brass: #c8963e;
  --cream: #f4ead2;
  --px: 'NeoDunggeunmo', 'Courier New', monospace;
  --serif: 'Alegreya', Georgia, serif;
}}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
  background: var(--oak);
  color: var(--cream);
  font-family: var(--serif);
  font-size: 16px;
  line-height: 1.55;
}}
img {{ image-rendering: pixelated; }}
.stage {{
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    linear-gradient(rgba(24,16,10,.82), rgba(24,16,10,.9)),
    url('{A["bg"]}') center / cover no-repeat;
  padding: 34px 18px 46px;
}}
.hall {{ max-width: 1180px; margin: 0 auto; }}

/* ---- Title ribbon ---- */
.masthead {{ display: flex; justify-content: center; margin-bottom: 6px; }}
.ribbon {{ position: relative; width: min(430px, 90vw); }}
.ribbon img {{ width: 100%; display: block; }}
.ribbon span {{
  position: absolute; inset: 0 8% 24% 8%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--px); font-size: clamp(19px, 3.4vw, 26px);
  letter-spacing: 2px; color: var(--cream);
  text-shadow: 0 2px 0 rgba(0,0,0,.5);
}}
.subtitle {{
  text-align: center; color: var(--parchment-deep);
  font-style: italic; margin-bottom: 26px; font-size: 15px;
}}

/* ---- Main grid: drape / book / drape ---- */
.rite {{
  display: grid;
  grid-template-columns: 258px minmax(0, 1fr) 258px;
  gap: 18px;
  align-items: start;
}}
@media (max-width: 980px) {{ .rite {{ grid-template-columns: 1fr; }} }}

/* Banner drapes */
.drape {{ position: relative; text-align: center; }}
.drape > .cloth {{ width: 100%; max-width: 258px; display: block; margin: 0 auto; }}
.drape-title {{
  position: absolute; top: 24px; left: 50%; transform: translateX(-50%);
  width: 88%;
}}
.drape-title img {{ width: 100%; display: block; }}
.drape-title span {{
  position: absolute; inset: 6% 10% 30% 10%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--px); font-size: 15px; letter-spacing: 1px;
  color: var(--cream); text-shadow: 0 2px 0 rgba(0,0,0,.5);
}}
.drape-title.lite span {{ color: var(--ink); text-shadow: none; }}
.drape-kind {{
  position: absolute; top: 92px; left: 0; right: 0;
  font-family: var(--px); font-size: 12px; letter-spacing: 1px;
  color: rgba(244,234,210,.85);
}}
.octos {{
  position: absolute; top: 118px; left: 0; right: 0;
  display: flex; flex-direction: column; align-items: center; gap: 5px;
}}
.octo {{ position: relative; width: 66px; }}
.octo-frame {{ width: 66px; display: block; }}
.octo-hero {{
  position: absolute; inset: 8px; width: 50px; height: 50px;
  object-fit: contain;
}}
.octo.claimed .octo-hero {{ filter: grayscale(1) brightness(.6); }}
.octo-x {{ position: absolute; inset: 13px; width: 40px; }}
.octo-name {{
  display: block; margin-top: 2px; font-family: var(--px);
  font-size: 11px; color: rgba(244,234,210,.9);
  text-shadow: 0 1px 0 rgba(0,0,0,.6);
}}
.drape-pity {{
  margin: 10px auto 0; width: 78%;
  font-family: var(--px); font-size: 11px; color: var(--parchment-deep);
}}
.drape-pity .meter {{ margin-top: 3px; }}

/* The open tome */
.tome {{ position: relative; padding-top: 8px; }}
.tome-book {{ width: 100%; display: block; }}
.tome-pages {{
  position: absolute; inset: 9% 7.5% 16% 7.5%;
  display: grid; grid-template-columns: 1fr 1fr; gap: 7%;
  color: var(--ink);
}}
.page {{ position: relative; padding: 4% 5%; min-width: 0; }}
.page-sigil {{
  position: absolute; inset: 0; margin: auto; width: 70%; opacity: .12;
  pointer-events: none;
}}
.page h2 {{
  font-family: var(--px); font-size: clamp(13px, 1.7vw, 18px);
  letter-spacing: 1px; color: var(--oxblood);
  text-align: center; margin-bottom: 4%;
}}
.page .rule {{ width: 100%; display: block; margin: 2% 0 5%; }}
.wallet {{ display: flex; flex-direction: column; gap: 6%; }}
.wallet-row {{ display: flex; align-items: center; gap: 10px; }}
.wallet-row img {{ width: 30px; height: 30px; object-fit: contain; flex: 0 0 auto; }}
.wallet-row .k {{
  font-family: var(--serif); font-size: clamp(12px, 1.5vw, 15px);
  color: var(--ink-soft); flex: 1;
}}
.wallet-row .v {{
  font-family: var(--px); font-size: clamp(14px, 1.9vw, 20px);
  color: var(--ink); font-variant-numeric: tabular-nums;
}}
.meter {{ position: relative; width: 100%; }}
.meter .bg {{ width: 100%; display: block; }}
.meter .fill {{
  position: absolute; top: 23%; left: 5.5%; height: 54%;
  overflow: hidden;
}}
.meter .fill img {{ height: 100%; }}
.pity-row {{ margin-bottom: 5%; }}
.pity-row .lbl {{
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: var(--serif); font-size: clamp(11px, 1.4vw, 14px);
  color: var(--ink-soft); margin-bottom: 1%;
}}
.pity-row .lbl b {{
  font-family: var(--px); font-weight: 400; color: var(--oxblood);
  font-size: clamp(12px, 1.6vw, 16px);
}}
.wish {{
  display: flex; align-items: center; gap: 8px; margin-top: 2%;
  font-size: clamp(11px, 1.4vw, 14px); color: var(--ink-soft); font-style: italic;
}}
.wish img {{ width: 22px; height: 22px; object-fit: contain; }}

/* Pull buttons under the book */
.pulls {{
  display: flex; justify-content: center; align-items: center;
  gap: 22px; margin-top: -3%; position: relative; z-index: 2;
  flex-wrap: wrap;
}}
.pull {{ position: relative; width: 232px; cursor: pointer; border: 0; background: none; padding: 0; }}
.pull img {{ width: 100%; display: block; }}
.pull span {{
  position: absolute; inset: 0 6% 10% 6%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-family: var(--px); color: var(--ink); font-size: 17px; letter-spacing: 1px;
}}
.pull small {{ font-family: var(--serif); font-style: italic; font-size: 12px; color: var(--ink-soft); }}
.pull.hot span {{ color: var(--cream); text-shadow: 0 2px 0 rgba(0,0,0,.45); }}
.pull.hot small {{ color: rgba(244,234,210,.8); }}
.pull:focus-visible {{ outline: 3px solid var(--brass); outline-offset: 4px; }}
.pull:hover {{ transform: translateY(-2px); }}
@media (prefers-reduced-motion: reduce) {{ .pull:hover {{ transform: none; }} }}

/* ---- Results shelf ---- */
.shelf {{ margin-top: 40px; text-align: center; }}
.shelf-head {{
  display: flex; align-items: center; justify-content: center; gap: 14px;
  margin-bottom: 16px;
}}
.shelf-head img.corner {{ height: 30px; }}
.shelf-head h3 {{
  font-family: var(--px); font-weight: 400; letter-spacing: 2px;
  font-size: 18px; color: var(--parchment);
}}
.results {{ display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }}
.res {{ position: relative; width: 118px; }}
.res-frame {{ width: 100%; display: block; }}
.res-hero {{
  position: absolute; top: 12px; left: 12px; right: 12px; height: 86px;
  width: calc(100% - 24px); object-fit: contain;
}}
.res-deco {{
  position: absolute; inset: -14px; width: calc(100% + 28px); z-index: 0;
  animation: glow 2.4s ease-in-out infinite alternate;
}}
@keyframes glow {{ from {{ opacity: .75; }} to {{ opacity: 1; }} }}
@media (prefers-reduced-motion: reduce) {{ .res-deco {{ animation: none; }} }}
.res-five {{ transform: scale(1.08); z-index: 1; }}
.res-frame, .res-hero, .res-stars {{ position: relative; z-index: 1; }}
.res-hero {{ z-index: 1; position: absolute; }}
.pc {{ position: absolute; width: 18px; z-index: 2; }}
.pc.lt {{ top: 4px; left: 4px; }} .pc.rt {{ top: 4px; right: 4px; }}
.pc.lb {{ bottom: 26px; left: 4px; }} .pc.rb {{ bottom: 26px; right: 4px; }}
.res-stars {{
  position: absolute; bottom: 30px; left: 0; right: 0;
  display: flex; justify-content: center; gap: 1px;
}}
.res-stars .star {{ width: 16px; }}
.res-name {{
  display: block; margin-top: 4px; font-family: var(--px); font-size: 12px;
  color: var(--parchment); text-shadow: 0 1px 0 rgba(0,0,0,.6);
}}

/* ---- Elements legend ---- */
.legend {{
  max-width: 1080px; margin: 52px auto 0; padding: 18px 22px 20px;
  background: rgba(20,13,8,.78);
  border: 1px solid rgba(200,150,62,.35);
}}
.legend h4 {{
  font-family: var(--px); font-weight: 400; letter-spacing: 2px;
  color: var(--brass); font-size: 14px; margin-bottom: 10px;
}}
.legend p {{ color: var(--parchment-deep); font-size: 13.5px; max-width: 72ch; }}
.legend ul {{
  list-style: none; display: flex; flex-wrap: wrap; gap: 7px 16px;
  margin-top: 10px;
}}
.legend li {{
  font-family: var(--px); font-size: 11.5px; color: var(--cream);
  background: rgba(110,27,38,.55); border: 1px solid rgba(200,150,62,.3);
  padding: 3px 9px;
}}
</style>

<div class="stage"><div class="hall">

  <div class="masthead">
    <div class="ribbon"><img src="{A['ribbon_r']}" alt="">
      <span>SUMMONING HALL</span></div>
  </div>
  <p class="subtitle">A design mock &mdash; the summon screen recomposed from the uploaded medieval UI kits.</p>

  <div class="rite">

    <div class="drape">
      <img class="cloth" src="{A['drape_b']}" alt="Court of Cryst banner drape">
      <div class="drape-title lite"><img src="{A['ribbon_w']}" alt=""><span>COURT OF CRYST</span></div>
      <div class="drape-kind">RARE SCROLLS &middot; 2&times; RATE</div>
      <div class="octos">
        {octo('polarus', 'Polarus')}
        {octo('echo', 'Aniani')}
        {octo('angelica', 'Angelica', claimed=True)}
      </div>
      <div class="drape-pity">BANNER PITY 38 / 50
        <div class="meter"><img class="bg" src="{A['bar_bg']}" alt="">
          <div class="fill" style="width: 68%;"><img src="{A['bar_fill']}" alt=""></div></div>
      </div>
    </div>

    <div>
      <div class="tome">
        <img class="tome-book" src="{A['book']}" alt="The summoning tome, open">
        <div class="tome-pages">
          <div class="page">
            <img class="page-sigil" src="{A['pagedeco']}" alt="">
            <h2>THE RITE</h2>
            <img class="rule" src="{A['line_orn']}" alt="">
            <div class="wallet">
              <div class="wallet-row"><img src="{A['scroll']}" alt=""><span class="k">Common Scrolls</span><span class="v">23</span></div>
              <div class="wallet-row"><img src="{A['scroll']}" alt=""><span class="k">Rare Scrolls</span><span class="v">7</span></div>
              <div class="wallet-row"><img src="{A['book_icon']}" alt=""><span class="k">Temporal Scrolls</span><span class="v">4</span></div>
            </div>
          </div>
          <div class="page">
            <h2>THE LEDGER</h2>
            <img class="rule" src="{A['line_orn']}" alt="">
            <div class="pity-row">
              <div class="lbl"><span>5&#9733; Pity</span><b>72 / 100</b></div>
              <div class="meter"><img class="bg" src="{A['bar_bg']}" alt="">
                <div class="fill" style="width: 65%;"><img src="{A['bar_fill']}" alt=""></div></div>
            </div>
            <div class="wish"><img src="{A['check']}" alt="">Wishlist &times;3 set &mdash; double draw weight</div>
          </div>
        </div>
      </div>
      <div class="pulls">
        <button class="pull"><img src="{A['choice']}" alt=""><span>PULL &times;1<small>1 Rare Scroll</small></span></button>
        <button class="pull hot"><img src="{A['choice_h']}" alt=""><span>PULL &times;10<small>10 Rare Scrolls</small></span></button>
      </div>
    </div>

    <div class="drape">
      <img class="cloth" src="{A['drape_r']}" alt="Heralds of Reverence banner drape">
      <div class="drape-title"><img src="{A['ribbon_r']}" alt=""><span>REVERENCE</span></div>
      <div class="drape-kind">TEMPORAL &middot; THRU AUG 29</div>
      <div class="octos">
        {octo('javarious', 'Javarious')}
        {octo('silas', 'Silas')}
        {octo('artur', 'Artur')}
      </div>
      <div class="drape-pity">BANNER PITY 12 / 50
        <div class="meter"><img class="bg" src="{A['bar_bg']}" alt="">
          <div class="fill" style="width: 22%;"><img src="{A['bar_fill']}" alt=""></div></div>
      </div>
    </div>

  </div>

  <div class="shelf">
    <div class="shelf-head">
      <img class="corner" src="{A['corner_l']}" alt="">
      <h3>THE LAST RITE</h3>
      <img class="corner" src="{A['corner_r']}" alt="">
    </div>
    <div class="results">
      {result('rat_spearman', 'Rat Spearman', 2)}
      {result('samuels', 'Samuels', 3)}
      {result('esmerelda', 'Esmerelda', 3)}
      {result('koe', 'Koe', 4)}
      {result('lucian', 'Lucian', 5, five=True)}
    </div>
  </div>

  <div class="legend">
    <h4>KIT PIECES USED</h4>
    <p>Everything on this screen is assembled from the uploaded packs, unmodified:
    the BookUI spellbook spread as the summoning altar, its sun-emblem drapes as the
    two running banners, and its slot frames, star badges and focus corners on the
    result cards; the DialogueUI ribbons, choice buttons, octagon slots, filigree
    corners, ornament rule and scroll/tome/close icons; the HUD status bar as both
    pity meters; and the bundled NeoDunggeunmo pixel font for all chrome text.</p>
    <ul>
      <li>UI_Image_MagicBook</li><li>UI_Image_Drape_Blue / _Red</li>
      <li>UI_Dialogue_TitleRibbon_Red / _White</li><li>UI_Dialogue_ChoiceButton (+Hover)</li>
      <li>UI_Panel_Slot</li><li>UI_Slot_Normal / _hover</li><li>UI_SkillSlot_Deco</li>
      <li>UI_Pocus_Corner &times;4</li><li>UI_badge_Star / _Off</li>
      <li>UI_StatusBar_Bg / _Fill_HP</li><li>UI_Decoration_Corner_L / _R</li>
      <li>UI_Decoration_Line_Ornament</li><li>UI_Icon_Scroll / _Book / _Close / _Check</li>
      <li>UI_Image_Bg</li><li>UI_Image_PageDeco</li><li>NeoDunggeunmoPro (bundled font)</li>
    </ul>
  </div>

</div></div>
'''

out = f'{ROOT}/docs/summon-ui-mock.html'
with open(out, 'w') as f:
    f.write(html)
print(out, f'{len(html)/1e6:.2f} MB')
