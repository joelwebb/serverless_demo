const tileSize = 85;
let playerIds = [];
let enemyIds = [];
let playerDataMap = {};
let enemyDataMap = {};
let playerHP = {};
let abilityDataMap = {};
let equipmentDataMap = {};
let characterDataMap = {};
let terrainMap = {}; // Will store terrain by"row,col" key
let playerStatsByLevel = {};
let timerInterval;
let timerRunning = false;
const timerDuration = 4000;
let startPositions = {};
let activeDrag = null;
let currentPlayer = null;
let turnEnded = false;
let lastLoggedTile = {};
let prevDragTile = {};
let lastSafeTile = {};
let recentPushes = new Set();              // Tracks unique pushes during drag
let terrainVisitTracker = new Map();       // Tracks which tiles each unit visited during drag
let recentTerrainHits = new Set();
let lastPushedTerrainTile = {};


function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    let remaining = timerDuration;
    $('#timer').text(formatTime(remaining));

    timerInterval = setInterval(() => {
        remaining -= 10;
        if (remaining <= 0) {
            clearInterval(timerInterval);
            $('#timer').text('0.000');
            timerRunning = false;

            if (activeDrag) {
                lockPlayer(activeDrag);
                activeDrag.trigger("mouseup");
                activeDrag = null;
            }

            // Lock rest of turn
            turnEnded = true;
            $(".draggable-unit").draggable("disable");
            $("#next-round").show();


        } else {
            $('#timer').text(formatTime(remaining));
        }
    }, 10);
}

function stopTimer() {
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
    }
}

function formatTime(ms) {
    return (ms / 1000).toFixed(3);
}

function isWithinRange(posA, posB, range = 1) {
    const dx = Math.abs(posA.col - posB.col);
    const dy = Math.abs(posA.row - posB.row);
    return dx <= range && dy <= range;
}

function applyDamage(unitId, amount) {
    const hpKey = `hp_${unitId}`;
    const current = parseInt($(`#${hpKey}`).text().replace(/[^\d]/g, '')) || 0;
    const newHP = Math.max(0, current - amount);
    $(`#${hpKey}`).text(`HP: ${newHP}`);
}

function applyHeal(unitId, amount) {
    const hpKey = `hp_${unitId}`;
    const current = parseInt($(`#${hpKey}`).text().replace(/[^\d]/g, '')) || 0;
    const newHP = current + amount;
    $(`#${hpKey}`).text(`HP: ${newHP}`);
}

function getOccupiedTiles($unit, width = 1, height = 1) {
    const isBoss = $unit.hasClass("boss-unit");
    let row, col;

    if (isBoss) {
        const r = $unit.attr("data-row");
        const c = $unit.attr("data-col");

        if (r === undefined || c === undefined) {
            console.warn(`⚠️ Boss ${$unit.attr("id")} missing data-row or data-col.`);
            return []; // prevent crash
        }

        row = parseInt(r);
        col = parseInt(c);
    } else {
        const pos = getGridPosition($unit);
        row = pos.row;
        col = pos.col;
    }

    const tiles = [];
    for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
            tiles.push({ row: row + dy, col: col + dx });
        }
    }
    return tiles;
}



function checkPincerCombat() {
    playerIds = Object.keys(playerDataMap);

    enemyIds.forEach(enemyId => {
        const $enemy = $("#" + enemyId);
        const isBoss = $enemy.hasClass("boss-unit");
        const occupiedTiles = getOccupiedTiles($enemy, isBoss ? 2 : 1, isBoss ? 2 : 1);

        // LEFT-RIGHT flank check for each row
        for (let row = 0; row < 8; row++) {
            const tilesInRow = occupiedTiles.filter(t => t.row === row);
            if (tilesInRow.length > 0) {
                const minCol = Math.min(...tilesInRow.map(t => t.col));
                const maxCol = Math.max(...tilesInRow.map(t => t.col));

                const playerLeft = playerIds.find(pid => {
                    const pos = getGridPosition($("#" + pid));
                    return pos.row === row && pos.col === minCol - 1;
                });

                const playerRight = playerIds.find(pid => {
                    const pos = getGridPosition($("#" + pid));
                    return pos.row === row && pos.col === maxCol + 1;
                });

                if (playerLeft && playerRight) {
                    triggerPincerOn(enemyId, playerLeft, playerRight);
                    return;
                }
            }
        }

        // TOP-BOTTOM flank check for each column
        for (let col = 0; col < 6; col++) {
            const tilesInCol = occupiedTiles.filter(t => t.col === col);
            if (tilesInCol.length > 0) {
                const minRow = Math.min(...tilesInCol.map(t => t.row));
                const maxRow = Math.max(...tilesInCol.map(t => t.row));

                const playerTop = playerIds.find(pid => {
                    const pos = getGridPosition($("#" + pid));
                    return pos.col === col && pos.row === minRow - 1;
                });

                const playerBottom = playerIds.find(pid => {
                    const pos = getGridPosition($("#" + pid));
                    return pos.col === col && pos.row === maxRow + 1;
                });

                if (playerTop && playerBottom) {
                    triggerPincerOn(enemyId, playerTop, playerBottom);
                    return;
                }
            }
        }
    });
}


function triggerPincerOn(enemyId, playerA, playerB) {
    const $enemy = $("#" + enemyId);
    const $grid = $("#grid");

    console.log(`🗡️ Pincer Attack on ${enemyId} between ${playerA} and ${playerB}!`);
    $enemy.addClass("pincer-attack");
    setTimeout(() => $enemy.removeClass("pincer-attack"), 1000);

    const abilityNames = [];

    [playerA, playerB].forEach(pid => {
        const abilities = playerDataMap[pid]?.abilities || [];
        if (abilities.length === 0) return;

        const abilityName = abilities[0];
        abilityNames.push(`${pid} → ${abilityName}`);

        loadAbilityYAML(abilityName).then(ability => {
            if (ability) {
                abilityDataMap[abilityName] = ability;

                // 🌀 Trigger ability logic
                useAbility(pid, abilityName);

                // ✨ Visual board effect
                flashBoardEffect(enemyId);

                // Optionally could show path/effect markers on grid
            }
        });
    });

    // 🧾 Display floating popup with ability names
    showAbilityPopup($enemy, abilityNames);

}

function showAbilityPopup($target, abilityNames) {
    const popup = $('<div class="ability-popup"></div>');
    popup.html(abilityNames.map(name => `<div>${name}</div>`).join(""));
    console.log("Popup abilityNames:", abilityNames);

    // Position popup above target
    const offset = $target.offset();
    popup.css({
        position: "absolute",
        top: offset.top - 50 + "px",
        left: offset.left + "px",
        zIndex: 9999
    });

    $("body").append(popup);

    // Fade out and remove
    setTimeout(() => {
        popup.fadeOut(500, () => popup.remove());
    }, 1500);


}

function flashBoardEffect(enemyId) {
    const $enemy = $("#" + enemyId);
    const flash = $('<div class="board-flash"></div>');

    const offset = $enemy.offset();
    flash.css({
        position: "absolute",
        top: offset.top + "px",
        left: offset.left + "px",
        width: $enemy.width(),
        height: $enemy.height(),
        backgroundColor: "rgba(255, 0, 0, 0.4)",
        borderRadius: "8px",
        color: white,
        zIndex: 9998
    });

    $("body").append(flash);

    setTimeout(() => flash.fadeOut(300, () => flash.remove()), 400);
}



$(function() {
    const modal = $("#pause-modal");

    // Pause button handler
    $("#pause-button").on("click", function() {
        modal.show();
        stopTimer();
    });

    // Resume button handler
    $("#resume-button").on("click", function() {
        modal.hide();
        if (!turnEnded) {
            startTimer();
        }
    });

    // Return to menu handlers
    $("#return-menu-button, #exit-button, #leave-battle-button").on("click", function() {
        window.location.href = "/";
    });

    function useAbility(playerId, abilityName) {
        const ability = abilityDataMap[abilityName];
        if (!ability) {
            console.log(`❌ Ability "${abilityName}" not found.`);
            return;
        }

        const $player = $("#" + playerId);
        const origin = getGridPosition($player);
        const range = ability.range || 1;

        //     console.log(`✨ ${playerId} used ${abilityName}: ${ability.description || ""}`);

        if (ability.type === "attack") {
            // Basic attack: target one adjacent enemy
            enemyIds.forEach(eid => {
                const $enemy = $("#" + eid);
                const pos = getGridPosition($enemy);
                const attackerStats = getDynamicStats(playerId);
                const baseDamage = ability.damage || 0;
                const finalDamage = baseDamage + attackerStats.attack;

                if (isWithinRange(origin, pos, range)) {
                    applyDamage(eid, ability.damage + finalDamage || 0);
                    //     console.log(`🗡️ ${eid} hit for ${ability.damage + finalDamage} damage.`);
                }
            });

        } else if (ability.type === "area_attack") {
            // Hits all enemies within range
            enemyIds.forEach(eid => {
                const $enemy = $("#" + eid);
                const pos = getGridPosition($enemy);
                if (isWithinRange(origin, pos, range)) {
                    applyDamage(eid, ability.damage || 0);
                    //     console.log(`💥 ${eid} hit for ${ability.damage} damage.`);
                }
            });

        } else if (ability.type === "heal") {
            // Heal self or adjacent adjacent ally
            playerIds.forEach(pid => {
                const $target = $("#" + pid);
                const pos = getGridPosition($target);
                if (isWithinRange(origin, pos, range)) {
                    applyHeal(pid, ability.heal || 0);
                    //     console.log(`💚 ${pid} healed for ${ability.heal}.`);
                }
            });

        } else if (ability.type === "chain_heal") {
            // Heal in connected chain (e.g., adjacent players)
            const visited = new Set();
            function chainHeal(pid) {
                if (visited.has(pid)) return;
                visited.add(pid);
                applyHeal(pid, ability.heal || 0);
                //     console.log(`🔗 ${pid} chain-healed for ${ability.heal}.`);

                const posA = getGridPosition($("#" + pid));
                playerIds.forEach(otherPid => {
                    const posB = getGridPosition($("#" + otherPid));
                    if (!visited.has(otherPid) && isWithinRange(posA, posB, 1)) {
                        chainHeal(otherPid);
                    }
                });
            }
            chainHeal(playerId);

        } else if (ability.type === "special") {
            //     console.log(`🌀 Special effect for ${abilityName} not implemented yet.`);

        } else {
            //     console.log(`⚠️ Unknown ability type: ${ability.type}`);
        }
    }

    // 🔁 Next round handler
    $("#next-round").on("click", function() {
        unlockAllPlayers();
    });
});

function loadLevelFromYAML(path) {
    return fetch(path)
        .then(res => res.text())
        .then(text => {
            const data = jsyaml.load(text);
            applyLevel(data);
            return data;
        })
        .catch(err => {
            console.error("Failed to load YAML:", err);
            return null;
        });
}

function applyLevel(data) {
    // Set background
    if (data.background) {
        $("#grid").css("background-image", `url(${data.background})`);
    }
    //   bg music
    if (data.music) {
        const audio = document.getElementById('bg-music');
        audio.src = data.music;
        audio.volume = 0.5; // adjust as needed
        document.getElementById('playButton').addEventListener('click', () => {
            audio.play().catch(err => console.error('Playback failed:', err));
        });
    }

    for (const playerId in playerDataMap) {
        let stats = getDynamicStats(playerId);
        playerHP[playerId] = stats.hp;
        $(`#hp_${playerId}`).text(`HP: ${playerHP[playerId]}`);
    }
    // 🎯 Dynamically place players in row 7 (bottom), spread across columns
    const teamIds = Object.keys(playerDataMap);
    teamIds.forEach((playerId, index) => {
        const $el = $(`#${playerId}`);
        if ($el.length) {
            const col = 1 + index; // start from col 1, or tweak as needed
            setGridPosition($el, 7, col);
        }
    });

    if (data.enemies) {
        renderEnemies(data.enemies);
    }
    // Register terrain
    if (data.terrain) {
        data.terrain.forEach(t => {
            const key = `${t.row},${t.col}`;
            terrainMap[key] = {
                type: t.type,
                damage: t.damage
            };
        });
    }
    renderTerrain(); // 🔥 Render visuals for terrain
}

function getDynamicStats(playerId) {
    const player = playerDataMap[playerId];
    if (!player) return {};

    const char = characterDataMap[player.character];
    const level = player.level || 1;
    const statsRow = playerStatsByLevel[level] || {};

    const stats = {
        hp: (statsRow["Health Min"] || 100) * (char?.health_multiplier || 1),
        attack: (statsRow["Attack Min"] || 10) * (char?.attack_multiplier || 1),
        defense: (statsRow["Defense Min"] || 5) * (char?.defense_multiplier || 1)
    };

    // Add equipment bonuses
    (player.equipment || []).forEach(item => {
        const eq = equipmentDataMap[item];
        if (eq) {
            if (eq.attack) stats.attack += eq.attack;
            if (eq.defense) stats.defense += eq.defense;
            if (eq.hp) stats.hp += eq.hp;
        }
    });

    // Round for display
    stats.hp = Math.floor(stats.hp);
    stats.attack = Math.floor(stats.attack);
    stats.defense = Math.floor(stats.defense);

    return stats;
}

function loadTeamFromYAML(path) {
    return fetch(path)
        .then(res => res.text())
        .then(async text => {
            const data = jsyaml.load(text);
            const team = data.team;

            if (!team || !Array.isArray(team)) {
                console.error("❌ Invalid team.yaml structure. Expected `team: [ ... ]`.");
                return;
            }

            const allAbilities = new Set();
            const allEquipment = new Set();
            const allCharacterIds = new Set();

            // Store player data and collect references
            team.forEach(member => {
                playerDataMap[member.id] = member;
                (member.equipment || []).forEach(eq => allEquipment.add(eq));
                if (member.character) allCharacterIds.add(member.character);
            });

            // Load all characters
            const characterPromises = Array.from(allCharacterIds).map(async charId => {
                //     console.log("📥 Loading character:", charId);
                await loadCharacterYAML(charId);
                const char = characterDataMap[charId];
                if (char?.abilities) {
                    char.abilities.forEach(ab => allAbilities.add(ab));
                }
            });
            await Promise.all(characterPromises);

            // Load all abilities
            const abilityPromises = Array.from(allAbilities).map(async abName => {
                const data = await loadAbilityYAML(abName);
                if (data) {
                    abilityDataMap[abName] = data;
                    //     console.log(`✨ Loaded ability: ${abName}`);
                }
            });
            await Promise.all(abilityPromises);

            // Load all equipment
            const equipmentPromises = Array.from(allEquipment).map(async eqName => {
                const data = await loadEquipmentYAML(eqName);
                if (data) {
                    equipmentDataMap[eqName] = data;
                    //     console.log(`🛡️ Loaded equipment: ${eqName}`);
                }
            });
            await Promise.all(equipmentPromises);

            //     console.log("✅ Team and all dependencies fully loaded.");
        })
        .catch(err => console.error("❌ Failed to load team.yaml:", err));
}


async function loadTeamYAML(path) {
    const res = await fetch(path);
    const text = await res.text();
    const data = jsyaml.load(text);
    teamData = data.team || [];
    const characterIds = new Set(teamData.map(p => p.character));
    for (const id of characterIds) {
        await loadCharacterYAML(id);
    }
    //     console.log("✅ Loaded team and characters.");
}

function loadAbilityYAML(abilityName) {
    return fetch(`/static/abilities/${abilityName}.yaml`)
        .then(res => res.text())
        .then(text => jsyaml.load(text))
        .catch(err => {
            console.error(`Failed to load ability ${abilityName}:`, err);
            return null;
        });
}

function loadEquipmentYAML(name) {
    return fetch(`/static/equipment/${name}.yaml`)
        .then(res => res.text())
        .then(text => jsyaml.load(text))
        .catch(err => {
            console.error(`Failed to load equipment: ${name}`, err);
            return null;
        });
}

function getDynamicStats(playerId) {
    const player = playerDataMap[playerId];
    if (!player) return {};
    const level = player.level || 1;
    const levelStats = playerStatsByLevel[level] || {};
    let stats = {
        hp: levelStats.base_hp || 100,
        attack: levelStats.attack || 10,
        defense: levelStats.defense || 0
    };
    // Add equipment bonuses
    (player.equipment || []).forEach(item => {
        const equip = equipmentDataMap[item];
        if (equip) {
            if (equip.attack) stats.attack += equip.attack;
            if (equip.defense) stats.defense += equip.defense;
        }
    });
    return stats;
}


async function loadCharacterYAML(name) {
    try {
        const res = await fetch(`/static/characters/${name}.yaml`);
        const text = await res.text();
        const data = jsyaml.load(text);
        characterDataMap[name] = data;
        //     console.log(`✅ Loaded character: ${name}`);
    } catch (err) {
        console.error(`❌ Failed to load character: ${name}`, err);
    }
}

function loadBaseStatsCSV(path) {
    return fetch(path)
        .then(res => res.text())
        .then(csv => {
            const rows = csv.trim().split("\n");
            const headers = rows[0].split(",");
            for (let i = 1; i < rows.length; i++) {
                const values = rows[i].split(",");
                const level = parseInt(values[0]);
                playerStatsByLevel[level] = {};
                headers.forEach((header, index) => {
                    const key = header.trim();
                    const value = parseFloat(values[index]);
                    playerStatsByLevel[level][key] = isNaN(value) ? values[index] : value;
                });
            }
            //     console.log("✅ Loaded base stats from CSV");
        })
        .catch(err => console.error("❌ Failed to load base_stats.csv", err));
}

// function getGridPosition($el) {
//     const offset = $el.position();
//     return {
//         col: Math.round(offset.left / tileSize),
//         row: Math.round(offset.top / tileSize)
//     };
// }

function getGridPosition($el) {
    if (!$el || $el.length === 0) {
        console.warn("⚠️ getGridPosition called with invalid element:", $el);
        return { row: -1, col: -1 }; // return safe default
    }
    const offset = $el.position();
    return {
        col: Math.round(offset.left / tileSize),
        row: Math.round(offset.top / tileSize)
    };
}


function lockPlayer($el) {
    const thisId = $el.attr("id");
    const pos = getGridPosition($el);
    const fallback = lastSafeTile[thisId] || prevDragTile[thisId] || startPositions[thisId];
    const conflict = isTileOccupied(pos, thisId);
    if (conflict) {
        setGridPosition($el, fallback.row, fallback.col);
        //     console.log(`⛔ ${thisId} can't lock onto ${conflict.type} (${conflict.id}) at (${pos.row}, ${pos.col}). Reverted to (${fallback.row}, ${fallback.col})`);
    } else {
        setGridPosition($el, pos.row, pos.col);
        //     console.log(`🔒 ${thisId} timed out and locked at row ${pos.row}, col ${pos.col}`);
    }

    $el.draggable("disable");
    $el.css("cursor", "default");
}


function unlockAllPlayers() {
    $(".draggable-unit").each(function() {
        $(this).draggable("enable");
        $(this).css("cursor", "grab");
    });
    //     console.log(`Unlocked all players. Ready for next round.`);
    $("#next-round").hide();
    turnEnded = false;
    currentPlayer = null;
}


function isSamePosition(pos1, pos2) {
    return pos1.row === pos2.row && pos1.col === pos2.col;
}

function oppositeDirection(deltaRow, deltaCol) {
    return { row: -Math.sign(deltaRow), col: -Math.sign(deltaCol) };
}

function setGridPosition($el, row, col) {
    row = Math.max(0, Math.min(row, 7));
    col = Math.max(0, Math.min(col, 5));
    //     console.log(`${$el.attr("id")} snapped to (${row}, ${col}) -> top: ${row * tileSize + 7}px`);
    $el.css({
        top: row * tileSize + 7 + 'px',
        left: col * tileSize + 7 + 'px'
    });
}




function isOverlappingBossTile(to) {
    return enemyIds.some(eid => {
        const $enemy = $("#" + eid);
        if (!$enemy.hasClass("boss-unit")) return false;

        const tiles = getOccupiedTiles($enemy, 2, 2);
        return tiles.some(tile => isSamePosition(tile, to));
    });
}


function handlePlayerPush(pusherId, pusheeId, fromTile, toTile) {
    const $pushee = $("#" + pusheeId);
    const pusheeTile = getGridPosition($pushee);

    if (!isSamePosition(toTile, pusheeTile)) return;

    const pushKey = `${pusherId}->${pusheeId}`;
    if (recentPushes.has(pushKey)) return;
    recentPushes.add(pushKey);

    const deltaRow = toTile.row - fromTile.row;
    const deltaCol = toTile.col - fromTile.col;

    if (!((deltaRow !== 0 && deltaCol === 0) || (deltaCol !== 0 && deltaRow === 0))) return;

    const push = oppositeDirection(deltaRow, deltaCol);
    const newRow = pusheeTile.row + push.row;
    const newCol = pusheeTile.col + push.col;

    const destination = { row: newRow, col: newCol };

    // Check for collisions
    const blockedByEnemy = enemyIds.some(eid => {
        const $enemy = $("#" + eid);
        const isBoss = $enemy.hasClass("boss-unit");
        const tiles = getOccupiedTiles($enemy, isBoss ? 2 : 1, isBoss ? 2 : 1);
        return tiles.some(tile => isSamePosition(tile, destination));
    });

    const blockedByPlayer = playerIds.some(pid => {
        if (pid === pusheeId) return false;
        const pos = (pid === pusherId) ? toTile : startPositions[pid] || getGridPosition($("#" + pid));
        return isSamePosition(destination, pos);
    });

    if (blockedByEnemy || blockedByPlayer) {
        //     console.log(`🧱 ${pusheeId} couldn't be pushed to (${newRow}, ${newCol}) — blocked by ${blockedByEnemy ? 'enemy' : 'player'}`);
        return;
    }

    // Move pushee
    $pushee.addClass("push-anim");
    setGridPosition($pushee, newRow, newCol);

    // Terrain damage logic — allow again if they left and came back
    const terrainKey = `${newRow},${newCol}`;
    const terrain = terrainMap[terrainKey];

    const lastKey = lastPushedTerrainTile[pusheeId];

    if (terrain && lastKey !== terrainKey) {
        lastPushedTerrainTile[pusheeId] = terrainKey; // Update last damaged tile
        playerHP[pusheeId] -= terrain.damage;
        if (playerHP[pusheeId] < 0) playerHP[pusheeId] = 0;
        $(`#hp_${pusheeId}`).text(`HP: ${playerHP[pusheeId]}`);
        //     console.log(`⚠️ ${pusheeId} was pushed onto ${terrain.type} and took ${terrain.damage} damage`);
    }

    // If tile has no terrain, clear the tracker
    if (!terrain) {
        lastPushedTerrainTile[pusheeId] = null;
    }

    setTimeout(() => $pushee.removeClass("push-anim"), 300);
    //     console.log(`🧍 ${pusheeId} pushed by ${pusherId} to (${newRow}, ${newCol})`);
}



function getBossOccupiedTiles() {
    const bossTiles = [];

    enemyIds.forEach(eid => {
        const $enemy = $("#" + eid);
        if (!$enemy.hasClass("boss-unit")) return;

        const row = parseInt($enemy.attr("data-row"));
        const col = parseInt($enemy.attr("data-col"));

        // 2x2 area for the boss
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                bossTiles.push({ row: row + dy, col: col + dx });
            }
        }
    });

    return bossTiles;
}


function isBoulderTile(row, col) {
    const key = `${row},${col}`;
    const terrain = terrainMap[key];
    return terrain?.type === "boulder";
}

function isTileOccupied(to, selfId = null) {
    // Check all enemies (boss or normal)
    for (const eid of enemyIds) {
        const $enemy = $("#" + eid);
        const isBoss = $enemy.hasClass("boss-unit");
        const tiles = getOccupiedTiles($enemy, isBoss ? 2 : 1, isBoss ? 2 : 1);

        // For boss units, check full 2x2 area
        if (isBoss) {
            const bossPos = {
                row: parseInt($enemy.attr("data-row")),
                col: parseInt($enemy.attr("data-col"))
            };
            if (to.row >= bossPos.row && to.row < bossPos.row + 2 &&
                to.col >= bossPos.col && to.col < bossPos.col + 2) {
                return { type: "boss", id: eid };
            }
        } else if (tiles.some(tile => isSamePosition(tile, to))) {
            return { type: "enemy", id: eid };
        }
    }

    // Check all players (excluding self)
    for (const pid of playerIds) {
        if (pid === selfId) continue;
        const $player = $("#" + pid);
        const pos = getGridPosition($player);

        if (isSamePosition(pos, to)) {
            return { type: "player", id: pid };
        }
    }

    // Check for boulder terrain
    const terrainKey = `${to.row},${to.col}`;
    const terrain = terrainMap[terrainKey];
    if (terrain?.type === "boulder") {
        return { type: "boulder", id: "terrain" };
    }

    return null;
}


function activateDraggables() {

    $(".draggable-unit").draggable({
        containment: "#grid",
        grid: [1, 1],

        start: function() {
            recentTerrainHits.clear(); // 🧽 Allow terrain to damage again on a new drag
            recentPushes.clear();
            terrainVisitTracker.clear();

            if (playerIds.length === 0) {
                playerIds = Object.keys(playerDataMap);
            }

            const $this = $(this);
            const id = $this.attr('id');
            if (turnEnded || (currentPlayer && currentPlayer !== id)) return false;
            currentPlayer = id;
            activeDrag = $this;
            startPositions[id] = getGridPosition($this);
            prevDragTile[id] = startPositions[id];
            lastLoggedTile[id] = startPositions[id];
            startTimer();
        },

        drag: function(event, ui) {
            const $this = $(this);
            const thisId = $this.attr("id");
            const col = Math.floor(ui.position.left / tileSize);
            const row = Math.floor(ui.position.top / tileSize);
            const index = row * 6 + col;


            $(".grid-item").removeClass("highlight");
            $("#tile-" + index).addClass("highlight");

            const currentTile = { row, col };
            const otherIds = playerIds.filter(pid => pid !== thisId);

            let lastTile = prevDragTile[thisId];
            if (!lastTile) {
                lastTile = getGridPosition($this);
                prevDragTile[thisId] = lastTile;
            }

            if (!lastLoggedTile[thisId]) {
                lastLoggedTile[thisId] = currentTile;
            }

            // ✅ Check if moving to a blocked tile (boss, enemy, or player)
            const conflict = isTileOccupied(currentTile, thisId);
            if (!conflict) {
                lastSafeTile[thisId] = currentTile;
            }

            if (!isSamePosition(currentTile, lastLoggedTile[thisId])) {
                //     console.log(`${thisId} moved to row ${row}, col ${col}`);
                lastLoggedTile[thisId] = currentTile;
            }

            // ✅ Reset push flags at the start of each new drag tick
            recentPushes.clear();
            // ✅ Push logic
            otherIds.forEach(otherId => {
                handlePlayerPush(thisId, otherId, lastTile, currentTile);
            });

            if (conflict) {
                // Revert drag position visually (no cancel — just move the piece back)
                const $el = $(`#${thisId}`);
                const safePos = prevDragTile[thisId];
                setGridPosition($el, safePos.row, safePos.col);
                // console.log(`⛔ ${thisId} can't move through ${conflict.type} (${conflict.id}) at (${currentTile.row}, ${currentTile.col})`);
                return;
            }

            // ✅ Now safe: update previous drag tile
            prevDragTile[thisId] = currentTile;

            // ✅ Terrain damage for every tile passed
            if (!isSamePosition(currentTile, lastTile)) {
                const stepRow = Math.sign(currentTile.row - lastTile.row);
                const stepCol = Math.sign(currentTile.col - lastTile.col);
                let traversedRow = lastTile.row;
                let traversedCol = lastTile.col;

                while (!(traversedRow === currentTile.row && traversedCol === currentTile.col)) {
                    traversedRow += stepRow;
                    traversedCol += stepCol;

                    const key = `${traversedRow},${traversedCol}`;
                    const terrain = terrainMap[key];
                    if (terrain) {
                        playerHP[thisId] -= terrain.damage;
                        if (playerHP[thisId] < 0) {
                            playerHP[thisId] = 0;
                        }
                        $(`#hp_${thisId}`).text(`HP: ${playerHP[thisId]}`);
                        //     console.log(`🔥 ${thisId} walked on ${terrain.type} at (${traversedRow}, ${traversedCol}), took ${terrain.damage} damage`);
                    }
                }
            }
        },

        stop: function() {
            const $this = $(this);
            $(".grid-item").removeClass("highlight");

            if (!timerRunning) return;

            const thisId = $this.attr("id");
            const to = getGridPosition($this);
            const conflict = isTileOccupied(to, thisId);

            if (conflict) {
                const fallback = prevDragTile[thisId];
                alert(`🚫 ${thisId} can't end turn on ${conflict.type} (${conflict.id}) at (${to.row}, ${to.col}). Reverted to (${fallback.row}, ${fallback.col}).`);
                if (fallback) {
                    // Snap the player visually back to a safe tile
                    setGridPosition($this, fallback.row, fallback.col);
                    //     //     console.log(`🚫 ${thisId} can't end turn on ${conflict.type} (${conflict.id}) at (${to.row}, ${to.col}). Reverted to (${fallback.row}, ${fallback.col}).`);
                } else {
                    //     console.log(`❌ No valid fallback for ${thisId}, unable to revert.`);
                }

                //     console.log(`🚫 ${thisId} can't end turn on ${conflict.type} (${conflict.id}) at (${to.row}, ${to.col}). Reverted.`);
                stopTimer();
                activeDrag = null;
                turnEnded = true;
                $(".draggable-unit").draggable("disable");
                $("#next-round").show();
                return;
            }

            // Apply terrain damage again on final position if needed
            const terrain = terrainMap[`${to.row},${to.col}`];
            if (terrain) {
                playerHP[thisId] -= terrain.damage;
                if (playerHP[thisId] < 0) playerHP[thisId] = 0;
                $(`#hp_${thisId}`).text(`HP: ${playerHP[thisId]}`);
                //     console.log(`🔥 ${thisId} ended on ${terrain.type}, took ${terrain.damage} dmg`);
            }

            // Snap to final position
            setGridPosition($this, to.row, to.col);

            // Trail animation
            const from = startPositions[thisId];
            const dx = to.col - from.col;
            const dy = to.row - from.row;
            const trailCount = Math.max(Math.abs(dx), Math.abs(dy));

            for (let i = 0; i < trailCount; i++) {
                const stepX = from.col + Math.sign(dx) * i;
                const stepY = from.row + Math.sign(dy) * i;
                const sparkle = $('<div class="sparkle"></div>');
                sparkle.css({
                    left: stepX * tileSize + 30 + "px",
                    top: stepY * tileSize + 30 + "px"
                });
                $("#grid").append(sparkle);
                setTimeout(() => sparkle.remove(), 500);
            }

            stopTimer();
            activeDrag = null;
            turnEnded = true;
            $(".draggable-unit").draggable("disable");
            $("#next-round").show();
            checkPincerCombat();
        }


    });
}

function renderPlayerDivs() {
    const container = $("#player-container");
    container.empty();
    //   //     console.log("📦 playerDataMap contents:", playerDataMap);
    Object.keys(playerDataMap).forEach(playerId => {
        const player = playerDataMap[playerId];
        const char = characterDataMap[player.character];
        const unitHTML = `
  <div id="${playerId}" class="draggable-unit">
    <img id="img_${playerId}" class="unit-icon" src="/static/players/${playerId}.png" alt="${char?.name || 'Player'}">
    <div class="hp-label" id="hp_${playerId}">HP: 100</div>
  </div>
`;
        container.append(unitHTML);
        const $el = $(`#${playerId}`);
        if ($el.length) {
            setGridPosition($el, 7, 2); // TEMP default placement
        }
    });
}

function renderEnemies(enemyList) {
    const container = $("#enemy-container");
    enemyIds = [];

    enemyList.forEach(enemy => {
        const { id, img, hp = 100 } = enemy;
        enemyIds.push(id);

        const unitHTML = `
        <div id="${id}" class="enemy-unit">
          <img src="${img}" alt="${id}" class="unit-icon">
          <div class="hp-label" id="hp_${id}">HP: ${hp}</div>
        </div>
      `;
        container.append(unitHTML);
        setGridPosition($(`#${id}`), enemy.row, enemy.col);
    });
}

function renderTerrain() {
    Object.keys(terrainMap).forEach(key => {
        const [row, col] = key.split(',').map(Number);
        const tileIndex = row * 6 + col;
        const $tile = $(`#tile-${tileIndex}`);
        const terrain = terrainMap[key];

        const terrainImg = $('<img>')
            .addClass('terrain-icon')
            .attr('src', `/static/terrain/${terrain.type}.png`)
            .attr('alt', terrain.type);

        $tile.append(terrainImg);
    });
}



function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function initGame() {
    await loadBaseStatsCSV('/static/data/base_stats.csv');
    await loadTeamFromYAML('/static/data/team.yaml'); // Wait for players to load
    renderPlayerDivs(); // ✅ Safe to render players now
    activateDraggables(); // binds draggable
    //    loadLevelFromYAML('/static/levels/level_1.yaml'); // 🧠 Positions + terrain

    // 🔄 Load level based on URL parameter
    const levelName = getQueryParam("level") || "level_1"; // fallback to level_1 if none provided
    const levelPath = `/static/levels/${levelName}.yaml`;

    //     console.log(`📦 Loading level: ${levelPath}`);
    loadLevelFromYAML(levelPath); // 🧠 Positions + terrain

    // Load level and handle boss data
    loadLevelFromYAML(levelPath)
        .then(levelData => {
            if (levelData && levelData.bosses && levelData.bosses.length > 0) {
                for (const boss of levelData.bosses) {
                    loadBossYAML('/static/bosses/test_boss.yaml');
                }
            }
        })
        .catch(err => console.error("Failed to load level:", err));
}
initGame(); // Call it