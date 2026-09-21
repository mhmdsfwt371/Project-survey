# تشغيلُ كلود كود مع كودكس على مشروع قارئات أفاقي

> مرةً واحدةً على اللابتوب، ثم كلَّ يومٍ بأمرٍ واحد. كلود على اشتراك Claude، وكودكس على اشتراك ChatGPT — فتتوزّع الحدود.

## مرةً واحدة

### ١. المتطلّبات
- **Git** — ويندوز: Git for Windows من `git-scm.com`؛ ماك: `xcode-select --install`.
- **Node.js 20 LTS** من `nodejs.org` — لازمٌ للحارس ولكودكس.

### ٢. كلود كود
- ماك:
  ```bash
  curl -fsSL https://claude.ai/install.sh | bash
  ```
- ويندوز (PowerShell):
  ```powershell
  irm https://claude.ai/install.ps1 | iex
  ```
- أو تطبيقُ سطح المكتب بلا طرفية. أوّلُ تشغيل: `claude` ثم سجّل بحساب Claude.

### ٣. كودكس
```bash
npm install -g @openai/codex
codex
```
ثم اختر تسجيلَ الدخول بحساب ChatGPT.

### ٤. المستودع
```bash
git clone https://github.com/mhmdsfwt371/Project-survey.git
cd Project-survey
npm i --no-save --no-audit --no-fund jsdom@^24 docx@^9 jszip@^3
```
صلاحيةُ الدفع: `gh auth login` (GitHub CLI) أو توكنٌ بصلاحية المحتويات.

### ٥. الإضافة داخل كلود كود
```text
claude
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/reload-plugins
/codex:setup
```

### ٦. التحقّق
اكتب لكلود كود: «اقرأ CLAUDE.md وشغّل الفحص السريع وقل لي النسخة الحالية».

## كلَّ يوم
- افتح الطرفيةَ في المجلد ← `claude` ← اكتب الطلب.
- التسليمُ لكودكس: `/codex:rescue` ثم الطلبُ بمواصفته.
- المراجعة: `/codex:review`.
- الحارسُ الكاملُ يعمل على الجهاز لا في المحادثة، ثم `git push origin HEAD:staging` والسحابةُ تكمل.
