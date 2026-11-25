/* V0.15：业主商家入口、服务页入口精简及邀请函纸感排版。 */
(()=>{'use strict';
const A=Club;if(A.v20Content)return;
const U=A.v07UI,profile=A.views.U12,services=A.views.U05,invitation=A.views.U38;

// 只追加“我的服务”入口，继续使用当前会员卡与其他权益列表。
A.register({U12:()=>profile().replace(/<div class="(owner-personal-grid[^"]*)">([\s\S]*?)<\/div>/,(_all,classes,body)=>'<div class="'+classes+' v20-personal-grid">'+body+U.anchor(A.icon('s-shop')+'<span>商家端</span>','S01')+'</div>')});

// 首页保留月历入口，U37 的活动排期和预约链路沿用现有实现。
A.register({U05:()=>services().replace(/<a\b[^>]*\bclass="[^"]*\bv14-calendar-entry\b[^"]*"[^>]*>[\s\S]*?<\/a>/g,'')});

// 邀请函只添加布局作用域，邀请人、地图、失效状态及分享模型继续由旧视图提供。
A.register({U38:()=>invitation().replace(/(<article\b[^>]*\bclass=")([^"]*)"/,(_all,start,classes)=>start+classes+' v20-content-invitation"')});
A.v20Content={version:1};
})();
