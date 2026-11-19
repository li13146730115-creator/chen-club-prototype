const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),load=require('./helpers/load.cjs');
const setup=()=>load(fs.existsSync(path.join(__dirname,'../v11-proxy.js'))?['v11-proxy.js']:[]);
test('V0.9：代客入口仅在订单管理，员工分类同时包含服务及商品',()=>{
 const {A,go}=setup();
 assert.equal(A.navigationGroups.some(g=>g.title==='项目服务'&&g.ids.includes('A25')),false);
 assert.ok(A.navigationGroups.find(g=>g.title==='订单管理').ids.includes('A25'));
 for(const r of ['S03','A27','M17']){const h=go(r);assert.match(h,/data-v11-mixed-catalog/);assert.match(h,/恒温泳池/);assert.match(h,/美式咖啡/);assert.doesNotMatch(h,/class="v20-proxy-mode"/);}
});
test('V0.9：单预约不可与商品混选，多类别商品可加入同一清单',()=>{
 const {A,go}=setup(),M=A.v07;go('S03');
 A.actions['v10-proxy-add']({id:'V07-bj-coffee',sku:'default',delta:1});
 A.actions['v10-proxy-add']({id:'V07-bj-cola',sku:'default',delta:2});
 assert.equal(M.B.proxy.lines.length,2);
 A.actions['v07-proxy-service']({id:'BJX01'});assert.equal(M.B.proxy.lines.length,0);assert.equal(M.B.proxy.selected.length,1);
 A.actions['v07-proxy-service']({id:'BJX03'});assert.equal(M.B.proxy.selected.length,1);assert.equal(M.B.proxy.selected[0],'BJX03');
});
test('V0.9：选中会员后搜索列表收起，确认页可修改商品数量',()=>{
 const {A,go}=setup(),M=A.v07;go('S03');A.actions['v10-proxy-add']({id:'V07-bj-coffee',sku:'default',delta:3});A.actions['v07-proxy-confirm']({mode:'retail'});
 A.actions['v07-member-select']({id:M.members()[0].id});
 assert.doesNotMatch(go('S03?step=3'),/class="v20-member-pick"/);
 assert.match(go('S03?step=4'),/data-action="v11-checkout-qty"/);
 A.actions['v11-checkout-qty']({item:'V07-bj-coffee',sku:'default',delta:-1});assert.equal(M.B.checkout.lines[0].qty,2);
});
test('V0.9：卡券使用数量影响报价、支付和退款，不能超过余额',()=>{
 const {A}=setup(),M=A.v07,m=M.members()[0],c=M.coupons(m.id).find(c=>c.item==='V07-bj-coffee');
 const d={kind:'retail',memberId:m.id,lines:[{item:c.item,qty:3}],coupons:[c.id],couponQuantities:{[c.id]:1}};
 const q=M.quote(d);assert.equal(q.used[0].quantity,1);assert.equal(q.total,q.gross*2/3);
 const before=c.remaining,g=M.submit(d);M.pay(g.id,'online');assert.equal(M.coupons(m.id).find(x=>x.id===c.id).remaining,before-1);
 A.C.requestRefund(A.S,g.orderIds[0],g.total,'取消计划');A.C.resolveRefund(A.S,g.orderIds[0],'成功');assert.equal(M.coupons(m.id).find(x=>x.id===c.id).remaining,before);
 assert.throws(()=>M.quote({...d,couponQuantities:{[c.id]:before+1}}),/数量|余额/);
});
test('V0.9：同券多张可调数量并可同时选不同兑换卡',()=>{
 const {A,go}=setup(),M=A.v07,m=M.members()[0],c=M.coupons(m.id).find(c=>c.item==='V07-bj-coffee');
 M.B.checkout={kind:'retail',memberId:m.id,operator:true,lines:[{item:c.item,qty:5}],coupons:[c.id],couponQuantities:{[c.id]:2}};
 go('M17?step=4');A.actions['v08-coupon-open']({context:'checkout'});const h=go('M18');assert.match(h,/data-action="v11-coupon-qty"/);assert.match(h,/最大/);
 A.actions['v11-coupon-qty']({id:c.id,delta:1});A.actions['v08-coupon-done']();assert.equal(M.B.checkout.couponQuantities[c.id],3);
 assert.ok(M.coupons(m.id).length>=5);
});
test('V0.9：返回核对清单再下一步保留指定的卡券使用张数',()=>{
 const {A,go}=setup(),M=A.v07,m=M.members()[0];go('M17');A.actions['v10-proxy-add']({id:'V07-bj-coffee',sku:'default',delta:3});A.actions['v07-proxy-confirm']({mode:'retail'});A.actions['v07-member-select']({id:m.id});const c=M.coupons(m.id).find(c=>c.item==='V07-bj-coffee');Object.assign(M.B.checkout,{coupons:[c.id],couponQuantities:{[c.id]:1}});const before=M.quote(M.B.checkout).total;go('M17?step=2');A.actions['v07-proxy-confirm']({mode:'retail'});assert.equal(M.B.checkout.couponQuantities[c.id],1);assert.equal(M.quote(M.B.checkout).total,before);
});
test('V0.9：选券页面针对同一商品至少展示五条可选演示卡，旧版本数据自动补齐',()=>{
 const {A,go}=setup(),M=A.v07;M.B.v11ProxyDemo=1;go('M17');for(const m of M.members()){const cs=M.coupons(m.id,[{item:'V07-bj-coffee',qty:10}]);assert.ok(cs.length>=5,m.name+'的同商品可用卡不足5条');}const count=A.S.assets.length;go('M17');assert.equal(A.S.assets.length,count);
});
test('V0.9：默认抵扣用量在选券页如实展示，打开再确认不会改变报价',()=>{
 const {A,go}=setup(),M=A.v07,m=M.members()[0],c=M.coupons(m.id).find(c=>c.item==='V07-bj-coffee');M.B.checkout={kind:'retail',memberId:m.id,operator:true,lines:[{item:c.item,qty:3}],coupons:[c.id]};go('M17?step=4');const before=M.quote(M.B.checkout).total;A.actions['v08-coupon-open']({context:'checkout'});go('M18');assert.equal(M.B.couponPicker.quantities[c.id],3);A.actions['v08-coupon-done']();assert.equal(M.quote(M.B.checkout).total,before);
});
