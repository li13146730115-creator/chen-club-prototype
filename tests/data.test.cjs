const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..');const scope={URLSearchParams,localStorage:{getItem:()=>null},console};scope.window=scope;vm.createContext(scope);
for(const file of ['data.js','core.js','app.js','catalog.js'])vm.runInContext(fs.readFileSync(path.join(base,file),'utf8'),scope,{filename:file});
const A=scope.Club,R=scope.CLUB_RESEARCH;
test('客户资料49条权益、65条价格及33项缺口完整保留',()=>{
 assert.equal(R['场景权益矩阵'].rows.length,49);assert.equal(R['权益与价格明细'].rows.length,65);assert.equal(R['资料补充清单'].rows.length,33);
 assert.equal(A.pages.length,37);assert.equal(A.services.filter(s=>s.project==='zx').length,28);assert.equal(A.services.filter(s=>s.project==='bj').length,21);
});
test('两会所茶室同158元但计价时长不同，会员赠时待核不擅自免单',()=>{
 const bj=A.services.find(s=>s.project==='bj'&&s.name==='茶室'),zx=A.services.find(s=>s.project==='zx'&&s.name==='茶室');
 assert.equal(A.offer(bj,'na').amount,15800);assert.equal(A.offer(bj,'na').duration,120);
 assert.equal(A.offer(zx,'na').amount,15800);assert.equal(A.offer(zx,'na').duration,60);
 assert.equal(A.offer(bj,'ma').amount,null);assert.equal(A.offer(zx,'nc').amount,null);
});
test('场地免费不扩展为私教和SPA免费，儿童未列明不免费',()=>{
 const yoga=A.services.filter(s=>s.project==='bj'&&s.name==='瑜伽室');
 assert.equal(A.offer(yoga.find(s=>s.kind.includes('私教')),'ma').amount,null);
 assert.equal(A.offer(yoga.find(s=>!s.kind.includes('私教')),'ma').amount,0);
 assert.equal(A.offer(yoga.find(s=>!s.kind.includes('私教')),'mc').amount,null);
 const spa=A.services.find(s=>s.project==='bj'&&s.name.includes('SPA'));assert.equal(A.offer(spa,'ma').amount,null);
});
test('异常1801和北京80元附加费保留，紫京女王空间有会籍次数口径',()=>{
 assert.ok(R['权益与价格明细'].rows.some(r=>r[1]==='紫京宸园'&&r[5]===1801));
 assert.ok(R['权益与价格明细'].rows.some(r=>r[1]==='北京宸园'&&r[5]===80));
 const queen=A.services.find(s=>s.project==='zx'&&s.name==='女王空间');assert.match(queen.rights[0],/权益次数/);
 assert.equal(A.offer(queen,'ma').amount,null);
});
test('中建基础运动免预约且不套其他会所价',()=>{
 const list=A.services.filter(s=>s.project==='zj');assert.equal(list.length,7);
 for(const s of list){assert.equal(A.offer(s,'na').amount,null)}
 assert.equal(A.offer(list[0],'ma').arrival,true);assert.equal(A.offer(list[1],'ma').arrival,true);
});

test('前台价目按会所匹配，所有65条来源价目均可在服务详情查到',()=>{
 const seen=new Set();
 for(const svc of A.services){for(const r of A.priceRows(svc)){assert.equal(r[1],A.projects[svc.project]);seen.add(r[0]);}}
 assert.equal(seen.size,65);
});
test('公共空间非会籍免费不误标为会籍权益，私教按当前身份价格展示',()=>{
 const gallery=A.services.find(s=>s.project==='bj'&&s.name==='艺廊展示区');
 const fencing=A.services.find(s=>s.project==='bj'&&s.name==='击剑室'&&s.kind==='私教课');
 A.S.guest=false;A.S.identity='na';assert.equal(A.quote(gallery).title,'场地免费');assert.equal(A.quote(fencing).title,'¥560');
 A.S.identity='mc';assert.equal(A.quote(fencing).title,'¥420');
 A.S.identity='ma';
});
test('北京SPA显示原价，紫京会籍权益不虚构次数和赠券',()=>{
 const spa=A.services.find(s=>s.project==='bj'&&s.name.includes('SPA'));assert.match(A.quote(spa).title,/原价/);
 assert.ok(A.benefits('bj').some(b=>b.title==='会议室赠时'&&b.value==='4'));
 assert.ok(A.benefits('bj').some(b=>b.title==='棋牌室赠时'&&b.value==='12'));
 assert.ok(!A.benefits('zx').some(b=>/咖啡|特调/.test(b.title)));
});
test('泳池与其它运动场地详情不混入私教价目，课程仍可查全价目',()=>{for(const s of A.services.filter(s=>s.category.includes('运动')&&!s.kind.includes('私教'))){assert.ok(A.priceRows(s).every(r=>!r[3].includes('课')),s.id+' 场地不应展示私教');}assert.equal(A.priceRows(A.services.find(s=>s.id==='BJX02')).length,2);});
