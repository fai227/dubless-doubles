import {
    INITIAL_PLAYER_COUNT,
    INITIAL_COURT_COUNT,
} from './constants.js';

export let players = [];

export let currentPlayerCount = INITIAL_PLAYER_COUNT;
export let currentCourtCount = INITIAL_COURT_COUNT;

export let activeMatchItem = null;
export let currentShareUrl = "";

// setters
export function setPlayers(value) {
    players = value;
}

export function setCurrentPlayerCount(value) {
    currentPlayerCount = value;
}

export function setCurrentCourtCount(value) {
    currentCourtCount = value;
}

export function setActiveMatchItem(value) {
    activeMatchItem = value;
}

export function setCurrentShareUrl(value) {
    currentShareUrl = value;
}