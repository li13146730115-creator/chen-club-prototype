/* Word V0.11：共享场地按重叠时段人数限额，展示开关不影响名额校验。 */
(()=>{'use strict';
const A=Club;if(A.v14Capacity)return;
const M=A.v07,C=A.C,S=A.S,{B,shop}=M,{E,input,select}=A;
const venuePool=s=>/泳池/.test(s?.name||'')&&!/私教|课程|教练/.test(s?.kind||'');
const serviceFor=req=>M.service(req.service||req.item||String(req.resource||'').replace(/-[12]$/,''));
function config(service,state=S){const s=typeof service==='string'?M.service(service):service,stored=state.v02?.v03?.merchantServices?.[s?.id]||{},legacy=state.configs?.['res-'+s?.id]||{};return {bookingMode:stored.bookingMode||(venuePool(s)?'shared':'exclusive'),capacity:Number(stored.capacity??legacy.capacity??(venuePool(s)?20:99)),showBookingCount:stored.showBookingCount===undefined?venuePool(s):[true,'true','yes','1',1].includes(stored.showBookingCount)};}
const minute=time=>{const parts=String(time||'').split(':');return Number(parts[0])*60+Number(parts[1]);};
const headcount=o=>Number(o.people??o.attendees??o.totalVisitors??1);
const active=o=>!['已取消','已退款','已完成'].includes(o.status)&&!(o.amount>0&&o.refunded>=o.amount);
const overlaps=(o,req)=>minute(req.time)<minute(o.time)+Number(o.duration)&&minute(o.time)<minute(req.time)+Number(req.duration);
function summary(req,state=S,exclude){
 const svc=serviceFor(req),cfg=config(svc,state),requested=headcount(req),matching=(state.orders||[]).filter(o=>o.id!==exclude&&o.project===req.project&&o.date===req.date&&active(o)&&overlaps(o,req)),orders=matching.filter(o=>o.resource===req.resource),events=new Map(),start=minute(req.time),end=start+Number(req.duration);
 for(const o of orders){const from=Math.max(start,minute(o.time)),to=Math.min(end,minute(o.time)+Number(o.duration)),n=Number.isSafeInteger(headcount(o))&&headcount(o)>0?headcount(o):1;events.set(from,(events.get(from)||0)+n);events.set(to,(events.get(to)||0)-n);}
 let current=0,booked=0;for(const [,delta]of [...events].sort((a,b)=>a[0]-b[0])){current+=delta;booked=Math.max(booked,current);}
 const available=cfg.bookingMode==='exclusive'&&orders.length?0:Math.max(0,cfg.capacity-booked),conflict=req.personnel?matching.find(o=>o.personnel===req.personnel):undefined,valid=Number.isSafeInteger(requested)&&requested>=1&&requested<=99;
 return {...cfg,booked,available,requested,open:valid&&requested<=available&&!conflict,conflict,orders};
}
function resolve(state,req,exclude){
 const svc=serviceFor(req);if(!svc)return undefined;
 const cfg=config(svc,state),n=headcount(req);if(!Number.isSafeInteger(n)||n<1||n>99)return {message:'到场人数须为1—99的整数'};
 if(n>cfg.capacity)return {message:'到场人数超过场地容量（'+cfg.capacity+'人）'};
 if(cfg.bookingMode!=='shared')return undefined;
 const count=summary(req,state,exclude);if(count.conflict)return {...count.conflict,message:'服务人员时段已被占用，请重新选择'};
 if(!count.open)return {message:'预约人数超过剩余容量，当前仅可预约'+count.available+'人',capacity:count.capacity,booked:count.booked};
 return null;
}
function slotLabel(req,exclude,open){const count=summary(req,S,exclude);if(!count.showBookingCount)return open===false?'已约满':'可预约';return '<span class="v14-slot-booked">已预约 '+count.booked+' / '+count.capacity+'人</span><span class="v14-slot-available">可预约 '+count.available+'人</span>'+(!count.open?'<span class="v14-slot-full">'+(count.conflict?'人员时段冲突':count.available?'本次人数超出余量':'已约满')+'</span>':'');}

// 泳池场地的20人为演示容量；泳池私教仍按独占资源预约。
for(const s of A.services.filter(venuePool)){const cfg=S.v02.v03.merchantServices[s.id]??={};cfg.bookingMode??='shared';cfg.capacity??=20;cfg.showBookingCount??=true;S.configs['res-'+s.id]={...S.configs['res-'+s.id],capacity:cfg.capacity};}
C.setOccupiedResolver(resolve);
A.v14Capacity={config,summary,slotLabel};

function capacityFields(s){const cfg=s?config(s):{bookingMode:'exclusive',capacity:99,showBookingCount:false};return '<section class="v14-capacity-config"><h3>预约人数与容量</h3>'+select('showBookingCount','预约页显示预约人数',[['yes','开启 · 展示已预约与可预约人数'],['no','关闭 · 隐藏人数']],cfg.showBookingCount?'yes':'no')+select('bookingMode','场地预约方式',[['exclusive','独占预约 · 同一时段仅接待一笔预约'],['shared','共享预约 · 按到场人数占用名额']],cfg.bookingMode)+input('capacity','饱和人数／场地容量',cfg.capacity,'number','min="1" max="999" step="1" required')+'<p class="muted">共享场地按重叠时段到场人数限制预约；关闭人数显示后仍执行容量校验。</p></section>';}
const editor=A.views.M09;A.register({M09:()=>editor().replace(/<form data-form="(?:v03|xmind)-service-save"[\s\S]*?<\/form>/g,form=>form.replace(/(<button\b[^>]*type="submit"[^>]*>)/,capacityFields(M.service(A.params.get('id')))+'$1'))});
function capacityValues(f,previous){const next={...previous};if(Object.hasOwn(f,'bookingMode')){if(!['shared','exclusive'].includes(f.bookingMode))throw Error('请选择有效的场地预约方式');next.bookingMode=f.bookingMode;}if(Object.hasOwn(f,'capacity')){const n=Number(f.capacity);if(!Number.isSafeInteger(n)||n<1||n>999)throw Error('饱和人数／场地容量须为1—999的整数');next.capacity=n;}if(Object.hasOwn(f,'showBookingCount')){if(![true,false,'yes','no','true','false','1','0',1,0].includes(f.showBookingCount))throw Error('请选择是否显示预约人数');next.showBookingCount=[true,'yes','true','1',1].includes(f.showBookingCount);}return next;}
const serviceSave=A.forms['v03-service-save'];
function saveService(f){const s=f.id?M.service(f.id):null,previous=s?config(s):{bookingMode:'exclusive',capacity:99,showBookingCount:false},next=capacityValues(f,previous),saved=serviceSave(f);Object.assign(S.v02.v03.merchantServices[saved.id],next);S.configs['res-'+saved.id]={...S.configs['res-'+saved.id],capacity:next.capacity};A.save();A.render();return saved;}
A.forms['v03-service-save']=saveService;A.forms['xmind-service-save']=saveService;

// 服务详情以当前选择或第一个开放时段展示，避免把全天不重叠的人数相加。
const detail=A.views.U06;A.register({U06:()=>{const html=detail(),s=M.service(A.params.get('id'));if(!s||s.project!==shop()||!config(s).showBookingCount)return html;const draft=B.ownerDraft?.service===s.id?B.ownerDraft:{},date=draft.date||A.v08.days(s)[0],time=draft.times?.[0]||A.v08.times(s)[0],resource=draft.resource||s.id+'-1',req={project:shop(),service:s.id,resource,date,time,duration:A.offer(s,S.identity,draft.variant||'standard').duration||60,people:draft.people||1},count=summary(req),section='<section class="mall-card v14-capacity-overview" aria-label="当前预约人数与场地容量"><div><h3>预约人数</h3><small>'+E(date+' '+time+' · 场地'+(resource.endsWith('-2')?'2':'1'))+'</small></div><p>'+slotLabel(req,undefined,count.open)+'</p><meter min="0" max="'+count.capacity+'" value="'+Math.min(count.booked,count.capacity)+'" aria-label="已预约'+count.booked+'人，饱和人数'+count.capacity+'人"></meter></section>';return html.replace(/(<section class="mall-card v19-merchant">)/,section+'$1');}});

// 代客选时段时带上本次人数；人数变化立即刷新剩余名额和禁用状态。
A.actions['v07-time']=d=>{const st=B.proxy?.selections[d.id],s=M.service(d.id);if(!st||!s)throw Error('请先选择预约服务');const q=A.offer(s,'na',st.variant),busy=C.occupied(S,{project:shop(),service:s.id,resource:st.resource,date:st.date,time:d.value,duration:q.duration||60,people:st.people,personnel:st.personnel});if(busy)throw Error(busy.message||'该时段已约满');st.times=st.times?.[0]===d.value?[]:[d.value];A.save();A.render();};
document.addEventListener('change',e=>{if(e.target.name==='proxy-people'){const d=B.proxy?.selections[e.target.dataset.id];if(d){d.people=Number(e.target.value);d.times=[];A.save();A.render();}}});
A.save();
})();
