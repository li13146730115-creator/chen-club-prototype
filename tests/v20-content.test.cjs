const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),load=require('./helpers/load.cjs');
const modulePath=path.join(__dirname,'../v20-content.js');
const setup=()=>load(fs.existsSync(modulePath)?['v20-content.js']:[]);
function invitationOrder(A){const s=A.v07.service('BJX01');return A.C.book(A.S,{project:A.S.project,service:s.id,title:s.name,resource:s.id+'-1',date:A.v08.days(s)[2],time:A.v08.times(s)[0],duration:60,people:1,amount:0,identity:'ma',user:A.S.profile.nickname,memberId:A.v09.me().id,paid:true});}
const serviceGrid=h=>h.match(/<div class="owner-personal-grid[^"]*">([^]*?)<\/div>/)?.[1]||'';
const profileCard=h=>h.match(/<section class="owner-profile-card[^]*?<\/section>/)?.[0];
const otherBenefits=h=>h.match(/<div class="owner-personal-links">([^]*?)<\/div>/)?.[1];

test('我的服务新增商家端入口至现有 S01，原会员卡与钱包列表保持完整',()=>{
 const before=load([],{skipScripts:['v20-content.js']}),{A,go}=setup();before.go('U12');go('U12');
 const h=A.views.U12(),grid=serviceGrid(h),ids=[...grid.matchAll(/href="#\/(\w+)"/g)].map(m=>m[1]);
 assert.deepEqual(ids,['U10','U20','U24','U36','S01']);assert.match(grid,/<span>商家端<\/span>/);
 assert.match(h,/owner-personal-grid[^"<]*v20-personal-grid/);
 assert.equal(profileCard(h),profileCard(before.A.views.U12()));assert.equal(otherBenefits(h),otherBenefits(before.A.views.U12()));
 assert.match(otherBenefits(h),/v19-wallet-profile-entry[^]*?U40/);assert.ok(go('S01').includes('工单处理'));
});

test('服务页只移除顶部活动月历入口，首页月历及 U37 排期仍可进入',()=>{
 const{A,go}=setup();go('U05');const h=A.views.U05();assert.doesNotMatch(h,/v14-calendar-entry|href="#\/U37"/);
 for(const label of ['会所服务','关注会所','近期预约','v11-service-carousel','v19-service-category'])assert.ok(h.includes(label),label);
 assert.match(go('U01'),/v14-calendar-entry[^]*?href="#\/U37"/);assert.match(go('U37'),/活动月历/);
});

test('邀请函沿用真实邀请人与公开安排，局部排版保留地图和失效提示',()=>{
 const{A,go}=setup(),o=invitationOrder(A);A.S.profile.nickname='邀请人小周';o.activityTitle='周末茶叙';
 const invite=A.v14Experience.createInvitation(o.id),route=invite.url.split('#/')[1];go(route);let h=A.views.U38();
 assert.match(h,/<article class="[^"]*v20-content-invitation/);assert.equal((h.match(/class="v14-invitation-mark"/g)||[]).length,1);
 for(const value of ['邀请人小周','周末茶叙',o.date,o.time,invite.snapshot.end,'maps.apple.com',invite.snapshot.address])assert.ok(h.includes(value),value);
 assert.doesNotMatch(h,/data-qr=|核销码|本机记录|预约服务|预约场地/);
 o.status='已取消';assert.match(go(route),/预约已取消/);o.status='已退款';assert.match(go(route),/预约已退款/);
 const fresh=setup();fresh.A.S.orders=[];fresh.A.S.v14Experience.invitations={};fresh.A.S.profile.nickname='接收方小陈';h=fresh.go(route);
 assert.match(h,/邀请人小周/);assert.doesNotMatch(fresh.A.views.U38(),/接收方小陈/);
 assert.match(go('U38?invite=broken'),/邀请链接不完整|邀请信息不可用/);
});

test('分享、复制及系统分享继续共用原公开链接，重复加载不重复追加入口',async()=>{
 const{A,scope,go}=setup(),o=invitationOrder(A);assert.ok(A.v20Content,'V0.15 内容扩展尚未接入');
 let copied,shared;scope.navigator={clipboard:{writeText:async value=>copied=value},share:async value=>shared=value};A.modal=()=>{};
 const invitation=A.actions['v14-share-voucher']({id:o.id});await A.actions['v14-invite-copy']();await A.actions['v14-invite-system']();
 assert.equal(copied,invitation.url);assert.equal(shared.url,invitation.url);assert.ok(!JSON.stringify(shared).includes(o.code));
 vm.runInContext(fs.readFileSync(modulePath,'utf8'),scope);go('U12');assert.equal((serviceGrid(A.views.U12()).match(/href="#\/S01"/g)||[]).length,1);
});
