#!/bin/bash
# (V39.69) تجهيزُ بيئة العمل من الصفر في دقائق — لأن بيئةَ العمل مؤقتةٌ وقد تُمسح في أي وقت.
# الاستخدام: bash scripts/dev-restore.sh   (من أي مكان؛ يبني /home/claude/app من فرع wip إن وُجد وإلا من staging)
# لا يحوي أسرارًا: مفتاحُ الرفع يُوضَع في /tmp/gt قبل التشغيل (أو يُطلب من صاحب المشروع).
set -e
REPO="https://github.com/mhmdsfwt371/Project-survey.git"; APP="/home/claude/app"
BR="${1:-wip}"
if [ ! -d "$APP/.git" ]; then
  mkdir -p "$(dirname "$APP")"
  if [ -s /tmp/gt ]; then T=$(cat /tmp/gt); git clone -q --branch "$BR" "https://x-access-token:${T}@github.com/mhmdsfwt371/Project-survey.git" "$APP" 2>/dev/null || git clone -q --branch staging "https://x-access-token:${T}@github.com/mhmdsfwt371/Project-survey.git" "$APP"
  else git clone -q --branch "$BR" "$REPO" "$APP" 2>/dev/null || git clone -q --branch staging "$REPO" "$APP"; fi
  cd "$APP" && git remote set-url origin "$REPO"
fi
cd "$APP"
# أدواتُ الفحص كلُّها دفعةً واحدة (تثبيتٌ جزئيٌّ لاحقٌ يحذف ما سبق — فتُثبَّت معًا دائمًا)
npm install --no-audit --no-fund > /tmp/npm-restore.log 2>&1
npm install --no-save --no-audit --no-fund terser@5.51.2 eslint@9 jszip docx xlsx qrcode acorn nodemailer googleapis @firebase/rules-unit-testing firebase-admin >> /tmp/npm-restore.log 2>&1
grep -q "package-lock.json" .git/info/exclude 2>/dev/null || printf 'package-lock.json\nfunctions/node_modules/\n' >> .git/info/exclude
# أدواتُ الجلسة الصغيرة
mkdir -p /tmp/rv
cat > /tmp/show.py <<'PY'
import sys
w=int(sys.argv[2]) if len(sys.argv)>2 else 200
for l in open(sys.argv[1],'rb').read().decode('utf8','replace').split('\n'): print(l[:w])
PY
cat > /tmp/dopush134.sh <<'SH'
#!/bin/bash
cd /home/claude/app
AUTH=$(printf 'x-access-token:%s' "$(cat /tmp/gt)" | base64 -w0)
git -c http.extraHeader="Authorization: Basic $AUTH" push origin HEAD:staging > /tmp/push134.log 2>&1; echo "rc=$?" >> /tmp/push134.log
SH
chmod +x /tmp/dopush134.sh
node scripts/build.mjs > /dev/null 2>&1 && echo "✓ البيئةُ جاهزة — $(git log --oneline -1 | cut -c1-60)"
