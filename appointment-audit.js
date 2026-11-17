/* V0.1 / V0.2 / V0.3 最终复核：所有预约入口统一为「日期 → 日期下时段」。 */
(function(){
  'use strict';
  var A=Club,C=A.C,E=A.E,link=A.link,btn=A.btn,input=A.input,select=A.select,notice=A.notice,form=A.form,tag=A.tag;
  var V=A.S.v02||(A.S.v02={}),oldU07=A.views.U07;
  var project=function(){return A.S.project;};
  var pname=function(id){return A.projects[id]||id;};
  var iso=function(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  var bookingDays=function(n,s){if(s){var cfg=V.v03&&V.v03.merchantServices[s.id],list=cfg&&cfg.dateList;if(list&&list.length){var valid=list.filter(function(d){return d>=iso(new Date());});if(valid.length)return valid.map(function(d){return [d,d===iso(new Date())?'今天':new Date(d+'T12:00:00').toLocaleDateString('zh-CN',{weekday:'short'})];});}}var base=new Date();base.setHours(12,0,0,0);return Array.from({length:n||7},function(_,i){var d=new Date(base);d.setDate(base.getDate()+i);return [iso(d),i===0?'今天':d.toLocaleDateString('zh-CN',{weekday:'short'})];});};
  var slotTimes=function(s){var configured=V.v03&&V.v03.merchantServices[s.id];return configured&&configured.slotList&&configured.slotList.length?configured.slotList:['09:00','11:00','14:00','16:00','18:00'];};
  var endTime=function(time,duration){var p=time.split(':'),m=Number(p[0])*60+Number(p[1])+Number(duration||60);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
  var imageFor=function(s){return 'assets/home-'+(/泳|游泳/.test(s.name)?'pool':/茶|棋牌/.test(s.name)?'tea':/私教|课程|课/.test(s.kind)?'coach':/SPA|女王/.test(s.name)?'spa':/艺廊|阅读|花植/.test(s.name)?'gallery':'dining')+'.jpg';};
  var offerFor=function(s,variant){return A.offer(s,A.S.identity,variant||'')||{};};
  var serviceRows=function(){return A.services.filter(function(s){return s.project===project()&&!A.S.hiddenServices.includes(s.id);});};
  var assetOptions=function(s){return A.S.assets.filter(function(a){return a.project===project()&&a.status!=='冻结'&&a.status!=='停用'&&(a.remaining===null||a.remaining>0)&&(!a.services||!a.services.length||a.services.includes(s.id));}).map(function(a){return [a.id,a.name+' · 剩余'+(a.remaining===null?'会籍有效':a.remaining+'次')];});};
  function slotItems(s,formEl,date,resource,variant,personnel,selected){
    var q=offerFor(s,variant),duration=Number(q.duration||60),items=[];
    slotTimes(s).forEach(function(t){
      var occupied=A.C.occupied(A.S,{project:project(),resource:resource,date:date,time:t,duration:duration,personnel:personnel||''});
      if(!occupied&&(!selected||selected===t))selected=selected||t;
      items.push({time:t,duration:duration,occupied:occupied,selected:selected===t});
    });
    return items;
  }
  function slotMarkup(s,formEl,date,resource,variant,personnel,selected,action){
    var items=slotItems(s,formEl,date,resource,variant,personnel,selected);
    return '<div class="owner-time-grid audit-slot-grid" data-audit-slots>'+items.map(function(x){return '<label class="owner-time-option audit-time-option '+(x.occupied?'occupied':'')+' '+(x.selected?'is-selected':'')+'"><input type="radio" name="time" value="'+x.time+'" '+(x.selected?'checked ':'')+(x.occupied?'disabled ':'required ')+'><span><b>'+(/私宴/.test(s.name)?(x.time==='11:00'?'午宴 ':x.time==='18:00'?'晚宴 ':''):'')+x.time+'—'+endTime(x.time,x.duration)+'</b><small>'+(x.occupied?'已约满':'可预约 · '+date)+'</small></span></label>';}).join('')+'</div>';
  }
  function ownerBooking(){
    var id=A.params.get('id'),s=A.services.find(function(x){return x.id===id&&x.project===project();})||(!id?A.services.find(function(x){return x.project===project();}):null);
    if(!s)return '<div class="mp-head"><h2>预约时段</h2></div><div class="mp-pad">'+A.empty('请重新选择当前项目服务')+'</div>';
    var variant=A.params.get('variant')||'standard',q=offerFor(s,variant);
    if(q.amount===null||q.arrival||A.S.guest)return A.views.U06();
    var days=bookingDays(7,s),previous=A.draft&&A.draft.service===s.id?A.draft:null,date=previous&&previous.date||days[0][0],resource=previous&&previous.resource||s.id+'-1',selected=previous&&previous.time||'',people=previous&&previous.people||(/私宴/.test(s.name)?8:1),companions=previous&&previous.companions||(A.S.identity.endsWith('c')?1:0),banquet=/私宴/.test(s.name);
    var variants=s.project==='bj'?(banquet?select('variant','宴席套餐',[['standard','标准套餐 · 3,888元'],['high','升级套餐 · 5,888元']],variant):/棋牌/.test(s.name)?select('variant','使用套餐',[['standard','58元／小时'],['long','158元／4小时']],variant):/会议/.test(s.name)?select('variant','会议套餐',[['standard','800元／4小时'],['day','1,500元／8小时']],variant):''):'';
    var levels=Array.from((s.rights[{ma:0,mc:1,na:2,nc:3}[A.S.identity]]||'').matchAll(/(初级|中级|高级|职业|基础课|特色课)[：:]?\s*(\d+)/g));if(levels.length>1)variants=select('variant','课程档位',levels.map(function(x){return [x[1],x[1]+' · '+x[2]+'元'];}),levels.some(function(x){return x[1]===variant;})?variant:levels[0][1]);
    var html='<div class="mp-head audit-book-head"><a class="owner-back" href="'+A.href('U06',{id:s.id})+'">'+A.icon('arrow-left')+'</a><h2>选择预约日期与时段</h2></div><div class="mp-pad audit-book-page"><div class="owner-book-service"><img src="'+imageFor(s)+'" alt="'+E(s.name)+'"><div><h3>'+E(s.name)+'</h3><p>'+E(pname(s.project))+' · '+E(q.text||'按身份权益核验')+'</p><small>'+E(q.sub||'预约服务')+'</small></div></div>'+form('book-draft','<input type="hidden" name="service" value="'+E(s.id)+'"><input type="hidden" name="date" value="'+E(date)+'"><h3 class="owner-field-title audit-step-title">1. 选择日期</h3><div class="owner-date-strip audit-date-strip">'+days.map(function(d){return '<button type="button" class="audit-date-card '+(d[0]===date?'on':'')+'" data-action="audit-owner-date" data-date="'+d[0]+'" aria-pressed="'+(d[0]===date)+'"><small>'+E(d[1])+'</small><b>'+d[0].slice(8)+'</b></button>';}).join('')+'</div>'+select('resource','场地／资源',[[s.id+'-1',s.name+' · 场地1'],[s.id+'-2',s.name+' · 场地2']],resource)+variants+'<h3 class="owner-field-title audit-step-title">2. 选择该日期下的时段 <small data-audit-day>'+date+'</small></h3><div data-audit-slot-container>'+slotMarkup(s,null,date,resource,variant,previous&&previous.personnel||'',selected,'audit-owner-time')+'</div><p class="owner-scope-note">日期和时段分开展示；切换日期、场地或套餐后会重新计算可预约余量并清除旧时段。</p><h3 class="owner-field-title audit-step-title">3. 到场人员</h3>'+input('user','使用人',previous&&previous.user||A.S.profile.nickname,'text','required')+input('people','使用人数（不含陪同）',people,'number','min="1" max="10" step="1" required')+input('companions','陪同人数',companions,'number','min="0" max="10" step="1" required')+(A.S.identity.endsWith('c')?'<label class="check mb"><input type="checkbox" name="accompanied" value="yes" required>已确认有成年人陪同</label>':'')+'<p class="owner-scope-note">陪同人员单独统计，确认页、订单、凭证和核销会同步显示总人数。</p>'+select('asset','使用已绑定卡券',[['','不使用卡券']].concat(assetOptions(s)),previous&&previous.asset||'') ,'下一步 · 核对预约')+'</div>';
    return html;
  }
  function proxyView(){
    var d=V.proxy||{},step=A.params.get('step')||'1',route=location.hash.split('?')[0]==='#/T03'?'T03':'S03',rows=serviceRows();
    if(step==='2'&&d.service){
      var s=A.service(d.service),q=offerFor(s,''),days=bookingDays(7,s),date=d.date||days[0][0],selected=d.time||'',resource=d.resource||s.id+'-1';
      var dateCards=days.map(function(x){return '<button type="button" class="audit-date-card '+(x[0]===date?'on':'')+'" data-action="audit-proxy-date" data-date="'+x[0]+'" aria-pressed="'+(x[0]===date)+'"><small>'+E(x[1])+'</small><b>'+x[0].slice(8)+'</b></button>';}).join('');
      return '<div class="mp-head audit-book-head"><a class="owner-back" href="'+A.href(route)+'">'+A.icon('arrow-left')+'</a><h2>代客下单 · 预约／订单</h2></div><div class="mp-pad audit-book-page"><div class="proxy-stepper audit-stepper"><b>1 会员与服务</b><b class="on">2 日期与时段</b></div><div class="proxy-selected audit-proxy-selected"><span>'+E(d.member||'林女士')+'</span><b>'+E(s.name)+'</b></div>'+form('v03-proxy-create','<input type="hidden" name="service" value="'+E(s.id)+'"><fieldset class="audit-mode-switch"><legend>服务方式</legend><label><input type="radio" name="mode" value="booking" checked>预约服务</label><label><input type="radio" name="mode" value="direct">现场点单</label></fieldset><div data-audit-mode-fields><input type="hidden" name="date" value="'+E(date)+'"><h3 class="owner-field-title audit-step-title">1. 选择日期</h3><div class="owner-date-strip audit-date-strip">'+dateCards+'</div><h3 class="owner-field-title audit-step-title">2. 选择该日期下的时段 <small data-audit-day>'+date+'</small></h3><div data-audit-slot-container>'+slotMarkup(s,null,date,resource,'','',selected,'audit-proxy-time')+'</div><p class="owner-scope-note">员工与商家移动端使用和业主端相同的日期、时段、场地冲突规则。</p>'+select('resource','场地／资源',[[s.id+'-1',s.name+' · 资源1'],[s.id+'-2',s.name+' · 资源2']],resource)+input('people','使用人数',d.people||1,'number','min="1" max="10" required')+'</div>','确认代客下单')+'</div>';
    }
    return '<div class="mp-head audit-book-head"><h2>代客下单</h2><span class="tag">两步下单</span></div><div class="mp-pad audit-book-page"><div class="proxy-stepper audit-stepper"><b class="on">1 选择会员与服务</b><b>2 日期与时段</b></div>'+form('v03-proxy-next',input('member','会员姓名／手机号',d.member||'林女士','search','required')+'<div class="tile-select audit-service-tiles"><span>选择当前项目服务</span><div>'+rows.map(function(s){return '<button type="button" class="'+(d.service===s.id?'on':'')+'" data-action="audit-proxy-service" data-id="'+E(s.id)+'"><img src="'+imageFor(s)+'" alt=""><b>'+E(s.name)+'</b><small>'+E(A.quote(s).title)+'</small></button>';}).join('')+'</div></div><input type="hidden" name="service" value="'+E(d.service||'')+'">','下一步 · 进入日期与时段')+'</div>';
  }
  function refreshForm(formEl){
    if(!formEl)return;
    var f=Object.fromEntries(new FormData(formEl)),s=A.service(f.service);if(!s)return;
    var date=f.date||bookingDays(7)[0][0],resource=f.resource||s.id+'-1',variant=f.variant||'standard',personnel=f.personnel||'',selected=f.time||'';
    var box=formEl.querySelector('[data-audit-slot-container]');if(box)box.innerHTML=slotMarkup(s,formEl,date,resource,variant,personnel,selected);
    var day=formEl.querySelector('[data-audit-day]');if(day)day.textContent=date;
  }
  function chooseDate(actionName,d,b){var f=b&&b.closest('form');if(!f)return;f.elements.date.value=d.date;f.elements.time&&(f.elements.time.value='');f.querySelectorAll('[data-action="'+actionName+'"]').forEach(function(x){var on=x.dataset.date===d.date;x.classList.toggle('on',on);x.setAttribute('aria-pressed',String(on));});refreshForm(f);}
  function toggleProxyMode(f){if(!f)return;var direct=f.elements.mode&&f.elements.mode.value==='direct',box=f.querySelector('[data-audit-mode-fields]');if(!box)return;box.classList.toggle('is-hidden',direct);box.querySelectorAll('input,select,textarea').forEach(function(x){x.required=!direct;});}
  A.actions['audit-owner-date']=function(d,b){chooseDate('audit-owner-date',d,b);};
  A.actions['audit-proxy-date']=function(d,b){chooseDate('audit-proxy-date',d,b);};
  A.actions['audit-proxy-service']=function(d){V.proxy=V.proxy||{};V.proxy.service=d.id;A.save();A.render();};
  A.actions['audit-owner-time']=function(d,b){var f=b.closest('form');if(f&&f.elements.time){f.elements.time.value=d.time;refreshForm(f);}};
  A.actions['audit-proxy-time']=function(d,b){var f=b.closest('form');if(f&&f.elements.time){f.elements.time.value=d.time;refreshForm(f);}};
  A.actions['audit-reschedule-date']=function(d,b){chooseDate('audit-reschedule-date',d,b);};
  A.actions['audit-reschedule-time']=function(d,b){var f=b.closest('form');if(f&&f.elements.time){f.elements.time.value=d.time;refreshForm(f);}};
  A.register({U07:ownerBooking,S03:proxyView,T03:proxyView});
  A.forms['v03-proxy-next']=function(f){if(!f.member)throw Error('请输入会员姓名或手机号');if(!f.service)throw Error('请选择服务卡片');V.proxy={member:f.member,service:f.service};A.save();A.go(location.hash.split('?')[0]==='#/T03'?'T03':'S03',{step:'2'});};
  A.forms['v03-proxy-create']=function(f){
    var s=A.service(V.proxy&&V.proxy.service||f.service),q=offerFor(s,''),route=location.hash.split('?')[0],now=new Date(),direct=f.mode==='direct';
    if(!s)throw Error('请选择有效服务');
    var date=direct?iso(now):(f.date||bookingDays(7)[0][0]),time=direct?String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'):(f.time||'');
    if(!direct&&!/^\d{2}:\d{2}$/.test(time))throw Error('请先选择日期下的时段');
    if(q.amount===null)throw Error('当前身份的成交价或权益额度尚未确认，请先在后台维护，不可按零元下单');
    var resource=direct?'retail-'+s.id+'-'+Date.now():(f.resource||s.id+'-1'),amount=q.amount;
    var o=C.book(A.S,{project:project(),title:s.name+(direct?' · 员工代客点单':' · 员工代客预约'),service:s.id,resource:resource,date:date,time:time,duration:direct?1:Number(q.duration||60),amount:amount,identity:A.S.identity,user:V.proxy&&V.proxy.member||'林女士',people:Number(f.people||1),companions:A.S.identity.endsWith('c')?1:0,operator:route==='#/T03'?'商家前台':'员工前台',source:direct?'员工代客点单':'员工代客预约'});
    if(o.amount)C.pay(A.S,o.id);V.proxy={};A.save();A.go(route==='#/T03'?'T08':'S08',{id:o.id});A.toast(direct?'代客点单已生成':'代客预约已生成');
  };
  function reschedule(id){
    var o=A.S.orders.find(function(x){return x.id===id});if(!o)return A.toast('订单不存在');
    var s=A.service(o.service),days=bookingDays(7,s),date=o.date,selected=o.time,html='<input type="hidden" name="id" value="'+E(o.id)+'"><input type="hidden" name="date" value="'+E(date)+'"><h3 class="owner-field-title audit-step-title">1. 选择日期</h3><div class="owner-date-strip audit-date-strip">'+days.map(function(x){return '<button type="button" class="audit-date-card '+(x[0]===date?'on':'')+'" data-action="audit-reschedule-date" data-date="'+x[0]+'"><small>'+E(x[1])+'</small><b>'+x[0].slice(8)+'</b></button>';}).join('')+'</div><h3 class="owner-field-title audit-step-title">2. 选择该日期下的时段 <small data-audit-day>'+date+'</small></h3><div data-audit-slot-container>'+slotMarkup(s,null,date,o.resource,'',o.personnel||'',selected)+'</div><p class="owner-scope-note">改期同样按日期、时段和资源冲突规则校验。</p>';
    A.modal('调整预约时间',form('reschedule',html,'确认调整时间'));
  }
  A.actions.reschedule=reschedule;
  document.addEventListener('change',function(e){var f=e.target.form;if(!f)return;if(f.matches('[data-form="v03-proxy-create"]')&&e.target.name==='mode'){toggleProxyMode(f);return;}if(f.matches('[data-form="book-draft"],[data-form="v03-proxy-create"],[data-form="reschedule"]')&&['resource','personnel','variant'].includes(e.target.name))refreshForm(f);});
  document.addEventListener('club:render',function(){['book-draft','v03-proxy-create','reschedule'].forEach(function(name){var f=document.querySelector('#screen [data-form="'+name+'"],#phone-overlay [data-form="'+name+'"]');if(f){refreshForm(f);if(name==='v03-proxy-create')toggleProxyMode(f);}});});
})();
