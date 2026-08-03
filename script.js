const PLAYER_COUNT_MIN = 5;
const INITIAL_PLAYER_COUNT = 17;
const PLAYER_COUNT_MAX = 50;
const COURT_COUNT_MIN = 1;
const INITIAL_COURT_COUNT = 2;
const COURT_COUNT_MAX = 10;
const INITIAL_MATCH_COUNT = 1;

const playerCountSelect = document.getElementById('player-count');
const courtCountSelect = document.getElementById('court-count');
const createButton = document.getElementById('create-button');
const titleScreen = document.getElementById('title-screen');
const appScreen = document.getElementById('app-screen');
const matchList = document.querySelector('.match-list');
const addMatchButton = document.querySelector('.add-match-button');
const matchModal = document.getElementById('match-modal');
const matchModalTitle = document.getElementById('match-modal-title');
const matchModalBody = document.querySelector('.match-modal__body');
const matchModalBackdrop = document.querySelector('.match-modal__backdrop');
const matchModalPanel = document.querySelector('.match-modal__panel');
let currentCourtCount = INITIAL_COURT_COUNT;
let activeMatchItem = null;
let players = [];

function appendRangeOptions(selectElement, minValue, maxValue) {
    for (let value = minValue; value <= maxValue; value += 1) {
        const option = document.createElement('option');
        option.value = String(value);
        option.textContent = String(value);
        selectElement.append(option);
    }
}

function createPlayer(id) {
    return {
        id,
        wins: 0,
        matches: 0,
        history: {},
    };
}

function initializePlayers(playerCount) {
    players = [];

    for (let index = 1; index <= playerCount; index += 1) {
        players.push(createPlayer(`${index}`));
    }
}

function getHistoryRecord(player, otherPlayerId) {
    if (!player.history[otherPlayerId]) {
        player.history[otherPlayerId] = {
            teammate: 0,
            opponent: 0,
        };
    }

    return player.history[otherPlayerId];
}

function getRelationshipPenalty(player, selectedPlayers) {
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

function compareCandidates(leftPlayer, rightPlayer, selectedPlayers) {
    return (
        leftPlayer.matches - rightPlayer.matches ||
        getRelationshipPenalty(leftPlayer, selectedPlayers) - getRelationshipPenalty(rightPlayer, selectedPlayers) ||
        leftPlayer.wins - rightPlayer.wins ||
        leftPlayer.id.localeCompare(rightPlayer.id)
    );
}

function selectPlayersForNewMatch() {
    const availablePlayers = [...players];
    const selectedPlayers = [];

    while (selectedPlayers.length < 4 && availablePlayers.length > 0) {
        availablePlayers.sort((leftPlayer, rightPlayer) => compareCandidates(leftPlayer, rightPlayer, selectedPlayers));
        selectedPlayers.push(availablePlayers.shift());
    }

    return selectedPlayers;
}

function getTeamWins(teamPlayers) {
    return teamPlayers.reduce((totalWins, player) => totalWins + player.wins, 0);
}

function getPairTeammatePenalty(leftPlayer, rightPlayer) {
    const leftHistory = leftPlayer.history[rightPlayer.id];
    const rightHistory = rightPlayer.history[leftPlayer.id];

    return (leftHistory?.teammate || 0) + (rightHistory?.teammate || 0);
}

function comparePairingCandidates(leftPairing, rightPairing) {
    return (
        leftPairing.balanceScore - rightPairing.balanceScore ||
        leftPairing.teammatePenalty - rightPairing.teammatePenalty ||
        leftPairing.label.localeCompare(rightPairing.label)
    );
}

function chooseTeamsForMatch(selectedPlayers) {
    const pairingCandidates = [
        {
            label: 'ab-cd',
            red: [selectedPlayers[0], selectedPlayers[1]],
            blue: [selectedPlayers[2], selectedPlayers[3]],
        },
        {
            label: 'ac-bd',
            red: [selectedPlayers[0], selectedPlayers[2]],
            blue: [selectedPlayers[1], selectedPlayers[3]],
        },
        {
            label: 'ad-bc',
            red: [selectedPlayers[0], selectedPlayers[3]],
            blue: [selectedPlayers[1], selectedPlayers[2]],
        },
    ].map((candidate) => ({
        ...candidate,
        balanceScore: Math.abs(getTeamWins(candidate.red) - getTeamWins(candidate.blue)),
        teammatePenalty: getPairTeammatePenalty(candidate.red[0], candidate.red[1]) + getPairTeammatePenalty(candidate.blue[0], candidate.blue[1]),
    }));

    return pairingCandidates.sort(comparePairingCandidates)[0];
}

function recordMatchHistory(matchTeams) {
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

function createNewMatch(matchIndex, courtCount) {
    const selectedPlayers = selectPlayersForNewMatch();

    if (selectedPlayers.length < 4) {
        return null;
    }

    const teams = chooseTeamsForMatch(selectedPlayers);

    recordMatchHistory(teams);

    return {
        label: getMatchLabel(matchIndex, courtCount),
        state: 'idle',
        winner: null,
        players: selectedPlayers,
        teams: {
            red: teams.red,
            blue: teams.blue,
        },
    };
}

function getMatchLabel(matchIndex, courtCount) {
    const setNumber = Math.floor(matchIndex / courtCount) + 1;
    const courtNumber = (matchIndex % courtCount) + 1;
    return `${setNumber}-${courtNumber}`;
}

function createMatchBox(player, groupColor) {
    const box = document.createElement('div');
    box.className = `match-boxes__box match-boxes__box--${groupColor}`;
    box.textContent = player.id;
    return box;
}

function createMatchItem(matchData) {
    const matchItem = document.createElement('article');
    matchItem.className = 'match-item';
    matchItem.setAttribute('aria-label', `対戦要素 ${matchData.label}`);
    matchItem.dataset.state = matchData.state;
    matchItem.dataset.matchLabel = matchData.label;
    matchItem.matchData = matchData;

    const matchNumber = document.createElement('div');
    matchNumber.className = 'match-number';
    matchNumber.textContent = matchData.label;

    const matchBoxes = document.createElement('div');
    matchBoxes.className = 'match-boxes';

    matchBoxes.append(
        createMatchBox(matchData.teams.red[0], 'red'),
        createMatchBox(matchData.teams.red[1], 'red'),
        createMatchBox(matchData.teams.blue[0], 'blue'),
        createMatchBox(matchData.teams.blue[1], 'blue')
    );

    matchItem.append(matchNumber, matchBoxes);

    matchItem.addEventListener('click', () => {
        openMatchModal(matchItem);
    });

    return matchItem;
}

function setMatchState(matchItem, nextState) {
    const matchData = matchItem.matchData;
    const previousState = matchData.state;

    if (previousState === nextState) {
        return;
    }

    if (previousState === 'red' || previousState === 'blue') {
        matchData.teams[previousState].forEach((player) => {
            player.wins -= 1;
        });
    }

    matchData.state = nextState;
    matchItem.dataset.state = nextState;

    if (nextState === 'red' || nextState === 'blue') {
        matchData.teams[nextState].forEach((player) => {
            player.wins += 1;
        });
    }
}

function openMatchModal(matchItem) {
    activeMatchItem = matchItem;

    const currentState = matchItem.dataset.state;
    const isResultState = currentState === 'started' || currentState === 'red' || currentState === 'blue';

    matchModalTitle.textContent = isResultState ? '勝者報告' : '試合設定';
    matchModalBody.replaceChildren();

    if (isResultState) {
        const buttonRow = document.createElement('div');
        buttonRow.className = 'match-modal__button-row';

        const redButton = document.createElement('button');
        redButton.type = 'button';
        redButton.textContent = '赤';
        redButton.addEventListener('click', () => {
            setMatchState(activeMatchItem, 'red');
            closeMatchModal();
        });

        const blueButton = document.createElement('button');
        blueButton.type = 'button';
        blueButton.textContent = '青';
        blueButton.addEventListener('click', () => {
            setMatchState(activeMatchItem, 'blue');
            closeMatchModal();
        });

        buttonRow.append(redButton, blueButton);
        matchModalBody.append(buttonRow);
    } else {
        const startButton = document.createElement('button');
        startButton.type = 'button';
        startButton.textContent = '対戦開始';
        startButton.addEventListener('click', () => {
            setMatchState(activeMatchItem, 'started');
            closeMatchModal();
        });

        matchModalBody.append(startButton);
    }

    matchModal.hidden = false;
}

function closeMatchModal() {
    matchModal.hidden = true;
    matchModalBody.replaceChildren();
    activeMatchItem = null;
}

function renderInitialMatches(courtCount) {
    matchList.replaceChildren();

    const initialMatchTotal = courtCount * INITIAL_MATCH_COUNT;

    for (let matchIndex = 0; matchIndex < initialMatchTotal; matchIndex += 1) {
        const matchData = createNewMatch(matchIndex, courtCount);

        if (matchData) {
            matchList.append(createMatchItem(matchData));
        }
    }
}

function addMatchItem() {
    const currentMatchTotal = matchList.children.length;

    for (let matchOffset = 0; matchOffset < currentCourtCount; matchOffset += 1) {
        const matchData = createNewMatch(currentMatchTotal + matchOffset, currentCourtCount);

        if (matchData) {
            matchList.append(createMatchItem(matchData));
        }
    }
}

appendRangeOptions(playerCountSelect, PLAYER_COUNT_MIN, PLAYER_COUNT_MAX);
appendRangeOptions(courtCountSelect, COURT_COUNT_MIN, COURT_COUNT_MAX);

playerCountSelect.value = String(INITIAL_PLAYER_COUNT);
courtCountSelect.value = String(INITIAL_COURT_COUNT);

addMatchButton.addEventListener('click', addMatchItem);
matchModalBackdrop.addEventListener('click', closeMatchModal);
matchModalPanel.addEventListener('click', (event) => {
    event.stopPropagation();
});

createButton.addEventListener('click', () => {
    initializePlayers(Number(playerCountSelect.value));
    currentCourtCount = Number(courtCountSelect.value);
    renderInitialMatches(currentCourtCount);
    titleScreen.hidden = true;
    appScreen.hidden = false;
    document.body.dataset.screen = 'app';
});
