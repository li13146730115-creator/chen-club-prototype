# V0.15 调整核验（4.30.0）

基线：4.29.0 / bee41b9。来源：《小程序调整- V0.15.docx》全部三项正文及附图、《宸club背景logo.ai》，以及用户的品牌文字要求。

| 调整项 | 实现及关联位置 | 核验结果 |
| --- | --- | --- |
| 业主端“我的”新增商家端入口 | U12 我的服务第五项 → S01；原会员资料、卡包、订单、关注、钱包入口沿用 | 实际点击可进入商家工作台，工单、代客和核销能力保留 |
| 服务页移除顶部活动日历 | U05 仅移除顶部月历入口 | 首页入口仍可进入 U37；活动后台 A16/A22、M22/M23 的发布及排期沿用 |
| 邀请函排版 | U38 品牌左上角、米白纸纹、克制双层细线；纸纹取自同份 AI 背景 | 邀请人、活动、日期与起止时段、地图地址、取消/退款状态仍展示；分享与跨浏览器公开链接保持原能力 |
| 字体版 Logo | 直接提取 AI 六条文字路径为 SVG，使用原稿字形及比例；排除左侧葫芦图标和背景 | 放大核对 AI 后确认原稿中文字为「宸」。首页、邀请函、登录和手机状态栏、商品服务店铺区和桌码导出使用同一矢量字形，无字体依赖 |
| 移动品牌文案一致 | 移动页面可见品牌、邀请分享标题、桌码下载标题，运营和商家装修手机预览同步 | 不再显示旧「CHEN CLUB」或带空格的「宸 CLUB」品牌写法；客户项目名「北京宸园」「紫京宸园」与业务卡名「宸享卡」、表单值、会员数据和二维码协议按原数据保留 |

## 验证

- `node --test tests/*.test.cjs`：512 项通过，0 失败。新增入口、日历、邀请函及品牌回归先失败后通过；原活动入口旧断言按 V0.15 更新。
- `node scripts/verify-v015-browser.cjs`：[浏览器结果](browser-results.json)，三会所共 268 次全部移动路由及带具体商品/服务参数的详情渲染，品牌、页面数据、底栏位置、横向溢出无异常；实际核验商家入口、首页月历、跨浏览器邀请链接、登录和两类 PC 装修预览。
- `CHEN_QA_OUTPUT=docs/qa/v4.30.0/payment-regression node scripts/verify-payment-alignment.cjs`：[支付回归记录](payment-regression/browser-audit.json)，5 项布局、22 项付款流程通过，0 页面/控制台错误。会员自购、代客二维码、线下收款仍可用。
- `CHEN_QA_OUTPUT=/tmp/chen-v015-v014-regression node scripts/verify-v014-browser.cjs`：[前版关联流程回归](v014-regression.json)，钱包支付与原路退款、活动上传和推荐标签等 9 项通过。
- 独立审查发现的品牌标签误读及详情页单字标识均已修正，桌码导出使用原稿轮廓，并保持二维码可解码为原协议。
- 移动视口 375×812，PC 1440×900；相关截图逐张视觉核验。

## 截图

[首页](01-home-vector-wordmark.png) · [我的商家入口](02-profile-merchant-entry.png) · [商家工作台](03-merchant-workbench.png) · [服务页](04-services-no-calendar.png) · [邀请函](05-invitation-texture.png) · [登录](06-login-consistent-brand.png) · [运营装修预览](07-operation-preview-brand.png) · [商家装修预览](08-merchant-preview-brand.png) · [服务详情店铺](09-service-detail-wordmark.png) · [商品详情店铺](10-product-detail-wordmark.png) · [桌码导出](11-table-code-brand.png)

## 品牌资源来源

- `assets/brand-reference/chen-wordmark.svg`：AI 的 PDF 兼容页面中 C、L、U、B 与中文「宸」两条复合字形，共六条文字路径。裁切边界 x=440–698，y=150–201，去掉 x=382–421 的图标区域。
- `assets/brand-reference/chen-paper.jpg`：同份原稿下部无图文区域裁出的 480×480 纸纹，用于邀请函。
- 保留当前首页60%横幅、会籍卡套、暖棕配色，以及既有预约、商品、购物车、钱包及核销流程。
