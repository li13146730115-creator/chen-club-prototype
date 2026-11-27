const test=require('node:test'),assert=require('node:assert/strict'),load=require('./helpers/load.cjs');
const nav=h=>h.match(/<nav class="v19-wallet-cats[^]*?<\/nav>/)?.[0]||'';
const cards=h=>h.match(/<div class="v19-wallet-cards">([^]*)/)?.[1]||'';

for(const route of ['U03','U20'])test(route+' 展示五项权益筛选，全部及自购筛选与状态组合生效',()=>{
 const {A,go}=load();go(route);
 const initial=nav(A.views[route]());
 assert.equal((initial.match(/<button\b/g)||[]).length,5);
 for(const label of ['运动健康','商务社交','休闲康养','全部权益','自购权益'])assert.ok(initial.includes(label));
 const m=A.v09.me(),expiry='2099-12-31';
 A.S.assets.push(...['运动健康','商务社交','休闲康养'].map((category,i)=>({id:'SCROLL-CARD-'+i,project:A.S.project,memberId:m.id,item:'BJX01',name:'滑动测试权益'+i,type:'次卡',remaining:3,total:5,expiry,displayCategory:category})));
 A.S.assets.push({id:'SCROLL-EXPIRED',project:A.S.project,memberId:m.id,item:'BJX01',name:'滑动测试过期权益',type:'次卡',remaining:1,total:5,expiry:'2000-01-01',displayCategory:'运动健康'});
 A.actions['v07-filter']({key:'v09Category',value:'全部权益'});
 let h=A.views[route]();for(let i=0;i<3;i++)assert.ok(cards(h).includes('滑动测试权益'+i));assert.ok(!cards(h).includes('滑动测试过期权益'));
 assert.match(nav(h),/data-value="全部权益"[^>]*aria-pressed="true"/);
 A.actions['v07-filter']({key:'v09Category',value:'自购权益'});
 h=A.views[route]();assert.ok(cards(h).includes('滑动测试权益0'));assert.doesNotMatch(cards(h),/v19-source">赠送|v19-source">会籍权益/);
 A.actions['v07-filter']({key:'v07Wallet',value:'已失效'});assert.ok(cards(A.views[route]()).includes('滑动测试过期权益'));
 A.v07.B.redemptions.unshift({id:'SCROLL-USE',project:A.S.project,memberId:m.id,cardId:'SCROLL-CARD-0',name:'滑动测试权益0',item:'BJX01',quantity:1,time:'2026-11-27 14:00',order:'SCROLL-ORDER'});
 A.actions['v07-filter']({key:'v07Wallet',value:'已核销'});assert.ok(cards(A.views[route]()).includes('滑动测试权益0'));
 A.actions['v07-filter']({key:'v09Category',value:'商务社交'});assert.ok(!cards(A.views[route]()).includes('滑动测试权益0'));
});

test('横向滑动后切换分类及状态，保留分类栏与页面滚动位置',()=>{
 const {A,go,scope}=load();go('U03');let bar={scrollLeft:180,clientWidth:339,querySelector:()=>null},screen={scrollTop:210};
 scope.document.querySelector=q=>q==='.v19-content-categories'?bar:q==='#screen'?screen:null;
 A.render=()=>{bar={scrollLeft:0,clientWidth:339,querySelector:()=>null};screen={scrollTop:0};};
 A.actions['v07-filter']({key:'v09Category',value:'自购权益'});assert.equal(bar.scrollLeft,180);assert.equal(screen.scrollTop,210);
 A.actions['v07-filter']({key:'v07Wallet',value:'已失效'});assert.equal(bar.scrollLeft,180);assert.equal(screen.scrollTop,210);
});
