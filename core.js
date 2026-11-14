(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ClubCore=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>new Date().toLocaleString('zh-CN',{hour12:false});
const uid=prefix=>prefix+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,5).toUpperCase();
function log(s,action,detail,role='演示操作员'){s.logs.unshift({id:uid('LOG'),time:now(),action,detail,role,project:s.project});}
function seed(){return {version:1,project:'bj',identity:'ma',guest:false,seq:101,
 orders:[
 {id:'DEMO-BJ-01',project:'bj',title:'茶室 · 2小时',service:'BJX19',resource:'BJX19-1',date:'2026-11-12',time:'14:00',duration:120,amount:15800,identity:'na',user:'林女士',people:2,status:'待履约',paid:true,code:'CY20261101',refunded:0,refundParts:{},parts:[{id:'tea-supplier',name:'茶室供方（演示）',ratio:100,amount:15800}],source:'演示业务记录',created:'2026/11/11 10:28',channel:'模拟在线支付'},
 {id:'DEMO-ZJ-01',project:'zj',title:'恒温泳池 · 次卡到场',service:'zj-swim',resource:'swim',date:'2026-11-12',time:'09:00',duration:60,amount:0,identity:'ma',user:'林女士',people:1,status:'待履约',paid:true,code:'CY20261102',asset:'visit-zj',refunded:0,refundParts:{},parts:[],source:'演示业务记录',created:'2026/11/11 10:31',channel:'次卡核销'}],
 assets:[{id:'visit-zj',project:'zj',name:'成人次卡 · 泳池',remaining:8,total:10,expiry:'2027-05-31',type:'次卡',source:'演示已购订单',note:'10次及期限为演示资产；真实售卖规格待补'},
 {id:'annual-bj',project:'bj',name:'会籍身份卡',remaining:null,total:null,expiry:'2027-11-10',type:'会籍',source:'演示线下开卡',note:'期限及持有状态为演示；实际卡价与期限待补'},
 {id:'coffee-bj',project:'bj',name:'咖啡抵扣券',remaining:10,total:10,expiry:'2027-11-10',type:'赠券',source:'北京客户表S7：10张',note:'券面额、SKU、发放周期与有效期待核；日期仅演示'},
 {id:'drink-bj',project:'bj',name:'特调饮品兑换券',remaining:2,total:2,expiry:'2027-11-10',type:'赠券',source:'北京客户表S7：2张',note:'共享及发放周期待核；不重复累计儿童列'}],
 tickets:[{id:'TK-DEMO-01',project:'bj',type:'咨询',text:'请协助确认茶室赠时是否与棋牌室共享。',status:'待受理',user:'林女士',time:'2026/11/11 10:30',replies:[]}],
 suppliers:[{id:'demo-a',project:'bj',name:'服务供方A（演示）',merchant:'DEMO0001',status:'启用'},{id:'demo-b',project:'bj',name:'服务供方B（演示）',merchant:'DEMO0002',status:'启用'},{id:'demo-zj',project:'zj',name:'运动供方（演示）',merchant:'DEMO0003',status:'启用'},{id:'demo-zj2',project:'zj',name:'餐饮供方（演示）',merchant:'DEMO0004',status:'启用'},{id:'demo-zx',project:'zx',name:'康养供方（演示）',merchant:'DEMO0005',status:'启用'},{id:'demo-zx2',project:'zx',name:'空间供方（演示）',merchant:'DEMO0006',status:'启用'}],
 categories:[{id:'split-bj',project:'bj',name:'综合服务分账（演示）',shares:[{id:'demo-a',name:'服务供方A（演示）',ratio:70},{id:'demo-b',name:'服务供方B（演示）',ratio:30}],status:'启用'}],
 logs:[],assetRecords:[],content:{bj:{title:'在宸园，留一段好时光',sub:'从运动到茶叙，发现日常的更多可能',order:['权益','预约','订单','客服']},zx:{title:'一处会所，多一种生活',sub:'运动、会客与康养，与日常相遇',order:['权益','预约','订单','客服']},zj:{title:'让健康成为日常',sub:'游泳与器械健身，到场核验即可使用',order:['权益','预约','订单','客服']}},configs:{},offline:[],reviews:[],cart:[],favorites:[],hiddenServices:[],bindings:{},arrivals:[]};}
function validateShares(shares){
 if(!Array.isArray(shares)||!shares.length)throw Error('请至少选择一个供方');
 if(new Set(shares.map(x=>x.id)).size!==shares.length)throw Error('供方不能重复');
 if(shares.some(x=>!x.id||!Number.isFinite(Number(x.ratio))||Number(x.ratio)<=0||Number(x.ratio)>100))throw Error('各供方比例必须大于0且不超过100%');
 if(shares.some(x=>Math.abs(Number(x.ratio)*100-Math.round(Number(x.ratio)*100))>0.00001))throw Error('比例最多保留两位小数');
 if(shares.reduce((n,x)=>n+Math.round(Number(x.ratio)*100),0)!==10000)throw Error('供方分账比例合计必须为100%');
 return true;
}
function split(amount,shares){
 if(!Number.isSafeInteger(amount)||amount<0)throw Error('金额必须为非负整数分');validateShares(shares);
 let parts=shares.map((x,index)=>{const raw=amount*Math.round(Number(x.ratio)*100)/10000;return {...x,amount:Math.floor(raw),remainder:raw-Math.floor(raw),index};});
 let left=amount-parts.reduce((n,x)=>n+x.amount,0);const rank=[...parts].sort((a,b)=>b.remainder-a.remainder||a.index-b.index);for(let i=0;i<left;i++)rank[i%rank.length].amount++;
 return parts.map(({remainder,index,...x})=>x);
}
const minutes=t=>Number(t.split(':')[0])*60+Number(t.split(':')[1]);
function occupied(s,req,exclude){return s.orders.find(o=>o.id!==exclude&&o.project===req.project&&(o.resource===req.resource||(req.personnel&&o.personnel===req.personnel))&&o.date===req.date&&!['已取消','已退款','已完成'].includes(o.status)&&minutes(req.time)<minutes(o.time)+o.duration&&minutes(o.time)<minutes(req.time)+req.duration);}
function book(s,req){
 if(!req.project||!req.service||!req.resource||!req.date||!/^\d{2}:\d{2}$/.test(req.time)||!req.title)throw Error('请完整选择服务、日期、资源与时段');
 if(!Number.isSafeInteger(req.amount)||req.amount<0)throw Error('价格未确认，暂不能直接下单');
 if(!Number.isFinite(req.duration)||req.duration<=0)throw Error('服务时长尚未配置');
 if(occupied(s,req))throw Error('该资源时段已被占用，请换一个时段');
 const shares=req.shares||[{id:'demo-provider',name:'服务供方（演示）',ratio:100}];
 const feeBasisPoints=Number(req.feeBasisPoints??s.configs['fee-'+req.project]?.basisPoints??0);if(!Number.isInteger(feeBasisPoints)||feeBasisPoints<0||feeBasisPoints>10000)throw Error('平台手续费率无效');const platformFee=Math.round(req.amount*feeBasisPoints/10000);
 const o={...clone(req),id:uid('CY'),code:'CY'+(++s.seq)+Date.now().toString().slice(-5),user:req.user||'林女士',people:req.people||1,status:req.amount===0?'待履约':'待支付',paid:req.amount===0,refunded:0,refundParts:{},parts:req.amount?split(req.amount,shares):[],created:now(),channel:req.asset?'权益资产':'模拟在线支付',source:'演示业务记录'};
 o.feeBasisPoints=feeBasisPoints;o.platformFee=platformFee;o.parts=req.amount?split(req.amount-platformFee,shares):[];if(platformFee)o.parts.push({id:'platform-fee',name:'平台手续费',ratio:feeBasisPoints/100,amount:platformFee});o.splitStatus='未分账';o.merchant='shop-'+req.project;
 s.orders.unshift(o);log(s,'创建订单',o.id+' · '+o.title);return o;
}
function find(s,id){const o=s.orders.find(x=>x.id===id);if(!o)throw Error('订单不存在');return o;}
function pay(s,id){const o=find(s,id);if(o.status!=='待支付')throw Error('当前订单状态不可支付');o.paid=true;o.status='待履约';o.paidAt=now();log(s,'模拟支付确认',o.id+' · '+o.amount+'分');return o;}
function verify(s,code,project,merchant){
 const o=s.orders.find(x=>x.code===String(code).trim());if(!o)throw Error('未找到该凭证，请检查编号');
 if(o.project!==project)throw Error('凭证所属项目不匹配');if(o.status==='已完成')throw Error('凭证已核销，请勿重复操作');
 if(o.status!=='待履约'||!o.paid)throw Error('订单尚未支付或凭证已失效');
 if(o.asset){const a=s.assets.find(x=>x.id===o.asset);if(!a||a.project!==project||a.remaining<1)throw Error('对应权益不足或不适用于本项目');if(a.merchant&&a.merchant!==merchant)throw Error('权益绑定商家不匹配');if(a.status==='冻结'||a.status==='停用')throw Error('权益已冻结或停用');if(a.expiry&&a.expiry<new Date().toISOString().slice(0,10))throw Error('权益已过期');if(a.services?.length&&!a.services.includes(o.service))throw Error('权益不适用于本服务');a.remaining--;s.assetRecords.unshift({time:now(),asset:a.name,action:'到场核销 -1次',order:o.id,project,merchant});}
 o.status='已完成';o.verifiedAt=now();log(s,'现场核销',o.id+' · '+(o.asset?'扣1次':'不扣次'));return o;
}
function cancel(s,id){const o=find(s,id);if(o.status!=='待支付'&&!(o.status==='待履约'&&o.amount===0))throw Error('已付费订单请提交退款申请，取消规则需项目确认');o.status='已取消';log(s,'取消预约',o.id);return o;}
function reschedule(s,id,date,time){const o=find(s,id);if(!['待履约','待支付'].includes(o.status))throw Error('当前订单状态不可改期');const req={...o,date,time};if(occupied(s,req,id))throw Error('新时段资源已占用');o.date=date;o.time=time;log(s,'演示改期',id+' → '+date+' '+time);return o;}
function refund(s,id,amount){
 const o=find(s,id);if(o.splitStatus==='已分账')throw Error('已分账订单不可在线退款，请联系线下处理');if(o.refundPending?.status==='处理中')throw Error('已有退款在途，请等待结果');if(!o.paid||!Number.isSafeInteger(amount)||amount<=0||amount>o.amount-o.refunded)throw Error('退款金额超过剩余可退额度或订单未支付');
 const remaining=o.amount-o.refunded;const parts=o.parts.map((p,index)=>{const balance=p.amount-(o.refundParts[p.id]||0),raw=amount*balance/remaining;return {...p,amount:Math.floor(raw),remainder:raw-Math.floor(raw),index};});let tail=amount-parts.reduce((n,p)=>n+p.amount,0);const rank=[...parts].sort((a,b)=>b.remainder-a.remainder||a.index-b.index);for(let i=0;i<tail;i++)rank[i].amount++;parts.forEach(p=>{delete p.remainder;delete p.index;o.refundParts[p.id]=(o.refundParts[p.id]||0)+p.amount});
 o.refunded+=amount;o.status=o.refunded===o.amount?'已退款':'部分退款';o.refundPending=false;
 const record={id:uid('RF'),amount,parts,time:now()};(o.refunds||(o.refunds=[])).push(record);log(s,'模拟原路退款',id+' · '+amount+'分');return record;
}
function requestRefund(s,id,amount,reason,lineId=''){
 const o=find(s,id);if(o.splitStatus==='已分账')throw Error('已分账订单不可在线退款，请联系线下处理');if(o.refundPending)throw Error('已有申请或退款在途，请等待处理中结果');if(!o.paid||!Number.isSafeInteger(amount)||amount<=0||amount>o.amount-o.refunded)throw Error('退款金额超过剩余可退额度');
 if(lineId){const line=o.children?.find(l=>l.id===lineId);if(!line||amount>line.amount-(line.refunded||0))throw Error('退款金额超过该商品剩余可退金额');}
 o.refundPending={id:uid('RF'),amount,reason,lineId,status:'待审核',time:now()};log(s,'提交退款申请',id+' · '+reason);return o.refundPending;
}
function resolveRefund(s,id,result){const o=find(s,id),p=o.refundPending;if(!p)throw Error('没有待处理的退款');if(result==='处理中'){p.status='处理中';log(s,'退款处理中',id+' · 占用额度'+p.amount);return p;}if(result==='失败'){(o.refundFailures||(o.refundFailures=[])).push({...p,result,time:now()});o.refundPending=false;log(s,'退款明确失败，释放额度',id);return p;}if(result!=='成功')throw Error('请选择明确结果');o.refundPending=false;try{const r=refund(s,id,p.amount);r.reason=p.reason;r.lineId=p.lineId;if(p.lineId){const l=o.children.find(l=>l.id===p.lineId);l.refunded=(l.refunded||0)+p.amount;}return r;}catch(e){o.refundPending=p;throw e;}}
function grant(s,req){if(!req.merchant)throw Error('必须绑定适用商家');if(!Number.isInteger(Number(req.quantity))||Number(req.quantity)<1)throw Error('发放数量必须为正整数');if(s.assets.some(a=>a.sourceOrder===req.order&&a.project===req.project&&a.name===req.name))throw Error('同一订单与卡种不可重复发放');const a={id:uid('ASSET'),project:req.project,name:req.name,remaining:Number(req.quantity),total:Number(req.quantity),expiry:req.expiry,type:req.type||'人工绑定次卡',merchant:req.merchant,services:req.services||[],status:'可用',sourceOrder:req.order,source:'凭据 '+req.order,note:req.reason};s.assets.push(a);s.assetRecords.unshift({project:req.project,asset:a.name,action:'人工发放 +'+a.total+'次',order:req.order,time:now()});log(s,'绑定商家并发放权益',a.id+' · '+req.reason);return a;}
return {seed,book,pay,verify,cancel,reschedule,split,refund,requestRefund,resolveRefund,grant,validateShares,occupied,log,uid,now,clone};
});
