const test=require('node:test'),assert=require('node:assert/strict'),load=require('./helpers/load.cjs');
const select=A=>A.actions['project-select']({id:'zj'});
const phone='13812340099',login=A=>A.forms['v16-member-login']({phone,code:'123456'});
function startBuy(A,p,qty=2){A.actions['v19-spec-open']({id:p.id,mode:'buy'});for(let i=1;i<qty;i++)A.actions['v19-spec-qty']({delta:1});A.actions['v19-spec-confirm']();}

test('中建首次切入为游客，展示无会籍卡及商城入口，无虚假日期和会员码',()=>{
 const{A,go}=load();select(A);assert.equal(A.S.guest,true);
 const card=A.v05.membershipInfo();assert.equal(card.title,'暂无会籍');assert.equal(card.expiry,'');
 const h=go('U01'),part=h.match(/<section[^>]*component-membership[^]*?<\/section>/)?.[0];
 assert.match(part,/v24-no-membership/);assert.match(part,/暂无会籍/);assert.doesNotMatch(part,/datetime=|会员码|单次体验卡/);
 assert.match(h,/href="#\/U42"/);assert.match(h,/会所商城/);
 for(const style of [0,1])assert.match(A.decor.component({id:'member-test',type:'membership',visible:true,style,v11Style:true},true,true),/v24-no-membership/);
});

test('顶部会所切换器与手机项目清单共用游客及会籍状态切换',()=>{
 const{A,go,nodes}=load();go('U01');
 nodes.project.onchange({target:{value:'zj'}});
 assert.equal(A.S.project,'zj');assert.equal(A.S.guest,true);assert.equal(A.v05.membershipInfo().title,'暂无会籍');
 assert.match(go('U01'),/v24-no-membership/);
 nodes.project.onchange({target:{value:'bj'}});
 assert.equal(A.S.project,'bj');assert.equal(A.S.guest,false);assert.match(A.v05.membership(),/会员码/);
});

test('北京和紫京原会籍卡、权益入口及会员码保持不变',()=>{
 const{A}=load();for(const id of ['bj','zx']){A.actions['project-select']({id});assert.equal(A.S.guest,false);const h=A.v05.membership();assert.match(h,/会员码/);assert.match(h,/datetime=/);assert.doesNotMatch(h,/v24-no-membership/);}
});

test('中建商城展示至少五条本店真实商品，游客选规格后必须登录且不生成订单',()=>{
 const{A,go,scope}=load();select(A);const p=A.v07.products()[0],before=A.S.orders.length,h=go('U42');
 assert.match(h,/会所商城/);assert.ok((h.match(/class="v24-shop-product"/g)||[]).length>=5);
 for(const p of A.v07.products().filter(p=>!p.passService))assert.ok(h.includes(A.E(p.name)));
 startBuy(A,p,3);assert.equal(scope.location.hash,'#/U39');assert.equal(A.S.orders.length,before);assert.equal(A.v07.B.checkout,null);
 const loginHTML=go('U39');assert.match(loginHTML,/登录后继续购买/);assert.match(loginHTML,new RegExp(p.name));assert.match(loginHTML,/×3/);assert.match(loginHTML,/暂不登录/);
});

test('登录后保持无会籍，原规格数量恢复到结算且按正常售价下单',()=>{
 const{A,go,scope}=load();select(A);const raw=A.v09.raw(A.v07.products()[0].id);raw.skus=[{id:'single',label:'单罐',price:'16',stock:99},{id:'double',label:'双罐装',price:'32',stock:99}];
 const p=A.v07.products()[0];A.actions['v19-spec-open']({id:p.id,mode:'buy'});A.actions['v19-spec-select']({sku:'double'});A.actions['v19-spec-qty']({delta:1});A.actions['v19-spec-confirm']();go('U39');
 assert.throws(()=>A.forms['v16-member-login']({phone,code:'000000'}),/验证码/);assert.equal(A.S.guest,true);
 login(A);assert.equal(A.S.guest,false);assert.equal(A.S.identity,'na');assert.equal(scope.location.hash,'#/U22');
 const m=A.v08.me();assert.equal(m.phone,phone);assert.equal(m.identity,'na');assert.equal(m.planIds.length,0);assert.equal(A.v10.activePlans(m).length,0);assert.equal(A.v10.wallet().length,0);
 assert.equal(A.v07.B.checkout.lines[0].skuId,'double');assert.equal(A.v07.B.checkout.lines[0].qty,2);assert.equal(A.v07.quote(A.v07.B.checkout).total,6400);
 const h=go('U22');assert.match(h,/双罐装/);assert.match(h,/×2/);A.forms['v09-owner-submit']({remark:'无会籍顾客购买'});
 const g=A.v07.B.groups[0];assert.equal(g.memberId,m.id);assert.equal(g.total,6400);assert.equal(g.status,'待支付');assert.match(scope.location.hash,/#\/U23/);
 go('U23');A.v07.pay(g.id,'online');assert.equal(g.status,'已支付');assert.equal(A.S.orders.find(o=>o.id===g.orderIds[0]).identity,'na');
 assert.match(A.v05.membership(),/暂无会籍/);assert.doesNotMatch(A.v05.membership(),/会员码|datetime=/);
});

test('游客购物车登录后直接继续所选商品结算，不加购两次',()=>{
 const{A,go,scope}=load();select(A);const p=A.v07.products()[1];A.v07.cartChange(p.id,2);A.actions['v09-cart-checkout']();assert.equal(scope.location.hash,'#/U39');go('U39');login(A);
 assert.equal(scope.location.hash,'#/U22');assert.equal(A.v07.B.checkout.fromCart,true);assert.equal(A.v07.B.checkout.lines.find(l=>l.item===p.id).qty,2);assert.equal(A.v07.cart().find(l=>l.item===p.id).qty,2);
});

test('取消登录返回原商品，跨项目切换不恢复其它会所购买草稿',()=>{
 const{A,scope}=load();select(A);const p=A.v07.products()[0];startBuy(A,p);assert.equal(typeof A.actions['v24-login-cancel'],'function');A.actions['v24-login-cancel']();assert.equal(scope.location.hash,'#/U33?id='+p.id);assert.equal(A.S.guest,true);assert.equal(A.v07.B.v24LoginIntent,null);
 startBuy(A,p);A.actions['project-select']({id:'bj'});assert.equal(A.v07.B.v24LoginIntent,null);assert.equal(A.S.project,'bj');assert.equal(A.v07.B.checkout,null);
});

test('中建顾客登录状态和续购意图可刷新恢复，重新切入不重复创建账户',()=>{
 const storage={},first=load([],{storage});select(first.A);const p=first.A.v07.products()[0];startBuy(first.A,p,2);
 const second=load([],{storage});second.go('U39');login(second.A);assert.equal(second.A.v07.B.checkout.lines[0].qty,2);const id=second.A.v08.me().id;
 second.A.actions['project-select']({id:'bj'});second.A.actions['project-select']({id:'zj'});assert.equal(second.A.S.guest,false);assert.equal(second.A.v08.me().id,id);assert.equal(second.A.S.identity,'na');
});

test('手机号末四位相同的两位顾客仍按独立账户持有订单',()=>{
 const{A,go}=load();select(A);go('U39');login(A);const first=A.v08.me();A.actions.logout();
 go('U39');A.forms['v16-member-login']({phone:'13956780099',code:'123456'});const second=A.v08.me();
 assert.notEqual(first.id,second.id);assert.equal(second.phone,'13956780099');assert.equal(second.id,A.v07.B.v24CustomerSession.memberId);
 assert.equal(A.v07.members().find(m=>m.name===A.S.profile.nickname).id,second.id);
 startBuy(A,A.v07.products()[0]);go('U22');A.forms['v09-owner-submit']({});assert.equal(A.v07.B.groups[0].memberId,second.id);
});

test('中建新顾客只看本人的预约和凭证，无法取消旧会员预约，后台仍保留完整订单',()=>{
 const{A,go}=load();select(A);const other=A.S.orders.find(o=>o.project==='zj'&&o.paid&&!o.children&&!o.orderScene&&o.status==='待履约');assert.ok(other);
 go('U39');login(A);let h=go('U10');assert.doesNotMatch(h,new RegExp(other.id));assert.match(h,/暂无/);
 h=go('U09?id='+other.id);assert.doesNotMatch(h,/data-qr=/);assert.match(h,/未找到该预约/);
 assert.throws(()=>A.actions['v04-cancel']({id:other.id}),/当前账号|不属于/);assert.equal(other.status,'待履约');
 h=go('U01');assert.doesNotMatch(h,new RegExp(other.id));assert.match(h,/暂无近期预约/);
 go('M04');assert.ok(A.currentOrders().some(o=>o.id===other.id));
});

test('离开中建切至首次访问的会所，恢复对应会员资料',()=>{
 const{A,go}=load();select(A);go('U39');login(A);A.actions['project-select']({id:'zx'});
 const m=A.v07.members().find(m=>m.name===A.S.profile.nickname);assert.ok(m);assert.equal(m.project,'zx');assert.equal(A.S.profile.phone,m.phone);assert.equal(A.S.guest,false);assert.notEqual(A.S.profile.phone,phone);assert.notEqual(A.S.profile.nickname,'游客');
});

test('中建新顾客无法通过退款表单提交其他会员的订单',()=>{
 const{A,go}=load();select(A);go('U39');login(A);
 const other=A.S.orders.find(o=>o.project==='zj'&&o.memberId!==A.v08.me().id);assert.ok(other);
 const before=JSON.stringify(other);
 assert.throws(()=>A.forms['review-refund']({id:other.id,amount:'28',reason:'测试',line:''}),/当前账号|不属于/);
 assert.equal(JSON.stringify(other),before);
});
