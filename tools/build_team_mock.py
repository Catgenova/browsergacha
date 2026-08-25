# War Tent — the Team screen recomposed in the Summoning Hall design
# language (same uploaded kits, same palette and chrome). Assets are
# embedded as data URIs, untouched except scaling/cropping.
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

FACE_LEFT = {'lucian', 'esmerelda', 'angelica',
             'javarious', 'artur', 'franz', 'lin', 'slick',
             'andrew', 'cain', 'catherine'}
IDLE = {
    'carl': 'Carl/carlidle.png', 'lin': 'Lin/linidle.png',
    'franz': 'Franz/franzidle.png', 'slick': 'Slick/slickidle.png',
    'lucian': 'Lucian/lucianidle.png', 'cleo': 'Cleo/cleoidle.png',
    'koe': 'Koe/koeidle.png', 'esmerelda': 'Esmerelda/esmereldaidle.png',
    'samuels': 'Samuels/samuelsidle.png',
}
def hero64(hid, size=170):
    im = Image.open(f'{ROOT}/assets/heroes/{IDLE[hid]}').convert('RGBA')
    n = max(1, round(im.width / im.height))
    fw = im.width // n
    cell = im.crop((0, 0, fw, im.height))
    box = cell.getbbox()
    if box: cell = cell.crop(box)
    if hid in FACE_LEFT: cell = cell.transpose(Image.FLIP_LEFT_RIGHT)
    cell.thumbnail((size, size), Image.NEAREST)
    buf = io.BytesIO(); cell.save(buf, format='PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

GEAR_ICONS = {  # dragon-set rack, including the new helm and belt
  'weapon': 'fc1590', 'helm': 'fc2053', 'chest': 'fc1815', 'gloves': 'fc1568',
  'belt': 'fc2068', 'boots': 'fc2164', 'ring': 'fc2186', 'amulet': 'fc2181',
}
A = {
  'bg':        b64(f'{BOOK}/UI_Image_Bg.png', 1400),
  'ribbon_r':  b64(f'{DLG}/UI Elements/Components/UI_Dialogue_TitleRibbon_Red.png'),
  'ribbon_w':  b64(f'{DLG}/UI Elements/Components/UI_Dialogue_TitleRibbon_White.png'),
  'corner_l':  b64(f'{DLG}/UI Elements/Deco/UI_Decoration_Corner_L.png'),
  'corner_r':  b64(f'{DLG}/UI Elements/Deco/UI_Decoration_Corner_R.png'),
  'line_orn':  b64(f'{DLG}/UI Elements/Deco/UI_Decoration_Line_Ornament.png'),
  'octagon':   b64(f'{DLG}/UI Elements/Panel/UI_Panel_Slot.png'),
  'textarea':  b64(f'{BOOK}/UI_SkillPanel_TextArea.png'),
  'bookmark':  b64(f'{BOOK}/UI_Bookmark_Vertical_Blue.png', 200),
  'tab_red':   b64(f'{BOOK}/UI_Bookmark_Horizontal_s_Red.png'),
  'slot':      b64(f'{BOOK}/UI_Slot_Normal.png'),
  'slot_h':    b64(f'{BOOK}/UI_Slot_hover.png'),
  'slotdeco':  b64(f'{BOOK}/UI_SkillSlot_Deco.png'),
  'star':      b64(f'{BOOK}/UI_badge_Star.png'),
  'star_off':  b64(f'{BOOK}/UI_badge_Star_Off.png'),
  'equip':     b64(f'{BOOK}/UI_Icon_equip.png'),
  'check':     b64(f'{DLG}/Icons/UI_Icon_Check.png'),
  'warn':      b64(f'{DLG}/Icons/UI_Icon_Warning.png'),
  'choice':    b64(f'{DLG}/UI Elements/Buttons/UI_Dialogue_ChoiceButton.png'),
  'btn_red':   b64(f'{DLG}/UI Elements/Buttons/UI_Dialogue_Button_Red.png'),
  'pagedeco':  b64(f'{BOOK}/UI_Image_PageDeco.png', 300),
  'pocus_lt':  b64(f'{BOOK}/UI_Pocus_Corner_LT.png'),
  'pocus_rt':  b64(f'{BOOK}/UI_Pocus_Corner_RT.png'),
  'pocus_lb':  b64(f'{BOOK}/UI_Pocus_Corner_LB.png'),
  'pocus_rb':  b64(f'{BOOK}/UI_Pocus_Corner_RB.png'),
  'bar_bg':    b64(f'{HUD}/UI_StatusBar_Bg.png'),
  'bar_fill':  b64(f'{HUD}/UI_StatusBar_Fill_HP.png'),
}
for slot, fc in GEAR_ICONS.items():
    A['g_' + slot] = b64(f'{ROOT}/assets/icons/{fc}.png')
H = {hid: hero64(hid) for hid in IDLE}
FONT = font64(f'{DLG}/Font/NeoDunggeunmoPro-Regular.ttf')

def hexslot(hid=None, name='', selected=False):
    hero = f'<img class="hx-hero" src="{H[hid]}" alt="{name}">' if hid else ''
    pocus = (f'<img class="pc lt" src="{A["pocus_lt"]}" alt=""><img class="pc rt" src="{A["pocus_rt"]}" alt="">'
             f'<img class="pc lb" src="{A["pocus_lb"]}" alt=""><img class="pc rb" src="{A["pocus_rb"]}" alt="">') if selected else ''
    label = f'<span class="hx-name">{name}</span>' if name else '<span class="hx-name empty">&mdash;</span>'
    return (f'<div class="hx{" hx-sel" if selected else ""}">'
            f'<img class="hx-frame" src="{A["octagon"]}" alt="">{hero}{pocus}{label}</div>')

def gearcell(slot, label, main):
    return (f'<div class="gear"><img class="gear-frame" src="{A["slot"]}" alt="">'
            f'<img class="gear-icon" src="{A["g_" + slot]}" alt="{label}">'
            f'<span class="gear-slot">{label}</span><span class="gear-main">{main}</span></div>')

def srow(icon, title, note, unmet=False):
    return (f'<div class="syn{" unmet" if unmet else ""}"><img src="{icon}" alt="">'
            f'<div><b>{title}</b><span>{note}</span></div></div>')

html = f'''<title>War Tent</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,500;0,700;1,400&display=swap">
<style>
@font-face {{
  font-family: 'NeoDunggeunmo';
  src: url('{FONT}') format('truetype');
  font-display: swap;
}}
/* War Tent — the Team screen in the Summoning Hall language: the same
   committed single theme, parchment/oxblood/brass over dark oak. */
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
  background: var(--oak); color: var(--cream);
  font-family: var(--serif); font-size: 16px; line-height: 1.55;
}}
img {{ image-rendering: pixelated; }}
.stage {{
  min-height: 100vh; overflow: hidden;
  background:
    linear-gradient(rgba(24,16,10,.84), rgba(24,16,10,.9)),
    url('{A["bg"]}') center / cover no-repeat;
  padding: 34px 18px 46px;
}}
.hall {{ max-width: 1180px; margin: 0 auto; }}

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
  font-style: italic; margin-bottom: 30px; font-size: 15px;
}}

.board {{
  display: grid; grid-template-columns: minmax(0, 1fr) 348px;
  gap: 24px; align-items: start;
}}
@media (max-width: 980px) {{ .board {{ grid-template-columns: 1fr; }} }}

/* ---- Formation ---- */
.muster {{ position: relative; padding-top: 14px; }}
.presets {{
  position: absolute; top: -10px; left: 18px; display: flex; gap: 8px;
  align-items: flex-start; z-index: 2;
}}
.preset {{ position: relative; width: 56px; border: 0; background: none; padding: 0; cursor: pointer; }}
.preset img {{ width: 100%; display: block; }}
.preset span {{
  position: absolute; inset: 0 0 18% 0; display: flex; align-items: center;
  justify-content: center; font-family: var(--px); color: var(--cream);
  font-size: 15px; text-shadow: 0 1px 0 rgba(0,0,0,.6);
}}
.preset.tab {{ width: 44px; margin-top: 4px; }}
.preset.tab span {{ inset: 0; font-size: 13px; }}
.preset:focus-visible {{ outline: 3px solid var(--brass); outline-offset: 3px; }}
.rows {{ display: flex; flex-direction: column; gap: 10px; margin-top: 30px; }}
.rowline {{ display: flex; align-items: center; justify-content: center; gap: 14px; }}
.rowlabel {{
  width: 74px; text-align: right; font-family: var(--px); font-size: 12px;
  letter-spacing: 1px; color: var(--parchment-deep);
}}
.hx {{ position: relative; width: 96px; text-align: center; }}
.hx-frame {{ width: 96px; display: block; }}
.hx-hero {{
  position: absolute; top: 10px; left: 10px; width: 76px; height: 74px;
  object-fit: contain;
}}
.hx-name {{
  display: block; margin-top: 2px; font-family: var(--px); font-size: 11.5px;
  color: var(--parchment); text-shadow: 0 1px 0 rgba(0,0,0,.6);
}}
.hx-name.empty {{ color: rgba(217,191,138,.5); }}
.pc {{ position: absolute; width: 17px; z-index: 2; }}
.pc.lt {{ top: 2px; left: 2px; }} .pc.rt {{ top: 2px; right: 2px; }}
.pc.lb {{ bottom: 20px; left: 2px; }} .pc.rb {{ bottom: 20px; right: 2px; }}
.muster-actions {{
  display: flex; justify-content: center; gap: 18px; margin-top: 20px;
  flex-wrap: wrap; align-items: center;
}}
.act {{ position: relative; border: 0; background: none; padding: 0; cursor: pointer; }}
.act.fill {{ width: 210px; }}
.act.clear {{ width: 150px; }}
.act img {{ width: 100%; display: block; }}
.act span {{
  position: absolute; inset: 0 6% 10% 6%; display: flex; align-items: center;
  justify-content: center; font-family: var(--px); font-size: 13px;
  letter-spacing: 1px; color: var(--ink); white-space: nowrap;
}}
.act.clear span {{ color: var(--cream); inset: 0 6% 14% 6%; text-shadow: 0 2px 0 rgba(0,0,0,.4); }}
.act:hover {{ transform: translateY(-2px); }}
.act:focus-visible {{ outline: 3px solid var(--brass); outline-offset: 4px; }}
@media (prefers-reduced-motion: reduce) {{ .act:hover {{ transform: none; }} }}

/* ---- Synergy ledger ---- */
.pacts {{ position: relative; margin-top: 26px; }}
.pacts-panel {{
  position: relative;
  border-image: url('{A["textarea"]}') 46 fill / 30px stretch;
  padding: 26px 26px 20px; color: var(--ink);
}}
.pacts h3 {{
  font-family: var(--px); font-weight: 400; font-size: 16px;
  letter-spacing: 1px; color: var(--oxblood); text-align: center;
  margin-bottom: 8px;
}}
.pacts .rule {{ width: 60%; display: block; margin: 0 auto 12px; }}
.syns {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px 22px; }}
@media (max-width: 700px) {{ .syns {{ grid-template-columns: 1fr; }} }}
.syn {{ display: flex; gap: 9px; align-items: flex-start; }}
.syn img {{ width: 22px; height: 22px; object-fit: contain; margin-top: 2px; flex: 0 0 auto; }}
.syn b {{
  display: block; font-family: var(--px); font-weight: 400; font-size: 13.5px;
  color: var(--ink);
}}
.syn span {{ font-size: 13px; color: var(--ink-soft); }}
.syn.unmet b, .syn.unmet span {{ opacity: .62; }}

/* ---- Champion panel ---- */
.champion {{ position: relative; }}
.champ-frame {{
  position: relative;
  border-image: url('{A["textarea"]}') 46 fill / 30px stretch;
  padding: 24px 22px 22px; color: var(--ink); text-align: center;
}}
.champ-title {{ position: relative; width: 250px; margin: -46px auto 4px; }}
.champ-title img {{ width: 100%; display: block; }}
.champ-title span {{
  position: absolute; inset: 6% 10% 30% 10%; display: flex; align-items: center;
  justify-content: center; font-family: var(--px); font-size: 15px;
  letter-spacing: 1px; color: var(--cream); text-shadow: 0 2px 0 rgba(0,0,0,.5);
}}
.champ-art {{ position: relative; width: 168px; margin: 6px auto 2px; }}
.champ-art .deco {{ position: absolute; inset: -12px; width: calc(100% + 24px); }}
.champ-art .frame {{ position: relative; width: 100%; display: block; }}
.champ-art .hero {{
  position: absolute; top: 14px; left: 14px; right: 14px; height: 112px;
  width: calc(100% - 28px); object-fit: contain;
}}
.champ-stars {{ display: flex; justify-content: center; gap: 1px; margin-top: 6px; }}
.champ-stars img {{ width: 19px; }}
.champ-name {{ font-family: var(--px); font-size: 19px; color: var(--oxblood); margin-top: 2px; }}
.champ-sub {{ font-size: 13px; font-style: italic; color: var(--ink-soft); }}
.champ-power {{
  display: flex; justify-content: center; align-items: baseline; gap: 8px;
  margin: 8px 0 2px; font-family: var(--px);
}}
.champ-power .k {{ font-size: 11px; letter-spacing: 2px; color: var(--ink-soft); }}
.champ-power .v {{ font-size: 22px; color: var(--ink); font-variant-numeric: tabular-nums; }}
.champ-rule {{ width: 80%; display: block; margin: 10px auto; }}
.rack {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; text-align: left; }}
.gear {{ position: relative; display: flex; align-items: center; gap: 8px; min-height: 52px; }}
.gear-frame {{ width: 46px; flex: 0 0 auto; display: block; }}
.gear-icon {{
  position: absolute; left: 7px; top: 50%; transform: translateY(-50%);
  width: 32px; height: 32px; object-fit: contain;
}}
.gear-slot {{
  display: block; font-family: var(--px); font-size: 10.5px; letter-spacing: 1px;
  color: var(--ink-soft); text-transform: uppercase;
}}
.gear-main {{ display: block; font-family: var(--px); font-size: 12.5px; color: var(--ink); }}
.gear > span {{ line-height: 1.3; }}
.gear {{ flex-wrap: wrap; }}
.gear .gear-slot, .gear .gear-main {{ flex-basis: calc(100% - 56px); }}
.gear .gear-slot {{ align-self: flex-end; }}
.gear .gear-main {{ align-self: flex-start; }}
.equip-note {{
  display: flex; align-items: center; justify-content: center; gap: 7px;
  margin-top: 10px; font-size: 12.5px; font-style: italic; color: var(--ink-soft);
}}
.equip-note img {{ width: 18px; }}

/* ---- Legend ---- */
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
  list-style: none; display: flex; flex-wrap: wrap; gap: 7px 16px; margin-top: 10px;
}}
.legend li {{
  font-family: var(--px); font-size: 11.5px; color: var(--cream);
  background: rgba(110,27,38,.55); border: 1px solid rgba(200,150,62,.3);
  padding: 3px 9px;
}}
</style>

<div class="stage"><div class="hall">

  <div class="masthead">
    <div class="ribbon"><img src="{A['ribbon_r']}" alt=""><span>WAR TENT</span></div>
  </div>
  <p class="subtitle">The Team screen in the Summoning Hall language &mdash; same kits, same chrome.</p>

  <div class="board">

    <div class="muster">
      <div class="presets">
        <button class="preset" aria-pressed="true"><img src="{A['bookmark']}" alt=""><span>I</span></button>
        <button class="preset tab"><img src="{A['tab_red']}" alt=""><span>II</span></button>
        <button class="preset tab"><img src="{A['tab_red']}" alt=""><span>III</span></button>
      </div>
      <div class="rows">
        <div class="rowline"><span class="rowlabel">FRONT</span>
          {hexslot('carl', 'Carl')}
          {hexslot('lin', 'Lin', selected=True)}
          {hexslot('esmerelda', 'Esmerelda')}
        </div>
        <div class="rowline"><span class="rowlabel">CENTER</span>
          {hexslot('slick', 'Slick')}
        </div>
        <div class="rowline"><span class="rowlabel">BACK</span>
          {hexslot('lucian', 'Lucian')}
          {hexslot('cleo', 'Cleo')}
          {hexslot('koe', 'Koe')}
        </div>
      </div>
      <div class="muster-actions">
        <button class="act fill"><img src="{A['choice']}" alt=""><span>AUTO-FILL STRONGEST</span></button>
        <button class="act clear"><img src="{A['btn_red']}" alt=""><span>CLEAR</span></button>
      </div>

      <div class="pacts">
        <div class="pacts-panel">
          <h3>PACTS &amp; PACKS</h3>
          <img class="rule" src="{A['line_orn']}" alt="">
          <div class="syns">
            {srow(A['check'], 'Firetroupe Sect &times;7', '+20% Accuracy &middot; hits may Oilslick for 2 turns')}
            {srow(A['check'], 'Fire Resonance &times;7', '+20% Crit Rate &middot; +80% Crit Damage')}
            {srow(A['check'], 'Blessed Company &times;3', '+25% Critical Damage')}
            {srow(A['warn'], 'Prismatic Accord', 'one element fielded of five &mdash; unmet', unmet=True)}
          </div>
        </div>
      </div>
    </div>

    <div class="champion">
      <div class="champ-frame">
        <div class="champ-title"><img src="{A['ribbon_w']}" alt=""><span style="color: var(--ink); text-shadow: none;">CHAMPION</span></div>
        <div class="champ-art">
          <img class="deco" src="{A['slotdeco']}" alt="">
          <img class="frame" src="{A['slot_h']}" alt="">
          <img class="hero" src="{H['lin']}" alt="Lin">
        </div>
        <div class="champ-stars">
          <img src="{A['star']}" alt=""><img src="{A['star']}" alt="">
          <img src="{A['star']}" alt=""><img src="{A['star']}" alt="">
          <img src="{A['star_off']}" alt="">
        </div>
        <div class="champ-name">LIN</div>
        <div class="champ-sub">Balance Act of the Firetroupe &middot; Lv 52</div>
        <div class="champ-power"><span class="k">POWER</span><span class="v">14,382</span></div>
        <img class="champ-rule" src="{A['line_orn']}" alt="">
        <div class="rack">
          {gearcell('weapon', 'Weapon', '+31% Crit Rate')}
          {gearcell('helm', 'Helm', '+1,204 HP')}
          {gearcell('chest', 'Chest', '+38% Crit DMG')}
          {gearcell('gloves', 'Gloves', '+22% DEF')}
          {gearcell('belt', 'Belt', '+18% Resistance')}
          {gearcell('boots', 'Boots', '+17 SPD')}
          {gearcell('ring', 'Ring', '+24% HP')}
          {gearcell('amulet', 'Amulet', '+19% Crit Rate')}
        </div>
        <div class="equip-note"><img src="{A['equip']}" alt="">Bear set &times;4 worn &mdash; +40% HP</div>
      </div>
    </div>

  </div>

  <div class="legend">
    <h4>KIT PIECES USED</h4>
    <p>Same language as the Summoning Hall mock, extended: the BookUI bookmarks as
    team-preset tabs (the tasseled banner marks the active preset), the octagon
    DialogueUI slots as the seven formation hexes with focus corners on the
    selected hero, the filigree SkillPanel text area as both the synergy ledger
    and the champion sheet, slot frames and star badges for the champion, the
    game's own gear icons in the new eight-slot rack, and the ribbons, choice
    buttons, ornament rules, check/warning icons and pixel font carried over.</p>
    <ul>
      <li>UI_Bookmark_Vertical_Blue</li><li>UI_Bookmark_Horizontal_s_Red</li>
      <li>UI_Panel_Slot &times;7</li><li>UI_Pocus_Corner &times;4</li>
      <li>UI_SkillPanel_TextArea</li><li>UI_SkillSlot_Deco</li>
      <li>UI_Slot_Normal / _hover</li><li>UI_badge_Star / _Off</li>
      <li>UI_Icon_equip / _Check / _Warning</li>
      <li>UI_Dialogue_TitleRibbon_Red / _White</li>
      <li>UI_Dialogue_ChoiceButton / Button_Red</li>
      <li>UI_Decoration_Line_Ornament / Corner_L / _R</li>
      <li>UI_Image_Bg</li><li>NeoDunggeunmoPro (bundled font)</li>
    </ul>
  </div>

</div></div>
'''

out = f'{ROOT}/docs/team-ui-mock.html'
with open(out, 'w') as f:
    f.write(html)
print(out, f'{len(html)/1e6:.2f} MB')
