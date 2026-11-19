const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),load=require('./helpers/load.cjs');
const base=path.resolve(__dirname,'..'),script=path.join(base,'v12-owner.js');
function setup(){
 const ctx=load([],{skipScripts:['v12-owner.js']}),listeners={};
 ctx.scope.document.addEventListener=(type,fn)=>(listeners[type]??=[]).push(fn);
 if(fs.existsSync(script))vm.runInContext(fs.readFileSync(script,'utf8'),ctx.scope,{filename:'v12-owner.js'});
 ctx.change=(name,value,id)=>{const target={name,value,dataset:{id},closest:()=>name.startsWith('proxy-')?null:{dataset:{form:'v07-submit'}}};for(const fn of listeners.change||[])fn({target});};
 return ctx;
}
const screen=h=>h.match(/<main class="mobile-screen"[^>]*>([\s\S]*?)<\/main>/)?.[1]||h;
const followCount=h=>(h.match(/class="v11-follow-card"/g)||[]).length;
// Replay every script after installing the event bus so legacy delegated listeners
// and Club.start's click handler participate, just as they do in the browser.
function eventSetup(){
 const ctx=load(),{scope,nodes}=ctx,events={},windowEvents={};let markup='',elements=[];
 scope.document.addEventListener=(type,fn)=>(events[type]??=[]).push(fn);
 scope.document.dispatchEvent=e=>{for(const fn of events[e.type]||[])fn(e);};
 scope.addEventListener=(type,fn)=>(windowEvents[type]??=[]).push(fn);
 function current(){
  if(markup===nodes.app.innerHTML)return elements;markup=nodes.app.innerHTML;
  elements=[...markup.matchAll(/<(input|button)\b([^>]*)>/g)].map(m=>{const attrs=Object.fromEntries([...m[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]])),el={name:attrs.name||'',value:attrs.value||'',dataset:Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v])),form:null,attrs};el.hasAttribute=k=>Object.hasOwn(attrs,k);el.matches=s=>s.split(',').some(x=>x.includes('[name="'+el.name+'"]')||x==='[data-action]'&&!!el.dataset.action);el.closest=s=>s==='[data-action]'&&el.dataset.action?el:null;return el;});return elements;
 }
 scope.document.querySelectorAll=s=>current().filter(el=>el.matches(s));
 scope.document.querySelector=s=>scope.document.querySelectorAll(s)[0]||null;
 for(const m of fs.readFileSync(path.join(base,'index.html'),'utf8').matchAll(/<script src="([^?]+)\?/g))if(!m[1].startsWith('assets/'))vm.runInContext(fs.readFileSync(path.join(base,m[1]),'utf8'),scope,{filename:m[1]});
 scope.Club.start();ctx.A=scope.Club;
 ctx.emit=(type,target)=>scope.document.dispatchEvent({type,target,preventDefault(){}});
 ctx.fill=(name,value,type='input')=>{const el=current().find(e=>e.name===name);assert.ok(el,'找不到字段 '+name);el.value=value;ctx.emit(type,el);};
 ctx.click=(action,data={})=>{const el=current().find(e=>e.dataset.action===action&&Object.entries(data).every(([k,v])=>e.dataset[k]===v));assert.ok(el,'找不到按钮 '+action);ctx.emit('click',el);for(const fn of windowEvents.hashchange||[])fn();};
 ctx.go=route=>{scope.location.hash='#/'+route;scope.Club.render();return nodes.app.innerHTML;};
 return ctx;
}
function prepareBooking(ctx,route='S03'){
 const {A,go}=ctx,M=A.v07;go(route);A.actions['v07-proxy-service']({id:'BJX19'});go(route+'?step=2');
 Object.assign(M.B.proxy.selections.BJX19,{date:M.iso(new Date(Date.now()+86400000)),times:['18:00']});
 return M;
}

test('V0.9 Word-3 每个会所首次进入我的关注有至少五条商品及服务和店铺演示',()=>{
 const {A,go}=setup();for(const project of Object.keys(A.projects)){A.S.project=project;A.filters.v11FollowTab='商品与服务';const h=screen(go('U36'));assert.ok(followCount(h)>=5,project+'关注数据不足五条');assert.match(h,/<small>商品<\/small>/);assert.match(h,/<small>服务<\/small>/);}
 A.filters.v11FollowTab='店铺';assert.ok(followCount(screen(go('U36')))>=1);
});
test('V0.9 Word-3 取消演示关注后反复进入及重新载入不会自动加回',()=>{
 const ctx=setup(),{A,go,scope}=ctx;go('U36');const item=A.S.favorites.find(id=>A.services.some(s=>s.project===A.S.project&&s.id===id));assert.ok(item);A.actions.favorite({id:item});
 const shop=A.S.v11FollowedShops?.[0];assert.ok(shop);A.actions['v11-follow-shop']({project:shop});for(let n=0;n<3;n++){go('U12');go('U36');assert.ok(!A.S.favorites.includes(item));assert.ok(!A.S.v11FollowedShops.includes(shop));}
 const saved=JSON.stringify(A.S);scope.localStorage.getItem=()=>saved;
 for(const m of fs.readFileSync(path.join(base,'index.html'),'utf8').matchAll(/<script src="([^?]+)\?/g))if(!m[1].startsWith('assets/')&&m[1]!=='v12-owner.js')vm.runInContext(fs.readFileSync(path.join(base,m[1]),'utf8'),scope,{filename:m[1]});
 if(fs.existsSync(script))vm.runInContext(fs.readFileSync(script,'utf8'),scope,{filename:'v12-owner.js'});scope.location.hash='#/U36';scope.Club.render();assert.ok(!scope.Club.S.favorites.includes(item));assert.ok(!scope.Club.S.v11FollowedShops.includes(shop));
});
test('V0.9 Word-8 员工预约日期页展示联系人电话，核对后保留到选券确认页',()=>{
 const ctx=setup(),{A,go}=ctx,M=prepareBooking(ctx);const h=screen(go('S03?step=2'));assert.match(h,/name="proxy-name"/);assert.match(h,/name="proxy-phone"/);
 ctx.change('proxy-name','周女士','BJX19');ctx.change('proxy-phone','13900001234','BJX19');A.actions['v07-proxy-confirm']({mode:'booking'});assert.equal(M.B.checkout.name,'周女士');assert.equal(M.B.checkout.phone,'13900001234');
 A.actions['v07-member-select']({id:M.members()[0].id});const confirm=screen(go('S03?step=4'));assert.match(confirm,/name="name"[^>]*value="周女士"/);assert.match(confirm,/name="phone"[^>]*value="13900001234"/);
});
test('V0.9 Word-8 员工已选会员的预约确认仍可修改联系人电话并写入订单',()=>{
 const ctx=setup(),{A,go}=ctx,M=prepareBooking(ctx);A.actions['v07-proxy-confirm']({mode:'booking'});const member=M.members()[0];A.actions['v07-member-select']({id:member.id});const h=screen(go('S03?step=4'));assert.match(h,/name="name"/);assert.match(h,/name="phone"/);
 A.forms['v07-submit']({name:'到场联系人',phone:'13900001234',remark:'请电话联系'});const group=M.B.groups[0],order=A.S.orders.find(o=>o.id===group.orderIds[0]);assert.equal(order.memberId,member.id);assert.equal(order.user,'到场联系人');assert.equal(order.phone,'13900001234');assert.equal(group.contact.user,'到场联系人');assert.equal(group.checkoutSnapshot.name,'到场联系人');assert.match(screen(go('S08?id='+order.id)),/到场联系人[\s\S]*13900001234/);
});
test('V0.9 Word-8 代客预约拒绝空联系人和无效电话，不创建订单',()=>{
 for(const invalid of [{name:'',phone:'13900001234'},{name:'周女士',phone:'123'}]){const ctx=setup(),{A}=ctx,M=prepareBooking(ctx);A.actions['v07-proxy-confirm']({mode:'booking'});A.actions['v07-member-select']({id:M.members()[0].id});ctx.go('S03?step=4');const before=A.S.orders.length;assert.throws(()=>A.forms['v07-submit'](invalid),/联系|姓名|电话/);assert.equal(A.S.orders.length,before);assert.ok(M.B.checkout);}
});
test('V0.9 Word-8 确认页修改联系人后返回预约或选择卡券均保留新值',()=>{
 const ctx=setup(),{A,go}=ctx,M=prepareBooking(ctx);A.actions['v07-proxy-confirm']({mode:'booking'});A.actions['v07-member-select']({id:M.members()[0].id});go('S03?step=4');ctx.change('name','本次到场人');ctx.change('phone','13900009876');
 const review=screen(go('S03?step=2'));assert.match(review,/name="proxy-name"[^>]*value="本次到场人"/);assert.match(review,/name="proxy-phone"[^>]*value="13900009876"/);A.actions['v07-proxy-confirm']({mode:'booking'});assert.equal(M.B.checkout.name,'本次到场人');assert.equal(M.B.checkout.phone,'13900009876');go('S03?step=4');A.actions['v08-coupon-open']({context:'checkout'});A.actions['v08-coupon-done']();assert.match(screen(go('S03?step=4')),/name="name"[^>]*value="本次到场人"/);
});
test('V0.9 Word-8 选中会员预填其联系资料，已保存的掩码手机号可正常下单',()=>{
 const ctx=setup(),{A,go}=ctx,M=prepareBooking(ctx);A.actions['v07-proxy-confirm']({mode:'booking'});const m=M.members()[0];A.actions['v07-member-select']({id:m.id});const h=screen(go('S03?step=4'));assert.ok(h.match(/<input[^>]*name="name"[^>]*>/)[0].includes('value="'+m.name+'"'));assert.ok(h.match(/<input[^>]*name="phone"[^>]*>/)[0].includes('value="'+m.phone+'"'));A.forms['v07-submit']({name:m.name,phone:m.phone});const g=M.B.groups[0],o=A.S.orders.find(o=>o.id===g.orderIds[0]);assert.equal(o.user,m.name);assert.equal(o.phone,m.phone);
});
test('V0.9 Word-8 会员自主预约已有联系信息，确认与订单仍保留实际使用人',()=>{
 const {A,go}=setup(),M=A.v07;const h=screen(go('U07?id=BJX19'));assert.match(h,/name="user"/);assert.match(h,/name="phone"/);const d=M.B.ownerDraft;A.forms['book-draft']({...d,user:'陈先生',phone:'13900005678',asset:'',date:M.iso(new Date(Date.now()+86400000)),time:'18:00',times:['18:00']});assert.match(screen(go('U08')),/陈先生[\s\S]*13900005678/);A.forms['place-order']({agreed:'yes'});const group=M.B.groups[0],order=A.S.orders.find(o=>o.id===group.orderIds[0]);assert.equal(order.user,'陈先生');assert.equal(order.phone,'13900005678');
});
test('V0.9 Word-8 全脚本输入事件保存未失焦联系人，重绘和选择会员后不覆盖',()=>{
 const ctx=eventSetup(),{A,go}=ctx;go('S03');ctx.click('v07-proxy-service',{id:'BJX19'});ctx.click('v07-proxy-next',{mode:'booking'});ctx.fill('proxy-name','陈女士');ctx.fill('proxy-phone','13900001111');
 // Selecting the time redraws the page while both inputs are still uncommitted.
 ctx.click('v07-time',{value:'18:00'});assert.match(screen(go('S03?step=2')),/name="proxy-name"[^>]*value="陈女士"/);ctx.click('v07-proxy-confirm',{mode:'booking'});ctx.click('v07-member-select',{id:A.v07.members()[0].id});const h=screen(go('S03?step=4'));assert.match(h,/name="name"[^>]*value="陈女士"/);assert.match(h,/name="phone"[^>]*value="13900001111"/);
});
test('V0.9 Word-8 全脚本点击下一步直接捕获当前输入，不依赖失焦事件',()=>{
 const ctx=eventSetup(),{A,go}=ctx;go('S03');ctx.click('v07-proxy-service',{id:'BJX19'});ctx.click('v07-proxy-next',{mode:'booking'});ctx.click('v07-time',{value:'18:00'});ctx.fill('proxy-name','陈女士','uncommitted');ctx.fill('proxy-phone','13900001111','uncommitted');ctx.click('v07-proxy-confirm',{mode:'booking'});ctx.click('v07-member-select',{id:A.v07.members()[0].id});const h=screen(go('S03?step=4'));assert.match(h,/name="name"[^>]*value="陈女士"/);assert.match(h,/name="phone"[^>]*value="13900001111"/);
});
