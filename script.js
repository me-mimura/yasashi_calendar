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

const calendarsheet     = document.getElementByld("calendar-sheet");
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
            const vernalEquinox = Math.floor(20.8431 + 0.242194 * (year - 1980) - 
        Math.floor((year - 1980) / 4));
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
            holidays[respectDay] = getNthMonday(3);
                holidays[respectDay] = "敬老の日";
                // 秋分の日（簡易計算式: 1980~2099年対応）
                const autumnEquinox = Math.floor(23.2488 + 0.242194 * (year - 1980) - 
            Math.floor((year - 1980) / 4));
            holidays[autumsEquinox] = "秋分の日";
            
            // 
        }
    }
}