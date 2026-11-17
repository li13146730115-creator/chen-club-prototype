/* 路由、资料适配和共用交互。只操作本地演示数据。 */
window.Club=(()=>{
'use strict';
const C=ClubCore,R=CLUB_RESEARCH,KEY='chenclub-prototype-20261111-v1';
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!S||S.version!==1)S=C.seed();
const projects={bj:'北京宸园',zx:'紫京宸园',zj:'中建项目会所'};
const identities={ma:'会籍成人',mc:'会籍儿童',na:'无会籍成人',nc:'无会籍儿童'};
const pageDefs=[
['U01','首页','发现会所服务与最近预约'],['U02','身份与会籍','业主认证、会籍状态与办理'],['U03','权益与资产','按项目查看会籍、次卡与赠券'],['U04','权益详情与记录','使用范围、期限与资产流水'],['U05','服务列表','场地、私教、餐饮与康养'],['U06','服务详情','身份权益、价目与预约规则'],['U07','日期与时段','选择演示库存和使用人'],['U08','预约确认与支付','明细核对及本地模拟支付'],['U09','到场凭证','一次性凭证与履约状态'],['U10','预约与订单','进度、改期、取消与售后'],['U11','扫码点单','场所识别与购物车'],['U12','我的与消息','个人服务与事项提醒'],['U13','家庭成员','成员信息、陪同与共享边界'],['U14','客服与评价','咨询、投诉与服务评价'],
['S01','员工工作台','今日预约与现场服务'],['S02','会员查询与档案','最少必要信息与可用资产'],['S03','代客预约与现场加项','服务、空间及占用校验'],['S04','代客收款与线下登记','模拟收款与线下凭据'],['S05','核销与到场登记','凭证校验、扣次及重复拦截'],['S06','卡券绑定与发放','订单关联、原因与发放记录'],['S07','工单处理','受理、跟进与闭环'],
['A01','经营总览','项目服务、订单与履约摘要'],['A02','项目与空间资源','三个会所资料与资源台账'],['A03','服务与商品','服务目录、上下架与分账关联'],['A04','身份权益与价目','客户四类身份矩阵及价格原文'],['A05','会籍、卡券及家庭规则','卡种、草稿和有效期调整'],['A06','排期与预约规则','资源占用、预约及取消参数'],['A07','会员与资产流水','档案、线下登记与操作记录'],['A08','订单履约与退款','支付、履约及原交易退款'],['A09','客服与异常','咨询、投诉及核销异常'],['A10','内容、活动与页面装修','Banner、组件排序及预览'],['A11','财务与对账','资金状态及合同结算口径'],['A12','权限、审计与集成','授权范围、操作日志与接入状态'],['A13','待确认与资料追溯','33项资料、异常值与来源'],
['M01','供方维护','商户端本店供方与子商户信息'],['M02','分账分类','独立分类与多个供方比例'],['M03','分账订单与回退','原订单快照、金额与退款记录']];
const pages=pageDefs.map(([id,title,desc])=>({id,title,desc,role:id[0]}));
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>n===null||n===undefined||n===''?'待确认':'¥'+(Number(n)/100).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
const tag=(text,cls='')=>`<span class="tag ${cls}">${E(text)}</span>`;
const href=(id,args={})=>'#/'+id+(Object.keys(args).length?'?'+new URLSearchParams(args):'');
const link=(text,id,args={},cls='btn light')=>`<a class="${cls}" href="${href(id,args)}">${E(text)}</a>`;
const btn=(text,action,data={},cls='btn')=>`<button type="button" class="${cls}" data-action="${action}" ${Object.entries(data).map(([k,v])=>`data-${k}="${E(v)}"`).join(' ')}>${E(text)}</button>`;
const input=(name,label,value='',type='text',attrs='')=>`<label class="field"><span>${E(label)}</span><input name="${name}" type="${type}" value="${E(value)}" ${attrs}></label>`;
const select=(name,label,options,value)=>`<label class="field"><span>${E(label)}</span><select name="${name}">${options.map(([v,t])=>`<option value="${E(v)}" ${String(v)===String(value)?'selected':''}>${E(t)}</option>`).join('')}</select></label>`;
const notice=(text,green=false)=>`<div class="notice ${green?'green':''}">${E(text)}</div>`;
const empty=(text='暂无符合条件的记录')=>`<div class="empty">${E(text)}</div>`;
const kv=(a,b)=>`<div class="kv"><span>${E(a)}</span><strong>${b}</strong></div>`;
const form=(action,html,submit='保存演示配置',data='')=>`<form data-form="${action}" ${data}><div class="error" role="alert"></div>${html}<button class="btn gold-btn full" type="submit">${E(submit)}</button></form>`;
const table=(headers,rows)=>rows.length?`<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${E(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c??'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:empty();
const currentOrders=()=>S.orders.filter(o=>o.project===S.project);
const assets=()=>S.assets.filter(a=>a.project===S.project);
const rawMatrix=R['场景权益矩阵'].rows;
const services=rawMatrix.map(r=>({id:r[0],project:r[1]==='紫京宸园'?'zx':'bj',category:r[2],name:r[3],kind:r[4],rights:r.slice(5,9),raw:r[9],note:r[10],status:r[11],source:r[12],location:r[13]}));
['恒温泳池','器械健身','普拉提／私教','棋牌室（4间）','茶室','中西私宴厅','行政酒廊'].forEach((name,i)=>services.push({id:'ZJ-'+i,project:'zj',category:i<3?'运动健康':i<6?'商务社交':'休闲会客',name,kind:i===2?'私教课':'场地使用',rights:i<2?['按有效年卡／次卡核验','儿童适用范围待核','需购买对应卡券','适龄与准入待核']:['实际卡券与参数待补','实际卡券与参数待补','价格待补','价格待补'],raw:'中建项目：游泳和器械健身无需预约；次卡到场每次核销一次，年卡到场登记。其他空间预约、价目及容量待补。',note:i===2?'普拉提需私教陪同；目前微信社群约教练，包次价格未补。':i===5?'私宴需押金，但金额、备料提前量、取消及退押条件待补。':'不得套用紫京或北京价目。',source:'S1',location:'会议纪要·中建项目；正式空间名待核'}));
const service=id=>services.find(x=>x.id===id)||services.find(x=>x.project===S.project&&x.name==='茶室')||services.find(x=>x.project===S.project);
function offer(s,identity=S.identity,variant=''){
 const idx={ma:0,mc:1,na:2,nc:3}[identity];const raw=s.rights[idx]||'待确认';const free=/✅/.test(raw)&&!/私教|SPA/.test(s.kind+s.name);let o={amount:null,text:raw.replace('（原表勾选）',''),unit:'',duration:60,raw,variant,source:s.source};
 if(s.project==='zj'){o.text=/ZJ-[01]$/.test(s.id)?'到场核验 · 无需预约':'详询会所';o.arrival=/ZJ-[01]$/.test(s.id);return o;}
 if(free)o={...o,amount:0,text:'场地权益免费',demoDuration:true};
 if(s.name.includes('私宴'))o={...o,amount:s.project==='bj'?(variant==='high'?588800:388800):1150000,text:s.project==='bj'?(variant==='high'?'¥5,888':'¥3,888'):'¥11,500起',unit:s.project==='bj'?'8—10人 · 午晚通用':'计价单位待核',duration:120,demoDuration:true};
 if(s.name==='茶室'&&(identity==='na'||identity==='nc')){
  if(s.project==='bj')o={...o,amount:15800,text:'¥158',unit:'／2小时',duration:120};else if(identity==='na')o={...o,amount:15800,text:'¥158',unit:'／小时',duration:60};
 }
 if(s.name.includes('棋牌')&&identity==='na')o={...o,amount:s.project==='bj'&&variant!=='long'?5800:15800,text:s.project==='bj'&&variant!=='long'?'¥58':'¥158',unit:s.project==='bj'?(variant==='long'?'／4小时':'／小时'):'／小时',duration:s.project==='bj'&&variant==='long'?240:60};
 if(s.name.includes('会议')&&((s.project==='bj'&&['na','nc'].includes(identity))||(s.project==='zx'&&identity==='na')))o={...o,amount:s.project==='bj'&&variant==='day'?150000:80000,text:s.project==='bj'&&variant==='day'?'¥1,500':'¥800',unit:s.project==='bj'&&variant==='day'?'／8小时':'／4小时',duration:s.project==='bj'&&variant==='day'?480:240};
 if(s.name.includes('私宴')&&s.project==='zx')o.amount=null;
 if(s.kind.includes('私教')||s.name.includes('SPA')){o.amount=null;o.text=s.name.includes('SPA')?'护理另付费':raw.replace('（原表勾选）','');}
 if(raw==='—')o={...o,amount:null,text:'该身份权益未列明'};
 if(o.amount===null&&o.text.length>36)o.text=o.text.slice(0,34)+'…';return o;
}
let route='U01',params=new URLSearchParams(),renderers={},actions={},forms={},draft=null,filters={},lastFocus,headerObserver;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('浏览器未允许本地保存，本次会话仍可演示')}};
const go=(id,args={})=>{const h=href(id,args);if(location.hash===h)render();else location.hash=h;};
const toast=text=>{const el=document.getElementById('toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3600)};
function close(){document.querySelectorAll('#overlay,#phone-overlay').forEach(el=>el.innerHTML='');if(lastFocus&&lastFocus.isConnected)lastFocus.focus();}
function modal(title,html,wide=false){lastFocus=document.activeElement;const target=document.querySelector('.device #phone-overlay')||document.getElementById('overlay');target.innerHTML=`<div class="modal-backdrop"><section class="modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${E(title)}"><div class="modal-head"><h2>${E(title)}</h2>${btn('关闭','close',{},'close')}</div><div class="modal-body">${html}</div></section></div>`;setTimeout(()=>document.querySelector('.modal input,.modal select,.modal textarea,.modal button')?.focus(),0);}
function render(){
 document.dispatchEvent(new Event("club:before-render"));
 const hash=location.hash.slice(2).split('?');route=pages.some(p=>p.id===hash[0])?hash[0]:'U01';params=new URLSearchParams(hash[1]||'');if(route.startsWith('T'))route='S'+route.slice(1);let p=pages.find(p=>p.id===route),role=p.role;
 document.body.dataset.role=role;document.body.dataset.page=route;document.body.dataset.desktop=String(['A','M'].includes(role));const mobile=['U','S','T'].includes(role);let content;try{content=renderers[route]?renderers[route]():empty('此页面暂无数据')}catch(e){console.error(e);content=notice('页面数据异常：'+e.message)}if(Club.cleanHTML)content=Club.cleanHTML(content);
 const roleNames={U:'业主端',S:'商家移动端',A:'运营后台端',M:'商家后台端'};
 const header=`<header class="topbar"><a class="brand" href="#/U01"><div class="brand-mark">宸</div><div><div class="brand-title">宸 club</div><div class="brand-sub">CHEN CLUB · EVERYDAY WELL LIVED</div></div></a><nav class="role-switch" aria-label="操作端">${Object.entries({U:'U01',S:'S01',A:'A01',M:'M04'}).map(([r,id])=>`<a class="${role===r?'on':''}" href="${href(id)}">${roleNames[r]}</a>`).join('')}</nav><div class="top-actions"><select id="project" aria-label="当前会所">${Object.entries(projects).map(([id,n])=>`<option value="${id}" ${S.project===id?'selected':''}>${n}</option>`).join('')}</select>${role==='U'?`<select id="identity" aria-label="业主身份">${Object.entries({...identities,guest:'游客浏览'}).map(([id,n])=>`<option value="${id}" ${(S.guest?'guest':S.identity)===id?'selected':''}>${n}</option>`).join('')}</select>`:`<span class="tag">${role==='M'?'当前店铺':'授权项目'}</span>`}${btn('页面目录','directory',{},'btn light sm')}</div></header>`;
 const visiblePages=pages.filter(x=>x.role===role&&!x.hidden);
 const sidebar=`<aside class="sidebar"><div class="eyebrow" style="padding:0 12px 12px">${role==='U'?'MEMBER EXPERIENCE':role==='S'?'SERVICE DESK':role==='M'?'MERCHANT CENTER':'OPERATIONS CENTER'}</div><div class="section-label">${roleNames[role]} · ${visiblePages.length}个页面</div>${visiblePages.map(x=>`<a href="${href(x.id)}" class="nav-link ${x.id===route?'on':''}"><span>${Club.icon((({A01:"s-data",A02:"office-building",A03:"goods",A04:"tickets",A05:"postcard",A06:"date",A07:"user",A08:"s-order",A09:"service",A10:"picture-outline",A11:"s-finance",A12:"setting",A13:"document",M01:"s-shop",M02:"connection",M03:"s-order"})[x.id]||"collection"))}${E(x.title)}</span><b>${x.id}</b></a>`).join('')}<div class="sidebar-note">交互原型 · 2026.11.11<br>客户资料＋本地演示记录<br>支付、核销与到账均为模拟<div class="space">${btn('重置演示数据','reset',{},'btn light sm')}</div></div></aside>`;
 const pagehead=`<div class="breadcrumb">宸club / ${roleNames[role]} / ${E(p.title)}</div><div class="pagehead"><div><div class="eyebrow mb">${route} · ${role==='U'?'A MOMENT FOR YOURSELF':role==='S'?'SERVICE WITH CARE':'CHEN CLUB OPERATIONS'}</div><h1>${E(p.title)}</h1><p>${E(p.desc)} · ${projects[S.project]}</p></div></div>`;
 const tab=role==='T'?[['工作台','T01'],['代客服务','T03'],['核销','T05'],['工单','T07'],['我的','T09']]:role==='U'?[['首页','U01'],['权益','U03'],['扫码点单','U11'],['服务','U05'],['我的','U12']]:[['工作台','S01'],['代客服务','S03'],['核销','S05'],['工单','S07'],['我的','S09']];
 const activeTab=({U02:'U03',U04:'U03',U06:'U05',U07:'U05',U08:'U05',U09:'U05',U10:'U12',U11:'U11',U21:'U03',U22:'U11',U23:'U11',U24:'U12',U25:'U05',U26:'U05',U27:'U05',U28:'U01',U13:'U12',U14:'U12',U15:'U12',U16:'U12',U17:'U03',U18:'U05',U19:'U12',U20:'U03',S10:'S03',S02:'S01',S04:'S03',S06:'S01',S08:'S05',T02:'T01',T04:'T03',T06:'T01',T08:'T05'})[route]||route;
 const mobileHTML=`<div class="mobile-stage"><div class="device-preview" aria-label="iPhone X · 375 × 812 移动端预览"><div class="device ${role==='U'?'owner-device':''}"><div class="device-status"><b>9:41</b><span>CHEN CLUB</span></div><main class="mobile-screen" id="screen" data-phone-screen>${content}</main>${['U','S','T'].includes(role)?'<div id="phone-overlay"></div>':''}<nav class="mp-tabs" aria-label="移动端导航">${tab.map(([text,id])=>`<a href="${href(id)}" class="${activeTab===id?'on':''}"${activeTab===id?' aria-current="page"':''}>${Club.icon(({U01:"house",U03:"present",U05:"discover",U11:"full-screen",U12:"user",S01:"s-grid",S03:"date",S05:"full-screen",S07:"chat-dot-round",S09:"user",T01:"s-grid",T03:"date",T05:"full-screen",T07:"chat-dot-round",T08:"tickets",T09:"user"})[id]||"collection")}<span>${text}</span></a>`).join('')}</nav></div></div><aside class="review-notes" hidden><div class="eyebrow mb">REVIEW GUIDE</div><h3>每一次服务，都有记录</h3><p>切换会所及业主身份，查看对应权益。切换至员工端或后台，同一笔演示订单会继续保留。</p><div class="note-step"><span>01</span>选择服务与时段</div><div class="note-step"><span>02</span>确认权益或模拟支付</div><div class="note-step"><span>03</span>员工核验一次性凭证</div><div class="note-step"><span>04</span>订单、权益与记录同步</div><div class="space">${link('查看客户权益与价目','A04',{},'btn light full')}</div><p class="space">演示时段、会员、资产期限与交易记录为样例。客户未给出的规则保留待确认。</p></aside></div>`;
 document.getElementById('app').innerHTML=mobile?header+`<div class="layout">${sidebar}<div class="workspace mobile-workspace">${pagehead}${mobileHTML}</div></div>`:desktopShell(p,content);
 syncViewport();
 if(typeof ResizeObserver!=='undefined'){headerObserver?.disconnect();headerObserver=new ResizeObserver(syncViewport);headerObserver.observe(document.querySelector('.topbar'));headerObserver.observe(document.querySelector('.workspace'));}
 document.dispatchEvent(new Event("club:render"));
 document.title=p.title+' · 宸club交互原型';
 document.getElementById('project').onchange=e=>{S.project=e.target.value;draft=null;filters={};save();if(['U06','U07','U08','U09','U04'].includes(route))go('U05');else render();};
 const ident=document.getElementById('identity');if(ident)ident.onchange=e=>{S.guest=e.target.value==='guest';if(!S.guest)S.identity=e.target.value;draft=null;save();if(['U07','U08'].includes(route))go('U05');else render();};
}
// The mall uses an 80px module rail, 206px submenu, 50px header and 34px tabs.
function desktopShell(page,content){
 const groups=[
  {title:'工作台',icon:'s-home',ids:['A01']},
  {title:'项目服务',icon:'goods',ids:['A02','A03','A06','A23']},
  {title:'会员权益',icon:'user',ids:['A04','A05','A07','A20','A21']},
  {title:'订单客服',icon:'s-order',ids:['A08','A09']},
  {title:'内容装修',icon:'picture-outline',ids:['A10','A16','A22','A24']},
  {title:'财务',icon:'s-finance',ids:['A11']},
  {title:'系统',icon:'setting',ids:['A12','A17','A18','A19']},
  {title:'商家运营',icon:'connection',ids:['M04','M05','M06','M07','M08','M09','M10','M01','M02','M03']}
 ];
 const group=groups.find(g=>g.ids.includes(page.id))||groups[0];
 return `<div class="mall-shell">
 <nav class="mall-rail" aria-label="后台模块"><a class="mall-brand" href="#/A01">宸</a>${groups.map(g=>`<a href="${href(g.ids[0])}" class="${g===group?'on':''}">${Club.icon(g.icon)}<span>${g.title}</span></a>`).join('')}<div class="mall-rail-bottom">${btn('页面目录','directory',{},'mall-directory')}</div></nav>
 <aside class="mall-submenu"><div class="mall-subtitle">${group.title}</div><nav aria-label="当前模块页面">${group.ids.filter(id=>{const p=pages.find(x=>x.id===id);return p&&!p.hidden}).map(id=>{const p=pages.find(x=>x.id===id);return `<a href="${href(id)}" class="${id===page.id?'on':''}">${Club.icon('s-grid')}<span>${E(p.title)}</span></a>`}).join('')}</nav><div class="mall-side-note">宸 CLUB 会所服务<br>${page.role==='M'?'商户运营中心':'平台运营中心'}<div class="space">${btn('重置演示数据','reset',{},'btn light sm')}</div></div></aside>
 <header class="topbar mall-topbar"><div class="mall-crumb">${Club.icon('s-fold')}<span>${group.title}</span><span class="muted">/</span><b>${E(page.title)}</b></div><div class="mall-top-right"><nav class="mall-role-switch" aria-label="操作端">${[['U01','业主端'],['S01','商家移动端'],['A01','运营后台端'],['M04','商家后台端']].map(([id,title])=>`<a href="${href(id)}" class="${id[0]===page.role?'on':''}">${title}</a>`).join('')}</nav><select id="project" aria-label="当前会所">${Object.entries(projects).map(([id,n])=>`<option value="${id}" ${S.project===id?'selected':''}>${n}</option>`).join('')}</select><span class="mall-avatar">${Club.icon('user-solid')}</span><span class="mall-operator">会所运营</span>${btn('页面目录','directory',{},'btn light sm')}</div></header>
 <nav class="mall-tabs" aria-label="后台页签"><a href="#/A01" class="${page.id==='A01'?'on':''}">经营总览</a>${page.id!=='A01'?`<a class="on" href="${href(page.id)}">${E(page.title)}</a>`:''}<span>${projects[S.project]} · ${page.role==='M'?'商户端':'平台端'}</span></nav>
 <main class="workspace mall-workspace"><div class="mall-pagehead"><div><h1>${E(page.title)}</h1><p>${E(page.desc)}</p></div></div>${content}<footer class="mall-footer">宸 CLUB 会所服务</footer></main></div>`;
}
// Keep the logical phone viewport fixed; fit the whole frame with one uniform scale.
function syncViewport(){
 const header=document.querySelector('.topbar');if(!header)return;
 document.documentElement.style.setProperty('--reviewbar-height',header.getBoundingClientRect().height+'px');
 const frame=document.querySelector('.device-preview'),stage=document.querySelector('.mobile-stage');if(!frame||!stage)return;
 const notes=stage.querySelector('.review-notes'),notesVisible=notes&&getComputedStyle(notes).display!=='none';
 const availableWidth=stage.clientWidth-(notesVisible?notes.getBoundingClientRect().width+parseFloat(getComputedStyle(stage).gap||0):0);
 const availableHeight=window.innerHeight-stage.getBoundingClientRect().top-24;
 const scale=Math.min(1,Math.max(1,availableWidth)/389,Math.max(1,availableHeight)/826);
 frame.style.setProperty('--device-scale',String(scale));
}
function register(map){Object.assign(renderers,map)}
actions.close=close;
actions.directory=()=>modal('页面目录 · '+pages.filter(p=>!p.hidden).length+'个主要视图',`<div class="notice mb">业主端、商家移动端、运营后台端及商家后台端。</div><div class="row mb"><a class="btn light" href="UI稿总览.html">查看UI稿总览</a></div>${Object.entries({U:'业主端',S:'商家移动端',A:'运营后台端',M:'商家后台端'}).map(([r,label])=>`<h3 class="space mb">${label}</h3><div class="chips">${pages.filter(p=>p.role===r&&!p.hidden).map(p=>`<a class="chip" href="${href(p.id)}" data-action="close">${p.id} ${p.title}</a>`).join('')}</div>`).join('')}`,true);
actions.reset=()=>modal('重置演示数据',`<p class="mb">将清除此原型保存的演示订单、配置和操作记录，恢复初始样例。</p>${btn('确认重置','confirm-reset',{},'btn danger')}`);
actions['confirm-reset']=()=>{S=C.seed();draft=null;filters={};save();close();go('U01');render();toast('已恢复初始演示数据')};
actions['copy-code']=async d=>{try{await navigator.clipboard.writeText(d.code);toast('已复制凭证编号')}catch(e){modal('凭证编号',`<input aria-label="凭证编号" readonly value="${E(d.code)}" style="width:100%"><p class="small muted space">可选中复制，在员工端输入后核销。</p>`)}};
actions['order-detail']=d=>showOrder(d.id);
function showOrder(id){const o=S.orders.find(x=>x.id===id);if(!o)return toast('订单不存在');modal('订单详情',`${tag(o.status)}<h2 class="space mb">${E(o.title)}</h2>${kv('订单号',E(o.id))}${kv('项目',projects[o.project])}${kv('使用人',E(o.user)+' · '+o.people+'人')}${kv('时间',E(o.date+' '+o.time)+' · '+o.duration+'分钟（演示排期）')}${kv('实付金额',money(o.paid?o.amount:0))}${kv('已退款',money(o.refunded))}${kv('支付方式',E(o.channel))}${kv('到场凭证',E(o.code))}${notice('业务记录为本地模拟；预约时段、取消及退款条件需项目确认。')}<div class="row wrap space">${link('到场凭证','U09',{id:o.id},'btn')}${!o.paid?btn('模拟支付','pay',{id:o.id},'btn gold-btn'):''}${o.paid&&o.amount>o.refunded?btn('申请退款','refund-request',{id:o.id},'btn light'):''}</div>`)}
actions.pay=d=>{C.pay(S,d.id);save();close();go('U09',{id:d.id});render();toast('模拟支付成功，已生成待履约凭证')};
actions.cancel=d=>{C.cancel(S,d.id);save();render();toast('演示预约已取消，时段已释放')};
actions['refund-request']=d=>{const o=S.orders.find(x=>x.id===d.id);modal('申请退款',form('refund-request',`${notice('演示申请将交由后台审核；实际可退期限、通道能力与业务条件待确认。')}${input('id','订单号',o.id,'text','readonly')}${input('amount','退款金额（元）',((o.amount-o.refunded)/100).toFixed(2),'number','min="0.01" step="0.01" required')}${input('reason','申请原因','','text','required')}`,'提交演示申请'))};
forms['refund-request']=f=>{const o=S.orders.find(x=>x.id===f.id),n=Math.round(Number(f.amount)*100);if(!o||n<=0||n>o.amount-o.refunded)throw Error('申请金额超过可退额度');o.refundPending={amount:n,reason:f.reason};C.log(S,'提交退款申请',o.id+' · '+f.reason);save();close();render();toast('已提交，请在后台订单页审核')};
actions.reschedule=d=>{const o=S.orders.find(x=>x.id===d.id);modal('演示改期',form('reschedule',input('id','订单号',o.id,'text','readonly')+input('date','新日期',o.date,'date','required')+select('time','新时段',[['09:00','09:00'],['11:00','11:00'],['14:00','14:00'],['16:00','16:00']],o.time)+notice('改期条件未定；此处仅演示资源冲突检查。'),'确认演示改期'))};
forms.reschedule=f=>{C.reschedule(S,f.id,f.date,f.time);save();close();render();toast('已更新预约时间')};
actions.favorite=d=>{if(S.favorites.includes(d.id))S.favorites=S.favorites.filter(x=>x!==d.id);else S.favorites.push(d.id);save();render();toast('收藏已更新')};
function start(){
 document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const action=actions[b.dataset.action];if(!action)return;try{action({...b.dataset},b,e)}catch(err){toast(err.message)}});
 document.addEventListener('submit',e=>{const f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();const fn=forms[f.dataset.form];if(!fn)return;try{fn(Object.fromEntries(new FormData(f)),f)}catch(err){const box=f.querySelector('.error');if(box){box.textContent=err.message;box.classList.add('show')}else toast(err.message)}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const modalEl=document.querySelector('.modal');if(!modalEl)return;const list=[...modalEl.querySelectorAll('a,button,input,select,textarea')].filter(x=>!x.disabled);const a=list[0],b=list.at(-1);if(e.shiftKey&&document.activeElement===a){e.preventDefault();b?.focus()}else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a?.focus()}}});
 window.addEventListener('resize',syncViewport);window.addEventListener('hashchange',()=>{close();render()});window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue){S=JSON.parse(e.newValue);render()}});if(!location.hash)history.replaceState(null,'','#/U01');render();
}
return {get views(){return renderers},C,R,E,money,tag,href,link,btn,input,select,notice,empty,kv,form,table,projects,identities,pages,services,service,offer,currentOrders,assets,save,go,toast,modal,close,register,actions,forms,start,render,showOrder,get S(){return S},get route(){return route},get params(){return params},get draft(){return draft},set draft(v){draft=v},get filters(){return filters}};
})();
