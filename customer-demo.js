/* 客户权益为业务依据；人员、日期、余额及交易状态仅为联动演示。 */
(function(){
  'use strict';
  var A=Club,C=A.C,VERSION='20261116-customer-3',baseOffer=A.offer;
  var ids=['ma','mc','na','nc'],names=['林女士','周先生','林小宸','陈女士','许先生','沈女士'];
  var dateAt=function(n){var d=new Date();d.setDate(d.getDate()+n);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);};
  var sourceRows=A.R['权益与价格明细'].rows;
  function quote(s,id,variant){
    id=id||A.S.identity;variant=variant||'standard';
    var q=baseOffer(s,id,variant),raw=s.rights[ids.indexOf(id)]||'待确认';
    if(/^—/.test(raw))return Object.assign(q,{amount:null,text:'该身份权益未列明'});
    if(/私教/.test(s.kind)&&!s.name.includes('SPA')&&s.project!=='zj'){
      if(/✅/.test(raw))return Object.assign(q,{amount:null,text:'会籍私教权益 · 次数及使用规则待确认'});
      var matches=Array.from(raw.matchAll(/(初级|中级|高级|职业|基础课|特色课)[：:]?\s*(\d+)/g));
      var choice=matches.find(function(m){return m[1]===variant;})||matches[0],single=raw.match(/(\d+)元\s*[/／]\s*(位|节)/);
      var amount=choice?Number(choice[2]):single?Number(single[1]):null;
      return Object.assign(q,{amount:amount===null?null:amount*100,text:amount===null?raw:'¥'+amount.toLocaleString('zh-CN'),unit:/元\s*[/／]\s*位/.test(raw)?'／位':/元\s*[/／]\s*节/.test(raw)?'／节':'计价单位待确认',priceBasis:'客户原文',duration:60,demoDuration:true});
    }
    return q;
  }
  A.offer=quote;
  function image(s){return 'assets/home-'+(/泳|泡池/.test(s.name)?'pool':/茶|棋牌/.test(s.name)?'tea':/私教/.test(s.kind)?'coach':/SPA|女王/.test(s.name)?'spa':/艺廊|阅读|花植/.test(s.name)?'gallery':'dining')+'.jpg';}
  function sourceProduct(r,p){return {id:'SOURCE-'+r[0],project:p,name:r[2]+' · '+r[3],category:/私教|课/.test(r[3])?'课程价目':/原价|SPA/.test(r[7]+r[2])?'康养价目':/茶室/.test(r[2])?'茶室茶品':'场景价目',price:r[5]===null?(r[6]===null?'待确认':r[6]+'元起'):(r[5]+' '+r[7]),amount:r[5]===null?null:r[5]*100,member:r[4]+'；'+(r[10]||''),stock:'排期／库存待维护',image:/SPA/.test(r[2])?'assets/home-spa.jpg':/茶/.test(r[2])?'assets/home-tea.jpg':'assets/home-dining.jpg',status:'已上架',sourcePrice:r[0],source:r[11],unit:r[7],duration:r[8],detail:r[10],priceConfirmed:r[5]!==null&&!/原价|起|未写|附加/.test(r[7])};}
  function migrate(s){
    if(s.customerDemoVersion===VERSION)return s;
    var V=s.v02||(s.v02={});V.v03=V.v03||{};V.v03.merchantProducts=V.v03.merchantProducts||{};
    // 只替换系统产生的旧样例，不改用户手工创建的交易与配置。
    var oldOrder=function(o){return /^DEMO-(V02|BJ|ZJ)-/.test(o.id)||o.customerDemo===true;};
    s.orders=s.orders.filter(function(o){return !oldOrder(o);});
    var replace=function(key,rows,remove){s[key]=(s[key]||[]).filter(function(x){return !x.customerDemo&&!(remove&&remove(x));}).concat(rows);};
    var push=function(rows,x){rows.push(Object.assign({customerDemo:true},x));};
    var collections={assets:[],tickets:[],staff:[],suppliers:[],categories:[],offline:[],arrivals:[],assetRecords:[],logs:[]},rights=[],members=[],articles=[],hardware=[];
    Object.keys(A.projects).forEach(function(p,pi){
      var sv=A.services.filter(function(x){return x.project===p;}),publicServices=sv.filter(function(x){return !/私教/.test(x.kind);});
      var coffee=s.assets.find(function(x){return x.id==='coffee-bj';}),drink=s.assets.find(function(x){return x.id==='drink-bj';});
      // 每项客户服务均提供四种身份＋一项追加状态；待报价单没有实付或有效核销码。
      sv.forEach(function(svc,si){
        for(var i=0;i<5;i++){
          var identity=ids[i%4],q=quote(svc,identity),amount=q.amount,arrival=q.arrival&&i%2===0;
          if(arrival)amount=0;
          var status=amount===null?'待报价':i===0?'待履约':i===1?'已完成':i===2?'待支付':i===3?'已取消':'待履约';
          if(arrival)status=i===0?'待履约':'已完成';
          if(amount===0&&status==='待支付')status='待履约';
          var oid='CUSTOMER-'+svc.id+'-'+i,asset=arrival?'CUSTOMER-ASSET-'+p+'-0':undefined;
          push(s.orders,{id:oid,project:p,service:svc.id,title:svc.name+' · '+(/私教/.test(svc.kind)?'私教课程':arrival?'到场登记':'场景服务'),resource:svc.id+'-'+(i%2+1),date:dateAt(i===1?-1:i+1),time:['09:00','11:00','14:00','16:00','18:00'][i],duration:q.duration||60,amount:amount,identity:identity,user:identity.endsWith('c')?'林小宸':'林女士',people:1,companions:identity.endsWith('c')?1:0,asset:asset,status:status,paid:amount!==null&&!['待支付','已取消'].includes(status),code:amount===null?'':'CYD'+pi+String(si).padStart(2,'0')+i,refunded:0,refundParts:{},parts:amount>0?[{id:'CUSTOMER-SUP-'+p+'-0',name:A.projects[p]+'服务供方（演示）',ratio:100,amount:amount}]:[],source:'客户价目关联样单',sourceLocation:svc.location,created:dateAt(-2)+' 10:00',channel:amount===null?'待报价':amount===0?'权益／到场登记':'模拟在线支付',splitStatus:'未分账',merchant:'shop-'+p,operator:i===4?'演示前台':'',priceNote:amount===null?'客户未给确定成交价／额度，需核价':q.demoDuration?'价格按客户资料；排期时长为演示':'客户资料价目',demoSchedule:true});
        }
      });
      var products=sourceRows.filter(function(r){return r[1]===A.projects[p];}).map(function(r){return sourceProduct(r,p);});
      // 菜单缺失时只提供待维护的演示商品，不套用北京售价。
      for(var n=0;n<5;n++)products.push({id:'CUSTOMER-MENU-'+p+'-'+n,project:p,name:['美式咖啡','拿铁咖啡','特调饮品','茶饮','茶点'][n]+'（演示待确认）',category:'菜单待维护',price:'待确认',amount:null,member:'本场所未提供菜单；名称仅供演示，正式SKU与价格待维护',stock:'待维护',image:'assets/home-dining.jpg',status:'草稿',customerDemo:true});
      V.v03.merchantProducts[p]=(V.v03.merchantProducts[p]||[]).filter(function(x){return !/^(P-BJ-|SOURCE-|CUSTOMER-)/.test(x.id);}).concat(products);
      V.v03.merchantServices=V.v03.merchantServices||{};
      sv.forEach(function(svc){var cfg=V.v03.merchantServices[svc.id]||{};V.v03.merchantServices[svc.id]=Object.assign({},cfg,{prices:{ma:svc.rights[0],mc:svc.rights[1],na:svc.rights[2],nc:svc.rights[3]},source:svc.source,sourceLocation:svc.location});});
      var giftList=p==='bj'?[
        ['咖啡抵扣券','10张；面额、SKU及周期待确认',10,'BJX14'],['特调饮品兑换券','2张；指定饮品及周期待确认',2,'BJX14'],['会议室赠时','4小时；超额服务价9.5折；周期待确认',null,'BJX17'],['茶棋赠时','12小时，不叠加为24小时；范围／周期待确认',null,'BJX19'],['茶品赠饮','成人2壶／儿童3壶，仅限茶室棋牌室',null,'BJX19']
      ]:p==='zx'?[
        ['多功能会议室权益','享权益次数，次数与周期待确认',null,'ZJX23'],['小型会议室权益','享权益次数，次数与周期待确认',null,'ZJX24'],['茶室权益','享权益次数，次数与周期待确认',null,'ZJX25'],['棋牌室权益','享权益次数，次数与周期待确认',null,'ZJX26'],['女王空间权益','享权益次数，次数与周期待确认',null,'ZJX28']
      ]:[['泳池次卡','按实际使用每次核销；卡规格为演示',5,'ZJ-0'],['健身次卡','按实际使用每次核销；卡规格为演示',5,'ZJ-1'],['私教课卡','先购课、约教练；次数为演示',5,'ZJ-2'],['茶室赠送权益','赠送范围和次数待确认',null,'ZJ-4'],['年卡咖啡赠券','个人／家庭年卡赠10张；面额待确认',10,'ZJ-6']];
      giftList.forEach(function(g,i){
        var rid='CUSTOMER-RIGHT-'+p+'-'+i,aid='CUSTOMER-ASSET-'+p+'-'+i;
        push(rights,{id:rid,project:p,name:g[0],kind:/券/.test(g[0])?'赠券':/卡/.test(g[0])?'次卡':'会籍权益',merchant:A.projects[p]+'会所',benefit:g[1],redeem:'按项目、身份、服务和已绑定权益核验',validity:'真实期限待确认；页面日期为样例',deduction:g[2]===null?'额度未确认，暂不自动抵扣':'到场按已绑定数量扣减',status:'已配置',detailText:g[1],source:p==='bj'?'S7／S8':p==='zx'?'S6':'S1'});
        if(!(p==='bj'&&i<2&&(i===0?coffee:drink)))push(collections.assets,{id:aid,project:p,name:g[0],remaining:g[2]===null?0:g[2],total:g[2],type:/券/.test(g[0])?'赠券':'次卡',expiry:'2027-11-15',merchant:'shop-'+p,services:g[2]===null?[]:[g[3]],status:g[2]===null?'待确认':'可用',sourceOrder:'CUSTOMER-CARD-'+p+'-'+i,source:g[1],note:g[1]+'；持有状态、有效期为演示。'});
        // 独立已购课卡演示，不扩大会籍赠权。
        if(p!=='zj'){var courses=sv.filter(function(x){return /私教/.test(x.kind);}),course=courses[i%courses.length];push(collections.assets,{id:'CUSTOMER-PAID-ASSET-'+p+'-'+i,project:p,name:course.name+'私教课卡（已购演示）',remaining:5-i,total:5,expiry:'2027-11-15',type:'已购课卡',merchant:'shop-'+p,services:[course.id],sourceOrder:'DEMO-PAID-RECEIPT-'+p+'-'+i,status:'可用',source:'独立购买演示；售价／规格待确认',note:'余额与有效期为演示，不属于会籍附赠；凭线下已购记录演示，未伪造成交价。'});}
      });
      for(var i=0;i<6;i++){
        var memberId='CUSTOMER-MEMBER-'+p+'-'+i;
        push(members,{id:memberId,project:p,name:names[i],phone:'138****'+String(pi*100+i+1).padStart(4,'0'),avatar:names[i][0],grade:i===2?'会籍儿童':i===3?'无会籍成人':'会籍业主',identity:i===2?'mc':i===3?'na':'ma',rights:i===3?[]:giftList.map(function(_,j){return 'CUSTOMER-RIGHT-'+p+'-'+j;}),joinDate:dateAt(-30),expiry:'2027-11-15',family:i===0?[1,2,3,4].map(function(j){return 'CUSTOMER-MEMBER-'+p+'-'+j;}):[],familyType:i===2?'儿童':'成人',bindDate:dateAt(-20)});
        if(i===5)continue;
        var svc=publicServices[i%publicServices.length],when=dateAt(-i),ord=s.orders.find(function(o){return o.service===svc.id&&o.status==='待履约';})||s.orders.find(function(o){return o.project===p&&o.amount!==null;});
        push(collections.staff,{id:'CUSTOMER-STAFF-'+p+'-'+i,project:p,name:['陈教练','李教练','王技师','赵顾问','周前台'][i]+'（演示）',role:['游泳教练','健身教练','康养技师','会员顾问','服务前台'][i],hours:'09:00—18:00（演示）',status:'启用',qualification:'待提供正式资质',services:sv.filter(function(x){return /私教|SPA/.test(x.kind+x.name);}).map(function(x){return x.id;})});
        push(collections.suppliers,{id:'CUSTOMER-SUP-'+p+'-'+i,project:p,name:['运动服务供方','餐饮服务供方','康养服务供方','空间服务供方','综合服务供方'][i]+'（演示）',merchant:'DEMO'+p.toUpperCase()+i,status:'启用'});
        push(collections.categories,{id:'CUSTOMER-SPLIT-'+p+'-'+i,project:p,name:['运动课程','餐饮商品','康养护理','空间预订','综合服务'][i]+'分账（演示）',shares:[{id:'CUSTOMER-SUP-'+p+'-'+i,name:'项目服务供方（演示）',ratio:100}],status:'启用'});
        push(collections.tickets,{id:'CUSTOMER-TICKET-'+p+'-'+i,project:p,type:['预约咨询','权益咨询','退款咨询','现场异常','服务反馈'][i],text:[svc.name+'预约日期与排期确认','请确认会籍赠送额度与有效期','请协助核验退款条件及凭据','请协助核对到场凭证及实际位置','希望补充服务人员与课程说明'][i],status:['待受理','处理中','待用户确认','待平台复核','已关闭'][i],user:names[i],time:when+' 10:00',order:ord&&ord.id,assignee:'演示服务台',replies:i?[{time:when+' 11:00',text:'已记录诉求，按客户权益规则核对（演示）'}]:[]});
        push(collections.offline,{id:'CUSTOMER-OFF-'+p+'-'+i,project:p,user:names[i],product:svc.name,amount:ord&&ord.amount?ord.amount/100:'待确认',channel:'POS登记（演示）',reference:'DEMO-POS-'+p+'-'+i,note:'仅为待审核登记，不代表渠道到账',status:'待审核',time:when+' 10:00'});
        push(collections.arrivals,{id:'CUSTOMER-ARR-'+p+'-'+i,project:p,user:names[i],service:svc.id,title:svc.name,people:1,time:when+' 10:00',operator:'演示前台',order:ord&&ord.id});
        push(collections.assetRecords,{id:'CUSTOMER-LEDGER-'+p+'-'+i,project:p,asset:giftList[i][0],action:['绑定权益','查询余额','核对适用范围','确认有效期','记录使用'][i]+'（演示）',order:ord&&ord.id,time:when+' 10:00'});
        push(collections.logs,{id:'CUSTOMER-LOG-'+p+'-'+i,project:p,time:when+' 10:00',action:['核销记录（演示）','权益绑定（演示）','服务规则核对（演示）','处理工单（演示）','订单查询（演示）'][i],role:'演示运营员',detail:svc.name+' · '+(ord&&ord.id||'待关联')});
        push(articles,{id:'CUSTOMER-ARTICLE-'+p+'-'+i,project:p,projects:[p],name:[svc.name+'服务指南','会籍权益使用说明','运动课程预约说明','空间使用与陪同规则','到场核销操作指引'][i],image:image(svc),display:i===0?'首页／本周精选':'服务详情／图文指南',validity:'长期（演示）',detail:svc.note+'；示例内容，正式发布文案由项目维护。',status:'已发布',clicks:20+i*15});
        push(hardware,{id:'CUSTOMER-HW-'+p+'-'+i,project:p,name:['入口门禁','分区通行','客流监测','收银／支付','消息／会员资料对接'][i],type:'设备／集成摸底项',vendor:'待现场核实',status:'待接入',params:'演示台账；厂家、点位、接口、网络和启用方案待确认，不代表已部署'});
      }
      var tea=sourceRows.filter(function(r){return p==='bj'&&r[1]==='北京宸园'&&r[2]==='茶室'&&r[7]==='元/泡';});
      for(var i=0;i<5;i++){
        var item=tea[i],amount=item?item[5]*100:null,when=dateAt(-i),rid='CUSTOMER-RETAIL-'+p+'-'+i;
        push(s.orders,{id:rid,project:p,title:(item?item[3]:'菜单资料核价')+' · 点单样单',service:'retail',resource:rid,date:when,time:'14:00',duration:1,identity:'na',user:'林女士',people:1,amount:amount,paid:amount!==null,status:amount===null?'待报价':i===0?'待履约':'已完成',code:amount===null?'':'CYRETAIL'+pi+i,children:[{id:item?item[0]:rid,name:item?item[3]:'本项目饮品（演示待确认）',price:amount,qty:1,amount:amount}],orderScene:{project:p,scene:'tea',table:'T0'+(i+1)},refunded:0,refundParts:{},parts:amount?[{id:'CUSTOMER-SUP-'+p+'-1',name:'餐饮服务供方（演示）',ratio:100,amount:amount}]:[],splitStatus:'未分账',source:'客户茶品／缺菜单待核价',created:when+' 14:00',channel:amount===null?'待报价':'模拟在线支付'});
        push(s.orders,{id:'CUSTOMER-CARD-'+p+'-'+i,project:p,title:giftList[i][0]+' · 卡券样单',service:'card',resource:'CARD-'+p+'-'+i,date:when,time:'10:00',duration:1,identity:'ma',user:'林女士',people:1,amount:null,paid:false,status:'待报价',code:'',cardOrder:true,refunded:0,refundParts:{},parts:[],source:'卡售价未提供，仅演示卡券订单台账',created:when+' 10:00',channel:'待报价',splitStatus:'未分账'});
      }
      var payable=s.orders.find(function(o){return o.project===p&&o.amount>0&&o.paid&&!o.cardOrder;});
      for(var i=0;i<5;i++){
        var sample=payable?JSON.parse(JSON.stringify(payable)):{project:p,service:'finance-review',user:'林女士',identity:'ma',people:1,amount:null,paid:false,status:'待报价',duration:1,parts:[],refundParts:{},refunded:0,channel:'待核价'};
        sample.id='CUSTOMER-FINANCE-'+p+'-'+i;sample.code='';sample.resource=sample.id;sample.customerDemo=true;sample.financeDemo=true;sample.date=dateAt(-i-1);sample.time='10:00';sample.title=(payable?payable.title:'项目服务核价')+' · '+['退款申请','退款在途','退款完成','退款失败','已分账'][i]+'样例';sample.source='售后状态演示，退款条件仍待客户确认';sample.splitStatus=i===4?'已分账':'未分账';
        if(payable&&i<2)sample.refundPending={id:'RF-'+sample.id,amount:sample.amount,reason:'客户取消服务（演示）',status:i===0?'待审核':'处理中',time:sample.date+' 10:00'};
        if(payable&&i===2){sample.status='已退款';sample.refunded=sample.amount;sample.refundParts=Object.fromEntries(sample.parts.map(function(x){return [x.id,x.amount];}));sample.refunds=[{id:'RF-'+sample.id,amount:sample.amount,parts:sample.parts,time:sample.date+' 10:00'}];}
        if(payable&&i===3)sample.refundFailures=[{id:'RF-'+sample.id,amount:sample.amount,result:'失败',reason:'演示通道结果',time:sample.date+' 10:00'}];
        push(s.orders,sample);
      }
    });
    Object.keys(collections).forEach(function(k){replace(k,collections[k],function(x){return k==='staff'?/^\w+-staff\d+$/.test(x.id):k==='suppliers'?/^demo-/.test(x.id):k==='categories'?x.id==='split-bj':k==='tickets'?x.id==='TK-DEMO-01':false;});});
    function mergeV(k,rows,remove){V[k]=(V[k]||[]).filter(function(x){return !x.customerDemo&&!(remove&&remove(x));}).concat(rows);}
    mergeV('rights',rights,function(x){return /^RIGHT-/.test(x.id);});mergeV('members',members,function(x){return /^MEM-(DEMO|FAM)-/.test(x.id);});mergeV('articles',articles,function(x){return /^ARTICLE-/.test(x.id);});mergeV('hardware',hardware,function(x){return /^HW-/.test(x.id);});
    s.profile=s.profile||{name:'林女士',nickname:'林女士',phone:'138****0001',avatar:'林'};
    s.projectAccess=s.projectAccess||{bj:true,zx:true,zj:true};s.addresses=s.addresses||[];s.grantKeys=s.grantKeys||[];
    V.seededOrders=true;V.proxy=V.proxy||{};V.grant=V.grant||{};s.customerDemoVersion=VERSION;
    return s;
  }
  A.customerDemo={migrate:migrate,quote:quote,version:VERSION,sourceProduct:sourceProduct};
  migrate(A.S);var originalSeed=C.seed;C.seed=function(){return migrate(originalSeed());};A.save();
})();
