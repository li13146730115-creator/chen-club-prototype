const test=require('node:test'),assert=require('node:assert/strict'),load=require('./helpers/load.cjs');
const setup=options=>load(['v21-tags.js'],options);
const plain=x=>JSON.parse(JSON.stringify(x));
function create(A,name,extra={}){return A.forms['v21-tag-save']({name,project:A.S.project,...extra});}
function recommend(A,go){go('A10');const c=A.v11Decoration.draft('home').components.find(c=>c.type==='recommend');A.actions['v07-decor-select']({id:c.id});return c;}
function choose(A,c,name){A.actions['v19-tag-toggle']({id:c.id,source:'product',label:name,checked:'yes'});}
function productForm(A,extra={}){const d=A.v07.B.skuDraft;return {name:'标签测试商品',menuCategory:'咖啡茶饮',image:'assets/menu-coffee.svg',detail:'本店现场制作',status:'已上架',v21TagProject:A.S.project,...Object.fromEntries(d.skus.flatMap((s,i)=>[['label-'+i,s.label||'默认规格'],['price-'+i,s.price||'28'],['stock-'+i,String(s.stock??99)],['skuImage-'+i,s.image||'assets/menu-coffee.svg']])),...extra};}

test('标签管理有独立菜单与商品入口，保留 M20 售卖菜单并初始化本店真实分类标签',()=>{
 const {A,go}=setup(),h=go('M25');assert.equal(A.pages.find(p=>p.id==='M25').title,'标签管理');assert.equal(A.pages.find(p=>p.id==='M25').hidden,false);assert.ok(A.navigationGroups.find(g=>g.ids.includes('M05')).ids.includes('M25'));
 assert.match(h,/新增标签/);assert.match(h,/已关联商品/);assert.match(go('M05'),/href="#\/M25"/);assert.match(go('M20'),/售卖菜单配置|商品展示类别/);
 const tags=A.v21Tags.list();assert.ok(tags.length>=5);for(const name of ['咖啡茶饮','酒水饮料','精选酒饮','甜点小食'])assert.ok(tags.some(t=>t.name===name));assert.ok(tags.every(t=>t.project==='bj'));
 const c=recommend(A,go);assert.match(go('A10'),/href="#\/M25"/);assert.equal(c.type,'recommend');
});

test('新增未关联商品的标签立即出现在推荐选择器，防止空白、重复与外店标签写入',()=>{
 const {A,go}=setup(),t=create(A,'  午后轻享  ');assert.equal(t.name,'午后轻享');assert.ok(A.v19Tags.catalog().some(r=>r.source==='product'&&r.label===t.name&&r.ids.length===0));
 const c=recommend(A,go);assert.match(go('A10'),/data-label="午后轻享"/);choose(A,c,t.name);assert.match(A.decor.component(c,true,true),/暂无.*商品/);
 for(const name of ['', '   ', '午后轻享','午后轻享 ', 'a,b','超'.repeat(21)])assert.throws(()=>create(A,name),/标签|重复|字符|20/);
 assert.throws(()=>create(A,'跨店写入',{project:'zx'}),/本店|店铺/);A.S.project='zx';assert.ok(!A.v21Tags.list().some(x=>x.id===t.id));assert.ok(!A.v19Tags.catalog().some(x=>x.label===t.name));assert.throws(()=>create(A,'外店改名',{id:t.id}),/本店|店铺/);
});

test('商品新增编辑可多选标签，保存兼容标签文本并实际筛选推荐商品及发布更多页',()=>{
 const storage={},ctx=setup({storage}),{A,go}=ctx,t=create(A,'会客优选'),u=create(A,'低糖轻食');go('M11');const h=go('M11');assert.match(h,/type="hidden" name="tagIds"/);assert.match(h,/data-v21-product-tag/);assert.match(h,/会客优选/);
 const p=A.forms['v19-product-save'](productForm(A,{tagIds:t.id+','+u.id}));assert.deepEqual(plain(p.tagIds),[t.id,u.id]);assert.deepEqual(plain(p.tags),[t.name,u.name]);
 let edit=go('M11?id='+p.id);assert.ok(new RegExp('data-v21-product-tag[^>]*value="'+t.id+'"[^>]*checked').test(edit));p.tags.push('原有导入标签');A.forms['v19-product-save'](productForm(A,{tagIds:t.id}));assert.deepEqual(plain(p.tagIds),[t.id]);assert.deepEqual(plain(p.tags),['原有导入标签',t.name]);
 const c=recommend(A,go);choose(A,c,t.name);let preview=A.decor.component(c,true,true);assert.ok(preview.includes(A.href('U33',{id:p.id})));assert.equal((preview.match(/class="home-editorial"/g)||[]).length,1);A.actions['v07-decor-publish']();assert.ok(go('U18?kind=recommend&recommend='+c.id).includes(A.href('U33',{id:p.id})));
 const again=setup({storage}),restored=again.A.S.v02.v03.merchantProducts.bj.find(x=>x.id===p.id);assert.deepEqual(plain(restored.tagIds),[t.id]);assert.ok(again.go('U18?kind=recommend&recommend='+c.id).includes(again.A.href('U33',{id:p.id})));
});

test('商品标签提交在保存前拒绝无效 ID 和跨店引用，缺省字段兼容原商品表单',()=>{
 const {A,go}=setup(),foreign=A.v21Tags.list('zx')[0];go('M11');const before=A.S.v02.v03.merchantProducts.bj.length;
 for(const f of [{tagIds:'missing'},{tagIds:foreign.id},{tagIds:'[]'},{tagIds:'',v21TagProject:'zx'}]){assert.throws(()=>A.forms['v19-product-save'](productForm(A,f)),/标签|本店|店铺/);assert.equal(A.S.v02.v03.merchantProducts.bj.length,before);}
 const p=A.forms['v19-product-save'](productForm(A));assert.ok(p);assert.deepEqual(plain(p.tagIds),[]);const other=A.S.v02.v03.merchantProducts.zx.find(x=>x.v07Catalog),snapshot=JSON.stringify(other);go('M11');A.v07.B.skuDraft.editId=other.id;assert.throws(()=>A.forms['v19-product-save'](productForm(A,{tagIds:''})),/本店|商品/);assert.equal(JSON.stringify(other),snapshot);
});

test('标签改名同步商品、草稿与已发布推荐，保留同名服务分组及外店快照',()=>{
 const {A,go}=setup(),t=create(A,'茶叙精选');go('M11');const p=A.forms['v19-product-save'](productForm(A,{tagIds:t.id})),c=recommend(A,go);choose(A,c,t.name);const service=A.services.find(s=>s.project==='bj');service.tags=[t.name];A.actions['v19-tag-toggle']({id:c.id,source:'service',label:t.name,checked:'yes'});A.actions['v07-decor-publish']();
 A.S.decoration.drafts['zx-home']={components:[{type:'recommend',tags:t.name,recommendTagsValue:t.name,recommendTagRefs:[{source:'product',label:t.name}]}]};const other=JSON.stringify(A.S.decoration.drafts['zx-home']);create(A,'茶叙好物',{id:t.id});
 assert.deepEqual(plain(p.tagIds),[t.id]);assert.deepEqual(plain(p.tags),['茶叙好物']);for(const bucket of ['drafts','published']){const changed=A.S.decoration[bucket]['bj-home'].components.find(x=>x.id===c.id);assert.ok(changed.recommendTagRefs.some(r=>r.source==='product'&&r.label==='茶叙好物'));assert.ok(changed.recommendTagRefs.some(r=>r.source==='service'&&r.label==='茶叙精选'));assert.equal(changed.recommendTagsValue,changed.tags);assert.match(changed.tags,/茶叙好物/);}
 assert.equal(JSON.stringify(A.S.decoration.drafts['zx-home']),other);assert.ok(A.decor.component(A.S.decoration.published['bj-home'].components.find(x=>x.id===c.id),false,true).includes(A.href('U33',{id:p.id})));
});

test('删除使用中标签被阻止，商品与草稿或已发布引用分别计入占用；闲置标签可删除',()=>{
 const {A,go}=setup(),t=create(A,'临时活动'),u=create(A,'未用标签');A.actions['v21-tag-delete']({id:u.id,project:'bj'});assert.ok(!A.v21Tags.list().some(x=>x.id===u.id));
 go('M11');const p=A.forms['v19-product-save'](productForm(A,{tagIds:t.id}));assert.equal(A.v21Tags.usage(t.id).products,1);assert.throws(()=>A.actions['v21-tag-delete']({id:t.id}),/使用|关联|移除/);
 go('M11?id='+p.id);A.forms['v19-product-save'](productForm(A,{tagIds:''}));const c=recommend(A,go);choose(A,c,t.name);assert.equal(A.v21Tags.usage(t.id).drafts,1);assert.throws(()=>A.actions['v21-tag-delete']({id:t.id}),/使用|推荐|移除/);A.actions['v07-decor-publish']();A.actions['v19-tag-toggle']({id:c.id,source:'product',label:t.name,checked:'no'});assert.equal(A.v21Tags.usage(t.id).published,1);assert.throws(()=>A.actions['v21-tag-delete']({id:t.id}),/使用|推荐|移除/);
 A.actions['v07-decor-publish']();A.actions['v21-tag-delete']({id:t.id});assert.ok(!A.v21Tags.list().some(x=>x.id===t.id));
});

test('标签本地持久保存且重载不补回已删除种子，不覆盖旧商品标签或外店数据',()=>{
 const storage={},first=setup({storage}),{A}=first,t=create(A,'周末慢享'),unused=A.v21Tags.list().find(t=>!A.v21Tags.usage(t.id).products);assert.ok(unused);A.actions['v21-tag-delete']({id:unused.id});const other=JSON.stringify(A.S.v02.v03.merchantProducts.zx),second=setup({storage});assert.ok(second.A.v21Tags.list().some(x=>x.id===t.id));assert.ok(!second.A.v21Tags.list().some(x=>x.id===unused.id));assert.equal(JSON.stringify(second.A.S.v02.v03.merchantProducts.zx),other);
});

test('商品标签勾选实时同步隐藏值与编辑草稿，SKU 重绘可沿用选择',()=>{
 const {A,go}=setup(),t=create(A,'新品尝鲜'),u=create(A,'手作优选');go('M11');const hidden={value:''},checks=[{checked:true,value:t.id},{checked:false,value:u.id}],root={querySelector:()=>hidden,querySelectorAll:()=>checks};A.v21Tags.changeProductTags({closest:()=>root});assert.equal(hidden.value,t.id);assert.deepEqual(plain(A.v07.B.skuDraft.tagIds),[t.id]);assert.ok(new RegExp('value="'+t.id+'"[^>]*checked').test(go('M11')));checks[0].checked=false;checks[1].checked=true;A.v21Tags.changeProductTags({closest:()=>root});assert.equal(hidden.value,u.id);
});

test('特殊文本标签按原值转义回显，不能改变商品表单结构',()=>{
 const {A,go}=setup(),t=create(A,'$1 <轻食>');go('M11');const h=go('M11'),field=h.match(/<fieldset class="v21-product-tags">[\s\S]*?<\/fieldset>/)?.[0]||'';assert.ok(field.includes('$1 &lt;轻食&gt;'));assert.equal((h.match(/<span>商品主图<\/span>/g)||[]).length,1);assert.doesNotMatch(field,/<轻食>/);assert.ok(field.includes(t.id));
});

test('已关联分类的种子标签改名保持推荐匹配，重复改名不产生部分更新',()=>{
 const {A,go}=setup(),t=A.v21Tags.list().find(x=>x.name==='咖啡茶饮'),other=A.v21Tags.list().find(x=>x.name==='酒水饮料'),p=A.S.v02.v03.merchantProducts.bj.find(x=>x.id==='V07-bj-coffee'),c=recommend(A,go);choose(A,c,t.name);A.actions['v07-decor-publish']();const before=JSON.stringify({p,c,t});assert.throws(()=>create(A,other.name,{id:t.id}),/重复|同名/);assert.equal(JSON.stringify({p,c,t}),before);create(A,'现制茶咖',{id:t.id});assert.ok(p.tags.includes('现制茶咖'));assert.ok(A.decor.component(c,true,true).includes(A.href('U33',{id:p.id})));assert.ok(A.decor.component(A.S.decoration.published['bj-home'].components.find(x=>x.id===c.id),false,true).includes(A.href('U33',{id:p.id})));assert.ok(!A.v19Tags.catalog().some(r=>r.source==='product'&&r.label==='咖啡茶饮'));
});

test('Unicode 归一化后仍校验分隔符，避免合法输入保存后被拆成多个推荐标签',()=>{
 const {A}=setup(),before=A.v21Tags.list().length;for(const name of ['茶﹐点','茶､点','茶﹑点'])assert.throws(()=>create(A,name),/标签|逗号|字符/);assert.equal(A.v21Tags.list().length,before);
});

test('取消与商品分类同名的受管标签后不再推荐，全部解除关联后可删除',()=>{
 const storage={},ctx=setup({storage}),{A,go}=ctx,t=A.v21Tags.list().find(x=>x.name==='咖啡茶饮'),products=A.S.v02.v03.merchantProducts.bj.filter(p=>p.tagIds?.includes(t.id)),c=recommend(A,go);choose(A,c,t.name);const target=products[0];assert.ok(A.decor.component(c,true,true).includes(A.href('U33',{id:target.id})));
 for(const p of products){go('M11?id='+p.id);A.forms['v19-product-save'](productForm(A,{name:p.name,menuCategory:p.menuCategory||p.category,tagIds:p.tagIds.filter(id=>id!==t.id).join(',')}));assert.ok(!A.v19Tags.catalog().find(r=>r.source==='product'&&r.label===t.name)?.ids.includes(p.id));}
 assert.equal(A.v21Tags.usage(t.id).products,0);assert.match(A.decor.component(c,true,true),/暂无.*商品/);A.actions['v19-tag-toggle']({id:c.id,source:'product',label:t.name,checked:'no'});A.actions['v21-tag-delete']({id:t.id});assert.ok(!A.v21Tags.list().some(x=>x.id===t.id));assert.ok(!A.v19Tags.catalog().some(r=>r.source==='product'&&r.label===t.name));const next=setup({storage});assert.ok(!next.A.v19Tags.catalog().some(r=>r.source==='product'&&r.label===t.name));
});

test('删除仅存在于新商品草稿的标签时清理草稿，返回编辑器可正常保存',()=>{
 const {A,go}=setup(),t=create(A,'草稿临时标签');go('M11');const hidden={value:''},root={querySelector:()=>hidden,querySelectorAll:()=>[{checked:true,value:t.id}]};A.v21Tags.changeProductTags({closest:()=>root});go('M25');A.actions['v21-tag-delete']({id:t.id});assert.ok(!A.v07.B.skuDraft.tagIds.includes(t.id));const h=go('M11'),tagIds=h.match(/type="hidden" name="tagIds" value="([^"]*)"/)?.[1];assert.equal(tagIds,'');assert.ok(A.forms['v19-product-save'](productForm(A,{tagIds})));
});
