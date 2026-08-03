import {
    INITIAL_MATCH_COUNT,
} from "./constants.js";

import {
    currentCourtCount,
} from "./state.js";

import {
    createNewMatch,
} from "./match.js";

export function appendRangeOptions(selectElement, minValue, maxValue) {
    for (let value = minValue; value <= maxValue; value += 1) {
        const option = document.createElement("option");
        option.value = String(value);
        option.textContent = String(value);
        selectElement.append(option);
    }
}

export function createMatchBox(player, groupColor) {
    const box = document.createElement("div");
    box.className = `match-boxes__box match-boxes__box--${groupColor}`;
    box.textContent = player.id;

    return box;
}

export function createMatchItem(matchData, onClick) {
    const matchItem = document.createElement("article");

    matchItem.className = "match-item";
    matchItem.dataset.state = matchData.state;
    matchItem.dataset.matchLabel = matchData.label;
    matchItem.matchData = matchData;

    const matchNumber = document.createElement("div");
    matchNumber.className = "match-number";
    matchNumber.textContent = matchData.label;

    const matchBoxes = document.createElement("div");
    matchBoxes.className = "match-boxes";

    matchBoxes.append(
        createMatchBox(matchData.teams.red[0], "red"),
        createMatchBox(matchData.teams.red[1], "red"),
        createMatchBox(matchData.teams.blue[0], "blue"),
        createMatchBox(matchData.teams.blue[1], "blue"),
    );

    matchItem.append(matchNumber, matchBoxes);

    if (onClick) {
        matchItem.addEventListener("click", () => onClick(matchItem));
    }

    return matchItem;
}

export function renderInitialMatches(
    matchList,
    courtCount,
    createMatchItemCallback
) {
    matchList.replaceChildren();

    const initialMatchTotal = courtCount * INITIAL_MATCH_COUNT;

    for (let matchIndex = 0; matchIndex < initialMatchTotal; matchIndex++) {
        const matchData = createNewMatch(matchIndex, courtCount);

        if (matchData) {
            matchList.append(
                createMatchItemCallback(matchData)
            );
        }
    }
}

export function addMatchItem(
    matchList,
    createMatchItemCallback
) {
    const currentMatchTotal = matchList.children.length;

    for (let offset = 0; offset < currentCourtCount; offset++) {
        const matchData = createNewMatch(
            currentMatchTotal + offset,
            currentCourtCount
        );

        if (matchData) {
            matchList.append(
                createMatchItemCallback(matchData)
            );
        }
    }
}