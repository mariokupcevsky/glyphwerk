function examples(){
  const narch={z:true,p:[P(410,0),P(500,0),P(500,340,null,[500,450]),P(310,510,[430,510],[210,510],1),
    P(60,400,[130,470]),P(60,320,null,[120,390]),P(260,425,[190,425],[360,425],1),P(410,320,[410,390])]};
  return {
    H:{c:[rect(0,0,90,700),rect(410,0,90,700),rect(60,305,380,85)]},
    T:{c:[rect(0,610,540,90),rect(225,0,90,620)]},
    A:{c:[poly([0,0,100,0,140,160,370,160,410,0,510,0,305,700,205,700]),poly([170,250,340,250,255,560])]},
    V:{c:[poly([0,700,100,700,255,170,410,700,510,700,305,0,205,0])]},
    O:{c:[ellipse(320,350,320,362),ellipse(320,350,228,276)]},
    n:{c:[rect(0,0,90,500),narch]},
    o:{c:[ellipse(275,250,275,262),ellipse(275,250,187,180)]},
    '¨':{c:[ellipse(0,640,48,48),ellipse(170,640,48,48)]},
    '´':{c:[poly([0,580,85,580,215,730,100,730])]}
  };
}
function freshProject(){
  const g={};
  return {name:'Meine Schrift',spacing:60,strength:70,kern:{},gkern:{},groups:{},parts:{},glyphs:g,text:'HOT AVO nono ÖÄ öó\nHamburgefonstiv',example:false,t:0,names:{},fea:'',feaAuto:true,ps:[],fmt:{}};
}

