const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const target=process.env.CHEN_QA_URL||'http://127.0.0.1:8874/';
const output=process.env.CHEN_QA_OUTPUT||path.resolve(__dirname,'../docs/qa/v4.30.0');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:375,height:812}}),page=await context.newPage();
 const report={target,checks:[],rendered:0,errors:[]};page.setDefaultTimeout(15000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 const go=async route=>{await page.evaluate(route=>{location.hash='#/'+route;Club.render();},route);await page.locator('#app .workspace').waitFor();};
 const shot=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const device=page.locator('.device');if(await device.count())await device.screenshot({path:output+'/'+name+'.png'});else await page.screenshot({path:output+'/'+name+'.png'});};
 const check=(name,data={})=>report.checks.push({name,...data});
 try{
  await page.goto(target+'#/U01',{waitUntil:'networkidle'});await page.waitForFunction(()=>!!Club.v20Brand);
  assert.equal(await page.locator('.wordmark .v20-brand-wordmark path').count(),6);
  assert.equal(await page.locator('.device-status .v20-brand-wordmark').getAttribute('aria-label'),'宸CLUB');
  assert.equal(await page.locator('.v09-wallet-card').count(),1);assert.equal(await page.locator('.home-hero').count(),1);
  await shot('01-home-vector-wordmark');check('首页沿用60%横幅、会籍卡套，AI文字六条原始轮廓不带图标');
  await go('U12');assert.equal(await page.locator('.owner-personal-grid>a').count(),5);assert.equal(await page.locator('.v19-wallet-profile-entry').count(),1);await shot('02-profile-merchant-entry');
  await page.locator('.owner-personal-grid a[href="#/S01"]').click();await page.waitForFunction(()=>Club.route==='S01');assert.equal(await page.locator('a[href="#/S07"]').count()>0,true);await shot('03-merchant-workbench');check('我的五个服务入口可点入商家端，原会员卡和钱包保留');
  await go('U05');assert.equal(await page.locator('#screen .v14-calendar-entry').count(),0);await shot('04-services-no-calendar');
  await go('U01');await page.locator('.v14-calendar-entry').click();await page.waitForFunction(()=>Club.route==='U37');assert.equal(await page.locator('.v14-month-calendar').count(),1);check('服务页移除顶部活动日历，首页进入活动月历仍正常');
  const invitation=await page.evaluate(()=>{const o=Club.S.orders.find(o=>o.project===Club.S.project&&o.paid&&o.status==='待履约'&&!o.children&&!o.cardOrder);return Club.v14Experience.createInvitation(o.id);});
  const route=invitation.url.split('#/')[1];await go(route);await shot('05-invitation-texture');
  assert.equal(await page.locator('.v14-invitation-mark .v20-brand-wordmark path').count(),6);assert.equal(await page.locator('.v14-address').count(),1);
  const align=await page.evaluate(()=>{const mark=document.querySelector('.v14-invitation-mark').getBoundingClientRect(),card=document.querySelector('.v20-content-invitation').getBoundingClientRect();return {offset:mark.x-card.x,top:mark.y-card.y};});assert.ok(align.offset<30&&align.top<40);
  const fresh=await browser.newContext({viewport:{width:375,height:812}}),recipient=await fresh.newPage();await recipient.goto(target+'#/'+route,{waitUntil:'networkidle'});assert.ok((await recipient.locator('#screen').textContent()).includes(invitation.snapshot.inviter));assert.equal(await recipient.locator('.v14-address').getAttribute('href'),await page.locator('.v14-address').getAttribute('href'));await fresh.close();
  check('邀请函左上文字Logo、纸纹、邀请人、日期时段和地图；公开链接跨浏览器可读',align);
  await go('U39');await shot('06-login-consistent-brand');assert.equal(await page.locator('.v16-login-mark .v20-brand-wordmark').count(),1);assert.match(await page.locator('.v16-login h3').textContent(),/宸CLUB/);check('会员登录品牌字形与文案一致，登录表单仍在');
  await go('U06?id=BJX01');await page.locator('.v19-merchant').scrollIntoViewIfNeeded();await shot('09-service-detail-wordmark');assert.equal(await page.locator('.v19-store-icon .v20-brand-wordmark path').count(),6);
  await go('U33?id=V07-bj-cola');await page.locator('.v19-merchant').scrollIntoViewIfNeeded();await shot('10-product-detail-wordmark');assert.equal(await page.locator('.v19-store-icon .v20-brand-wordmark path').count(),6);
  const card=await page.evaluate(()=>{const qr=document.createElement('div');new QRCode(qr,{text:'CHENCLUB:ORDER:bj:tea:A01',width:520,height:520});const image=qr.querySelector('canvas');return Club.v16QrCard(image,'北京宸园','A01','茶室','茶室饮品','饮品').toDataURL('image/png');});
  fs.writeFileSync(output+'/11-table-code-brand.png',Buffer.from(card.split(',')[1],'base64'));check('服务商品详情使用同一文字Logo，桌码导出直接绘制原稿轮廓');
  const render=await page.evaluate(async()=>{
   const failures=[],baseRoutes=Club.pages.filter(p=>['U','S'].includes(p.role)&&p.id!=='U38').map(p=>p.id);let count=0;
   for(const project of ['bj','zx','zj']){Club.S.project=project;const routes=[...baseRoutes,...Club.services.filter(s=>s.project===project).map(s=>'U06?id='+s.id),...Club.v07.products().map(p=>'U33?id='+p.id)];for(const route of routes){location.hash='#/'+route;Club.render();await new Promise(r=>requestAnimationFrame(r));count++;
    const screen=document.querySelector('#screen'),device=document.querySelector('.device'),tabs=document.querySelector('.mp-tabs'),status=document.querySelector('.device-status .v20-brand-wordmark');
    if(!screen||!device){failures.push(project+'/'+route+': missing phone');continue;}
    if(screen.textContent.includes('页面数据异常'))failures.push(project+'/'+route+': view exception');
    if(screen.querySelector('.v19-store-icon')&&screen.querySelectorAll('.v19-store-icon .v20-brand-wordmark path').length!==6)failures.push(project+'/'+route+': store logo');
    if(/CHEN CLUB|辰\s*CLUB|宸\s+CLUB/i.test(screen.innerText))failures.push(project+'/'+route+': legacy brand');
    if(screen.scrollWidth>screen.clientWidth+1)failures.push(project+'/'+route+': horizontal overflow '+screen.scrollWidth+'/'+screen.clientWidth);
    if(!status||status.getAttribute('aria-label')!=='宸CLUB')failures.push(project+'/'+route+': status brand');
    const d=device.getBoundingClientRect(),t=tabs.getBoundingClientRect();if(tabs.children.length&&t.top<d.top+d.height*.65)failures.push(project+'/'+route+': nav position');
   }}return {count,failures};
  });assert.deepEqual(render.failures,[]);report.rendered=render.count;check('三会所全部移动页面渲染、品牌文字、底栏位置及横向溢出',render);
  await page.evaluate(()=>{Club.S.project='bj';Club.render();});await page.setViewportSize({width:1440,height:900});await go('A10');await page.locator('.studio-phone').waitFor();await shot('07-operation-preview-brand');
  assert.equal(await page.locator('.studio-phone-status .v20-brand-wordmark').count(),1);assert.doesNotMatch(await page.locator('.studio-phone').innerText(),/CHEN CLUB|辰\s*CLUB|宸\s+CLUB/i);assert.equal(await page.locator('.mall-brand .v20-brand-wordmark').count(),1);
  await go('M12');await page.locator('.studio-phone').waitFor();await shot('08-merchant-preview-brand');assert.equal(await page.locator('.studio-phone-status .v20-brand-wordmark').count(),1);check('运营及商家PC装修预览同步文字Logo，1440×900布局正常');
  // 保留本次设计基线之外的核心使用流程，由既有支付脚本独立回归。
  assert.deepEqual(report.errors,[]);report.ok=true;console.log(JSON.stringify(report,null,2));
 }catch(e){report.ok=false;report.failure=e.stack;console.error(e);await page.screenshot({path:output+'/failure.png',fullPage:true});process.exitCode=1;}
 finally{fs.writeFileSync(output+'/browser-results.json',JSON.stringify(report,null,2));await browser.close();}
})();
