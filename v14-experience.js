/* V0.11：共用内容数据的活动月历，以及不携带核销权限的公开邀请函。 */
(()=>{'use strict';
const A=Club;if(A.v14Experience)return;
const M=A.v07,U=A.v07UI,{B,shop,iso}=M,{E,btn,link,input,select,form,kv,table,empty}=A;
const V=A.S.v02,old={...A.views},display='首页／活动日历';
const state=()=>A.S.v14Experience??=({invitations:{},seeded:false,knownRecipient:!/^#\/U38(?:\?|$)/.test(location.hash||'')});
const clearScan=()=>A.v13Scan?.clear();
const cfg=s=>V.v03.merchantServices[s?.id]||{};
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&!Number.isNaN(new Date(value+'T12:00:00').getTime())&&iso(new Date(value+'T12:00:00'))===value;
const validTime=value=>/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value||'');
const monthValid=value=>/^\d{4}-(?:0[1-9]|1[0-2])$/.test(value||'');
const shortDate=value=>validDate(value)?Number(value.slice(5,7))+'月'+Number(value.slice(8))+'日':'待定日期';
const isCalendar=a=>a?.display===display&&a.contentKind!=='article';
const eventRows=(project=shop(),published=true)=>V.articles.filter(a=>a.project===project&&isCalendar(a)&&(!published||a.status==='已发布'));
const activity=(id,published=true)=>eventRows(shop(),published).find(a=>a.id===id);
const addressFor=s=>cfg(s).venueAddress||A.projects[s?.project||shop()]+'会所服务台（位置待会所核实）';
const resourceName=(s,id)=>A.v05.serviceName(s)+' · 场地'+(id?.endsWith('-2')?'2':'1');
const mapURL=address=>'https://maps.apple.com/?daddr='+encodeURIComponent(address)+'&dirflg=d';
function monthInfo(month){const value=monthValid(month)?month:iso().slice(0,7),[year,number]=value.split('-').map(Number);return {month:value,year,number,days:new Date(year,number,0).getDate(),offset:(new Date(year,number-1,1).getDay()+6)%7};}
function shiftMonth(month,delta){const m=monthInfo(month),date=new Date(m.year,m.number-1+Number(delta||0),1);return iso(date).slice(0,7);}
function seed(){
 if(state().seeded)return;
 const definitions=[
  {name:'冬日茶叙 · 在会所相聚',match:/茶室/,detail:'一起品茶与交流，留一段从容的邻里相聚时光。茶品与点单按现场菜单另计。'},
  {name:'一起动起来 · 健身体验',match:/健身|器械/,detail:'从热身与基础动作开始，熟悉会所健身空间。请穿运动服与运动鞋，依自身状态参与。'},
  {name:'舒展日常 · 午后瑜伽',match:/瑜伽|普拉提/,detail:'以呼吸、平衡和温和伸展开启轻盈午后。课程与场地权益按所选服务核验。'},
  {name:'一席相聚 · 周末家宴',match:/私宴/,detail:'为家人预留一席周末相聚，按所选宴席套餐安排。口味与忌口请在预约备注中说明。'},
  {name:'一本好书 · 邻里共读',match:/自习|艺廊|茶室/,detail:'带一本近期喜欢的书，分享一段阅读感受。请在公共空间保持安静，尊重每个人的交流时间。'}
 ];
 for(const project of Object.keys(A.projects)){
  const services=A.services.filter(s=>s.project===project&&!A.S.hiddenServices.includes(s.id));
  for(const [i,d]of definitions.entries()){
   const s=services.find(s=>d.match.test(s.name)&&!/私教|课程/.test(s.kind))||services.find(s=>d.match.test(s.name))||services[i%services.length];if(!s)continue;
   const id=i<2?'V05-CALENDAR-'+project+'-'+i:'V14-CALENDAR-'+project+'-'+i;
   let a=V.articles.find(a=>a.id===id);
   if(!a){const pilates=i===2&&/普拉提/.test(s.name);a={id,project,projects:[project],name:pilates?'舒展日常 · 普拉提体验':d.name,image:A.v09.cover(s.id),display,validity:'月度主题活动',detail:pilates?'在教练指导下体验普拉提的呼吸、核心稳定与温和伸展。请依自身状态参与，课程与场地权益按所选服务核验。':d.detail,status:'已发布',clicks:0,customerDemo:true};V.articles.push(a);}
   const dates=A.v08.days(s),times=A.v08.times(s),date=dates[Math.min(i+1,dates.length-1)]||iso(),time=/私宴/.test(s.name)?'18:00':times.includes('16:00')?'16:00':times[0]||'14:00',duration=A.offer(s).duration||60,end=new Date(date+'T'+time+':00');end.setMinutes(end.getMinutes()+duration);
   if(!a.eventDate)Object.assign(a,{eventDate:date,eventTime:time,eventEnd:end.toTimeString().slice(0,5),serviceId:s.id,resource:s.id+'-1',variant:M.variants(s)[0]?.[0]||'standard',address:A.projects[project]+'会所 · '+s.name+'（位置待会所核实）',bookingStatus:!A.offer(s).arrival&&A.offer(s).amount!==null?'开放预约':'暂未开放',contentKind:'activity'});
  }
 }
 state().seeded=true;A.save();
}
seed();

function bookable(a){
 if(!isCalendar(a)||a.project!==shop()||a.status!=='已发布')return {ok:false,reason:'当前活动已下架或未发布'};
 if(a.bookingStatus!=='开放预约')return {ok:false,reason:'活动预约暂未开放'};
 const s=M.service(a.serviceId);if(!s||s.project!==shop()||A.S.hiddenServices.includes(s.id)||cfg(s).status==='已下架')return {ok:false,reason:'关联服务暂未开放'};
 if(!validDate(a.eventDate)||a.eventDate<iso()||!A.v08.days(s).includes(a.eventDate))return {ok:false,reason:'活动日期尚未开放预约或已结束'};
 if(!validTime(a.eventTime)||!A.v08.times(s).includes(a.eventTime))return {ok:false,reason:'活动时段尚未开放预约'};
 if(a.eventDate===iso()&&a.eventTime<=new Date().toTimeString().slice(0,5))return {ok:false,reason:'活动时段已结束'};
 const offer=A.offer(s,A.S.identity,a.variant||'standard');if(offer.arrival||offer.amount===null)return {ok:false,reason:offer.arrival?'本服务无需预约，请按活动说明到场':'当前身份预约价格待确认，请联系会所'};
 const timing=eventTiming(s,a);if(!timing.end||a.eventEnd!==timing.end)return {ok:false,reason:eventTimingMessage(s,a)};
 if(![s.id+'-1',s.id+'-2'].includes(a.resource))return {ok:false,reason:'活动场地尚未配置'};
 if(A.C.occupied(A.S,{project:shop(),resource:a.resource,date:a.eventDate,time:a.eventTime,duration:offer.duration||60}))return {ok:false,reason:'活动场地时段已约满'};
 return {ok:true,service:s};
}
function requireEvent(id){const a=activity(id),check=bookable(a);if(!check.ok)throw Error(check.reason);return a;}
function calendarEntry(){return '<a class="v14-calendar-entry" href="'+A.href('U37')+'"><span class="v14-entry-icon">'+A.icon('date')+'</span><span><b>活动月历</b><small>把喜欢的相聚，放进日程</small></span><span aria-hidden="true">'+A.icon('arrow-right')+'</span></a>';}
function eventCard(a){const check=bookable(a);return '<a class="v14-event-card" href="'+A.href('U28',{id:a.id})+'"><time datetime="'+E(a.eventDate)+'"><b>'+Number(a.eventDate.slice(-2))+'</b><small>'+Number(a.eventDate.slice(5,7))+'月</small></time><img src="'+E(a.image)+'" alt=""><div><small>'+E(a.eventTime+'—'+a.eventEnd)+'</small><h3>'+E(a.name)+'</h3><p>'+E(M.service(a.serviceId)?.name||'会所活动')+'</p><span>'+E(check.ok?'可预约':check.reason)+'</span></div><span aria-hidden="true">›</span></a>';}
function calendar(){
 clearScan();
 const m=monthInfo(A.params.get('month')),rows=eventRows().filter(a=>validDate(a.eventDate)&&a.eventDate.startsWith(m.month)).sort((a,b)=>(a.eventDate+a.eventTime).localeCompare(b.eventDate+b.eventTime)),selected=validDate(A.params.get('day'))&&A.params.get('day').startsWith(m.month)?A.params.get('day'):null;
 const cells=Array.from({length:Math.ceil((m.offset+m.days)/7)*7},(_,i)=>{const day=i-m.offset+1;if(day<1||day>m.days)return '<span class="v14-calendar-blank" aria-hidden="true"></span>';const date=m.month+'-'+String(day).padStart(2,'0'),items=rows.filter(a=>a.eventDate===date);return '<button type="button" data-action="v14-calendar-day" data-day="'+date+'" class="'+(selected===date?'selected ':'')+(date===iso()?'today':'')+'" aria-pressed="'+(selected===date)+'" aria-label="'+E(shortDate(date)+(items.length?'，'+items.length+'项活动':'，暂无活动'))+'"><span>'+day+'</span><small>'+items.slice(0,3).map(()=>'<i></i>').join('')+'</small></button>';}).join('');
 const listed=selected?rows.filter(a=>a.eventDate===selected):rows;
 return U.head('活动月历','U05')+U.pad('<section class="v14-calendar-intro"><small>CHEN CLUB · TOGETHER</small><h1>日常，值得相聚</h1><p>在运动、茶叙与阅读之间，找到本月的好时光。</p></section><section class="v14-month-calendar" aria-label="活动月历"><header>'+btn('‹','v14-calendar-month',{month:shiftMonth(m.month,-1)},'v14-month-arrow')+'<div><b>'+m.year+'年 '+m.number+'月</b><small>MONTHLY CALENDAR</small></div>'+btn('›','v14-calendar-month',{month:shiftMonth(m.month,1)},'v14-month-arrow')+'</header><div class="v14-calendar-week">'+['一','二','三','四','五','六','日'].map(x=>'<span>'+x+'</span>').join('')+'</div><div class="v14-calendar-days">'+cells+'</div><footer><span><i></i> 当日有活动</span>'+link('本月','U37',{month:iso().slice(0,7)},'link')+'</footer></section><div class="section-head v14-event-list-head"><h3>'+(selected?shortDate(selected)+'的活动':'本月活动')+'</h3>'+(selected?link('查看整月','U37',{month:m.month},'link'):'<small>'+listed.length+'项相聚</small>')+'</div><div class="v14-event-list">'+listed.map(eventCard).join('')+(listed.length?'':empty(selected?'这一天暂无活动，看看其他日期吧':'本月活动筹备中，敬请期待'))+'</div>');
}
function detail(){
 clearScan();
 const a=activity(A.params.get('id'));if(!a)return U.head('会所活动','U37')+U.pad(empty('当前活动已下架或未发布'));
 const s=M.service(a.serviceId),check=bookable(a),when=(a.eventTime||'待定')+'—'+(a.eventEnd||'待定'),address=a.address||addressFor(s);
 return U.head('会所活动','U37')+'<div class="v14-event-cover"><img src="'+E(a.image)+'" alt="'+E(a.name)+'"><span>CHEN CLUB · EVENT</span></div>'+U.pad('<article class="v14-event-detail"><small>'+E(shortDate(a.eventDate)+' · '+when)+'</small><h1>'+E(a.name)+'</h1><p>'+E(a.detail)+'</p><div class="v14-event-facts">'+kv('活动日期',E(a.eventDate||'待定日期'))+kv('活动时段',E(when))+kv('预约服务',s?link(A.v05.serviceName(s),'U06',{id:s.id},'link'):E('待配置'))+kv('活动场地',E(s?resourceName(s,a.resource):'待配置'))+kv('活动地址','<a class="v14-address" href="'+E(mapURL(address))+'" target="_blank" rel="noopener">'+E(address)+A.icon('location-outline')+'</a>')+'</div><p class="v14-event-note">活动预约沿用所关联服务的价格、权益与使用规则，请在确认页核对。</p>'+(check.ok?(A.S.guest?link('登录后预约活动','U02',{},'btn gold-btn full'):btn('预约本场活动','v14-event-book',{id:a.id},'btn gold-btn full')):'<div class="v14-event-unavailable" role="status">'+E(check.reason)+'</div>')+'</article>');
}
function applyEvent(a){const s=M.service(a.serviceId),d=A.v08.bookingState(s);Object.assign(d,{date:a.eventDate,times:[a.eventTime],time:a.eventTime,resource:a.resource,variant:a.variant||'standard',calendarEvent:a.id});return d;}
A.actions['v14-event-book']=d=>{clearScan();if(A.S.guest)throw Error('请先登录后预约');const a=requireEvent(d.id);applyEvent(a);A.save();A.go('U07',{id:a.serviceId,event:a.id,date:a.eventDate,time:a.eventTime});};
A.actions['v14-calendar-month']=d=>{if(!monthValid(d.month))return;A.go('U37',{month:d.month});};
A.actions['v14-calendar-day']=d=>{if(!validDate(d.day))return;A.go('U37',{month:d.day.slice(0,7),day:d.day});};

function booking(){
 const id=A.params.get('event'),s=M.service(A.params.get('id'));
 if(id){clearScan();const a=activity(id),check=bookable(a);if(!check.ok||a?.serviceId!==s?.id)return U.head('月历活动预约','U37')+U.pad(empty(check.reason||'请选择活动关联的服务'));if(!A.S.guest)applyEvent(a);}
 else if(B.ownerDraft?.calendarEvent)delete B.ownerDraft.calendarEvent;
 let h=old.U07();const d=B.ownerDraft,a=d?.calendarEvent?activity(d.calendarEvent):null;if(!a||!h.includes('data-form="book-draft"'))return h;
 const fixedDate='<section data-v08-dates class="v14-event-fixed-date"><h3>月历活动预约</h3><input type="hidden" name="date" value="'+E(a.eventDate)+'"><p>'+E(a.name)+'</p><b>'+E(a.eventDate+' '+a.eventTime+'—'+a.eventEnd)+'</b><small>本场活动使用固定日期、时段与场地。</small></section>';
 h=h.replace(/<section data-v08-dates[^>]*>[\s\S]*?<\/section>/,fixedDate);
 const slotRequest={project:shop(),service:s.id,resource:a.resource,date:a.eventDate,time:a.eventTime,duration:A.offer(s,A.S.identity,d.variant).duration||60,people:A.v04.managed(s.id)?Number(d.people||1):1},busy=A.C.occupied(A.S,slotRequest),slotState=A.v14Capacity?A.v14Capacity.slotLabel(slotRequest,undefined,!busy):E(busy?'已约满':'可预约');
 h=h.replace(/<section data-v08-times[^>]*>[\s\S]*?<\/section>/,'<section data-v08-times class="v14-event-fixed-time"><h3>活动时段</h3><label><input type="radio" name="time" value="'+E(a.eventTime)+'" checked '+(busy?'disabled':'')+'><span><b>'+E(a.eventTime+'—'+a.eventEnd)+'</b><small class="v14-event-slot-state">'+slotState+'</small></span></label></section>');
 // 保留原表单与优惠券流程，只将活动固定资源和套餐显示为只读信息。
 h=h.replace(/<fieldset class="v08-options" data-v08-resource>[\s\S]*?<\/fieldset>/,'<input type="hidden" name="resource" value="'+E(a.resource)+'">'+kv('活动场地',E(resourceName(s,a.resource))));
 h=h.replace(/<fieldset class="v08-options" data-v08-variants>[\s\S]*?<\/fieldset>/,'<input type="hidden" name="variant" value="'+E(a.variant||'standard')+'">'+kv('活动套餐',E(M.variants(s).find(v=>v[0]===a.variant)?.[1]||'标准服务')));
 return h;
}
const dateAction=A.actions['v08-owner-date'];A.actions['v08-owner-date']=d=>{if(B.ownerDraft?.calendarEvent&&d.value!==activity(B.ownerDraft.calendarEvent)?.eventDate)throw Error('活动日期由活动排期固定，请返回月历选择其他活动');return dateAction(d);};
const bookDraft=A.forms['book-draft'];A.forms['book-draft']=f=>{
 const d=B.ownerDraft,id=d?.calendarEvent||A.params.get('event');let a;
 if(id){clearScan();a=requireEvent(id);const times=Array.isArray(f.times)?f.times:f.time?[f.time]:d?.times||[];if(f.service!==a.serviceId||(f.date||d?.date)!==a.eventDate||times.length!==1||times[0]!==a.eventTime||(f.resource||d?.resource)!==a.resource||(f.variant||d?.variant||'standard')!==(a.variant||'standard'))throw Error('请选择活动固定排期与活动时段');}
 const result=bookDraft(f);if(a&&A.draft?.v07Checkout){A.draft.v07Checkout.v14EventId=a.id;A.draft.activityId=a.id;A.save();}return result;
};
const submit=M.submit;M.submit=d=>{
 let a;if(d.v14EventId){a=requireEvent(d.v14EventId);if(d.kind!=='booking'||d.lines.length!==1||d.lines.some(l=>l.item!==a.serviceId||l.date!==a.eventDate||l.time!==a.eventTime||l.resource!==a.resource||(l.variant||'standard')!==(a.variant||'standard')))throw Error('活动预约排期已变化，请重新选择');if(M.quote(d).lines.some(l=>l.duration!==eventTiming(M.service(a.serviceId),a).duration))throw Error('活动预约服务套餐时长已变化，请联系会所或重新选择活动');}
 const g=submit(d);if(a){for(const id of g.orderIds){const o=A.S.orders.find(o=>o.id===id);Object.assign(o,{activityId:a.id,activityTitle:a.name,activityEnd:a.eventEnd,venueAddress:a.address});}A.save();}return g;
};

const eventRescheduleMessage='活动预约使用固定场次，请联系会所，或取消后重新预约适用活动';
function guardReschedule(state,id){if(state.orders.find(o=>o.id===id)?.activityId)throw Error(eventRescheduleMessage);}
const rescheduleAction=A.actions.reschedule;A.actions.reschedule=d=>{guardReschedule(A.S,typeof d==='string'?d:d.id);return rescheduleAction(d);};
const rescheduleForm=A.forms['v08-reschedule'];A.forms['v08-reschedule']=f=>{guardReschedule(A.S,f.id);return rescheduleForm(f);};
const rescheduleCore=A.C.reschedule;A.C.reschedule=(state,id,date,time)=>{guardReschedule(state,id);return rescheduleCore(state,id,date,time);};

// 活动扩展原文章编辑；运营与商家共用 V.articles，不维护第二套活动列表。
function eventFields(a={}){
 const services=A.services.filter(s=>s.project===shop()),s=M.service(a.serviceId),options=[['','请选择关联服务'],...services.map(s=>[s.id,A.v05.serviceName(s)])],resources=[['','请选择活动场地'],...services.flatMap(s=>[1,2].map(i=>[s.id+'-'+i,resourceName(s,s.id+'-'+i)]))],variants=s&&M.variants(s).length?M.variants(s):[['standard','标准服务']];
 return '<section class="v14-activity-fields"><h3>活动排期与预约</h3>'+select('contentKind','内容用途',[['article','普通内容'],['activity','活动月历']],isCalendar(a)?'activity':'article')+'<p class="muted">选择活动月历后，请维护以下日期、时段、关联服务与地址；只有服务已开放的排期可以预约。改为普通内容后将移出活动月历。</p><p class="muted">结束时间须等于开始时间加所选服务套餐的预约时长，例如120分钟套餐09:00开始，结束须填11:00。公布时段、场地占用与邀请函使用同一时长，暂不支持跨日场次。</p><div class="form-grid">'+input('eventDate','活动日期',a.eventDate||'','date')+input('eventTime','开始时间',a.eventTime||'','time')+input('eventEnd','结束时间',a.eventEnd||'','time')+'</div>'+select('serviceId','关联预约服务',options,a.serviceId||'')+select('resource','活动场地',resources,a.resource||'')+select('variant','服务套餐',variants,a.variant||'standard')+input('address','活动地址',a.address||'','text','maxlength="200" placeholder="填写可导航的完整地址"')+select('bookingStatus','活动预约开放状态',[['暂未开放','暂未开放'],['开放预约','开放预约']],a.bookingStatus||'暂未开放')+select('status','内容发布状态',[['草稿','草稿'],['已发布','已发布']],a.status||'草稿')+'</section>';
}
function contentEditor(merchant=false){
 if(merchant)clearScan();
 const id=A.params.get('id'),a=id?V.articles.find(a=>a.id===id&&a.project===shop()):null;if(id&&!a)return empty('本会所内容不存在');
 let h=old.A22(),draft=a||{display:A.params.get('kind')==='activity'?display:'首页／本周精选'};
 h=h.replace(/(<button[^>]*type="submit"[^>]*>)/,eventFields(draft)+'$1').replace('保存内容草稿','保存内容与活动配置');
 if(merchant)h=h.replaceAll(A.href('A16'),A.href('M22')).replace('data-form="v03-article-save"','data-form="v14-merchant-article-save"');
 return h;
}
function activityAdmin(){clearScan();const rows=eventRows(shop(),false);return '<div class="v03-admin-toolbar"><div><h2>活动内容管理</h2><p>与运营内容管理共用活动图文、场地和月历排期。服务价格及可预约日期仍由本店服务管理维护。</p></div>'+link('新增活动','M23',{kind:'activity'},'btn gold-btn')+'</div>'+table(['活动名称','日期与时段','关联服务／场地','活动地址','发布／预约状态','操作'],rows.map(a=>[E(a.name),E(a.eventDate+' '+a.eventTime+'—'+a.eventEnd),E(M.service(a.serviceId)?.name||'待配置')+'<small class="muted">'+E(a.resource||'')+'</small>',E(a.address),E(a.status+' · '+a.bookingStatus),link('编辑活动','M23',{id:a.id},'btn light sm')+' '+btn(a.status==='已发布'?'下架':'发布','v03-article-toggle',{id:a.id},'btn light sm')]))+link('返回服务管理','M04',{},'btn light space');}
function eventTiming(s,a){const duration=Number(A.offer(s,A.S.identity,a.variant||'standard').duration||60),minutes=validTime(a.eventTime)?Number(a.eventTime.slice(0,2))*60+Number(a.eventTime.slice(3))+duration:NaN;return {duration,end:minutes<1440?String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0'):null};}
function eventTimingMessage(s,a){const t=eventTiming(s,a);return t.end?'活动结束时间须为'+t.end+'（所选服务套餐时长'+t.duration+'分钟），请按实际预约时长配置':'活动结束时间须与服务套餐时长'+t.duration+'分钟一致，暂不支持跨日场次，请调整开始时间';}
function validateEvent(f,a){
 const value={eventDate:f.eventDate??a?.eventDate,eventTime:f.eventTime??a?.eventTime,eventEnd:f.eventEnd??a?.eventEnd,serviceId:f.serviceId??a?.serviceId,resource:f.resource??a?.resource,variant:f.variant??a?.variant??'standard',address:String(f.address??a?.address??'').trim(),bookingStatus:f.bookingStatus??a?.bookingStatus??'暂未开放',contentKind:'activity'};
 if(!validDate(value.eventDate))throw Error('请填写有效的活动日期');if(!validTime(value.eventTime)||!validTime(value.eventEnd)||value.eventEnd<=value.eventTime)throw Error('活动结束时间须晚于开始时间，请检查时段');
 const s=M.service(value.serviceId);if(!s||s.project!==shop())throw Error('请选择本会所关联服务');if(![s.id+'-1',s.id+'-2'].includes(value.resource))throw Error('请选择关联服务的有效场地资源');
 if(!M.variants(s).some(v=>v[0]===value.variant)&&value.variant!=='standard')throw Error('请选择有效的服务套餐');const timing=eventTiming(s,value);if(!timing.end||value.eventEnd!==timing.end)throw Error(eventTimingMessage(s,value));if(!value.address||value.address.length>200)throw Error('请填写200字以内的活动地址');if(!['暂未开放','开放预约'].includes(value.bookingStatus))throw Error('请选择活动预约开放状态');return value;
}
const articleSave=A.forms['v03-article-save'];A.forms['v03-article-save']=f=>{
 const existing=f.id?V.articles.find(a=>a.id===f.id):null;if((f.project&&f.project!==shop())||(existing&&existing.project!==shop())||(f.id&&!existing))throw Error('仅可维护本会所项目内容');
 const isEvent=f.contentKind==='activity'||(f.contentKind!=='article'&&(f.display===display||existing?.display===display)),extra=isEvent?validateEvent(f,existing):{contentKind:'article'},ids=new Set(V.articles.map(a=>a.id));
 if(f.status&&!['草稿','已发布'].includes(f.status))throw Error('请选择有效发布状态');
 const articleDisplay=f.display||existing?.display||'首页／本周精选';
 const result=articleSave({...f,project:shop(),display:isEvent?display:articleDisplay===display?'首页／本周精选':articleDisplay});const saved=existing||V.articles.find(a=>!ids.has(a.id));Object.assign(saved,extra);if(f.status)saved.status=f.status;A.save();A.render();return saved||result;
};
A.forms['v14-merchant-article-save']=f=>{const result=A.forms['v03-article-save'](f);A.go('M22');return result;};
const toggle=A.actions['v03-article-toggle'];A.actions['v03-article-toggle']=d=>{const a=V.articles.find(a=>a.id===d.id);if(!a||a.project!==shop())throw Error('本会所内容不存在');if(a.status!=='已发布'&&isCalendar(a))validateEvent(a,a);return toggle(d);};
document.addEventListener('change',e=>{if(e.target.name!=='serviceId'||!e.target.closest?.('.v14-activity-fields'))return;const fields=e.target.closest('.v14-activity-fields'),s=M.service(e.target.value);if(!s)return;const resource=fields.querySelector('[name="resource"]'),variant=fields.querySelector('[name="variant"]');if(resource){resource.innerHTML=[1,2].map(i=>'<option value="'+E(s.id+'-'+i)+'">'+E(resourceName(s,s.id+'-'+i))+'</option>').join('');resource.value=s.id+'-1';}if(variant)variant.innerHTML=(M.variants(s).length?M.variants(s):[['standard','标准服务']]).map(([id,name])=>'<option value="'+E(id)+'">'+E(name)+'</option>').join('');});

// 对非活动预约也提供商家可维护的会所地址，不读取会员的配送地址。
const serviceSave=A.forms['v03-service-save'];A.forms['v03-service-save']=f=>{const address=f.venueAddress===undefined?undefined:String(f.venueAddress).trim();if(address!==undefined&&(!address||address.length>200))throw Error('请填写200字以内的服务地址');const s=serviceSave(f);if(s&&address!==undefined){V.v03.merchantServices[s.id].venueAddress=address;A.save();}return s;};
// 保持旧别名指向同一保存流程。
A.forms['xmind-service-save']=A.forms['v03-service-save'];

function ownOrder(id){const o=A.S.orders.find(o=>o.id===id&&o.project===shop()),me=A.v09.me();return !A.S.guest&&o&&!o.children&&M.service(o.service)&&(o.memberId?o.memberId===me?.id:o.user===A.S.profile.nickname)?o:null;}
function token(){const values=new Uint32Array(4);if(window.crypto?.getRandomValues){window.crypto.getRandomValues(values);return Array.from(values,n=>n.toString(36)).join('-');}return A.C.uid('INV')+'-'+Math.random().toString(36).slice(2);}
function publicSnapshot(o,key){const s=M.service(o.service),date=new Date(o.date+'T'+o.time+':00');date.setMinutes(date.getMinutes()+(o.duration||60));return {version:1,key,service:A.v05.serviceName(s),activity:o.activityTitle||'',venue:resourceName(s,o.resource),project:A.projects[o.project],date:o.date,time:o.time,end:date.toTimeString().slice(0,5),address:o.venueAddress||addressFor(s),created:iso()};}
function createInvitation(id){
 const o=ownOrder(id);if(!o)throw Error('请登录后分享本人的预约凭证');if(!o.paid||o.status!=='待履约'||o.date<iso())throw Error('当前预约不可生成邀请');
 const records=state().invitations??={},prior=Object.entries(records).find(([,r])=>r.orderId===o.id&&r.project===o.project),key=prior?.[0]||token();records[key]={orderId:o.id,project:o.project};
 const snapshot=publicSnapshot(o,key),base=String(location.href||'').split(/[?#]/)[0],url=base+A.href('U38',{invite:JSON.stringify(snapshot)});A.save();return {url,snapshot};
}
function parseInvitation(raw){
 if(typeof raw!=='string'||raw.length>8000)return null;let source;try{source=JSON.parse(raw);}catch{return null;}
 if(!source||source.version!==1||!validDate(source.date)||!validTime(source.time)||!validTime(source.end)||typeof source.key!=='string'||source.key.length>120)return null;
 const result={version:1};for(const [field,max]of [['key',120],['service',100],['activity',100],['venue',120],['project',80],['date',10],['time',5],['end',5],['address',200],['created',10]]){if(typeof source[field]!=='string'||source[field].length>max)return null;result[field]=source[field];}if(!result.service||!result.address)return null;return result;
}
function resolveInvitation(raw){const snapshot=parseInvitation(raw);if(!snapshot)return null;const record=state().invitations?.[snapshot.key],o=record?A.S.orders.find(o=>o.id===record.orderId&&o.project===record.project):null;return o?{snapshot:publicSnapshot(o,snapshot.key),order:o,local:true}:{snapshot,local:false};}
function invitation(){
 clearScan();
 const found=resolveInvitation(A.params.get('invite'));if(!found)return U.head('邀请函','U01')+U.pad(empty('邀请链接不完整，邀请信息不可用，请向邀请人索取完整链接。'));
 const p=found.snapshot,name=!A.S.guest&&state().knownRecipient!==false&&A.S.profile.nickname?.trim()?A.S.profile.nickname.trim():'受邀嘉宾',status=found.local?(found.order.status==='已取消'?'预约已取消':found.order.status==='已退款'?'预约已退款':found.order.status==='已完成'?'本机记录：活动已完成':found.order.status==='待履约'?'本机预约记录：待履约':'本机预约状态：'+found.order.status):'邀请信息快照',inactive=found.local&&['已取消','已退款','已完成'].includes(found.order.status);
 return '<div class="v14-invitation-page">'+U.head('邀请函','U01')+U.pad('<article class="v14-invitation"><div class="v14-invitation-mark">宸 <span>CLUB</span></div><small class="v14-invitation-eyebrow">A MOMENT TO SHARE</small><p class="v14-invitation-to">'+E(name)+'，诚邀您赴约</p><h1>'+E(p.activity||p.service)+'</h1><p class="v14-invitation-project">'+E(p.project)+'</p><div class="v14-invitation-date"><b>'+E(shortDate(p.date))+'</b><span>'+E(p.time+'—'+p.end)+'</span><small>'+E(p.date+' '+p.time)+'</small></div><div class="v14-invitation-facts">'+kv('预约服务',E(p.service))+kv('预约场地',E(p.venue))+kv('赴约地址','<a class="v14-address" href="'+E(mapURL(p.address))+'" target="_blank" rel="noopener" aria-label="打开地图导航至'+E(p.address)+'">'+E(p.address)+'<small>点击地址，打开地图导航 '+A.icon('location-outline')+'</small></a>')+'</div><div class="v14-invite-status '+(inactive?'inactive':'')+'" role="status">'+E(status)+'</div><p class="v14-invite-snapshot-note">'+(found.local?'以上状态来自此浏览器保存的预约记录。':'邀请信息快照生成于 '+E(p.created)+'，请向邀请人或会所确认最新安排。')+'此邀请仅用于分享赴约安排，不可用于核销；入场与服务使用请由预约人向会所确认。</p></article>')+'</div>';
}
let currentInvitation=null;
A.actions['v14-share-voucher']=d=>{currentInvitation=createInvitation(d.id);const p=currentInvitation.snapshot;A.modal('分享邀请函','<section class="v14-share-sheet"><h3>'+E(p.activity||p.service)+'</h3><p>'+E(p.date+' '+p.time+'—'+p.end)+'</p><p>分享赴约安排给亲友，接收人可查看场地、时间与地址。</p><label class="field"><span>公开邀请链接</span><input class="v14-invite-link" type="text" value="'+E(currentInvitation.url)+'" readonly data-v14-invite-link aria-label="公开邀请链接"></label>'+btn('复制邀请链接','v14-invite-copy',{},'btn gold-btn full')+btn('系统分享','v14-invite-system',{},'btn light full space')+'<a class="btn light full space" href="'+E(currentInvitation.url)+'" data-action="close">预览邀请函</a><small>邀请函不含核销凭证。若系统未提供分享面板，可复制链接发送。</small></section>');return currentInvitation;};
A.actions['v14-invite-copy']=async()=>{if(!currentInvitation)return;try{if(!window.navigator?.clipboard?.writeText)throw Error('unavailable');await window.navigator.clipboard.writeText(currentInvitation.url);A.toast('邀请链接已复制');}catch{const field=document.querySelector('[data-v14-invite-link]');field?.focus();field?.select?.();A.toast('请长按或选中上方链接复制');}};
A.actions['v14-invite-system']=async()=>{if(!currentInvitation)return;if(!window.navigator?.share)return A.actions['v14-invite-copy']();try{await window.navigator.share({title:(A.v20Brand?.name||'宸 CLUB')+' · 邀请函',text:currentInvitation.snapshot.service+' · '+currentInvitation.snapshot.date+' '+currentInvitation.snapshot.time,url:currentInvitation.url});}catch(e){if(e.name!=='AbortError')A.toast('系统分享暂不可用，可复制邀请链接');}};

for(const [id,title,role,hidden]of [['U37','活动月历','U',true],['U38','公开邀请函','U',true],['M22','活动内容管理','M',false],['M23','活动内容编辑','M',true]])if(!A.pages.some(p=>p.id===id))A.pages.push({id,title,role,hidden,desc:title});
const merchantNavigation=A.navigationGroups.find(g=>g.ids.includes('M04'));if(merchantNavigation)for(const id of ['M22','M23'])if(!merchantNavigation.ids.includes(id))merchantNavigation.ids.push(id);
A.register({
 U01:()=>{if(!A.S.guest)state().knownRecipient=true;const h=old.U01(),membership=/<section\b[^>]*\bcomponent-membership\b[^>]*>[\s\S]*?<\/section>/;return membership.test(h)?h.replace(membership,'$&'+calendarEntry()):h.includes('<div class="home-content">')?h.replace('<div class="home-content">','<div class="home-content">'+calendarEntry()):h+U.pad(calendarEntry());},
 U05:()=>old.U05().replace(/(<div class="mp-pad[^\"]*">)/,'$1'+calendarEntry()),
 U07:booking,U28:()=>activity(A.params.get('id'),false)?detail():old.U28(),U37:calendar,U38:invitation,
 U09:()=>{let h=old.U09();const id=A.params.get('id'),o=id?ownOrder(id):A.S.orders.find(o=>ownOrder(o.id)&&o.paid&&o.status==='待履约'&&o.date>=iso());if(o?.activityId)h=h.replace(/<button\b[^>]*data-action="reschedule"[^>]*>[\s\S]*?<\/button>/g,'')+U.pad('<p class="v14-event-note">'+E(eventRescheduleMessage)+'。</p>');return o?.paid&&o.status==='待履约'&&o.date>=iso()?h+U.pad('<div class="v14-voucher-share">'+btn('分享凭证','v14-share-voucher',{id:o.id},'btn light full')+'<p>为亲友生成赴约邀请函</p></div>'):h;},
 A16:()=>'<div class="v14-content-toolbar"><div><b>活动月历维护</b><p>活动与图文共用内容列表；编辑活动可维护日期、时间、关联服务与导航地址。</p></div>'+link('新增活动','A22',{kind:'activity'},'btn gold-btn')+'</div>'+old.A16(),
 A22:()=>contentEditor(false),M22:activityAdmin,M23:()=>contentEditor(true),
 M04:()=>'<div class="v14-content-toolbar"><span>把本店活动发布至业主月历</span>'+link('活动内容管理','M22',{},'btn light')+'</div>'+old.M04(),
 M09:()=>{const s=M.service(A.params.get('id')),h=old.M09();return h.replace(/(<button[^>]*type="submit"[^>]*>)/,input('venueAddress','服务地址（用于邀请函导航）',s?addressFor(s):A.projects[shop()]+'会所（位置待会所核实）','text','maxlength="200" required')+'$1');}
});
const nav=A.mobileNavigation;A.mobileNavigation=(route,tabs,active)=>route==='U38'?{tabs:[],active:''}:route==='U37'?{tabs,active:'U05'}:nav(route,tabs,active);
A.v14Experience={monthInfo,shiftMonth,bookable,createInvitation,parseInvitation,resolveInvitation,mapURL,eventRows,addressFor};
})();
