# PC商城UI参考依据 · V3

日期：2026.11.13。

PC端依据当前项目内原商城JAVA-MER V2.3源码与本地运行界面。只修改本交互原型，原商城业务源码保留。

## 来源

- `JAVA-MER-V2.3_20260603/mer_plat_admin/src/store/modules/themeConfig.js`：primary为#0256FF，菜单背景#282C34，columns双层侧栏，启用固定顶栏和页签。
- `mer_plat_admin/src/layout/component/columnsAside.vue`、`aside.vue`：主模块和子菜单。
- `mer_plat_admin/src/layout/main/columns.vue`：双层菜单和主内容布局。
- `mer_plat_admin/src/layout/navBars/`：面包屑、操作区及页签。
- `mer_plat_admin/src/theme/element-variables.scss`：蓝色主按钮及成功、警告、危险色。
- `mer_plat_admin/src/theme/variables.scss`：32px小尺寸控件、12px表格、弹窗分隔和表头样式。

以上路径相对于项目工作目录，独立解压的原型包不包含原商城完整源码。

## 实际运行采样

已运行项目既有local-preview配置，截取1440 × 900的总览与用户列表，保留来源数据为虚构演示数据。

- `screenshots/v3-原商城后台-1440x900.png`
- `screenshots/v3-原商城列表-1440x900.png`

从实际界面测得主导航80px、子菜单206px、顶栏50px及页签34px；这些规格和源码主题色落实到`app.js`的desktopShell及`mall.css`。

## 应用范围

A01—A13运营后台、M01—M03商户端均采用原商城样式。业务页面继续展示会所项目、权益、预约、核销和分账数据。功能模块按会所运营任务分组，保留原商城模块栏与子菜单的导航方式。移动端按375 × 812输出，保持既有会所品牌视觉。
