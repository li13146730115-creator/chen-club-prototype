const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const target = process.env.CHEN_QA_URL || 'http://127.0.0.1:8874/';
const output = path.resolve(__dirname, '../docs/qa/v4.28.1');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args:['--no-sandbox']});
  const report = { target, alignment: [], payment: [], errors: [] };
  const context = await browser.newContext({ viewport: {width:375,height:812} });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', e=>report.errors.push(e.message));
  page.on('console', m=>{if(m.type()==='error')report.errors.push(m.text());});
  let booted=false;
  const go=async route=>{
    if(!booted){await page.goto(target+'#/U01',{waitUntil:'domcontentloaded',timeout:30000});booted=true;}
    await page.evaluate(route=>{location.hash='#/'+route;Club.render();},route);
    await page.locator('#app .workspace').waitFor();
  };
  const screenshot=async name=>{
    const phone=page.locator('.device');
    if(await phone.count()) await phone.screenshot({path:output+'/'+name+'.png'});
    else await page.screenshot({path:output+'/'+name+'.png'});
  };
  const alignment=async label=>{
    const rows=await page.locator('.home-today-grid:not(.v08-today-rows)').evaluateAll(grids=>grids.flatMap(grid=>Array.from(grid.querySelectorAll('.home-today-card')).map(card=>{
      const b=card.querySelector('.home-today-action').getBoundingClientRect(),r=card.getBoundingClientRect();return {name:card.querySelector('h4').textContent,top:r.top,buttonTop:b.top,buttonBottom:b.bottom,height:b.height,cardBottom:r.bottom};
    })));
    assert.ok(rows.length>=2,label);
    for(let i=1;i<rows.length;i++)if(Math.abs(rows[i].top-rows[i-1].top)<1){assert.ok(Math.abs(rows[i].buttonTop-rows[i-1].buttonTop)<1,label+' buttons align');assert.ok(Math.abs(rows[i].height-rows[i-1].height)<1,label+' button heights');}
    report.alignment.push({label,rows});
  };
  try {
    for(const project of ['bj','zx','zj']){
      await go('U01');await page.evaluate(project=>{Club.S.project=project;Club.render();},project);
      await alignment(project+' phone');
      await page.locator('.home-today-grid').first().scrollIntoViewIfNeeded();
      if(project==='bj') await screenshot('01-home-aligned');
    }
    await page.evaluate(()=>{Club.S.project='bj';Club.render();});
    await page.setViewportSize({width:1440,height:900});
    await go('A10');await alignment('A10 editor');await page.locator('.studio-phone-body').evaluate(el=>{el.scrollTop=650;});await screenshot('02-editor-aligned');
    const previousStyle=await page.evaluate(()=>{const c=Club.v11Decoration.draft('home').components.find(c=>c.type==='today');const style=c.style;Club.actions['v07-decor-select']({id:c.id});Club.actions['v11-decor-style']({value:1});return style;});
    const row=await page.locator('.v08-today-rows .home-today-card').first().evaluate(el=>{
      const a=el.querySelector('img').getBoundingClientRect(),b=el.querySelector('.home-today-info').getBoundingClientRect();return {imageWidth:a.width,imageRight:a.right,textLeft:b.left,height:el.getBoundingClientRect().height};
    });
    assert.equal(row.imageWidth,105);assert.ok(row.textLeft>=row.imageRight-1);assert.ok(row.height<240);
    report.alignment.push({label:'横向清单保留左图右文',row});
    await page.evaluate(style=>{Club.actions['v11-decor-style']({value:style});},previousStyle);
    const routes=['S03','S04','S10','T03','T04','A27','A28','M17'];
    for(const route of routes)for(const kind of ['retail','booking']){
      await page.setViewportSize({width:/^[ST]/.test(route)?375:1440,height:/^[ST]/.test(route)?812:900});
      const id=await page.evaluate(({route,kind})=>{
        const A=Club,M=A.v07,p=M.products()[0],date=M.iso(new Date(Date.now()+10*86400000));
        if(kind==='booking')A.S.v02.v03.merchantServices.BJX02.dateList=[];
        const lines=kind==='booking'?[{item:'BJX02',resource:'BJX02-2',date,time:'18:00',qty:1,people:1}]:[{item:p.id,qty:1}];
        // Each browser case uses independent pending bookings to avoid prior occupancy.
        A.S.orders=A.S.orders.filter(o=>!(o.service==='BJX02'&&o.date===date));
        const g=M.submit({kind,operator:true,identity:'na',lines});return g.id;
      },{route,kind});
      await go(route+'?step=5&id='+id);
      if(route==='S03'&&kind==='retail')await screenshot('00-mobile-methods');
      await page.locator('[data-action="v07-method"][data-value="online"]').click();
      const qr=page.locator('[data-qr]');
      await qr.waitFor();
      assert.equal(await qr.getAttribute('data-qr'),'CHEN-PAY:'+id);
      assert.ok(await qr.locator('canvas,img').count()>0,'rendered QR '+route);
      assert.ok((await page.locator('.v07-payment').innerText()).includes('会员使用微信扫码支付'));
      if(route==='S03'&&kind==='retail')await screenshot('03-mobile-online-qr');
      if(route==='M17'&&kind==='retail')await screenshot('04-pc-online-qr');
      await page.locator('[data-action="v08-payment-reset"]').click();
      await page.locator('[data-action="v07-method"][data-value="offline"]').click();
      assert.ok((await page.locator('.v07-offline').innerText()).includes('确认实际到账'));
      if(route==='S03'&&kind==='retail')await screenshot('05-mobile-offline');
      await page.locator('[data-action="v07-pay"]').click();
      await page.waitForFunction(()=>Club.params.get('step')==='6');
      const paid=await page.evaluate(id=>{
        const g=Club.v07.B.groups.find(g=>g.id===id);return {status:g.status,channel:g.channel,orders:g.orderIds.map(id=>{const o=Club.S.orders.find(o=>o.id===id);return {paid:o.paid,channel:o.channel};})};
      },id);
      assert.equal(paid.status,'已支付');assert.equal(paid.channel,'offline');assert.ok(paid.orders.every(o=>o.paid&&o.channel==='线下收款'));
      report.payment.push({route,kind,qr:true,switched:true,...paid});
    }
    // Full online confirmation on each current client.
    for(const route of ['S03','A27','M17']){
      await go(route);
      const id=await page.evaluate(()=>{const A=Club,M=A.v07;const g=M.submit({kind:'retail',operator:true,lines:[{item:M.products()[0].id,qty:1}]});return g.id;});
      await go(route+'?step=5&id='+id);
      await page.locator('[data-action="v07-method"][data-value="online"]').click();
      await page.locator('[data-action="v07-pay"]').click();
      await page.waitForFunction(()=>Club.params.get('step')==='6');
      assert.equal(await page.evaluate(id=>Club.v07.B.groups.find(g=>g.id===id).channel,id),'online');
      report.payment.push({route,kind:'retail',onlineConfirmed:true});
    }
    for(const route of ['S04','A27','M17']) {
      const id=await page.evaluate(()=>{
        const A=Club,M=A.v07,g=M.submit({kind:'retail',operator:true,lines:[{item:M.products()[0].id,qty:1}]}),o=A.S.orders.find(o=>o.id===g.orderIds[0]);
        M.B.groups=M.B.groups.filter(x=>x.id!==g.id);delete o.paymentGroup;delete o.staffOrder;o.operator='商家前台';return o.id;
      });
      await go(route+'?step=5&id='+id);
      assert.equal(await page.locator('[data-action="v07-method"]').count(),2);
      await page.locator('[data-action="v08-payment-back"]').click();
      await page.waitForFunction(()=>Club.params.get('step')==='4');
      assert.equal(await page.evaluate(()=>Club.route),route==='S04'?'S03':route);
      report.payment.push({route,legacyOrder:true,backToEdit:true});
    }
    assert.deepEqual(report.errors,[]);
    fs.writeFileSync(output+'/browser-audit.json',JSON.stringify(report,null,2));
    console.log(JSON.stringify({alignment:report.alignment.length,payment:report.payment.length,errors:report.errors}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
