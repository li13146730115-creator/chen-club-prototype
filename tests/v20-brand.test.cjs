const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),load=require('./helpers/load.cjs');
const base=path.resolve(__dirname,'..'),extra=fs.existsSync(path.join(base,'v20-brand.js'))?['v20-brand.js']:[];
const setup=()=>load(extra);
test('AI 文字轮廓仅保留宸CLUB六个字形路径，不含左侧图标与背景图',()=>{
 const file=path.join(base,'assets/brand-reference/chen-wordmark.svg');assert.ok(fs.existsSync(file),'缺少AI字形资源');const svg=fs.readFileSync(file,'utf8');
 assert.equal((svg.match(/<path\b/g)||[]).length,6);assert.doesNotMatch(svg,/<image\b|<text\b/);assert.match(svg,/<title>宸CLUB<\/title>/);
});
test('首页和移动状态栏沿用AI字形并显示宸CLUB，项目名称和业务数据保留',()=>{
 const{A,go}=setup();const before=JSON.stringify({projects:A.projects,services:A.services,orders:A.S.orders,assets:A.S.assets});
 const h=go('U01');assert.match(h,/<a class="wordmark"[^]*?v20-brand-wordmark/);assert.match(h,/class="device-status"[^]*?aria-label="宸CLUB"/);
 assert.doesNotMatch(h,/CHEN CLUB|辰\s*CLUB|宸\s+(?:<span>)?CLUB/i);assert.ok(h.includes('北京宸园'));
 assert.equal(JSON.stringify({projects:A.projects,services:A.services,orders:A.S.orders,assets:A.S.assets}),before);
});
test('品牌格式化只替换可见字样，不改二维码协议、链接、表单值与会员资料',()=>{
 const{A}=setup();assert.ok(A.v20Brand,'品牌格式化尚未接入');
 const h='<p>宸 CLUB · CHEN CLUB</p><div data-qr="CHENCLUB:ORDER:bj:tea:T01"></div><input value="宸 CLUB"><a href="#/U38?invite=CHEN CLUB" aria-label="宸club服务">前往</a><b>北京宸园 · 宸享卡</b>';
 const result=A.v20Brand.formatHTML(h);assert.match(result,/<p>宸CLUB · 宸CLUB<\/p>/);for(const value of ['data-qr="CHENCLUB:ORDER:bj:tea:T01"','value="宸 CLUB"','href="#/U38?invite=CHEN CLUB"','北京宸园 · 宸享卡'])assert.ok(result.includes(value),value);
 assert.equal(A.v20Brand.formatHTML(result),result);
});
test('邀请函、登录页、活动月历与钱包商品中的品牌口径一致且没有独立品牌图标',()=>{
 const{A,go}=setup();const order=A.S.orders.find(o=>o.project===A.S.project&&o.paid&&o.status==='待履约'&&!o.children&&!o.cardOrder),invite=A.v14Experience.createInvitation(order.id);
 for(const route of ['U39','U37','U40?view=goods',invite.url.split('#/')[1]]){const h=go(route);assert.doesNotMatch(h,/CHEN CLUB|辰\s*CLUB|宸\s+(?:<span>)?CLUB/i,route);}
 assert.match(go('U39'),/class="v16-login-mark"[^]*?v20-brand-wordmark/);
 assert.match(go(invite.url.split('#/')[1]),/class="v14-invitation-mark"[^]*?v20-brand-wordmark/);
});
test('有效服务及商品详情的店铺品牌只展示原稿文字，不再使用单字图标',()=>{
 const{A,go}=setup();for(const route of ['U06?id=BJX01','U33?id=V07-bj-cola']){const h=go(route);assert.match(h,/class="v19-store-icon"[^]*?v20-brand-wordmark/);assert.doesNotMatch(h,/<div class="v19-store-icon">宸<\/div>/);}
});
test('桌码导出调用同一矢量字形，保留项目桌号及菜单的文本',()=>{
 const{A}=setup(),calls=[],labels=[];let context;const doc={createElement:()=>({getContext:()=>context})};context={fillRect(){},drawImage(){},fillText:t=>labels.push(t)};
 A.v20Brand.drawWordmark=(...args)=>{calls.push(args);return true;};A.v16QrCard({},'北京宸园','A01','茶室','茶室饮品','饮品',doc);
 assert.equal(calls.length,1);assert.equal(calls[0][0],context);assert.ok(labels.includes('北京宸园'));assert.ok(labels.includes('桌号  A01'));assert.ok(labels.includes('茶室饮品'));assert.ok(!labels.includes('宸CLUB'));
});
