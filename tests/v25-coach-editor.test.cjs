const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),load=require('./helpers/load.cjs');
const setup=()=>load(fs.existsSync(__dirname+'/../v25-coach-editor.js')?['v25-coach-editor.js']:[]);
function fields(A,extra={}){const X=A.v21Coaches,c=X.rows()[0],today=A.v07.iso();return {id:c.id,name:c.name,categoryId:c.categoryId,baseService:c.baseService,price:'520',duration:'60',image:c.photo,specialties:'力量与动作控制',status:'已上线',introduction:'以动作质量为核心的力量训练。',audience:'成人力量入门',coursePlan:'沟通评估\n热身准备\n力量训练\n放松反馈',trainingNotes:'请提前10分钟到场并携带毛巾。',dateStart:today,dateEnd:today,slots:'09:00\n14:00',...extra};}
function mockForm(ctx,values){ctx.scope.document.querySelector=q=>q==='[data-form="v21-coach-save"]'?{}:null;ctx.scope.FormData=class{constructor(){return Object.entries(values);}};}
function uploadFixture(ctx,files,mode='image'){
 const {A,scope}=ctx,readers=[],preview={src:'assets/home-coach.jpg',hidden:false},hidden={value:'assets/home-coach.jpg'},status={textContent:''},submit={disabled:false},name={value:'尚未保存的教练名称'};
 const form={isConnected:true,dataset:{v25Project:A.S.project},elements:{[mode]:hidden,name},querySelector:q=>q==='[data-v25-image-preview]'?preview:q==='[data-v25-upload-status]'?status:q==='button[type="submit"]'?submit:null};
 const tile={dataset:{field:mode},querySelector:q=>q==='[data-v25-image-preview]'?preview:null};
 const field={name:'v25-coach-image',files,value:'selected',form,dataset:{field:mode},closest:q=>q==='[data-v25-upload]'?tile:q==='form'?form:null};
 scope.FileReader=class{constructor(){readers.push(this);}readAsDataURL(){}finish(value='data:image/png;base64,aW1hZ2U='){this.result=value;this.onload();}};
 return {field,form,preview,hidden,status,submit,name,readers};
}

test('教练编辑使用商城三页签、单图主图上传，包含前台需要维护的全部字段',()=>{
 const{A,go}=setup(),c=A.v21Coaches.rows()[0],h=go('M27?id='+c.id);
 assert.match(h,/class="v25-coach-editor"/);
 for(const text of ['基本信息','课程介绍','预约排期'])assert.match(h,new RegExp('role="tab"[^>]*>'+text));
 for(const name of ['name','categoryId','baseService','price','duration','image','specialties','status','introduction','coursePlan','audience','trainingNotes','dateStart','dateEnd','slots'])assert.ok(h.includes('name="'+name+'"'),name);
 assert.equal((h.match(/type="file"/g)||[]).length,1);assert.match(h,/type="hidden" name="image"/);assert.match(h,/只上传一张/);assert.doesNotMatch(h,/图片地址|type="file"[^>]*multiple/);
});

test('教练页签切换保留全部未保存输入，校验错误定位对应页签且不写入数据',()=>{
 const ctx=setup(),{A,go}=ctx,c=A.v21Coaches.rows()[0];go('M27?id='+c.id);assert.ok(A.v25CoachEditor);
 const f=fields(A,{name:'尚未保存的新名称',image:'data:image/png;base64,aW1hZ2U='});mockForm(ctx,f);
 A.actions['v25-coach-tab']({tab:'schedule'});assert.equal(A.v25CoachEditor.tab(),'schedule');assert.match(A.views.M27(),/尚未保存的新名称/);assert.equal(c.name.includes('尚未保存'),false);
 assert.throws(()=>A.forms['v21-coach-save']({...f,price:'-1'}),/价格/);assert.equal(A.v25CoachEditor.tab(),'info');assert.equal(c.price,50000);
 assert.throws(()=>A.forms['v21-coach-save']({...f,introduction:''}),/介绍/);assert.equal(A.v25CoachEditor.tab(),'detail');
 assert.throws(()=>A.forms['v21-coach-save']({...f,slots:'25:00'}),/时段/);assert.equal(A.v25CoachEditor.tab(),'schedule');assert.equal(A.v25CoachEditor.draft().name,f.name);
});

test('截图所示人员排班入口使用单张主图上传并保留岗位资质排班和课程入口',()=>{
 const{A}=setup(),c=A.v21Coaches.rows()[0];let h='';A.modal=(title,body)=>h=body;A.actions['staff-edit']({id:c.id});
 assert.match(h,/v25-staff-editor/);assert.match(h,/name="v25-coach-image"/);assert.match(h,/type="hidden" name="photo"/);assert.doesNotMatch(h,/前台人物图片|图片地址|<input name="photo" type="text"/);
 for(const name of ['role','qualification','hours','service','status','specialties','introduction','coursePlan','audience'])assert.ok(h.includes('name="'+name+'"'),name);
 assert.match(h,new RegExp('#/M27\\?id='+c.id));
});

test('上传图片只更新本表单一张主图与预览，不重绘或提前保存，人员与私教均可使用',()=>{
 for(const mode of ['image','photo']){const ctx=setup(),{A}=ctx;assert.ok(A.v25CoachEditor?.uploadImage);let renders=0;A.render=()=>renders++;const c=A.v21Coaches.rows()[0],before=c.photo,f=uploadFixture(ctx,[{name:'教练.png',type:'image/png',size:1024}],mode);
 A.v25CoachEditor.uploadImage(f.field);assert.equal(f.submit.disabled,true);f.readers[0].finish();assert.equal(f.hidden.value,'data:image/png;base64,aW1hZ2U=');assert.equal(f.preview.src,f.hidden.value);assert.equal(f.submit.disabled,false);assert.match(f.status.textContent,/已选择/);assert.equal(f.name.value,'尚未保存的教练名称');assert.equal(renders,0);assert.equal(c.photo,before);}
});

test('主图拒绝多张、超限和不支持格式，保持原图且恢复保存按钮',()=>{
 for(const files of [[{name:'1.png',type:'image/png',size:1},{name:'2.png',type:'image/png',size:1}],[{name:'large.jpg',type:'image/jpeg',size:2*1024*1024+1}],[{name:'bad.svg',type:'image/svg+xml',size:1}]]){const ctx=setup(),{A}=ctx;assert.ok(A.v25CoachEditor?.uploadImage);const f=uploadFixture(ctx,files);A.v25CoachEditor.uploadImage(f.field);assert.equal(f.hidden.value,'assets/home-coach.jpg');assert.equal(f.readers.length,0);assert.equal(f.submit.disabled,false);assert.match(f.status.textContent,/一张|2 MB|JPG|PNG|WebP/);}
});

test('连续换图只接受最新结果，读取失败保留原图，离开店铺不回写旧表单',()=>{
 const ctx=setup(),{A}=ctx;assert.ok(A.v25CoachEditor?.uploadImage);const f=uploadFixture(ctx,[{name:'first.png',type:'image/png',size:1}]);
 A.v25CoachEditor.uploadImage(f.field);f.field.files=[{name:'second.png',type:'image/png',size:1}];A.v25CoachEditor.uploadImage(f.field);f.readers[0].finish('data:image/png;base64,b2xk');assert.equal(f.hidden.value,'assets/home-coach.jpg');assert.equal(f.submit.disabled,true);f.readers[1].finish('data:image/png;base64,bmV3');assert.equal(f.hidden.value,'data:image/png;base64,bmV3');
 A.v25CoachEditor.uploadImage(f.field);f.readers[2].onerror();assert.equal(f.hidden.value,'data:image/png;base64,bmV3');assert.equal(f.submit.disabled,false);assert.match(f.status.textContent,/失败/);
 A.v25CoachEditor.uploadImage(f.field);A.S.project='zx';f.readers[3].finish();assert.equal(f.hidden.value,'data:image/png;base64,bmV3');
});

test('保存主图、详情、须知和排期同步到首页组件、列表、详情、服务与预约，并可重载',()=>{
 const storage={},ctx=load(fs.existsSync(__dirname+'/../v25-coach-editor.js')?['v25-coach-editor.js']:[],{storage}),{A,go}=ctx,c=A.v21Coaches.rows()[0],f=fields(A,{image:'data:image/png;base64,aW1hZ2U='});
 go('M27?id='+c.id);A.forms['v21-coach-save'](f);assert.equal(c.trainingNotes,f.trainingNotes);assert.equal(c.photo,f.image);assert.equal(c.price,52000);
 const cfg=A.S.v02.v03.merchantServices[c.serviceId];assert.equal(cfg.cover,f.image);assert.equal(cfg.usageRules,f.trainingNotes);
 for(const h of [A.v21Coaches.card(c),go('U25'),go('U26?id='+c.id)])assert.ok(h.includes(f.image));
 const detail=go('U26?id='+c.id);for(const text of [f.introduction,f.audience,f.trainingNotes,'沟通评估','520.00'])assert.ok(detail.includes(text),text);
 A.actions['v21-coach-book']({id:c.id});const booking=go('U07?id='+c.serviceId);assert.match(booking,/v21-pt-calendar/);assert.match(booking,/14:00/);
 const next=load(fs.existsSync(__dirname+'/../v25-coach-editor.js')?['v25-coach-editor.js']:[],{storage});assert.match(next.go('M27?id='+c.id),/请提前10分钟到场/);
});

test('清除主图后禁止保存，切换店铺或打开另一教练不会带入旧草稿',()=>{
 const ctx=setup(),{A,go}=ctx,c=A.v21Coaches.rows()[0];go('M27?id='+c.id);assert.ok(A.v25CoachEditor);A.v25CoachEditor.capture(fields(A,{name:'只属于旧草稿'}));
 assert.throws(()=>A.forms['v21-coach-save'](fields(A,{image:''})),/主图|图片/);assert.notEqual(c.name,'只属于旧草稿');
 const second=A.v21Coaches.rows()[1];go('M27?id='+second.id);assert.notEqual(A.v25CoachEditor.draft().name,'只属于旧草稿');assert.equal(A.v25CoachEditor.tab(),'info');
 A.S.project='zx';assert.match(go('M27?id='+c.id),/请选择本店私教/);assert.throws(()=>A.forms['v21-coach-save'](fields(A,{id:c.id})),/本店/);
});

test('取消或离开编辑页后清理草稿，再次编辑读取人员入口刚保存的资料',()=>{
 const vm=require('node:vm'),ctx=load([],{skipScripts:['v25-coach-editor.js']}),listeners={}, {A,go,scope}=ctx;
 scope.document.addEventListener=(type,fn)=>{(listeners[type]??=[]).push(fn);};
 scope.document.dispatchEvent=()=>{for(const fn of listeners['club:before-render']||[])fn();};
 vm.runInContext(fs.readFileSync(__dirname+'/../v25-coach-editor.js','utf8'),scope);
 const c=A.v21Coaches.rows()[0];go('M27?id='+c.id);A.v25CoachEditor.capture(fields(A,{name:'应被丢弃的草稿'}));go('M26');
 A.forms['staff-save']({id:c.id,name:'人员入口最新名称',role:'健身教练',service:c.baseService,status:'启用',hours:'09:00—18:00',trainingNotes:'人员入口最新须知'});
 const html=go('M27?id='+c.id);assert.doesNotMatch(html,/应被丢弃的草稿/);assert.match(html,/人员入口最新名称/);assert.match(html,/人员入口最新须知/);assert.equal(A.v25CoachEditor.tab(),'info');
});

test('非教练人员修改排班不要求上传教练主图，已有教练仍需主图',()=>{
 const{A}=setup(),p=A.S.staff.find(x=>x.project===A.S.project&&!/教练/.test(x.role)&&!x.photo);assert.ok(p);let html='';A.modal=(title,body)=>html=body;A.actions['staff-edit']({id:p.id});assert.doesNotMatch(html,/教练主图/);assert.match(html,/人员照片/);
 assert.doesNotThrow(()=>A.forms['staff-save']({id:p.id,name:p.name,role:p.role,hours:'10:00—19:00',service:p.services[0],status:'启用',photo:''}));assert.equal(p.hours,'10:00—19:00');
 const c=A.v21Coaches.rows()[0];assert.throws(()=>A.forms['staff-save']({id:c.id,name:c.name,role:'健身教练',photo:''}),/主图/);
});

test('图片读取期间禁止提交与换页签，断开表单后不回写；选错文件可再次选择同名图片',()=>{
 const ctx=setup(),{A,go}=ctx,c=A.v21Coaches.rows()[0];go('M27?id='+c.id);const f=uploadFixture(ctx,[{name:'教练.png',type:'image/png',size:1}]);ctx.scope.document.querySelector=q=>q==='[data-form="v21-coach-save"]'?f.form:null;A.v25CoachEditor.uploadImage(f.field);
 assert.throws(()=>A.forms['v21-coach-save'](fields(A),f.form),/正在读取/);assert.throws(()=>A.actions['v25-coach-tab']({tab:'detail'}),/正在读取/);
 f.form.isConnected=false;f.readers[0].finish();assert.equal(f.hidden.value,'assets/home-coach.jpg');
 const invalid=uploadFixture(ctx,[{name:'wrong.png',type:'image/svg+xml',size:1}]);A.v25CoachEditor.uploadImage(invalid.field);assert.equal(invalid.field.value,'');
});
