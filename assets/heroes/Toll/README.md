# Toll

Drop this hero's spritesheets here, following the naming the other hero
folders use (see `assets/heroes/Catherine/`):

    tollidle.png      idle loop
    tollready.png     turn-ready pose
    tolldeath.png     death
    tollskill1.png    ability 1
    tollskill2.png    ability 2
    tollskill3.png    ability 3

Each file is a horizontal strip: equal-width frames in one row. The
frame count and fps are declared per strip in the hero's `sprite.strips`
entry in `js/data/heroes/<race>.js`, so the art does not have to match a
fixed count — it just has to be evenly divided.

Nothing references this folder until Toll is added to the roster.
