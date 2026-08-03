import {
    PLAYER_COUNT_MIN,
    COURT_COUNT_MIN,
    INITIAL_PLAYER_COUNT,
    INITIAL_COURT_COUNT,
    SHARE_QUERY_KEY,
} from "./constants.js";

import {
    currentPlayerCount,
    currentCourtCount,
    currentShareUrl,
    setCurrentShareUrl,
} from "./state.js";

import {
    getPlayerLookup,
} from "./players.js";

import {
    getMatchLabel,
    serializeMatchRecord,
    createMatchFromRecord,
} from "./match.js";

export function buildSharePayload(matchList) {
    const lines = [
        `player_count=${currentPlayerCount}`,
        `court_count=${currentCourtCount}`,
    ];

    matchList.querySelectorAll(".match-item").forEach((matchItem) => {
        lines.push(serializeMatchRecord(matchItem.matchData));
    });

    return lines.join("\n");
}

export function buildShareUrl(matchList) {
    const shareUrl = new URL(window.location.href);

    shareUrl.search = "";
    shareUrl.searchParams.set(
        SHARE_QUERY_KEY,
        buildSharePayload(matchList)
    );

    return shareUrl.toString();
}

export function parseShareStateFromQuery() {
    const queryValue =
        new URLSearchParams(window.location.search).get(SHARE_QUERY_KEY);

    if (!queryValue) {
        return null;
    }

    const parsedState = {
        playerCount: null,
        courtCount: null,
        matches: [],
    };

    const rows = queryValue
        .split(/\r?\n/)
        .map((row) => row.trim())
        .filter(Boolean);

    rows.forEach((row) => {
        if (row.includes("=")) {
            const [key, rawValue] = row.split("=");
            const value = Number(rawValue);

            if (
                key === "player_count" &&
                Number.isInteger(value) &&
                value >= PLAYER_COUNT_MIN
            ) {
                parsedState.playerCount = value;
            }

            if (
                key === "court_count" &&
                Number.isInteger(value) &&
                value >= COURT_COUNT_MIN
            ) {
                parsedState.courtCount = value;
            }

            return;
        }

        const [
            redOne,
            redTwo,
            blueOne,
            blueTwo,
            stateCode = "i",
        ] = row.split(",").map((part) => part.trim());

        if (!redOne || !redTwo || !blueOne || !blueTwo) {
            return;
        }

        parsedState.matches.push({
            redIds: [redOne, redTwo],
            blueIds: [blueOne, blueTwo],
            stateCode,
        });
    });

    const highestPlayerId = parsedState.matches.reduce(
        (highestId, matchRecord) => {
            const allIds = [
                ...matchRecord.redIds,
                ...matchRecord.blueIds,
            ]
                .map(Number)
                .filter(Number.isFinite);

            return Math.max(highestId, ...allIds, 0);
        },
        0
    );

    parsedState.playerCount =
        parsedState.playerCount ??
        Math.max(highestPlayerId, INITIAL_PLAYER_COUNT);

    parsedState.courtCount =
        parsedState.courtCount ?? INITIAL_COURT_COUNT;

    return parsedState;
}

export function renderSharedMatches(
    sharedState,
    matchList,
    createMatchItem
) {
    matchList.replaceChildren();

    const playerLookup = getPlayerLookup();

    sharedState.matches.forEach((matchRecord, matchIndex) => {
        const matchData = createMatchFromRecord(
            matchRecord,
            matchIndex,
            sharedState.courtCount,
            playerLookup
        );

        if (matchData) {
            matchList.append(createMatchItem(matchData));
        }
    });
}

export function renderSharePanel(menuShareQr, menuSharePanel, matchList) {
    setCurrentShareUrl(buildShareUrl(matchList));

    menuShareQr.replaceChildren();

    if (typeof QRCode === "function") {
        new QRCode(menuShareQr, {
            text: currentShareUrl,
            width: 224,
            height: 224,
            colorDark: "#101418",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M,
        });
    }

    menuSharePanel.hidden = false;
}

export async function shareCurrentLink(
    menuShareQr,
    menuSharePanel,
    matchList
) {
    if (!currentShareUrl) {
        renderSharePanel(
            menuShareQr,
            menuSharePanel,
            matchList
        );
    }

    try {
        if (navigator.share) {
            await navigator.share({
                title: "ダブラズダブルス",
                text: "ダブラズダブルスの共有リンク",
                url: currentShareUrl,
            });

            return;
        }

        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(currentShareUrl);
        }
    } catch (error) {
        console.error(error);
    }
}