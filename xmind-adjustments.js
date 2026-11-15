/* 会员运营.xmind · 规划补齐与端到端维护核验 */
(function(){
  'use strict';
  var A=Club,C=A.C,E=A.E,money=A.money,tag=A.tag,link=A.link,btn=A.btn,input=A.input,select=A.select,notice=A.notice,empty=A.empty,form=A.form,table=A.table;
  var V=A.S.v02||(A.S.v02={}), p=function(){return A.S.project}, pname=function(id){return A.projects[id]||id};
  var serviceRows=function(){return A.services.filter(function(s){return s.project===p()&&!A.S.hiddenServices.includes(s.id);});};
  var iso=function(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  var days=function(n){var base=new Date();base.setHours(12,0,0,0);return Array.from({length:n||7},function(_,i){var d=new Date(base);d.setDate(base.getDate()+i);return [iso(d),d.toLocaleDateString('zh-CN',{weekday:'short'})];});};
  var times=function(){return ['09:00','11:00','14:00','16:00'];};
  var endTime=function(t){var x=t.split(':'),m=Number(x[0])*60+Number(x[1])+60;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
  var safe=function(x){return x==null?'':E(x);};
  var priceText=function(x){var p=x&&x.prices||{};return ['ma','mc','na','nc'].map(function(k){return p[k]||'待配置';}).join('／');};
  var projectChecks=function(selected){selected=selected||[];return '<fieldset class="xmind-project-checks"><legend>归属项目（可多选）</legend>'+Object.entries(A.projects).map(function(x){return '<label><input type="checkbox" name="project-'+x[0]+'" value="yes" '+(selected.includes(x[0])?'checked':'')+'>'+E(x[1])+'</label>';}).join('')+'</fieldset>';};

  /* XMind 规划总览：把五个端口与现有原型入口放在同一张可审查矩阵中。 */
  var coverage=[
    ['业主端·会员首页／非会员首页','Banner 60%、会籍／加入、近期预约、场所／课程／餐饮、私教、图文内容','U01','A10／A16 页面装修与内容；A03 服务／商品；A05 会籍权益'],
    ['业主端·权益／服务／我的','身份、标准权益、卡包、预约与订单、扫码点单、家庭成员、地址、联系会所','U03／U05／U11／U12／U13／U14／U15／U16','A04／A05／A07／A08／A09；M04／M05'],
    ['运营 PC·会员／订单／装修／内容','会员档案、家庭成员权益、订单与分账、Banner／组件、图文内容发布、代客服务与工单','A03／A04／A05／A06／A07／A08／A09／A10／A11／A12／A16／A18／S03／S07','M04／M05／M06／M07／M08；A03／A04／A06／A09'],
    ['运营小程序·会员查询／代客／核销／工单','手机号查询、权益绑定、日期后时段、权益内外支付、会员码／服务码核销、工单指派','S02／S03／S05／S07／S08','A07／A08／A09／A12；M04／M06／M07'],
    ['商家 PC·商品／服务／订单／分账／工单','商城商品、次卡／课程／优惠券、身份价格、日期／时段／人数、取消规则、退款凭证','M03／M04／M05／M06／M07／M08','A03／A04／A06／A08／A09'],
    ['商家小程序·代客／核销／订单／工单','权益内外代客预约与点单、客户支付入口、会员码／服务码核销、退款凭证','T03／T05／T07／T08','A08／A09；M04／M06／M07']
  ];
  function coveragePage(){
    return '<div class="xmind-coverage-head"><div><div class="eyebrow mb">会员运营.xmind · REQUIREMENT MAP</div><h2>系统需求清单覆盖核验</h2><p>以 XMind 的会员、运营和商家四类端口为范围，核对展示、操作与后台维护位置；“待确认”参数继续沿用客户资料边界。</p></div><span class="tag ok">6／6 端口已映射</span></div>'+
      table(['规划端口','需求范围','原型入口','维护／数据来源'],coverage.map(function(r){return [E(r[0]),E(r[1]),r[2].split('／').map(function(id){return link(id,id,{},'btn light sm');}).join(' '),E(r[3])];}))+
      '<div class="xmind-coverage-grid"><section><h3>本轮补齐</h3><ul><li>商家服务类型支持次卡、课程、优惠券，并记录直减／折扣／兑换规则。</li><li>身份价格、可预约日期、日期下时段、容量、提前量和取消规则均有维护字段。</li><li>会员入会时间、会籍到期日、家庭成员类型／绑定时间／到期日可编辑。</li><li>内容归属项目支持多选，发布状态、有效期和阅读量继续可追踪。</li></ul></section><section><h3>客户资料边界</h3><p>紫京、北京的场景权益与价目沿用资料原文；中建泳池和器械健身保持无需预约；未提供的价格、容量、排期、取消及硬件参数显示“待配置／待确认”，不套用其他会所数据。</p></section></div>';
  }

  /* 商家 PC 服务管理：补齐 XMind 中的服务类型、身份价格、排期和异常规则。 */
  function merchantServices(){
    var rows=serviceRows();
    return '<div class="v03-admin-toolbar"><div><h2>服务管理</h2><p>新增服务支持次卡、课程、优惠券和场地／康养服务；会员价格与预约规则由本店维护，业主端按当前项目读取。</p></div>'+btn('新增服务','xmind-service-edit',{},'btn gold-btn')+'</div>'+
      table(['服务名称','类型／分类','四类身份价格','可预约日期／时段','人数／异常规则','状态','操作'],rows.map(function(s){var x=V.v03?.merchantServices?.[s.id]||{};return [E(s.name),E(x.type||s.kind)+' · '+E(x.category||s.category),E(priceText(x)),E(x.dates||'待配置')+'／'+E(x.slots||'待配置'),E(x.capacity||'待配置')+'人 · '+E(x.cancelPolicy||'取消规则待确认'),tag(A.S.hiddenServices.includes(s.id)?'已下架':'已上架',A.S.hiddenServices.includes(s.id)?'gray':'ok'),link('编辑配置','M09',{id:s.id},'btn light sm')];}))+
      '<div class="v03-admin-note">预约服务先选日期，再展示该日期下时段；容量、提前量与取消费用为空时保留“待确认”，不自动生成营业规则。</div>';
  }
  function merchantServiceEditor(){
    var id=A.params.get('id'),s=A.service(id)||serviceRows()[0],x=(V.v03.merchantServices||{})[s.id]||{},pr=x.prices||{};
    var selected=x.dateList||[];
    return '<div class="v03-page-editor"><div class="v03-editor-head"><div><h2>服务编辑 · '+E(s.name)+'</h2><p>服务主数据、四类身份价格、日期下时段和异常规则集中维护。</p></div>'+link('返回服务管理','M04',{},'btn light')+'</div>'+
      form('xmind-service-save','<input type="hidden" name="id" value="'+E(s.id)+'">'+input('name','服务／场地名称',s.name,'text','readonly')+
      select('type','服务类型',[['场地使用','场地使用'],['课程服务','课程服务'],['私教服务','私教服务'],['康养服务','康养服务'],['次卡','次卡'],['优惠券','优惠券']],x.type||s.kind)+
      select('couponType','优惠券规则',[['直减','直减'],['折扣','折扣'],['兑换','兑换']],x.couponType||'直减')+
      select('category','展示分类',[['运动健康','运动健康'],['商务社交','商务社交'],['休闲康养','休闲康养'],['文化社区','文化社区']],x.category||s.category)+
      select('settlement','结算分类',[['运动服务分账','运动服务分账'],['餐饮商品分账','餐饮商品分账'],['康养服务分账','康养服务分账'],['待绑定','待绑定']],x.settlement||'待绑定')+
      '<h3 class="v03-form-section">四类身份价格（可按会籍配置）</h3><div class="form-grid xmind-price-grid">'+input('price-ma','会籍成人',pr.ma||'','text','placeholder="如：场地免费／500元·待确认"')+input('price-mc','会籍儿童（成人陪同）',pr.mc||'','text','placeholder="儿童栏—需保留"')+input('price-na','无会籍成人',pr.na||'','text','placeholder="如：158元／2小时"')+input('price-nc','无会籍儿童（成人陪同）',pr.nc||'','text','placeholder="未提供则填待确认"')+'</div>'+ 
      '<h3 class="v03-form-section">可预约日期</h3><div class="v03-date-grid">'+days(7).map(function(d){return '<label class="v03-date-check"><input type="checkbox" name="date-'+d[0]+'" value="yes" '+(selected.includes(d[0])?'checked':'')+'><b>'+E(d[0].slice(5))+'</b><small>'+E(d[1])+'</small></label>';}).join('')+'</div>'+ 
      '<h3 class="v03-form-section">日期下的时间段</h3><div class="v03-slot-grid v03-slot-admin">'+times().map(function(t){var on=(x.slotList||[]).includes(t);return '<label class="v03-slot-check"><input type="checkbox" name="slot-'+t+'" value="yes" '+(on?'checked':'')+'><span>'+t+'—'+endTime(t)+'</span></label>';}).join('')+'</div>'+ 
      '<div class="form-grid">'+input('capacity','单时段人数上限',x.capacity||'','number','min="1" placeholder="待确认"')+input('leadHours','最少提前预约（小时）',x.leadHours||'','number','min="0" placeholder="待确认"')+'</div>'+input('cancelPolicy','异常／取消规则',x.cancelPolicy||'','text','placeholder="如：取消预约、超时及退款规则待确认"')+input('rule','预约／会员规则',x.rule||'按会员权益和客户价目表核验','text','required'), '保存服务与排期');
  }
  A.actions['xmind-service-edit']=function(d){var id=d&&d.id||(serviceRows()[0]||{}).id;if(id)A.go('M09',{id:id});};
  A.forms['xmind-service-save']=function(f){
    var list=days(7).map(function(d){return d[0]}).filter(function(d){return f['date-'+d]==='yes';});
    var sl=times().filter(function(t){return f['slot-'+t]==='yes';});
    V.v03=V.v03||{};V.v03.merchantServices=V.v03.merchantServices||{};
    var old=V.v03.merchantServices[f.id]||{};
    V.v03.merchantServices[f.id]=Object.assign({},old,{type:f.type,couponType:f.couponType,category:f.category,settlement:f.settlement,dateList:list,slotList:sl,dates:list.length+'天',slots:sl.length+'个时段',capacity:f.capacity,leadHours:f.leadHours,cancelPolicy:f.cancelPolicy,rule:f.rule,prices:{ma:f['price-ma'],mc:f['price-mc'],na:f['price-na'],nc:f['price-nc']}});
    A.C.log(A.S,'维护商家服务规则',f.id+' · '+f.type+' · '+list.length+'天／'+sl.length+'时段');A.save();A.go('M04');A.toast('服务类型、身份价格与预约规则已保存');
  };

  /* 运营会员档案：补齐 XMind 要求的入会时间和家庭成员绑定时间／到期日。 */
  function memberEditor(){
    var id=A.params.get('id'),m=(V.members||[]).find(function(x){return x.id===id})||{project:p(),family:[],rights:[]};
    return '<div class="v03-page-editor"><div class="v03-editor-head"><div><h2>'+E(id?'编辑会员':'新增会员')+'</h2><p>基本资料、会籍周期、家庭成员和权益绑定从同一档案进入。</p></div>'+link('返回会员管理','A07',{},'btn light')+'</div>'+form('xmind-member-save','<input type="hidden" name="id" value="'+E(m.id||'')+'">'+select('project','所属项目',Object.entries(A.projects),m.project||p())+input('name','会员姓名',m.name||'','text','required')+input('phone','联系方式',m.phone||'','text','required')+input('avatar','头像文字',m.avatar||'宸','text','maxlength="2"')+select('grade','会员等级／会籍',V.rights.filter(function(r){return r.project===(m.project||p())}).map(function(r){return [r.name,r.name]}),m.grade||'')+'<div class="form-grid">'+input('joinDate','入会时间',m.joinDate||'2026-11-01','date','required')+input('expiry','会籍到期时间',m.expiry||'2027-11-10','date','required')+'</div><div class="v03-family-editor"><h3>家庭成员权益绑定</h3><p class="small muted">保存后可从会员列表进入权益绑定；本次可同时建立一名家庭成员档案。</p>'+input('familyName','家庭成员姓名','','text')+input('familyPhone','家庭成员联系方式','','text')+select('familyType','成员类型',[['成人','成人'],['儿童','儿童']], '儿童')+'<div class="form-grid">'+input('familyBindDate','绑定时间',new Date().toISOString().slice(0,10),'date')+input('familyExpiry','成员权益到期时间',m.expiry||'2027-11-10','date')+'</div></div>','保存会员档案');
  }
  A.forms['xmind-member-save']=function(f){
    var m=(V.members||[]).find(function(x){return x.id===f.id});
    if(!m){m={id:A.C.uid('MEM'),project:f.project,name:f.name,phone:f.phone,avatar:f.avatar||f.name.slice(0,1),grade:f.grade,rights:[],expiry:f.expiry,joinDate:f.joinDate,family:[]};V.members.push(m);}
    else Object.assign(m,{project:f.project,name:f.name,phone:f.phone,avatar:f.avatar,grade:f.grade,expiry:f.expiry,joinDate:f.joinDate});
    if(f.familyName){var child={id:A.C.uid('MEM'),project:f.project,name:f.familyName,phone:f.familyPhone||'',avatar:f.familyName.slice(0,1),grade:f.familyType==='儿童'?'会籍儿童':'家庭成员',familyType:f.familyType,bindDate:f.familyBindDate||f.joinDate,expiry:f.familyExpiry||f.expiry,rights:[],family:[]};V.members.push(child);m.family=m.family||[];m.family.push(child.id);}
    A.C.log(A.S,'维护会员档案',m.name+' · 入会'+m.joinDate+' · 到期'+m.expiry);A.save();A.go('A07');A.toast('会员档案与家庭成员信息已保存');
  };

  /* 内容管理：归属项目可多选，发布和阅读量字段继续沿用原商城内容管理语义。 */
  function contentAdmin(){var rows=(V.articles||[]).filter(function(a){var ps=a.projects||[a.project];return ps.includes(p());});return '<div class="v03-admin-toolbar"><div><h2>内容管理</h2><p>维护首页／服务图文内容、归属项目、展示时间、有效期、发布状态和阅读量。</p></div>'+link('新增内容','A22',{},'btn gold-btn')+'</div>'+table(['内容名称','归属项目','展示位置／有效期','详情摘要','状态／阅读量','操作'],rows.map(function(a){var ps=(a.projects||[a.project]).map(pname).join('、');return [E(a.name),E(ps),E(a.display)+'<p class="small muted">'+E(a.validity||'长期')+'</p>',E(a.detail||'—'),tag(a.status,a.status==='已发布'?'ok':'warn')+'<p class="small muted">阅读 '+(a.clicks||0)+'</p>',link('编辑','A22',{id:a.id},'btn light sm')+' '+btn(a.status==='已发布'?'下架':'发布','v03-article-toggle',{id:a.id},'btn soft sm')];}))+'<div class="v03-admin-note">未发布内容可编辑；发布后由业主首页／服务详情读取。运营仅维护内容，不替代商家服务和商品价格。</div>';}
  function contentEditor(){var id=A.params.get('id'),a=(V.articles||[]).find(function(x){return x.id===id})||{project:p(),projects:[p()],name:'',image:'assets/club-courtyard.jpg',display:'首页／本周精选',validity:'长期',detail:'',status:'草稿',clicks:0};return '<div class="v03-page-editor"><div class="v03-editor-head"><div><h2>'+E(id?'编辑内容':'新增内容')+'</h2><p>图文详情、归属项目和有效期独立保存，未发布内容可继续编辑。</p></div>'+link('返回内容管理','A16',{},'btn light')+'</div>'+form('xmind-article-save','<input type="hidden" name="id" value="'+E(a.id||'')+'">'+input('name','内容名称',a.name,'text','required')+projectChecks(a.projects||[a.project||p()])+input('image','展示图素材',a.image||'assets/club-courtyard.jpg','text','required')+input('display','展示位置',a.display||'首页／本周精选','text','required')+input('validity','展示时间／有效期',a.validity||'长期','text','required')+'<label class="field"><span>图文详情</span><textarea name="detail" rows="8" required>'+E(a.detail||'')+'</textarea></label>','保存内容草稿');}
  A.forms['xmind-article-save']=function(f){var selected=Object.keys(A.projects).filter(function(id){return f['project-'+id]==='yes';});if(!selected.length)throw Error('至少选择一个归属项目');var a=(V.articles||[]).find(function(x){return x.id===f.id}),x={id:a?a.id:A.C.uid('ARTICLE'),project:selected[0],projects:selected,name:f.name,image:f.image,display:f.display,validity:f.validity,detail:f.detail,status:a?a.status:'草稿',clicks:a?a.clicks:0};if(a)Object.assign(a,x);else V.articles.push(x);A.C.log(A.S,'维护首页内容',x.name+' · '+selected.join(','));A.save();A.go('A16');A.toast('内容草稿已保存');};

  A.register({A18:coveragePage,M04:merchantServices,M09:merchantServiceEditor,A21:memberEditor,A16:contentAdmin,A22:contentEditor});
})();
