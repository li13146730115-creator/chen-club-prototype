const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),load=require('./helpers/load.cjs');
const setup=()=>load(fs.existsSync(path.join(__dirname,'../v11-feedback.js'))?['v11-feedback.js']:[]);
test('V0.9：PC工单平铺状态，PC及移动员工选择可搜索',()=>{
 const {A,go,nodes}=setup(),t=A.S.tickets.find(t=>t.project==='bj');
 go('A09');A.actions['v08-feedback-detail']({id:t.id,page:'A09'});const h=nodes.overlay.innerHTML;
 assert.match(h,/data-action="v11-staff-open"/);assert.match(h,/v11-ticket-status/);assert.doesNotMatch(h,/<select name="assignee"/);
 assert.match(go('S12?id='+t.id),/data-action="v11-staff-open"/);
 A.actions['v11-staff-open']({id:t.id});assert.match(nodes.overlay.innerHTML,/搜索员工姓名/);
});
test('V0.9：所有状态变更记录处理人、时间、状态并倒序展示',()=>{
 const {A,go}=setup(),M=A.v07,t=A.S.tickets.find(t=>t.project==='bj'),s=A.S.staff.find(s=>s.project==='bj');
 go('S12?id='+t.id);M.ticketUpdate({id:t.id,assignee:s.id,status:'处理中',result:'首次处理',operator:'运营甲'});
 M.ticketUpdate({id:t.id,assignee:s.id,status:'已完成',result:'完成回访',operator:'运营乙',attachment:'场地照片',attachmentData:'assets/club-pool.jpg'});
 const h=go('S12?id='+t.id);assert.ok(h.indexOf('完成回访')<h.indexOf('首次处理'));assert.match(h,/运营乙/);assert.match(h,/assets\/club-pool.jpg/);
 assert.equal(t.replies.at(-1).status,'已完成');assert.equal(t.replies.at(-1).operator,'运营乙');
 assert.throws(()=>M.ticketUpdate({id:t.id,assignee:'not-this-shop',status:'处理中',result:'x'}),/员工/);
});
test('V0.9：切换工单不会把未保存的附件写入另一工单',()=>{
 const {A,go}=setup(),M=A.v07,ts=A.S.tickets.filter(t=>t.project==='bj');go('S12?id='+ts[0].id);M.B.ticketAttachment='data:image/png;base64,OTHER';M.B.v11AttachmentTicket=ts[0].id;go('S12?id='+ts[1].id);A.forms['v07-ticket-save']({id:ts[1].id,status:'处理中',result:'第二张工单'});assert.equal(ts[1].replies.at(-1).attachmentData,'');
});
test('V0.9：处理记录跨月按实际时间倒序，同一秒按提交顺序倒序',()=>{
 const {A}=setup(),t={replies:[{time:'2026/2/3 10:30:00',text:'二月处理',sequence:0},{time:'2026/11/19 10:30:00',text:'十一月首次',sequence:1},{time:'2026/11/19 10:30:00',text:'十一月再次',sequence:2}]};
 const h=A.v11Feedback.history(t);assert.ok(h.indexOf('十一月再次')<h.indexOf('十一月首次'));assert.ok(h.indexOf('十一月首次')<h.indexOf('二月处理'));
});
