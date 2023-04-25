"use strict";
let shiftFlag = false;
const setShiftFlag = (bool) => {
    shiftFlag = bool;
};
window.addEventListener("keydown", (e) => {
    // 部分点を与える画面でEnterを押したときに「配置」ボタンを押させる
    if (e.key == "Enter") {
        const katenButton = document.getElementById("place_katenyoso");
        if (katenButton) {
            katenButton.click();
            return;
        }
        const gentenButton = document.getElementById("place_gentenyoso");
        if (gentenButton) {
            gentenButton.click();
            return;
        }
    }
    if (e.key == "Escape") {
        const katenCancelButton = document.getElementById("cancel_katenyoso");
        if (katenCancelButton) {
            katenCancelButton.click();
            return;
        }
        const gentenCancelButton = document.getElementById("cancel_gentenyoso");
        if (gentenCancelButton) {
            gentenCancelButton.click();
            return;
        }
    }
    if (e.key == "Shift") {
        setShiftFlag(true);
    }
    // if (shiftFlag && e.key == "p") {
    // 	// document.getElementById("savePDF")?.click();
    // 	savePDF();
    // }
    // if (shiftFlag && e.key == "o") {
    // 	document.getElementById("saveTemp")?.click();
    // }
});
window.addEventListener("keyup", (e) => {
    if (e.key == "Shift") {
        setShiftFlag(false);
    }
});
