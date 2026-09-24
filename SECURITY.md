# سياسةُ الأمن — Security policy

## بالعربية
- **الإبلاغُ عن ثغرة:** لا تفتح بلاغًا عامًّا. استعمل **الإبلاغَ الخاصَّ عن الثغرات** في GitHub: تبويب *Security* في هذا المستودع ← *Report a vulnerability* — يصل إلى مالك المستودع وحدَه. إن لم يكن الزرُّ ظاهرًا فالميزةُ لم تُفعَّل بعد؛ راسل مالكَ المستودع عبر ملفّه الشخصيِّ على GitHub.
- **ما نطلبه:** وصفُ الأثر، وخطواتُ إعادة الإنتاج، والنسخةُ (رقمُ النسخة في أسفل التطبيق). لا تُرفِق بياناتِ أشخاصٍ حقيقيّين.
- **ما نلتزم به:** إقرارٌ خلال ٥ أيام عمل، وإصلاحٌ حسب الخطورة عبر مسار الإصدار المعتاد (البوابةُ ثم القطار، أو ترويسةُ الطوارئ للحرج).
- **النطاق:** التطبيق (`index.html` · `sw.js`)، وقواعد Firestore (`firestore.rules`)، وسيور GitHub Actions. خارج النطاق: خدماتُ Google وGitHub نفسُها.
- **ما لا يُعَدُّ ثغرة:** المستودعُ عامٌّ بالتصميم، وإعداداتُ Firebase العامةُ (المفاتيحُ العامة) ليست سرًّا — الأمنُ في القواعد.

## English
- **Reporting:** do not open a public issue. Use GitHub **private vulnerability reporting**: the *Security* tab of this repository → *Report a vulnerability*. It reaches the repository owner only. If the button is not visible, the feature is not enabled yet; contact the owner through their GitHub profile.
- **Please include:** impact, reproduction steps, and the app version (shown at the bottom of the app). Do not include real personal data.
- **Our commitment:** acknowledgement within 5 working days; fixes ride the normal release path (gate, then the release train, or the hotfix trailer for critical issues).
- **Scope:** the app (`index.html`, `sw.js`), the Firestore rules (`firestore.rules`), and the GitHub Actions workflows. Out of scope: Google and GitHub services themselves.
- **Not a vulnerability:** the repository is public by design, and the public Firebase web config is not a secret — access control lives in the rules.
