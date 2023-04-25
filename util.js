"use strict";
const sleep = (msec) => {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(0);
        }, msec);
    });
};
const scrollToTop = () => {
    if (window.scrollY != 0)
        window.scroll({ top: 0, behavior: "smooth" });
};
const savePDF = () => { };
