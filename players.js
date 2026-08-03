import { PLAYER_COUNT_MIN } from "./constants.js";
import {
    players,
    setPlayers,
    setCurrentPlayerCount,
} from "./state.js";

export function createPlayer(id) {
    return {
        id,
        wins: 0,
        matches: 0,
        history: {},
    };
}

export function initializePlayers(playerCount) {
    const nextPlayers = [];

    for (let index = 1; index <= playerCount; index += 1) {
        nextPlayers.push(createPlayer(`${index}`));
    }

    setPlayers(nextPlayers);
    setCurrentPlayerCount(playerCount);
}

export function getPlayerLookup() {
    return new Map(players.map((player) => [player.id, player]));
}

export function getHistoryRecord(player, otherPlayerId) {
    if (!player.history[otherPlayerId]) {
        player.history[otherPlayerId] = {
            teammate: 0,
            opponent: 0,
        };
    }

    return player.history[otherPlayerId];
}

export function getRelationshipPenalty(player, selectedPlayers) {
    return selectedPlayers.reduce((totalPenalty, selectedPlayer) => {
        if (selectedPlayer.id === player.id) {
            return totalPenalty;
        }

        const relationRecord = player.history[selectedPlayer.id];

        if (!relationRecord) {
            return totalPenalty;
        }

        return totalPenalty + relationRecord.teammate + relationRecord.opponent;
    }, 0);
}

export function compareCandidates(leftPlayer, rightPlayer, selectedPlayers) {
    return (
        leftPlayer.matches - rightPlayer.matches ||
        getRelationshipPenalty(leftPlayer, selectedPlayers) -
        getRelationshipPenalty(rightPlayer, selectedPlayers) ||
        leftPlayer.wins - rightPlayer.wins ||
        leftPlayer.id.localeCompare(rightPlayer.id)
    );
}

export function selectPlayersForNewMatch() {
    const availablePlayers = [...players];
    const selectedPlayers = [];

    while (selectedPlayers.length < 4 && availablePlayers.length > 0) {
        availablePlayers.sort((leftPlayer, rightPlayer) =>
            compareCandidates(leftPlayer, rightPlayer, selectedPlayers)
        );

        selectedPlayers.push(availablePlayers.shift());
    }

    return selectedPlayers;
}