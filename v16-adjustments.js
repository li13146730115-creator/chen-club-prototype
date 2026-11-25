/* V0.12：预约展示、首页组件顺序、桌码下载及员工移动端收敛。 */
(()=>{'use strict';
const A=Club;if(A.v16Adjustments)return;
const M=A.v07,U=A.v07UI,{B,shop}=M,{E,link,input}=A;

function moveCalendar(html){
 const entry='<a class="v14-calendar-entry" href="'+A.href('U37')+'"><span class="v14-entry-icon">'+A.icon('date')+'</span><span><b>活动月历</b><small>把喜欢的相聚，放进日程</small></span><span aria-hidden="true">'+A.icon('arrow-right')+'</span></a>';
 html=html.replace(entry,'');
 const today=/<section class="decor-component home-component component-today\b[\s\S]*?<\/section>/;
 if(today.test(html))return html.replace(today,section=>section+entry);
 return html.replace(/<div class="home-content">/,'<div class="home-content">'+entry);
}
function improveRecent(html){
 return html.replace(/<a class="v07-recent-row[^\"]*" href="#\/U05">暂无近期预约，去发现服务<\/a>/,
  '<div class="v16-recent-empty"><span class="v16-recent-empty-icon" aria-hidden="true">'+A.icon('date')+'</span><div><b>暂无近期预约</b><small>选个喜欢的服务，看看可约日期与时段</small></div>'+link('发现服务','U05',{},'v16-recent-cta')+'</div>');
}
const home=A.views.U01;
A.register({U01:()=>improveRecent(moveCalendar(home()))});

function poolService(s){return /泳池/.test(s?.name||'')&&!/私教|课程|教练/.test(s?.kind||'');}
function poolCapacity(s){
 const cfg=A.v14Capacity.config(s);if(!cfg.showBookingCount)return '';
 const d=B.ownerDraft?.service===s.id?B.ownerDraft:A.v08.bookingState(s),date=d.date||A.v08.days(s)[0],time=d.times?.[0]||A.v08.times(s)[0],resource=d.resource||s.id+'-1',duration=A.offer(s,A.S.identity,d.variant||'standard').duration||60;
 const req={project:shop(),service:s.id,resource,date,time,duration,people:Number(d.people||1)},count=A.v14Capacity.summary(req),meter=Math.min(count.booked,count.capacity);
 return '<section class="mall-card v16-pool-capacity" aria-label="泳池预约人数"><div class="v16-pool-capacity-head"><div><h3>预约人数</h3><small>'+E(date+' '+time+' · 场地'+(resource.endsWith('-2')?'2':'1'))+'</small></div><span class="v16-pool-status">'+(count.open?'可预约':'已约满')+'</span></div><div class="v16-pool-capacity-counts"><span><b>'+count.booked+'</b><small>已预约</small></span><span class="v16-pool-capacity-divider">/</span><span><b>'+count.available+'</b><small>可预约</small></span><span class="v16-pool-capacity-total">饱和人数 '+count.capacity+' 人</span></div><meter min="0" max="'+count.capacity+'" value="'+meter+'" aria-label="已预约'+count.booked+'人，可预约'+count.available+'人"></meter></section>';
}
function poolCardCapacity(s){
 const cfg=A.v14Capacity.config(s);if(!cfg.showBookingCount)return '';
 const d=B.ownerDraft?.service===s.id?B.ownerDraft:A.v08.bookingState(s),date=d.date||A.v08.days(s)[0],time=d.times?.[0]||A.v08.times(s)[0],resource=d.resource||s.id+'-1',duration=A.offer(s,A.S.identity,d.variant||'standard').duration||60;
 const count=A.v14Capacity.summary({project:shop(),service:s.id,resource,date,time,duration,people:1});
 return '<small class="v16-pool-card-count"><span>已预约 '+count.booked+' / '+count.capacity+'人</span></small>';
}
function addPoolCardCounts(html,c){
 const rows=A.v05.today(c),byId=new Map(rows.map(s=>[s.id,s]));
 return html.replace(/<a class="home-today-card" href="#\/U06\?id=([^"]+)">([\s\S]*?)<\/a>/g,(all,id,body)=>{
  const s=byId.get(id)||M.service(id),count=s&&poolService(s)?poolCardCapacity(s):'';
  return count?'<a class="home-today-card" href="#/U06?id='+id+'">'+body.replace('<span class="home-today-action">',count+'<span class="home-today-action">')+'</a>':all;
 });
}
const baseV05Component=A.v05.component;
A.v05.component=(c,...args)=>{const html=baseV05Component(c,...args);return c?.type==='today'&&typeof html==='string'?addPoolCardCounts(html,c):html;};
const baseDecorComponent=A.decor.component;
A.decor.component=(c,...args)=>{const html=baseDecorComponent(c,...args);return c?.type==='today'&&typeof html==='string'&&!html.includes('v16-pool-card-count')?addPoolCardCounts(html,c):html;};
const baseDecorationView=A.v07Decoration.component;
A.v07Decoration.component=(c,...args)=>{const html=baseDecorationView(c,...args);return c?.type==='today'&&typeof html==='string'&&!html.includes('v16-pool-card-count')?addPoolCardCounts(html,c):html;};
const booking=A.views.U07,serviceDetail=A.views.U06,cart=A.views.U29,orderDetail=A.views.U30,orderConfirm=A.views.U22;
function loginView(){return '<div class="mall-core v16-login"><header class="mp-head v05-centered-head"><a class="owner-back" href="'+A.href('U01')+'">'+A.icon('arrow-left')+'</a><h2>会员登录</h2><span></span></header><div class="mp-pad"><section class="v16-login-intro"><span class="v16-login-mark">宸</span><h3>登录宸 CLUB</h3><p>登录后可预约会所服务、使用会员权益并完成点单。</p></section>'+A.form('v16-member-login',A.input('phone','手机号','','tel','inputmode="tel" maxlength="11" placeholder="请输入手机号" required')+A.input('code','验证码','','text','inputmode="numeric" maxlength="6" required')+'<p class="v16-login-tip">演示验证码：123456</p>','登录并继续')+'</div></div>';}
if(!A.pages.some(p=>p.id==='U39'))A.pages.push({id:'U39',title:'会员登录',role:'U',desc:'登录后继续预约或下单',hidden:true});
function loginReturn(route,args={}){B.v16LoginReturn={route,args};A.save();A.go('U39');}
A.register({
 U39:loginView,
 U06:()=>{let html=serviceDetail().replace(/<section class="mall-card v14-capacity-overview"[^>]*>[\s\S]*?<\/section>/g,'');if(A.S.guest)html=html.replace(/href="#\/U07\?id=([^"]+)"/g,'href="#/U39?next=U07&amp;id=$1"').replace(/>(立即预约|立即购买)</g,'>登录后预约</g');return html;},
 U07:()=>{const s=M.service(A.params.get('id'));if(A.S.guest)return U.head('立即预约','U06')+U.pad('<section class="v16-login-required"><h3>登录后预约服务</h3><p>请先登录会员账号，再选择日期、场地和时段。</p>'+link('去登录','U39',{next:'U07',id:s?.id||''},'btn gold-btn full')+'</section>');const d=s?A.v08.bookingState(s):B.ownerDraft||{},member=A.S.identity.startsWith('m')?A.v08.me():null;if(s&&d.contactIdentity!==A.S.identity){d.contactIdentity=A.S.identity;d.user=member?.name||A.S.profile.nickname;d.phone=member?(A.S.profile.phone||member.phone):'';B.ownerDraft=d;A.save();}let html=booking();if(s&&poolService(s)){const widget=poolCapacity(s);if(widget)html=html.replace(/(<section class="mall-card v19-booking-product">[\s\S]*?<\/section>)/,'$1'+widget);}if(s&&html.includes('data-form="book-draft"')){const contact='<div class="v11-booking-contact">'+input('user','使用人',d.user||'','text','maxlength="30" required')+input('phone','联系电话',d.phone||'','tel','inputmode="tel" maxlength="11" required')+'</div>';html=html.replace(/<div class="v11-booking-contact">[\s\S]*?<\/div>/,contact);}return html;},
 U22:()=>A.S.guest?U.head('确认订单','U29')+U.pad('<section class="v16-login-required"><h3>登录后提交订单</h3><p>登录会员账号后可继续确认商品、规格和配送信息。</p>'+link('去登录','U39',{next:'U22'},'btn gold-btn full')+'</section>'):orderConfirm(),
 U29:()=>cart().replace('mp-head v05-centered-head','mp-head v05-centered-head v16-order-head'),
 U30:()=>orderDetail().replace('mp-head v05-centered-head','mp-head v05-centered-head v16-order-head'),
});

const originalCart=A.actions['v09-cart-checkout'];if(originalCart)A.actions['v09-cart-checkout']=d=>A.S.guest?(loginReturn('U29'),undefined):originalCart(d);
const originalCartLegacy=A.actions['cart-checkout'];if(originalCartLegacy)A.actions['cart-checkout']=d=>A.S.guest?(loginReturn('U29'),undefined):originalCartLegacy(d);
const originalSpec=A.actions['v19-spec-confirm'];if(originalSpec)A.actions['v19-spec-confirm']=d=>{if(A.S.guest&&B.specDraft?.mode==='buy'){loginReturn('U33',{id:B.specDraft.item});return;}return originalSpec(d);};
const originalDraft=A.forms['book-draft'];if(originalDraft)A.forms['book-draft']=f=>{if(A.S.guest){loginReturn('U07',{id:f?.service||A.params.get('id')||''});return;}return originalDraft(f);};
const originalPlace=A.forms['place-order'];if(originalPlace)A.forms['place-order']=f=>{if(A.S.guest){loginReturn('U22');return;}return originalPlace(f);};
const originalOwnerSubmit=A.forms['v09-owner-submit'];if(originalOwnerSubmit)A.forms['v09-owner-submit']=f=>{if(A.S.guest){loginReturn('U22');return;}return originalOwnerSubmit(f);};
A.forms['v16-member-login']=f=>{const phone=String(f.phone||'').trim(),code=String(f.code||'').trim();if(!/^1[3-9]\d{9}$/.test(phone))throw Error('请输入有效的11位手机号');if(code!=='123456')throw Error('验证码不正确，请输入演示验证码 123456');const member=A.v08.me();if(!member)throw Error('当前项目暂无可登录会员');A.S.guest=false;A.S.identity='ma';A.S.profile.nickname=member.name;A.S.profile.phone=phone;A.S.profile.avatar=member.avatar||A.S.profile.avatar;const route=B.v16LoginReturn?.route||A.params.get('next')||'U01',args=B.v16LoginReturn?.args||{};if(!['U01','U06','U07','U22','U29','U33'].includes(route))throw Error('登录后返回页面无效');if(!args.id&&A.params.get('id'))args.id=A.params.get('id');B.v16LoginReturn=null;A.save();A.go(route,args);};
const baseMobileNav=A.mobileNavigation;A.mobileNavigation=(route,tabs,active)=>route==='U39'?{tabs:[],active:''}:baseMobileNav(route,tabs,active);

function composeQrCard(qr,project,table,scene,menuName,merchantCategory,doc=document){
 const canvas=doc.createElement('canvas');canvas.width=720;canvas.height=940;
 const c=canvas.getContext('2d');if(!c)throw Error('无法生成桌码图片');
 c.fillStyle='#fffdf9';c.fillRect(0,0,canvas.width,canvas.height);
 c.fillStyle='#3c3028';c.textAlign='center';c.textBaseline='middle';
 c.font='600 30px Arial, sans-serif';if(!A.v20Brand?.drawWordmark?.(c,270,34,180))c.fillText(A.v20Brand?.name||'CHEN CLUB',360,52);
 c.drawImage(qr,100,105,520,520);
 c.font='500 30px "PingFang SC", "Microsoft YaHei", sans-serif';c.fillText(project,360,685);
 c.font='700 38px "PingFang SC", "Microsoft YaHei", sans-serif';c.fillText('桌号  '+table,360,745);
 c.font='24px "PingFang SC", "Microsoft YaHei", sans-serif';c.fillText(scene,360,795);
 c.fillText(menuName,360,835);
 c.font='21px "PingFang SC", "Microsoft YaHei", sans-serif';c.fillText(merchantCategory,360,875);
 return canvas;
}
A.v16QrCard=composeQrCard;
const downloadQr=A.actions['v13-download-qr'];
A.actions['v13-download-qr']=d=>{
 const t=A.v13Scan.tables().find(x=>x.id===d.id),qr=document.querySelector('.v13-qr-modal [data-qr] canvas,.v13-qr-modal [data-qr] img');
 if(!t||!qr)throw Error('二维码仍在生成，请稍后重试');
 const menu=A.v13Scan.menus().find(x=>x.id===t.menuId),image=composeQrCard(qr,A.projects[t.project],t.table,A.v13Scan.scenes[t.scene],menu?.name||'',menu?.merchantCategory||'');
 const a=document.createElement('a');a.href=image.toDataURL('image/png');a.download=A.projects[t.project]+'-'+t.table+'-'+t.scene+'.png';a.click();
};

// 移动端仅保留当前预约、订单与到场服务闭环的导航入口；被隐藏的独立模块仍保留原数据和路由。
const directoryPages=new Set(['S01','S03','S05','S10','S11']);
for(const p of A.pages)if(p.role==='S')p.hidden=!directoryPages.has(p.id);
const mobileNavigation=A.mobileNavigation;
A.mobileNavigation=(route,tabs,active)=>{
 if(route.startsWith('S')){
  const staffTabs=[['工作台','S01'],['代客预约','S03'],['扫码点单','S10'],['核销','S05'],['订单','S11']];
  const next=({S04:'S03',S08:'S11',S09:'S01',S14:'S05',S15:'S03'})[route]||route;
  return {tabs:staffTabs,active:staffTabs.some(x=>x[1]===next)?next:'S01'};
 }
 return mobileNavigation(route,tabs,active);
};
const staffHome=A.views.S01;
A.register({S01:()=>{
 let h=staffHome();
 h=h.replace(/<a\b[^>]*href="#\/S07"[^>]*>[\s\S]*?<\/a>/g,'');
 h=h.replace(/<a\b[^>]*href="#\/S02"[^>]*>[\s\S]*?<\/a>/g,'');
 h=h.replace(/<div class="v07-staff-metrics">[\s\S]*?<\/div>/,
  '<div class="v07-staff-metrics">'+
  '<a href="'+A.href('S11',{filter:'today'})+'"><b>'+A.currentOrders().filter(o=>o.project===shop()&&o.status==='待履约'&&o.paid).length+'</b><span>待履约预约</span><small>查看服务订单 ›</small></a>'+
  '<a href="'+A.href('S05')+'"><b>'+A.currentOrders().filter(o=>o.project===shop()&&o.status==='待履约'&&o.paid&&o.date===M.iso()).length+'</b><span>今日待核销</span><small>处理到场服务 ›</small></a></div>');
 h=h.replace(/<div class="v07-staff-quick">[\s\S]*?<\/div>/,
  '<div class="v07-staff-quick">'+[['代客预约','S03','date'],['现场核销','S05','full-screen'],['服务订单','S11','s-order']].map(([name,id,icon])=>'<a href="'+A.href(id)+'">'+A.icon(icon)+'<b>'+name+'</b></a>').join('')+'</div>');
 return h;
}});
document.addEventListener('change',e=>{
 const f=e.target?.closest?.('[data-form="book-draft"]');
 if(!f||!['resource','time','people','variant'].includes(e.target.name))return;
 const s=M.service(B.ownerDraft?.service);if(!poolService(s))return;
 const d=B.ownerDraft;d.resource=f.querySelector('[name="resource"]:checked')?.value||d.resource;
 d.times=[...f.querySelectorAll('[name="time"]:checked')].map(x=>x.value);
 d.people=Number(f.querySelector('[name="people"]')?.value||1);
 d.variant=f.querySelector('[name="variant"]:checked')?.value||d.variant;
 A.save();A.render();
});
A.v16Adjustments={moveCalendar,improveRecent,poolCapacity,composeQrCard,allowedStaffPages:[...directoryPages]};
})();
