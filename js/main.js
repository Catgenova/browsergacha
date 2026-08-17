// Bootstrap: build the battle, place units, load sprites, run the loop.

(async function main() {
  const canvas = document.getElementById('battle-canvas');
  const battle = new Battle();
  const renderer = new Renderer(canvas, battle);
  const ui = new UI(battle, renderer, canvas);

  // --- Demo setup: our first hero vs a couple of slimes -------------------
  // Slot indices: 0 = center, 1 = front-center, 2 = front-top, 3 = back-top,
  // 4 = back-center, 5 = back-bottom, 6 = front-bottom (mirrored for enemies).
  const hero = new Unit(HEROES.sir_pixel, TEAM.PLAYER);
  battle.placeUnit(hero, 1); // front hex -> his Vanguard positional bonus is live

  const gloopA = new Unit(ENEMIES.gloop, TEAM.ENEMY);
  const gloopB = new Unit(ENEMIES.gloop, TEAM.ENEMY);
  battle.placeUnit(gloopA, 1);
  battle.placeUnit(gloopB, 2);

  // Load spritesheets (placeholder art is generated if the PNG is absent).
  for (const unit of battle.units) {
    const sheet = await Sprites.load(unit.def.sprite, unit.spriteTint);
    unit.animator = new AnimationPlayer(sheet);
    unit.animator.play('idle');
    // Desync idle animations so units don't bob in lockstep.
    unit.animator.elapsed = Math.random() * 0.5;
  }

  battle.log('Battle start! Click an ability, then a target.', 'log-system');

  // --- Main loop ----------------------------------------------------------
  let lastTime = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    battle.update(dt);
    renderer.draw();

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
