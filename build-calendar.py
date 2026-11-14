# Rebuilds web/calendar-data.js and web/school-calendar.ics from the class calendars.
#   python build-calendar.py FOLDER_WITH_DOCX   (run inside web/; needs python-docx)
# AP World is transcribed below from the calendar text; AP Lang and AP Chem are read from the .docx files.
import docx, glob, json, re, datetime as dt, hashlib
UP=__import__('sys').argv[1].rstrip('/')+'/'  # folder holding the class calendar .docx files
def cells(row):
    seen=[];out=[]
    for c in row.cells:
        if c._tc in seen: continue
        seen.append(c._tc); out.append([x.strip() for x in c.text.split('\n') if x.strip()])
    return out
events={}  # (date, cls) -> [items]
def add(date, cls, items):
    items=[re.sub(r'\s+',' ',i).strip() for i in items if i and i.strip()]
    if items: events.setdefault((date.isoformat(), cls), []).extend(items)
# ---------- AP Lang (whole year; M/D headers) ----------
d=docx.Document(glob.glob(UP+'*AP_Lang*.docx')[0])
# Only the fall tables: the spring tables in the file still carry last year's dates
# (1/5 is a Monday in 2026, not 2027), so they are left out until the teacher updates them.
for t in d.tables[:3]:
    rows=[cells(r) for r in t.rows]
    for i in range(0,len(rows)-1,2):
        for head,body in zip(rows[i],rows[i+1]):
            m=re.fullmatch(r'(\d{1,2})/(\d{1,2})',' '.join(head)); assert m,head
            mo,day=int(m[1]),int(m[2]); add(dt.date(2026 if mo>=8 else 2027,mo,day),'AP Lang',body)
# ---------- AP Chem (3rd six weeks; Mondays known) ----------
d=docx.Document(glob.glob(UP+'*AP_Chem*.docx')[0]); rows=[cells(r) for r in d.tables[0].rows]
mondays=[dt.date(2026,11,9),dt.date(2026,11,16),dt.date(2026,11,23),dt.date(2026,11,30),dt.date(2026,12,7),dt.date(2026,12,14)]
for k,mon in enumerate(mondays):
    head,body=rows[2*k],rows[2*k+1]
    nums=[int(re.search(r'(\d+)\s*$',' '.join(h))[1]) for h in head]; assert nums==[(mon+dt.timedelta(i)).day for i in range(5)],(nums,mon)
    if len(body)==1: body=body*5
    for i,b in enumerate(body): add(mon+dt.timedelta(i),'AP Chem',b)
    if 'EARLY RELEASE' in ' '.join(head[4]): add(mon+dt.timedelta(4),'AP Chem',['Early Release'])
# ---------- AP World History (pasted by Samuel; transcribed) ----------
W={
'2026-08-19':['First Day of School','Syllabus Handout','Procedures','Classroom Layout','Character Poster','AMSCO Unit 0 Reading Assigned'],
'2026-08-20':['Character HIPP Activity','Themes of History','Group: Themes of History Charades Planning'],
'2026-08-21':['Group Presentations over the Themes of History'],
'2026-08-24':['Warm Up/Exit Intro','BOY Test','Unit 0 PBL Intro'],
'2026-08-25':['HIPP','Trade Routes','Layer 1 PBL'],
'2026-08-26':['Unit 0 Map Quiz','Major Classical Empires','Layer 2 PBL'],
'2026-08-27':['SAQ Introduction','Major Classical Empires','Layer 2 PBL'],
'2026-08-28':['Unit 1 Reading Assigned','Daily Warm Ups Due','Major Classical Religions','Layer 3 PBL'],
'2026-08-31':['Rise of Islam','Layer 4 PBL and Overreaching Question'],
'2026-09-01':['Unit 0 Mapping: SAQ Write','Unit 0 One Page'],
'2026-09-02':['Unit 0 Test','Unit 0 Reading Guide Due'],
'2026-09-03':['TEA Review','TEA Understanding Demo','Reading Day'],
'2026-09-04':['Unit 1 Vocab/Topic Preview'],
'2026-09-07':['Holiday No School'],
'2026-09-08':['1.1-East Asia Notes and Graphic Organizer'],
'2026-09-09':['Enrichment Reading 1 East Asia'],
'2026-09-10':['Enrichment Reading 1 East Asia','Discussion','1.2- Dar al-Islam Notes and Graphic Organizer'],
'2026-09-11':['1.3 S & SE Asia Notes and Graphic Organizer','Unit 2 Reading Assigned'],
'2026-09-14':['1.2- Dar al-Islam Notes and Graphic Organizer','1.3 S & SE Asia Notes and Graphic Organizer'],
'2026-09-15':['Unit 1 Reading Quiz','1.4 The Americas Notes and Graphic Organizer'],
'2026-09-16':['Sufi Islam Reading Activity'],
'2026-09-17':['Sufi Islam Reading Discussion'],
'2026-09-18':['1.5 Africa Notes and Graphic Organizer','1.6 Europe Notes and Graphic Organizer'],
'2026-09-21':['Documents review for Test'],
'2026-09-22':['Unit 1 Test','MCQ/SAQ'],
'2026-09-23':['Unit 1 Test','SAQ submissions'],
'2026-09-24':['End of 1st Six Weeks','Reading/Retest/Retake'],
'2026-09-25':['Student Holiday'],
'2026-09-28':['Start 2nd Six Weeks','Introduction to the DBQ and Historical Arguments'],
'2026-09-29':['Vocab and Topics Preview Unit 2'],
'2026-09-30':['Unit 3 Reading and RG Assigned','2.1 Silk Roads Notes and Graphic Organizer'],
'2026-10-01':['2.2 Mongols Notes','Mongols Gallery Walk'],
'2026-10-02':['Unit 2 Reading Quiz','Mongols Enrichment Reading'],
'2026-10-05':['Indian Ocean Trade and Graphic Organizer','Islam in Sub Saharan GW'],
'2026-10-06':['Sub-Saharan Trade Notes and Graphic Organizer'],
'2026-10-07':['PSAT DAY'],
'2026-10-08':['Cultural and Environmental Consequences of Connectivity Notes'],
'2026-10-09':['Student Holiday'],
'2026-10-12':['Fall Break-No School'],
'2026-10-13':['Fall Break-No School'],
'2026-10-14':['Unit 2 Review','Unit 3 Reading Quiz','Unit 4 Reading Assigned'],
'2026-10-15':['Unit 2 Test'],
'2026-10-19':['Historical Rap Battle Grouping and Research'],
'2026-10-20':['Historical Rap Battle Creation'],
'2026-10-21':['Historical Rap Battle Creation'],
'2026-10-22':['Historical Rap Battle Creation'],
'2026-10-23':['Historical Rap Battle Presentations'],
'2026-10-26':['Contextualization and DBQ Intro Poster Day 1'],
'2026-10-27':['Contextualization and DBQ Intro Poster Day 2'],
'2026-10-28':['Unit 3 Topic Preview'],
'2026-10-29':['3.1 Gunpowder Empires','Gunpowder Empires GW'],
'2026-10-30':['3.2 Empire Administration Graphic Organizer and Notes'],
'2026-11-02':['3.3 Empire Belief Systems Notes and Graphic Organizer','Gunpowder Empires Enrichment Reading'],
'2026-11-03':['Unit 3 Topic Preview and Graphic Organizer Completion','One Page Study Sheet','Test App'],
'2026-11-04':['Unit 3 Test'],
'2026-11-05':['Unit 5 Reading Assigned','Reading Day'],
'2026-11-06':['End of 2nd Six Weeks','Unit 4 Topic Preview'],
'2026-11-09':['Start of 3rd Six Weeks','Unit 3 Character Meet and Greet Research'],
'2026-11-10':['Unit 3 Character Meet and Greet: Move and Talk','Writing'],
'2026-11-11':['Unit 4 Reading Quiz','Unit 4 RG Due','Unit 5 Reading Assigned','Unit 4 Topic Preview Assigned'],
'2026-11-12':['Unit 4.1 Notes and Graphic Organizer'],
'2026-11-13':['4.2 Notes and Graphic Organizer'],
'2026-11-16':['4.3 Notes and Graphic Organizer'],
'2026-11-17':['Unit 3 DBQ Intro Timed Writing'],
'2026-11-18':['Consol Cares'],
'2026-11-19':['4.4 Notes and Graphic Organizer','Casta System Enrichment Reading'],
'2026-11-20':['4.5 Notes and Graphic Organizer','Impacts of Exploration GW'],
'2026-11-23':['Thanksgiving Break'],'2026-11-24':['Thanksgiving Break'],'2026-11-25':['Thanksgiving Break'],'2026-11-26':['Thanksgiving Break'],'2026-11-27':['Thanksgiving Break'],
'2026-11-30':['4.1-4.5 Review'],
'2026-12-01':['4.6 Notes and Graphic Organizer','Asante Empire Enrichment'],
'2026-12-02':['4.7 Notes and Graphic Organizer'],
'2026-12-03':['Unit 4 Debate Prep'],
'2026-12-04':['4.7 Notes and Graphic Organizer'],
'2026-12-07':['Unit 4 Topic Preview Finish'],
'2026-12-08':['Unit 4 Test'],
'2026-12-09':['Unit 4 DBQ'],
'2026-12-18':['End of 3rd Six Weeks','Early Release','Start Winter Break'],
}
for k,v in W.items():
    date=dt.date.fromisoformat(k); assert date.weekday()<5,k; add(date,'AP World',v)
days={}
for (date,cls),items in sorted(events.items()): days.setdefault(date,{})[cls]=items
for date in days: assert dt.date.fromisoformat(date).weekday()<5,date
data={'classes':['AP Chem','AP Lang','AP World'],'coverage':{c:[min(d for d in days if c in days[d]),max(d for d in days if c in days[d])] for c in ['AP Chem','AP Lang','AP World']},'days':days}
open('calendar-data.js','w',encoding='utf-8').write('// School calendar data, generated from the class calendars. Edit the sources and regenerate.\nwindow.SCHOOL_CALENDAR='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
# ---------- .ics (all-day events, one per class per day) ----------
def esc(s): return s.replace('\\','\\\\').replace(';','\\;').replace(',','\\,').replace('\n','\\n')
def fold(line):
    out=[];b=line.encode('utf-8')
    while len(b)>73:
        cut=73
        while (b[cut]&0xC0)==0x80: cut-=1
        out.append(b[:cut].decode('utf-8'));b=b' '+b[cut:]
    out.append(b.decode('utf-8'));return '\r\n'.join(out)
lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//my site//School calendar//EN','CALSCALE:GREGORIAN','X-WR-CALNAME:School calendar 2026-27']
for date,per in sorted(days.items()):
    d0=dt.date.fromisoformat(date)
    for cls,items in per.items():
        uid=hashlib.sha1((date+cls).encode()).hexdigest()[:20]+'@school-calendar'
        lines+=['BEGIN:VEVENT','UID:'+uid,'DTSTAMP:20261113T000000Z','DTSTART;VALUE=DATE:'+d0.strftime('%Y%m%d'),'DTEND;VALUE=DATE:'+(d0+dt.timedelta(1)).strftime('%Y%m%d'),fold('SUMMARY:'+esc(cls+': '+items[0]+(' (+%d)'%(len(items)-1) if len(items)>1 else ''))),fold('DESCRIPTION:'+esc('\n'.join(items))),'TRANSP:TRANSPARENT','END:VEVENT']
lines.append('END:VCALENDAR')
open('school-calendar.ics','w',encoding='utf-8',newline='').write('\r\n'.join(lines)+'\r\n')
print(len(days),'days',sum(len(p) for p in days.values()),'class-days',data['coverage'])
print(json.dumps(days['2026-11-16'],ensure_ascii=False)); print(json.dumps(days['2026-12-18'],ensure_ascii=False)); print(json.dumps(days['2026-11-25'],ensure_ascii=False))
