# Meeting and commerce closure implementation plan

> Execute inline with superpowers:executing-plans; user has authorized implementation and ongoing publication.

**Goal:** 落实16:28会议并打通现有商城原型的业务链路。
**Architecture:** 延用Club静态模块与v07业务状态；增加v10营销券、会籍与代客模块，给既有计价/付款提供动态规则，保留订单及既有数据。
**Tech Stack:** Vanilla JS/CSS, Node VM regression, CUA browser verification.
**Spec:** docs/20261118-1628会议调整清单.md

## Global constraints
- 移动375×812，后台1440×900；一级页墨绿金色，交易页现有商城绿色灰底白卡，后台沿用原商城。
- 三店隔离、按客户权益价目展示，未知价格不自动补0；历史本地存档保持不动。
- 原型本地模拟，禁止向真实商城写入或真实支付。

## Task 1 — 营销卡券与会籍联动
- [x] 在tests/v10.test.cjs写绑卡幂等、跨店隔离、SKU限制、到期/撤绑、小时抵扣、共享库存的失败用例；运行node --test tests/v10.test.cjs。
- [x] 创建v10-business.js，暴露A.v10.templates/grant/bind/price/matches/wallet；会籍关联couponIds，营销配置是唯一源，会员持有券进入S.assets。
- [x] 修改v07-business.js动态调用M.coupons/quote；支持限定规格、次数/小时及金额/折扣，保留订单金额及SKU快照。
- [x] 创建v10-membership-admin.js：A05/A29会籍管理、A33/A34/M13/M14营销券、A35/M15会员价、PC绑卡及发放流水；会员端U03/U20/U12读取同一资产和价格。

## Task 2 — 统一代客入口与六步流程
- [x] 在tests/v10.test.cjs写单服务限制、商品多SKU、返回保留、店铺分类、来源类型筛选的失败用例。
- [x] 创建v10-proxy.js；A25/A26合并记录，A27/A28/S03/S10兼容旧链接，店铺业务分类→商品分类→小购物车→会员/卡券→在线/线下收款→结果。
- [x] 去除S01/S02/S06移动绑卡入口，PC保留，商家PC代客入口独立。

## Task 3 — 交易闭环修复
- [x] 写支付取消后防重付、零元订单状态、配送能力/地址校验、发货→收货、退款→库存与券恢复的失败用例。
- [x] 创建v10-commerce-closure.js；恢复订单详情售后/核销/物流入口；PC订单抽屉与商家操作联动；配送限制按商品能力取交集。
- [x] 修复权益指定SKU使用的路径，商品详情及确认页金额一致。

## Task 4 — 验证与发布
- [x] node --test tests/*.test.cjs；修复全部失败并按会议新要求更新被替代的断言。
- [x] CUA在375×812走通权益→指定规格→卡券→订单→核销；新建会籍/绑定及发货退款由回归验证，1440×900核对代客、营销、价格维护；截图保存UI稿/V420。
- [ ] 更新逐项核验表与README、离线目录，同步GitHub并确认部署版本与资源正常；真实小程序未实机观察部分按源码依据如实标注。
