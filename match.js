import {
    INITIAL_MATCH_COUNT,
} from "./constants.js";

import {
    players,
} from "./state.js";

import {
    getHistoryRecord,
    getPlayerLookup,
    selectPlayersForNewMatch,
} from "./players.js";

export function getTeamWins(teamPlayers) {
    return teamPlayers.reduce((totalWins, player) => totalWins + player.wins, 0);
}

export function getPairTeammatePenalty(leftPlayer, rightPlayer) {
    const leftHistory = leftPlayer.history[rightPlayer.id];
    const rightHistory = rightPlayer.history[leftPlayer.id];

    return (leftHistory?.teammate || 0) + (rightHistory?.teammate || 0);
}

export function comparePairingCandidates(leftPairing, rightPairing) {
    return (
        leftPairing.balanceScore - rightPairing.balanceScore ||
        leftPairing.teammatePenalty - rightPairing.teammatePenalty ||
        leftPairing.label.localeCompare(rightPairing.label)
    );
}

export function chooseTeamsForMatch(selectedPlayers) {
    const pairingCandidates = [
        {
            label: "ab-cd",
            red: [selectedPlayers[0], selectedPlayers[1]],
            blue: [selectedPlayers[2], selectedPlayers[3]],
        },
        {
            label: "ac-bd",
            red: [selectedPlayers[0], selectedPlayers[2]],
            blue: [selectedPlayers[1], selectedPlayers[3]],
        },
        {
            label: "ad-bc",
            red: [selectedPlayers[0], selectedPlayers[3]],
            blue: [selectedPlayers[1], selectedPlayers[2]],
        },
    ].map((candidate) => ({
        ...candidate,
        balanceScore: Math.abs(getTeamWins(candidate.red) - getTeamWins(candidate.blue)),
        teammatePenalty:
            getPairTeammatePenalty(candidate.red[0], candidate.red[1]) +
            getPairTeammatePenalty(candidate.blue[0], candidate.blue[1]),
    }));

    return pairingCandidates.sort(comparePairingCandidates)[0];
}

export function recordMatchHistory(matchTeams) {
    const { red, blue } = matchTeams;
    const allPlayers = [...red, ...blue];

    allPlayers.forEach((player) => {
        player.matches += 1;
    });

    getHistoryRecord(red[0], red[1].id).teammate += 1;
    getHistoryRecord(red[1], red[0].id).teammate += 1;
    getHistoryRecord(blue[0], blue[1].id).teammate += 1;
    getHistoryRecord(blue[1], blue[0].id).teammate += 1;

    red.forEach((redPlayer) => {
        blue.forEach((bluePlayer) => {
            getHistoryRecord(redPlayer, bluePlayer.id).opponent += 1;
            getHistoryRecord(bluePlayer, redPlayer.id).opponent += 1;
        });
    });
}

export function getMatchLabel(matchIndex, courtCount) {
    const setNumber = Math.floor(matchIndex / courtCount) + 1;
    const courtNumber = (matchIndex % courtCount) + 1;

    return `${setNumber}-${courtNumber}`;
}

export function createNewMatch(matchIndex, courtCount) {
    const selectedPlayers = selectPlayersForNewMatch();

    if (selectedPlayers.length < 4) {
        return null;
    }

    const teams = chooseTeamsForMatch(selectedPlayers);

    recordMatchHistory(teams);

    return {
        label: getMatchLabel(matchIndex, courtCount),
        state: "idle",
        winner: null,
        players: selectedPlayers,
        teams: {
            red: teams.red,
            blue: teams.blue,
        },
    };
}

export function getMatchStateCode(matchData) {
    switch (matchData.state) {
        case "red":
            return "r";
        case "blue":
            return "b";
        case "started":
            return "s";
        default:
            return "i";
    }
}

export function serializeMatchRecord(matchData) {
    return [
        matchData.teams.red[0].id,
        matchData.teams.red[1].id,
        matchData.teams.blue[0].id,
        matchData.teams.blue[1].id,
        getMatchStateCode(matchData),
    ].join(",");
}

export function applyMatchHistoryFromRecord(matchData) {
    recordMatchHistory(matchData.teams);

    if (matchData.winner === "red" || matchData.winner === "blue") {
        matchData.teams[matchData.winner].forEach((player) => {
            player.wins += 1;
        });
    }
}

export function createMatchFromRecord(
    matchRecord,
    matchIndex,
    courtCount,
    playerLookup
) {
    const redPlayers = [
        playerLookup.get(matchRecord.redIds[0]),
        playerLookup.get(matchRecord.redIds[1]),
    ];

    const bluePlayers = [
        playerLookup.get(matchRecord.blueIds[0]),
        playerLookup.get(matchRecord.blueIds[1]),
    ];

    if (
        redPlayers.some((player) => !player) ||
        bluePlayers.some((player) => !player)
    ) {
        return null;
    }

    const stateMap = {
        i: { state: "idle", winner: null },
        s: { state: "started", winner: null },
        r: { state: "red", winner: "red" },
        b: { state: "blue", winner: "blue" },
    };

    const resolvedState = stateMap[matchRecord.stateCode] ?? stateMap.i;

    const matchData = {
        label: getMatchLabel(matchIndex, courtCount),
        state: resolvedState.state,
        winner: resolvedState.winner,
        players: [...redPlayers, ...bluePlayers],
        teams: {
            red: redPlayers,
            blue: bluePlayers,
        },
    };

    applyMatchHistoryFromRecord(matchData);

    return matchData;
}

export function setMatchState(matchItem, nextState) {
    const matchData = matchItem.matchData;
    const previousState = matchData.state;

    if (previousState === nextState) {
        return;
    }

    if (previousState === "red" || previousState === "blue") {
        matchData.teams[previousState].forEach((player) => {
            player.wins -= 1;
        });
    }

    matchData.state = nextState;
    matchData.winner =
        nextState === "red" || nextState === "blue"
            ? nextState
            : null;

    matchItem.dataset.state = nextState;

    if (nextState === "red" || nextState === "blue") {
        matchData.teams[nextState].forEach((player) => {
            player.wins += 1;
        });
    }
}