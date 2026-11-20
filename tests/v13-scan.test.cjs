const test=require('node:test'),assert=require('node:assert/strict'),load=require('./helpers/load.cjs');
const setup=()=>load(['v13-scan-model.js','v13-scan.js']);
test('V0.10 桌码静态URL，菜单重绑不换码，同桌不同场景独立',()=>{
 const {A}=setup(),R=A.v13Scan;A.S.project='bj';const t=R.tables()[0],url=R.url(t),m=R.menus().find(m=>m.id!==t.menuId&&m.scene===t.scene);
 assert.ok(m);R.saveTable({...t,menuId:m.id});assert.equal(R.url(t),url);assert.equal(R.resolve(t).menu.id,m.id);assert.doesNotMatch(url,/menuId|product|merchant/);
 const alt=R.saveTable({table:t.table,scene:'booking',menuId:R.menus().find(m=>m.scene==='booking').id,status:'启用'});assert.notEqual(R.key(t),R.key(alt));assert.equal(R.resolve(alt).menu.scene,'booking');
});
test('V0.10 菜单单商家，分类不进入桌码，跨项目、停用和未上架不可售',()=>{
 const {A}=setup(),R=A.v13Scan;A.S.project='bj';const m=R.menus()[0],foreign=R.entries().find(x=>x.merchantCategory!==m.merchantCategory);
 assert.throws(()=>R.saveMenu({...m,items:[...m.items,{item:foreign.id,enabled:true}]}),/商家/);
 const t=R.tables()[0];assert.ok(!Object.hasOwn(t,'category'));assert.throws(()=>R.resolve({...t,project:'zj'}),/项目|桌码/);
 R.saveMenu({...m,status:'停用'});assert.throws(()=>R.resolve(t),/停用/);
});
test('V0.10 扫码购物车按项目桌位场景隔离，预约不能加实体车',()=>{
 const {A}=setup(),M=A.v07,R=A.v13Scan;A.S.project='bj';const t=R.tables()[0];R.activate(t);const p=R.visible(t)[0];M.cartChange(p.id,1);assert.equal(M.cart().length,1);
 const other=R.tables().find(x=>x.table!==t.table&&x.scene===t.scene);R.activate(other);assert.equal(M.cart().length,0);M.cartChange(p.id,2);assert.equal(M.cart()[0].qty,2);R.activate(t);assert.equal(M.cart()[0].qty,1);
 const b=R.tables().find(x=>x.scene==='booking');R.activate(b);assert.throws(()=>M.cartChange(R.visible(b)[0].id,1),/预约|实体/);
 R.clear();assert.equal(M.cart().length,0);assert.equal(M.B.cart.length,2);
});
test('V0.10 菜单价参与报价下单，已配置会员价优先，旧车禁售需拦截',()=>{
 const {A}=setup(),M=A.v07,R=A.v13Scan;A.S.project='bj';A.S.identity='na';const t=R.tables()[0],m=R.resolve(t).menu,p=R.visible(t)[0];R.saveMenu({...m,items:m.items.map(x=>({...x,priceOverride:x.item===p.id?2500:x.priceOverride}))});R.activate(t);
 const d={kind:'retail',lines:[{item:p.id,qty:1}],coupons:[],identity:'na',scanContext:R.context(t)};assert.equal(M.quote(d).total,2500);const g=M.submit(d),o=A.S.orders.find(o=>o.id===g.orderIds[0]);assert.equal(o.amount,2500);assert.equal(o.order_type,'physical');assert.equal(o.table_id,t.table);assert.equal(o.scene,t.scene);assert.equal(o.menu_id,m.id);
 const member=M.members()[0];A.v10.setPrice({project:'bj',item:p.id,skuId:A.v10.variants(p.id)[0][0],planId:member.planIds[0],identity:member.identity,price:1000});assert.equal(M.quote({...d,memberId:member.id,identity:member.identity}).total,1000);
 R.saveMenu({...m,items:m.items.map(x=>({...x,enabled:x.item!==p.id}))});assert.throws(()=>M.quote(d),/售卖|下架/);
});
test('V0.10 扫码预约单独下单占用资源，实体和预约混合提交被拒绝',()=>{
 const {A}=setup(),M=A.v07,R=A.v13Scan;A.S.project='bj';const t=R.tables().find(t=>t.scene==='booking'),s=R.visible(t).find(x=>A.offer(M.service(x.id),'na').amount!==null);R.activate(t);const date=M.iso(new Date(Date.now()+86400000*5)),d={kind:'booking',identity:'na',lines:[{item:s.id,resource:s.id+'-2',date,time:'11:00',qty:1,people:1}],coupons:[],scanContext:R.context(t)};
 const g=M.submit(d),o=A.S.orders.find(o=>o.id===g.orderIds[0]);assert.equal(o.order_type,'booking');assert.equal(o.table_id,t.table);assert.ok(!o.children);assert.throws(()=>M.submit(d),/占用|约满|库存/);
 assert.throws(()=>M.quote({...d,kind:'retail'}),/预约|实体|混合/);
});
test('V0.10 桌码后台有维护页面且不改不关联业主页面结构',()=>{const {A,go}=setup();for(const r of ['M19','M20','M21'])assert.doesNotMatch(go(r),/页面数据异常/);assert.match(go('M19'),/桌码配置|售卖菜单/);assert.ok(A.v13Scan.tables().length>=5);assert.ok(A.v13Scan.menus().length>=5);});
test('V0.10 桌码和菜单编辑页归属商家运营，编辑页不出现在子菜单',()=>{
 const {A,go}=setup();for(const route of ['M19','M20','M21']){const h=go(route),rail=h.match(/<nav class="mall-rail"[\s\S]*?<\/nav>/)[0],submenu=h.match(/<nav aria-label="当前模块页面">([\s\S]*?)<\/nav>/)[1];assert.match(rail,/<a href="#\/M04" class="on">[\s\S]*?<span>商家运营<\/span><\/a>/);assert.match(h,/<div class="mall-subtitle">商家运营<\/div>/);assert.match(submenu,/href="#\/M19"/);assert.doesNotMatch(submenu,/href="#\/M2[01]"/);}
 for(const id of ['M20','M21'])assert.equal(A.pages.find(p=>p.id===id).hidden,true);
});
test('V0.10 运营默认进入第一个可见模块的第一个子页面',()=>{const {A,go}=setup(),first=A.navigationGroups.flatMap(g=>g.ids).find(id=>A.pages.some(p=>p.id===id&&!p.hidden&&p.role==='A'));const h=go('A01');assert.equal(A.route,first);assert.match(h,new RegExp('class="mall-brand" href="#/'+first+'"'));assert.ok(A.pages.find(p=>p.id==='A01').hidden);});
test('V0.10 删除扫码购物车不影响同桌另一场景及普通商城车',()=>{const {A}=setup(),M=A.v07,R=A.v13Scan,t=R.tables()[0],lounge=R.tables().find(t=>t.scene==='lounge');M.B.cart=[];R.clear();M.cartChange('V07-bj-coffee',1);R.activate(t);M.cartChange('V07-bj-coffee',2);R.activate({...lounge,table:lounge.table});M.cartChange('V07-bj-coffee',3);R.activate(t);A.go('U29');A.render();A.actions['v19-cart-delete']();assert.equal(M.cart().length,0);R.activate(lounge);assert.equal(M.cart()[0].qty,3);R.clear();assert.equal(M.cart()[0].qty,1);});
test('V0.10 菜单表单准确保存两位小数，拒绝三位小数',()=>{const {A,go}=setup(),R=A.v13Scan,m=R.menus()[0],p=m.items[0].item;go('M20?id='+m.id);const f={name:m.name,scene:m.scene,merchantCategory:m.merchantCategory,status:'启用',['item-'+p]:'yes',['enabled-'+p]:'yes','cat-visible-0':'yes',['price-'+p]:'19.99'};A.forms['v13-menu-save'](f);assert.equal(R.menus().find(x=>x.id===m.id).items[0].priceOverride,1999);go('M20?id='+m.id);assert.throws(()=>A.forms['v13-menu-save']({...f,['price-'+p]:'19.999'}),/两位小数/);});

function scanCoffee(ctx,table){const {A,go}=ctx,R=A.v13Scan,t=table||R.tables().find(t=>t.scene==='lounge'),m=R.resolve(t).menu;R.saveMenu({...m,items:m.items.map(x=>({...x,priceOverride:x.item==='V07-bj-coffee'?9900:x.priceOverride}))});go('U11?mode=menu&project=bj&table='+t.table+'&scene='+t.scene);return t;}
test('V0.10 扫码期间普通单的报价与下单不继承菜单价格和桌位',()=>{
 const ctx=setup(),{A}=ctx,M=A.v07,R=A.v13Scan,normal={table:M.B.table||'T01',scene:M.B.scene||'tea'},t=scanCoffee(ctx),d={kind:'retail',identity:'na',operator:false,lines:[{item:'V07-bj-coffee',qty:1}],coupons:[]};
 assert.notEqual(t.table,normal.table);assert.equal(M.quote(d).total,3800);for(const scanContext of [undefined,null])assert.equal(M.quote({...d,scanContext}).total,3800);M.B.checkout=d;assert.ok(ctx.go('U22').includes(normal.table+' 桌'));const g=M.submit(d),o=A.S.orders.find(o=>o.id===g.orderIds[0]);assert.equal(g.total,3800);assert.equal(g.scanContext,undefined);assert.equal(d.scanContext,undefined);for(const k of ['table_id','menu_id','order_type','scanContext'])assert.equal(o[k],undefined);assert.equal(o.orderScene.table,normal.table);assert.equal(o.orderScene.scene,normal.scene);assert.ok(R.current());
});
test('V0.10 扫码加购物车不修改已有普通结算草稿，返回后仍按商城价提交',()=>{
 const ctx=setup(),{A,go}=ctx,M=A.v07;M.B.cart=[];M.cartChange('V07-bj-coffee',1);A.actions['v09-cart-checkout']();const d=M.B.checkout;assert.equal(M.quote(d).total,3800);go('U01');scanCoffee(ctx);A.actions['v19-spec-open']({id:'V07-bj-coffee',mode:'cart'});A.actions['v19-spec-confirm']();assert.equal(M.B.checkout,d);assert.equal(d.scanContext,undefined);go('U01');assert.match(go('U22'),/¥38\.00/);assert.equal(M.quote(d).total,3800);A.forms['v09-owner-submit']({});const g=M.B.groups[0],o=A.S.orders.find(o=>o.id===g.orderIds[0]);assert.equal(g.total,3800);for(const k of ['table_id','menu_id','order_type','scanContext'])assert.equal(o[k],undefined);assert.equal(M.B.cart.filter(l=>l.scanKey).length,1);
});
test('V0.10 扫码立即购买与购物车结算显式保存菜单价和上下文，离开扫码后仍可付款',()=>{
 for(const mode of ['buy','cart']){const ctx=setup(),{A,go}=ctx,M=A.v07,R=A.v13Scan,t=scanCoffee(ctx);A.actions['v19-spec-open']({id:'V07-bj-coffee',mode});A.actions['v19-spec-confirm']();if(mode==='cart')A.actions['v09-cart-checkout']();const d=M.B.checkout;assert.equal(d.scanContext.menuId,R.resolve(t).menu.id);assert.equal(d.scanContext.table,t.table);assert.equal(M.quote(d).total,9900);assert.match(go('U22'),/¥99\.00/);go('U01');assert.equal(R.current(),null);assert.equal(M.quote(d).total,9900);assert.ok(go('U22').includes(t.table+' 桌'));A.forms['v09-owner-submit']({});const g=M.B.groups[0],o=A.S.orders.find(o=>o.id===g.orderIds[0]);assert.equal(g.total,9900);assert.equal(o.table_id,t.table);assert.equal(o.scene,t.scene);assert.equal(o.menu_id,d.scanContext.menuId);M.pay(g.id,'online');assert.equal(g.status,'已支付');}
});
test('V0.10 扫码预约生成草稿前按菜单价报价，确认页和离开扫码后的提交保持原上下文',()=>{
 const {A,go}=setup(),M=A.v07,R=A.v13Scan,s=M.service('BJX17'),m=R.saveMenu({name:'会议预约菜单',scene:'booking',merchantCategory:s.category,items:[{item:s.id,enabled:true,priceOverride:9900}]}),t=R.saveTable({table:'BOOK99',scene:'booking',menuId:m.id});go('U11?mode=menu&project=bj&table='+t.table+'&scene='+t.scene);go('U07?id='+s.id);const d=M.B.ownerDraft,date=M.iso(new Date(Date.now()+86400000*5));A.forms['book-draft']({...d,service:s.id,date,time:'09:00',times:['09:00'],resource:s.id+'-2',asset:'',user:'林女士',phone:'13900001234'});const checkout=A.draft.v07Checkout;assert.equal(checkout.scanContext.menuId,m.id);assert.equal(A.draft.amount,9900);assert.equal(M.quote(checkout).total,9900);assert.match(go('U08'),/¥99\.00/);go('U01');assert.equal(M.quote(checkout).total,9900);assert.match(go('U08'),/¥99\.00/);A.forms['place-order']({agreed:'yes'});const g=M.B.groups[0],o=A.S.orders.find(o=>o.id===g.orderIds[0]);assert.equal(g.total,9900);assert.equal(o.table_id,t.table);assert.equal(o.menu_id,m.id);assert.equal(o.order_type,'booking');M.pay(g.id,'online');assert.equal(g.status,'已支付');
});
test('V0.10 当前扫码桌变化后提交已有结算，仅移除该结算来源购物车',()=>{
 for(const source of ['normal','scan']){const ctx=setup(),{A,go}=ctx,M=A.v07,R=A.v13Scan;M.B.cart=[];if(source==='scan')scanCoffee(ctx,R.tables().find(t=>t.scene==='tea'));M.cartChange('V07-bj-coffee',1);A.actions['v09-cart-checkout']();const d=M.B.checkout,sourceRow=M.B.cart[0];scanCoffee(ctx);M.cartChange('V07-bj-coffee',2);const otherRow=M.cart()[0];assert.notEqual(otherRow,sourceRow);assert.equal(M.B.checkout,d);go('U22');A.forms['v09-owner-submit']({});assert.equal(M.B.cart.includes(sourceRow),false);assert.equal(M.B.cart.includes(otherRow),true);assert.equal(otherRow.qty,2);assert.equal(M.B.groups[0].scanContext?.table,source==='scan'?sourceRow.table:undefined);}
});
