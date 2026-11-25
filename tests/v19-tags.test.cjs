const test=require('node:test'),assert=require('node:assert/strict'),load=require('./helpers/load.cjs');
const setup=()=>load(['v19-tags.js']);
function recommend(A,go){go('A10');const c=A.v11Decoration.draft('home').components.find(x=>x.type==='recommend');A.actions['v07-decor-select']({id:c.id});return c;}
function choose(A,c,source,label){A.actions['v19-tag-toggle']({id:c.id,source,label,checked:'yes'});}

test('推荐标签用可多选下拉展示本店服务、商品及会员现有分类和标签',()=>{
 const {A,go}=setup(),c=recommend(A,go),s=A.services.find(s=>s.project==='bj'),p=A.S.v02.v03.merchantProducts.bj.find(p=>p.v07Catalog),m=A.v07.members()[0];
 s.tags=['服务新标签'];p.tags=['商品新标签'];m.tags=['会员新标签'];A.services.find(s=>s.project!=='bj').tags=['外店专属'];
 const html=go('A10'),panel=html.slice(html.indexOf('<aside class="studio-config"'));
 assert.match(panel,/<details[^>]+class="v19-tag-dropdown"/);assert.match(panel,/type="checkbox"[^>]+data-v19-tag/);
 for(const text of ['服务标签','商品标签','会员标签','服务新标签','商品新标签','会员新标签',s.category,p.menuCategory,m.grade])assert.ok(panel.includes(text),text);
 assert.doesNotMatch(panel,/外店专属|推荐标签（逗号分隔）/);assert.match(panel,/name="tags"[^>]+type="hidden"|type="hidden"[^>]+name="tags"/);
 for(const route of ['M04','M05','A07'])assert.ok(panel.includes('#/'+route));assert.equal(c.tags||'','');
});

test('旧逗号标签保留原值和已选项，切换内容样式预览和页面后可保存发布',()=>{
 const {A,go}=setup(),c=recommend(A,go);c.tags='健身，老客专属,茶室';const h=go('A10');assert.match(h,/老客专属/);assert.equal(c.tags,'健身，老客专属,茶室');
 choose(A,c,'service','运动健康');const selected=c.tags;
 for(const [action,data]of [['v07-decor-panel',{value:'style'}],['v11-decor-style',{value:1}],['v07-decor-panel',{value:'content'}],['v07-decor-preview',{}],['v11-decor-page',{page:'services'}],['v11-decor-page',{page:'home'}],['v07-decor-save',{}],['v07-decor-publish',{}]]){A.actions[action](data);assert.equal(c.tags,selected,action);}
 const published=A.S.decoration.published['bj-home'].components.find(x=>x.id===c.id);assert.equal(published.tags,selected);assert.deepEqual(JSON.parse(JSON.stringify(published.recommendTagRefs)),JSON.parse(JSON.stringify(c.recommendTagRefs)));assert.ok(c.tags.includes('老客专属'));
});

test('勾选下拉框时同步隐藏字段及选中项，取消最后一个标签可清空',()=>{
 const {A,go}=setup(),c=recommend(A,go),hidden={value:''},summary={textContent:''},chips={innerHTML:''},checks=[{dataset:{source:'service',label:'运动健康'},checked:true},{dataset:{source:'product',label:'咖啡茶饮'},checked:true}];
 const root={dataset:{component:c.id},querySelector(selector){return selector==='[name="tags"]'?hidden:selector==='[data-v19-tag-summary]'?summary:chips;},querySelectorAll(){return checks;}};
 const field={closest:()=>root};A.v19Tags.change(field);assert.equal(hidden.value,c.tags);assert.match(chips.innerHTML,/运动健康/);assert.match(chips.innerHTML,/咖啡茶饮/);assert.match(summary.textContent,/2/);assert.equal(c.recommendTagRefs.length,2);
 checks.forEach(x=>x.checked=false);A.v19Tags.change(field);assert.equal(c.tags,'');assert.equal(hidden.value,'');assert.equal(c.recommendTagRefs.length,0);
});

test('服务标签筛选当前项目真实记录，空选择保持原推荐',()=>{
 const {A,go}=setup(),c=recommend(A,go),s=A.services.find(s=>s.project==='bj');s.tags=['泳池专属'];const original=A.decor.component(c,true,true);choose(A,c,'service','泳池专属');const html=A.decor.component(c,true,true);
 assert.ok(html.includes(A.href('U06',{id:s.id})));assert.doesNotMatch(html,/暂无服务/);const links=[...html.matchAll(/href="#\/U06\?id=([^"]+)"/g)].map(x=>x[1]);assert.deepEqual(links,[s.id]);
 A.actions['v19-tag-toggle']({id:c.id,source:'service',label:'泳池专属',checked:'no'});assert.equal(A.decor.component(c,true,true),original);
});

test('商品分类读取真实在售商品并跳转商品详情，会员标签控制发布受众',()=>{
 const {A,go}=setup(),c=recommend(A,go),member=A.v07.members()[0],product=A.v07.products().find(p=>p.menuCategory==='咖啡茶饮');
 choose(A,c,'product','咖啡茶饮');let html=A.decor.component(c,true,true);assert.ok(html.includes(A.href('U33',{id:product.id})));assert.doesNotMatch(html,/#\/U06\?id=/);
 choose(A,c,'member',member.grade);A.S.guest=false;A.S.profile.nickname=member.name;assert.ok(A.decor.component(c,false,true));A.S.guest=true;assert.equal(A.decor.component(c,false,true),'');assert.match(A.decor.component(c,true,true),/仅向.*会员|受众/);
});

test('标签动态更新和同名分组不混淆，项目隔离且隐藏内容不推荐',()=>{
 const {A,go}=setup(),c=recommend(A,go),service=A.services.find(s=>s.project==='bj');service.tags=['同名'];const p=A.S.v02.v03.merchantProducts.bj.find(p=>p.v07Catalog);p.tags=['同名'];
 choose(A,c,'product','同名');let html=A.decor.component(c,true,true);assert.ok(html.includes(A.href('U33',{id:p.id})));assert.ok(!html.includes(A.href('U06',{id:service.id})));
 p.status='已下架';assert.match(A.decor.component(c,true,true),/暂无.*商品|暂无.*内容/);A.S.project='zj';assert.ok(!A.v19Tags.catalog().some(x=>x.label==='同名'));assert.ok(!go('A10').includes('同名'));
});

test('DOM中的标签及未应用数量在预览、样式、页签和发布前一并捕获',()=>{
 for(const action of ['v07-decor-preview','v11-decor-style','v07-decor-panel','v11-decor-page','v07-decor-save','v07-decor-publish']){
  const {A,go,scope}=setup(),c=recommend(A,go);choose(A,c,'product','咖啡茶饮');const html=go('A10'),hidden=html.match(/<input name="tags" type="hidden" value="([^"]*)"/);assert.ok(hidden);
  const values={tags:hidden[1],count:'2',more:'no'},form={};let reads=0;scope.FormData=class{constructor(node){assert.equal(node,form);reads++;return Object.entries(values);}};scope.document.querySelector=selector=>selector==='[data-form="v11-decor-content"]'?form:null;
  A.actions[action]({value:'1',page:'services'});assert.ok(reads>0,action);assert.equal(c.tags,hidden[1]);assert.equal(c.count,2);assert.equal(c.more,false);assert.equal(c.recommendTagRefs[0].source,'product');
 }
});

function section(html){return html.match(/<section class="decor-component home-component component-recommend\b[^>]*>([\s\S]*?)<\/section>/)?.[1]||'';}
test('服务商品组合与会员受众发布到首页，保存后重载仍沿用快照且草稿不提前覆盖',()=>{
 const storage={},first=load(['v19-tags.js'],{storage}),{A,go}=first,c=recommend(A,go),s=A.services.find(s=>s.project==='bj'),p=A.S.v02.v03.merchantProducts.bj.find(p=>p.v07Catalog),m=A.v07.members()[0];
 s.tags=['本店定向服务'];p.tags=['本店定向商品'];m.tags=['重点会员'];choose(A,c,'service','本店定向服务');choose(A,c,'product','本店定向商品');choose(A,c,'member','重点会员');A.S.guest=false;A.S.profile.nickname=m.name;A.actions['v07-decor-publish']();
 let html=section(go('U01'));assert.ok(html.includes(A.href('U06',{id:s.id})));assert.ok(html.includes(A.href('U33',{id:p.id})));
 A.actions['v19-tag-toggle']({id:c.id,source:'product',label:'本店定向商品',checked:'no'});html=section(go('U01'));assert.ok(html.includes(A.href('U33',{id:p.id})),'草稿变更不能覆盖发布快照');
 const second=load(['v19-tags.js'],{storage}),published=second.A.S.decoration.published['bj-home'].components.find(x=>x.type==='recommend');assert.equal(published.recommendTagRefs.length,3);assert.ok(section(second.go('U01')).includes(A.href('U33',{id:p.id})));
 second.A.S.guest=true;assert.equal(section(second.go('U01')),'');second.A.S.guest=false;second.A.v07.members()[0].tags=[];assert.equal(section(second.go('U01')),'');
});

test('只选会员标签保持默认推荐的内容和样式，会员标签任一匹配即可',()=>{
 const {A,go}=setup(),c=recommend(A,go),member=A.v07.members()[0],other=A.v07.members().find(m=>m.grade&&m.grade!==member.grade);A.S.guest=false;A.S.profile.nickname=member.name;
 for(const style of [0,1]){c.style=style;const before=A.decor.component(c,false,true);choose(A,c,'member',member.grade);assert.equal(A.decor.component(c,false,true).replace(A.href('U18',{kind:'recommend',recommend:c.id}),A.href('U18',{kind:'recommend'})),before);A.actions['v19-tag-toggle']({id:c.id,source:'member',label:member.grade,checked:'no'});}
 if(other){choose(A,c,'member',other.grade);assert.equal(A.decor.component(c,false,true),'');choose(A,c,'member',member.grade);assert.ok(A.decor.component(c,false,true));}
});

test('同时勾选服务和商品时在推荐数量内均匀展示两种内容',()=>{
 const {A,go}=setup(),c=recommend(A,go);c.count=2;choose(A,c,'service','运动健康');choose(A,c,'product','咖啡茶饮');const html=A.decor.component(c,true,true);assert.match(html,/#\/U06\?id=/);assert.match(html,/#\/U33\?id=/);assert.equal((html.match(/class="home-editorial"/g)||[]).length,2);
});

test('推荐更多入口沿用已发布标签筛选，并限制当前项目与会员受众',()=>{
 const {A,go}=setup(),c=recommend(A,go),m=A.v07.members()[0];choose(A,c,'product','咖啡茶饮');choose(A,c,'member',m.grade);A.S.guest=false;A.S.profile.nickname=m.name;A.actions['v07-decor-publish']();
 const published=section(go('U01'));assert.ok(published.includes('recommend='+c.id));let html=go('U18?kind=recommend&recommend='+c.id);assert.match(html,/#\/U33\?id=/);assert.doesNotMatch(html,/#\/U06\?id=/);
 A.S.guest=true;assert.doesNotMatch(go('U18?kind=recommend&recommend='+c.id),/#\/U33\?id=/);A.S.guest=false;A.S.project='zj';assert.doesNotMatch(go('U18?kind=recommend&recommend='+c.id),/#\/U33\?id=/);
});

test('只选会员标签的更多入口保留组件上下文，授权后沿用原服务列表',()=>{
 const {A,go}=setup(),c=recommend(A,go),member=A.v07.members()[0];A.S.guest=false;A.S.profile.nickname=member.name;const original=go('U18?kind=recommend');go('A10');choose(A,c,'member',member.grade);A.actions['v07-decor-publish']();
 go('U01');const componentHtml=A.decor.component(A.S.decoration.published['bj-home'].components.find(x=>x.id===c.id),false,true);assert.ok(componentHtml.includes('recommend='+c.id),'会员受众推荐的更多入口必须携带发布组件 ID');
 assert.equal(go('U18?kind=recommend&recommend='+c.id),original,'授权受众读取原有推荐服务列表及样式');A.S.guest=true;assert.doesNotMatch(go('U18?kind=recommend&recommend='+c.id),/#\/U06\?id=/);A.S.guest=false;A.S.profile.nickname='非目标会员';assert.doesNotMatch(go('U18?kind=recommend&recommend='+c.id),/#\/U06\?id=/);
});

test('旧标签匹配为空时勾选已有服务标签立即刷新当前画布组件',()=>{
 const {A,scope,go}=setup(),c=recommend(A,go);c.tags='旧标签下没有服务';const baseline=A.decor.component(c,true,true);assert.match(baseline,/当前标签下暂无服务/);
 const canvas={outerHTML:baseline},hidden={value:c.tags},summary={textContent:''},selected={innerHTML:''},checks=[{checked:false,dataset:{source:'legacy',label:c.tags}},{checked:true,dataset:{source:'service',label:'运动健康'}}];
 const root={dataset:{component:c.id},querySelector(selector){return selector==='[name="tags"]'?hidden:selector==='[data-v19-tag-summary]'?summary:selected;},querySelectorAll(){return checks;}};
 scope.document.querySelector=selector=>{const requested=selector.match(/\.studio-block\[data-id="([^"]+)"\]\s*>\s*\.([\w-]+)$/),classes=canvas.outerHTML.match(/^<section class="([^"]+)"/)?.[1].split(/\s+/)||[];return requested&&requested[1]===c.id&&classes.includes(requested[2])?canvas:null;};
 A.v19Tags.change({closest:()=>root});assert.equal(c.tags,'运动健康');assert.equal(hidden.value,'运动健康');assert.match(canvas.outerHTML,/#\/U06\?id=/,'画布应即时展示已匹配服务');assert.doesNotMatch(canvas.outerHTML,/当前标签下暂无服务/);
});
