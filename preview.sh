#!/bin/sh
# 本地预览 Joker State（不依赖 Python）
cd "$(dirname "$0")"
PORT="${1:-5500}"
echo "Joker State → http://127.0.0.1:${PORT}/"
echo "按 Ctrl+C 停止"
exec node -e "
const http=require('http'),fs=require('fs'),path=require('path');
const root=process.cwd();
const port=Number(process.argv[1]||'5500');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.svg':'image/svg+xml','.ttf':'font/ttf'};
http.createServer((req,res)=>{
  const url=decodeURIComponent((req.url||'/').split('?')[0]);
  const rel=url==='/'?'/index.html':url;
  const p=path.normalize(path.join(root, rel));
  if(!p.startsWith(root)){ res.writeHead(403); return res.end(); }
  fs.readFile(p,(e,d)=>{
    if(e){ res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream','Cache-Control':'no-cache'});
    res.end(d);
  });
}).listen(port,'127.0.0.1',()=>console.log('OK http://127.0.0.1:'+port+'/'));
" "$PORT"
