import {
    activeMatchItem,
    setActiveMatchItem,
} from "./state.js";

import {
    setMatchState,
} from "./match.js";

export function openMatchModal(
    matchItem,
    {
        matchModal,
        matchModalTitle,
        matchModalBody,
    }
) {
    setActiveMatchItem(matchItem);

    const currentState = matchItem.dataset.state;
    const isResultState =
        currentState === "started" ||
        currentState === "red" ||
        currentState === "blue";

    matchModalTitle.textContent =
        isResultState ? "勝者報告" : "試合設定";

    matchModalBody.replaceChildren();

    if (isResultState) {
        const buttonRow = document.createElement("div");
        buttonRow.className = "match-modal__button-row";

        const redButton = document.createElement("button");
        redButton.type = "button";
        redButton.textContent = "赤";
        redButton.addEventListener("click", () => {
            setMatchState(activeMatchItem, "red");
            closeMatchModal({
                matchModal,
                matchModalBody,
            });
        });

        const blueButton = document.createElement("button");
        blueButton.type = "button";
        blueButton.textContent = "青";
        blueButton.addEventListener("click", () => {
            setMatchState(activeMatchItem, "blue");
            closeMatchModal({
                matchModal,
                matchModalBody,
            });
        });

        buttonRow.append(redButton, blueButton);
        matchModalBody.append(buttonRow);
    } else {
        const startButton = document.createElement("button");

        startButton.type = "button";
        startButton.textContent = "対戦開始";

        startButton.addEventListener("click", () => {
            setMatchState(activeMatchItem, "started");
            closeMatchModal({
                matchModal,
                matchModalBody,
            });
        });

        matchModalBody.append(startButton);
    }

    matchModal.hidden = false;
}

export function closeMatchModal({
    matchModal,
    matchModalBody,
}) {
    matchModal.hidden = true;
    matchModalBody.replaceChildren();

    setActiveMatchItem(null);
}

export function openMenuModal({
    menuModal,
    menuSharePanel,
    menuShareQr,
}) {
    menuSharePanel.hidden = true;
    menuShareQr.replaceChildren();
    menuModal.hidden = false;
}

export function closeMenuModal({
    menuModal,
    menuSharePanel,
    menuShareQr,
}) {
    menuModal.hidden = true;
    menuSharePanel.hidden = true;
    menuShareQr.replaceChildren();
}