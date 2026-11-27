const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(base,f),'utf8');

test('品牌字体作为最后的视觉层接入，常用字集预加载且可离线访问',()=>{
 const html=read('index.html'),links=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"?]+)/g)].map(m=>m[1]);
 assert.equal(links.at(-1),'v23-typography.css','字体覆盖必须置于现有样式之后');
 assert.equal(links.filter(f=>f==='v23-typography.css').length,1,'字体层只加载一次');
 assert.equal((html.match(/rel="preload"[^>]+href="assets\/fonts\/chen-wenkai-common\.woff2"/g)||[]).length,1,'常用字集只预加载一次');
 assert.match(html,/<link[^>]+rel="preload"[^>]+href="assets\/fonts\/chen-wenkai-common\.woff2"[^>]+as="font"[^>]+crossorigin/);
 const css=read('v23-typography.css');
 for(const m of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)){
  assert.doesNotMatch(m[1],/^https?:|^\/\//,'不依赖外部CDN');
  assert.ok(fs.existsSync(path.join(base,m[1])),m[1]);
 }
 assert.equal((css.match(/font-display:\s*swap/g)||[]).length,2);
});

test('字体文件和许可证可校验，主字集覆盖原型中文且扩展字符有独立回退',()=>{
 const m=JSON.parse(read('assets/fonts/source.json'));
 assert.equal(m.reference.exactFontIdentified,false);
 assert.equal(m.reference.slideCount,33);
 assert.match(m.upstream.url,/github\.com\/lxgw\/LxgwWenKai/);
 assert.match(read('assets/fonts/OFL.txt'),/SIL OPEN FONT LICENSE/);
 assert.equal(m.files.length,2);
 const sets=m.files.map(f=>{
  const bytes=fs.readFileSync(path.join(base,'assets/fonts',f.name));
  assert.equal(bytes.subarray(0,4).toString(),'wOF2');
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256);
  return new Set(f.codepoints);
 });
 for(const n of sets[0])assert.ok(!sets[1].has(n),'字体字集不得重叠');
 for(const s of ['宸CLUB','会籍权益','预约凭证','恒温泳池','家庭成员','有效至','私教课程','立即预约'])
  for(const ch of s)assert.ok(sets[0].has(ch.codePointAt(0)),'常用字集缺字：'+ch);
 assert.ok(m.files[0].bytes<1500000,'首屏不加载完整中文字库');
});

test('字体调整不携带业务脚本、尺寸和配色变更，图标字体保持独立',()=>{
 const css=read('v23-typography.css').replace(/\/\*[^]*?\*\//g,'');
 const allowed=new Set(['font-family','font-style','font-weight','font-display','src','unicode-range','font-variant-numeric','letter-spacing','text-rendering','font-synthesis']);
 for(const [,property] of css.matchAll(/(?:[;{])\s*([\w-]+)\s*:/g))
  assert.ok(property.startsWith('--')||allowed.has(property),'越界视觉属性：'+property);
 assert.doesNotMatch(css,/(?:^|})\s*(?:\*|i|svg|path|\[class\*?=)[\s,{]/,'不能覆盖图标/Logo字形');
 assert.match(css,/\.mall-core/);assert.match(css,/\.studio-phone/);assert.match(css,/\.v21-voucher-page/);
 assert.ok(!fs.existsSync(path.join(base,'v23-typography.js')),'本次无需修改业务行为');
});
