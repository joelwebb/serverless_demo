async function loadBossYAML(path) {
    try {
      const res = await fetch(path);
      const text = await res.text();
      const boss = jsyaml.load(text);
      spawnBoss(boss);
    } catch (err) {
      console.error("❌ Failed to load boss YAML:", err);
    }
  }
  

  function spawnBoss(boss) {
    const container = $("#enemy-container");

    const $boss = $(`
      <div id="${boss.id}" class="boss-unit">
        <img src="${boss.img}" class="unit-icon">
        <div class="hp-label" id="hp_${boss.id}">HP: ${boss.hp}</div>
      </div>
    `);

    container.append($boss);

    // Store row/col in data-* attributes
    $boss.attr("data-row", boss.row);
    $boss.attr("data-col", boss.col);

    // Set dimensions
    $boss.css({
        width: tileSize * 2 + "px",
        height: tileSize * 2 + "px",
        position: "absolute",
        zIndex: 2
    });

    // Position on grid - remove the +7 offset for proper alignment
    const top = boss.row * tileSize;
    const left = boss.col * tileSize;
    $boss.css({ top: `${top}px`, left: `${left}px` });

    // Register boss
    enemyIds.push(boss.id);
    enemyDataMap[boss.id] = {
        id: boss.id,
        hp: boss.hp,
        attack: boss.attack,
        defense: boss.defense,
        abilities: boss.abilities || []
    };

    const tiles = getOccupiedTiles($boss, 2, 2);


    console.log(`🔥 Spawned boss: ${boss.name} at (${boss.row}, ${boss.col})`);
}
