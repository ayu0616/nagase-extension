const createElementFromHTML = (html: string) => {
	const tempEl = document.createElement("div");
	tempEl.innerHTML = html;
	const elem = tempEl.firstElementChild;
	if (elem) {
		return elem;
	} else {
		throw Error("要素の作成に失敗しました");
	}
};

const pushScoreButtons = () => {
	const buttons = <HTMLButtonElement[]>[...document.querySelectorAll("#paper-field > div:last-child > table > tbody > tr:not(.jss182) > td:nth-child(10) > div > button:not(:disabled)")];
	buttons.forEach((value, index) => {
		// 最大8個までしか開かない
		if (index < 8) {
			value.click();
		}
	});
};

/**拡張機能で追加したボタン類を置く場所 */
const extensionContainer = document.createElement("div");
extensionContainer.classList.add("extension-container");
document.getElementById("root")?.children[0].after(extensionContainer);

const buttonContainer = document.createElement("div");
/**ボタン置き場を作成 */
const createButtonContainer = () => {
	buttonContainer.style.display = "flex";
	// const container = document.querySelector("#paper-field");
	// container?.prepend(buttonContainer);
	extensionContainer.append(buttonContainer);
};

/**点数入力欄を表示するボタンを連打（PDFの読み込みを並列処理させて高速化することが目的） */
const createPushButton = () => {
	const pushButtonElem = <HTMLButtonElement>createElementFromHTML("<button class='renda-button'>点数入力欄を連打</button>");
	pushButtonElem.addEventListener("click", pushScoreButtons);
	buttonContainer?.prepend(pushButtonElem);
};

/**点数入力欄でEnterを押すと点数を送信する */
const autoSubmitScore = () => {
	const scoreInputElems = <HTMLInputElement[]>[...document.querySelectorAll("#adornment-score-0")];
	scoreInputElems.forEach((elem) => (elem.autocomplete = "off"));
	const dialogContainers = <HTMLDivElement[]>[...document.querySelectorAll("div[role='dialog']")];
	// const submitButtons = <HTMLButtonElement[]>[...document.querySelectorAll('button[data-test="submit-button"]')];
	// const cancelButton = <HTMLButtonElement>document.querySelector('button[data-test="cancel-button"]');
	dialogContainers.forEach(async (dialogContainer, i) => {
		if (scoreInputElems[i].value) {
			const submitButton = <HTMLButtonElement>dialogContainer.querySelector('button[data-test="submit-button"]');
			submitButton.click();
			await sleep(100);
			dialogContainer.style.display = "none";
		}
	});
};
document.onkeydown = (e) => {
	if (e.key === "Enter") {
		autoSubmitScore();
	}
};

/**送信済みの答案を表示しないボタン */
const createHideButton = () => {
	const buttonTexts = ["送信済みを非表示", "送信済みを表示"];
	const display = ["", "none"];
	let isDisplayNone = false;
	const hideButtonElem = <HTMLButtonElement>createElementFromHTML("<button class='hide-button'>" + buttonTexts[0] + "</button>");
	hideButtonElem.addEventListener("click", () => {
		isDisplayNone = !isDisplayNone;
		window.addEventListener("click", () => {
			const tr = <HTMLElement[]>[...document.querySelectorAll("div#paper-field tr")];
			const submittedTr = tr.filter((elem) => window.getComputedStyle(elem, null).getPropertyValue("background-color") == "rgb(200, 230, 201)");
			submittedTr.forEach((value) => {
				value.style.display = display[Number(isDisplayNone)];
				const checkbox = value.children[0].querySelector("input");
				checkbox ? (checkbox.disabled = isDisplayNone) : 0;
			});
			hideButtonElem.innerText = buttonTexts[Number(isDisplayNone)];
		});
	});
	buttonContainer?.prepend(hideButtonElem);
};

/**表からデータを取得 */
const getTableData = () => {
	const tb = document.querySelector("tbody"); //答案が載っている表
	const trList = tb?.children;
	if (!trList) return [];
	// 各答案のデータを格納
	const datas = [...trList].map((tr) => {
		const texts = <string[]>tr.querySelector("td:nth-child(6)")?.innerHTML.split(" ");
		const yearMatch = <RegExpMatchArray>texts[1].match(/[0-9]{4}/);
		return {
			elem: <HTMLElement>tr,
			univName: texts[0],
			year: yearMatch[0],
			subject: texts[2],
			questionNum: texts[3],
		};
	});
	return datas;
};

/**答案のtrを検索 */
const queryTr = (as_id: string) => {
	const trList = [...document.querySelectorAll("tbody > tr")];
	const tr = <HTMLTableRowElement | undefined>trList.find((tr) => tr.children[3].innerHTML === as_id);
	return tr;
};

type Datas = {
	as_id: string;
	univName: string;
	year: string;
	subject: string;
	questionNum: string;
}[];

/**fetchで答案のデータを取得 */
const fetchData = async () => {
	const token = localStorage.getItem("CognitoIdentityServiceProvider.5c61idqvmdv797l9t913d1l1td.team169.idToken");
	const headers = {
		Authorization: "Bearer " + token,
	};
	const data: { outline: string; as_id: string }[] = await fetch("https://production-apprunner-api.toshin-correction.com/sheets/assigned", {
		headers: headers,
	}).then((res) => res.json());
	const datas: Datas = data.map((d) => {
		const texts = d.outline.split(" ");
		const yearMatch = <RegExpMatchArray>texts[1].match(/[0-9]{4}/);
		return {
			as_id: d.as_id,
			univName: texts[0],
			year: yearMatch[0],
			subject: texts[2],
			questionNum: texts[3],
		};
	});
	localStorage.setItem("tableData", JSON.stringify(datas));
	return datas;
};

/**現在選択している選択肢を取得 */
const getCurrentValues = () => {
	const selectByUnivElem = <HTMLSelectElement>document.getElementById("by-univ-name");
	const selectByYearElem = <HTMLSelectElement>document.getElementById("by-year");
	return {
		univName: selectByUnivElem.value,
		year: selectByYearElem.value,
	};
};

const getDataFromLocal = () => {
	const tableDataString = localStorage.getItem("tableData");
	let datas: Datas;
	if (tableDataString) {
		datas = JSON.parse(tableDataString);
	} else {
		return;
	}
	return datas;
};

const showSearchResult = () => {
	const currentValue = getCurrentValues();
	const datas = getDataFromLocal();
	datas?.forEach((data) => {
		const tr = queryTr(data.as_id);
		if (tr) {
			if (currentValue.univName === "default" && currentValue.year === "default") {
				tr.style.backgroundColor = "";
			} else if (["default", data.univName].includes(currentValue.univName) && ["default", data.year].includes(currentValue.year)) {
				tr.style.backgroundColor = "pink";
				document.querySelector("tbody")?.prepend(tr);
			} else {
				tr.style.backgroundColor = "";
			}
		}
	});
};

const isPairExists = (datas: Datas, univName: string, year: string) => {
	const datasUnivFiltered = datas.filter((data) => data.univName === univName);
	const years = datasUnivFiltered.map((data) => data.year);
	return years.includes(year);
};

const setSearchOptions = () => {
	const currentValue = getCurrentValues();
	const datas = getDataFromLocal();
	if (!datas) {
		return;
	}
	const selectByUnivElem = <HTMLSelectElement>document.getElementById("by-univ-name");
	const univOptions = <HTMLOptionElement[]>[...selectByUnivElem.children];
	univOptions.forEach((option) => {
		if (option.value === "default" || currentValue.year === "default" || isPairExists(datas, option.value, currentValue.year)) {
			option.style.display = "";
		} else {
			option.style.display = "none";
		}
	});

	const selectByYearElem = <HTMLSelectElement>document.getElementById("by-year");
	const yearOptions = <HTMLOptionElement[]>[...selectByYearElem.children];
	yearOptions.forEach((option) => {
		if (option.value === "default" || currentValue.univName === "default" || isPairExists(datas, currentValue.univName, option.value)) {
			option.style.display = "";
		} else {
			option.style.display = "none";
		}
	});
};

const selectOnChange = () => {
	setSearchOptions();
	showSearchResult();
	scrollToTop();
};

/**検索機能を追加 */
const search = async () => {
	// 検索欄を表示
	const searchContainerId = "search-container";
	const prevSearchContainer = document.querySelector("#" + searchContainerId);
	if (prevSearchContainer) {
		prevSearchContainer.remove();
	}
	const searchContainer = document.createElement("div");
	searchContainer.id = searchContainerId;
	// const container = document.querySelector("#paper-field");
	// container?.prepend(searchContainer);
	extensionContainer.append(searchContainer);

	const datas = getDataFromLocal();

	// 大学名検索
	const selectByUnivElem = document.createElement("select");
	selectByUnivElem.id = "by-univ-name";
	const defaultUnivOptionValue = "大学名で検索";
	const defaultUnivOptionElem = document.createElement("option");
	defaultUnivOptionElem.value = "default";
	defaultUnivOptionElem.innerText = defaultUnivOptionValue;
	selectByUnivElem.appendChild(defaultUnivOptionElem);
	searchContainer.appendChild(selectByUnivElem);
	const univNames = new Set(datas?.map((data) => data.univName));
	[...univNames].sort().forEach((name) => {
		const optionElem = document.createElement("option");
		optionElem.value = name;
		optionElem.innerText = name;
		selectByUnivElem.appendChild(optionElem);
	});
	selectByUnivElem.onchange = selectOnChange;

	// 年度検索
	const selectByYearElem = document.createElement("select");
	selectByYearElem.id = "by-year";
	const defaultYearOptionValue = "年度で検索";
	const defaultYearOptionElem = document.createElement("option");
	defaultYearOptionElem.value = "default";
	defaultYearOptionElem.innerText = defaultYearOptionValue;
	selectByYearElem.appendChild(defaultYearOptionElem);
	searchContainer.appendChild(selectByYearElem);
	const years = [...new Set(datas?.map((data) => data.year))].sort();
	years.forEach((year) => {
		const optionElem = document.createElement("option");
		optionElem.value = year;
		optionElem.innerText = year;
		selectByYearElem.appendChild(optionElem);
	});
	selectByYearElem.onchange = selectOnChange;

	const changeEvent = new Event("change");
	// 前の年ボタン
	const prevYearButton = document.createElement("button");
	prevYearButton.innerText = "前の年";
	searchContainer.appendChild(prevYearButton);
	prevYearButton.onclick = () => {
		const currentValue = selectByYearElem.value;
		const values = [...selectByYearElem.querySelectorAll("option")].filter((elem) => elem.style.display != "none").map((elem) => elem.value);
		const currentValueIndex = values.indexOf(currentValue);
		const prevValue = values[currentValueIndex - 1];
		if (prevValue) {
			selectByYearElem.value = prevValue;
			selectByYearElem.dispatchEvent(changeEvent);
		}
	};
	// 次の年ボタン
	const nextYearButton = document.createElement("button");
	nextYearButton.innerText = "次の年";
	searchContainer.appendChild(nextYearButton);
	nextYearButton.onclick = () => {
		const currentValue = selectByYearElem.value;
		const values = [...selectByYearElem.querySelectorAll("option")].filter((elem) => elem.style.display != "none").map((elem) => elem.value);
		const currentValueIndex = values.indexOf(currentValue);
		const nextValue = values[currentValueIndex + 1];
		if (nextValue) {
			selectByYearElem.value = nextValue;
			selectByYearElem.dispatchEvent(changeEvent);
		}
	};

	// リセットボタン
	const resetButton = document.createElement("button");
	resetButton.innerText = "リセット";
	searchContainer.appendChild(resetButton);
	resetButton.onclick = () => {
		[selectByUnivElem, selectByYearElem].forEach((elem) => (elem.value = "default"));
		selectOnChange();
	};
};

/**左右ボタンをクリックするとページ移動できる */
const moveByArrowButton = () => {
	window.onkeydown = (e) => {
		let button: HTMLButtonElement | null;
		if (e.key === "ArrowRight") {
			button = document.querySelector('button[data-test="next-btn"]');
		} else if (e.key === "ArrowLeft") {
			button = document.querySelector('button[data-test="previous-btn"]');
		} else {
			button = null;
		}
		if (button) {
			button.click();
			showSearchResult();
		}
	};
};

let controlDownFlag = false;
window.addEventListener("keydown", (e) => {
	if (e.key == "Control") {
		controlDownFlag = true;
	}
});
window.addEventListener("keyup", (e) => {
	if (e.key == "Control") {
		controlDownFlag = false;
	}
});
/**読み取ったテキストから点数を取得 */
const scoreFromText = (text: string) => {
	const matches = text.matchAll(/[0-9]+\/[0-9]+/g);
	let score = 0;
	let maxManten = 0;
	for (let match of matches) {
		const scores = match[0].split("/").map(Number);
		if (scores[1] > maxManten) {
			score = scores[0];
			maxManten = scores[1];
		}
	}
	return score.toString();
};
/**PDFを読み取って自動でスコアを入力 */
const fillScore = () => {
	const dialogContainers = <HTMLDivElement[]>[...document.querySelectorAll("div[role='dialog']")];
	dialogContainers.forEach((container) => {
		const pdfObjectElem = container.querySelector("object");
		const inputElem = container.querySelector("input");
		if (!(pdfObjectElem && inputElem)) return; // 両方が揃っていないときは何もしない

		const baseUrl = "https://ocr-pdf-aoikkwpjkq-uc.a.run.app?url=";
		const pdfUrl = encodeURIComponent(pdfObjectElem.data);
		fetch(baseUrl + pdfUrl)
			.then((res) => res.text())
			.then((txt) => {
				inputElem.value = scoreFromText(txt);
			});
	});
};
window.addEventListener("keydown", (e) => {
	if (controlDownFlag && e.key == "f") {
		// fillScore(); // スコアを入力
		// autoSubmitScore(); // スコアを送信
	}
});

const doMain = () => {
	fetchData().then(() => search());
	createButtonContainer();
	createPushButton();
	createHideButton();
	search();
	moveByArrowButton();
};

(() => {
	doMain();
})();
