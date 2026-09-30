# بناءُ ملف «تحديات المشاعر ١٤٤٨» من تصدير القاعدة — الأعدادُ معادلاتٌ على ورقة التفاصيل
import json, re
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
D=json.load(open('/tmp/exp/detail.json',encoding='utf-8')); S=json.load(open('/tmp/exp/summary.json',encoding='utf-8'))
html=open('index.html',encoding='utf-8').read(); S47=json.load(open('season1447.json',encoding='utf-8'))
RAW=json.loads(re.search(r'var SITES_RAW = (\{.*?\});\n', html).group(1))
STRUCT=[('منى',['مخيمات','ممرات','محطات قطار','منشأة الجمرات','كاميرات الرصد']),('عرفات',['مخيمات','ممرات','محطات قطار','مسجد نمرة','نقاط تجمع حافلات','كاميرات رصد']),
        ('مزدلفة',['ممرات']),('مراكز التفويج',['النورية','طريق الهجرة']),('منافذ الدخول',['المطارات','الموانئ','الدخول البري'])]
known={(m,s) for m,ss in STRUCT for s in ss}
extra=sorted({(b['main'],b['sub']) for b in S['bySub'] if (b['main'],b['sub']) not in known})
ALL=[(m,s) for m,ss in STRUCT for s in ss]+extra
REG={(b['main'],b['sub']):b.get('registry',0) for b in S['bySub']}
CH=sorted(S['byChal'].keys(), key=lambda k:-S['byChal'][k]['total'])
F='Arial'; H=Font(name=F,bold=True,color='FFFFFF',size=11); B=Font(name=F,size=10); BB=Font(name=F,size=10,bold=True)
HF=PatternFill('solid',fgColor='1F4E79'); SF=PatternFill('solid',fgColor='DDEBF7'); th=Side(style='thin',color='BFBFBF'); BD=Border(left=th,right=th,top=th,bottom=th)
AL=Alignment(horizontal='right',vertical='center',wrap_text=True,readingOrder=2)
wb=Workbook(); wb.calculation.fullCalcOnLoad=True
def sheet(title, headers, widths, first=False):
    ws=wb.active if first else wb.create_sheet(); ws.title=title; ws.sheet_view.rightToLeft=True
    for i,(h,w) in enumerate(zip(headers,widths),1):
        c=ws.cell(row=1,column=i,value=h); c.font=H; c.fill=HF; c.alignment=AL; c.border=BD; ws.column_dimensions[get_column_letter(i)].width=w
    ws.freeze_panes='A2'; return ws
def put(ws,r,c,v,font=B,fill=None):
    x=ws.cell(row=r,column=c,value=v); x.font=font; x.alignment=AL; x.border=BD
    if fill: x.fill=fill
    return x
g=sheet('دليل',['البند','التوضيح'],[26,110],True)
for i,(k,v) in enumerate([('الغرض','تحديات وعوائق مواقع قارئات نُسُك لموسم ١٤٤٨ من المسح الميداني في النظام، لكل تصنيفٍ رئيسيٍّ وفرعي — أساسُ «نتائج المسوحات الأولية» في الدراسة.'),
  ('تاريخ الاستخراج', S['at'][:16].replace('T',' ')+' (توقيت عالمي)'),
  ('المصدر','زيارات المسح الميداني في قاعدة بيانات النظام ('+str(S['recs'])+' زيارة)، وسجلُّ المواقع ('+str(S['sites'])+' موقعًا شاملًا المواقع المضافة ميدانيًّا)، وبيانات موسم ١٤٤٧ المحفوظة في النظام.'),
  ('التحدي المفتوح','تحدٍّ مسجّلٌ في زيارة المسح لموقعٍ لم يُركَّب بعد — يُغلق تلقائيًّا عند التركيب.'),
  ('متعذّر الوصول','زيارةٌ سُجّلت بحالة وصولٍ غير «تم الوصول» (منع دخول، غير موجود، يحتاج تصريح).'),
  ('إجمالي المعوقات','موقعٌ لم يُركَّب وفي مسحه تحدٍّ مفتوح أو تعذّر الوصول إليه.'),
  ('الأعداد','في الأوراق معادلاتٌ تُحسب من ورقة «تفاصيل ١٤٤٨».')],2): put(g,i,1,k,BB,SF); put(g,i,2,v)
det=sheet('تفاصيل ١٤٤٨',['التصنيف الرئيسي','التصنيف الفرعي','المعرّف','اسم الموقع','التحديات','وصف «أخرى»','حالة الوصول','وُصل','مفتوح (لم يُركَّب)','حالة الاعتماد'],[15,24,20,40,52,34,14,8,12,12])
REV={'approved':'معتمدة','pending':'بانتظار المهندس','revisit':'تحتاج زيارة أخرى'}
for i,r in enumerate(D,2):
    for j,v in enumerate([r['main'],r['sub'],r['id'],r['name'],'، '.join(r['chals']),r['note'],r['access'],'نعم' if r['reached'] else 'لا','لا' if r['installed'] else 'نعم',REV.get(r['review'],r['review'] or '—')],1): put(det,i,j,v)
N=len(D)+1; R=lambda c:"'تفاصيل ١٤٤٨'!$%s$2:$%s$%d"%(c,c,N)
t8=sheet('تحديات ١٤٤٨',['التصنيف الرئيسي','التصنيف الفرعي','المواقع في السجل','زيارات المسح','بتحدٍّ مفتوح','متعذّر الوصول','إجمالي المعوقات']+CH,[15,24,12,11,11,11,12]+[13]*len(CH))
r=2
for m,s in ALL:
    base='%s,A%d,%s,B%d'%(R('A'),r,R('B'),r)
    put(t8,r,1,m,BB); put(t8,r,2,s); put(t8,r,3,REG.get((m,s),0))
    put(t8,r,4,'=COUNTIFS(%s)'%base); put(t8,r,5,'=COUNTIFS(%s,%s,"?*",%s,"نعم")'%(base,R('E'),R('I'))); put(t8,r,6,'=COUNTIFS(%s,%s,"لا",%s,"نعم")'%(base,R('H'),R('I')))
    put(t8,r,7,'=E%d+F%d-COUNTIFS(%s,%s,"?*",%s,"لا",%s,"نعم")'%(r,r,base,R('E'),R('H'),R('I')))
    for j,c in enumerate(CH,8): put(t8,r,j,'=COUNTIFS(%s,%s,"*%s*",%s,"نعم")'%(base,R('E'),c,R('I')))
    r+=1
put(t8,r,1,'المجموع',BB,SF); put(t8,r,2,'',BB,SF)
for col in range(3,8+len(CH)): put(t8,r,col,'=SUM(%s2:%s%d)'%(get_column_letter(col),get_column_letter(col),r-1),BB,SF)
tc=sheet('التحديات حسب النوع',['التحدي','منى','عرفات','غيرهما','المجموع'],[44,12,12,12,12])
for i,c in enumerate(CH,2):
    put(tc,i,1,c,BB)
    for j,mm in [(2,'منى'),(3,'عرفات')]: put(tc,i,j,'=COUNTIFS(%s,"%s",%s,"*%s*",%s,"نعم")'%(R('A'),mm,R('E'),c,R('I')))
    put(tc,i,4,'=COUNTIFS(%s,"*%s*",%s,"نعم")-B%d-C%d'%(R('E'),c,R('I'),i,i)); put(tc,i,5,'=SUM(B%d:D%d)'%(i,i))
ot=sheet('نصوص «أخرى»',['ما كُتب تحت «أخرى»','مرات'],[70,10])
for i,o in enumerate(S['otherTop'],2): put(ot,i,1,o['t']); put(ot,i,2,o['n'])
ac=sheet('حالات الوصول',['حالة الوصول','المواقع (لم تُركَّب)'],[30,20])
for i,(k,v) in enumerate(sorted(S['access'].items(), key=lambda kv:-kv[1]),2): put(ac,i,1,k); put(ac,i,2,'=COUNTIFS(%s,"%s",%s,"نعم")'%(R('G'),k,R('I')))
wb.save('/tmp/exp/تحديات-المشاعر-١٤٤٨.xlsx'); print('xlsx', len(D), 'rows', len(CH), 'types')
