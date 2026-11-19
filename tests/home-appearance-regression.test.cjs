const test=require('node:test'),assert=require('node:assert/strict'),load=require('./helpers/load.cjs');
const baseline=()=>load([],{skipScripts:['v11-decoration.js']});
const copy=x=>JSON.parse(JSON.stringify(x));

test('首次访问三个会所的首页均保留原有云层卡套与会员码',()=>{
 const {A,go}=load();
 for(const project of Object.keys(A.projects)){
  A.S.project=project;const html=go('U01');
  assert.match(html,/v09-wallet-pocket/,'首次访问 '+project+' 必须展示原来的云层遮挡');
  assert.match(html,/aria-label="出示会员码"/);
  assert.doesNotMatch(html,/v11-membership-compact/,'旧默认样式0不能被解释成新浅色横卡');
 }
});

test('旧首页发布快照及草稿的组件保留上一版结构、正文和布局',()=>{
 const old=baseline(),next=load();
 for(const project of Object.keys(next.A.projects)){
  old.A.S.project=next.A.S.project=project;
  for(const bucket of ['drafts','published']){
   const config=copy(old.A.decor.draft());
   for(const c of config.components){
    if(c.type==='banner')continue;
    for(const style of [0,1]){
     c.style=style;
     const expected=old.A.decor.component(copy(c),false,true);
     next.A.S.decoration[bucket][project+'-home']=copy(config);
     const actual=next.A.decor.component(copy(c),false,true);
     assert.equal(actual,expected,project+' '+bucket+' '+c.type+' 样式'+style+' 未主动切换时必须沿用上一版');
    }
   }
  }
 }
});

test('后台明确切换新样式后才改变会籍卡，发布保留选择',()=>{
 const {A,go}=load();go('A10');const c=A.v11Decoration.draft('home').components.find(c=>c.type==='membership');
 A.actions['v07-decor-select']({id:c.id});
 A.actions['v11-decor-style']({value:0});
 assert.match(A.decor.component(c,true,true),/v11-membership-compact/);
 A.actions['v07-decor-publish']();assert.match(go('U01'),/v11-membership-compact/);
 A.actions['v11-decor-style']({value:1});A.actions['v07-decor-publish']();
 assert.match(go('U01'),/v09-wallet-pocket/);assert.doesNotMatch(go('U01'),/v11-membership-compact/);
});

test('旧轮播三种样式保留原有布局编号，不自动变为新画廊样式',()=>{
 const {A}=load();
 for(const style of [0,1,2]){
  const c={...A.decor.create('banner'),style};
  const normalized=A.v07Decoration.normalize({components:[c]}).components[0];
  assert.equal(normalized.style,style,'旧海报样式2不能被压成样式1');
  const html=A.v11Decoration.banner(normalized);
  assert.match(html,new RegExp('home-banner-style-'+style));
  assert.doesNotMatch(html,/v11-custom-banner|v11-slide-number/);
 }
});
