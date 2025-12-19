// おしゃれな時計の更新処理
export function initializeClock() {
  function updateClock() {
    const now = new Date();

    // 時間の更新
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (hoursEl) hoursEl.textContent = hours;
    if (minutesEl) minutesEl.textContent = minutes;
    if (secondsEl) secondsEl.textContent = seconds;

    // 日付の更新
    const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dayOfWeek = days[now.getDay()];

    const dateInfoEl = document.getElementById('date-info');
    if (dateInfoEl) {
      dateInfoEl.textContent = `${year}年${month}月${date}日 ${dayOfWeek}`;
    }
  }

  // 初回実行と1秒ごとの更新
  updateClock();
  setInterval(updateClock, 1000);
}

// DOMContentLoadedとturbo:loadで自動実行
function initClockIfExists() {
  if (document.getElementById('stylish-clock')) {
    initializeClock();
  }
}

document.addEventListener('DOMContentLoaded', initClockIfExists);
document.addEventListener('turbo:load', initClockIfExists);
