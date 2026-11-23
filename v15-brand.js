/* 发布会品牌参考：仅迁移默认空间配图，保留运营维护值与业务数据。 */
(()=>{
  const A=Club;
  if(A.v15Brand)return;
  const S=A.S,V=S.v02,M=A.v07;
  const images={BJX03:'gym',BJX04:'gym',BJX05:'yoga',BJX06:'yoga',BJX14:'lounge',BJX16:'dining',BJX17:'meeting'};
  const asset=kind=>'assets/brand-reference/'+kind+'.jpg';
  A.v15Brand={version:1,images,asset};
  if(S.v15Brand?.version===1)return;
  for(const [id,kind] of Object.entries(images)){
    const service=M.service(id);
    if(!service)continue;
    const fallback=A.ownerUI.imageFor(service),cfg=V.v03.merchantServices[id]??={};
    if(!cfg.cover||cfg.cover===fallback)cfg.cover=asset(kind);
    for(const article of V.articles.filter(x=>x.project==='bj'&&x.serviceId===id)){
      if(!article.image||article.image===fallback)article.image=asset(kind);
    }
  }
  for(const variant of ['standard','high']){
    const cfg=S.configs['dining-package-BJX16-'+variant]??={};
    if(!cfg.image||cfg.image==='assets/home-dining.jpg')cfg.image=asset('dining');
  }
  S.v15Brand={version:1};
  A.save();
})();
