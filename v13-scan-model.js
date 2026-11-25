/* V0.10：项目店铺下按分类管理商家；静态桌码仅绑定售卖菜单。 */
(()=>{'use strict';
const A=Club,M=A.v07,N=A.v09,T=A.v10,{B,shop}=M,S=A.S;
const scenes={tea:'堂食点单',lounge:'酒廊点单',booking:'服务预约'};
B.v13Scan??={menus:[],tables:[]};const D=B.v13Scan;
const key=t=>[t.project,t.table,t.scene].join('|'),menus=(p=shop())=>D.menus.filter(m=>m.project===p),tables=(p=shop())=>D.tables.filter(t=>t.project===p);
function entries(p=shop()){
 return [...A.services.filter(s=>s.project===p).map(s=>({id:s.id,name:A.v05.serviceName(s),category:s.category,merchantCategory:s.category,product_type:'booking',image:N.cover(s.id),enabled:!S.hiddenServices.includes(s.id),raw:s})),...(S.v02.v03.merchantProducts[p]||[]).filter(x=>x.v07Catalog).map(x=>({id:x.id,name:x.name,category:x.menuCategory||x.category||'其他商品',merchantCategory:x.passService?M.service(x.passService)?.category||x.menuCategory:x.menuCategory||x.category||'其他商品',product_type:'physical',image:x.image,enabled:x.status==='已上架',raw:x}))];
}
function saveMenu(data){
 const previous=menus().find(m=>m.id===data.id);if(data.id&&!previous)throw Error('菜单不属于当前项目');
 if(!String(data.name||'').trim()||!Object.hasOwn(scenes,data.scene))throw Error('请填写菜单名称并选择点单场景');
 const all=entries(),available=all.filter(x=>x.merchantCategory===data.merchantCategory);if(!available.length)throw Error('请选择当前项目商家分类');
 if(!data.items?.length)throw Error('请勾选菜单商品或服务');const ids=new Set();
 const items=data.items.map(x=>{const p=all.find(p=>p.id===x.item);if(!p||p.merchantCategory!==data.merchantCategory)throw Error('同一菜单只允许一个商家分类的商品');if(ids.has(x.item))throw Error('菜单商品不能重复');ids.add(x.item);const price=x.priceOverride===null||x.priceOverride===undefined||x.priceOverride===''?null:Number(x.priceOverride);if(price!==null&&(!Number.isSafeInteger(price)||price<0))throw Error('菜单价须为有效金额');return {item:x.item,enabled:x.enabled!==false,priceOverride:price};});
 const cats=[...new Set(items.map(x=>all.find(p=>p.id===x.item).category))];const categories=cats.map(c=>({name:c,visible:data.categories?.find(x=>x.name===c)?.visible!==false,sort:Number(data.categories?.find(x=>x.name===c)?.sort)||0}));
 const row={id:previous?.id||A.C.uid('MENU'),project:shop(),name:String(data.name).trim(),scene:data.scene,merchantCategory:data.merchantCategory,status:data.status==='停用'?'停用':'启用',items,categories};
 if(previous&&tables().some(t=>t.menuId===previous.id)&&previous.scene!==row.scene)throw Error('已绑定桌码的菜单不能更改场景，请另建菜单');
 if(previous)Object.assign(previous,row);else D.menus.push(row);A.save();return previous||row;
}
function saveTable(data){
 const previous=tables().find(t=>t.id===data.id);if(data.id&&!previous)throw Error('桌码不属于当前项目');
 const menu=menus().find(m=>m.id===data.menuId);if(!menu||menu.scene!==data.scene)throw Error('请选择当前项目对应场景的菜单');if(!/^[A-Za-z0-9_-]{1,16}$/.test(data.table||''))throw Error('桌位须为1—16位字母、数字、短横线或下划线');
 if(previous&&(previous.table!==data.table||previous.scene!==data.scene))throw Error('已生成桌码的桌位与场景保持固定，请新建桌码');
 if(tables().some(t=>t.id!==previous?.id&&t.table===data.table&&t.scene===data.scene))throw Error('该桌位与场景已有桌码');
 const row={id:previous?.id||A.C.uid('QR'),project:shop(),table:data.table,scene:data.scene,menuId:menu.id,status:data.status==='停用'?'停用':'启用'};
 if(previous)Object.assign(previous,row);else D.tables.push(row);A.save();return previous||row;
}
function resolve(t){if(t.project!==shop())throw Error('桌码不属于当前项目，请重新扫码');const row=tables().find(x=>key(x)===key(t));if(!row)throw Error('桌码尚未配置');if(row.status!=='启用')throw Error('该桌码已停用');const menu=menus().find(m=>m.id===row.menuId);if(!menu||menu.status!=='启用')throw Error('售卖菜单已停用');if(menu.scene!==row.scene)throw Error('桌码与菜单场景不一致');return {table:row,menu};}
function visible(t){const {menu}=resolve(t),all=entries();return menu.categories.filter(c=>c.visible).sort((a,b)=>a.sort-b.sort).flatMap(c=>menu.items.filter(x=>x.enabled).map(x=>({...all.find(p=>p.id===x.item),menuPrice:x.priceOverride})).filter(x=>x.id&&x.enabled&&x.category===c.name&&x.merchantCategory===menu.merchantCategory));}
const context=t=>{const {table,menu}=resolve(t);return {project:table.project,table:table.table,scene:table.scene,menuId:menu.id,merchantCategory:menu.merchantCategory};};
let active=B.v13ScanContext||null,pricingContext;
const current=()=>active&&active.project===shop()?active:null;
function activate(t){if(!current())B.v13NormalScene={table:B.table,scene:B.scene};active=context(t);B.v13ScanContext={...active};B.table=active.table;B.scene=active.scene;A.save();return active;}
function clear(){if(!active&&!B.v13ScanContext&&!B.v13NormalScene)return;if(B.v13NormalScene){B.table=B.v13NormalScene.table;B.scene=B.v13NormalScene.scene;delete B.v13NormalScene;}active=null;B.v13ScanContext=null;A.save();}
const url=t=>'https://li13146730115-creator.github.io/chen-club-prototype/#/U11?mode=menu&project='+encodeURIComponent(t.project)+'&table='+encodeURIComponent(t.table)+'&scene='+encodeURIComponent(t.scene);
function validate(d,ctx){const {menu}=resolve(ctx);if(ctx.menuId&&ctx.menuId!==menu.id)throw Error('售卖菜单已调整，请重新扫码选择');const list=visible(ctx);for(const l of d.lines||[]){const e=list.find(p=>p.id===l.item);if(!e)throw Error('商品已下架或不在当前售卖菜单');if((d.kind==='booking')!==(e.product_type==='booking'))throw Error('预约与实体商品必须分别下单，不能混合结算');}return menu;}
function effectiveContext(){return pricingContext===undefined?(!/^[ASM]/.test(A.route)?current():null):pricingContext;}
// 尚未生成草稿的扫码动作可临时报价；普通草稿不继承浏览中的桌码。
function withContext(ctx,fn){const previous=pricingContext;pricingContext=ctx||null;try{return fn();}finally{pricingContext=previous;}}
const draftContext=d=>Object.hasOwn(d,'scanContext')?d.scanContext||null:pricingContext||null;
function menuPrice(item,q,identity){const ctx=effectiveContext();if(!ctx)return q;const e=visible(ctx).find(x=>x.id===item);if(!e||e.menuPrice===null||q.memberPrice||q.amount===0&&identity?.startsWith('m'))return q;return {...q,amount:e.menuPrice,text:A.money(e.menuPrice),menuPrice:true};}
const sku=N.sku;N.sku=(p,id,memberId,identity)=>menuPrice(p?.id,sku(p,id,memberId,identity),identity||M.members().find(m=>m.id===memberId)?.identity||S.identity);
const offer=A.offer,toffer=T.offer;A.offer=(s,i=S.identity,...rest)=>menuPrice(s?.id,offer(s,i,...rest),i);T.offer=(s,i=S.identity,...rest)=>menuPrice(s?.id,toffer(s,i,...rest),i);
const quote=M.quote;M.quote=d=>{const ctx=draftContext(d);if(ctx)validate(d,ctx);return withContext(ctx,()=>quote(d));};
const cart=M.cart;M.cart=()=>{const ctx=current();return cart().filter(l=>ctx?l.scanKey===key(ctx):!l.scanKey);};
const change=M.cartChange;M.cartChange=(id,delta,skuId)=>{const ctx=current();if(ctx)validate({kind:'retail',lines:[{item:id}]},ctx);const before=new Set(B.cart);change(id,delta,skuId);if(ctx)for(const l of B.cart)if(!before.has(l))Object.assign(l,{scanKey:key(ctx),scanContext:{...ctx}});A.save();};
const submit=M.submit;M.submit=d=>{const ctx=draftContext(d);if(ctx){validate(d,ctx);d.scanContext={...context(ctx)};}const g=withContext(ctx,()=>submit(d));if(ctx){g.scanContext={...d.scanContext};for(const id of g.orderIds){const o=S.orders.find(o=>o.id===id);Object.assign(o,{table_id:ctx.table,scene:ctx.scene,order_type:d.kind==='booking'?'booking':'physical',menu_id:ctx.menuId,merchantCategory:ctx.merchantCategory,scanContext:{...ctx}});if(d.kind==='retail')o.orderScene={project:ctx.project,table:ctx.table,scene:ctx.scene};}}else if(d.kind==='retail'&&B.v13NormalScene){for(const id of g.orderIds){const o=S.orders.find(o=>o.id===id);o.orderScene={...o.orderScene,table:d.table||B.v13NormalScene.table||'T01',scene:B.v13NormalScene.scene||'tea'};}}A.save();return g;};
const pay=M.pay;M.pay=(id,channel)=>{const g=B.groups.find(g=>g.id===id);if(g?.scanContext)validate({...g,scanContext:g.scanContext},g.scanContext);return pay(id,channel);};
function seed(){if(D.version)return;const previous=S.project;for(const p of Object.keys(A.projects)){S.project=p;const all=entries();const profiles=[['茶叙饮品','tea','咖啡茶饮'],['酒廊茶饮','lounge','咖啡茶饮'],['茶叙小食','tea','甜点小食'],['酒廊小食','lounge','甜点小食'],['运动预约','booking',all.find(x=>x.product_type==='booking')?.category],['精选酒饮','lounge','精选酒饮']];for(const [name,scene,merchantCategory]of profiles){const items=all.filter(x=>x.merchantCategory===merchantCategory&&x.enabled&&(scene!=='booking'||x.product_type==='booking')).map(x=>({item:x.id,enabled:true,priceOverride:null}));if(items.length)saveMenu({name,scene,merchantCategory,items});}
 const tea=menus().find(m=>m.scene==='tea'),lounge=menus().find(m=>m.scene==='lounge'),booking=menus().find(m=>m.scene==='booking');for(const table of ['T01','T02','T03','T04','T05'])saveTable({table,scene:'tea',menuId:tea.id});saveTable({table:'A02',scene:'lounge',menuId:lounge.id});for(const table of ['B01','B02'])if(booking)saveTable({table,scene:'booking',menuId:booking.id});}
 S.project=previous;D.version=1;A.save();}
A.v13Scan={D,scenes,key,menus,tables,entries,saveMenu,saveTable,resolve,visible,context,activate,clear,current,url,validate,withContext};seed();
})();
