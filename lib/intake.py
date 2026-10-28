import sys, json, zipfile, io, pathlib, subprocess, hashlib, base64
name=sys.argv[1];data=sys.stdin.buffer.read(25*1024*1024+1)
if len(data)>25*1024*1024: raise ValueError('Maximum upload size is 25 MB')
files=[];allowed={'.pdf','.docx','.xlsx','.txt','.csv'}
if pathlib.Path(name).suffix.lower()=='.zip':
 with zipfile.ZipFile(io.BytesIO(data)) as z:
  entries=[e for e in z.infolist() if not e.is_dir()]
  if len(entries)>100 or sum(e.file_size for e in entries)>80*1024*1024: raise ValueError('ZIP exceeds 100 files or 80 MB expanded')
  for e in entries:
   if pathlib.PurePosixPath(e.filename).is_absolute() or '..' in pathlib.PurePosixPath(e.filename).parts: raise ValueError('Unsafe ZIP path')
   if e.file_size>10*1024*1024: raise ValueError('An individual file exceeds 10 MB')
   files.append((e.filename,z.read(e)))
else:
 if len(data)>10*1024*1024: raise ValueError('Maximum individual file size is 10 MB')
 files=[(name,data)]
results=[];skipped=[]
for filename,blob in files:
 ext=pathlib.Path(filename).suffix.lower()
 if ext not in allowed:
  skipped.append(filename+': unsupported format');continue
 try:
  run=subprocess.run([sys.executable,str(pathlib.Path(__file__).with_name('extract.py')),ext],input=blob,capture_output=True,timeout=25)
  if run.returncode: raise ValueError('Unreadable or encrypted file')
  extracted=json.loads(run.stdout)
  results.append({'name':pathlib.PurePosixPath(filename).name,'path':filename,'extension':ext,'size':len(blob),'hash':hashlib.sha256(blob).hexdigest(),'text':extracted['text'][:80000],'warning':extracted.get('warning','') or ('Excerpt limited to 80,000 characters. Review the original.' if len(extracted['text'])>80000 else ''),'bytes':base64.b64encode(blob).decode()})
 except Exception as e:
  skipped.append(filename+': extraction failed; try an accessible copy or a TXT excerpt')
print(json.dumps({'documents':results,'skipped':skipped}))
