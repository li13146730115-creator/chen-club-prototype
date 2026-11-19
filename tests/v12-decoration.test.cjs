const test=require('node:test'),assert=require('node:assert/strict'),load=require('./helpers/load.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));
function choose(A,type,style){const c=A.v11Decoration.draft('home').components.find(c=>c.type===type);assert.ok(c,type);A.actions['v07-decor-select']({id:c.id});A.actions['v11-decor-style']({value:style});return c;}

test('浅色会籍卡只展示卡名、有效期与可操作会员码，切回云卡保留原有结构',()=>{
 const {A,go}=load();go('A10');const c=choose(A,'membership',0),info=A.v05.membershipInfo(),html=A.decor.component(c,true,true);
 assert.match(html,new RegExp(A.E(info.title)));assert.match(html,new RegExp(A.E(info.validity)));
 assert.match(html,/data-action="member-code" aria-label="出示会员码"/);assert.match(html,/href="#\/U03"/);
 assert.doesNotMatch(html,/v09-membership-wallet|v09-wallet-card|v09-wallet-pocket/,'紧凑卡不继承云卡的定位及高度');
 A.actions['v11-decor-style']({value:1});assert.equal(A.decor.component(c,true,true),load([],{skipScripts:['v11-decoration.js']}).A.decor.component({...copy(c),v11Style:false},true,true));
});

test('场景聚合样式2仅渲染本店有效关联服务，按数量截取且免费场地不显示价格字样',()=>{
 const {A,go}=load();go('A10');const c=choose(A,'water',1),rows=A.v05.list('water');assert.ok(rows.length>1);
 const hidden={...rows[0],id:'V12-HIDDEN',name:'隐藏的场景服务'},other={...rows[0],id:'V12-OTHER',project:'another',name:'其他会所服务'};
 A.services.push(hidden,other);A.S.hiddenServices.push(hidden.id);c.ids=[...rows.map(s=>s.id),hidden.id,other.id];c.count=1;
 const html=A.decor.component(c,true,true);
 assert.match(html,/v12-scene-services/,'主动选择样式2后使用独立的全宽服务区域');
 assert.match(html,new RegExp('href="'+A.href('U06',{id:rows[0].id}).replace(/[?]/g,'\\?')+'"'));
 assert.doesNotMatch(html,/隐藏的场景服务|其他会所服务|场地免费|价格待确认/);
 assert.doesNotMatch(html,new RegExp('href="'+A.href('U06',{id:rows[1].id}).replace(/[?]/g,'\\?')+'"'));
 c.count=2;assert.match(A.decor.component(c,true,true),new RegExp(A.E(A.v05.serviceName(rows[1]))));
});

test('场景服务采用统一价格标签，接口未加载时仅展示正数金额',()=>{
 const {A,go}=load();go('A10');const c=choose(A,'water',1);
 A.v12Pricing={label:()=> '¥288.00'};assert.match(A.decor.component(c,true,true),/¥288\.00/);
 A.v12Pricing.label=()=>'';assert.doesNotMatch(A.decor.component(c,true,true),/¥|￥|场地免费|价格待确认/);
 delete A.v12Pricing;A.offer=()=>({amount:0,text:'场地免费',unit:'／小时'});assert.doesNotMatch(A.decor.component(c,true,true),/¥|￥|场地免费|价格待确认/);
 A.offer=()=>({amount:18800,text:'价格待确认',unit:'／小时'});assert.match(A.decor.component(c,true,true),/¥188\.00/);
});

test('会所生活与场景样式选择只改变当前草稿，发布后与后台画布共用结构且保留后续草稿隔离',()=>{
 const {A,go}=load();go('A10');A.actions['v07-decor-publish']();const initial=go('U01');go('A10');const story=choose(A,'content',1);story.text='在庭院茶室享一刻安静';story.image='assets/home-tea.jpg';
 const scene=choose(A,'water',1);scene.image='assets/club-pool.jpg';
 assert.equal(go('U01'),initial,'选择样式不提前修改已发布首页');go('A10');
 const expected=[story,scene].map(c=>A.decor.component(c,true,true));
 assert.match(expected[0],/在庭院茶室享一刻安静/);assert.match(expected[1],/v12-scene-services/);
 A.actions['v07-decor-publish']();let html=go('U01');for(const fragment of expected)assert.ok(html.includes(fragment),'前台必须使用画布中的同一组件结构');
 story.text='只在新草稿里的介绍';scene.image='assets/home-dining.jpg';html=go('U01');assert.doesNotMatch(html,/只在新草稿里的介绍/);for(const fragment of expected)assert.ok(html.includes(fragment));
});

test('没有明确选样式的旧会籍、生活与场景组件始终沿用基线渲染',()=>{
 const old=load([],{skipScripts:['v11-decoration.js']}),next=load();
 for(const project of Object.keys(next.A.projects)){old.A.S.project=next.A.S.project=project;
  for(const type of ['membership','content','wellness','water','dining'])for(const style of [0,1]){
   const c={...next.A.decor.create(type),style,v07Style:true,v08Style:true};
   assert.equal(next.A.decor.component(copy(c),false,true),old.A.decor.component(copy(c),false,true),project+' '+type+' 样式'+style);
  }
 }
});
