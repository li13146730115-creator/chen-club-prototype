/* Word V0.10：完整价格展示、预约选券数量及服务卡标签；沿用既有报价与资产模型。 */
(()=>{'use strict';
const A=Club;if(A.v13Owner)return;
const M=A.v07,N=A.v09,T=A.v10,U=A.v07UI,{B}=M,{E,money,btn,empty}=A;
const canonical=id=>String(id||'').replace(/^PLAN:/,'');
function servicePrice(s,identity=A.S.identity,variant='standard'){
 const q=A.offer(s,identity,variant);
 return Number.isFinite(q.amount)?money(q.amount)+'/次':'查看详情';
}
function itemPrice(item,skuId){const s=M.service(item);if(s)return servicePrice(s,A.S.identity,skuId||'standard');const p=N.raw(item);if(!p)return '查看详情';try{return money(N.sku(p,skuId).amount);}catch{return '查看详情';}}
function priceNote(note){const text=String(note||''),time=text.match(/^[／/]\s*(\d+(?:\.\d+)?)?\s*(小时|分钟)$/);return time?'每次'+(time[1]||'1')+time[2]:/^[／/]\s*\d*(?:次|位|节|人|场)$/.test(text)?'':text;}
const quote=A.quote;A.quote=s=>{const q=quote(s);return {...q,title:servicePrice(s),sub:priceNote(q.sub)};};
if(A.v12Pricing)A.v12Pricing.label=servicePrice;
// 横向场景卡直接拼接 offer.unit，仅整理其价格段落。
const component=A.v07Decoration.component;A.v07Decoration.component=(...args)=>{const h=component(...args);return typeof h==='string'?h.replace(/(<p\b[^>]*>)(¥[\d,.]+\/次)\s*(?:·\s*)?([／/][^<]+)(<\/p>)/g,(_all,start,price,note,end)=>start+price+(priceNote(note)?' · '+priceNote(note):'')+end):h;};
function labels(h){return h.replace(/[（(]已购(演示)?[）)]/g,(_all,demo)=>demo?'（演示）':'').replace(/<(span|small|em)\b[^>]*>\s*已购\s*<\/\1>/g,'').replace(/>已购课卡</g,'>课卡<');}
function walletPrices(h){
 const rows=T.wallet();
 return h.replace(/<article\b[^>]*class="v19-benefit[^>]*>[\s\S]*?<\/article>/g,card=>{
  const id=card.match(/data-action="v20-wallet-use" data-id="([^"]+)"/)?.[1],c=rows.find(c=>c.id===id);if(!c||['代金券','折扣券'].includes(c.couponType))return card;
  const price=itemPrice(c.item,c.skuId);
  if(c.unlimited||c.memberPrice!==undefined)return card.replace(/(<strong class="v20-member-price">)[\s\S]*?(<\/strong>)/,'$1'+E(price)+'$2');
  return card.replace(/(<div class="v19-benefit-main"><h3>[\s\S]*?<\/h3>)/,'$1<p class="v13-benefit-price">'+E(price)+'</p>');
 });
}
const wallet=U.walletBody;U.walletBody=()=>labels(walletPrices(wallet()));
for(const id of ['U03','U20']){const view=A.views[id];A.register({[id]:()=>walletPrices(view())});}
for(const id of ['U06','U27','U33']){const view=A.views[id];A.register({[id]:()=>{
 let h=view();const item=A.params.get('id'),s=M.service(item),p=N.raw(item);if(!s&&!p)return h;
 const price=s?servicePrice(s,A.S.identity,A.params.get('variant')||'standard'):itemPrice(item),markup='<div class="v19-price">'+E(price)+'</div>';
 return h.replace(/(<section class="mall-card v19-product-intro">)(?:<div class="v19-price">[\s\S]*?<\/div>)?/,'$1'+markup);
}});}
const bookingView=A.views.U07;A.register({U07:()=>{
 let h=bookingView();const d=B.ownerDraft,s=M.service(d?.service);if(!s)return h;
 h=h.replace(/(<section class="mall-card v19-booking-product">[\s\S]*?<b>[\s\S]*?<\/b>)(?:<strong class="v19-price">[\s\S]*?<\/strong>)?/,'$1<strong class="v19-price">'+E(servicePrice(s,A.S.identity,d.variant))+'</strong>');
 const id=canonical(d.asset),n=d.couponQuantities?.[id];
 if(n)h=h.replace(/已选择1张适用卡券/,'本次使用 '+n+' '+E(A.v08.bookingCoupons(s).find(c=>canonical(c.key)===id)?.unit||'张'));
 return h;
}});
const following=A.views.U36;A.register({U36:()=>following().replace(/<article class="v11-follow-card">[\s\S]*?<\/article>/g,card=>{
 const ref=card.match(/href="#\/(U06|U33)\?id=([^"&]+)/);if(!ref)return card;
 return card.replace(/(<small>(?:商品|服务)<\/small>)/,'$1<p class="v13-follow-price">'+E(itemPrice(decodeURIComponent(ref[2])))+'</p>');
})});
const couponButton=A.v08.couponButton;A.v08.couponButton=(context,selected,items)=>{
 const h=couponButton(context,selected,items),d=B.checkout;if(context!=='checkout'||d?.kind!=='booking')return h;
 try{const used=M.quote(d).used,summary=used.map(u=>u.quantity+' '+(items.find(c=>c.id===u.id)?.unit||'张')).join('、');return h.replace(/<p>[\s\S]*?<\/p>/,'<p>'+E(summary?'本次使用 '+summary:'本次未使用卡券')+'</p>');}catch{return h;}
};
// 目录卡的内部 label 是旧闭包，仅补齐其展示行，不改商品和报价数据。
for(const id of ['S03','S10','A27','A28','M17']){const view=A.views[id];A.register({[id]:()=>view().replace(/<article class="v12-catalog-card[^>]*>[\s\S]*?<\/article>/g,card=>{
 const item=card.match(/data-action="v07-proxy-service" data-id="([^"]+)"/)?.[1]||card.match(/data-item="([^"]+)"/)?.[1];if(!item)return card;
 const price=M.service(item)?servicePrice(M.service(item),'na'):itemPrice(item,card.match(/data-sku="([^"]+)"/)?.[1]);
 return card.replace(/(<div class="v12-catalog-action">)(?:<strong>[\s\S]*?<\/strong>|<span><\/span>)/,'$1<strong>'+E(price)+'</strong>');
})});}

function ownerItems(){A.v12Pricing?.seedServiceCoupons();const s=M.service(B.ownerDraft?.service);return s?A.v08.bookingCoupons(s):[];}
const reservation=p=>p&&(p.context==='booking'||B.checkout?.kind==='booking');
const cash=c=>['代金券','折扣券'].includes(c.couponType);
const hours=c=>c.unit==='小时'&&!cash(c),validQuantity=(n,c)=>hours(c)?Number.isFinite(n)&&n>0:Number.isSafeInteger(n)&&n>=1;
function bookingItems(p=B.couponPicker){return p?.context==='booking'?ownerItems():M.coupons(B.checkout?.memberId,B.checkout?.lines||[]).map(c=>({...c,key:c.id}));}
function bookingPicker(){
 const p=B.couponPicker;if(!reservation(p))return null;
 const d=p.context==='booking'?B.ownerDraft:B.checkout,items=bookingItems(p);let saved=d?.couponQuantities||{};
 if(p.context!=='booking'&&!p.quantities){const used=M.quote(d).used;saved={...Object.fromEntries(used.map(c=>[c.id,c.quantity])),...saved};}
 p.quantities??={};for(const c of items)p.quantities[c.key]??=saved[canonical(c.key)]??(p.context==='booking'?quantityBounds(c,p).max:1);
 for(const id of [...p.selected]){const c=items.find(c=>c.key===id);if(!c){p.selected=p.selected.filter(x=>x!==id);continue;}const bounds=quantityBounds(c,p);if(bounds.max<bounds.min)p.selected=p.selected.filter(x=>x!==id);else p.quantities[id]=Math.max(bounds.min,Math.min(bounds.max,p.quantities[id]));}
 return p;
}
const open=A.actions['v08-coupon-open'];A.actions['v08-coupon-open']=d=>{const result=open(d);bookingPicker();return result;};
function quantityBounds(c,p=B.couponPicker){
 // 旧履约次卡按预约时段核销，不能人为多扣或少扣；新券复用 couponQuantities。
 const owner=p.context==='booking',d=owner?B.ownerDraft:B.checkout,legacy=owner&&!c.key.startsWith('PLAN:');let lines;
 if(owner){const s=M.service(d.service),q=A.offer(s,A.S.identity,d.variant);lines=Array.from({length:Math.max(1,d.times?.length||1)},()=>({item:s.id,variant:d.variant||'standard',qty:1,duration:q.duration||60,price:q.amount,gross:q.amount,discount:0}));}
 else{const others=p.selected.filter(id=>id!==c.key&&!cash(bookingItems(p).find(c=>c.key===id)||{})),quantities=Object.fromEntries(others.map(id=>[id,p.quantities[id]||1]));lines=M.quote({...d,coupons:others,couponQuantities:quantities}).lines;}
 const eligible=lines.filter(l=>T.matches(c,l)),value=eligible.reduce((n,l)=>n+Math.max(0,l.gross-(l.discount||0)),0),items=owner?[]:bookingItems(p),demand=eligible.reduce((n,l)=>{const used=(l.couponUses||[]).reduce((sum,u)=>sum+u.quantity/(hours(items.find(c=>c.key===u.id)||{})?(l.duration||60)/60:1),0);return n+(l.price>0&&l.gross>(l.discount||0)?Math.max(0,l.qty-used)*(hours(c)?(l.duration||60)/60:1):0);},0),needed=legacy?lines.length:cash(c)?value>0?1:0:hours(c)?demand:Math.floor(demand+1e-8),max=Math.min(needed,c.remaining);
 return {min:legacy?needed:hours(c)?Math.min(.25,max)||.25:1,max,step:!legacy&&hours(c)?.25:1};
}
const quantityButton=(label,id,delta,disabled)=>btn(label,'v11-coupon-qty',{id,delta},'').replace('<button ','<button '+(disabled?'disabled ':''));
function bookingCouponPage(){
 const p=bookingPicker();if(!p)return null;const items=bookingItems(p);
 const body='<p class="v08-picker-caption">选择适用卡券并调整本次使用数量，抵扣以预约内容为准。</p><div class="v11-coupon-list">'+items.map(c=>{
  const selected=p.selected.includes(c.key),bounds=quantityBounds(c,p);if(p.context==='booking'&&!c.key.startsWith('PLAN:'))p.quantities[c.key]=bounds.min;
  const n=p.quantities[c.key]||1;
  return '<article class="v11-coupon-row '+(selected?'on':'')+'"><button type="button" class="v11-coupon-select" data-action="v11-coupon-toggle" data-id="'+E(c.key)+'" aria-pressed="'+selected+'" '+(bounds.max<bounds.min?'disabled':'')+'><span class="v11-checkmark">'+(selected?'✓':'')+'</span><span><b>'+E(c.alias||c.name)+'</b><small>有效至 '+E(c.expiry)+'</small><small>可用 '+c.remaining+' '+E(c.unit||'张')+' · 本次最多 '+bounds.max+' '+E(c.unit||'张')+'</small></span></button>'+(selected?'<div class="v11-coupon-use"><span>本次使用（'+E(c.unit||'张')+'）</span><span class="v07-qty v11-quantity">'+quantityButton('−',c.key,-Math.min(bounds.step,n-bounds.min)||-bounds.step,n<=bounds.min)+'<b aria-live="polite">'+n+'</b>'+quantityButton('+',c.key,Math.min(bounds.step,bounds.max-n)||bounds.step,n>=bounds.max)+'</span></div>':'')+'</article>';
 }).join('')+'</div>'+(!items.length?empty('当前服务暂无可用卡券'):'')+btn('不使用卡券','v08-coupon-none',{},'btn light full mb')+btn('确认选择','v08-coupon-done',{},'btn gold-btn full');
 return /^[AM]/.test(A.route)?'<div class="v07-pc-form narrow"><h2>选择权益卡</h2>'+body+'</div>':U.head('选择卡券',p.returnRoute).replace('href="'+A.href(p.returnRoute)+'"','href="'+A.href(p.returnRoute,p.returnArgs)+'"')+U.pad(body);
}
for(const id of ['U31','S15','A31','M18']){const view=A.views[id];A.register({[id]:()=>id==='S15'&&B.loggedOut?U.head('员工登录','U01')+U.pad('<h2>已退出登录</h2>'+btn('重新登录','v07-login',{},'btn gold-btn full')):reservation(B.couponPicker)?bookingCouponPage():view()});}
const toggle=A.actions['v11-coupon-toggle'];A.actions['v11-coupon-toggle']=d=>{
 const p=bookingPicker();if(!p)return toggle(d);const c=bookingItems(p).find(c=>c.key===d.id);if(!c)throw Error('卡券已失效或不适用');
 if(p.selected.includes(d.id))p.selected=p.selected.filter(id=>id!==d.id);else{const bounds=quantityBounds(c,p);if(bounds.max<bounds.min)throw Error('本次预约无可抵扣数量');p.selected=p.context==='booking'?[d.id]:[...p.selected,d.id];p.quantities[d.id]=Math.max(bounds.min,Math.min(bounds.max,p.quantities[d.id]||bounds.min));}A.save();A.render();
};
const quantity=A.actions['v11-coupon-qty'];A.actions['v11-coupon-qty']=d=>{
 const p=bookingPicker();if(!p)return quantity(d);const c=bookingItems(p).find(c=>c.key===d.id);if(!c)throw Error('请选择适用卡券');
 const bounds=quantityBounds(c,p),n=(p.quantities[d.id]||1)+Number(d.delta);if(!validQuantity(n,c)||n<bounds.min||n>bounds.max)throw Error('卡券使用数量为'+bounds.min+'—'+bounds.max);
 if(!p.selected.includes(d.id))p.selected=p.context==='booking'?[d.id]:[...p.selected,d.id];p.quantities[d.id]=n;A.save();A.render();
};
const done=A.actions['v08-coupon-done'];A.actions['v08-coupon-done']=()=>{
 const p=bookingPicker();if(p){for(const selected of p.selected){const c=bookingItems(p).find(c=>c.key===selected),n=p.quantities[selected]||1;if(!c||!validQuantity(n,c)||n<quantityBounds(c,p).min||n>quantityBounds(c,p).max)throw Error('卡券使用数量超出可用余额');}if(p.context==='booking')B.ownerDraft.couponQuantities=Object.fromEntries(p.selected.map(id=>[canonical(id),p.quantities[id]||1]));}
 return done();
};
const draftForm=A.forms['book-draft'];A.forms['book-draft']=f=>{
 const d=B.ownerDraft,asset=f.asset??d?.asset??'',id=canonical(asset),n=d?.couponQuantities?.[id],c=ownerItems().find(c=>c.key===asset);
 if(asset&&!c)throw Error('卡券已失效或不适用');
 if(asset&&n!==undefined&&(!validQuantity(n,c)||n>c.remaining))throw Error('卡券使用数量超出可用余额');
 const quantities=asset&&n!==undefined?{[id]:n}:{},result=draftForm(f),checkout=A.draft?.v07Checkout;
 if(checkout){checkout.couponQuantities=Object.fromEntries(checkout.coupons.filter(id=>quantities[id]!==undefined).map(id=>[id,quantities[id]]));const q=M.quote(checkout);if(!A.draft.v08Legacy){A.draft.amount=q.total;checkout.couponQuantities=Object.fromEntries(q.used.map(c=>[c.id,c.quantity]));checkout.coupons=q.used.map(c=>c.id);if(asset.startsWith('PLAN:')&&!checkout.coupons.length){A.draft.asset='';if(B.ownerDraft)B.ownerDraft.asset='';}}if(B.ownerDraft&&(n!==undefined||!asset))B.ownerDraft.couponQuantities=A.draft.v08Legacy?quantities:{...checkout.couponQuantities};A.save();A.render();}
 return result;
};
// 只去除购买状态标签；购卡入口、来源、财务文本和资产记录照常显示。
for(const [id,view]of Object.entries(A.views))A.register({[id]:(...args)=>labels(view(...args))});
A.v13Owner={servicePrice,labels};
})();
