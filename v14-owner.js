/* V0.11：权益卡片隐藏服务价格，保留卡券面值和资产规则。 */
(()=>{'use strict';const A=Club;if(A.v14Owner)return;
function rights(html){return html.replace(/<article\b[^>]*class="v19-benefit[^>]*>[\s\S]*?<\/article>/g,card=>card.replace(/<p class="v13-benefit-price">[\s\S]*?<\/p>/g,'').replace(/<strong class="v20-member-price">[\s\S]*?<\/strong>/g,price=>/会籍专享价|不限次/.test(card)?'':price).replace(/(<span class="v19-source">)赠送(<\/span>)/g,'$1权益$2'));}
for(const id of ['U03','U20']){const view=A.views[id];A.register({[id]:()=>rights(view())});}
const wallet=A.v07UI.walletBody;A.v07UI.walletBody=()=>rights(wallet());
A.v14Owner={rights};})();
