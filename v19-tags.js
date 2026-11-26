/* V0.14：推荐标签读取本店现有资料，来源分组与已选标签随装修快照保存。 */
(()=>{'use strict';
const A=Club;if(A.v19Tags)return;
const {E,link}=A,M=A.v07,groups={service:{title:'服务标签',page:'M04',help:'服务分类、类型与已维护标签'},product:{title:'商品标签',page:'M05',help:'商品分类与已维护标签'},member:{title:'会员标签',page:'A07',help:'会员身份、成员类型与已维护标签'},legacy:{title:'历史已选标签',help:'保留原草稿标签，可取消勾选'}};
const split=value=>Array.isArray(value)?value.flatMap(split):typeof value==='string'?value.split(/[,，、\n]/).map(x=>x.trim()).filter(Boolean):[];
const unique=rows=>[...new Set(rows)];
const services=()=>A.services.filter(x=>x.project===A.S.project);
const products=()=>A.S.v02.v03.merchantProducts[A.S.project]||[];
const members=()=>M.members(A.S.project);
const cfg=s=>A.S.v02.v03.merchantServices[s.id]||{};
function recordTags(source,row){
 const extra=source==='service'?cfg(row):{};
 const fields=source==='service'?[row.category,row.kind,extra.category,extra.tags,row.tags]:source==='product'?[row.menuCategory,row.category,row.displayCategory,row.tags]:[row.grade,row.familyType,row.relation,row.tags];
 const labels=unique(fields.flatMap(split));return source==='product'&&A.v21Tags?.productLabels?A.v21Tags.productLabels(row,labels):labels;
}
function catalog(){
 const result=[];
 for(const [source,rows]of [['service',services()],['product',products()],['member',members()]]){
  const tags=new Map();for(const row of rows)for(const label of recordTags(source,row)){if(!tags.has(label))tags.set(label,[]);tags.get(label).push(row.id);}
  for(const [label,ids]of tags)result.push({source,label,ids});
 }
 // 标签管理可补充尚未关联商品的标签，已有分类及标签仍沿用原目录。
 for(const row of A.v19Tags?.managedCatalog?.()||[]){const existing=result.find(x=>x.source===row.source&&x.label===row.label);if(existing)existing.ids=unique([...existing.ids,...row.ids]);else result.push(row);}
 return result;
}
const refKey=r=>r.source+'\n'+r.label;
function selected(c){
 if(Array.isArray(c.recommendTagRefs)&&c.recommendTagsValue===String(c.tags||''))return c.recommendTagRefs.map(r=>({source:r.source,label:r.label}));
 const options=catalog();return unique(split(c.tags)).map(label=>{const option=options.find(x=>x.source==='service'&&x.label===label);return {source:option?'service':'legacy',label};});
}
function component(id){return A.v11Decoration.draft('home').components.find(c=>c.id===id&&c.type==='recommend');}
function store(c,refs){
 const seen=new Set();c.recommendTagRefs=refs.filter(r=>Object.hasOwn(groups,r.source)&&r.label&&!seen.has(refKey(r))&&seen.add(refKey(r))).map(r=>({source:r.source,label:r.label}));
 c.tags=unique(c.recommendTagRefs.map(r=>r.label)).join(',');c.recommendTagsValue=c.tags;
}
const summary=refs=>refs.length?'已选择 '+refs.length+' 个标签':'请选择标签（可多选）';
function chips(refs){return refs.length?refs.map(r=>'<span class="v19-tag-chip"><small>'+E(groups[r.source]?.title.replace('标签','')||'历史')+'</small>'+E(r.label)+'</span>').join(''):'<span class="v19-tag-placeholder">未选择标签，沿用系统推荐</span>';}
function picker(c){
 const refs=selected(c),options=catalog(),selectedKeys=new Set(refs.map(refKey));
 for(const ref of refs)if(!options.some(x=>refKey(x)===refKey(ref)))options.push({...ref,ids:[]});
 return '<div class="v19-tag-field" data-component="'+E(c.id)+'"><span class="v19-tag-label">推荐标签</span><input name="tags" type="hidden" value="'+E(c.tags||'')+'"><details class="v19-tag-dropdown"><summary><span data-v19-tag-summary>'+E(summary(refs))+'</span><span aria-hidden="true">⌄</span></summary><div class="v19-tag-options">'+Object.entries(groups).map(([source,group])=>{
 const rows=options.filter(x=>x.source===source);if(source==='legacy'&&!rows.length)return '';
 return '<fieldset class="v19-tag-group"><legend>'+E(group.title)+'</legend><p>'+E(group.help)+'</p>'+rows.map(r=>'<label class="v19-tag-option"><input type="checkbox" data-v19-tag data-source="'+source+'" data-label="'+E(r.label)+'" value="'+E(r.label)+'" '+(selectedKeys.has(refKey(r))?'checked':'')+'><span>'+E(r.label)+'</span><small>'+(r.ids?.length?r.ids.length+'项':'已选')+'</small></label>').join('')+(rows.length?'':'<p class="v19-tag-none">当前店铺暂无此类标签</p>')+'</fieldset>';
 }).join('')+'</div></details><div class="v19-tag-selected" data-v19-tag-selected aria-live="polite">'+chips(refs)+'</div><p class="v19-tag-help">服务、商品标签筛选推荐内容；同类标签满足任一项即可。会员标签限定展示受众，未选择时面向全部会员。</p><div class="v19-tag-maintain">'+Object.values(groups).filter(x=>x.page).map(g=>link('维护'+g.title.replace('标签','资料'),g.page,{},'link')).join('')+'</div></div>';
}
const editor=A.views.A10;
A.register({A10:(...args)=>{
 const html=editor(...args),id=html.match(/<div class="studio-block selected"[^>]*data-id="([^"]+)"/)?.[1],c=id&&component(id);
 if(!c)return html;
 return html.replace(/<label class="field"><span>推荐标签（逗号分隔）<\/span><input\b[^>]*name="tags"[^>]*><\/label>/,()=>picker(c));
}});
function updatePicker(root,c){
 const refs=selected(c),hidden=root.querySelector('[name="tags"]'),label=root.querySelector('[data-v19-tag-summary]'),list=root.querySelector('[data-v19-tag-selected]');
 if(hidden)hidden.value=c.tags;if(label)label.textContent=summary(refs);if(list)list.innerHTML=chips(refs);
}
function change(field){
 const root=field.closest('.v19-tag-field');if(!root)return;const c=component(root.dataset.component);if(!c)return;
 store(c,[...root.querySelectorAll('[data-v19-tag]')].filter(el=>el.checked).map(el=>({source:el.dataset.source,label:el.dataset.label})));updatePicker(root,c);A.save();
 // 保持下拉展开及键盘焦点，只替换画布中当前组件的内容。
 const section=document.querySelector('.studio-block[data-id="'+c.id+'"] > .decor-component');if(section)section.outerHTML=A.decor.component(c,true,true);
}
A.actions['v19-tag-toggle']=d=>{
 const c=component(d.id);if(!c)throw Error('请选择当前项目推荐组件');const ref={source:d.source,label:String(d.label||'')},refs=selected(c),exists=refs.some(r=>refKey(r)===refKey(ref));
 if(!Object.hasOwn(groups,ref.source)||!catalog().some(r=>refKey(r)===refKey(ref))&&!exists)throw Error('请选择本店已有标签');
 store(c,refs.filter(r=>refKey(r)!==refKey(ref)).concat(d.checked==='yes'||d.checked===true?[ref]:[]));A.save();A.render();
};
document.addEventListener('change',event=>{if(event.target.hasAttribute?.('data-v19-tag'))change(event.target);});
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const dropdown=event.target.closest?.('.v19-tag-dropdown');if(dropdown){dropdown.open=false;dropdown.querySelector('summary')?.focus();}});
const baseComponent=A.v07Decoration.component;
function audience(refs){
 const tags=refs.filter(r=>r.source==='member');if(!tags.length)return true;if(A.S.guest)return false;
 const member=members().find(m=>m.name===A.S.profile.nickname);return !!member&&tags.some(r=>recordTags('member',member).includes(r.label));
}
function itemRows(c,refs){
 const serviceTags=refs.filter(r=>['service','legacy'].includes(r.source)),productTags=refs.filter(r=>r.source==='product');
 const activeServices=services().filter(s=>!A.S.hiddenServices.includes(s.id)&&cfg(s).status!=='已下架'&&s.status!=='已下架');
 const serviceRows=serviceTags.length?activeServices.filter(s=>serviceTags.some(r=>r.source==='legacy'?(s.name+s.category+s.kind).includes(r.label):recordTags('service',s).includes(r.label))):productTags.length?[]:A.v05.list('recommend');
 const productRows=productTags.length?M.products().filter(p=>productTags.some(r=>recordTags('product',p).includes(r.label))):[];
 const mixed=[];for(let i=0;i<Math.max(serviceRows.length,productRows.length);i++){if(serviceRows[i])mixed.push({source:'service',row:serviceRows[i]});if(productRows[i])mixed.push({source:'product',row:productRows[i]});}
 return mixed.slice(0,Math.max(1,Number(c.count)||4));
}
function itemCard(entry){
 const {source,row}=entry,service=source==='service',name=service?A.v05.serviceName(row):row.name,image=service?A.v09.cover(row.id):row.image;
 let price;if(service)price=A.v12Pricing?.label?A.v12Pricing.label(row):A.quote(row).title;else{try{price=A.money(A.v09.sku(row).amount);}catch{price='查看详情';}}
 return '<a href="'+A.href(service?'U06':'U33',{id:row.id})+'" class="home-editorial"><img src="'+E(image||A.scene(A.S.project))+'" alt="'+E(name)+'"><div><h4>'+E(name)+'</h4><p>'+E(price||'查看详情')+'</p><span>查看'+(service?'服务':'商品')+' '+A.icon('arrow-right')+'</span></div></a>';
}
const contextualMore=(html,c)=>html.replace(A.href('U18',{kind:'recommend'}),A.href('U18',{kind:'recommend',recommend:c.id}));
A.v07Decoration.component=(c,editor,...args)=>{
 if(c?.type!=='recommend'||A.v07Decoration.renderingBase)return baseComponent(c,editor,...args);
 if(!c.visible&&!editor)return '';const refs=selected(c);if(!refs.length||!Array.isArray(c.recommendTagRefs))return baseComponent(c,editor,...args);
 const allowed=audience(refs);if(!allowed&&!editor)return '';
 const audienceNote=editor&&refs.some(r=>r.source==='member')?'<div class="v19-recommend-audience">受众：'+E(refs.filter(r=>r.source==='member').map(r=>r.label).join('、'))+' · 仅向匹配会员展示</div>':'';
 if(refs.every(r=>r.source==='member')){const original=contextualMore(baseComponent({...c,tags:''},editor,...args),c);return audienceNote?original.replace('<div class="home-editorial-list recommend">',audienceNote+'<div class="home-editorial-list recommend">'):original;}
 const heading=contextualMore(A.v05.sectionHead(c),c);
 const rows=itemRows(c,refs),onlyProducts=refs.some(r=>r.source==='product')&&!refs.some(r=>['service','legacy'].includes(r.source));
 return '<section class="decor-component home-component component-recommend v07-component variant-'+(Number(c.style)||0)+'" style="--component-gap:'+Number(c.gap||12)+'px;--component-radius:'+Number(c.radius||10)+'px">'+heading+audienceNote+(rows.length?'<div class="home-editorial-list recommend">'+rows.map(itemCard).join('')+'</div>':A.empty(onlyProducts?'当前标签下暂无在售商品':'当前标签下暂无推荐内容'))+'</section>';
};
const recommendationList=A.views.U18;
A.register({U18:(...args)=>{
 const id=A.params.get('recommend');if(!id)return recommendationList(...args);
 const c=A.S.decoration?.published[A.S.project+'-home']?.components.find(x=>x.id===id&&x.type==='recommend'&&x.visible),refs=c?selected(c):[];
 const allowed=c&&audience(refs);if(allowed&&refs.length&&refs.every(r=>r.source==='member'))return recommendationList(...args);
 const rows=allowed?itemRows({...c,count:services().length+products().length},refs):[];
 return A.v07UI.head(c?.title||'为你推荐','U01')+A.v07UI.pad('<div class="home-editorial-list recommend">'+rows.map(itemCard).join('')+(rows.length?'':A.empty('暂无适用的推荐内容'))+'</div>');
}});
A.v19Tags={catalog,selected,picker,change};
})();
