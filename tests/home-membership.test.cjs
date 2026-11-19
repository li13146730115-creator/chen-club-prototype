const test=require('node:test'),assert=require('node:assert/strict'),load=require('./helpers/load.cjs');

test('首页会籍卡提供独立会员码按钮，卡面继续进入权益或卡包',()=>{
 const {A,go}=load();
 for(const project of Object.keys(A.projects))for(const role of ['owner','family','visitor']){
  A.S.project=project;A.S.memberRole=role;A.S.identity=role==='visitor'?'na':'ma';
  const html=A.v05.membership(role),expected=role==='visitor'?'U20':'U03';
  assert.match(html,new RegExp('<a[^>]+href="#/'+expected+'"[^>]*class="v09-wallet-card"'));
  assert.match(html,/<button[^>]+data-action="member-code"[^>]*aria-label="出示会员码"/);
  for(const link of html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g))assert.doesNotMatch(link[0],/<button\b/,'会员码不能嵌套在卡面链接中');
  assert.match(go('U01'),/class="v09-wallet-code"/);
 }
});

test('首页会员码复用既有弹层，游客点击进入认证',()=>{
 const {A}=load();let opened;
 A.modal=(title,body)=>{opened={title,body};};
 A.actions['member-code']();
 assert.equal(opened.title,'会员码');assert.match(opened.body,/data-qr="MEMBER-LIN"/);
 A.S.guest=true;A.go=id=>{opened=id;};A.actions['member-code']();assert.equal(opened,'U02');
});

test('装修及会籍设置预览使用相同卡包和会员码入口',()=>{
 const {A,go}=load();
 assert.match(go('A10'),/class="v09-wallet-code"/);
 assert.match(go('A24'),/class="v09-wallet-code"/);
});
