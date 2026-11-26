/* V0.21：精简预约凭证呈现，状态、归属和可用操作继续由原 U09 决定。 */
(()=>{'use strict';
const A=Club;if(A.v21Voucher)return;
const original=A.views.U09;
function schedule(value){
 const match=value.match(/^(\d{4})-(\d{2})-(\d{2})\s+(.+)$/);
 if(!match)return '<p class="v05-ticket-when">'+value+'</p>';
 const[,year,month,day,time]=match,date=year+'-'+month+'-'+day;
 const weekday=['周日','周一','周二','周三','周四','周五','周六'][new Date(date+'T12:00:00').getDay()];
 return '<div class="v21-voucher-schedule" aria-label="预约时间 '+value+'"><time datetime="'+date+'"><span>'+Number(month)+'月'+Number(day)+'日</span><small>'+year+' · '+weekday+'</small></time><div class="v21-voucher-time"><small>预约时段</small><strong>'+time+'</strong></div></div>';
}
function voucher(html){
 if(!html.includes('class="v05-ticket-page"'))return html;
 let changed=false;
 html=html.replace(/<section class="v05-ticket ([^"]+)">([\s\S]*?)<\/section>/,(_all,status,body)=>{
  const top=body.match(/^<div class="v05-ticket-top"><span>[\s\S]*?<\/span>(<b>[\s\S]*?<\/b>)<\/div>/);
  const heading=body.match(/<h2>([\s\S]*?)<\/h2><p class="v05-ticket-when">([\s\S]*?)<\/p><small>([\s\S]*?)<\/small>/);
  const facts=body.match(/<div class="v05-ticket-divider"><\/div><div class="v05-ticket-facts">([\s\S]*?)<\/div>$/);
  if(!top||!heading||!facts)return _all;
  const rows=[...facts[1].matchAll(/<div class="kv"><span>([\s\S]*?)<\/span><strong>([\s\S]*?)<\/strong><\/div>/g)];
  // 若原视图新增了未识别字段，保留原输出，避免布局转换丢失业务信息。
  if(rows.map(row=>row[0]).join('')!==facts[1])return _all;
  const code=rows.find(row=>row[1]==='凭证编号'),people=rows.find(row=>row[1]==='到场人数');
  if(!code||!people)return _all;
  const secondary=rows.filter(row=>row!==code).map(row=>row[0]).join('');
  const mark=A.v20Brand?.wordmark('voucher')||'<span class="v21-voucher-brand">宸CLUB</span>';
  body=body.replace(top[0],'<div class="v05-ticket-top"><span>'+mark+'</span>'+top[1]+'</div>');
  body=body.replace(heading[0],'<div class="v21-voucher-heading"><h2>'+heading[1]+'</h2><p class="v21-voucher-location"><span>'+heading[3]+'</span><span>'+people[2]+'到场</span></p></div>'+schedule(heading[2]));
  body=body.replace(facts[0],'<footer class="v21-voucher-code">'+code[0]+'</footer>');
  changed=true;
  return '<section class="v05-ticket '+status+'">'+body+'</section><details class="v21-voucher-details"><summary>预约详情'+A.icon('arrow-down')+'</summary><div class="v05-ticket-facts">'+secondary+'</div></details>';
 });
 if(!changed)return html;
 html=html.replace('class="v05-ticket-page"','class="v05-ticket-page v21-voucher-page"').replace(/(<details class="v05-rules")\s+open(?=[\s>])/g,'$1');
 // 分享仍由 v14 决定是否提供，仅将已存在的分享区纳入凭证布局作用域。
 const share=html.match(/<div class="mp-pad v07-pad">(<div class="v14-voucher-share">[\s\S]*?<\/div>)<\/div>$/);
 const actions=/(<div class="v05-ticket-actions">[\s\S]*?<\/div>)<\/div><\/div>/;
 if(share&&actions.test(html)){html=html.slice(0,-share[0].length);html=html.replace(actions,(_all,buttons)=>buttons+share[1]+'</div></div>');}
 return html;
}
A.register({U09:()=>voucher(original())});
A.v21Voucher={version:1};
})();
