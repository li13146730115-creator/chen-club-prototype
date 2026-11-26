/* 门店商品标签管理；商品维护与首页推荐共用目录。 */
(()=>{'use strict';
const A=Club;if(A.v21Tags)return;
const {E,btn,link,input,form,table}=A,M=A.v07,shop=()=>A.S.project,page='M25';
const split=value=>Array.isArray(value)?value.flatMap(split):typeof value==='string'?value.split(/[,，、\n]/).map(x=>x.trim()).filter(Boolean):[];
const unique=rows=>[...new Set(rows)],normal=value=>String(value??'').normalize('NFKC').trim().replace(/\s+/g,' '),nameKey=value=>normal(value).toLocaleLowerCase();
const productRows=(project=shop())=>A.S.v02.v03.merchantProducts[project]||[];
const defaultProductLabels=p=>unique([p.menuCategory,p.category,p.displayCategory,p.tags].flatMap(split));
function ensure(project=shop()){
 if(!Object.hasOwn(A.projects,project))throw Error('请选择有效店铺');
 const state=A.S.v21Tags??={stores:{}};state.stores??={};
 if(state.stores[project]){const store=state.stores[project];store.managedNames??=store.tags.map(t=>t.name);return store;}
 const products=productRows(project),categories=products.flatMap(p=>[p.menuCategory,p.category,p.tags].flatMap(split)).filter(label=>!label.includes('待维护'));
 // 从实际分类建立初始标签；“茶饮”是咖啡茶饮的细分标签，留给商家按需关联。
 const names=unique([...['咖啡茶饮','酒水饮料','精选酒饮','甜点小食'].filter(label=>categories.includes(label)),...categories,...(categories.includes('咖啡茶饮')?['茶饮']:[])]);
 const tags=names.map((name,i)=>({id:'V21-TAG-'+project+'-'+i,project,name,created:A.C.now()}));
 const store=state.stores[project]={tags,managedNames:[...names]};
 for(const p of products){const labels=defaultProductLabels(p),matched=tags.filter(t=>labels.includes(t.name));if(!matched.length)continue;p.tagIds=unique([...split(p.tagIds),...matched.map(t=>t.id)]);p.tags=unique([...split(p.tags),...matched.map(t=>t.name)]);}
 return store;
}
const list=(project=shop())=>ensure(project).tags;
function productLabels(p,defaults=defaultProductLabels(p)){
 const tags=list(),managed=new Set(ensure().managedNames),ids=new Set(split(p.tagIds));
 // 受管标签以实际选择为准，取消后不能被同名商品分类重新加入；未受管的旧分类仍可筛选。
 // 曾受管名称持续保留，防止标签改名或删除后从旧商品分类中重新出现。
 return unique([...defaults.filter(label=>!managed.has(label)),...split(p.tags),...tags.filter(t=>ids.has(t.id)).map(t=>t.name)]);
}
function assertShop(project){if(project&&project!==shop())throw Error('只能维护当前店铺的标签，请重新打开表单');}
function tagById(id){const tag=list().find(t=>t.id===id&&t.project===shop());if(!tag)throw Error('请选择本店有效标签');return tag;}
function validName(value,id=''){
 const name=normal(value);if(!name||name.length>20||/[,，、\n\r\x00-\x1f]/.test(name)||/[\n\r\x00-\x1f]/.test(String(value??'')))throw Error('标签名称须为 1—20 个字符，不能包含逗号或换行');
 if(list().some(t=>t.id!==id&&nameKey(t.name)===nameKey(name)))throw Error('本店已存在同名标签，请勿重复创建');return name;
}
function components(bucket){return Object.entries(A.S.decoration?.[bucket]||{}).filter(([key])=>key.startsWith(shop()+'-')).flatMap(([,snapshot])=>snapshot.components||[]).filter(c=>c.type==='recommend');}
const usesReference=(c,tag)=>(c.recommendTagRefs||[]).some(r=>r.source==='product'&&r.label===tag.name);
const usesProduct=(p,tag)=>split(p.tagIds).includes(tag.id)||split(p.tags).includes(tag.name);
function usage(id){const tag=tagById(id);return {products:productRows().filter(p=>usesProduct(p,tag)).length,drafts:components('drafts').filter(c=>usesReference(c,tag)).length,published:components('published').filter(c=>usesReference(c,tag)).length};}
function renameReferences(tag,name){
 for(const p of productRows())if(usesProduct(p,tag)){p.tagIds=unique([...split(p.tagIds),tag.id]);p.tags=unique([...split(p.tags).map(label=>label===tag.name?name:label),name]);}
 const draft=M.B.skuDraft;if(draft&&(!draft.project||draft.project===shop())&&(split(draft.tagIds).includes(tag.id)||split(draft.tags).includes(tag.name)))draft.tags=unique(split(draft.tags).map(label=>label===tag.name?name:label));
 for(const bucket of ['drafts','published'])for(const c of components(bucket))if(usesReference(c,tag)){
  c.recommendTagRefs=c.recommendTagRefs.map(r=>r.source==='product'&&r.label===tag.name?{...r,label:name}:r);
  const oldStillSelected=c.recommendTagRefs.some(r=>r.label===tag.name),labels=split(c.tags).flatMap(label=>label===tag.name?(oldStillSelected?[name,tag.name]:[name]):[label]);
  c.tags=unique([...labels,...c.recommendTagRefs.map(r=>r.label)]).join(',');c.recommendTagsValue=c.tags;
 }
}
function saveTag(f){
 assertShop(f.project);const tag=f.id?tagById(f.id):null,name=validName(f.name,tag?.id),store=ensure();store.managedNames=unique([...store.managedNames,name]);
 let saved;if(tag){if(tag.name!==name)renameReferences(tag,name);tag.name=name;tag.updated=A.C.now();saved=tag;}else{saved={id:A.C.uid('TAG'),project:shop(),name,created:A.C.now()};list().push(saved);}
 A.save();A.close();A.render();A.toast(tag?'标签已更新，关联商品与推荐已同步':'标签已创建，可在商品及推荐组件中选择');return saved;
}
function deleteTag(d){
 assertShop(d.project);const tag=tagById(d.id),used=usage(tag.id);
 if(used.products||used.drafts||used.published)throw Error('此标签正在使用：关联 '+used.products+' 个商品、'+used.drafts+' 个草稿推荐、'+used.published+' 个已发布推荐。请先移除关联后再删除。');
 ensure().tags=list().filter(t=>t.id!==tag.id);
 const draft=M.B.skuDraft;if(draft&&(!draft.project||draft.project===shop())){draft.tagIds=split(draft.tagIds).filter(id=>id!==tag.id);draft.tags=split(draft.tags).filter(label=>label!==tag.name);}
 A.save();A.render();A.toast('标签已删除');
}
function editTag(d={}){
 assertShop(d.project);const tag=d.id?tagById(d.id):null;
 A.modal(tag?'编辑标签':'新增标签',form('v21-tag-save','<input type="hidden" name="id" value="'+E(tag?.id||'')+'"><input type="hidden" name="project" value="'+E(shop())+'">'+input('name','标签名称',tag?.name||'','text','maxlength="20" required')+'<p class="v21-tag-form-help">用于本店商品分类与首页“为你推荐”筛选。同店标签不能重名，改名会同步已关联的商品与推荐。</p>','保存标签'));
}
function tagManagement(){
 const tags=list(),query=A.filters.v21TagQuery||'',rows=tags.filter(t=>!query||t.name.includes(query));
 return '<div class="v21-tags-admin"><div class="v07-pc-toolbar"><div><h3>商品标签</h3><p class="muted">维护本店标签，为商品分组，并在首页“为你推荐”中选择展示。</p></div>'+btn('＋ 新增标签','v21-tag-edit',{},'btn gold-btn')+'</div><div class="v21-tag-stats"><div><span>本店标签</span><b>'+tags.length+'</b></div><div><span>已关联商品</span><b>'+productRows().filter(p=>tags.some(t=>usesProduct(p,t))).length+'</b></div><div><span>已用于推荐</span><b>'+tags.filter(t=>{const u=usage(t.id);return u.drafts||u.published;}).length+'</b></div></div>'+form('v21-tag-search','<div class="v21-tag-search">'+input('query','标签名称',query,'search','placeholder="搜索本店标签"')+'</div>','查询')+table(['标签名称','关联商品','装修草稿','已发布推荐','创建时间','操作'],rows.map(t=>{const u=usage(t.id);return ['<span class="v21-admin-tag">'+E(t.name)+'</span>',u.products+' 个',u.drafts+' 处',u.published+' 处',E(t.created||'—'),btn('编辑','v21-tag-edit',{id:t.id,project:shop()},'link')+' '+btn('删除','v21-tag-delete',{id:t.id,project:shop()},'link v21-tag-delete')];}))+'<div class="v21-tag-note">使用中的标签不能删除。请先在'+link('商品管理','M05',{},'link')+'取消标签，并从'+link('首页装修','A10',{},'link')+'的草稿及已发布推荐中移除。</div></div>';
}
function validateIds(value){
 if(typeof value!=='string'&&!Array.isArray(value))throw Error('请选择本店有效商品标签');const ids=unique(split(value));if(ids.some(id=>!list().some(t=>t.id===id&&t.project===shop())))throw Error('商品包含无效或其他店铺的标签，请重新选择');return ids;
}
function productPicker(d){
 const ids=new Set(split(d.tagIds));return '<fieldset class="v21-product-tags"><legend>商品标签</legend><input type="hidden" name="tagIds" value="'+E([...ids].join(','))+'"><input type="hidden" name="v21TagProject" value="'+E(shop())+'"><div class="v21-product-tag-options">'+list().map(t=>'<label><input type="checkbox" data-v21-product-tag value="'+E(t.id)+'" '+(ids.has(t.id)?'checked':'')+'><span>'+E(t.name)+'</span></label>').join('')+'</div><p>可多选，用于首页“为你推荐”筛选。'+link('管理标签',page,{},'link')+'</p></fieldset>';
}
function changeProductTags(field){
 const root=field.closest('.v21-product-tags');if(!root)return;const ids=validateIds([...root.querySelectorAll('[data-v21-product-tag]')].filter(el=>el.checked).map(el=>el.value)),hidden=root.querySelector('[name="tagIds"]');if(hidden)hidden.value=ids.join(',');if(M.B.skuDraft)M.B.skuDraft.tagIds=ids;
}
const productEditor=A.views.M11,productSave=A.forms['v19-product-save'];
A.register({M11:(...args)=>{const html=productEditor(...args);return html.replace(/<label class="field"><span>商品主图<\/span>/,match=>productPicker(M.B.skuDraft||{})+match);}});
A.forms['v19-product-save']=f=>{
 assertShop(f.v21TagProject);const d=M.B.skuDraft,id=A.params.get('id')||d?.editId||'',existing=id?productRows().find(p=>p.id===id):null;
 if(id&&!existing||d?.project&&d.project!==shop())throw Error('请选择本店商品进行编辑');
 const ids=Object.hasOwn(f,'tagIds')?validateIds(f.tagIds):split(existing?.tagIds),known=new Set(productRows().map(p=>p.id)),legacy=split(existing?.tags).filter(label=>!list().some(t=>t.name===label));
 const result=productSave(f),p=result||productRows().find(p=>id?p.id===id:!known.has(p.id));if(!p)throw Error('商品保存失败，请重试');
 p.tagIds=ids;p.tags=unique([...legacy,...ids.map(id=>tagById(id).name)]);A.save();A.render();return p;
};
const productsView=A.views.M05,recommendEditor=A.views.A10;
A.register({M05:(...args)=>'<div class="v21-tags-context">'+link('标签管理',page,{},'btn light')+'</div>'+productsView(...args),A10:(...args)=>recommendEditor(...args).replace('<div class="v19-tag-maintain">','<div class="v19-tag-maintain">'+link('管理商品标签',page,{},'link')),[page]:tagManagement});
if(!A.pages.some(p=>p.id===page))A.pages.push({id:page,title:'标签管理',role:'M',desc:'本店商品标签、关联商品与推荐使用情况',hidden:false});
const group=A.navigationGroups.find(g=>g.ids.includes('M05'));if(group&&!group.ids.includes(page))group.ids.splice(group.ids.indexOf('M05')+1,0,page);
A.forms['v21-tag-save']=saveTag;A.forms['v21-tag-search']=f=>{A.filters.v21TagQuery=String(f.query||'').trim();A.render();};A.actions['v21-tag-edit']=editTag;A.actions['v21-tag-delete']=deleteTag;
document.addEventListener('change',event=>{if(event.target.hasAttribute?.('data-v21-product-tag'))changeProductTags(event.target);});
A.v21Tags={list,usage,changeProductTags,productLabels};
A.v19Tags.managedCatalog=()=>list().map(t=>({source:'product',label:t.name,ids:productRows().filter(p=>usesProduct(p,t)).map(p=>p.id)}));
for(const project of Object.keys(A.projects))ensure(project);A.save();
})();
