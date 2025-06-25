// /static/js/attack_chain.js

function runAttackChain(centerPlayerA, centerPlayerB, enemyId, playerDataMap, playerIds, isTileBlocked, getGridPosition, useAbility) {
    const chained = new Set([centerPlayerA, centerPlayerB]); // Initial pincer pair

    // Helper: Check if a straight path from one player to another is unobstructed
    function isClearPath(start, end) {
        if (start.row === end.row) {
            const minCol = Math.min(start.col, end.col);
            const maxCol = Math.max(start.col, end.col);
            for (let col = minCol + 1; col < maxCol; col++) {
                if (isTileBlocked({ row: start.row, col })) return false;
            }
            return true;
        }
        if (start.col === end.col) {
            const minRow = Math.min(start.row, end.row);
            const maxRow = Math.max(start.row, end.row);
            for (let row = minRow + 1; row < maxRow; row++) {
                if (isTileBlocked({ row, col: start.col })) return false;
            }
            return true;
        }
        return false;
    }

    // Check if another player is line-connected to A or B
    function findChainMembers(referenceId) {
        const refPos = getGridPosition(document.getElementById(referenceId));
        playerIds.forEach(pid => {
            if (chained.has(pid)) return;
            const targetPos = getGridPosition(document.getElementById(pid));
            if ((refPos.row === targetPos.row || refPos.col === targetPos.col) && isClearPath(refPos, targetPos)) {
                chained.add(pid);
                findChainMembers(pid); // Recursively find deeper links
            }
        });
    }

    // Start recursive search
    findChainMembers(centerPlayerA);
    findChainMembers(centerPlayerB);

    // Trigger attacks for all in the chain
    chained.forEach(pid => {
        const abilities = playerDataMap[pid]?.abilities || [];
        const abilityName = abilities[0]; // Assume the first is default
        if (abilityName) {
            useAbility(pid, abilityName);
            console.log(`🔗 ${pid} joined the attack chain against ${enemyId}!`);
        }
    });
}
