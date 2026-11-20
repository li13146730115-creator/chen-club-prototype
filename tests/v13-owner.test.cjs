const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),load=require('./helpers/load.cjs');
const setup=()=>load(fs.existsSync(path.resolve(__dirname,'../v13-owner.js'))?['v13-owner.js']:[]);
const screen=h=>h.match(/<main class="mobile-screen"[^>]*>([\s\S]*?)<\/main>/)?.[1]||h;
function ownerBooking(ctx){const {A,go}=ctx,M=A.v07;go('U07?id=BJX17');const d=M.B.ownerDraft,c=A.v08.bookingCoupons(M.service(d.service)).find(c=>c.unit==='小时');assert.ok(c);d.asset=c.key;d.couponQuantities={[c.id]:1};d.date=M.iso(new Date(Date.now()+86400000*3));d.times=['09:00'];d.resource='BJX17-2';return {M,d,c};}

test('Word V0.10 手机自主预约可选择卡券数量，返回后保留并按数量计价、支付扣减及退款返还',()=>{
 const ctx=setup(),{A,go}=ctx,{M,d,c}=ownerBooking(ctx),before=A.S.assets.find(a=>'ASSET:'+a.id===c.id).remaining;
 A.actions['v08-coupon-open']({context:'booking'});let h=screen(go('U31'));assert.match(h,/data-action="v11-coupon-qty"/);assert.match(h,/本次使用/);
 A.actions['v11-coupon-qty']({id:c.key,delta:1});A.actions['v08-coupon-done']();assert.equal(M.B.ownerDraft.couponQuantities[c.id],2);assert.match(ctx.scope.location.hash,/^#\/U07\?id=BJX17/);go(ctx.scope.location.hash.slice(2));
 A.actions['v08-coupon-open']({context:'booking'});assert.equal(M.B.couponPicker.quantities[c.key],2);A.actions['v08-coupon-done']();
 A.forms['book-draft']({...d,user:'林女士',phone:'13900001234',asset:c.key,time:'09:00',times:['09:00']});
 const checkout=A.draft.v07Checkout,q=M.quote(checkout);assert.equal(checkout.couponQuantities[c.id],2);assert.equal(q.used.find(x=>x.id===c.id).quantity,2);assert.equal(q.total,38000);assert.equal(A.draft.amount,q.total);assert.match(screen(go('U08')),/¥380\.00/);
 A.forms['place-order']({agreed:'yes'});const g=M.B.groups[0];assert.equal(g.total,38000);assert.equal(g.used.find(x=>x.id===c.id).quantity,2);assert.equal(A.S.assets.find(a=>'ASSET:'+a.id===c.id).remaining,before);
 M.pay(g.id,'online');assert.equal(A.S.assets.find(a=>'ASSET:'+a.id===c.id).remaining,before-2);assert.throws(()=>M.submit({...checkout,coupons:[],couponQuantities:{}}),/占用/);
 assert.throws(()=>A.C.cancel(A.S,g.orderIds[0]),/退款/);A.C.refund(A.S,g.orderIds[0],g.total);assert.equal(A.S.assets.find(a=>'ASSET:'+a.id===c.id).remaining,before);
});
test('Word V0.10 手机预约拒绝超余额数量并允许不使用卡券',()=>{
 const ctx=setup(),{A}=ctx,{M,c}=ownerBooking(ctx);A.actions['v08-coupon-open']({context:'booking'});assert.throws(()=>A.actions['v11-coupon-qty']({id:c.key,delta:c.remaining}),/数量|余额/);assert.equal(M.B.couponPicker.quantities[c.key],1);A.actions['v08-coupon-none']();A.actions['v08-coupon-done']();assert.equal(M.B.ownerDraft.asset,'');assert.deepEqual({...M.B.ownerDraft.couponQuantities},{});
});
test('Word V0.10 预约券数量同时受单次需求及余额限制，金额券单次限一张',()=>{
 const ctx=setup(),{A,go}=ctx,{M,d}=ownerBooking(ctx);A.v12Pricing.seedServiceCoupons();A.actions['v08-coupon-open']({context:'booking'});const c=A.v08.bookingCoupons(M.service(d.service)).find(c=>c.unit==='张');assert.ok(c);A.actions['v11-coupon-toggle']({id:c.key});assert.throws(()=>A.actions['v11-coupon-qty']({id:c.key,delta:1}),/数量/);A.actions['v08-coupon-done']();assert.equal(M.B.ownerDraft.couponQuantities[c.id],1);
 const hours=M.coupons(A.v08.me().id,[{item:'BJX17',variant:'standard'}]).find(c=>c.unit==='小时'),asset=A.S.assets.find(a=>'ASSET:'+a.id===hours.id);asset.remaining=asset.total=10;
 M.B.checkout={kind:'booking',memberId:A.v08.me().id,operator:true,lines:[{item:'BJX17',variant:'standard',date:d.date,time:'09:00',resource:d.resource,qty:1,people:1}],coupons:[hours.id],couponQuantities:{[hours.id]:1}};go('S03?step=4');A.actions['v08-coupon-open']({context:'checkout'});go('S15');assert.throws(()=>A.actions['v11-coupon-qty']({id:hours.id,delta:4}),/数量/);
 const cash={...asset,id:'V13-CASH',couponType:'代金券',unit:'张',value:10,remaining:5,total:5};A.S.assets.push(cash);A.actions['v11-coupon-toggle']({id:'ASSET:'+cash.id});assert.throws(()=>A.actions['v11-coupon-qty']({id:'ASSET:'+cash.id,delta:1}),/数量/);
});
test('Word V0.10 代客多券共享本次预约需求，页面数量与实际抵扣一致',()=>{
 const ctx=setup(),{A,go}=ctx,{M,d,c}=ownerBooking(ctx),asset=A.S.assets.find(a=>'ASSET:'+a.id===c.id),extra={...asset,id:'V13-EXTRA-HOURS'};asset.remaining=asset.total=10;A.S.assets.push(extra);const id2='ASSET:'+extra.id;
 M.B.checkout={kind:'booking',memberId:A.v08.me().id,operator:true,lines:[{item:'BJX17',variant:'standard',date:d.date,time:'09:00',resource:d.resource,qty:1,people:1}],coupons:[c.id],couponQuantities:{[c.id]:2}};go('S03?step=4');A.actions['v08-coupon-open']({context:'checkout'});go('S15');A.actions['v11-coupon-toggle']({id:id2});A.actions['v11-coupon-qty']({id:c.id,delta:1});assert.throws(()=>A.actions['v11-coupon-qty']({id:c.id,delta:1}),/数量/);A.actions['v08-coupon-done']();
 const checkout=M.B.checkout,q=M.quote(checkout);assert.equal(q.total,0);assert.equal(checkout.couponQuantities[c.id],3);assert.equal(checkout.couponQuantities[id2],1);for(const u of q.used)assert.equal(checkout.couponQuantities[u.id],u.quantity);
});
test('Word V0.10 多预约时段按总时长限制，免费预约不显示虚构用券数量',()=>{
 const ctx=setup(),{A,go}=ctx,{M,d,c}=ownerBooking(ctx),asset=A.S.assets.find(a=>'ASSET:'+a.id===c.id);asset.remaining=asset.total=10;d.times=['09:00','18:00'];A.actions['v08-coupon-open']({context:'booking'});go('U31');A.actions['v11-coupon-qty']({id:c.key,delta:7});assert.equal(M.B.couponPicker.quantities[c.key],8);assert.throws(()=>A.actions['v11-coupon-qty']({id:c.key,delta:1}),/数量/);
 go('U07?id=BJX01');A.actions['v08-coupon-open']({context:'booking'});const h=screen(go('U31'));assert.equal(M.B.couponPicker.selected.length,0);assert.doesNotMatch(h,/class="v11-coupon-use"/);assert.match(h,/本次最多 0/);A.actions['v08-coupon-done']();assert.equal(M.B.ownerDraft.asset,'');
});
test('Word V0.10 共享预约选券仍遵守员工退出登录状态',()=>{
 const ctx=setup(),{A,go}=ctx,{M,d,c}=ownerBooking(ctx);M.B.checkout={kind:'booking',memberId:A.v08.me().id,operator:true,lines:[{item:'BJX17',variant:'standard',date:d.date,time:'09:00',resource:d.resource,qty:1,people:1}],coupons:[c.id]};go('S03?step=4');A.actions['v08-coupon-open']({context:'checkout'});M.B.loggedOut=true;const h=screen(go('S15'));assert.match(h,/已退出登录/);assert.doesNotMatch(h,/data-action="v11-coupon-qty"/);
});
test('Word V0.10 S15及A31预约共享选券数量、返回路由与真实支付扣减',()=>{
 for(const route of ['S15','A31']){const {A,go,scope}=setup(),M=A.v07,m=A.v08.me(),c=M.coupons(m.id,[{item:'BJX17',variant:'standard'}]).find(c=>c.unit==='小时'),a=A.S.assets.find(a=>'ASSET:'+a.id===c.id),before=a.remaining;
  M.B.checkout={kind:'booking',memberId:m.id,operator:true,name:m.name,phone:m.phone,lines:[{item:'BJX17',variant:'standard',date:M.iso(new Date(Date.now()+86400000*4)),time:'09:00',resource:'BJX17-2',qty:1,people:1}],coupons:[c.id],couponQuantities:{[c.id]:1}};
  go(route==='S15'?'S03?step=4':'A27?step=4');A.actions['v08-coupon-open']({context:'checkout'});assert.match(screen(go(route)),/data-action="v11-coupon-qty"/);A.actions['v11-coupon-qty']({id:c.id,delta:1});A.actions['v08-coupon-done']();assert.equal(M.B.checkout.couponQuantities[c.id],2);assert.match(screen(go(scope.location.hash.slice(2))),/本次使用 2 小时/);assert.equal(A.params.get('step'),'4');const g=M.submit(M.B.checkout);assert.equal(g.used.find(x=>x.id===c.id).quantity,2);assert.equal(g.total,38000);M.pay(g.id,'offline');assert.equal(a.remaining,before-2);
 }
});
test('Word V0.10 免费服务和免费商品都有价格，未知价格显示查看详情，展示不改变真实报价',()=>{
 const {A,go}=setup(),M=A.v07,s=M.service('BJX01'),before=JSON.stringify(A.offer(s));
 assert.match(A.quote(s).title,/¥0\.00\/次/);assert.match(screen(go('U01')),/home-today-info[\s\S]*?¥0\.00\/次/);assert.match(screen(go('U01')),/home-video-row[\s\S]*?¥0\.00\/次/);assert.match(screen(go('U05')),/¥0\.00\/次/);assert.match(screen(go('U06?id='+s.id)),/v19-price[^>]*>¥0\.00\/次/);
 // V0.11 supersedes V0.10 wallet price display; transactional quotes retain prices.
 for(const r of ['U03','U20'])assert.doesNotMatch(screen(go(r)),/v13-benefit-price|v20-member-price[^>]*>¥0\.00\/次/);
 assert.equal(JSON.stringify(A.offer(s)),before);
 const p=A.v09.raw('V07-bj-cola'),m=A.v08.me();A.v10.setPrice({project:'bj',item:p.id,skuId:'default',planId:m.planIds[0],price:0});assert.match(screen(go('U33?id='+p.id)),/v19-price[^>]*>¥0\.00/);assert.equal(M.quote({kind:'retail',memberId:m.id,lines:[{item:p.id,qty:1}],coupons:[]}).total,0);
 A.S.project='zx';const unknown=M.service('ZJX07');assert.equal(A.offer(unknown).amount,null);assert.equal(A.quote(unknown).title,'查看详情');assert.match(screen(go('U06?id='+unknown.id)),/v19-price[^>]*>查看详情/);assert.equal(A.offer(unknown).amount,null);
});
test('Word V0.10 服务卡隐藏已购名称标签，保留次卡资产、来源与购买入口',()=>{
 const {A,go}=setup(),M=A.v07,a=A.S.assets.find(a=>a.project==='bj'&&/已购/.test(a.name));assert.ok(a);const name=a.name,remaining=a.remaining;A.filters.v09Category='休闲康养';
 for(const r of ['U03','U20'])assert.doesNotMatch(screen(go(r)),/[（(]已购(?:演示)?[）)]/);
 assert.equal(a.name,name);assert.equal(a.remaining,remaining);assert.ok(M.products().some(p=>p.passService));assert.ok(A.actions['v07-buy-pass']);
 const pass=M.products().find(p=>p.passService),g=M.submit({kind:'retail',memberId:A.v08.me().id,lines:[{item:pass.id,qty:1}],coupons:[]});M.pay(g.id,'online');assert.ok(A.S.assets.some(a=>a.purchaseOrder===g.orderIds[0]&&a.passService===pass.passService));
 assert.equal(A.v13Owner.labels('<span>已购</span><h3>服务次卡（已购）</h3><p>已购买总金额 ¥100.00</p>'),'<h3>服务次卡</h3><p>已购买总金额 ¥100.00</p>');
});
test('Word V0.10 单次价格只保留预约时长说明，首页两种场景样式与副文案一致',()=>{
 const {A,go}=setup(),M=A.v07,s=M.service('BJX02'),tea=M.service('BJX19'),before=JSON.stringify(A.offer(tea));
 assert.equal(A.quote(s).sub,'每次1小时');assert.equal(A.quote(tea).sub,'每次2小时');
 for(const type of ['water','dining','today'])for(const style of [0,1]){
  const c={...A.v11Decoration.draft('home').components.find(c=>c.type===type),type,visible:true,style,v11Style:true,ids:[s.id,tea.id],count:2};
  const h=A.decor.component(c,true,true);assert.doesNotMatch(h,/¥[\d,.]+\/次\s*(?:·\s*)?[／/]\s*(?:\d+)?(?:小时|次|节|位)/);
  if(type!=='today')assert.match(h,/每次[12]小时/);
 }
 const home=screen(go('U01'));assert.doesNotMatch(home,/¥[\d,.]+\/次\s*(?:·\s*)?／/);assert.match(home,/场地使用 · 私教另计/);assert.match(home,/8—10人 · 午晚通用/);assert.equal(JSON.stringify(A.offer(tea)),before);
});
test('Word V0.10 30与45分钟预约的小时券可按实际时长选用、支付扣减并退款返还',()=>{
 for(const duration of [30,45]){
  const {A,go}=setup(),M=A.v07,m=A.v08.me(),id='V13-SHORT-'+duration,s={...M.service('BJX01'),id,name:duration+'分钟短时预约',kind:'场地使用',rights:['价格待配置','价格待配置','价格待配置','价格待配置']};A.services.push(s);A.S.v02.v03.merchantServices[id]={v12DemoPrice:12000,v12DemoDuration:duration};
  const asset={id:'V13-HOURS',project:'bj',memberId:m.id,item:id,passService:id,services:[id],name:'短时预约小时券',couponType:'兑换券',remaining:2,total:2,unit:'小时',expiry:m.expiry,status:'可用'};A.S.assets.push(asset);go('U07?id='+id);const d=M.B.ownerDraft,c=A.v08.bookingCoupons(s).find(c=>c.id==='ASSET:'+asset.id);assert.ok(c);d.asset=c.key;d.date=M.iso(new Date(Date.now()+86400000*5));d.times=['09:00'];d.resource=id+'-2';
  A.actions['v08-coupon-open']({context:'booking'});const h=screen(go('U31'));assert.match(h,new RegExp('本次最多 '+duration/60+' 小时'));assert.equal(M.B.couponPicker.quantities[c.key],duration/60);assert.match(h,/data-delta="-0.25"/);
  A.actions['v11-coupon-qty']({id:c.key,delta:-0.25});assert.equal(M.B.couponPicker.quantities[c.key],duration/60-0.25);A.actions['v11-coupon-qty']({id:c.key,delta:0.25});assert.throws(()=>A.actions['v11-coupon-qty']({id:c.key,delta:0.25}),/数量/);A.actions['v08-coupon-done']();assert.equal(d.couponQuantities[c.id],duration/60);
  A.forms['book-draft']({...d,user:m.name,phone:m.phone,asset:c.key,time:'09:00',times:['09:00']});const checkout=A.draft.v07Checkout,q=M.quote(checkout);assert.equal(checkout.couponQuantities[c.id],duration/60);assert.equal(q.used[0].quantity,duration/60);assert.equal(q.total,0);const g=M.submit(checkout);assert.equal(g.status,'已支付');assert.equal(asset.remaining,2-duration/60);A.C.cancel(A.S,g.orderIds[0]);assert.equal(asset.remaining,2);
  checkout.couponQuantities[c.id]=.25;const partial=M.submit(checkout);M.pay(partial.id,'online');assert.equal(asset.remaining,1.75);A.C.refund(A.S,partial.orderIds[0],partial.total);assert.equal(asset.remaining,2);
 }
});
test('Word V0.10 未显式选数量时沿用原有效默认抵扣，打开选券默认数量与报价一致',()=>{
 for(const picker of [false,true]){
  const {A,go}=setup(),M=A.v07,m=A.v08.me(),c=M.coupons(m.id,[{item:'BJX17'}]).find(c=>c.unit==='小时'),asset=A.S.assets.find(a=>'ASSET:'+a.id===c.id);asset.skuId='day';A.v08.bookingState(M.service('BJX17')).variant='day';go('U07?id=BJX17');
  if(picker){A.actions['v08-coupon-open']({context:'booking'});go('U31');assert.equal(M.B.couponPicker.quantities['PLAN:'+c.id],4);A.actions['v08-coupon-done']();}
  A.forms['book-draft']({service:'BJX17',date:'2099-12-28',time:'09:00',resource:'BJX17-2',variant:'day',people:'1',asset:'PLAN:'+c.id});assert.equal(A.draft.amount,71250);assert.equal(M.quote(A.draft.v07Checkout).used[0].quantity,4);if(!picker)assert.equal(M.B.ownerDraft.couponQuantities,undefined,'未显式选择的默认抵扣不会变成返回预约页后的固定数量');
 }
});
test('Word V0.10 S15和A31短时预约按0.25小时调整，多券合计保持实际45分钟需求',()=>{
 for(const route of ['S15','A31']){
  const {A,go,scope}=setup(),M=A.v07,m=A.v08.me(),id='V13-PROXY-SHORT',s={...M.service('BJX01'),id,name:'45分钟代客预约',kind:'场地使用',rights:['价格待配置','价格待配置','价格待配置','价格待配置']};A.services.push(s);A.S.v02.v03.merchantServices[id]={v12DemoPrice:12000,v12DemoDuration:45};
  for(const suffix of ['A','B'])A.S.assets.push({id:'V13-PROXY-HOURS-'+suffix,project:'bj',memberId:m.id,item:id,passService:id,services:[id],name:'短时预约小时券'+suffix,couponType:'兑换券',remaining:2,total:2,unit:'小时',expiry:m.expiry,status:'可用'});
  const c1='ASSET:V13-PROXY-HOURS-A',c2='ASSET:V13-PROXY-HOURS-B';M.B.checkout={kind:'booking',memberId:m.id,operator:true,lines:[{item:id,variant:'standard',date:'2099-12-28',time:'09:00',resource:id+'-2',qty:1,people:1}],coupons:[c1],couponQuantities:{[c1]:.25}};
  go(route==='S15'?'S03?step=4':'A27?step=4');A.actions['v08-coupon-open']({context:'checkout'});assert.match(screen(go(route)),/data-delta="0.25"/);A.actions['v11-coupon-toggle']({id:c2});assert.equal(M.B.couponPicker.quantities[c2],.5);assert.throws(()=>A.actions['v11-coupon-qty']({id:c1,delta:.25}),/数量/);A.actions['v08-coupon-done']();
  const d=M.B.checkout,q=M.quote(d);assert.equal(q.total,0);assert.match(screen(go(scope.location.hash.slice(2))),/本次使用 0.25 小时、0.5 小时/);assert.equal(q.used.reduce((n,u)=>n+u.quantity,0),.75);for(const u of q.used)assert.equal(d.couponQuantities[u.id],u.quantity);
  const g=M.submit(d);assert.equal(g.status,'已支付');assert.equal(A.S.assets.find(a=>'ASSET:'+a.id===c1).remaining,1.75);assert.equal(A.S.assets.find(a=>'ASSET:'+a.id===c2).remaining,1.5);A.C.cancel(A.S,g.orderIds[0]);for(const id of [c1,c2])assert.equal(A.S.assets.find(a=>'ASSET:'+a.id===id).remaining,2);
 }
});
test('Word V0.10 五个统一目录展示合法免费服务、未知服务和零元会员商品，保留真实报价与选购数量',()=>{
 for(const route of ['S03','S10','A27','A28','M17']){
  const {A,go}=setup(),M=A.v07,N=A.v09,T=A.v10,m=A.v08.me(),free={...M.service('BJX01'),id:'V13-CATALOG-FREE',name:'目录免费预约',rights:['✅','✅','✅','✅']},unknown={...free,id:'V13-CATALOG-UNKNOWN',name:'目录待配置预约',rights:['待配置','待配置','待配置','待配置']};A.services.push(free,unknown);A.S.identity='ma';
  const p=N.raw('V07-bj-tea'),sku=N.sku;T.setPrice({project:'bj',item:p.id,skuId:'suxin',planId:m.planIds[0],price:0});
  const retail={kind:'retail',memberId:m.id,lines:[{item:p.id,skuId:'suxin',qty:2}],coupons:[]},booking={kind:'booking',memberId:m.id,identity:'na',lines:[{item:'BJX02',variant:'standard',qty:1,date:'2099-12-28',time:'09:00',resource:'BJX02-2',people:1}],coupons:[]},before={retail:M.quote(retail).total,booking:M.quote(booking).total,free:A.offer(free,'na').amount,unknown:A.offer(unknown,'na').amount};assert.equal(before.retail,0);assert.equal(before.booking,50000);
  T.proxyState().skuChoices={[p.id]:'suxin'};T.proxyState().lines=[{item:p.id,skuId:'suxin',qty:2}];
  const card=(h,id)=>[...h.matchAll(/<article class="v12-catalog-card[^>]*>[\s\S]*?<\/article>/g)].map(x=>x[0]).find(c=>c.includes('data-id="'+id+'"'));
  const h=go(route);assert.match(card(h,free.id)||'',/v12-catalog-action"><strong>¥0\.00\/次<\/strong>/,route+'免费预约');assert.match(card(h,unknown.id)||'',/v12-catalog-action"><strong>查看详情<\/strong>/,route+'未知预约');assert.match(card(h,'BJX02')||'',/v12-catalog-action"><strong>¥500\.00\/次<\/strong>/,route+'非会员目录价');assert.match(card(h,p.id)||'',/v12-catalog-action"><strong>¥0\.00<\/strong>/,route+'零元会员商品');assert.match(card(h,p.id)||'',/data-sku="suxin"[\s\S]*?<b>2<\/b>/);assert.match(card(h,p.id)||'',/<option value="suxin" selected>/);
  assert.equal(N.sku,sku);assert.equal(M.quote(retail).total,before.retail);assert.equal(M.quote(booking).total,before.booking);assert.equal(A.offer(free,'na').amount,before.free);assert.equal(A.offer(unknown,'na').amount,before.unknown);assert.equal(T.proxyState().lines[0].qty,2);assert.equal(T.proxyState().skuChoices[p.id],'suxin');
 }
});
