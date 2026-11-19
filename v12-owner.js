/* Word V0.9：关注演示与预约联系人；不改变首页及既有交易报价。 */
(()=>{'use strict';
const A=Club;if(A.v12Owner)return;
const M=A.v07,U=A.v07UI,{B,shop}=M,{E,input}=A;

// 每个会所仅补一次演示关注，取消后及重新载入均不再补回。
function seedFollowing(){
 if(A.S.guest)return;
 const demo=B.v12FollowDemo??={projects:[],shops:false},project=shop();let changed=false;
 if(!demo.projects.includes(project)){
  const services=A.services.filter(s=>s.project===project&&!A.S.hiddenServices.includes(s.id)),products=M.products(),chosen=[...services.slice(0,3),...products.slice(0,2)];
  for(const item of [...services,...products])if(chosen.length<5&&!chosen.some(x=>x.id===item.id))chosen.push(item);
  A.S.favorites=[...new Set([...(A.S.favorites||[]),...chosen.map(x=>x.id)])];B.v11Favorites=[...A.S.favorites];demo.projects.push(project);changed=true;
 }
 if(!demo.shops){A.S.v11FollowedShops=[...new Set([...(A.S.v11FollowedShops||[]),...Object.keys(A.projects)])];demo.shops=true;changed=true;}
 if(changed)A.save();
}
const following=A.views.U36;A.register({U36:()=>{seedFollowing();return following();}});

const member=d=>M.members().find(m=>m.id===d?.memberId);
function defaults(d){const m=member(d);d.name??=m?.name||'';d.phone??=m?.phone||'';return d;}
function syncSelectionContact(d){const selection=B.proxy?.selections[d.lines?.[0]?.item];if(selection)Object.assign(selection,{name:d.name,phone:d.phone});}
function contactFields(d,prefix='',id=''){
 const data=id?' data-id="'+E(id)+'"':'';
 return '<section class="v12-booking-contact" aria-label="预约联系信息"><h3>联系信息</h3>'+input(prefix+'name','联系人',d.name||'','text','maxlength="30" placeholder="请填写姓名" required'+data)+input(prefix+'phone','联系电话',d.phone||'','tel','inputmode="tel" maxlength="11" placeholder="请填写联系电话" required'+data)+'</section>';
}
const schedule=A.v07Admin.schedule;A.v07Admin.schedule=s=>{
 let h=schedule(s);const d=B.proxy.selections[s.id];
 return h.replace(/(<label class="field"><span>备注说明<\/span>)/,contactFields(d,'proxy-',s.id)+'$1');
};
const prepare=A.actions['v07-proxy-confirm'];A.actions['v07-proxy-confirm']=d=>{
 // Read live fields before the previous action navigates and replaces the form.
 // Input values may not have emitted change yet (for example autofill or a
 // synthetic click immediately after filling the field).
 if(d.mode==='booking')for(const el of document.querySelectorAll('[name="proxy-name"],[name="proxy-phone"]'))storeContact(el);
 const selected=d.mode==='booking'?B.proxy?.selections[B.proxy.selected[0]]:null;
 const contact=selected?{name:selected.name,phone:selected.phone}:null;
 prepare(d);
 if(contact&&B.checkout?.kind==='booking'){for(const key of ['name','phone'])if(contact[key]!==undefined)B.checkout[key]=contact[key];A.save();}
};
// 会员价格和权益仍关联原会员，联系人可以是本次实际到场的人。
const choose=A.actions['v07-member-select'];A.actions['v07-member-select']=d=>{
 const checkout=B.checkout,previous=member(checkout),prior={name:checkout?.name,phone:checkout?.phone};choose(d);
 if(checkout?.kind==='booking'){const next=member(checkout);for(const key of ['name','phone'])if(!prior[key]||prior[key]===previous?.[key])checkout[key]=next?.[key]||'';syncSelectionContact(checkout);A.save();}
};
const checkoutBody=U.checkoutBody;U.checkoutBody=d=>{
 if(d.kind!=='booking'||!d.operator)return checkoutBody(d);
 defaults(d);let h=checkoutBody(d);
 h=h.replace(/<label class="field"><span>[^<]*<\/span><input\b[^>]*name="(?:name|phone)"[^>]*><\/label>/g,'');
 return h.replace(/(<form data-form="v07-submit"[^>]*><div class="error" role="alert"><\/div>)/,'$1'+contactFields(d));
};
function storeContact(el){
 if(['proxy-name','proxy-phone'].includes(el.name)){const d=B.proxy?.selections[el.dataset.id];if(d){d[el.name.slice(6)]=el.value;A.save();}}
 else if(['name','phone'].includes(el.name)&&B.checkout?.kind==='booking'&&el.closest?.('[data-form="v07-submit"]')){B.checkout[el.name]=el.value;syncSelectionContact(B.checkout);A.save();}
}
document.addEventListener('input',e=>storeContact(e.target));
document.addEventListener('change',e=>storeContact(e.target));
function checkedContact(d,f){
 const m=member(d),name=String(f.name??d.name??m?.name??'').trim(),phone=String(f.phone??d.phone??m?.phone??'').trim();
 if(!name||name.length>30)throw Error('请填写30字以内的联系人姓名');
 if(!/^1[3-9]\d{9}$/.test(phone)&&!(phone===m?.phone&&/^1\d{2}\*{4}\d{4}$/.test(phone)))throw Error('请填写有效的联系电话');
 return {name,phone};
}
const submitForm=A.forms['v07-submit'];A.forms['v07-submit']=f=>{
 const d=B.checkout;if(!d?.operator||d.kind!=='booking')return submitForm(f);
 const contact=checkedContact(d,f);Object.assign(d,contact);return submitForm({...f,...contact});
};
const submit=M.submit;M.submit=d=>{
 const g=submit(d);
 if(d.operator&&d.kind==='booking'&&(d.name||d.phone)){const contact={user:d.name||member(d)?.name||'到店客人',phone:d.phone||member(d)?.phone||''};for(const id of g.orderIds){const o=A.S.orders.find(o=>o.id===id);if(o)Object.assign(o,contact);}g.contact=contact;A.save();}
 return g;
};
A.v12Owner={};
})();
