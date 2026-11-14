/* 展示层只读取客户权益矩阵与价目，不生成卡价、赠权周期或场地价格。 */
(()=>{
 const A=Club;
 A.icon=(name,cls='')=>`<i class="el-icon-${name} ${cls}" aria-hidden="true"></i>`;
 A.scene=project=>`assets/${{bj:'club-garden',zx:'club-courtyard',zj:'club-pool'}[project]}.jpg`;
 A.serviceIcon=s=>/私教/.test(s.kind)?'medal':/运动/.test(s.category)?'basketball':/茶/.test(s.name)?'coffee-cup':/宴/.test(s.name)?'knife-fork':/会议/.test(s.name)?'office-building':/SPA|女王/.test(s.name)?'moon':'collection';
 A.priceRows=s=>s.project==='zj'?[]:A.R['权益与价格明细'].rows.filter(r=>r[1]===A.projects[s.project]&&r[2].replace(/（.*|\(.*|空间/g,'')===s.name.replace(/（.*|\(.*|空间/g,''));
 A.rightText=(s,id)=>{
  const raw=s.rights[{ma:0,mc:1,na:2,nc:3}[id]]||'资料未列明';
  if(/^—/.test(raw))return '资料未列明 · 请咨询会所';
  if(/✅/.test(raw)&&!s.name.includes('SPA'))return s.kind.includes('私教')?'会籍私教权益 · 次数及规则请咨询':'场地免费使用';
  return raw.replace(/（原表勾选）/g,'').replace(/✅/g,'');
 };
 A.quote=s=>{
  const o=A.offer(s),raw=o.raw;
  if(A.S.guest)return {title:'查看服务权益',sub:'认证身份后查看适用价格',type:'neutral'};
  if(o.amount!==null)return {title:o.amount===0?'场地免费':o.text,sub:o.unit||(o.amount===0?(s.category.includes('运动')?'场地使用 · 私教另计':'场地使用权益'):''),type:o.amount===0?'free':'price'};
  if(o.arrival)return {title:'到场核验',sub:'泳池、器械健身无需预约',type:'free'};
  if(/^—/.test(raw))return {title:'权益未列明',sub:'请咨询会所',type:'neutral'};
  if(s.name.includes('SPA'))return {title:s.project==='bj'?'护理原价 ¥248起':'¥400—600',sub:s.project==='bj'?'实际结算价请咨询':'计价单位待会所确认',type:'price'};
  if(s.kind.includes('私教')){
   if(/✅/.test(raw))return {title:'会籍私教权益',sub:'适用次数及规则请咨询',type:'free'};
   const n=String(raw).match(/\d{3,5}/g);
   return n?{title:'¥'+Math.min(...n.map(Number)).toLocaleString('zh-CN')+(n.length>1?'起':''),sub:/元.?位/.test(raw)?'每位 · 课程另约':/元.?节/.test(raw)?'每节 · 课程另约':'课时及计价单位请咨询',type:'price'}:{title:'教练课程',sub:'费用请咨询会所',type:'neutral'};
  }
  if(s.project==='zx'&&s.name.includes('私宴'))return {title:'¥11,500起',sub:'套餐及人数请咨询',type:'price'};
  if(/9\.5折/.test(raw))return {title:'会籍赠时权益',sub:'超额服务价享9.5折 · 适用基价请咨询',type:'free'};
  if(/权益次数|享权益/.test(raw))return {title:'会籍次数权益',sub:'可用次数及使用规则请咨询',type:'free'};
  if(/按次收费|付费|收费/.test(raw))return {title:'按次收费',sub:'具体费用请咨询',type:'price'};
  return {title:'详询会所',sub:'查看适用权益与服务规则',type:'neutral'};
 };
 A.benefits=project=>project==='bj'?[
  {icon:'coffee-cup',title:'咖啡抵扣券',value:'10',unit:'张',note:'行政酒廊 · 面额及有效期待确认'},
  {icon:'goblet',title:'特调饮品兑换券',value:'2',unit:'张',note:'行政酒廊 · 指定饮品范围待确认'},
  {icon:'office-building',title:'会议室赠时',value:'4',unit:'小时',note:'超权益部分服务价9.5折，基价及周期待确认'},
  {icon:'time',title:'棋牌室赠时',value:'12',unit:'小时',note:'茶室与棋牌室两行重复列示；共享范围、周期待确认'},
  {icon:'collection',title:'茶品赠饮',value:A.S.identity==='mc'?'3':'2',unit:'壶',note:'仅限茶室及棋牌室使用；成人与儿童栏分别列示'}
 ]:project==='zx'?[
  {icon:'office-building',title:'会议空间',value:'会籍',unit:'权益',note:'多功能会议室、小型会议室；具体次数待确认'},
  {icon:'coffee-cup',title:'茶室与棋牌室',value:'会籍',unit:'权益',note:'享权益次数；具体额度及周期待确认'},
  {icon:'moon',title:'女王空间',value:'会籍',unit:'权益',note:'享权益次数；服务内容及额度待确认'}
 ]:[{icon:'coffee-cup',title:'年卡赠咖啡券',value:'10',unit:'张',note:'个人／家庭年卡；面额、发放及有效期待确认'}];
 A.memberSummary=()=>A.S.project==='bj'?'运动场地权益 · 咖啡10张 · 特调2张':A.S.project==='zx'?'运动健康 · 商务社交 · 休闲康养':'泳池与器械健身 · 到场核验使用';
})();
