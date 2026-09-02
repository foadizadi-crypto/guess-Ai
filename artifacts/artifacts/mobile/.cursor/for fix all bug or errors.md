🔒 GUESSAi — QA STABILIZATION & BUG FIX ONLY
وضعیت مأموریت
QA لابی و سه بازی جدید کامل شده است.
Smoke Test هر سه بازی PASS شده و پروژه بدون خطای کامپایل اجرا می‌شود.
بنابراین این مأموریت برای ساخت Feature جدید نیست.
⛔ STRICT RULES
به هیچ عنوان:
• Feature جدید اضافه نکن.
• Game جدید اضافه نکن.
• UI یا Design جدید نساز.
• Economy جدید طراحی نکن.
• ساختار کلی پروژه را Refactor نکن مگر برای رفع مستقیم یکی از باگ‌های زیر.
• فایل‌ها یا سیستم‌های سالم را بازنویسی نکن.
• سیستم‌های موجود Blur Quiz را خراب نکن.
• برای رفع یک باگ، منطق مستقل و موازی جدید نساز.
• Fallback مخفی که خطای Production را پنهان کند ایجاد نکن.
فقط باگ‌های تأییدشده زیر را اصلاح کن.
PRIORITY 1 — LOST ITEM LIVE API
مشکل
Lost Item روی API لایو اجرا نمی‌شود.
کلاینت انتظار دارد:
• editedUrl
• optionUrls
اما:
POST /api/images
روی سرور Live فقط برمی‌گرداند:
{ url, provider } 
Retry نیز همان پاسخ ناقص را تکرار می‌کند.
احتمالاً پچ Backend روی سورس وجود دارد اما روی Render Live Deploy نشده است.
وظیفه
• مسیر واقعی Lost Item را پیدا کن.
• قرارداد دقیق Client ↔ API را بررسی کن.
• Backend را فقط در صورت نیاز اصلاح کن تا پاسخ صحیح Lost Item تولید شود.
• Response باید دقیقاً شامل داده‌های موردنیاز Client باشد.
• Determine whether the current Render Live deployment contains the required backend changes.
IMPORTANT
Do not claim that Render was deployed unless you actually have access and successfully verified the live deployment.
If deployment requires manual action or external credentials:
• Complete all required code changes locally.
• Commit the required changes if repository workflow permits.
• Clearly report the exact commit/change that must be deployed.
• Report:
NOT VERIFIED — REQUIRES RENDER DEPLOYMENT 
• If the live deployment is actually available and verifiable, test the Live Endpoint after deployment.
• Lost Item must complete one real end-to-end round.
Acceptance Criteria
Lost Item نباید دیگر به دلیل نبود:
• editedUrl
• optionUrls
Fail شود.
PRIORITY 2 — MASTER SESSION LIFECYCLE
مشکل اصلی QA این است که بازی‌های جدید در بعضی مسیرها Master Engine Lifecycle را کامل دنبال نمی‌کنند.
تمام بازی‌ها باید از چرخه استاندارد موجود پروژه استفاده کنند:
startSession ↓ startRound ↓ Gameplay Questions ↓ finishRound ↓ endSession ↓ Rewards Calculation ↓ LEVEL_COMPLETE when applicable 
وظیفه
بررسی کن:
• LEVEL_COMPLETE واقعاً از مسیر پایان صحیح Session اجرا شود.
• endSession در تمام پایان‌های واقعی Round اجرا شود.
• Restart و Play Again Session قبلی را دور نزنند.
• Reward و Boost دوبار محاسبه نشوند.
• Session جدید بدون بستن Session قبلی ساخته نشود.
مهم
منطق جدید و جداگانه برای هر بازی نساز.
از Master Engine و Lifecycle موجود استفاده کن.
PRIORITY 3 — SPEED CARD
مشکل 1 — خطای آنلاین مخفی می‌شود
fetchSpeedCardRound
در صورت شکست درخواست:
• Error را پنهان می‌کند.
• Local Round می‌سازد.
در نتیجه UI حالت واقعی Error را نمی‌بیند و Try Again عملاً بی‌فایده است.
اصلاح
برای حالت Production/API:
• خطای واقعی را swallow نکن.
• Error State صحیح به UI برسد.
• Try Again باید واقعاً درخواست API را دوباره ارسال کند.
اگر Local fallback برای Development وجود دارد:
• فقط در Development فعال باشد.
• نباید Production API failure را پنهان کند.
مشکل 2 — Difficulty به API منتقل نمی‌شود
در حال حاضر:
• Difficulty از Client ارسال نمی‌شود، یا
• Backend آن را نمی‌خواند.
زمان نمایش کارت فقط در Client تغییر می‌کند.
اصلاح
Difficulty انتخاب‌شده باید:
• از Client ارسال شود.
• Backend آن را دریافت کند.
• API Round Generation واقعاً بر اساس Difficulty رفتار کند.
اما:
• قرارداد API را بی‌دلیل تغییر نده.
• Difficulty behavior را مطابق ساختار فعلی Game Config پیاده کن.
Acceptance Criteria
Difficulty فقط ظاهر یا Timer نباشد.
API/Game Round باید Difficulty انتخاب‌شده را واقعاً دریافت و استفاده کند.
PRIORITY 4 — COUNT QUICK
مشکل 1 — Play Again Category را حفظ نمی‌کند
در حال حاضر:
Play Again → Animals 
حتی اگر بازیکن Category دیگری انتخاب کرده باشد.
اصلاح
Play Again باید:
• همان Game
• همان Category
• همان Difficulty
را حفظ کند، مگر اینکه طراحی فعلی پروژه صریحاً خلاف آن باشد.
مشکل 2 — Timer / Blur / Time Boost اشتباه فعال می‌شود
Count Quick یک بازی مستقل ۵ سؤالی است.
Session شروع آن نباید بدون نیاز:
• Blur Quiz Timer
• Blur Reveal Logic
• Time Boost Consumption
را فعال کند.
اصلاح
فقط سیستم‌هایی که واقعاً برای Count Quick تعریف شده‌اند فعال باشند.
Time Boost نباید بی‌اثر مصرف شود.
مشکل 3 — Pause Restart endSession را دور می‌زند
Restart از Pause بدون اجرای endSession Session جدید می‌سازد.
این باعث می‌شود:
• Reward Multiplier 2×
• Time Boost
• Session Accounting
اشتباه شود.
اصلاح
Restart باید Lifecycle صحیح داشته باشد.
اگر Restart طبق طراحی باید Session قبلی را پایان دهد، حتماً از مسیر استاندارد Master Engine استفاده کند.
مشکل 4 — Restart + Ad روی Web Production
روی Web Production Restart همراه با تبلیغ کار نمی‌کند.
اصلاح
بررسی کن:
• Web Platform behavior
• Ad availability
• Failure handling
هیچ Crash یا بن‌بست UI نباید وجود داشته باشد.
اگر Ad SDK روی Web پشتیبانی نمی‌شود:
• مسیر امن و استاندارد Platform fallback استفاده شود.
• Gameplay نباید قفل شود.
مشکل 5 — Perfect Score اشتباه به سیستم Blur وصل است
Count Quick:
5 Questions 
است.
اما 5/5 مانند Perfect مربوط به Blur Quiz 20 سؤال به Mission/Achievement وصل شده است.
اصلاح
Perfect Score باید Game-aware باشد.
مثلاً:
Count Quick: 5 / 5 = Perfect Count Quick Blur Quiz: 20 / 20 = Perfect Blur Quiz 
سیستم Achievement نباید تعداد سؤال یک بازی را به بازی دیگر تحمیل کند.
از Config یا Metadata بازی استفاده کن؛ Hardcode پراکنده ایجاد نکن.
مشکل 6 — Target Label اشتباه است
Label هدف:
Candy Ocean 
و غیره است.
این‌ها نام Palette هستند، نه هدف واقعی شمارش.
اصلاح
UI باید هدف واقعی Count Quick را نمایش دهد؛ مثلاً رنگ یا شیء موردنظر شمارش، نه نام داخلی Palette.
مشکل 7 — Forest خوانایی ضعیف دارد
Forest Palette روی Board خوانا نیست.
اصلاح
فقط Contrast و Readability همان Palette را بهبود بده.
Design کلی Lobby یا Game UI را تغییر نده.
مشکل 8 — Share روی Web Crash می‌کند
Share Result روی Web بدون Error Handling اجرا می‌شود.
اصلاح
Share باید:
• Support Check داشته باشد.
• Error Handling داشته باشد.
• در Web unsupported باعث Crash نشود.
PRIORITY 5 — LOBBY
مشکل 1 — Leaderboard
رتبه اول:
foad xp: 0 
است.
وظیفه
بررسی کن:
• Leaderboard Data Source چیست.
• XP چگونه ذخیره می‌شود.
• Sort چگونه انجام می‌شود.
Leaderboard نباید با XP صفر به عنوان رتبه واقعی اول نمایش داده شود مگر اینکه واقعاً داده‌های همه کاربران صفر باشند و این رفتار طراحی‌شده باشد.
Fake یا Hardcoded Leaderboard ایجاد نکن.
مشکل Data Flow واقعی را پیدا و اصلاح کن.
مشکل 2 — Friends Placeholder
Friends از Lobby باز می‌شود اما:
• Friend List ندارد.
• Invite Code ندارد.
• Feature واقعی ندارد.
مهم
Friend System کامل جدید نساز.
فقط بررسی کن UI فعلی نباید Feature ناقص را به شکل Feature آماده نمایش دهد.
اگر Feature هنوز عمداً Placeholder است:
• رفتار فعلی را واضح و امن نگه دار.
• بدون ادعای قابلیت کامل.
PRIORITY 6 — DIFFICULTY VALIDATION
مشکل:
دکمه Next در Difficulty Selection، Extra Hard / Max را دوباره Validate نمی‌کند.
در حالی که Play در Category هنوز جلوی شروع را می‌گیرد.
اصلاح
تمام Entry Pointها باید Validation یکسان داشته باشند.
قفل Difficulty نباید فقط در یک صفحه بررسی شود.
Validation Logic را مرکزی نگه دار؛ چند شرط جداگانه و متناقض ایجاد نکن.
PRIORITY 7 — DEAD / DUPLICATE FILE
فایل:
games/gamenew/count-quick.tsx 
طبق QA:
• ناقص است.
• Dead Path است.
• مسیر واقعی Count Quick از:
games/count-quick/ 
اجرا می‌شود.
وظیفه
بررسی کن آیا این فایل:
• Import شده؟
• Route دارد؟
• Reference دارد؟
اگر واقعاً Dead و بدون استفاده است، آن را طبق استاندارد امن پروژه تعیین تکلیف کن تا بعداً دو نسخه متناقض از Count Quick باقی نماند.
قبل از حذف هر فایل:
تمام Import و Referenceها را بررسی کن.
🔒 ARCHITECTURE REQUIREMENT
هدف این Fix:
یکپارچه‌سازی بازی‌های جدید با Master Engine موجود است.
هدف:
❌ ساخت Engine جدید نیست.
هر بازی باید فقط تفاوت‌های Gameplay خود را داشته باشد.
سیستم‌های مشترک باید از مسیر مرکزی استفاده کنند:
• Session Lifecycle
• Rewards
• XP
• Coins
• Boost Consumption
• Completion Events
• Difficulty Validation
Game-specific Config باید تفاوت‌ها را مشخص کند، نه اینکه هر Game Lifecycle جداگانه بسازد.
REQUIRED TESTING
Lobby
تست کن:
Lobby → Level Select → Category 16 → Category 17 → Category 18 
Speed Card
تست کن:
• API Success
• API Failure
• Try Again
• Difficulty Easy
• Difficulty Medium
• Difficulty Hard
• Restart
• Session End
Count Quick
تست کن:
• 5 Question Full Round
• Play Again
• Category Persistence
• Difficulty Persistence
• Pause → Restart
• Session End
• Perfect 5/5
• Reward Calculation
• Time Boost
• 2× Reward
• Forest Readability
• Share on Web
Lost Item
تست کن:
• Live API
• Response Contract
• Image URLs
• Options
• Full Round
• Retry
• Error State
FINAL REPORT FORMAT
در پایان فقط یک گزارش دقیق بده.
برای هر مورد:
FIXED / NOT FIXED 
و شامل:
1. Files Changed
مسیر دقیق فایل‌ها.
2. Root Cause
علت واقعی باگ.
3. Fix
چه چیزی تغییر کرد.
4. Verification
چه تستی انجام شد و نتیجه چه بود.
5. Remaining Issues
هر چیزی که هنوز باقی مانده است.
MANDATORY SAFETY CHECK BEFORE FINAL REPORT
Before declaring any issue FIXED:
• Run TypeScript/type checking if available.
• Run the existing build/compile check.
• Verify there are no new compile errors.
• Verify existing Blur Quiz gameplay still starts and completes normally.
• Verify Categories 16, 17, and 18 still route correctly from Lobby.
• Do not mark an item FIXED based only on code inspection.
• Every FIXED item must have an actual verification result.
• If a Live API or Render deployment cannot actually be verified from the current environment, explicitly report:
NOT VERIFIED — REQUIRES LIVE DEPLOYMENT CHECK 
Do not claim LIVE API, Render deployment, Ads, or Production behavior is FIXED unless it was actually tested against the live environment.
🚨 FINAL STOP RULE
بعد از اتمام تمام موارد بالا:
STOP.
• Feature جدید اضافه نکن.
• Game جدید اضافه نکن.
• Refactor گسترده انجام نده.
• بدون اجازه وارد مرحله توسعه بعدی نشو.