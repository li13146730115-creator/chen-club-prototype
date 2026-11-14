const test=require('node:test');
const assert=require('node:assert/strict');
let C={};try{C=require('../core.js')}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e}
test('业务核心提供预约、核销和金额计算接口',()=>{
 for(const name of ['seed','book','pay','verify','split','refund','validateShares'])assert.equal(typeof C[name],'function',name+' 尚未实现');
});
test('核销只扣一次，跨项目和重复凭证被阻断',()=>{
 const s=C.seed();const o=s.orders.find(o=>o.id==='DEMO-ZJ-01');
 assert.throws(()=>C.verify(s,o.code,'bj'),/项目/);
 C.verify(s,o.code,'zj');assert.equal(s.assets.find(a=>a.id==='visit-zj').remaining,7);
 assert.throws(()=>C.verify(s,o.code,'zj'),/已核销/);
 assert.equal(s.assets.find(a=>a.id==='visit-zj').remaining,7);
});
test('同项目同资源同一时段冲突，跨项目允许',()=>{
 const s=C.seed();const req={project:'bj',service:'tea',resource:'tea-1',date:'2026-11-15',time:'14:00',duration:120,amount:15800,title:'茶室',identity:'na'};
 C.book(s,req);assert.throws(()=>C.book(s,req),/占用/);
 assert.doesNotThrow(()=>C.book(s,{...req,project:'zj'}));
});
test('分账校验与整数分分配守恒',()=>{
 assert.throws(()=>C.validateShares([{id:'a',ratio:70},{id:'b',ratio:29}]),/100/);
 assert.throws(()=>C.validateShares([{id:'a',ratio:50},{id:'a',ratio:50}]),/重复/);
 const x=C.split(10001,[{id:'a',ratio:70},{id:'b',ratio:30}]);
 assert.equal(x.reduce((a,b)=>a+b.amount,0),10001);
 assert.deepEqual(x.map(r=>r.amount),[7001,3000]);
});
test('部分退款读原分账快照，累计退尽且禁止超退',()=>{
 const s=C.seed();let o=C.book(s,{project:'bj',title:'演示商品',service:'demo',resource:'r1',date:'2026-11-16',time:'16:00',duration:60,amount:10000,shares:[{id:'a',ratio:70},{id:'b',ratio:30}]});
 C.pay(s,o.id);let r=C.refund(s,o.id,3000);assert.deepEqual(r.parts.map(x=>x.amount),[2100,900]);
 C.refund(s,o.id,7000);assert.equal(o.refunded,10000);assert.equal(o.status,'已退款');
 assert.throws(()=>C.refund(s,o.id,1),/额度/);
});
test('支付与取消状态校验，取消释放资源',()=>{
 const s=C.seed();const req={project:'bj',title:'演示茶室',service:'tea',resource:'tea-2',date:'2026-11-16',time:'10:00',duration:120,amount:15800};
 let o=C.book(s,req);C.cancel(s,o.id);assert.doesNotThrow(()=>C.book(s,req));
 assert.throws(()=>C.pay(s,o.id),/状态/);
});
