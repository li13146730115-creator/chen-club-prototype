/* 商家商品添加／编辑：沿用原商城四页签，复用商品、标签和会员价保存链。 */
(()=>{'use strict';
const A=Club;if(A.v22ProductEditor)return;
const {E,input,select,link,btn,table}=A,M=A.v07,B=M.B,N=A.v09;
const previousView=A.views.M11,previousSave=A.forms['v19-product-save'];
const tabs=[['info','商品信息'],['specs','规格库存'],['detail','商品详情'],['other','其他设置']];
let context='',active='info',error='';
const lines=value=>(Array.isArray(value)?value:String(value||'').split(/\n/)).map(x=>String(x).trim()).filter(Boolean);
function draft(){return B.skuDraft;}
function capture(values){
 const d=draft();if(!d||!values)return;
 Object.assign(d,values);d.images=lines(values.images??d.images);if(Object.hasOwn(values,'tagIds'))d.tagIds=String(values.tagIds).split(',').filter(Boolean);
 d.skus.forEach((s,i)=>{for(const [prop,key]of [['label','label-'],['price','price-'],['stock','stock-'],['image','skuImage-']])if(Object.hasOwn(values,key+i))s[prop]=values[key+i];});
}
function captureForm(){const f=document.querySelector('[data-form="v19-product-save"]');if(f)capture(Object.fromEntries(new FormData(f)));}
function setTab(tab){if(!tabs.some(t=>t[0]===tab))return;captureForm();active=tab;error='';A.render();}
const area=(name,label,value,rows=3,extra='')=>'<label class="field"><span>'+E(label)+'</span><textarea name="'+name+'" rows="'+rows+'" '+extra+'>'+E(value||'')+'</textarea></label>';
function picture(key,value,label){return '<label class="v22-image-tile" aria-label="'+E(label)+'"><input type="file" name="v22-image-upload" data-field="'+key+'" accept="image/png,image/jpeg,image/webp,image/gif">'+(value?'<img src="'+E(value)+'" alt="'+E(label)+'"><span>更换图片</span>':'<i class="el-icon-camera" aria-hidden="true"></i><span>上传图片</span>')+'</label>';}
function mainImage(d){return '<div class="v22-image-row"><div class="v22-field-label"><span>商品主图</span><em>*</em></div><div>'+picture('image',d.image||'','上传商品主图')+'<input type="hidden" name="image" value="'+E(d.image||'')+'"><p class="v22-tip">建议尺寸 800 × 800 px；支持 JPG、PNG、WebP、GIF，单张不超过 2 MB。</p></div></div>';}
function gallery(d){const images=lines(d.images);return '<div class="v22-image-row"><div class="v22-field-label">商品轮播图</div><div><div class="v22-image-list">'+images.map((src,i)=>'<div class="v22-gallery-tile"><img src="'+E(src)+'" alt="商品轮播图 '+(i+1)+'">'+btn('×','v22-gallery-remove',{i},'v22-image-remove')+'</div>').join('')+(images.length<10?'<label class="v22-image-tile v22-add-image" aria-label="上传商品轮播图"><input type="file" name="v22-image-upload" data-field="images" multiple accept="image/png,image/jpeg,image/webp,image/gif"><i class="el-icon-plus" aria-hidden="true"></i><span>添加图片</span></label>':'')+'</div><textarea name="images" hidden>'+E(images.join('\n'))+'</textarea><p class="v22-tip">最多 10 张，可逐张移除。首图建议与商品封面保持一致。</p></div></div>';}
function info(d,tags){return '<div class="v22-form-column"><div class="v22-static-field"><span>商品类型<em>*</em></span><b>实体商品</b></div>'+input('name','商品名称',d.name||'','text','maxlength="50" placeholder="请输入商品名称" required')+input('menuCategory','店铺商品分类',d.menuCategory||'咖啡茶饮','text','required list="v22-product-categories"')+'<datalist id="v22-product-categories">'+[...new Set(M.products().map(p=>p.menuCategory).filter(Boolean))].map(c=>'<option value="'+E(c)+'">').join('')+'</datalist>'+input('unitName','单位',d.unitName||'','text','maxlength="10" placeholder="如：杯、份、件"')+input('keyword','商品关键字',d.keyword||'','text','maxlength="100" placeholder="多个关键字用逗号分隔"')+area('intro','商品简介',d.intro,3,'maxlength="100" placeholder="请输入商品简介，最多 100 字"')+tags+mainImage(d)+gallery(d)+'</div>';}
function specs(d){return '<div class="v22-specs"><div class="v22-section-title"><h3>商品规格</h3><span>'+d.skus.length+' 个规格</span></div><p class="v22-tip">分别维护规格售价、库存和图片；购物车按所选规格计价。</p>'+table(['规格名称','售价（元）','库存','规格图','操作'],d.skus.map((s,i)=>['<input name="label-'+i+'" aria-label="规格 '+(i+1)+' 名称" value="'+E(s.label)+'" required placeholder="请输入规格名称">','<input name="price-'+i+'" aria-label="规格 '+(i+1)+' 售价" type="number" min="0.01" step="0.01" value="'+E(s.price)+'" required>','<input name="stock-'+i+'" aria-label="规格 '+(i+1)+' 库存" type="number" min="0" step="1" value="'+E(s.stock)+'" required>','<div class="v22-sku-image">'+picture('skuImage-'+i,s.image||d.image||'','规格 '+(i+1)+' 图片')+'<input type="hidden" name="skuImage-'+i+'" value="'+E(s.image||d.image||'')+'"></div>',btn('删除','v19-sku-remove',{i},'link')]))+btn('＋ 添加规格','v19-sku-add',{},'btn light')+A.v13Merchant.matrix(d.editId,d.skus.map(s=>[s.id,s.label||'新规格']),d)+'</div>';}
function detail(d){return '<div class="v22-detail-editor">'+area('detail','商品详情',d.detail,17,'placeholder="填写商品介绍、规格说明和使用须知" required')+'<div class="v22-tip v22-detail-tip">此处维护会员端商品详情中的介绍内容。</div></div>';}
function other(d){return '<div class="v22-form-column">'+select('fulfilment','配送方式',[['store','到店使用／到店自提'],['shipping','到店自提及快递配送']],d.fulfilment||'store')+select('status','商品状态',[['已上架','上架'],['已下架','下架']],d.status||'已上架')+select('passService','次卡对应服务',[['','普通商品（不关联次卡）'],...A.services.filter(s=>s.project===M.shop()).map(s=>[s.id,A.v05.serviceName(s)])],d.passService||'')+'<div data-v22-pass-fields'+(d.passService?'':' hidden')+'><div class="v22-subheading">次卡使用设置</div>'+select('passSkuId','次卡适用服务规格',d.passService?A.v10.variants(d.passService):[['','请先选择对应服务']],d.passSkuId||(d.passService?A.v10.variants(d.passService)[0]?.[0]:''))+input('passCount','次卡次数',d.passCount||5,'number','min="1" step="1"')+input('passDays','有效天数',d.passDays||365,'number','min="1" step="1"')+select('displayCategory','次卡展示分类',['运动健康','商务社交','休闲康养'].map(x=>[x,x]),d.displayCategory||N.category(d.passService))+area('cardRules','次卡使用规则',d.cardRules||'按对应服务抵扣次数，请在有效期内使用。')+'<div class="v22-image-row"><div class="v22-field-label">次卡卡面</div><div>'+picture('cardCover',d.cardCover||d.image||'','上传次卡卡面')+'<input type="hidden" name="cardCover" value="'+E(d.cardCover||d.image||'')+'"><p class="v22-tip">购买后展示在会员卡包中，可单独设置卡面图片。</p></div></div></div></div>';}
function view(){
 if(B.skuDraft)B.skuDraft.images=lines(B.skuDraft.images);
 const old=previousView(),d=draft(),key=M.shop()+'|'+d.editId;
 if(context!==key){context=key;active='info';error='';}
 const tags=old.match(/<fieldset class="v21-product-tags">[\s\S]*?<\/fieldset>/)?.[0]||'',content=[info(d,tags),specs(d),detail(d),other(d)],index=tabs.findIndex(t=>t[0]===active);
 return '<div class="v22-product-editor"><header class="v22-editor-header"><div>'+link('‹ 返回','M05',{},'v22-back')+'<h2>'+E(d.editId?'编辑商品':'添加商品')+'</h2></div><span>'+E(A.projects[M.shop()])+' · 店铺商品</span></header><div class="v22-editor-card"><nav class="v22-product-tabs" role="tablist" aria-label="商品编辑分组">'+tabs.map(([id,title])=>'<button type="button" role="tab" id="v22-tab-'+id+'" aria-controls="v22-panel-'+id+'" aria-selected="'+(active===id)+'" data-action="v22-product-tab" data-tab="'+id+'">'+title+'</button>').join('')+'</nav><form data-form="v19-product-save" novalidate><div class="error'+(error?' show':'')+'" role="alert">'+E(error)+'</div>'+tabs.map(([id],i)=>'<section class="v22-product-panel" id="v22-panel-'+id+'" role="tabpanel" aria-labelledby="v22-tab-'+id+'"'+(active!==id?' hidden':'')+'>'+content[i]+'</section>').join('')+'<footer class="v22-product-footer"><div>'+link('取消','M05',{},'btn light')+'</div><div>'+(index?btn('上一步','v22-product-tab',{tab:tabs[index-1][0]},'btn light'):'')+(index<tabs.length-1?btn('下一步','v22-product-tab',{tab:tabs[index+1][0]},'btn light'):'')+'<button class="btn" type="submit">保存商品</button></div></footer></form></div></div>';
}
A.register({M11:view});
A.actions['v22-product-tab']=d=>setTab(d.tab);
A.actions['v19-sku-add']=()=>{captureForm();draft().skus.push({id:A.C.uid('SPEC'),label:'',price:'',stock:0,image:''});active='specs';A.render();};
A.actions['v19-sku-remove']=d=>{captureForm();if(draft().skus.length<2)throw Error('至少保留一个商品规格');draft().skus.splice(Number(d.i),1);active='specs';A.render();};
A.actions['v22-gallery-remove']=d=>{captureForm();draft().images.splice(Number(d.i),1);A.render();};
A.forms['v19-product-save']=f=>{
 try{
  const unitName=String(f.unitName??draft()?.unitName??'').trim(),keyword=String(f.keyword??draft()?.keyword??''),intro=String(f.intro??draft()?.intro??'');
  if(unitName.length>10)throw Error('商品单位最多 10 个字符');if(keyword.length>100)throw Error('商品关键字最多 100 个字符');if(intro.length>100)throw Error('商品简介最多 100 个字符');
  if(!f.name?.trim()||!f.menuCategory?.trim()||!f.image?.trim())throw Error('请填写商品名称、店铺商品分类和商品主图');if(!f.detail?.trim()){active='detail';throw Error('请填写商品详情');}
  const p=previousSave(f);Object.assign(p,{unitName,keyword,intro});error='';A.save();return p;
 }catch(e){if(A.route==='M11'){capture(f);if(/规格|库存|售价|价格|会员价/.test(e.message))active='specs';else if(/次卡/.test(e.message))active='other';else if(!/商品详情/.test(e.message))active='info';error=e.message;A.render();}throw e;}
};
document.addEventListener('change',async event=>{
 const el=event.target;if(el.name!=='v22-image-upload')return;
 const files=Array.from(el.files||[]);if(!files.length)return;
 if(files.some(file=>!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>2*1024*1024)){A.toast('请选择 2 MB 以内的 JPG、PNG、WebP 或 GIF 图片');el.value='';return;}
 const key=el.dataset.field,owner=draft(),ownerContext=context;captureForm();
 try{const images=await Promise.all(files.map(file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('图片读取失败，请重试'));reader.readAsDataURL(file);})));if(draft()!==owner||context!==ownerContext||A.route!=='M11')return;
  if(key==='images'){if(owner.images.length+images.length>10)throw Error('商品轮播图最多 10 张');owner.images.push(...images);}else if(key.startsWith('skuImage-')){const i=Number(key.slice(9));if(owner.skus[i])owner.skus[i].image=images[0];}else owner[key]=images[0];
  A.render();A.toast('图片已载入，保存商品后生效');
 }catch(e){A.toast(e.message);}
});
// 先于旧服务选择器的重绘捕获数组草稿，避免轮播图被旧表单转成字符串。
document.addEventListener('change',event=>{if(event.target.name==='passService'&&event.target.form?.dataset.form==='v19-product-save')captureForm();},true);
A.v22ProductEditor={capture,tab:()=>active};
})();
