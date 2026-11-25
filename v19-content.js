/* V0.14：权益分类标签、商家工单入口、本地活动图片及简洁邀请函。 */
(()=>{'use strict';
const A=Club;if(A.v19Content)return;
const U=A.v07UI,X=A.v14Experience,{E,kv}=A;if(!X)return;

// 只增强现有钱包导航，权益数据、选券和服务使用仍由当前钱包提供。
function decorateWallet(html){
 return html.replace(/<nav class="v19-wallet-cats(?: v19-content-categories)?"([^>]*)>([\s\S]*?)<\/nav>/g,(_all,attributes,body)=>'<nav class="v19-wallet-cats v19-content-categories"'+attributes+'>'+pressed(body)+'</nav>')
  .replace(/<div class="v07-status-row v19-wallet-states(?: v19-content-statuses)?">([\s\S]*?)<\/div>/g,(_all,body)=>'<div class="v07-status-row v19-wallet-states v19-content-statuses" aria-label="权益状态">'+pressed(body)+'</div>');
}
function pressed(html){return html.replace(/<button\b([^>]*)>/g,(_all,attributes)=>'<button'+attributes.replace(/\saria-pressed="[^"]*"/g,'')+' aria-pressed="'+(/\bclass="[^"]*\bon\b/.test(attributes)?'true':'false')+'">');}
for(const id of ['U03','U20']){const view=A.views[id];A.register({[id]:()=>decorateWallet(view())});}
const wallet=U.walletBody;U.walletBody=()=>decorateWallet(wallet());

const staffHome=A.views.S01;
A.register({S01:()=>staffHome().replace(/<div class="v07-staff-quick">([\s\S]*?)<\/div>/,(_all,tiles)=>'<div class="v07-staff-quick">'+tiles+'<a href="'+A.href('S07')+'">'+A.icon('chat-dot-round')+'<b>工单处理</b></a></div>')});
const ticketsPage=A.pages.find(p=>p.id==='S07');if(ticketsPage)ticketsPage.hidden=false;
const navigation=A.mobileNavigation;A.mobileNavigation=(route,tabs,active)=>{const result=navigation(route,tabs,active);return ['S07','S12'].includes(route)?{...result,active:'S01'}:result;};

function imageUpload(src){
 return '<section class="v19-content-image-field" aria-label="活动与内容图片"><span>图片素材</span><div class="v19-content-image-box"><img data-v19-content-preview src="'+E(src)+'" alt="当前内容图片预览"><div><label class="v19-content-image-picker"><span>'+A.icon('upload2')+'选择本地图片</span><input type="file" name="v19-content-image" accept="image/jpeg,image/png,image/webp"></label><p>支持 JPG、PNG、WebP，文件不超过 2MB</p><small data-v19-content-upload-status role="status">选择后预览，保存内容后生效</small></div></div><input type="hidden" name="image" value="'+E(src)+'"></section>';
}
for(const id of ['A22','M23']){const view=A.views[id];A.register({[id]:()=>{
 let html=view();const original=html.match(/data-form="([^"]+)"/)?.[1],activity=id==='M23'||/<option value="activity" selected>/.test(html);
 html=html.replace(/data-form="(?:xmind-article-save|v03-article-save|v14-merchant-article-save)"/,'data-form="'+(id==='M23'?'v14-merchant-article-save':activity?'v03-article-save':original)+'" data-v19-content-route="'+id+'" data-v19-content-original="'+E(original)+'" data-v19-content-activity="'+activity+'"');
 return html.replace(/<label class="field"><span>[^<]+<\/span><input\b[^>]*name="image"[^>]*><\/label>/,field=>{const value=field.match(/\bvalue="([^"]*)"/)?.[1]||'';return imageUpload(value.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'));});
}});}
const activeReads=new WeakMap();
function uploadImage(field){
 if(field?.name!=='v19-content-image')return;
 const file=field.files?.[0];if(!file)return;
 const f=field.form,hidden=f?.elements.image;if(!hidden)return;
 const stamp={};activeReads.set(field,stamp);
 const status=f.querySelector('[data-v19-content-upload-status]'),submit=f.querySelector('button[type="submit"]');
 const finish=()=>{if(submit)submit.disabled=false;};
 if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>2*1024*1024){finish();field.value='';const message='请选择 2MB 以内的 JPG、PNG 或 WebP 图片';if(status)status.textContent=message;A.toast(message);return false;}
 if(submit)submit.disabled=true;if(status)status.textContent='正在读取图片…';
 const reader=new FileReader();reader.onload=()=>{
  if(activeReads.get(field)!==stamp)return;
  finish();const src=String(reader.result||'');
  if(!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src)){if(status)status.textContent='图片读取失败，请重新选择';A.toast('图片读取失败，请重新选择');return;}
  hidden.value=src;const preview=f.querySelector('[data-v19-content-preview]');if(preview){preview.src=src;preview.alt='所选内容图片预览';}
  if(status)status.textContent='已选择 '+file.name+'，保存后生效';
 };
 reader.onerror=()=>{if(activeReads.get(field)!==stamp)return;finish();if(status)status.textContent='图片读取失败，请重新选择';A.toast('图片读取失败，请重新选择');};
 reader.readAsDataURL(file);return true;
}
document.addEventListener('change',e=>{
 const el=e.target,f=el?.form;
 if(el?.name==='contentKind'&&f?.dataset.v19ContentRoute==='A22')f.dataset.form=el.value==='activity'||f.dataset.v19ContentActivity==='true'?'v03-article-save':f.dataset.v19ContentOriginal;
 uploadImage(el);
});

// 在原公开邀请模型中补充邀请人；只发送公开安排，不添加订单和核销信息。
const createInvitation=X.createInvitation,parseInvitation=X.parseInvitation,resolveInvitation=X.resolveInvitation;
X.createInvitation=id=>{
 const invitation=createInvitation(id),record=A.S.v14Experience.invitations[invitation.snapshot.key];
 const inviter=record.inviter||String(A.S.profile.nickname||'会所邀约').trim().slice(0,30)||'会所邀约';
 record.inviter=inviter;invitation.snapshot.inviter=inviter;
 invitation.url=invitation.url.split('?')[0]+'?'+new URLSearchParams({invite:JSON.stringify(invitation.snapshot)});A.save();return invitation;
};
X.parseInvitation=raw=>{const snapshot=parseInvitation(raw);if(!snapshot)return null;let source;try{source=JSON.parse(raw);}catch{return null;}if(source.inviter!==undefined&&(typeof source.inviter!=='string'||source.inviter.length>30))return null;return {...snapshot,inviter:source.inviter?.trim()||''};};
X.resolveInvitation=raw=>{const found=resolveInvitation(raw),snapshot=X.parseInvitation(raw);if(!found||!snapshot)return null;const inviter=found.local?A.S.v14Experience.invitations[snapshot.key]?.inviter||snapshot.inviter:snapshot.inviter;return {...found,snapshot:{...found.snapshot,inviter:inviter||'会所邀约'}};};
A.register({U38:()=>{
 A.v13Scan?.clear();const found=X.resolveInvitation(A.params.get('invite'));if(!found)return U.head('邀请函','U01')+U.pad(A.empty('邀请链接不完整，邀请信息不可用，请向邀请人索取完整链接。'));
 const p=found.snapshot,invalid=found.local&&['已取消','已退款'].includes(found.order?.status)?'<p class="v19-invitation-invalid" role="status">预约'+E(found.order.status)+'</p>':'';
 return '<div class="v14-invitation-page">'+U.head('邀请函','U01')+U.pad('<article class="v14-invitation v19-content-invitation"><div class="v14-invitation-mark">宸 <span>CLUB</span></div><small class="v14-invitation-eyebrow">A MOMENT TO SHARE</small><p class="v14-invitation-to"><b>'+E(p.inviter)+'</b><br>诚邀您参加</p><h1>'+E(p.activity||p.service)+'</h1>'+invalid+'<div class="v14-invitation-date"><b>'+E(Number(p.date.slice(5,7))+'月'+Number(p.date.slice(8))+'日')+'</b><span>'+E(p.time+'—'+p.end)+'</span><small>'+E(p.date)+'</small></div><div class="v14-invitation-facts">'+kv('活动地点','<a class="v14-address" href="'+E(X.mapURL(p.address))+'" target="_blank" rel="noopener" aria-label="打开地图导航至'+E(p.address)+'">'+E(p.address)+'<small>打开地图导航 '+A.icon('location-outline')+'</small></a>')+'</div></article>')+'</div>';
}});
// 保持原分享弹层与复制、系统分享实现，更新它们共用的同一份链接对象。
const share=A.actions['v14-share-voucher'];A.actions['v14-share-voucher']=data=>{
 let captured;const modal=A.modal;A.modal=(...args)=>{captured=args;};let invitation;
 try{invitation=share(data);}finally{A.modal=modal;}
 const enriched=X.createInvitation(data.id),previous=invitation.url;Object.assign(invitation,enriched);
 if(captured){captured[1]=captured[1].replaceAll(E(previous),E(invitation.url));modal(...captured);}return invitation;
};
A.v19Content={decorateWallet,uploadImage};
})();
