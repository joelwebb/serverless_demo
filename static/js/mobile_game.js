// Mobile-optimized version of game controls
let activeDrag = null;
let startPositions = {};
let lastSafeTile = {};
let prevDragTile = {};
let gridOffset = { x: 0, y: 0 };
let touchStartPos = { x: 0, y: 0 };
const tileSize = 85;
let playerIds = [];
let enemyIds = [];
let playerDataMap = {};
let enemyDataMap = {};
let playerHP = {};
let abilityDataMap = {};
let equipmentDataMap = {};
let characterDataMap = {};
let terrainMap = {};
let timerInterval;
let timerRunning = false;
const timerDuration = 4000;
let currentPlayer = null;
let turnEnded = false;
let lastLoggedTile = {};

function initializeMobileControls() {
    // Wait for DOM to be ready
    $(document).ready(function() {
        const grid = document.querySelector('#grid');

        if (!grid) {
            console.warn('Grid not found, retrying in 100ms');
            setTimeout(initializeMobileControls, 100);
            return;
        }

        function updateGridOffset() {
            const rect = grid.getBoundingClientRect();
            gridOffset = {
                x: rect.left,
                y: rect.top
            };
        }

        updateGridOffset();
        window.addEventListener('resize', updateGridOffset);

        // Attach touch events to the grid container
        grid.addEventListener('touchstart', function(e) {
            const unit = e.target.closest('.draggable-unit');
            if (unit) {
                console.log('Touch start on unit:', unit.id);
                handleTouchStart(e);
            }
        }, { passive: false });

        grid.addEventListener('touchmove', function(e) {
            if (activeDrag) {
                handleTouchMove(e);
            }
        }, { passive: false });

        grid.addEventListener('touchend', function(e) {
            if (activeDrag) {
                handleTouchEnd(e);
            }
        }, { passive: false });

        grid.addEventListener('touchcancel', function(e) {
            if (activeDrag) {
                handleTouchEnd(e);
            }
        }, { passive: false });
    });
}

function handleTouchStart(e) {
    console.log('🔵 Touch Start Event:', e);
    if (turnEnded) return;
    e.preventDefault();

    const touch = e.touches[0];
    const unit = e.target.closest('.draggable-unit');
    console.log('🎯 Touch target:', unit?.id || 'no unit found');
    if (!unit) return;

    activeDrag = $(unit);
    currentPlayer = unit.id;
    touchStartPos = { x: touch.clientX, y: touch.clientY };

    const pos = getGridPosition(activeDrag);
    startPositions[currentPlayer] = pos;
    prevDragTile[currentPlayer] = pos;
    lastLoggedTile[currentPlayer] = pos;

    startTimer();
}

function handleTouchMove(e) {
    if (!activeDrag || turnEnded) return;
    e.preventDefault();

    const touch = e.touches[0];
    console.log('🔄 Touch Move Event:', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        activeDrag: activeDrag?.attr('id')
    });

    const x = touch.clientX - gridOffset.x;
    const y = touch.clientY - gridOffset.y;

    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    if (row >= 0 && row < 8 && col >= 0 && col < 6) {
        const newPos = { row, col };
        const currentPos = getGridPosition(activeDrag);

        if (!isSamePosition(newPos, currentPos)) {
            setGridPosition(activeDrag, row, col);
            prevDragTile[currentPlayer] = currentPos;

            // Check for collisions
            const conflict = isTileOccupied(newPos, currentPlayer);
            if (!conflict) {
                lastSafeTile[currentPlayer] = newPos;
            }
        }
    }
}

function handleTouchEnd(e) {
    console.log('🔴 Touch End Event:', e);
    if (!activeDrag) return;
    e.preventDefault();

    const pos = getGridPosition(activeDrag);
    console.log('📍 Final position:', pos);
    const conflict = isTileOccupied(pos, currentPlayer);

    if (conflict) {
        const fallback = lastSafeTile[currentPlayer] || prevDragTile[currentPlayer];
        setGridPosition(activeDrag, fallback.row, fallback.col);
    }

    stopTimer();
    activeDrag = null;
    turnEnded = true;
    $("#next-round").show();
    checkPincerCombat();
}

// Core utility functions
function getGridPosition($el) {
    if (!$el || $el.length === 0) {
        console.warn("⚠️ getGridPosition called with invalid element:", $el);
        return { row: -1, col: -1 };
    }
    const offset = $el.position();
    return {
        col: Math.round(offset.left / tileSize),
        row: Math.round(offset.top / tileSize)
    };
}

function setGridPosition($el, row, col) {
    row = Math.max(0, Math.min(row, 7));
    col = Math.max(0, Math.min(col, 5));
    $el.css({
        top: row * tileSize + 7 + 'px',
        left: col * tileSize + 7 + 'px'
    });
}

function isTileOccupied(to, selfId = null) {
    for (const eid of enemyIds) {
        const $enemy = $("#" + eid);
        const pos = getGridPosition($enemy);
        if (isSamePosition(pos, to)) {
            return { type: "enemy", id: eid };
        }
    }

    for (const pid of playerIds) {
        if (pid === selfId) continue;
        const $player = $("#" + pid);
        const pos = getGridPosition($player);
        if (isSamePosition(pos, to)) {
            return { type: "player", id: pid };
        }
    }
    return null;
}

function isSamePosition(pos1, pos2) {
    return pos1.row === pos2.row && pos1.col === pos2.col;
}

function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    let remaining = timerDuration;
    $('#timer').text((remaining / 1000).toFixed(3));

    timerInterval = setInterval(() => {
        remaining -= 10;
        if (remaining <= 0) {
            clearInterval(timerInterval);
            $('#timer').text('0.000');
            timerRunning = false;
            if (activeDrag) {
                activeDrag = null;
            }
            turnEnded = true;
            $("#next-round").show();
        } else {
            $('#timer').text((remaining / 1000).toFixed(3));
        }
    }, 10);
}

function stopTimer() {
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
    }
}

function unlockAllPlayers() {
    $(".draggable-unit").each(function() {
        $(this).css("cursor", "grab");
    });
    $("#next-round").hide();
    turnEnded = false;
    currentPlayer = null;
}

function checkCollisions(row, col) {
    const currentTile = { row, col };
    const conflict = isTileOccupied(currentTile, currentPlayer);

    if (!conflict) {
        lastSafeTile[currentPlayer] = currentTile;
    }

    // Terrain effects
    const terrainKey = `${row},${col}`;
    if (terrainMap[terrainKey]) {
        const terrain = terrainMap[terrainKey];
        playerHP[currentPlayer] -= terrain.damage;
        if (playerHP[currentPlayer] < 0) playerHP[currentPlayer] = 0;
        $(`#hp_${currentPlayer}`).text(`HP: ${playerHP[currentPlayer]}`);
    }
}

function checkPincerCombat() {
    // Placeholder for pincer combat logic
}

// Initialize game
async function initGame() {
    await loadBaseStatsCSV('/static/data/base_stats.csv');
    await loadTeamFromYAML('/static/data/team.yaml');
    renderPlayerDivs();

    const levelName = getQueryParam("level") || "level_1";
    const levelPath = `/static/levels/${levelName}.yaml`;
    await loadLevelFromYAML(levelPath);

    // Initialize mobile controls after elements are rendered
    setTimeout(initializeMobileControls, 100);

    $("#next-round").on("click", function() {
        unlockAllPlayers();
        turnEnded = false;
    });
}

// Initialize
$(function() {
    initGame();
    setTimeout(initializeMobileControls, 100);
});