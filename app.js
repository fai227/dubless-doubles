import {
    PLAYER_COUNT_MIN,
    PLAYER_COUNT_MAX,
    COURT_COUNT_MIN,
    COURT_COUNT_MAX,
    INITIAL_PLAYER_COUNT,
    INITIAL_COURT_COUNT,
} from "./constants.js";

import {
    currentPlayerCount,
    currentCourtCount,
    setCurrentPlayerCount,
    setCurrentCourtCount,
} from "./state.js";

import {
    initializePlayers,
} from "./players.js";

import {
    parseShareStateFromQuery,
    renderSharedMatches,
    renderSharePanel,
    shareCurrentLink,
} from "./share.js";

import {
    appendRangeOptions,
    createMatchItem,
    renderInitialMatches,
    addMatchItem,
} from "./ui.js";

import {
    openMatchModal,
    closeMatchModal,
    openMenuModal,
    closeMenuModal,
} from "./modal.js";

// ----------------------------
// DOM取得
// ----------------------------

const playerCountSelect = document.getElementById("player-count");
const courtCountSelect = document.getElementById("court-count");

const createButton = document.getElementById("create-button");

const titleScreen = document.getElementById("title-screen");
const appScreen = document.getElementById("app-screen");

const menuButton = document.getElementById("menu-button");
const resetButton = document.getElementById("reset-button");

const shareButton = document.getElementById("share-button");
const shareLinkButton = document.getElementById("share-link-button");

const addMatchButton = document.querySelector(".add-match-button");
const matchList = document.querySelector(".match-list");

const matchModal = document.getElementById("match-modal");
const matchModalTitle = document.getElementById("match-modal-title");
const matchModalBody = document.querySelector(".match-modal__body");
const matchModalBackdrop = document.querySelector(".match-modal__backdrop");
const matchModalPanel = document.querySelector(".match-modal__panel");

const menuModal = document.getElementById("menu-modal");
const menuSharePanel = document.getElementById("menu-share-panel");
const menuShareQr = document.getElementById("share-qrcode");
const menuModalBackdrop = menuModal.querySelector(".match-modal__backdrop");
const menuModalPanel = menuModal.querySelector(".match-modal__panel");

// ----------------------------
// 初期化
// ----------------------------

appendRangeOptions(
    playerCountSelect,
    PLAYER_COUNT_MIN,
    PLAYER_COUNT_MAX
);

appendRangeOptions(
    courtCountSelect,
    COURT_COUNT_MIN,
    COURT_COUNT_MAX
);

playerCountSelect.value = INITIAL_PLAYER_COUNT;
courtCountSelect.value = INITIAL_COURT_COUNT;

// ----------------------------
// イベント
// ----------------------------

createButton.addEventListener("click", () => {
    setCurrentPlayerCount(Number(playerCountSelect.value));
    setCurrentCourtCount(Number(courtCountSelect.value));

    initializePlayers(currentPlayerCount);

    renderInitialMatches(
        matchList,
        currentCourtCount,
        (matchData) =>
            createMatchItem(matchData, (item) =>
                openMatchModal(item, {
                    matchModal,
                    matchModalTitle,
                    matchModalBody,
                })
            )
    );

    titleScreen.hidden = true;
    appScreen.hidden = false;
    document.body.dataset.screen = "app";
});

addMatchButton.addEventListener("click", () => {
    addMatchItem(
        matchList,
        (matchData) =>
            createMatchItem(matchData, (item) =>
                openMatchModal(item, {
                    matchModal,
                    matchModalTitle,
                    matchModalBody,
                })
            )
    );
});

menuButton.addEventListener("click", () =>
    openMenuModal({
        menuModal,
        menuSharePanel,
        menuShareQr,
    })
);

resetButton.addEventListener("click", () => {
    initializePlayers(currentPlayerCount);

    renderInitialMatches(
        matchList,
        currentCourtCount,
        (matchData) =>
            createMatchItem(matchData, (item) =>
                openMatchModal(item, {
                    matchModal,
                    matchModalTitle,
                    matchModalBody,
                })
            )
    );
});

shareButton.addEventListener("click", () =>
    renderSharePanel(
        menuShareQr,
        menuSharePanel,
        matchList
    )
);

shareLinkButton.addEventListener("click", () =>
    shareCurrentLink(
        menuShareQr,
        menuSharePanel,
        matchList
    )
);

matchModalBackdrop.addEventListener("click", () =>
    closeMatchModal({
        matchModal,
        matchModalBody,
    })
);

matchModalPanel.addEventListener("click", (e) => e.stopPropagation());

menuModalBackdrop.addEventListener("click", () =>
    closeMenuModal({
        menuModal,
        menuSharePanel,
        menuShareQr,
    })
);

menuModalPanel.addEventListener("click", (e) => e.stopPropagation());

// ----------------------------
// 共有URLから復元
// ----------------------------

const sharedState = parseShareStateFromQuery();

if (sharedState) {
    document.body.dataset.screen = "app";

    setCurrentPlayerCount(sharedState.playerCount);
    setCurrentCourtCount(sharedState.courtCount);

    playerCountSelect.value = sharedState.playerCount;
    courtCountSelect.value = sharedState.courtCount;

    initializePlayers(sharedState.playerCount);

    if (sharedState.matches.length > 0) {
        renderSharedMatches(
            sharedState,
            matchList,
            (matchData) =>
                createMatchItem(matchData, (item) =>
                    openMatchModal(item, {
                        matchModal,
                        matchModalTitle,
                        matchModalBody,
                    })
                )
        );
    } else {
        renderInitialMatches(
            matchList,
            currentCourtCount,
            (matchData) =>
                createMatchItem(matchData, (item) =>
                    openMatchModal(item, {
                        matchModal,
                        matchModalTitle,
                        matchModalBody,
                    })
                )
        );
    }

    titleScreen.hidden = true;
    appScreen.hidden = false;
    document.body.dataset.screen = "app";
}