"use strict";
const to_tensaku_screen = (file_name_of_toan) => {
    const url = "/tensaku/" + file_name_of_toan;
    window.open(url);
};
const getToanTr = () => {
    const toanElems = [...document.querySelectorAll("tr#tr_of_toan")];
    return toanElems;
};
const getToanDatas = () => {
    const toanElems = getToanTr();
    const toanDatas = toanElems.map((elem) => {
        const fileName = elem.querySelector("td.td_of_toan_name")?.innerHTML;
        const status = elem.querySelector("td.td_of_toan_status")?.innerHTML;
        const button = elem.querySelector("td.td_of_tensaku_button")?.querySelector("button");
        return {
            fileName: fileName,
            status: status,
            button: button,
            opened: false,
        };
    });
    return toanDatas;
};
let toanDatas;
(() => (toanDatas = getToanDatas()))();
const setAttributes = (elem, attrs) => {
    Object.entries(attrs).forEach((value) => {
        elem.setAttribute(value[0], value[1]);
    });
};
// 各答案の添削画面を別ウィンドウで表示
const openTensakuWindow = async () => {
    const numOfToanInput = document.getElementById("num-of-toan");
    const numOfToan = Number(numOfToanInput.value);
    const notOpenedToans = toanDatas.filter((data) => data.status == "未添削" && !data.opened);
    for (let i = 0; i < numOfToan; i++) {
        const url = "/tensaku/" + notOpenedToans[i].fileName;
        window.open(url);
        notOpenedToans[i].opened = true;
        await sleep(3000);
    }
};
(() => {
    const buttonClusterFrame = document.querySelector("div#botton_cluster_flame");
    const openButtonFrame = document.createElement("div");
    buttonClusterFrame.append(openButtonFrame);
    const numOfToanInput = document.createElement("input");
    const defaultNumValue = 10;
    setAttributes(numOfToanInput, {
        id: "num-of-toan",
        type: "number",
        value: defaultNumValue,
        style: "width: 4rem",
        min: 0,
        max: toanDatas.filter((data) => data.status == "未添削" && !data.opened).length,
    });
    openButtonFrame.append(numOfToanInput);
    const openButton = document.createElement("button");
    openButton.innerText = "答案を一括表示";
    setAttributes(openButton, {
        id: "open-button",
    });
    openButton.onclick = openTensakuWindow;
    openButtonFrame.append(openButton);
})();
