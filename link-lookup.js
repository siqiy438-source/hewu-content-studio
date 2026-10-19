/* Work IDs remain strings: Douyin IDs exceed JavaScript's safe integer range. */
(function(root){
 'use strict';
 const ID=/^\d{17,20}$/;
 function normalize(text){return String(text||'').normalize('NFKC').toLowerCase().replace(/https?:\/\/[^\s<>"，。！；]+/gi,'').replace(/[^\p{L}\p{N}]/gu,'')}
 function parse(text){
  const ids=new Set(),shortUrls=[],profileUrls=[],urls=[];
  let value=String(text||'').trim();
  if(ID.test(value))ids.add(value);
  for(let n=0;n<2;n++){try{const decoded=decodeURIComponent(value);if(decoded===value)break;value=decoded}catch{break}}
  const candidates=value.match(/(?:https?:\/\/)?(?:(?:[\w-]+\.)*(?:douyin\.com|iesdouyin\.com)|siqiy438-source\.github\.io)(?:[\/?#][^\s<>"'，。！；）】]*)?/gi)||[];
  for(let candidate of candidates){
   candidate=candidate.replace(/[.,;!?)\]}>]+$/,'');
   try{
    const url=new URL(/^https?:\/\//i.test(candidate)?candidate:'https://'+candidate),host=url.hostname.toLowerCase();
    const douyin=host==='douyin.com'||host.endsWith('.douyin.com')||host==='iesdouyin.com'||host.endsWith('.iesdouyin.com');
    const studio=host==='siqiy438-source.github.io'&&url.pathname.startsWith('/hewu-content-studio/');
    if(!douyin&&!studio)continue;
    // Require an exact host boundary, even in a longer hostile-looking URL.
    const offset=value.indexOf(candidate);if(offset>0&&/[\w.@/-]/.test(value[offset-1]))continue;
    urls.push(url.href);
    if(host==='v.douyin.com'){shortUrls.push(url.href);continue}
    if(studio){const match=url.hash.match(/^#work\/(\d{17,20})$/);if(match)ids.add(match[1]);continue}
    const path=url.pathname.match(/^\/(?:share\/)?(?:video|note)\/(\d{17,20})(?:\/|$)/);if(path)ids.add(path[1]);
    for(const key of ['modal_id','aweme_id','item_id']){const id=url.searchParams.get(key);if(id&&ID.test(id))ids.add(id)}
    if(!path&&url.pathname.startsWith('/user/')&&!['modal_id','aweme_id','item_id'].some(k=>ID.test(url.searchParams.get(k)||'')))profileUrls.push(url.href);
   }catch{}
  }
  return {ids:[...ids],shortUrls:[...new Set(shortUrls)],profileUrls:[...new Set(profileUrls)],urls:[...new Set(urls)]};
 }
 function matchCaptions(text,entries){
  const query=normalize(text);if(query.length<2)return [];
  return entries.flatMap(entry=>{
   const title=normalize(entry.caption.split('#',1)[0]),whole=normalize(entry.caption);let score=0;
   if(whole.length>=12&&query.includes(whole))score=110+Math.min(whole.length,500)/1000;
   else if(title&&query===title)score=100;
   else if(title.length>=6&&query.includes(title))score=90+Math.min(title.length,50)/100;
   else if(title.length>=24&&query.includes(title.slice(0,24)))score=75;
   else if(query.length>=6&&title.includes(query))score=65;
   else if(query.length>=8&&whole.includes(query))score=60;
   return score?[{...entry,score}]:[];
  }).sort((a,b)=>b.score-a.score).filter((row,_,all)=>all[0].score>=110?row.score>=110:true);
 }
 const api={parse,normalize,matchCaptions};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.HewuLookup=api;
})(typeof window!=='undefined'?window:null);
