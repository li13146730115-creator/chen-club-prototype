const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),load=require('./helpers/load.cjs');
const file=path.resolve(__dirname,'../v14-scan.js');
const setup=()=>load(fs.existsSync(file)?['v14-scan.js']:[]);
function scan(ctx,table='T01'){const {A,go}=ctx;go('U11?mode=menu&project=bj&table='+table+'&scene=tea');return A.v13Scan.current();}
function click(ctx,delta,id='V07-bj-coffee',sku){const fn=ctx.A.actions['v14-menu-qty'];assert.equal(typeof fn,'function','菜单应提供数量加减动作');return fn({id,delta:String(delta),...(sku?{sku}:{})});}
test('V0.11 每个已有菜单按真实商品分成至少三个展示类别，原商品与商家隔离保持',()=>{
 const {A}=setup(),R=A.v13Scan;for(const project of Object.keys(A.projects)){A.S.project=project;for(const m of R.menus()){assert.ok(m.displayCategories?.length>=3,m.name+'需要多个类别');const all=R.entries(),ids=new Set(m.items.map(x=>x.item));assert.ok(m.items.every(x=>all.find(p=>p.id===x.item)?.merchantCategory===m.merchantCategory));assert.equal(ids.size,m.items.length);assert.ok(m.items.every(x=>m.displayCategories.some(c=>c.name===x.displayCategory)));}}
});
test('V0.11 分类导航展示咖啡与茶饮，不显示选规格或页内购物车入口',()=>{
 const ctx=setup(),h=ctx.go('U11?mode=menu&project=bj&table=T01&scene=tea');assert.match(h,/>咖啡<\/button>/);assert.match(h,/>茶饮<\/button>/);assert.doesNotMatch(h,/v13-menu-footer|查看购物车|>选规格<\/button>/);assert.match(h,/data-action="v14-menu-qty"/);assert.match(h,/>购物车<\//);
});
test('V0.11 单规格加号直接加购，减至零后移除，不打开规格弹层',()=>{
 const ctx=setup(),{A,nodes}=ctx;scan(ctx);A.v07.B.cart=[];click(ctx,1);assert.equal(A.v07.cart()[0].qty,1);assert.equal(A.v07.cart()[0].skuId,'default');assert.doesNotMatch(nodes.overlay?.innerHTML||'',/v19-sku-sheet/);click(ctx,1);assert.equal(A.v07.cart()[0].qty,2);click(ctx,-1);click(ctx,-1);assert.equal(A.v07.cart().length,0);click(ctx,-1);assert.equal(A.v07.cart().length,0);
});
test('V0.11 多规格加号复用规格弹层，指定减号只减少目标SKU',()=>{
 const ctx=setup(),{A,nodes}=ctx;scan(ctx);A.v07.B.cart=[];click(ctx,1,'V07-bj-tea');assert.match(nodes.overlay.innerHTML,/v19-sku-sheet/);assert.equal(A.v07.cart().length,0);A.actions['v19-spec-select']({sku:'shuimo'});A.actions['v19-spec-confirm']();click(ctx,1,'V07-bj-tea');A.actions['v19-spec-select']({sku:'suxin'});A.actions['v19-spec-confirm']();click(ctx,-1,'V07-bj-tea','suxin');assert.equal(A.v07.cart().length,1);assert.equal(A.v07.cart()[0].skuId,'shuimo');assert.equal(A.v07.cart()[0].qty,1);
});
test('V0.11 多SKU汇总减号要求选择规格，不暗中减少任意SKU',()=>{
 const ctx=setup(),{A,nodes}=ctx;scan(ctx);A.v07.B.cart=[];for(const sku of ['shuimo','suxin'])A.v07.cartChange('V07-bj-tea',1,sku);click(ctx,-1,'V07-bj-tea');assert.equal(A.v07.cart().reduce((n,l)=>n+l.qty,0),2);assert.match(nodes.overlay.innerHTML,/水墨丹青/);assert.match(nodes.overlay.innerHTML,/素馨/);assert.match(nodes.overlay.innerHTML,/data-sku="suxin"/);
});
test('V0.11 加减和规格草稿保持桌位、项目隔离，菜单价参与结算',()=>{
 const ctx=setup(),{A}=ctx,M=A.v07,R=A.v13Scan;scan(ctx);M.B.cart=[];const m=R.resolve(R.current()).menu;R.saveMenu({...m,items:m.items.map(x=>({...x,priceOverride:x.item==='V07-bj-coffee'?1999:x.priceOverride}))});click(ctx,1);scan(ctx,'T02');assert.equal(M.cart().length,0);click(ctx,1);click(ctx,1);click(ctx,-1);assert.equal(M.cart()[0].qty,1);scan(ctx);assert.equal(M.cart()[0].qty,1);A.actions['v09-cart-checkout']();assert.equal(M.quote(M.B.checkout).total,1999);assert.equal(M.B.checkout.scanContext.table,'T01');A.S.project='zj';M.syncShop();assert.equal(M.cart().length,0);
});
test('V0.11 规格弹层打开后换桌，确认不能把旧桌选择加到新桌',()=>{
 const ctx=setup(),{A}=ctx;scan(ctx);A.v07.B.cart=[];click(ctx,1,'V07-bj-tea');scan(ctx,'T02');assert.throws(()=>A.actions['v19-spec-confirm'](),/桌位|重新选择|扫码/);assert.equal(A.v07.cart().length,0);
});
test('V0.11 M20维护类别名称、显示、排序和商品映射，M19可进入配置',()=>{
 const ctx=setup(),{A,go}=ctx,R=A.v13Scan,m=R.menus()[0];const editor=go('M20?id='+m.id);assert.match(editor,/新增类别/);assert.match(editor,/商品展示类别/);const f={name:m.name,scene:m.scene,merchantCategory:m.merchantCategory,status:m.status,'v14-category-count':'3','v14-category-name-0':'全部饮品','v14-category-all-0':'yes','v14-category-visible-0':'yes','v14-category-sort-0':'0','v14-category-name-1':'手冲咖啡','v14-category-visible-1':'yes','v14-category-sort-1':'20','v14-category-name-2':'精选茗茶','v14-category-visible-2':'yes','v14-category-sort-2':'10'};for(const x of m.items)Object.assign(f,{['item-'+x.item]:'yes',['enabled-'+x.item]:'yes',['price-'+x.item]:'',['group-'+x.item]:/coffee|latte/.test(x.item)?'手冲咖啡':'精选茗茶'});A.forms['v13-menu-save'](f);const saved=R.menus()[0];assert.equal(saved.displayCategories[1].name,'手冲咖啡');const h=go('U11?mode=menu&project=bj&table=T01&scene=tea');assert.ok(h.indexOf('>精选茗茶</button>')<h.indexOf('>手冲咖啡</button>'));A.actions['v13-menu-category']({value:'手冲咖啡'});assert.match(ctx.nodes.app.innerHTML,/美式咖啡/);assert.doesNotMatch(ctx.nodes.app.innerHTML,/会所茶品<\/h3>/);assert.match(go('M19?tab=menus'),/M20\?id=/);
});
test('V0.11 后台菜单编辑不继承扫码上下文，换项目不复用另一项目草稿',()=>{
 const ctx=setup(),{A,go}=ctx,R=A.v13Scan;scan(ctx,'T02');const first=R.menus()[0];go('M20?id='+first.id);assert.equal(R.current(),null);A.S.project='zj';A.v07.syncShop();go('M20');assert.equal(A.v07.B.v13MenuDraft.project,'zj');assert.equal(A.v07.B.v13MenuDraft.editId,'');assert.equal(A.v07.B.v13MenuDraft.items.length,0);
});
test('V0.11 后台交换两个类别名称时，商品仍跟随原类别而非误分组',()=>{
 const {A,go}=setup(),R=A.v13Scan,m=R.menus()[0],groups=m.displayCategories;assert.ok(groups);go('M20?id='+m.id);const f={name:m.name,scene:m.scene,merchantCategory:m.merchantCategory,status:m.status,'v14-category-count':String(groups.length)};groups.forEach((c,i)=>{Object.assign(f,{['v14-category-name-'+i]:i===1?groups[2].name:i===2?groups[1].name:c.name,['v14-category-visible-'+i]:'yes',['v14-category-sort-'+i]:String(c.sort),...(c.all?{['v14-category-all-'+i]:'yes'}:{})});});for(const x of m.items)Object.assign(f,{['item-'+x.item]:'yes',['enabled-'+x.item]:'yes',['price-'+x.item]:'',['group-'+x.item]:x.displayCategory});A.forms['v13-menu-save'](f);assert.equal(R.menus()[0].items.find(x=>x.item==='V07-bj-coffee').displayCategory,'茶饮');assert.equal(R.menus()[0].items.find(x=>x.item==='V07-bj-tea').displayCategory,'咖啡');
});
test('V0.11 隐藏展示类别使对应商品不能继续加入或提交，保留其它类别',()=>{
 const ctx=setup(),{A}=ctx,R=A.v13Scan;scan(ctx);const m=R.resolve(R.current()).menu;assert.ok(m.displayCategories);const tea=m.items.find(x=>x.item==='V07-bj-tea').displayCategory;R.saveMenu({...m,displayCategories:m.displayCategories.map(c=>({...c,visible:c.name!==tea}))});assert.ok(!R.visible(R.current()).some(x=>x.id==='V07-bj-tea'));assert.throws(()=>A.v07.cartChange('V07-bj-tea',1,'shuimo'),/下架|类别|售卖/);assert.throws(()=>A.v07.quote({kind:'retail',lines:[{item:'V07-bj-tea',skuId:'shuimo',qty:1}],scanContext:R.current(),coupons:[]}),/下架|类别|售卖/);assert.ok(R.visible(R.current()).some(x=>x.id==='V07-bj-coffee'));
});
test('V0.11 购物车已有商品的类别隐藏后，结算动作直接拦截且不创建草稿',()=>{
 const ctx=setup(),{A}=ctx,R=A.v13Scan,M=A.v07;scan(ctx);M.B.cart=[];M.B.checkout=null;click(ctx,1);const m=R.resolve(R.current()).menu,group=m.items.find(x=>x.item==='V07-bj-coffee').displayCategory;R.saveMenu({...m,displayCategories:m.displayCategories.map(c=>({...c,visible:c.name!==group}))});assert.throws(()=>A.actions['v09-cart-checkout'](),/隐藏|下架|售卖/);assert.equal(M.B.checkout,null);
});
test('V0.11 立即购买规格选择后类别被隐藏，确认前校验并保持结算草稿',()=>{
 const ctx=setup(),{A}=ctx,R=A.v13Scan,M=A.v07;scan(ctx);M.B.checkout=null;A.actions['v19-spec-open']({id:'V07-bj-tea',mode:'buy'});const m=R.resolve(R.current()).menu,group=m.items.find(x=>x.item==='V07-bj-tea').displayCategory;R.saveMenu({...m,displayCategories:m.displayCategories.map(c=>({...c,visible:c.name!==group}))});assert.throws(()=>A.actions['v19-spec-confirm'](),/隐藏|下架|售卖/);assert.equal(M.B.checkout,null);
});
test('V0.11 迁移重复加载不会覆盖后台调整或修改原商品',()=>{
 const ctx=setup(),{A,scope}=ctx,R=A.v13Scan,m=R.menus()[0],products=JSON.stringify(R.entries().map(x=>x.raw));assert.ok(m.displayCategories);const modified=m.displayCategories.map((c,i)=>({...c,name:i===1?'定制咖啡':c.name}));R.saveMenu({...m,displayCategories:modified,items:m.items.map(x=>({...x,displayCategory:x.displayCategory===m.displayCategories[1].name?'定制咖啡':x.displayCategory}))});const before=JSON.stringify(R.D);vm.runInContext(fs.readFileSync(file,'utf8'),scope);assert.equal(JSON.stringify(R.D),before);assert.equal(JSON.stringify(R.entries().map(x=>x.raw)),products);
});
test('V0.11 购物车、确认支付和订单不展示商品归属店铺名称，保留桌号与全选',()=>{
 const ctx=setup(),{A,go}=ctx,M=A.v07;scan(ctx);M.B.cart=[];click(ctx,1);let h=go('U29');assert.doesNotMatch(h,/<h3 class="v19-cart-store">[\s\S]*?北京/);assert.match(h,/v19-cart-all/);A.actions['v09-cart-checkout']();h=go('U22');assert.doesNotMatch(h,/<h3>[^<]*北京[^<]* ›<\/h3>|<b>[^<]*北京[^<]* · 到店使用<\/b>/);assert.match(h,/T01 桌/);assert.match(h,/美式咖啡/);A.forms['v09-owner-submit']({});h=go('U23?id='+M.B.groups[0].id);assert.doesNotMatch(h,/当前归属店铺|归属店铺/);
});
