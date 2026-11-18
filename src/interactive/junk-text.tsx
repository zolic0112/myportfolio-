import type { ReactNode } from "react";
import type { Lang } from "@/lib/i18n";

// Every line of brain rot junk, in all four languages. These are jokes, so
// they are localised by hand, not translated: each language gets the same
// gag in the form its own internet would use (English spam-ad voice,
// Japanese ad copy, Spanish clickbait). Read with useT() from lib/useLang.

type R<V = ReactNode> = Record<Lang, V>;
type S = R<string>;

export const J = {
  // ---- shared
  close: { zh: "關閉", en: "Close", ja: "閉じる", es: "Cerrar" } as S,
  reallyClose: { zh: "真的關閉", en: "Really close", ja: "本当に閉じる", es: "Cerrar de verdad" } as S,
  ok: { zh: "確定", en: "OK", ja: "OK", es: "Aceptar" } as S,
  cancel: { zh: "取消", en: "Cancel", ja: "キャンセル", es: "Cancelar" } as S,
  verify: { zh: "驗證", en: "Verify", ja: "確認", es: "Verificar" } as S,
  ad: { zh: "廣告", en: "Ad", ja: "広告", es: "Anuncio" } as S,

  // ---- popup titles
  title: {
    prize: { zh: "🎉 恭喜!!!.exe", en: "🎉 WINNER!!!.exe", ja: "🎉 当選!!!.exe", es: "🎉 ¡¡¡GANASTE!!!.exe" },
    virus: { zh: "Windows 安全性警告", en: "Windows Security Alert", ja: "Windows セキュリティの警告", es: "Alerta de seguridad de Windows" },
    download: { zh: "下載中… 請勿關閉", en: "Downloading… do not close", ja: "ダウンロード中… 閉じないでください", es: "Descargando… no cerrar" },
    visitor: { zh: "★ 特別通知 ★", en: "★ SPECIAL NOTICE ★", ja: "★ 特別なお知らせ ★", es: "★ AVISO ESPECIAL ★" },
    multix: { zh: "廣告 廣告 廣告", en: "AD AD AD", ja: "広告 広告 広告", es: "ANUNCIO ANUNCIO" },
    premium: { zh: "💎 升級 Premium!!!", en: "💎 Go Premium!!!", ja: "💎 プレミアムにアップグレード!!!", es: "💎 ¡¡¡Hazte Premium!!!" },
    game: { zh: "🎮 玩完才能關", en: "🎮 Win to close", ja: "🎮 クリアするまで閉じられません", es: "🎮 Gana para cerrar" },
    gameNag: { zh: "不行!!先玩完!!", en: "NO!! Finish the game!!", ja: "ダメ!!先にクリアして!!", es: "¡¡NO!! ¡¡Termina el juego!!" },
    reels: { zh: "📱 短影音 — 再滑一下就好", en: "📱 Shorts — just one more", ja: "📱 ショート — あと1本だけ", es: "📱 Shorts — solo uno más" },
    meme: { zh: "funny.jpg.exe", en: "funny.jpg.exe", ja: "おもしろ.jpg.exe", es: "gracioso.jpg.exe" },
    ad: { zh: "贊助內容 · 廣告", en: "Sponsored · Ad", ja: "スポンサー · 広告", es: "Patrocinado · Anuncio" },
    cookie: { zh: "🍪 Cookie 設定", en: "🍪 Cookie settings", ja: "🍪 Cookie の設定", es: "🍪 Configuración de cookies" },
    captcha: { zh: "🤖 安全性驗證", en: "🤖 Security check", ja: "🤖 セキュリティ確認", es: "🤖 Verificación de seguridad" },
    aura: { zh: "🗿 Aura 測驗.exe", en: "🗿 Aura Test.exe", ja: "🗿 オーラ診断.exe", es: "🗿 Test de Aura.exe" },
    error: { zh: "狗.exe", en: "dog.exe", ja: "いぬ.exe", es: "perro.exe" },
  } satisfies Record<string, S>,

  // ---- prize
  prizeBig: { zh: "你中了 100 萬!!!", en: "YOU WON $1,000,000!!!", ja: "100万円 当選!!!", es: "¡¡¡GANASTE UN MILLÓN!!!" } as S,
  prizeText: {
    zh: "你是今天被選中的幸運兒 🎰 點下方按鈕立即領取 💰💰💰",
    en: "You are today's lucky visitor 🎰 Click below to claim your prize 💰💰💰",
    ja: "あなたが本日のラッキーな方です 🎰 下のボタンから今すぐ受け取り 💰💰💰",
    es: "Eres el visitante afortunado de hoy 🎰 Haz clic abajo para reclamar 💰💰💰",
  } as S,
  prizeBtn: { zh: "立即領取 $$$", en: "CLAIM NOW $$$", ja: "今すぐ受け取る $$$", es: "RECLAMAR YA $$$" } as S,
  countdown: { zh: "⏰ 限時領取", en: "⏰ Offer ends in", ja: "⏰ 受付終了まで", es: "⏰ La oferta termina en" } as S,

  // ---- virus
  virusText: {
    zh: <>偵測到 <b>3,721</b> 個病毒!你的電腦已經被 <b>brain rot</b> 感染。</>,
    en: <><b>3,721</b> viruses detected! Your computer is infected with <b>brain rot</b>.</>,
    ja: <><b>3,721</b> 個のウイルスを検出!お使いの PC は <b>brain rot</b> に感染しています。</>,
    es: <>¡Se detectaron <b>3.721</b> virus! Tu ordenador está infectado de <b>brain rot</b>.</>,
  } as R,
  virusFix: { zh: "立即清除", en: "Clean now", ja: "今すぐ駆除", es: "Limpiar ya" } as S,
  virusIgnore: { zh: "忽略", en: "Ignore", ja: "無視", es: "Ignorar" } as S,

  // ---- visitor
  visitorBig: { zh: "恭喜!!", en: "CONGRATS!!", ja: "おめでとう!!", es: "¡¡FELICIDADES!!" } as S,
  visitorText: {
    zh: (n: ReactNode) => <>你是第 {n} 位訪客</>,
    en: (n: ReactNode) => <>You are visitor number {n}</>,
    ja: (n: ReactNode) => <>あなたは {n} 人目の訪問者です</>,
    es: (n: ReactNode) => <>Eres el visitante número {n}</>,
  },
  visitorNote: { zh: "(每個人都是)", en: "(everyone is)", ja: "(全員そうです)", es: "(todos lo son)" } as S,
  visitorOk: { zh: "好喔", en: "Cool", ja: "はい", es: "Vale" } as S,

  // ---- download
  downloading: {
    zh: "正在下載 FREE_RAM_2026_真的.exe",
    en: "Downloading FREE_RAM_2026_REAL.exe",
    ja: "FREE_RAM_2026_本物.exe をダウンロード中",
    es: "Descargando RAM_GRATIS_2026_REAL.exe",
  } as S,
  timeLeft: {
    zh: (m: string) => `剩餘時間:${m}`,
    en: (m: string) => `Time remaining: ${m}`,
    ja: (m: string) => `残り時間:${m}`,
    es: (m: string) => `Tiempo restante: ${m}`,
  },
  minutes: {
    zh: (n: number) => `${n} 分鐘`,
    en: (n: number) => `${n} min`,
    ja: (n: number) => `${n} 分`,
    es: (n: number) => `${n} min`,
  },

  // ---- multi-x
  multixText: {
    zh: "辣妹在你附近 🔥 不對 是狗 🐶",
    en: "HOT SINGLES IN YOUR AREA 🔥 wait, it's a dog 🐶",
    ja: "近くに美女がいます 🔥 いや、犬です 🐶",
    es: "SOLTERAS CERCA DE TI 🔥 espera, es un perro 🐶",
  } as S,

  // ---- premium nag
  nagBig: { zh: "訂閱 Premium 即可免廣告!", en: "Go Premium, lose the ads!", ja: "プレミアムで広告なし!", es: "¡Hazte Premium y adiós anuncios!" } as S,
  nagText: {
    zh: "只要一杯咖啡 ☕ 彈窗通通消失(真的)",
    en: "Just one coffee ☕ and every popup is gone (for real)",
    ja: "コーヒー1杯 ☕ でポップアップが全部消えます(本当に)",
    es: "Solo un café ☕ y adiós a todas las ventanas (de verdad)",
  } as S,
  nagBtn: { zh: "💎 立即升級", en: "💎 Upgrade now", ja: "💎 今すぐアップグレード", es: "💎 Mejorar ahora" } as S,
  nagNo: {
    zh: ["不了,謝謝", "你確定?", "真的確定??", "好啦 😢"],
    en: ["No thanks", "Are you sure?", "Really sure??", "Fine 😢"],
    ja: ["いいえ、結構です", "本当に?", "本当に本当に??", "わかったよ 😢"],
    es: ["No, gracias", "¿Seguro?", "¿¿Segurísimo??", "Vale 😢"],
  } satisfies R<string[]>,

  // ---- video ad
  vadBig: {
    zh: <>設計師都在用的<br />神奇 AI 🤯</>,
    en: <>The AI every designer<br />is secretly using 🤯</>,
    ja: <>デザイナーが<br />こっそり使う神AI 🤯</>,
    es: <>La IA que todos los<br />diseñadores usan 🤯</>,
  } as R,
  vadSub: {
    zh: "一鍵生成作品集!!!不用設計!!!不用努力!!!",
    en: "One click, whole portfolio!!! No design!!! No effort!!!",
    ja: "ワンクリックでポートフォリオ完成!!!デザイン不要!!!努力も不要!!!",
    es: "¡¡¡Portafolio en un clic!!! ¡¡¡Sin diseño!!! ¡¡¡Sin esfuerzo!!!",
  } as S,
  vadCta: { zh: "了解詳情 ›", en: "Learn more ›", ja: "詳しくはこちら ›", es: "Más información ›" } as S,
  vadSound: { zh: "🔇 有聲廣告效果更好", en: "🔇 Ads are better with sound", ja: "🔇 音声ありの方が効果的です", es: "🔇 Los anuncios son mejores con sonido" } as S,
  vadWait: {
    zh: (n: number) => `${n} 秒後可略過廣告`,
    en: (n: number) => `Skip ad in ${n}`,
    ja: (n: number) => `${n} 秒後にスキップできます`,
    es: (n: number) => `Saltar anuncio en ${n}`,
  },
  vadSkip: { zh: "略過廣告 ⏭", en: "Skip ad ⏭", ja: "広告をスキップ ⏭", es: "Saltar anuncio ⏭" } as S,

  // ---- cookies
  cookieText: {
    zh: <>本網站與 <b>1,337</b> 個合作夥伴使用 🍪 餅乾來追蹤你的 aura、記住你看過幾次狗,以及提供你根本不需要的個人化體驗。</>,
    en: <>We and our <b>1,337</b> partners use 🍪 cookies to track your aura, count how many times you have seen the dog, and give you a personalised experience nobody asked for.</>,
    ja: <>当サイトと <b>1,337</b> 社のパートナーは 🍪 Cookie を使用して、あなたのオーラを追跡し、犬を見た回数を記録し、誰も頼んでいないパーソナライズ体験を提供します。</>,
    es: <>Nosotros y nuestros <b>1.337</b> socios usamos 🍪 cookies para rastrear tu aura, contar cuántas veces has visto al perro y darte una experiencia personalizada que nadie pidió.</>,
  } as R,
  cookieManage: { zh: "管理偏好設定", en: "Manage preferences", ja: "設定を管理", es: "Gestionar preferencias" } as S,
  cookieAcceptAll: { zh: "接受全部", en: "Accept all", ja: "すべて許可", es: "Aceptar todo" } as S,
  cookieAllAccept: { zh: "全部接受", en: "Accept ALL", ja: "全部許可", es: "Aceptar TODO" } as S,
  cookieKinds: {
    zh: ["必要的餅乾", "非常必要的餅乾", "追蹤你 aura 的餅乾", "狗想吃的餅乾"],
    en: ["Essential cookies", "Very essential cookies", "Aura tracking cookies", "Cookies the dog wants"],
    ja: ["必須 Cookie", "とても必須な Cookie", "オーラ追跡 Cookie", "犬が食べたい Cookie"],
    es: ["Cookies esenciales", "Cookies muy esenciales", "Cookies que rastrean tu aura", "Cookies que quiere el perro"],
  } satisfies R<string[]>,
  cookieLocked: { zh: "(以上皆無法關閉)", en: "(none of these can be turned off)", ja: "(いずれもオフにできません)", es: "(ninguna se puede desactivar)" } as S,
  cookieSave: { zh: "儲存偏好設定", en: "Save preferences", ja: "設定を保存", es: "Guardar preferencias" } as S,

  // ---- captcha (all dogs)
  capHead: {
    zh: <>選出所有包含<b>狗</b>的圖片</>,
    en: <>Select all images with <b>dogs</b></>,
    ja: <><b>犬</b>が写っている画像をすべて選択</>,
    es: <>Selecciona todas las imágenes con <b>perros</b></>,
  } as R,
  capSub: {
    zh: "如果沒有了,請按「驗證」",
    en: "If there are none left, click Verify",
    ja: "なければ「確認」をクリック",
    es: "Si no queda ninguna, haz clic en Verificar",
  } as S,
  capTooMany: { zh: "❌ 你選太多了。熱狗不是狗。", en: "❌ Too many. A hot dog is not a dog.", ja: "❌ 選びすぎです。ホットドッグは犬ではありません。", es: "❌ Demasiadas. Un perrito caliente no es un perro." } as S,
  capWrong: { zh: "❌ 選錯了。答案:全部都是狗(包括你)", en: "❌ Wrong. They are all dogs (including you).", ja: "❌ 不正解。答え:全部犬です(あなたも)", es: "❌ Incorrecto. Todos son perros (tú también)." } as S,
  capPass: { zh: "✅ 驗證失敗,但我們決定放過你", en: "✅ Verification failed, but we'll let you go", ja: "✅ 認証失敗。でも今回は見逃します", es: "✅ Verificación fallida, pero te dejamos pasar" } as S,

  // ---- aura quiz
  auraQ: {
    zh: "Q1 / 1:看到這個作品集,你的第一個反應是?",
    en: "Q1 / 1: What was your first reaction to this portfolio?",
    ja: "Q1 / 1:このポートフォリオを見た最初の感想は?",
    es: "P1 / 1: ¿Cuál fue tu primera reacción a este portafolio?",
  } as S,
  auraA: {
    zh: ["A. 哇 好讚", "B. 哇 好讚", "C. 哇 好讚!!!"],
    en: ["A. wow so good", "B. wow so good", "C. WOW SO GOOD!!!"],
    ja: ["A. すごい", "B. すごい", "C. すごい!!!"],
    es: ["A. guau qué bueno", "B. guau qué bueno", "C. ¡¡¡GUAU QUÉ BUENO!!!"],
  } satisfies R<string[]>,
  auraRes: {
    zh: <>恭喜你獲得 <b>Sigma 等級</b> 認證</>,
    en: <>You are officially <b>Sigma tier</b></>,
    ja: <><b>シグマ級</b>に認定されました</>,
    es: <>Eres oficialmente <b>nivel Sigma</b></>,
  } as R,
  auraNote: {
    zh: "(測驗結果僅供參考,但你真的很 sigma)",
    en: "(results for entertainment only, but you really are sigma)",
    ja: "(結果はあくまで参考です。でも本当にシグマです)",
    es: "(resultados solo de broma, pero sí eres muy sigma)",
  } as S,
  auraOk: { zh: "我知道我很 sigma", en: "I know I'm sigma", ja: "知ってる、シグマだから", es: "Ya sé que soy sigma" } as S,

  // ---- error cascade
  errText: {
    zh: <>狗.exe 已停止運作。<br /><small>錯誤代碼:0x00D06 — 狗跑出來了</small></>,
    en: <>dog.exe has stopped working.<br /><small>Error 0x00D06 — the dog got out</small></>,
    ja: <>いぬ.exe は動作を停止しました。<br /><small>エラー 0x00D06 — 犬が逃げました</small></>,
    es: <>perro.exe dejó de funcionar.<br /><small>Error 0x00D06 — el perro se escapó</small></>,
  } as R,

  // ---- mini-games
  whack: {
    zh: (h: number, n: number) => <><b>抓到狗 {n} 次</b>才能關閉這個視窗。({h}/{n})</>,
    en: (h: number, n: number) => <><b>Catch the dog {n} times</b> to close this window. ({h}/{n})</>,
    ja: (h: number, n: number) => <><b>犬を {n} 回つかまえる</b>とこのウィンドウを閉じられます。({h}/{n})</>,
    es: (h: number, n: number) => <><b>Atrapa al perro {n} veces</b> para cerrar esta ventana. ({h}/{n})</>,
  },
  dog: { zh: "狗", en: "Dog", ja: "犬", es: "Perro" } as S,
  robot: {
    zh: <><b>請證明你不是機器人:</b>選出所有的狗。</>,
    en: <><b>Prove you are not a robot:</b> pick every dog.</>,
    ja: <><b>ロボットでないことを証明してください:</b>犬をすべて選択。</>,
    es: <><b>Demuestra que no eres un robot:</b> elige todos los perros.</>,
  } as R,
  robotWrong: { zh: " 錯了,再來。", en: " Wrong, try again.", ja: " 違います、もう一度。", es: " Mal, otra vez." } as S,

  // ---- reels
  noVideos: { zh: "沒有影片。", en: "No videos.", ja: "動画がありません。", es: "No hay vídeos." } as S,
  prevVideo: { zh: "上一支", en: "Previous", ja: "前へ", es: "Anterior" } as S,
  nextVideo: { zh: "下一支", en: "Next", ja: "次へ", es: "Siguiente" } as S,
  share: { zh: "分享", en: "Share", ja: "共有", es: "Compartir" } as S,

  // ---- clippy
  clippyLabel: { zh: "小幫手", en: "Assistant", ja: "アシスタント", es: "Asistente" } as S,
  clippyAsk: {
    zh: "📎 看起來你正在瀏覽作品集,需要幫忙嗎?",
    en: "📎 It looks like you're browsing a portfolio. Need help?",
    ja: "📎 ポートフォリオを閲覧しているようです。お手伝いしましょうか?",
    es: "📎 Parece que estás viendo un portafolio. ¿Necesitas ayuda?",
  } as S,
  clippyCatch: { zh: "幫我把狗抓回來", en: "Catch the dog for me", ja: "犬をつかまえて", es: "Atrapa al perro por mí" } as S,
  clippyCatchReply: {
    zh: "自己抓 🙂 抓住狗、拖回這個籠子放開。",
    en: "Do it yourself 🙂 Grab the dog, drag it back to this cage, let go.",
    ja: "自分でどうぞ 🙂 犬をつかんで、このケージまで運んで離してください。",
    es: "Hazlo tú 🙂 Agarra al perro, arrástralo a esta jaula y suéltalo.",
  } as S,
  clippyMore: { zh: "我想要更多彈窗", en: "I want more popups", ja: "もっとポップアップがほしい", es: "Quiero más ventanas" } as S,
  clippyNo: { zh: "不用了", en: "No thanks", ja: "結構です", es: "No, gracias" } as S,
  clippyOk: { zh: "好", en: "OK", ja: "はい", es: "Vale" } as S,

  // ---- hatch, nav, tab bar, fx
  giveUp: { zh: "我放棄 😭", en: "I give up 😭", ja: "もう無理 😭", es: "Me rindo 😭" } as S,
  mute: { zh: "🔊 靜音", en: "🔊 Mute", ja: "🔊 ミュート", es: "🔊 Silenciar" } as S,
  unmute: { zh: "🔇 開聲音", en: "🔇 Sound on", ja: "🔇 音を出す", es: "🔇 Activar sonido" } as S,
  removeAds: { zh: "💎 去除廣告", en: "💎 Remove ads", ja: "💎 広告を消す", es: "💎 Quitar anuncios" } as S,
  fake: { zh: "假的!", en: "FAKE!", ja: "ニセモノ!", es: "¡FALSO!" } as S,

  // ---- burger ad before a game
  burgerBig: { zh: "🍔 超級漢堡 🍔", en: "🍔 MEGA BURGER 🍔", ja: "🍔 スーパーバーガー 🍔", es: "🍔 SÚPER BURGER 🍔" } as S,
  burgerText: {
    zh: "現在下載 App 第二個漢堡免費!!!(漢堡不存在)",
    en: "Download the app now, second burger FREE!!! (burger does not exist)",
    ja: "今アプリをダウンロードで2個目無料!!!(バーガーは存在しません)",
    es: "¡¡¡Descarga la app y la segunda burger GRATIS!!! (la burger no existe)",
  } as S,
  burgerWait: {
    zh: (n: number) => `${n} 秒後可略過`,
    en: (n: number) => `Skip in ${n}`,
    ja: (n: number) => `${n} 秒後にスキップ`,
    es: (n: number) => `Saltar en ${n}`,
  },
  burgerSkip: { zh: "略過廣告 ▶", en: "Skip ad ▶", ja: "広告をスキップ ▶", es: "Saltar anuncio ▶" } as S,

  // ---- premium window
  pmLabel: { zh: "Premium 訂閱", en: "Premium subscription", ja: "プレミアム登録", es: "Suscripción Premium" } as S,
  pmTitle: { zh: "💎 Space Dog Premium — 訂閱方案", en: "💎 Space Dog Premium — Plans", ja: "💎 Space Dog Premium — プラン", es: "💎 Space Dog Premium — Planes" } as S,
  pmHead: { zh: "訂閱即可免廣告", en: "Subscribe to remove ads", ja: "登録で広告なし", es: "Suscríbete y sin anuncios" } as S,
  pmPerks: {
    free: {
      zh: ["無限彈窗", "無限假叉叉", "狗"],
      en: ["Unlimited popups", "Unlimited fake ×s", "Dog"],
      ja: ["ポップアップ無制限", "ニセ×ボタン無制限", "犬"],
      es: ["Ventanas ilimitadas", "× falsas ilimitadas", "Perro"],
    },
    premium: {
      zh: ["彈窗永久消失", "狗", "作者會很開心"],
      en: ["Popups gone forever", "Dog", "Makes the author very happy"],
      ja: ["ポップアップが永久に消える", "犬", "作者がとても喜ぶ"],
      es: ["Adiós ventanas para siempre", "Perro", "El autor se pone muy feliz"],
    },
    ultra: {
      zh: ["內容跟 Premium 一樣", "但你會覺得自己比較有錢", "狗"],
      en: ["Exactly the same as Premium", "But you feel richer", "Dog"],
      ja: ["中身はプレミアムと同じ", "でもお金持ちな気分になれる", "犬"],
      es: ["Exactamente igual que Premium", "Pero te sientes más rico", "Perro"],
    },
  } satisfies Record<string, R<string[]>>,
  pmKeep: { zh: "維持現狀", en: "Stay free", ja: "このまま", es: "Seguir gratis" } as S,
  pmSub: { zh: "訂閱", en: "Subscribe", ja: "登録", es: "Suscribirse" } as S,
  pmPayHead: { zh: "選一個付款方式 ☕", en: "Pick a way to pay ☕", ja: "支払い方法を選択 ☕", es: "Elige cómo pagar ☕" } as S,
  pmPayTw: { zh: "🇹🇼 台灣 — 綠界", en: "🇹🇼 Taiwan — ECPay", ja: "🇹🇼 台湾 — ECPay", es: "🇹🇼 Taiwán — ECPay" } as S,
  pmNoPay: { zh: "我不想付錢", en: "I don't want to pay", ja: "払いたくない", es: "No quiero pagar" } as S,
  pmPaidQ: {
    zh: "付好了嗎?(信任制,我們不會檢查)",
    en: "Paid? (honour system, we won't check)",
    ja: "支払いましたか?(自己申告制、確認はしません)",
    es: "¿Ya pagaste? (confiamos en ti, no lo comprobamos)",
  } as S,
  pmNoLinks: {
    zh: "(作者還沒設定贊助連結,所以你也付不了)",
    en: "(the author hasn't set up payment links yet, so you can't pay anyway)",
    ja: "(作者がまだ支払いリンクを設定していないので、払えません)",
    es: "(el autor aún no ha puesto enlaces de pago, así que tampoco puedes)",
  } as S,
  pmPaid: { zh: "付好了 ✅", en: "Paid ✅", ja: "支払いました ✅", es: "Pagado ✅" } as S,
  pmLied: { zh: "其實沒付,但我想要免廣告", en: "Didn't pay, but I want no ads", ja: "払ってないけど広告は消したい", es: "No pagué, pero quiero sin anuncios" } as S,
  pmMine: { zh: "⭐ 我的訂閱", en: "⭐ My subscription", ja: "⭐ 登録情報", es: "⭐ Mi suscripción" } as S,
  pmPlan: { zh: "方案:彈窗永久消失", en: "Plan: popups gone forever", ja: "プラン:ポップアップ永久消去", es: "Plan: adiós ventanas para siempre" } as S,
  pmStatus: {
    zh: "狀態:有效 ✅ · 下次扣款:永遠不會",
    en: "Status: active ✅ · Next charge: never",
    ja: "状態:有効 ✅ · 次回請求:なし(永遠に)",
    es: "Estado: activo ✅ · Próximo cobro: nunca",
  } as S,
  pmStayRich: { zh: "繼續當有錢人", en: "Stay rich", ja: "お金持ちのままでいる", es: "Seguir siendo rico" } as S,
  pmCancel: { zh: "取消訂閱", en: "Cancel subscription", ja: "登録を解除", es: "Cancelar suscripción" } as S,
  pmSure: { zh: "確定要取消嗎??", en: "Are you sure??", ja: "本当に解除しますか??", es: "¿¿Seguro??" } as S,
  pmSureText: {
    zh: "取消後所有彈窗、假叉叉、迴紋針小幫手都會回來 😈",
    en: "Every popup, fake × and the paperclip will come back 😈",
    ja: "ポップアップもニセ×もクリップのアシスタントも全部戻ってきます 😈",
    es: "Volverán todas las ventanas, las × falsas y el clip 😈",
  } as S,
  pmDogHappy: { zh: "(狗會很開心)", en: "(the dog will be thrilled)", ja: "(犬は大喜び)", es: "(el perro estará feliz)" } as S,
  pmYes: { zh: "確定取消,我想念廣告", en: "Yes, I miss the ads", ja: "解除する、広告が恋しい", es: "Sí, extraño los anuncios" } as S,
  pmNever: { zh: "算了", en: "Never mind", ja: "やめておく", es: "Mejor no" } as S,
  pmBye: { zh: "已取消訂閱", en: "Subscription cancelled", ja: "登録を解除しました", es: "Suscripción cancelada" } as S,
  pmBack: { zh: "廣告正在回來的路上…… 📢📢📢", en: "The ads are on their way back… 📢📢📢", ja: "広告が戻ってきています…… 📢📢📢", es: "Los anuncios vienen de camino… 📢📢📢" } as S,
  pmThanks: { zh: "感謝訂閱 🎉", en: "Thanks for subscribing 🎉", ja: "ご登録ありがとう 🎉", es: "Gracias por suscribirte 🎉" } as S,
  pmValid: {
    zh: "有效期限:永遠(存在這個瀏覽器裡)",
    en: "Valid: forever (in this browser)",
    ja: "有効期限:永遠(このブラウザ内で)",
    es: "Válido: para siempre (en este navegador)",
  } as S,
  pmGone: {
    zh: "彈窗已全部消失 ✨ 你現在是很有錢的人 ✨",
    en: "All popups gone ✨ You are a very rich person now ✨",
    ja: "ポップアップは全部消えました ✨ あなたは今お金持ちです ✨",
    es: "Adiós a todas las ventanas ✨ Ahora eres una persona muy rica ✨",
  } as S,
};
