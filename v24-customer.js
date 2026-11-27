/* 无会籍与游客购物演示；交易继续复用商城规格、购物车和订单。 */
(()=>{'use strict';
const A=Club,M=A.v07,{B,shop}=M,U=A.v07UI,{E,link,btn,money}=A;
const copy=x=>JSON.parse(JSON.stringify(x)),inProject=()=>shop()==='zj',guest=()=>inProject()&&A.S.guest;
function session(){const id=B.v24CustomerSession?.memberId;return M.members('zj').find(m=>m.id===id&&m.v24Customer);}
function customerName(phone,id){const base='顾客'+phone.slice(-4);let name=base,n=0;while(M.members().some(m=>m.id!==id&&m.name===name))name=base+' · '+phone.slice(3,7)+(n++?'-'+n:'');return name;}
function restoreCustomer(m){A.S.guest=false;A.S.identity=m.identity;A.S.memberRole='visitor';Object.assign(A.S.profile,{nickname:m.name,phone:m.phone,avatar:m.avatar||''});}
function clearIntent(){B.v24LoginIntent=null;B.v16LoginReturn=null;}
function enterProject(){const m=session();if(m&&!B.v24CustomerSession.loggedOut)restoreCustomer(m);else{A.S.guest=true;A.S.identity='na';A.S.memberRole='visitor';Object.assign(A.S.profile,{nickname:'游客',phone:'',avatar:''});}}
const projectSelect=A.actions['project-select'];
A.actions['project-select']=d=>{if(!A.projects[d.id])return projectSelect(d);B.v24Profiles??={};if(!inProject())B.v24Profiles[shop()]=copy(A.S.profile);clearIntent();B.checkout=null;B.specDraft=null;B.walletUse=null;projectSelect(d);if(inProject())enterProject();else{const cached=B.v24Profiles[shop()],m=M.members()[0];if(cached)Object.assign(A.S.profile,cached);else if(m)Object.assign(A.S.profile,{nickname:m.name,phone:m.phone,avatar:m.avatar||''});}A.save();A.render();};
if(inProject()&&!B.v24Initialized)enterProject();B.v24Initialized=true;
const me=A.v08.me;A.v08.me=()=>guest()?null:inProject()&&session()&&!B.v24CustomerSession.loggedOut?session():me();
const ownerScope=()=>inProject()&&A.route.startsWith('U')&&(guest()||A.v08.me()?.v24Customer);
const currentOrders=A.currentOrders;A.currentOrders=(...args)=>{const rows=currentOrders(...args);return ownerScope()?rows.filter(o=>!A.S.guest&&o.memberId===A.v08.me()?.id):rows;};
function guardOrder(id){if(ownerScope()&&!A.currentOrders().some(o=>o.id===id))throw Error('该订单不属于当前账号');}
for(const key of ['v04-cancel','v19-order-cancel','reschedule','refund-request','refund-edit','v04-pay-confirm']){const previous=A.actions[key];if(previous)A.actions[key]=(d,...args)=>{guardOrder(typeof d==='string'?d:d.id);return previous(d,...args);};}
for(const key of ['v08-reschedule','reschedule','refund-request','review-refund']){const previous=A.forms[key];if(previous)A.forms[key]=(f,...args)=>{guardOrder(f.id);return previous(f,...args);};}
const pay=A.actions['v19-wechat-pay'];A.actions['v19-wechat-pay']=(d,...args)=>{if(ownerScope()){const g=B.groups.find(g=>g.id===d.id&&g.project===shop());if(A.S.guest||!g||g.memberId!==A.v08.me()?.id)throw Error('该订单不属于当前账号');}return pay(d,...args);};
// 旧演示数据中有未绑定持有人的卡券，新登录顾客不能继承这些演示资产。
const assets=A.assets;A.assets=(...args)=>{const rows=assets(...args),m=A.v08.me();return inProject()&&m?.v24Customer?rows.filter(a=>a.memberId===m.id):rows;};
const wallet=A.v10.wallet;A.v10.wallet=()=>{const rows=wallet(),m=A.v08.me();return inProject()&&m?.v24Customer?rows.filter(a=>a.memberId===m.id):rows;};A.v09.walletCards=A.v10.wallet;

function storeView(){if(!inProject())return U.head('会所商城','U01')+U.pad(A.empty('请先切换至中建项目会所'));const products=M.products().filter(p=>!p.passService),head=U.head('会所商城','U01').replace('<span></span></header>',link('购物车','U29',{},'link')+'</header>');return '<div class="mall-core v24-store">'+head+U.pad('<div class="v24-store-intro"><small>'+E(A.projects[shop()])+'</small><h3>为日常，添一份喜欢</h3><p>'+(guest()?'游客可浏览商品，购买时请先登录。':'已登录 · 按商品标价购买')+'</p></div><div class="v24-shop-products">'+products.map(p=>'<a class="v24-shop-product" href="'+A.href('U33',{id:p.id})+'"><img src="'+E(p.image)+'" alt="'+E(p.name)+'"><div><h3>'+E(p.name)+'</h3><small>'+E(p.menuCategory||p.category||'')+'</small><b>'+money(A.v09.sku(p).amount)+'</b></div></a>').join('')+'</div>')+'</div>';}
if(!A.pages.some(p=>p.id==='U42'))A.pages.push({id:'U42',title:'会所商城',role:'U',desc:'中建项目会所商品与游客购买登录',hidden:true});
const home=A.views.U01,loginPage=A.views.U39;
A.register({U42:storeView,U01:()=>{const h=home();if(!inProject())return h;return h.replace(/(<section\b[^>]*component-membership\b[^]*?<\/section>)/,'$1<a class="v24-shop-entry" href="'+A.href('U42')+'"><span>'+A.icon('shopping-cart-full')+'</span><div><b>会所商城</b><small>'+(guest()?'随心逛逛 · 购买前登录':'精选商品 · 随心选购')+'</small></div>'+A.icon('arrow-right')+'</a>');},U39:()=>inProject()?customerLogin():loginPage()});
function intentSummary(){const intent=B.v24LoginIntent;if(!intent||intent.project!==shop())return '';const rows=intent.kind==='buy'?[{item:intent.spec.item,skuId:intent.spec.skuId,qty:intent.spec.qty}]:intent.lines||[];return rows.map(l=>{const p=M.products().find(p=>p.id===l.item);if(!p)return '';let sku;try{sku=A.v09.sku(p,l.skuId);}catch{return '<p role="alert">所选商品规格已调整，请返回重新选择。</p>';}
 return '<div class="v24-login-product"><img src="'+E(sku.image)+'" alt="'+E(p.name)+'"><div><b>'+E(p.name)+'</b><small>'+E(sku.label)+' · ×'+l.qty+'</small></div><span>'+money(sku.amount*l.qty)+'</span></div>';}).join('');}
function customerLogin(){const summary=intentSummary();return '<div class="mall-core v16-login v24-customer-login"><header class="mp-head v05-centered-head"><button class="owner-back" data-action="v24-login-cancel" aria-label="返回上一页">'+A.icon('arrow-left')+'</button><h2>账号登录</h2><span></span></header>'+U.pad('<section class="v16-login-intro"><span class="v16-login-mark">宸</span><h3>'+(summary?'登录后继续购买':'欢迎来到宸CLUB')+'</h3><p>登录后保留已选商品，继续确认订单。</p><small>'+E(A.projects[shop()])+'</small></section>'+(summary?'<section class="v24-login-selection" aria-label="已选商品">'+summary+'</section>':'')+A.form('v16-member-login',A.input('phone','手机号','','tel','inputmode="tel" autocomplete="tel" maxlength="11" placeholder="请输入手机号" required')+A.input('code','验证码','','text','inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="请输入验证码" required')+'<p class="v16-login-tip">演示验证码：123456</p>','登录并继续')+btn('暂不登录，继续浏览','v24-login-cancel',{},'v24-login-cancel')+'<p class="v24-login-note">登录即可购买商品，会籍需单独开通。</p>')+'</div>';}
function requireLogin(intent){B.v24LoginIntent={project:shop(),...intent};B.v16LoginReturn=null;B.checkout=null;A.close();A.save();A.go('U39');}
const confirmSpec=A.actions['v19-spec-confirm'];A.actions['v19-spec-confirm']=d=>{if(!guest()||B.specDraft?.mode!=='buy')return confirmSpec(d);const spec=B.specDraft,p=M.products().find(p=>p.id===spec.item),sku=A.v09.sku(p,spec.skuId);if(!Number.isInteger(spec.qty)||spec.qty<1||spec.qty>sku.stock)throw Error('所选规格库存不足');requireLogin({kind:'buy',spec:copy(spec),back:{route:'U33',args:{id:p.id}}});};
const cartCheckout=A.actions['v09-cart-checkout'];function checkoutCart(d){if(!guest())return cartCheckout(d);const rows=M.cart().filter(l=>l.selected!==false);M.quote({kind:'retail',lines:rows,coupons:[],identity:'na'});requireLogin({kind:'cart',lines:copy(rows),back:{route:'U29',args:{}}});}
for(const key of ['v09-cart-checkout','v07-cart-checkout','cart-checkout']){const previous=A.actions[key];A.actions[key]=d=>guest()?checkoutCart(d):previous(d);}
const navigation=A.mobileNavigation;A.mobileNavigation=(route,tabs,active)=>route==='U42'?{tabs:[],active:''}:navigation(route,tabs,active);
A.actions['v24-login-cancel']=()=>{const intent=B.v24LoginIntent,back=intent?.project===shop()?intent.back:{route:'U01',args:{}};clearIntent();A.save();A.go(back.route,back.args);};
A.actions['v24-login-open']=()=>{clearIntent();A.go('U39');};
A.actions['v24-membership-contact']=()=>A.go('U14');
const originalLogin=A.forms['v16-member-login'];A.forms['v16-member-login']=f=>{
 if(!inProject())return originalLogin(f);
 const phone=String(f.phone||'').trim();if(!/^1[3-9]\d{9}$/.test(phone))throw Error('请输入有效的11位手机号');if(String(f.code||'').trim()!=='123456')throw Error('验证码不正确，请输入演示验证码 123456');
 const intent=B.v24LoginIntent;if(intent&&intent.project!==shop())throw Error('会所已切换，请返回重新选择商品');
 const next=B.v16LoginReturn||{route:A.params.get('next')||'U01',args:A.params.get('id')?{id:A.params.get('id')}:{}};
 if(!['U01','U06','U07','U22','U29','U33'].includes(next.route))throw Error('登录后返回页面无效');
 let m=M.members().find(m=>m.v24Customer&&m.phone===phone);if(!m){m={id:A.C.uid('CUSTOMER'),project:shop(),name:customerName(phone),phone,identity:'na',status:'启用',planIds:[],expiry:'',family:[],joinDate:M.iso(),v24Customer:true};A.S.v02.members.push(m);}else m.name=customerName(phone,m.id);
 B.v24CustomerSession={memberId:m.id,loggedOut:false};restoreCustomer(m);clearIntent();B.walletUse=null;A.save();
 try{if(intent?.kind==='buy'){B.specDraft=copy(intent.spec);confirmSpec();}else if(intent?.kind==='cart')cartCheckout();else A.go(next.route,next.args);}catch(error){B.checkout=null;A.save();A.go(intent?.back?.route||'U42',intent?.back?.args||{});A.toast(error.message);}
};
const logout=A.actions.logout;A.actions.logout=d=>{if(inProject()&&B.v24CustomerSession)B.v24CustomerSession.loggedOut=true;clearIntent();return logout(d);};
A.v24Customer={version:1};A.save();
})();
