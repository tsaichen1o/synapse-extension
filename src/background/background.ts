// Background script for Chrome extension
// Handles the click on the extension icon to open the side panel

// 當使用者點擊工具列上的擴充功能圖示時
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
    // 啟用側邊欄功能
    if (tab.id) {
        chrome.sidePanel.open({ tabId: tab.id });
    }
});