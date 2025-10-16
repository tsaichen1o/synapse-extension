// src/content/content.ts
// 這個腳本會被注入到目標網頁中，用來抓取頁面內容

// 我們可以透過 runtime 訊息來觸發它
// 但目前 getPageContent() 已經直接在背景執行了
// 所以這裡只需要定義它，讓它存在即可。

// 你可以把 getPageContent 裡面的 function 內容直接放到這裡
// 然後從 background.js 中呼叫 chrome.scripting.executeScript
// 讓這個 content script 執行

console.log("Synapse Content Script Loaded!");