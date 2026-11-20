/* Word V0.10：会员等级价格随商家商品／服务表单维护。 */
(()=>{'use strict';
const A=Club;if(A.v13Merchant)return;
const M=A.v07,T=A.v10,N=A.v09,X=A.v11Membership,{B,shop,iso}=M,S=A.S,V=S.v02;
const {E,input,select,form,table,link,money}=A,old={...A.views},prefix='v13-price-';
const allProducts=()=>Object.values(V.v03.merchantProducts).flat();
S.v13MerchantServices??=[];
for(const s of S.v13MerchantServices)if(!M.service(s.id))A.services.push(s);
function amount(value){const text=String(value).trim(),n=Number(text),cents=Math.round(n*100);if(!/^\d+(?:\.\d{1,2})?$/.test(text)||!Number.isSafeInteger(cents)||cents<0)throw Error('会员价格须为非负金额，最多保留两位小数');return cents;}
function priceRows(f,variants){return Object.entries(f).filter(([key])=>key.startsWith(prefix)).map(([key,value])=>{const parts=key.slice(prefix.length).split('|'),[planId,identity,skuId]=parts;if(parts.length!==3||!M.plans().some(p=>p.id===planId)||!['ma','mc'].includes(identity)||!variants.some(v=>v[0]===skuId))throw Error('请选择本店会籍、会员身份及有效规格配置会员价');return {planId,identity,skuId,price:String(value).trim()===''?null:amount(value)};});}
function savePrices(item,rows,variants){
 B.memberPrices=B.memberPrices.filter(r=>r.project!==shop()||r.item!==item||variants.some(v=>v[0]===r.skuId));
 for(const row of rows){const match=r=>r.project===shop()&&r.item===item&&r.planId===row.planId&&r.identity===row.identity&&r.skuId===row.skuId;if(row.price===null)B.memberPrices=B.memberPrices.filter(r=>!match(r));else T.setPrice({project:shop(),item,...row});}
 A.save();
}
function matrix(item,variants,draft={}){
 const plans=M.plans(),cell=(p,identity,skuId,label)=>{const key=prefix+[p.id,identity,skuId].join('|'),r=B.memberPrices.find(r=>r.project===shop()&&r.item===item&&r.planId===p.id&&r.identity===identity&&r.skuId===skuId),value=Object.hasOwn(draft,key)?draft[key]:r?r.price/100:'';return '<input name="'+E(key)+'" type="number" min="0" step="0.01" value="'+E(value)+'" placeholder="沿用客户身份价" aria-label="'+E(p.name+' '+label+' '+(identity==='ma'?'成人':'儿童')+'会员价')+'">';};
 return '<section class="v13-member-price-editor"><h3>会员等级价格</h3><p class="muted">按会籍卡和商品规格设置成人、儿童会员价。免费填 0；留空沿用客户身份价。</p>'+table(['会员等级','商品／服务规格','成人会员价（元）','儿童会员价（元）'],plans.flatMap(p=>variants.map(([skuId,label])=>[E(p.name),E(label),cell(p,'ma',skuId,label),cell(p,'mc',skuId,label)])))+(plans.length?'':'<p class="muted">本店尚未配置会籍卡。</p>')+'</section>';
}
function insert(html,action,content){const re=new RegExp('(<form data-form="'+action+'"[\\s\\S]*?)(<button class="btn gold-btn full" type="submit">)');return html.replace(re,(_all,before,button)=>before+content+button);}
function typeLabel(html,label){return html.replace(/(<form\b[^>]*><div class="error" role="alert"><\/div>)/,'$1<p class="v13-product-type">商品类型：<b>'+label+'</b></p>');}
let productProject=shop();
function prepareProduct(){if(productProject!==shop()){B.skuDraft=null;productProject=shop();}const id=A.params.get('id')||'';if(id&&!N.raw(id))throw Error('请选择本店商品进行编辑');}
A.register({M11:()=>{prepareProduct();const h=old.M11(),d=B.skuDraft;return typeLabel(insert(h,'v19-product-save',matrix(d.editId,d.skus.map(s=>[s.id,s.label||'新规格']),d)),'实体商品');}});
const productSave=A.forms['v19-product-save'];
A.forms['v19-product-save']=f=>{
 prepareProduct();if(!B.skuDraft)old.M11();const d=B.skuDraft,variants=d.skus.map((s,i)=>[s.id,f['label-'+i]||s.label]),rows=priceRows(f,variants),known=new Set(allProducts().map(p=>p.id)),id=d.editId;
 productSave(f);const p=id?N.raw(id):allProducts().find(p=>p.project===shop()&&!known.has(p.id));if(!p)throw Error('商品保存失败，请重试');p.product_type='physical';savePrices(p.id,rows,variants);A.render();return p;
};

// 原“新增服务”跳转第一条服务；这里补齐新增表单，继续使用同一排期保存流程。
function newServiceEditor(){const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i);return iso(d);}),slots=['09:00','11:00','14:00','16:00','18:00'];return '<div class="v03-page-editor"><div class="v03-editor-head"><h2>新增服务</h2>'+link('返回服务管理','M04',{},'btn light')+'</div>'+form('v03-service-save','<input type="hidden" name="id" value="">'+input('name','服务／场地名称','','text','required')+select('type','服务类型',['场地使用','课程服务','私教服务','康养服务'].map(x=>[x,x]),'场地使用')+select('category','展示分类',['运动健康','商务社交','休闲康养','文化社区'].map(x=>[x,x]),'运动健康')+select('settlement','结算分类',['运动服务分账','餐饮商品分账','康养服务分账','待绑定'].map(x=>[x,x]),'待绑定')+input('basePrice','客户身份价（元）','','number','min="0" step="0.01" required')+input('duration','单次预约时长（分钟）',60,'number','min="1" max="480" step="1" required')+'<h3 class="v03-form-section">可预约日期</h3><div class="v03-date-grid">'+days.map(date=>'<label class="v03-date-check"><input type="checkbox" name="date-'+date+'" value="yes"><b>'+date.slice(5)+'</b></label>').join('')+'</div><h3 class="v03-form-section">日期下的时间段</h3><div class="v03-slot-grid v03-slot-admin">'+slots.map(time=>'<label class="v03-slot-check"><input type="checkbox" name="slot-'+time+'" value="yes"><span>'+time+'</span></label>').join('')+'</div>'+input('rule','预约／会员规则','按预约时段使用','text','required')+select('attendeeMode','到场人数录入',[['type','按服务类型默认规则'],['show','显示 · 允许填写到场人数'],['hidden','隐藏 · 按单人使用核验']],'type')+'<label class="field"><span>预约、凭证及安全使用规则</span><textarea name="usageRules" rows="5" required></textarea></label>'+input('cover','服务封面','assets/home-pool.jpg','text','required')+'<label class="field"><span>前台服务介绍</span><textarea name="introduction" rows="3"></textarea></label>'+matrix('塑造新服务',[['standard','标准服务']]),'保存服务与排期')+'</div>';}
A.actions['v03-service-edit']=d=>A.go('M09',d?.id?{id:d.id}:{});
A.actions['xmind-service-edit']=A.actions['v03-service-edit'];
A.register({M09:()=>{const id=A.params.get('id');if(!id)return typeLabel(newServiceEditor(),'预约服务');const s=M.service(id);if(!s||s.project!==shop())return '<div class="v07-pc-form">'+A.empty('请选择本店服务进行编辑')+'</div>';const cfg=V.v03.merchantServices[id]||{},base=s.v13MerchantService?input('basePrice','客户身份价（元）',cfg.v13BasePrice/100,'number','min="0" step="0.01" required')+input('duration','单次预约时长（分钟）',cfg.v13Duration||60,'number','min="1" max="480" step="1" required'):'';return typeLabel(insert(old.M09().replace('data-form="xmind-service-save"','data-form="v03-service-save"'),'v03-service-save',base+matrix(id,T.variants(id))),'预约服务');}});
const serviceSave=A.forms['xmind-service-save']||A.forms['v03-service-save'];
function saveService(f){
 let s=f.id?M.service(f.id):null;if(f.id&&(!s||s.project!==shop()))throw Error('请选择本店服务进行编辑');const create=!f.id,custom=create||s.v13MerchantService;
 if(!['type','show','hidden'].includes(f.attendeeMode)||!f.usageRules?.trim())throw Error('请填写人数录入方式和服务使用规则');
 if(create&&!f.name?.trim())throw Error('请填写服务名称');const variants=create?[['standard','标准服务']]:T.variants(s.id),rows=priceRows(f,variants);let base,duration;
 if(custom){base=amount(f.basePrice);duration=Number(f.duration);if(!Number.isInteger(duration)||duration<1||duration>480)throw Error('预约时长须为1—480分钟');}
 if(create){s={id:A.C.uid('SVC'),project:shop(),name:f.name.trim(),kind:f.type,category:f.category,rights:['待配置','待配置','待配置','待配置'],raw:'商家维护服务',note:f.usageRules,status:'已上架',source:'商家维护',v13MerchantService:true};A.services.push(s);S.v13MerchantServices.push(s);}
 const id=s.id,previous={...V.v03.merchantServices[id]},identityPrices=Object.fromEntries(['ma','mc','na','nc'].map(identity=>['price-'+identity,previous.prices?.[identity]]));serviceSave({...identityPrices,...f,id});V.v03.merchantServices[id]={...previous,...V.v03.merchantServices[id],attendeeMode:f.attendeeMode,usageRules:f.usageRules.trim(),cover:f.cover??previous.cover,introduction:f.introduction??previous.introduction};s.product_type='booking';
 if(custom){Object.assign(V.v03.merchantServices[id],{v13BasePrice:base,v13Duration:duration});Object.assign(s,{kind:f.type,category:f.category,note:f.usageRules});if(f.name?.trim())s.name=f.name.trim();const stored=S.v13MerchantServices.find(x=>x.id===id);if(stored&&stored!==s)Object.assign(stored,s);}
 savePrices(id,rows,variants);A.render();return s;
}
A.forms['v03-service-save']=saveService;A.forms['xmind-service-save']=saveService;
// 新增服务使用商家配置的身份价，会员覆盖仍读取原有 T.priceRule。
const previousOffer=A.offer;
const merchantOffer=(s,identity=S.identity,variant='standard',memberId)=>{if(!s?.v13MerchantService)return previousOffer(s,identity,variant,memberId);const cfg=V.v03.merchantServices[s.id]||{},r=T.priceRule(s.id,variant,memberId,identity),price=r?r.price:cfg.v13BasePrice;return {amount:price??null,text:Number.isSafeInteger(price)?money(price):'查看详情',duration:cfg.v13Duration||60,unit:'／次',raw:'商家配置价格',variant,memberPrice:!!r};};
A.offer=merchantOffer;T.offer=merchantOffer;

// 运营保留可筛选目录；价格配置统一从商家商品／服务编辑进入。
function readonlyCatalog(){const f=A.filters.v11Products||{},services=A.services.filter(s=>!S.hiddenServices.includes(s.id)&&V.v03.merchantServices[s.id]?.status!=='已下架'),rows=[...X.allGoods(),...services].filter(p=>(!f.project||p.project===f.project)&&(!f.query||((M.service(p.id)?A.v05.serviceName(p):p.name)+' '+(p.menuCategory||p.category||'')).includes(f.query)));return '<div class="v07-pc-toolbar"><h3>运营商品管理</h3><span class="muted">全部商家上架商品／服务</span></div>'+form('v11-product-search','<div class="v11-inline-filter">'+input('query','商品名称／分类',f.query||'','search')+select('project','商家所属会所',[['','全部会所'],...Object.entries(A.projects)],f.project||'')+'</div>','查询')+table(['商品／服务','商家','分类','规格','销售状态'],rows.map(p=>[E(M.service(p.id)?A.v05.serviceName(p):p.name),E(p.merchantName||p.merchant||A.projects[p.project]+'会所商家'),E(p.menuCategory||p.category||'其他'),E(T.variants(p.id).map(v=>v[1]).join('、')),E(p.status||'已上架')]));}
A.register({A03:readonlyCatalog,A35:readonlyCatalog,M15:()=>A.views.M05(),M05:()=>{const params=A.params,id=params.get('id');let html;try{params.delete('id');html=old.M05();}finally{if(id!==null)params.set('id',id);}return html.replace(/<button\b[^>]*data-action="v12-price-open"[^>]*>[\s\S]*?<\/button>/g,'');}});
const operatorPage=A.pages.find(p=>p.id==='A03');if(operatorPage)operatorPage.desc='查看各商家上架商品与服务';
for(const id of ['A35','M15']){const p=A.pages.find(p=>p.id===id);if(p)p.hidden=true;}
for(const group of A.navigationGroups)group.ids=group.ids.filter(id=>!['A35','M15'].includes(id));
A.actions['v12-price-open']=()=>{throw Error('原会员价配置入口已无效，请在商家商品或服务编辑表单中维护会员价格');};
A.forms['v20-price-save']=()=>{throw Error('原会员价配置入口已无效，请在商家商品或服务编辑表单中维护会员价格');};
A.forms['v20-price-item']=()=>{throw Error('原会员价配置入口已无效，请在商家商品或服务编辑表单中维护会员价格');};
A.register({A29:()=>old.A29().replace(/免费与专享价格在[\s\S]*?中按会籍卡、规格配置。/,'免费与专享价格由商家在商品／服务添加、编辑时按会籍卡和规格配置。')});
const servicesView=A.views.M04;A.register({M04:()=>servicesView().replace('会员价格从权益表读取','会员价格在服务添加、编辑时按会籍卡和规格配置').replace(/权益管理／价目表/g,'服务会员价配置')});
A.v13Merchant={matrix};
})();
