import sys, io, zipfile, json, subprocess, tempfile, pathlib
import xml.etree.ElementTree as E
kind=sys.argv[1]; data=sys.stdin.buffer.read(10*1024*1024+1)
if len(data)>10*1024*1024: raise ValueError('File too large')
lines=[]
if kind=='.pdf':
 with tempfile.TemporaryDirectory() as d:
  p=pathlib.Path(d)/'source.pdf';p.write_bytes(data)
  r=subprocess.run(['pdftotext','-layout',str(p),'-'],capture_output=True,timeout=20,check=True)
  lines=['PDF page '+str(i+1)+'\n'+page for i,page in enumerate(r.stdout.decode('utf-8',errors='replace').split('\f')) if page.strip()]
elif kind in ('.docx','.xlsx'):
 with zipfile.ZipFile(io.BytesIO(data)) as z:
  if sum(i.file_size for i in z.infolist())>40*1024*1024: raise ValueError('Expanded file too large')
  if kind=='.docx':
   root=E.fromstring(z.read('word/document.xml'))
   lines=[' '.join(t.text or '' for t in p.iter() if t.tag.endswith('}t')) for p in root.iter() if p.tag.endswith('}p')]
  else:
   ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
   strings=[]
   if 'xl/sharedStrings.xml' in z.namelist(): strings=[''.join(t.text or '' for t in n.iter() if t.tag.endswith('}t')) for n in E.fromstring(z.read('xl/sharedStrings.xml'))]
   rels={n.attrib['Id']:n.attrib['Target'] for n in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
   for sheet in E.fromstring(z.read('xl/workbook.xml')).find('s:sheets',ns):
    target=rels[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
    target=target.lstrip('/') if target.startswith('/') else 'xl/'+target
    lines.append('Sheet: '+sheet.attrib['name']+' (cached cell values; formulas are not recalculated)')
    for row in E.fromstring(z.read(target)).findall('.//s:sheetData/s:row',ns):
     values=[]
     for c in row:
      v=c.findtext('s:v',default='',namespaces=ns)
      if c.attrib.get('t')=='s': v=strings[int(v)] if v else ''
      elif c.attrib.get('t')=='inlineStr': v=''.join(t.text or '' for t in c.iter() if t.tag.endswith('}t'))
      if v: values.append(c.attrib.get('r','')+': '+v)
     if values: lines.append(' | '.join(values))
else: lines=[data.decode('utf-8',errors='replace')]
text='\n'.join(lines).strip();print(json.dumps({'text':text[:500000], 'truncated':len(text)>500000, 'warning': '' if text else 'No readable text. This document may need OCR or a manually entered excerpt.'}))
