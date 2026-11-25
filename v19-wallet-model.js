/* V0.14：按会所与会员记账的储值钱包，沿用原商品库存、履约及退款。 */
(()=>{'use strict';
const A=Club;if(A.v19Wallet)return;const M=A.v07,{B,shop}=M,S=A.S,N=A.v09;
S.v19StoredValue??={version:1,configs:{},accounts:[],ledger:[],seeded:false};
const state=()=>S.v19StoredValue;
const categoryOf=p=>String(p?.menuCategory||p?.category||'');
function member(id,project=shop()){const m=M.members(project).find(m=>m.id===id);if(!m)throw Error('会员不属于当前会所');return m;}
function config(project=shop()){return state().configs[project]??=( {enabled:true,categories:['SPA']} );}
function account(memberId,project=shop()){member(memberId,project);let x=state().accounts.find(x=>x.project===project&&x.memberId===memberId);if(!x){x={project,memberId,balance:0};state().accounts.push(x);}return x;}
function accounts(project=shop()){return M.members(project).map(m=>account(m.id,project));}
function records(memberId,project=shop()){return state().ledger.filter(r=>r.project===project&&(!memberId||r.memberId===memberId)).slice().reverse();}
function entry(a,type,amount,extra={}){a.balance+=amount;const row={id:A.C.uid('WALLET'),project:a.project,memberId:a.memberId,type,amount,balance:a.balance,time:A.C.now(),operator:A.route.startsWith('U')?'会员本人':A.route.startsWith('A')?'运营后台':A.route.startsWith('M')?'商家后台':'商家前台',...extra};state().ledger.push(row);return row;}
function topUp({memberId,amount,receipt,remark='',method}){const a=account(memberId);receipt=String(receipt||'').trim();if(!Number.isSafeInteger(amount)||amount<=0||amount>100000000||!Number.isSafeInteger(a.balance+amount))throw Error('储值金额须为有效的正数金额');if(!receipt||receipt.length>80)throw Error('请填写80字以内的线下收款凭据号');if(!['现金','微信收款','银行卡','其他'].includes(method))throw Error('请选择实际收款方式');if(state().ledger.some(r=>r.project===shop()&&r.type==='线下储值'&&r.receipt?.toUpperCase()===receipt.toUpperCase()))throw Error('该收款凭据已登记，请勿重复储值');const r=entry(a,'线下储值',amount,{receipt,remark:String(remark).trim(),method});A.C.log(S,'线下储值登记',memberId+' · '+receipt);A.save();return r;}
function configure({enabled,categories}){const available=new Set(M.products().map(categoryOf)),list=[...new Set(categories||[])];if(typeof enabled!=='boolean')throw Error('请选择钱包启用状态');if(enabled&&!list.length)throw Error('请至少选择一个适用商品分类');if(list.some(c=>!available.has(c)))throw Error('请选择当前会所已上架的商品分类');Object.assign(config(),{enabled,categories:list});A.save();return config();}
function eligible(g){if(!g||g.project!==shop()||g.kind!=='retail'||!Number.isSafeInteger(g.total)||g.total<=0||!M.members().some(m=>m.id===g.memberId)||!g.lines?.length)return false;const c=config();return !!c.enabled&&g.lines.every(l=>{const p=M.products().find(p=>p.id===l.item);return p&&c.categories.includes(categoryOf(p));});}
function canPay(g){return eligible(g)&&g.status==='待支付'&&account(g.memberId).balance>=g.total;}
// 批量保存：避免原有支付/退款的中间状态先广播到其它标签页。
function transact(fn){const save=A.save;A.save=()=>{};let result;try{result=fn();}finally{A.save=save;}save();return result;}
const basePay=M.pay;
function walletPay(id){const g=B.groups.find(g=>g.id===id&&g.project===shop());if(!g||g.status!=='待支付'||g.orderIds.some(id=>S.orders.find(o=>o.id===id)?.status!=='待支付'))throw Error('订单状态已变更，可能已取消或已支付');if(!eligible(g))throw Error('本单不适用储值支付，请选择其它支付方式');const a=account(g.memberId);if(a.balance<g.total)throw Error('钱包余额不足，请选择微信或线下支付');return transact(()=>{const result=basePay(id,'offline');entry(a,'储值消费',-g.total,{groupId:g.id,orderId:g.orderIds[0],remark:g.lines.map(l=>l.name).join('、')});g.channel='储值钱包';g.paymentMethod='wallet';g.walletPaid=g.total;for(const oid of g.orderIds){const o=S.orders.find(o=>o.id===oid);o.channel='储值钱包';o.walletPaid=o.amount;}return result;});}
M.pay=(id,channel)=>channel==='wallet'?walletPay(id):basePay(id,channel);
function returnRefund(o){if(!o?.walletPaid)return;const delta=(o.refunded||0)-(o.walletRefunded||0);if(delta<=0)return;const a=originalAccount(o);entry(a,'退款退回',delta,{groupId:o.paymentGroup,orderId:o.id,remark:'订单退款原路退回储值钱包'});o.walletRefunded=o.refunded;}
const baseRefund=A.C.refund,baseResolve=A.C.resolveRefund;
function originalAccount(o){const a=state().accounts.find(a=>a.project===o.project&&a.memberId===o.memberId);if(!a||!Number.isSafeInteger(a.balance)||!Number.isSafeInteger(a.balance+o.amount))throw Error('原储值账户异常，退款尚未处理，请联系会所核查账户');return a;}
function checkRefundProject(s,id){const o=s.orders.find(o=>o.id===id);if(o?.walletPaid){if(o.project!==shop())throw Error('请在订单所属会所处理钱包退款');originalAccount(o);}}
A.C.refund=(s,id,amount)=>transact(()=>{checkRefundProject(s,id);const r=baseRefund(s,id,amount);returnRefund(s.orders.find(o=>o.id===id));return r;});
A.C.resolveRefund=(s,id,result)=>transact(()=>{checkRefundProject(s,id);const r=baseResolve(s,id,result);returnRefund(s.orders.find(o=>o.id===id));return r;});
function seed(){if(state().seeded)return;const source=[['massage60','隐逸招牌按摩 · 60分钟',498],['massage90','隐逸招牌按摩 · 90分钟',658],['brain45','脑动力（源动力） · 45分钟',498],['body30','局部加强身体按摩 · 30分钟',248],['shoulder30','隐逸肩颈关节护理 · 30分钟',720],['arm45','隐逸上肢关节护理 · 45分钟',1180],['leg60','隐逸腿部关节护理 · 60分钟',1980],['therapy60','康体霜腿部健康防御 · 60分钟',1980]];const products=S.v02.v03.merchantProducts.bj;for(const [key,name,price]of source){const id='V19-SPA-'+key;if(!products.some(p=>p.id===id))products.push({id,project:'bj',v07Catalog:true,name,menuCategory:'SPA',category:'SPA',price:String(price),stock:99,status:'已上架',image:'assets/home-spa.jpg',detail:'北京宸园客户权益价目表所列护理项目。疗程需提前预约，请向会所确认时间。',unit:'次',fulfilment:'store',tags:['SPA','护理'],v19Source:'北京宸园权益及价目表：SPA空间'});}
for(const project of Object.keys(A.projects)){config(project);accounts(project);}const m=M.members('bj')[0];if(m){const a=account(m.id,'bj');[100000,50000,80000,30000,40000].forEach((amount,i)=>entry(a,'线下储值',amount,{id:'WALLET-DEMO-'+i,receipt:'DEMO-SPA-00'+(i+1),method:'微信收款',operator:'商家前台',remark:'储值演示记录'}));}state().seeded=true;A.save();}
// 历史账本不随会员归属迁移；有储值业务的身份在新会所应独立建档。
for(const key of ['v08-member-save','v03-member-save','xmind-member-save']){const save=A.forms[key];if(!save)continue;A.forms[key]=f=>{const ids=[f.id,...Object.keys(f).filter(k=>/^familyId-/.test(k)).map(k=>f[k])].filter(Boolean);for(const id of ids){const m=S.v02.members.find(m=>m.id===id);if(m&&f.project&&m.project!==f.project&&state().ledger.some(r=>r.memberId===id&&r.project===m.project))throw Error('该会员已有储值流水，原钱包须保留在原会所；请在目标会所独立建立会员档案');}return save(f);};}
const editor=A.views.A21;A.register({A21:()=>{let h=editor();const id=A.params.get('id');if(state().ledger.some(r=>r.memberId===id))h=h.replace('<h3>基本信息</h3>','<h3>基本信息</h3><p class="muted small">该会员已有储值记录，钱包及历史订单保留在原会所；跨会所使用请独立建档。</p>');return h;}});
A.v19Wallet={config,account,accounts,records,topUp,configure,eligible,canPay,pay:walletPay,categoryOf};seed();
})();
