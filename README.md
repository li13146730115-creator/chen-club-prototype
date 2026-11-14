# 宸 Club 会所服务交互原型 V4.1 · 1114需求复核版

依据《智地会所运营需求清单-1114.xlsx》95条需求逐项建立映射，覆盖56个主要页面：业主18、员工8、商家移动8、运营后台15、商家PC7。

- [业主端](https://li13146730115-creator.github.io/chen-club-prototype/#/U01)
- [员工端](https://li13146730115-creator.github.io/chen-club-prototype/#/S01)
- [商家移动端](https://li13146730115-creator.github.io/chen-club-prototype/#/T01)
- [运营后台](https://li13146730115-creator.github.io/chen-club-prototype/#/A01)
- [商家PC端](https://li13146730115-creator.github.io/chen-club-prototype/#/M04)
- [三页面装修](https://li13146730115-creator.github.io/chen-club-prototype/#/A10)
- [95条需求台账](https://li13146730115-creator.github.io/chen-club-prototype/#/A15)
- [56页UI稿](UI稿总览.html)

移动端375×812px；PC端1440×900px。PC沿用客户现有商城的导航、蓝色控件、表格及装修编辑器结构；首页按1114清单R002展示80%轮播图和预约摘要，会籍卡在下滑内容中。

详见[复核与验收记录](复核说明与验收记录.md)、[逐条复核与兼容方案](1114需求复核与兼容方案.md)和[UI设计规范](UI设计规范.md)。

直接打开index.html即可离线预览，也可通过任意静态HTTP服务访问。无须安装依赖；演示数据保存在当前浏览器localStorage，页面中的重置按钮可恢复样例。真实价目与演示交易分别标识；支付、认证、权限、门禁、消息、渠道分账等生产接口尚未接入。

验证命令：`node --test tests/*.test.cjs`。GitHub Pages使用main分支根目录自动部署。

本版补充参考客户汇报PPT第7—10、17—18页，调整业主端的米白金色视觉、深色会籍卡、服务双列卡片与个人中心；增加A05会员等级展示配置。详细应用范围和资料差异见[PPT参考应用说明](PPT参考应用说明.md)。UI稿已重新导出56页。
