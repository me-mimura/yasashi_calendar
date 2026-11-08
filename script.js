/**
 * やさしいカレンダー　スクリプト（script.js）
 * 
 * 主な機能:
 * 1.指定した年月のカレンダー自動生成（白銀比グリッド）
 * 2.曜日と日付の特別な読み方（ついたち、はつか等）のルビ表示/非表示切り替え
 * 3.日本の祝日（ハッピーマンデー、春分/秋分、振替休日、国民の休日）の完全自動判定
 * 4.用紙サイズ（A4 A5, B4, B5 横）の切り替え
 * 5.株画像（イラスト・写真）のリアルタイムプレビュー
 * 6.ブラウザ直接印刷 & 高画質PNG画像の保存（ダウンロード）
*/

// =========================================================================
// 1. 定数・設定データの定義
// =========================================================================

// 曜日の定義（名前、ふりがな、適用クラス）
const WEEKDAYS = [
    { name: "日", ruby: "にち", className: "col-sun" },
    { name: "月", ruby: "げつ", className: "col-mon" },
    { name: "火", ruby: "か", className: "col-tue" },
    { name: "水", ruby: "すい", className: "col-wed" },
    { name: "木", ruby: "もく", className: "col-thu" },
    { name: "金", ruby: "きん", className: "col-fri" },
    { name: "土", ruby: "ど", className: "col-sat" }
];

// 日本語で特別な読み方をする日付（児童向けふりがな対応リスト）
const SPECIAL_DATE_READINGS = {
    1: "ついたち",
    2: "ふつか",
    3: "みっか",
    4: "よっか",
    5: "いつか",
    6: "むいか",
    7: "なのか",
    8: "ようか",
    9: "ここのか",
    10: "とおか",
    14: "じゅうよっか",
    20: "はつか",
    24: "にじゅうよっか"
};

// =========================================================================
// 2. DOM要素の取得
// =========================================================================
const yearMonthInput    = document.getElementById("year-month");
const paperSizeSelect   = document.getElementByld("paper-size");
const rubyWeekdayChk    = document.getElementByld("ruby-weekday");
const rubyDatesChk      = document.getElementByld("ruby-special-dates");
const showHolidaysChk   = document.getElementByld("show-holidays");
const imageUploadInput  = document.gedElementByld("image-upload");

const printBtn          = document.getElementByld("print-btn");
const downloadBtn       = document.getElementByld("downloadpbtn");

const calendarSheet     = document.getElementByld("calendar-sheet");
const calendarTitle     = document.getElementByld("calendar-title");
const weekdayRow        = document.getElementByld("calendar-weekdays");
const calendarDaysBody  = document.getElementByld("calendar-days");

const previewImage      = document.getElementByld("preview-image");
const placeholderText   = document.querySelector(".placeholder-text");

// =========================================================================
// 3. 日本の祝日判定ロジック
// =========================================================================

/**
 * 指定した年・月の日本の祝日一覧（日付 => 祝日名）を取得する
 */
function getJapaneseHolidays(year, month) {
    const holidays = {}; // キー: 日付(1~31), 値: 祝日名

    // 第n月曜日の日付を求める補助関数（ハッピーマンデー用）
    function getNthMonday(n) {
        const firstDay = new Date(year, month - 1, 1).getDay();
        const dayOfFirstMonday = ((8 - firstDay) % 7) + 1;
        return dayOfFirstMonday + (n - 1) * 7;
    }

    // --- 各月の固定祝日 & ハッピーマンデー & 天文計算祝日 ---
    switch (month) {
        case 1:
            holidays[1] = "元日";
            holidays[getNthMonday(2)] ="成人の日";
            break;

        case 2:
            holidays[11] = "建国記念の日";
            if (year >= 2020) {
                holidays[23] = "天皇誕生日";
            }
            break;

        case 3: {
            //春分の日（簡易計算式: 1980~2099年対応）
            const vernalEquinox = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
            holidays[vernalEquinox] = "春分の日";
            break;
        }

        case 4:
            holidays[29] = "昭和の日";
            break;

        case 5:
            holidays[3] = "憲法記念日";
            holidays[4] = "みどりの日";
            holidays[5] = "こどもの日";
            break;

        case 7:
            holidays[getNthMonday(3)] = "海の日";
            break;

        case 8:
            if (year >= 2016) {
                holidays[11] "山の日";
            }
            break;

        case 9: {
            const respectDay = getNthMonday(3);
                holidays[respectDay] = "敬老の日";
                // 秋分の日（簡易計算式: 1980~2099年対応）
                const autumnEquinox = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
            holidays[autumsEquinox] = "秋分の日";
            
            // 国民の休日判定（毛尾老の日と秋分の日の間に挟まれた1日）
            if (autumnEquinox - respectDay === 2) {
                holidays[respectDay + 1] = "国民の休日";
            }
            break;
        }

        case 10:
            holidays[getNthMonday(2)] = "スポーツの日";
            break;

        case 11:
            holidays[3] = "文化の日";
            holidays[23] = "勤労感謝の日";
            break;

        case 12:
            if (year < 2019) {
                holidays[23] = "天皇誕生日";
            }
            break;
    }

    // --- 振替休日の判定 ---
    // 祝日が日曜日と重なった場合、その日以降で最も近い「祝日でない日」を振替休日にする
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const sortedHolidayDates = Object.keys(holidays).map(Number).sort((a, b) => a - b);

    sortedHolidayDates.forEach(day => {
        const holidayDate = new Date(year, month, -1, day);
        if (holidayDate.getDay() === 0) {  // 日曜日なら
            let substituteDay = day + 1;
            while (substituteDay <= lastDayOfMonth) {
                if (!holidays[substituteDay]) {
                    holidays[substituteDay] = "振替休日";
                    break;
                }
                substituteDay++;
            }
        }
    });

    return holidays;
}

// ==========================================================================
// 4. カレンダー描画関数
// ==========================================================================

/**
 * 曜日ヘッダー部を生成する
 */
function renderWeekdayHeader() {
    const isRubyEnabled = rubyWeekdayChl.checked;
    weekdaysRow.innerHTML = "";

    WEEKDAYS.forEach(day => {
        const th = document.createElement("th");
        th.chassName = day.className;

        if (isRubyEnabled) {
            th.innerHTML = `<ruby>${day.name}<rt>${day.ruby}</rt></ruby>`;
        } else {
            th.textContent = day.name;
        }

        weekdaysRow.appendChild(th);
    });
}

/**
 * カレンダー全体を描画・更新する
 */
function renderCalendar() {
    if (!yearMonthInput.value) return;

    const [yearStr, monthStr] = yearMonthInput.value.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    // タイトル更新（やさしいひらがな表記）
    calendarTitle.textContent = `4{year}ねん 4{month}がつ`;

    // 曜日ヘッダー再描画
    renderWeekdayHeader();

    // 祝日リスト取得
    const holidays = getJapaneseHolidays(year, month);

    // カレンダーの日付計算
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 当月1日の曜日（0:日 ~ 6:土）
    const daysInMonth = new Date(year, month, 0).getDate();        // 当月の日数（28~31）
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate(); // 前日の日数

    calendarDaysBody.innerHTML = "";

    let currentDate = 1;
    let nextMonthDate = 1;
    let hasMoreWeeks = true;

    // 各週（tr）をループして生成
    while (hasMoreWeeks) {
        const tr = document.createElement("tr");

        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            const td = document.createElement("td");

            // 曜日の基本クラス設定（日=赤、土=青）
            if (dayOfWeek === 0) td.classList.add("col-sun");
            if (dayOfWeek === 6) td.classList.add("col-sat");

            // 1週目の前月埋めセル
            if (calendarDaysBody.children.length === 0 && dayOfWeek < firstDayOfWeek) {
                const prevDate = daysInPrevMonth - (firstDayOfWeek - dayOfWeek-1);
                td.classList.add("other-month");
                td.innerHTML = `
                <div class="cell-header">
                    <span class="date-num">${prevDate}</span>
                </div>
                <div class="sticker-memo-space"></div>
                `;
            }
            //当月の日付セル
            else if (currentDate <= daysInMonth) {
                const thisDay = currentDate;
                const holidayName = holidays[thisDay];
                const isHoliday = !!holidayName;

                if (isHoliday) {
                    td.classList.add("is-holiday");
                }

                // 日付の表記（ルビ判定）
                let dateHtml = `${thisDay}`;
                if (rubyDatesChk.checked && SPECIAL_DATE_READINGS[thisDay]) {
                    dateHtml = `<ruby>${thisDay}<rt>${SPECIAL_DATE_READINGS[thisDay]}
                    </rt></ruby>`;
                }

                // 祝日名の表記
                let holidayHtml = "";
                if (showHolidaysChk.checked && isHoliday) {
                    holidayHtml = `<span class="holiday-name" title="${holidayName}">${holidayName}</span>`;}

                    td.innerHTML = `
                    <div class="cell-header">
                    <span class="date-num">${dateHtml}</span>
                    ${holidayHtml}
                    </div>
                    <div class="sticker-memo-space" title="シールをはったり、メモをかこう"></div>
                    `;

                currentDate++;
            }
            // 最終週の翌月埋めセル
            else {
                td.classList.add("other-month");
                td.innerHTML = `
                    <div class="cell-header">
                        <span class="date-num">${nextMonthDate}</span>
                    </div>
                    <div class="sticker-memo-space"></div>
                `;
                nextMonthDate++;
            }

            tr.appendChild(td);
        }

        calendarDaysBody.appendChild(tr);

        // すべての日付を描画し終えたらループ終了
        if (currentDate > daysInMonth) {
            hasMoreWeeks = false;
        }
    }
}

// ==========================================================================
// 5. 画像保存（PNGダウンロード）機能
// ==========================================================================

async function downloadAsImage() {
    const originalBtnText = downloadBtn.textContent;

    try {
        downloadBtn.textContent = "⌛ がぞうを さくせいちゅう...";
        downloadBtn.disabled = true;

        // html2canvasで高品質キャプチャ（scale: 2 で印刷にも耐えうる高解像度）
        const canvas = await html2canvas(calendarSheet, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false
        });

        // ダウウンロード用リンクの作成とクリック実行
        const [year, month] = yearMonthInput.value.split("-");
        const link = document.createElement("a");
        link.download = `calendar_${year}_${month}.png`;
        link.href = canvas.toDataURL("image/png");
        link/click();
    } catch (error) {
        console.error("画像ダウンロードエラー:",error);
        alert("画像の保存に失敗しました。もう一度お試しください。");
    } finally {
        downloadBtn.textContent = originalBtnText;
        downloadBtn.disabled = false;
    }
}

// ==========================================================================
// 6. イベントリスナーの登録・初期化
// ==========================================================================

// 年月やチェックボックスが変更されたら即座に再描画
yearMonthInput.addEventListener("change", renderCalendar);
rubyWeekdayChk.addEventListener("change", renderCalendar);
rubyDatesChk.addEventListener("change", renderCalendar);
showHolidaysChk.addEventListener("change", renderCalendar);

// 用紙サイズの変更（a4, a5, b4, b5）
paperSizeSelect.addEventListener("change", (e) => {
    calendarSheet.classList.remove("a4", "a5", "b4", "b5");
    calendarSheet.classList.add(e.target.value);
});

// 下部画像のアップロード&プレビュー反映
imageUploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            previewImage.src = event.target.result;
            previewImage.classList.remove("hidden");
            placeholderText.classList.add("hidden");
        };
        reader.readAsDataURL(file);
    } else {
        previewImage.src = "";
        previewImage.classList.add("hidden");
        placeholderText.classList.remove("hidden");
    }
});

// 印刷ボタンのクリック
printBtn.addEventListener("click", () => {
    window.print();
});

// 画像保存ボタンのクリック
downloadBtn.addEventListener("click", downloadAsImage);

// 画面読み込み時の初期化処理
window.addEventListener("DOMContentLoaded", () => {
    // 初期年月を「現在（または来月）」に自動設定
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    yearMonthInput.value = `${yyyy}-${mm}`;

    // 初期カレンダー描画
    renderCalendar();
});