const test=require('node:test'),assert=require('node:assert/strict'),load=require('./helpers/load.cjs');
const setup=()=>load(['v11-decoration.js']);
function select(A,type){const d=A.v11Decoration.draft('home'),c=d.components.find(c=>c.type===type);assert.ok(c,type);A.actions['v07-decor-select']({id:c.id});return c;}
function probeForm(scope,html){
 const markup=html.match(/<form data-form="v11-decor-content"[^>]*>([\s\S]*?)<\/form>/)?.[1];assert.ok(markup,'探针必须绑定实际渲染的装修表单');
 const decode=v=>String(v||'').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'),attr=(tag,name)=>decode(tag.match(new RegExp('\\b'+name+'="([^"]*)"'))?.[1]),elements={};
 for(const m of markup.matchAll(/<input\b[^>]*>/g)){const tag=m[0],name=attr(tag,'name'),type=attr(tag,'type');if(name&&type!=='file'&&(type!=='checkbox'||tag.includes('checked')))elements[name]={name,value:attr(tag,'value')};}
 for(const m of markup.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)){const name=attr(m[1],'name'),options=[...m[2].matchAll(/<option\b([^>]*)>/g)],chosen=options.find(x=>/selected/.test(x[1]))||options[0];if(name)elements[name]={name,value:attr(chosen?.[1]||'','value')};}
 const formNode={elements},query=scope.document.querySelector;let reads=0;scope.document.querySelector=selector=>selector==='[data-form="v11-decor-content"]'?formNode:query(selector);
 scope.FormData=class extends FormData{constructor(node){super();assert.equal(node,formNode);reads++;for(const field of Object.values(node.elements))this.append(field.name,field.value);}};
 return {set(values){for(const [name,value] of Object.entries(values)){assert.ok(elements[name],name+' 必须来自渲染表单');elements[name].value=value;}},get reads(){return reads;}};
}

test('轮播按1—5张生成逐张图片、上传、预览及链接入口，内容页直接切换两种样式',()=>{
 const {A,go}=setup();go('A10');const c=select(A,'banner');
 for(const count of [1,2,5]){A.actions['v11-banner-count']({value:count});const h=go('A10');assert.equal((h.match(/class="v11-slide-config"/g)||[]).length,count);assert.equal((h.match(/name="v11-banner-upload"/g)||[]).length,count);assert.equal((h.match(/name="slideLink-\d+"/g)||[]).length,count);assert.equal((h.match(/data-action="v11-decor-style"/g)||[]).length,2);}
 assert.throws(()=>A.actions['v11-banner-count']({value:6}),/1—5/);assert.equal(c.slides.length,5);
});

test('每张轮播保留独立文案与链接，选中第5张后画布和发布页渲染同一内容',()=>{
 const {A,go}=setup();go('A10');const c=select(A,'banner');A.actions['v11-banner-count']({value:5});
 const f={title:c.title,slideCount:'5'};for(let i=0;i<5;i++)Object.assign(f,{['slideImage-'+i]:'assets/test-'+i+'.jpg',['slideTitle-'+i]:'独立标题'+i,['slideSubtitle-'+i]:'独立副标题'+i,['slideLink-'+i]:'#/U06?id=BJX0'+(i+1)});
 A.forms['v11-decor-content'](f);A.actions['v11-banner-slide']({id:c.id,page:'home',index:4});
 assert.match(go('A10'),/src="assets\/test-4.jpg"/);A.actions['v07-decor-publish']();const h=go('U01');assert.match(h,/独立标题4/);assert.match(h,/href="#\/U06\?id=BJX05"/);assert.equal(c.slides[0].link,'#/U06?id=BJX01');
});

test('非法轮播地址和非图片或超大上传会被拒绝，原草稿保留',()=>{
 const {A,go}=setup();go('A10');const c=select(A,'banner'),before=JSON.stringify(c);
 assert.throws(()=>A.forms['v11-decor-content']({title:c.title,slideCount:'1','slideImage-0':'assets/a.jpg','slideLink-0':'javascript:alert(1)'}),/链接/);assert.equal(JSON.stringify(c),before);
 assert.throws(()=>A.v11Decoration.validateUpload({type:'text/plain',size:10}),/图片/);assert.throws(()=>A.v11Decoration.validateUpload({type:'image/png',size:2*1024*1024+1}),/2MB/);assert.equal(A.v11Decoration.validateUpload({type:'image/png',size:10}),true);
});

test('会籍卡两种样式直接改变画布结构，默认云遮月卡保留会员码',()=>{
 const {A,go}=setup();go('A10');const c=select(A,'membership');assert.equal(c.style,1);const cloud=A.decor.component(c,true,true);assert.match(cloud,/v09-wallet-pocket/);assert.match(cloud,/data-action="member-code"/);
 A.actions['v11-decor-style']({value:0});const simple=A.decor.component(c,true,true);assert.notEqual(simple,cloud);assert.match(simple,/v11-membership-compact/);assert.match(simple,/data-action="member-code"/);assert.doesNotMatch(simple,/v09-wallet-pocket/);
 A.actions['v11-decor-style']({value:1});assert.match(A.decor.component(c,true,true),/v09-wallet-pocket/);
});

test('私教样式1左图右文，样式2共用双列上图下文卡片结构',()=>{
 const {A,go}=setup();go('A10');const c=select(A,'people');c.count=2;A.actions['v11-decor-style']({value:0});assert.match(A.decor.component(c,true,true),/v11-coach-list layout-row/);A.actions['v11-decor-style']({value:1});const h=A.decor.component(c,true,true);assert.match(h,/v11-coach-list layout-grid/);assert.equal((h.match(/class="v11-coach-photo"/g)||[]).length,2);assert.equal((h.match(/class="v11-coach-copy"/g)||[]).length,2);
});

test('推荐配置只提供数量、更多和标签，移除服务勾选及卡片资源维护',()=>{
 const {A,go}=setup();go('A10');select(A,'recommend');const h=go('A10'),panel=h.slice(h.indexOf('<aside class="studio-config"'));assert.match(panel,/name="count"/);assert.match(panel,/name="more"/);assert.match(panel,/name="tags"/);assert.doesNotMatch(panel,/关联本店服务|卡片图片|维护服务封面|name="item-/);
});

test('服务轮播独立保存发布，同步U05且草稿不提前覆盖发布快照',()=>{
 const {A,go}=setup();go('A10');const home=JSON.stringify(A.v11Decoration.draft('home'));A.actions['v11-decor-page']({page:'services'});let h=go('A10');assert.match(h,/服务页.*内容预览/);const c=A.v11Decoration.draft('services').components[0];
 A.forms['v11-decor-content']({title:'服务页轮播',slideCount:'1','slideImage-0':'assets/service-only.jpg','slideTitle-0':'服务页独立标题','slideSubtitle-0':'本店预约','slideLink-0':'#/U06?id=BJX01'});assert.doesNotMatch(go('U05'),/assets\/service-only.jpg/);
 go('A32');A.actions['v07-decor-publish']();h=go('U05');assert.match(h,/assets\/service-only.jpg/);assert.equal((h.match(/v11-service-carousel/g)||[]).length,1);assert.equal(JSON.stringify(A.v11Decoration.draft('home')),home);
 c.slides[0].image='assets/draft-only.jpg';assert.match(go('U05'),/assets\/service-only.jpg/);assert.doesNotMatch(go('U05'),/assets\/draft-only.jpg/);A.S.project='zj';assert.doesNotMatch(go('U05'),/assets\/service-only.jpg/);
});

test('运营及商家页面均有服务轮播装修入口，服务编辑仅出现轮播组件',()=>{
 const {go}=setup();for(const page of ['A10','A32','M12'])assert.match(go(page),/服务页轮播|服务页装修/);assert.match(go('M04'),/M12/);const h=go('M12');assert.match(h,/v11-slide-config/);assert.doesNotMatch(h,/data-action="v07-decor-add"/);
});

test('内容组件可在内容页直接切换两种清晰版式，切换保留未提交文字',()=>{
 const {A,go,scope}=setup();go('A10');const c=select(A,'content');const h=go('A10');assert.equal((h.match(/data-action="v11-decor-style"/g)||[]).length,2);A.actions['v11-decor-style']({value:0});const first=A.decor.component(c,true,true);
 const values={title:'正在编辑的标题',count:'2',more:'yes',text:'正在编辑的介绍文字',image:c.image};scope.FormData=class{constructor(){return Object.entries(values);}};scope.document.querySelector=selector=>selector==='[data-form="v11-decor-content"]'?{}:null;
 A.actions['v11-decor-style']({value:1});const second=A.decor.component(c,true,true);assert.notEqual(first,second);assert.match(first,/v11-story-cover/);assert.match(second,/v11-story-split/);assert.equal(c.title,values.title);assert.match(second,/正在编辑的介绍文字/);
});

test('首页及运营商家服务画布切换轮播圆点前捕获未应用图片标题链接',()=>{
 for(const route of ['A10','A32','M12']){
  const {A,go,scope}=setup();go(route);const page=route==='A10'?'home':'services',c=A.v11Decoration.draft(page).components.find(c=>c.type==='banner');if(page==='home')A.actions['v07-decor-select']({id:c.id});A.actions['v11-banner-count']({value:2});
  const probe=probeForm(scope,go(route));probe.set({'slideImage-0':'assets/typed-first.jpg','slideTitle-0':'未应用的第一张','slideLink-0':'#/U06?id=BJX01','slideImage-1':'assets/typed-second.jpg','slideTitle-1':'未应用的第二张','slideLink-1':'#/U06?id=BJX02'});
  A.actions['v11-banner-slide']({id:c.id,page,index:1});assert.ok(probe.reads>0,route+' 切图必须读取当前DOM表单');assert.equal(c.slides[0].image,'assets/typed-first.jpg');assert.equal(c.slides[0].title,'未应用的第一张');assert.equal(c.slides[0].link,'#/U06?id=BJX01');assert.equal(c.slides[1].link,'#/U06?id=BJX02');
  const rendered=go(route);assert.match(rendered,/value="assets\/typed-first.jpg"/);assert.match(rendered,/class="hero-image" src="assets\/typed-second.jpg"/);assert.match(rendered,/href="#\/U06\?id=BJX02"/);
 }
});

test('隐藏或删除其他组件重绘前保留当前轮播的未应用输入',()=>{
 for(const action of ['v07-decor-toggle','v07-decor-delete']){
  const {A,go,scope}=setup();go('A10');const c=select(A,'banner'),other=A.v11Decoration.draft('home').components.find(x=>x.type==='recommend'),probe=probeForm(scope,go('A10'));probe.set({'slideTitle-0':'重绘前未应用标题','slideImage-0':'assets/keep-edit.jpg','slideLink-0':'#/U05'});
  A.actions[action]({id:other.id});assert.ok(probe.reads>0,action+' 必须捕获当前表单');assert.equal(c.slides[0].title,'重绘前未应用标题');assert.match(go('A10'),/value="assets\/keep-edit.jpg"/);
 }
});

test('切组件页签及草稿预览均读取未应用的轮播输入',()=>{
 for(const action of ['v07-decor-select','v07-decor-panel','v11-decor-page','v07-decor-preview']){
  const {A,go,scope}=setup();go('A10');const c=select(A,'banner'),other=A.v11Decoration.draft('home').components.find(x=>x.type==='membership'),probe=probeForm(scope,go('A10'));probe.set({'slideTitle-0':'切换前未应用标题','slideImage-0':'assets/keep-preview.jpg'});
  A.actions[action]({id:other.id,value:'style',page:'services'});assert.ok(probe.reads>0,action+' 必须捕获当前表单');assert.equal(c.slides[0].title,'切换前未应用标题');assert.equal(c.slides[0].image,'assets/keep-preview.jpg');
 }
});

test('图片大图预览使用当前输入地址并保留未应用表单内容',()=>{
 const {A,go,scope}=setup();go('A10');const c=select(A,'banner'),probe=probeForm(scope,go('A10'));probe.set({'slideImage-0':'assets/new-preview.jpg','slideTitle-0':'预览前正在编辑'});let body='';A.modal=(title,html)=>{body=html;};
 A.actions['v11-image-preview']({src:c.slides[0].image,index:0});assert.ok(probe.reads>0);assert.match(body,/src="assets\/new-preview.jpg"/);assert.equal(c.slides[0].title,'预览前正在编辑');
});
