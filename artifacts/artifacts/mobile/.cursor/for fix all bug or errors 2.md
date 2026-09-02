🔒 GUESSAi — QA FIX PASS 2 (LOBBY + 3 NEW GAMES)

وضعیت مأموریت

QA کامل لابی و سه بازی جدید (Speed Card / Count Quick / Lost Item) توسط ۸ ممیز موازی انجام شد.
همه‌ی موارد این فایل CONFIRMED هستند و هرکدام مرجع `file:line` دارند.
این مأموریت برای ساخت Feature جدید نیست. فقط رفع همین باگ‌هاست.

پروژه: `c:\guess-Ai\guess-Ai\artifacts\artifacts\mobile`
API لایو: `https://guess-ai-4sqt.onrender.com`

---

⛔ STRICT RULES

به هیچ عنوان:
• Feature جدید، Game جدید، UI جدید، Economy جدید نساز.
• گیم‌پلی Blur / Speed Card / Count Quick / Lost Item را تغییر نده مگر برای رفع مستقیم یکی از باگ‌های همین فایل.
• Engine موازی نساز. Wallet / XP / Level / Stamina / Reward فقط از Master Engine.
• Difficulty فقط Easy / Medium / Hard. بازی‌های جدید فقط ۵ سؤال.
• قیمت جم، سطح آنلاک، پاداش هفتگی، و اسلات‌های ۱۹–۲۵ را اختراع نکن.
• Fallback خاموش نساز و هیچ خطایی را به‌عنوان موفقیت نشمار.
• فایل یا سیستم سالم را بازنویسی نکن.
• برای هر باگ حداقل تغییر لازم را بزن.

اگر رفع یک مورد نیازمند تصمیم محصولی است (عدد اقتصاد، متن، مدت اشتراک)، آن را اجرا نکن؛ در گزارش زیر عنوان `NEEDS PRODUCT DECISION` بیاور.

---

PRIORITY 1 — NATIVE CRASH AFTER PLAY + REWARD LOSS (SHIP BLOCKER)

مشکل
`notificationService.scheduleLocalNotification` فقط روی استاب وب تعریف شده است. روی iOS/Android وجود ندارد.
Store آن را داخل `set()` صدا می‌زند: سطح‌آپ، تکمیل مأموریت، آنلاک دستاورد.
نتیجه روی نیتیو: `TypeError: scheduleLocalNotification is not a function` و سقوط صفحه نتیجه از طریق ErrorBoundary.

مراجع
• `store/userStore.ts:454` (level-up در `addXP`)
• `store/userStore.ts:754` (mission complete)
• `store/userStore.ts:895` (achievement unlock)
• `services/NotificationService.native.ts:297-312` (بدون این متد)
• `services/NotificationService.ts:66` (استاب وب)
• `app/result.tsx:122`, `220`, `233` (بدون try/catch)

مشکل دوم — پاداش گم می‌شود
`app/result.tsx:115` شناسه سشن را به `grantedResultSessions` اضافه می‌کند **قبل از** `addXP` در خط `122`.
اگر throw رخ دهد، XP و مأموریت و دستاورد آن سشن اعمال نمی‌شود و دیگر هم retry نمی‌شود.

وظیفه
• نیتیو باید همان قرارداد وب را داشته باشد یا Store باید از مسیر موجود نیتیو استفاده کند (`fireAchievementCompleted` روی نیتیو موجود و بی‌استفاده است: `services/NotificationService.native.ts:162-175`).
• اعلان نباید هرگز مسیر پاداش را بشکند.
• ترتیب در `app/result.tsx` طوری شود که علامت‌گذاری سشن بعد از اعمال موفق پاداش انجام شود.

Acceptance
یک راند کامل روی نیتیو با سطح‌آپ و یک مأموریت تکمیل‌شده بدون کرش تمام شود و پاداش کامل ثبت شود.

---

PRIORITY 2 — XP / WALLET ZEROING (SHIP BLOCKER)

مشکل ۱ — هیدریت با صفر
`typeof x === 'number'` مقدار `0` را معتبر می‌گیرد، پس داکیومنت ابری صفر، مقدار محلی را پاک می‌کند.
• `store/userStore.ts:344-345` (coins / gems)
• `store/userStore.ts:351` (level)
• `store/userStore.ts:377` (energy)
• `hooks/useFirestoreSync.ts:70-77` (بدون انتظار برای persist)
توجه: خود XP در `store/userStore.ts:346-350` با `Math.max` محافظت شده است. مسیر خرابی XP مورد بعدی است.

مشکل ۲ — persist بعد از hydrate
گیت `hasHydrated` / `onRehydrateStorage` وجود ندارد. `merge` برابر `{ ...currentState, ...persisted }` است (`store/userStore.ts:1207-1209`)، پس `xp: 0` ذخیره‌شده می‌تواند XP ابری را جایگزین کند و بعد `hooks/useFirestoreSync.ts:82-91` همان صفر را آپلود کند.

وظیفه
• برای مقادیر عددی، صفرِ ریموت نباید مقدار محلی بزرگ‌تر را کاهش دهد مگر عمداً.
• قبل از اولین نوشتن ابری باید هیدریت کامل شده باشد.
• قانون موجود XP (`Math.max`) الگوی درست است؛ همان را گسترش بده، منطق جدید موازی نساز.

Acceptance
با یک حساب دارای XP/سکه، هیچ مسیر cold-start / sync ای نباید مقدار را به صفر برساند یا صفر را به Firestore بنویسد.

---

PRIORITY 3 — SPEED CARD (SLOT 16)

مشکل ۱ — هر ۵ ضربه برد است
`finishRound('complete')` فقط ۵/۵ را `perfect` می‌کند و بقیه را `win`، حتی ۰/۵.
سپس `endSession` برای هر `win`/`perfect` هم `FINISH` و هم `LEVEL_COMPLETE` می‌فرستد.
• `games/speed-card/SpeedCardScreen.tsx:122-126`
• `store/gameStore.ts:306-311`
اصلاح: نتیجه‌ی راند باید بر اساس عملکرد واقعی تعیین شود، نه صرفِ تمام‌شدن ۵ کارت. رویدادهای پاداش نباید برای راند شکست‌خورده صادر شوند.

مشکل ۲ — تایم‌اوت GAME OVER است، نه TIME’S UP
`endSession({ applyFinish: false, sessionOutcome: 'lose' })` باعث می‌شود عنوان نتیجه `GAME OVER` شود و `TIME’S UP` هرگز دیده نشود.
• `games/speed-card/SpeedCardScreen.tsx:119-120`
• `app/result.tsx:321-329`

مشکل ۳ — تایمر آخرین ضربه را می‌دزدد
تایمر در فاز `flash` هم تیک می‌زند. اگر ساعت وسط فلش ۵۰۰ms آخر صفر شود، `finishRound('timeout')` برنده می‌شود و `endedRef` مسیر complete را می‌بندد؛ FINISH و LEVEL_COMPLETE حذف می‌شوند.
• `games/speed-card/SpeedCardScreen.tsx:225-231`, `308-322`

مشکل ۴ — Fallback خاموش در کلاینت
در `__DEV__` شکست fetch راند محلی می‌سازد و ادامه می‌دهد. پروداکشن درست rethrow می‌کند.
• `games/speed-card/engine.ts:166-171`
اصلاح: مسیر توسعه هم نباید شکست را «موفق» جا بزند؛ حداقل باید صراحتاً به‌عنوان راند آفلاین/توسعه علامت بخورد و UI خطا را ببیند.

مشکل ۵ — Fallback خاموش در سرور لایو
بعد از دو تلاش ناموفق، `generateSpeedCardRound` هنوز `buildSpeedCardRoundFromPalette()` را با HTTP 200 برمی‌گرداند و کلاینت آن را راند واقعی می‌گیرد.
• `artifacts/api-server/src/services/ai/speedCardRound.ts:86-114` (fallback در `111-114`)
• `artifacts/api-server/src/routes/ai.ts:149-153`
اصلاح: شکست تولید راند نباید ۲۰۰ باشد. قرارداد API را بی‌دلیل تغییر نده؛ فقط وضعیت خطا صادق شود.
اگر Deploy روی Render قابل تأیید نیست، گزارش کن: `NOT VERIFIED — REQUIRES RENDER DEPLOYMENT`.

مشکل ۶ — Difficulty ارسال می‌شود ولی محتوای راند را عوض نمی‌کند
کلاینت `toGameplayDifficulty(difficulty)` می‌فرستد و سرور آن را parse می‌کند، اما فقط همان کلمه داخل یک prompt یکسان درج می‌شود و fallback پالت اصلاً difficulty را نمی‌بیند.
• `games/speed-card/engine.ts:157`
• `artifacts/api-server/src/services/ai/speedCardRound.ts:15-18`, `20-31`, `72-84`
• `artifacts/api-server/src/routes/ai.ts:151-152`
• سمت کلاینت difficulty فقط زمان نمایش را عوض می‌کند: `games/speed-card/config.ts:7-11`, `games/speed-card/engine.ts:20-22`
اصلاح: تفاوت مکانیکی واقعی بین Easy و Hard از مسیر Game Config موجود. عدد جدید اقتصادی اختراع نکن.
نکته: `parseSpeedCardDifficulty` مقدار ناشناخته را بی‌صدا `medium` می‌کند (`speedCardRound.ts:15-18`).

مشکل ۷ — Ready→No استamina اضافه برمی‌گرداند
استamina در Play دسته کسر می‌شود و `startSession` برای Speed Card رد می‌شود؛ سشن با اولین Ready Yes شروع می‌شود. اما Ready No همیشه `addStamina(STAMINA_PER_GAME)` می‌زند بدون بررسی اینکه این تلاش واقعاً پرداخت شده باشد. بعد از Restart پرداخت‌شده با تبلیغ یا پاس، بازیکن ۱۰ استamina نگرفته را می‌گیرد.
• `app/category-select.tsx:76-89`
• `games/speed-card/SpeedCardScreen.tsx:284-288`, `291-294`, `343-351`, `365-378`
• `store/gameStore.ts:339-344`
همچنین برگشت سخت‌افزاری در شمارش معکوس هیچ مسیر بازگشتی ندارد (`BackHandler` نیست).

مشکل ۸ — Pause Restart درخواست در پرواز را لغو نمی‌کند
`dealRound` توکن نسل / abort ندارد. Pause در فاز `loading` در دسترس است. Restart کارت‌های محلی را پاک می‌کند ولی `fetchLock` را آزاد نمی‌کند و `setPhase('reveal')` دیررس را نادیده نمی‌گیرد؛ راند کهنه می‌تواند روی سشن جدید بنشیند و Ready را رد کند.
• `games/speed-card/SpeedCardScreen.tsx:142-182`, `325-340`
الگوی درست موجود: `genRef` در Lost Item.

---

PRIORITY 4 — COUNT QUICK (SLOT 17)

مشکل ۱ — Perfect با معیار Blur سنجیده می‌شود
راند کامل `sessionOutcome = 'perfect'` می‌سازد و نتیجه PERFECT نشان می‌دهد، اما اعتبار مأموریت و دستاورد فقط وقتی صادر می‌شود که `totalQuestions === GAME_CONSTANTS.TOTAL_QUESTIONS` (۲۰) باشد. Count Quick هرگز ۲۰ سؤال ندارد.
• `games/count-quick/CountQuickScreen.tsx:117-118`
• `app/result.tsx:138-140`, `179`
• `constants/achievements.ts:67-70` (`perfect-game`)
• `constants/missions.ts:111-114` (`m_perfect`)
• `games/count-quick/config.ts:5`, `store/gameStore.ts:190-191`
اصلاح: Perfect باید Game-aware باشد و از Config/Metadata بازی بخواند. Hardcode پراکنده نساز. متن دستاورد/مأموریت اگر باید عوض شود، `NEEDS PRODUCT DECISION` بزن.
توجه: همین ایراد Speed Card 5/5 را هم پوشش می‌دهد.

مشکل ۲ — خوانایی پالت Forest
رمپ سبز پشت‌سرهم روی بورد بنفش تیره، شکل‌ها فقط fill و بدون stroke.
• `games/count-quick/config.ts:58-61`
• `games/count-quick/shapes.tsx:27-32` (و بقیه‌ی شکل‌های fill-only)
• `games/count-quick/CountQuickScreen.tsx:376-388`, `theme/colors.ts:8`
سخت‌ترین جفت‌ها: `#2D6A4F` / `#40916C` / `#52B788`.
اصلاح: فقط Contrast و Readability همین پالت. طراحی کلی بازی را تغییر نده.

مشکل ۳ — Share روی وب کار نمی‌کند
`navigator.share` از روی `navigator` جدا و unbound صدا زده می‌شود؛ Illegal invocation. `try/catch` کرش را می‌گیرد ولی اشتراک هرگز موفق نمی‌شود و لغو کاربر (`AbortError`) هم پیام «Could not share» می‌دهد.
• `app/result.tsx:270-273`, `280-281`
اصلاح: bind درست، تشخیص پشتیبانی، و جدا کردن لغو کاربر از خطا.

مورد جانبی
خروج به لابی از Count Quick هنوز `resetGame()` بدون `endSession` است (`games/count-quick/CountQuickScreen.tsx:101-107`). با PRIORITY 5 مورد ۲ یکجا حل شود.

---

PRIORITY 5 — LOST ITEM (SLOT 18)

قرارداد لایو تصاویر درست است و دیگر بلاکر نیست.
`POST /api/images` با `editPrompt` + ۴ `optionPrompts` پاسخ ۲۰۰ با کلیدهای `url`, `provider`, `editedUrl`, `optionUrls` (طول ۴) می‌دهد. ادعای قدیمی `{url, provider}` کهنه است. این را دوباره «فیکس» نکن.

مشکل ۱ — ساعت قبل از دیده‌شدن تصویر شروع می‌شود
`phase` به `look` / `answer` می‌رود و `remainingMs` به‌محض ساخته‌شدن آبجکت سؤال شروع می‌شود. `<Image>` هیچ `onLoad` ندارد. صحنه در فاز `dark` mount نیست و صحنه‌ی ناقص + ۴ بندانگشتی فقط در `answer` mount می‌شوند. روی Hard بودجه ۲٫۵ ثانیه است، پس زمان decode از بازیکن کم می‌شود و تایم‌اوت `submit(false)` می‌زند.
• `games/lost-item/LostItemScreen.tsx:141-142`, `167-169`, `207-211`, `221-228`, `237-240`, `242-243`, `371`, `398-400`
• `games/lost-item/config.ts:16`

مشکل ۲ — برگشت سیستم سشن پرداخت‌شده را رها می‌کند
برگشت داخل برنامه فقط Pause را باز می‌کند. `BackHandler` / `beforeRemove` وجود ندارد و ژست‌های Stack پیش‌فرض‌اند. Play از `router.replace` استفاده می‌کند، پس برگشت سخت‌افزاری/سوایپ/مرورگر بازی را pop می‌کند. Unmount فقط `genRef.current += 1` می‌زند؛ `endSession` / `resetGame` / `exitToLobby` اجرا نمی‌شوند و `gameSession` زنده می‌ماند در حالی که استamina خرج شده است.
• `games/lost-item/LostItemScreen.tsx:95-101`, `202-204`, `319`
• `app/category-select.tsx:76-88`, `99`
• `app/_layout.tsx:179`
• `components/PauseMenu.tsx:16`

مشکل ۳ — Pause پنجره‌ی بازخورد ۱ ثانیه‌ای را فریز نمی‌کند
ساعت‌های look/dark/answer به `paused` احترام می‌گذارند ولی تایم‌اوت بازخورد نه. Pause یا Restart وسط پنجره‌ی Correct/Wrong باز هم `afterAnswer()` را اجرا می‌کند: راند می‌تواند زیر منوی Pause تمام شود، یا اگر `index` کهنه آخرین باشد، سشن تازه‌ی `restartSession` را `finish('win')` کند.
• `games/lost-item/LostItemScreen.tsx:213-218`, `247-250`

---

PRIORITY 6 — LOBBY HITBOXES & ROUTING

۱. AdMob زیر Shop و Friends دفن شده است. z-index بر اساس مساحت است، پس جعبه‌های کوچک‌تر بالا می‌آیند و فقط نوار وسط (~۴۳٫۳٪–۵۳٫۶٪) واقعاً تبلیغ استamina را اجرا می‌کند.
• `app/lobby.tsx:541-547` (AdMob), `567-574` (Shop), `557-565` (Friends), `745-746` (z-order)

۲. Legendary بالای Leaderboard را می‌دزدد و به فروشگاه می‌برد (تقریباً تمام عرض و ~۴۲٪ ارتفاع بالایی).
• `app/lobby.tsx:520-529`, `575-583`, `346-348`

۳. Gem Pack یک نوار باریک بالای Achievements را می‌دزدد (~۰٫۵۹٪ همپوشانی عمودی).
• `app/lobby.tsx:530-538`, `548-556`

۴. نقاشی پایه‌ی آواتار روی Play می‌افتد. مستطیل‌ها همپوشانی ندارند، ولی `iconScale: 5` با `overflow: "visible"` و `pointerEvents="none"` باعث می‌شود ضربه روی پایه به Play بیفتد.
• `app/lobby.tsx:493-510`, `947-951`, `998-1002`

۵. درصدهای نامعتبر در جدول هیت‌باکس. `parseFloat` در نقطه‌ی دوم متوقف می‌شود، پس `55.8.58%` می‌شود `55.8%`.
• `app/lobby.tsx:476` (`"63.5.00%"`), `496` (`"55.8.58%"`), `551` (`"85.6.00%"`), `569`, `578` (`"78.5.00%"`)
• مصرف‌کننده: `app/lobby.tsx:735-738`

۶. سوییچ دیباگ در بیلد پروداکشن. «Caliper Debug Mode» همیشه mount است و هیت‌باکس‌ها را رنگ می‌کند.
• `app/lobby.tsx:136`, `851-869`, `760-776`
• همین نشتی در پروفایل: `app/profile.tsx:183-190` («Profile Grid Align»)

۷. گیت نام مستعار فقط سه اکشن را می‌بندد؛ Shop / Spin / Leaderboard / Friends / Settings / Achievements / Profile / Stamina / level-select بدون نام باز می‌شوند.
• `app/lobby.tsx:279`
• `app/_layout.tsx:38-44`, `70-77`

۸. رفتار overflow روی وب سخت نشده است. لابی نسخه‌ی اصلاح‌نشده‌ی Shop است.
• `app/lobby.tsx:947-951`, `998-1002`, `435-480`
• الگوی درست موجود: `components/ShopHotspot.tsx:69`, `85`

۹. لابی روی `PhoneStage` نیست. `contentFit="cover"` روی کل ویوپورت، پس روی پنجره‌ی عریض وب نقاشی و Pressableها از هم جدا می‌شوند.
• `components/PhoneStage.tsx:10-15` (هیچ importکننده‌ای ندارد)
• `app/lobby.tsx:676-681`

قفل‌های سالم — دست نزن
Extra Hard / Max قفل‌اند (`app/level-select.tsx:59-78`, `131`, `88-98`, `157`). Next همان `isDifficultyOpen` را چک می‌کند. مسیر دسته‌های ۱۶/۱۷/۱۸ درست است (`app/category-select.tsx:91-98`). Splash overlay ضربه نمی‌دزدد (`app/lobby.tsx:717-718`). هر id یک `performAction` واقعی دارد.

---

PRIORITY 7 — STAMINA / ADS / DAILY REWARD

۱. سقف تبلیغ استamina ۵ است ولی مشخصات ۳. یعنی ۵۰ استamina در روز به‌جای ۳۰. ثابتِ مشخصات بی‌استفاده مانده است.
• `constants/economy.ts:113-115`, `152`
• `app/lobby.tsx:176-179`, `205-208`
• `store/adStore.ts:179-191`
• هشدار: `shared/masterArchitecture.smoke.ts:52-62` همین ۵ را assert می‌کند. عدد نهایی `NEEDS PRODUCT DECISION` است؛ بدون تأیید تغییرش نده و اگر تغییر کرد، تست را هم به‌روز کن.

۲. پاس Ad-Free روی دکمه‌ی لابی نادیده گرفته می‌شود. `isAdFreePassActive` انتخاب شده و مصرف نمی‌شود؛ دارنده‌ی پاس هم ویدیو می‌بیند هم یک اسلات روزانه می‌سوزاند.
• `app/lobby.tsx:168`, `202-217`
• `store/adStore.ts:14-16` در برابر `store/adStore.ts:145`
• رفتار درست موجود: `app/game.tsx:194`, `app/result.tsx:217-225`

۳. تبلیغ وب پروداکشن همیشه شکست می‌خورد. دکمه‌ی AdMob لابی روی وب هرگز استamina نمی‌دهد.
• `services/AdService.ts:30-37`
• `app/lobby.tsx:217-230`

۴. بن‌بست تبلیغ نیتیو. Promise هیچ timeout ندارد و فقط با `CLOSED` یا `ERROR` resolve می‌شود؛ اگر load برنگردد، `adInFlight` برای همیشه true می‌ماند و اسلات رزروشده آزاد نمی‌شود.
• `services/AdService.native.ts:46-54`, `94-120`
• `app/lobby.tsx:203`, `213-222`

۵. ساعت جایزه‌ی روزانه دوگانه است. گیت Store با `getTodayUTCString()` و UI با `isToday` محلی. در یک پنجره Claim فعال می‌ماند و صفر می‌دهد؛ در پنجره‌ی معکوس «Already Claimed» نشان می‌دهد در حالی که Store اجازه می‌دهد.
• `utils/index.ts:83-96`
• `store/userStore.ts:603-627`
• `app/lobby.tsx:249`, `843`
• `app/daily-reward.tsx:20`

۶. پاپ‌آپ اولین نشست بعد از ثبت نام اجرا نمی‌شود. `isNicknameVerifiedFor` یک تابع پایدار Store است، پس تأیید نام باعث اجرای دوباره‌ی effect نمی‌شود.
• `app/lobby.tsx:185-192`, `245-258`, `409-415`

۷. Hint و Reveal تبلیغ می‌شوند و هرگز داده نمی‌شوند. روز ۳ «۳۰ سکه + Hint» و روز ۷ «۱۵۰ سکه + Reveal»، ولی فقط سکه و انرژی اضافه می‌شود.
• `constants/index.ts:164`, `168`
• `constants/economy.ts:90-97`
• `store/userStore.ts:603-634`
• `app/daily-reward.tsx:50`, `components/DailyRewardModal.tsx:77-80`
• همچنین `app/daily-reward.tsx:59` یک «Avatar Fragment» روز ۴ تبلیغ می‌کند که در جدول نیست.

۸. ارتقای منبع استamina مسیر مرده است. همه‌ی سطوح `gemCost: null` دارند، پس دکمه‌ی خرید رندر نمی‌شود و آفر `FIRST_UPGRADE_OFFER_GEM_COST = 25` غیرقابل‌دسترس است.
• `constants/economy.ts:165-169`, `196-204`
• `store/userStore.ts:1134-1149`
• `app/customization.tsx:108-113`, `248-268`
• `app/stamina.tsx:95-98`
• قیمت جم اختراع نکن. `NEEDS PRODUCT DECISION`.

۹. حتی با قیمت هم سرعت شارژ عوض نمی‌شود. هر چهار سطح `refillIntervalMin: 12` دارند در حالی که متن UI وعده‌ی شارژ سریع‌تر می‌دهد.
• `constants/economy.ts:145-149` در برابر `165-169`, `221-224`
• `app/stamina.tsx:97`, `app/customization.tsx:242-243`

۱۰. دسته‌ی قفل‌شده به تب Play فروشگاه می‌رود که آنلاک نمی‌فروشد. `early_category_unlock` تعریف شده و هرگز رندر یا اعطا نمی‌شود.
• `app/category-select.tsx:63-66`
• `app/shop.tsx:531-547`
• `constants/shopData.ts:83-89`
• `constants/categories.ts:78-85`

موارد جانبی (فقط اگر بی‌خطر بود)
• `app/lobby.tsx:174-179` مقادیر `staminaAdsRemaining` و `adLoading` محاسبه و هرگز استفاده نمی‌شوند.
• streak روزانه با از دست دادن یک روز ریست نمی‌شود.
• یادآور روزانه ساعت ۱۰ محلی است ولی ساعت اعطا UTC (`services/NotificationService.native.ts:177-192`).
• CTA ارتقا در `app/stamina.tsx:57-59` تب Avatars را باز می‌کند نه Upgrade.

---

PRIORITY 8 — SHOP / SPIN / IAP

۱. Legendary Pack لابی تب Gems را باز نمی‌کند و روی Offers می‌افتد، در حالی که خودِ پک در کاتالوگ Gems است.
• `app/lobby.tsx:346-347` در برابر `343-344`, `352-353`
• `app/shop.tsx:630-654`

۲. اسپین رایگان با نیمه‌شب محلی آزاد می‌شود ولی UI کول‌داون ۲۴ ساعته نشان می‌دهد؛ دکمه «Available now!» می‌شود قبل از گذشت ۲۴ ساعت.
• `store/userStore.ts:967-970`, `utils/index.ts:83-91`
• `app/spin.tsx:189-194`, `255`, `284-289`, `321-322`

۳. شمارنده‌ی اسپین اضافه با ریست UTC همخوان نیست؛ دکمه فعال می‌شود در حالی که متن هنوز `N/5` و `0 left` است.
• `store/userStore.ts:973-980`, `1002`, `1043-1044`
• `app/spin.tsx:170`, `257-258`, `293-297`, `341`

۴. گردونه بدون IAP جم می‌دهد، خلاف قانون «جم فقط از IAP».
• `constants/spinConfig.ts:94-113` (`gems_2`, `gems_5`)
• `store/userStore.ts:1021-1022`
• قانون: `constants/economy.ts:118`

۵. Starter Pack «۵۰۰ سکه + ۱۰۰ جم» تبلیغ می‌کند و هیچ جمی نمی‌دهد.
• `app/shop.tsx:754` در برابر `store/userStore.ts:957-965`
• `NEEDS PRODUCT DECISION`: متن اصلاح شود یا جم واقعاً اعطا شود.

۶. Ad-Free هفت‌روزه مادام‌العمر اعمال می‌شود.
• `app/shop.tsx:683-685` → `store/adStore.ts:168` (به‌جای مسیر انقضادار `159-165`)

۷. روی وب `Alert.alert` بی‌اثر است، پس تأیید خرید جم‌پک و پیام اتصال گوگل هرگز کامل نمی‌شوند. این throw نیست؛ خرید بی‌صدا نیمه‌کاره می‌ماند.
• `app/shop.tsx:284-305`, `206-208`, `227-234`
• `node_modules/react-native-web/dist/exports/Alert/index.js:11`

۸. HUD سکه تب Play را باز می‌کند و `IAP_COIN_PACKS` هرگز رندر نمی‌شود؛ `mockPurchaseCoins` هم subscribe و بی‌استفاده است.
• `app/lobby.tsx:349-351`
• `constants/economy.ts:81-86`
• `app/shop.tsx:168`

۹. تب Upgrade هیچ چیز قابل‌خریدی ندارد (همان PRIORITY 7 مورد ۸).
• `app/customization.tsx:263-268`, `248-257`

---

PRIORITY 9 — LEADERBOARD / FRIENDS / ACHIEVEMENTS / PROFILE

۱. لیدربورد لایو دو ردیف با `xp: 0` و `level: 1` برمی‌گرداند و اپ آن‌ها را رتبه‌ی واقعی ۱ و ۲ نشان می‌دهد. رتبه‌بندی از `max(xp, totalXpEarned)` استفاده می‌کند، پس این mismatch فیلد نیست؛ داده واقعاً صفر است. ثبت نام مستعار داکیومنت بی‌XP می‌سازد و sync کلاینت `xp: 0` می‌نویسد. حالت خالی فقط وقتی آرایه خالی است اجرا می‌شود.
• `artifacts/api-server/src/lib/playerXp.ts:15-16`
• `artifacts/api-server/src/routes/leaderboard.ts:60-71`, `100-105`, `187-190`
• `artifacts/api-server/src/routes/nickname.ts:84-93`
• `app/leaderboard.tsx:202-237`
• `hooks/useFirestoreSync.ts:12-54` (کلاینت هرگز `totalXpEarned` نمی‌نویسد)
لیدربورد جعلی یا hardcoded نساز. یا مسیر داده را درست کن یا نمایش صفر را صادقانه کن.

۲. Friends در خود صفحه صادقانه «به‌زودی» است ولی لابی آن را مثل Shop و Leaderboard قابلیت آماده نشان می‌دهد.
• `app/friends.tsx:1-8`, `28-51`; `components/PlaceholderScreen.tsx:70-74`
• `app/lobby.tsx:558-563`, `361-362`
سیستم دوستان نساز. فقط ادعای UI را با واقعیت هم‌تراز کن.

۳. دستاورد `blur-master` پنجاه جم می‌دهد، خلاف «جم فقط از IAP». پاداش‌های سطح هم جم می‌دهند.
• `constants/achievements.ts:121-134`
• `store/userStore.ts:842-843`, `863`, `875-885`
• `app/achievements.tsx:192-196`
• مسیر مرتبط: `store/userStore.ts:653-654`, `698-700`; `constants/levelRewards.ts:163-168`, `229`
• `NEEDS PRODUCT DECISION`: عدد جم را خودسرانه عوض نکن.

۴. سوییچ دیباگ پروفایل در پروداکشن (همان PRIORITY 6 مورد ۶).
• `app/profile.tsx:43`, `86-98`, `182-191`

Settings سالم است — تنها پاک‌سازی، Delete Account با تأیید مخرب است (`app/settings.tsx:118-157`, `60-67`). دست نزن.

---

PRIORITY 10 — AUTH / ROUTING / NOTIFICATIONS

۱. AuthGuard ناوبری را مخفی نمی‌کند. فقط بعد از `authChecked` مسیر را عوض می‌کند و در این فاصله `null` برمی‌گرداند بدون آنکه `RootLayoutNav` را پنهان کند، پس دیپ‌لینک صفحه‌ی واقعی را اول رندر می‌کند. انتظار آمادگی آوث تا ۴ ثانیه طول می‌کشد.
• `app/_layout.tsx:45-77`, `40`
• `services/authService.ts:30`, `58`

۲. نام مستعار بیرون لابی الزامی نیست. اگر uid هنوز null باشد، مودال هرگز باز نمی‌شود و دیپ‌لینک‌ها کلاً از آن رد می‌شوند.
• `app/_layout.tsx:42-44`
• `app/splash.tsx:136-141`
• `app/lobby.tsx:187-192`, `279-288`, `322-362`

۳. ریدایرکت گوگل وب تمام نمی‌شود. مسیر popup-blocked بعد از `signInWithRedirect` خطا می‌اندازد، login آن را می‌بلعد، و URL بازگشت `/login` است که هیچ effect «قبلاً وارد شده → لابی» ندارد. `completeRedirectSignIn` فقط از splash صدا زده می‌شود.
• `services/authService.ts:174-177`, `186-197`
• `app/login.tsx:94-96`
• `app/splash.tsx:127`

۴. تایم‌اوت ۴ ثانیه‌ای می‌تواند سشن واقعی را روی صفحه‌ی لاگین حبس کند، چون login عمومی است و AuthGuard بعداً او را به لابی نمی‌فرستد.
• `services/authService.ts:46-58`
• `app/splash.tsx:134`
• `app/_layout.tsx:70-75`

۵. اعلان‌های نیتیو استamina / اسپین / بی‌فعالیتی هرگز زمان‌بندی نمی‌شوند. نسخه‌ی فعلی `expo-notifications` برای `TIME_INTERVAL` نیازمند `repeats` است و خطاها هم بی‌صدا بلعیده می‌شوند.
• `services/NotificationService.native.ts:150-153`, `227-230`, `249-252`, `117-126`

۶. تپ اعلان جایزه‌ی روزانه به لابی می‌رود نه صفحه‌ی جایزه. محتوا `data.screen` را می‌گذارد ولی شنونده آن را نادیده می‌گیرد.
• `services/NotificationService.native.ts:185`, `287-288`, `162-174`, `283-292`
• `app/_layout.tsx:150-152`

۷. «Continue as Guest» اگر سشن موجود باشد حساب مهمان نمی‌سازد و uid فعلی را نگه می‌دارد.
• `app/login.tsx:121-124`

۸. کانال اندروید زیر `content.android` تودرتو است به‌جای `channelId` سطح بالا، پس هشدارها ممکن است به کانال پیش‌فرض بروند.
• `services/NotificationService.native.ts` (بلوک‌های gameplay / rewards / engagement)

۹. splash بعد از لاگین دیپ‌لینک اولیه را بازیابی نمی‌کند و همیشه به لابی می‌رود.
• `app/login.tsx:82`

---

🚫 DO NOT TOUCH — NOT CONFIRMED

این‌ها بررسی شدند و در کد فعلی سالم‌اند. «فیکس» نکن، وگرنه رگرسیون می‌سازی.

• قرارداد لایو `POST /api/images` شامل `editedUrl` و ۴ `optionUrls` است.
• Load Retry در Lost Item درست ریست می‌کند (`resetRoundProgress()` + `deal()`; `games/lost-item/LostItemScreen.tsx:354-357`, `store/gameStore.ts:347-364`).
• نوشتن کهنه‌ی `fillRest` با `genRef` مهار شده است (`games/lost-item/LostItemScreen.tsx:109-114`).
• Time Boost در Count Quick و Lost Item مصرف نمی‌شود (`shared/economy/playEvents.ts:17-19`, `store/gameStore.ts:149-164`).
• Play Again دسته و درجه‌سختی را نگه می‌دارد (`app/result.tsx:263-266`, `store/gameStore.ts:368-377`).
• Pause Restart در Count Quick از `restartSession` عبور می‌کند (`games/count-quick/CountQuickScreen.tsx:179-184`).
• بن‌بست تبلیغ وب در Restart بازی‌ها وجود ندارد (`games/count-quick/CountQuickScreen.tsx:193-202`).
• لیبل هدف Count Quick نام پالت نیست؛ «COUNT THIS COLOR» به‌علاوه‌ی نمونه‌رنگ است (`games/count-quick/CountQuickScreen.tsx:290-293`).
• `games/gamenew/count-quick.tsx` وجود ندارد و `games/gamenew` در `tsconfig.json:20-22` مستثنی است.
• نبود `Stack.Screen` برای friends / customization / stamina در Expo Router 6 خطای ۴۰۴ نیست.
• Extra Hard / Max و اعتبارسنجی Next قفل درست دارند.
• Settings هیچ پاک‌سازی خاموشی ندارد.
• پالت لایو Speed Card قفل پنج رنگ اول نیست.
• لینک مهمان به گوگل با همان uid طبق طراحی کار می‌کند (`services/authService.ts:316-320`, `280-283`).

---

REQUIRED TESTING

قبل از هر ادعای FIXED:
• `npx tsc --noEmit` روی mobile.
• typecheck روی `artifacts/api-server`.
• اسموک‌های موجود: speed-card engine/economy، count-quick، lost-item، `masterArchitecture`، `rewardEngine`.
• `test:economy` (توجه: شش FAIL از قبل موجود است — اگر عدد اقتصادی عوض شد، انتظار جدید را مستند کن).

مسیرهای دستی:
• Lobby → Level Select → Category 16 / 17 / 18 و یک دسته‌ی بلور.
• Speed Card: موفقیت API، شکست API، Try Again، هر سه درجه، Restart، تایم‌اوت، پایان راند ناقص.
• Count Quick: راند کامل ۵ سؤالی، ۵/۵، Pause→Restart، خروج به لابی، Share روی وب.
• Lost Item: راند کامل، Retry، برگشت سخت‌افزاری، Pause وسط بازخورد.
• یک راند نیتیو با سطح‌آپ و یک مأموریت تکمیل‌شده.
• Cold start با حساب دارای XP، سپس بررسی اینکه Firestore صفر نگرفته باشد.

---

FINAL REPORT FORMAT

برای هر مورد شماره‌گذاری‌شده‌ی همین فایل دقیقاً یکی از این‌ها:
`FIXED` / `NOT FIXED` / `NEEDS PRODUCT DECISION` / `NOT VERIFIED — REQUIRES LIVE DEPLOYMENT CHECK`

و برای هر مورد:
1. Files Changed — مسیر دقیق.
2. Root Cause — علت واقعی.
3. Fix — چه چیزی عوض شد.
4. Verification — چه تستی اجرا شد و نتیجه چه بود.
5. Remaining — چه چیزی باقی ماند.

هیچ موردی صرفاً با بازرسی کد `FIXED` اعلام نشود.
درباره‌ی Render، تبلیغات، IAP، و رفتار پروداکشن فقط در صورت تست واقعی ادعای FIXED کن.

---

🚨 FINAL STOP RULE

بعد از اتمام موارد بالا: STOP.
Feature جدید، بازی جدید، و Refactor گسترده ممنوع.
بدون اجازه وارد مرحله‌ی بعدی توسعه نشو.
