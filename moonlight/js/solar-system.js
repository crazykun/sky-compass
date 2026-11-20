import { CRATERS, drawMoon } from './moon.js';
import { addAnimation, reducedMotion } from './animation.js';
import { CN, LMON } from './lunar.js';

const add = (a,b) => ({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const sub = (a,b) => ({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const mul = (a,s) => ({x:a.x*s,y:a.y*s,z:a.z*s});
const dot = (a,b) => a.x*b.x+a.y*b.y+a.z*b.z;
const length = a => Math.hypot(a.x,a.y,a.z)||1;
const norm = a => mul(a,1/length(a));
const INC = .26;

export function initSolar({ store, onLinkedStart = () => {}, onReset = () => {} }) {
  const canvas = document.getElementById('solarCanvas'), ctx = canvas.getContext('2d');
  const cam = { yaw:-.6, pitch:.55, dist:640, auto:!reducedMotion, focus:false, target:{x:0,y:0,z:0} };
  const model = { w:0,h:0,cx:0,cy:0,R:0,earthAng:.6,moonAng:.6+Math.PI,sunSpin:0,earthSpin:0 };
  let playing = !reducedMotion, linked = false, speed = .35, showOrbits = true, showShadows = true;
  let dragging = false, lastX = 0, lastY = 0, lastLinkedPhase = 0;
  const MR = () => model.R * .29;
  const earthPos = () => ({x:Math.cos(model.earthAng)*model.R,y:0,z:Math.sin(model.earthAng)*model.R});
  const moonPos = () => {
    const earth=earthPos(), angle=model.moonAng, radius=MR();
    return {x:earth.x+Math.cos(angle)*radius,y:Math.sin(angle)*Math.sin(INC)*radius,z:earth.z+Math.sin(angle)*Math.cos(INC)*radius};
  };

  function resize() {
    const rect=canvas.getBoundingClientRect(), dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
    model.w=rect.width;model.h=rect.height;model.cx=model.w/2;model.cy=model.h/2;model.R=Math.min(model.w*.25,model.h*.34);
  }

  function project(point) {
    const relative=sub(point,cam.target),cy=Math.cos(cam.yaw),sy=Math.sin(cam.yaw),cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch);
    const x1=relative.x*cy-relative.z*sy,z1=relative.x*sy+relative.z*cy;
    const y2=relative.y*cp-z1*sp,depth=z1*cp+relative.y*sp;
    const scale=(640/cam.dist)*(1+depth/cam.dist*.32);
    return {x:model.cx+x1*scale,y:model.cy-y2*scale,s:scale,depth};
  }
  function camDir(){return {x:-Math.cos(cam.pitch)*Math.sin(cam.yaw),y:Math.sin(cam.pitch),z:Math.cos(cam.pitch)*Math.cos(cam.yaw)};}
  function rrect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

  function litBall(projected,radius,pos,k,paint,glowColor,lightDir){
    const r=radius*projected.s;
    if(glowColor){const gradient=ctx.createRadialGradient(projected.x,projected.y,r*.6,projected.x,projected.y,r*2.4);gradient.addColorStop(0,glowColor);gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(projected.x,projected.y,r*2.4,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#171d2e';ctx.beginPath();ctx.arc(projected.x,projected.y,r,0,Math.PI*2);ctx.fill();
    const lightProjected=project(add(pos,mul(lightDir,radius*.7))),angle=Math.atan2(lightProjected.y-projected.y,lightProjected.x-projected.x),kk=-k;
    ctx.save();ctx.translate(projected.x,projected.y);ctx.rotate(angle);ctx.beginPath();ctx.arc(0,0,r,-Math.PI/2,Math.PI/2,false);ctx.ellipse(0,0,Math.max(.01,Math.abs(kk)*r),r,0,Math.PI/2,-Math.PI/2,kk>0);ctx.closePath();ctx.clip();paint(ctx,r);ctx.restore();
    ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(projected.x,projected.y,r,0,Math.PI*2);ctx.stroke();
  }
  function paintSun(c,r){const gradient=c.createRadialGradient(-r*.3,-r*.3,r*.05,0,0,r*1.05);gradient.addColorStop(0,'#fff9da');gradient.addColorStop(.45,'#ffcb57');gradient.addColorStop(1,'#e06912');c.fillStyle=gradient;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.save();c.rotate(model.sunSpin);c.strokeStyle='rgba(255,252,215,.32)';c.lineWidth=Math.max(1,r*.08);for(let i=0;i<4;i++){c.beginPath();c.arc(0,0,r*(.28+i*.19),-.9,.9);c.stroke();c.beginPath();c.arc(0,0,r*(.28+i*.19),Math.PI-.9,Math.PI+.9);c.stroke();}c.restore();}
  function paintEarth(c,r){const gradient=c.createRadialGradient(-r*.35,-r*.35,r*.04,0,0,r*1.1);gradient.addColorStop(0,'#c4ecff');gradient.addColorStop(.5,'#2f90de');gradient.addColorStop(1,'#0c3469');c.fillStyle=gradient;c.fillRect(-r,-r,2*r,2*r);c.save();c.rotate(model.earthSpin);c.fillStyle='rgba(94,192,126,.9)';c.beginPath();c.ellipse(-r*.32,-r*.2,r*.34,r*.5,.45,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(r*.42,r*.28,r*.3,r*.36,-.3,0,Math.PI*2);c.fill();c.fillStyle='rgba(255,255,255,.28)';c.beginPath();c.ellipse(0,-r*.36,r*.78,r*.1,0,0,Math.PI*2);c.fill();c.restore();}
  function paintMoon(c,r){const gradient=c.createRadialGradient(-r*.3,-r*.3,r*.04,0,0,r*1.1);gradient.addColorStop(0,'#fbf9f0');gradient.addColorStop(.55,'#cbc8bd');gradient.addColorStop(1,'#6f6e79');c.fillStyle=gradient;c.fillRect(-r,-r,2*r,2*r);for(const crater of CRATERS){c.fillStyle=`rgba(78,73,68,${crater.o})`;c.beginPath();c.arc(crater.x*r,crater.y*r,crater.r*r,0,Math.PI*2);c.fill();}}

  function drawCone(base,dir,size,r0,r1,c0,c1){const p0=project(base),p1=project(add(base,mul(dir,size))),dx=p1.x-p0.x,dy=p1.y-p0.y,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d,w0=r0*p0.s,w1=r1*p1.s,gradient=ctx.createLinearGradient(p0.x,p0.y,p1.x,p1.y);gradient.addColorStop(0,c0);gradient.addColorStop(1,c1);ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(p0.x+nx*w0,p0.y+ny*w0);ctx.lineTo(p1.x+nx*w1,p1.y+ny*w1);ctx.lineTo(p1.x-nx*w1,p1.y-ny*w1);ctx.lineTo(p0.x-nx*w0,p0.y-ny*w0);ctx.closePath();ctx.fill();}
  function drawOrbits(){ctx.strokeStyle='rgba(150,190,255,.18)';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<=96;i++){const angle=i/96*Math.PI*2,p=project({x:Math.cos(angle)*model.R,y:0,z:Math.sin(angle)*model.R});i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.stroke();const earth=earthPos();ctx.strokeStyle='rgba(215,220,240,.3)';ctx.setLineDash([4,5]);ctx.beginPath();for(let i=0;i<=64;i++){const angle=i/64*Math.PI*2,r=MR(),p=project({x:earth.x+Math.cos(angle)*r,y:Math.sin(angle)*Math.sin(INC)*r,z:earth.z+Math.sin(angle)*Math.cos(INC)*r});i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.stroke();ctx.setLineDash([]);}
  function demoPhase(){let relative=(model.moonAng-model.earthAng-Math.PI)%(Math.PI*2);if(relative<0)relative+=Math.PI*2;return relative/(Math.PI*2);}
  function setFromPhase(phase){model.earthAng=.6;model.moonAng=.6+Math.PI+phase*Math.PI*2;lastLinkedPhase=phase;}

  function drawBadge(view){const x=18,y=18,w=224,h=104;ctx.save();ctx.fillStyle='rgba(8,14,30,.72)';ctx.strokeStyle='rgba(255,214,130,.38)';ctx.lineWidth=1;rrect(x,y,w,h,12);ctx.fill();ctx.stroke();ctx.textAlign='left';ctx.fillStyle='rgba(255,224,160,.82)';ctx.font='12px -apple-system,sans-serif';ctx.fillText(view.mode==='real'?'真实日期 · 农历':'教学模拟 · 农历',x+14,y+22);ctx.fillStyle='#ffd98a';ctx.font='bold 23px -apple-system,sans-serif';ctx.fillText(`${view.mode==='real'?LMON[view.lunar.m-1]+'月':'模拟 '}${CN[view.dayIndex]}`,x+14,y+53);ctx.fillStyle='rgba(235,240,255,.82)';ctx.font='12px -apple-system,sans-serif';ctx.fillText(`${view.phaseName} · 亮面 ${Math.round(view.illumination*100)}%`,x+14,y+79);if(view.mode==='real'){ctx.fillStyle='rgba(160,175,215,.75)';ctx.font='10px -apple-system,sans-serif';ctx.fillText('非真实尺度 · 位置映射演示',x+14,y+96);}ctx.restore();}
  function drawPhaseHUD(view){const x=model.w-70,y=76,r=32;ctx.save();ctx.fillStyle='rgba(3,7,18,.55)';ctx.strokeStyle='rgba(255,255,255,.16)';ctx.lineWidth=1;rrect(x-r-14,y-r-16,(r+14)*2,(r+16)*2+42,14);ctx.fill();ctx.stroke();ctx.save();ctx.translate(x,y);drawMoon(ctx,0,0,r,view.phase,true);ctx.restore();ctx.fillStyle='rgba(235,240,255,.75)';ctx.font='11px -apple-system,sans-serif';ctx.textAlign='center';ctx.fillText('地球所见月相',x,y+r+20);ctx.fillStyle='#ffd98a';ctx.font='bold 12px -apple-system,sans-serif';ctx.fillText(`农历${CN[view.dayIndex]}`,x,y+r+37);ctx.restore();}

  function draw(){
    const earth=earthPos(),moon=moonPos(),lightEarth=norm(mul(earth,-1)),lightMoon=norm(mul(moon,-1)),camera=camDir(),ke=dot(lightEarth,camera),km=dot(lightMoon,camera),view=store.getView();
    ctx.clearRect(0,0,model.w,model.h);
    if(showOrbits)drawOrbits();
    if(showShadows)drawCone(earth,lightEarth,model.R*1.15,13,3.5,'rgba(6,10,24,.6)','rgba(6,10,24,0)');
    const sunProjected=project({x:0,y:0,z:0}),sunRadius=26*sunProjected.s;
    for(let i=8;i>=1;i--){ctx.fillStyle=`rgba(255,170,60,${.012*i})`;ctx.beginPath();ctx.arc(sunProjected.x,sunProjected.y,sunRadius+i*9*sunProjected.s,0,Math.PI*2);ctx.fill();}
    ctx.save();ctx.translate(sunProjected.x,sunProjected.y);paintSun(ctx,sunRadius);ctx.restore();
    const earthProjected=project(earth);
    ctx.strokeStyle='rgba(255,205,90,.55)';ctx.lineWidth=1.5;ctx.setLineDash([7,6]);ctx.beginPath();ctx.moveTo(sunProjected.x,sunProjected.y);ctx.lineTo(earthProjected.x,earthProjected.y);ctx.stroke();ctx.setLineDash([]);
    ctx.font='11px -apple-system,sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(255,215,110,.85)';ctx.fillText('阳光',(sunProjected.x+earthProjected.x)/2,(sunProjected.y+earthProjected.y)/2-8);
    litBall(earthProjected,14,earth,ke,paintEarth,'rgba(90,170,255,.14)',lightEarth);
    if(showShadows){const toEarth=sub(earth,moon);drawCone(moon,norm(toEarth),length(toEarth),6,2,'rgba(4,8,18,.72)','rgba(4,8,18,.3)');}
    const moonProjected=project(moon);litBall(moonProjected,7,moon,km,paintMoon,'rgba(255,255,255,.07)',lightMoon);
    const mark=Math.atan2(earthProjected.y-moonProjected.y,earthProjected.x-moonProjected.x);ctx.fillStyle='#e07a5f';ctx.beginPath();ctx.arc(moonProjected.x+Math.cos(mark)*7*moonProjected.s,moonProjected.y+Math.sin(mark)*7*moonProjected.s,2*moonProjected.s,0,Math.PI*2);ctx.fill();
    ctx.font='12px -apple-system,sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(255,220,150,.95)';ctx.fillText('太阳',sunProjected.x,sunProjected.y+sunRadius+20);ctx.fillStyle='rgba(160,215,255,.95)';ctx.fillText('地球',earthProjected.x,earthProjected.y+14*earthProjected.s+18);ctx.fillStyle='rgba(230,230,230,.9)';ctx.fillText('月球',moonProjected.x,moonProjected.y-7*moonProjected.s-10);
    drawPhaseHUD(view);drawBadge(view);
  }

  const playButton=document.getElementById('playBtn'),linkButton=document.getElementById('linkBtn'),autoButton=document.getElementById('autoRotBtn'),focusButton=document.getElementById('focusBtn');
  function syncControls(){
    playButton.textContent=playing?'⏸ 暂停':'▶ 播放';playButton.classList.toggle('on',playing);playButton.setAttribute('aria-pressed',String(playing));
    linkButton.classList.toggle('on',linked);linkButton.setAttribute('aria-pressed',String(linked));
    autoButton.classList.toggle('on',cam.auto);autoButton.setAttribute('aria-pressed',String(cam.auto));
    focusButton.classList.toggle('on',cam.focus);focusButton.setAttribute('aria-pressed',String(cam.focus));focusButton.textContent=cam.focus?'🌕 全景视角':'🔍 聚焦月球';
    document.getElementById('speed').value=String(Math.round(speed*100));document.getElementById('showOrbit').checked=showOrbits;document.getElementById('showShadow').checked=showShadows;
  }
  function pauseAndUnlink(){playing=false;linked=false;syncControls();}
  playButton.addEventListener('click',()=>{playing=!playing;syncControls();});
  linkButton.addEventListener('click',()=>{linked=!linked;if(linked){onLinkedStart();setFromPhase(store.getView().phase);playing=true;}syncControls();});
  autoButton.addEventListener('click',()=>{cam.auto=!cam.auto;syncControls();});
  focusButton.addEventListener('click',()=>{cam.focus=!cam.focus;syncControls();});
  document.getElementById('speed').addEventListener('input',event=>{speed=Number(event.currentTarget.value)/100;});
  document.getElementById('showOrbit').addEventListener('change',event=>{showOrbits=event.currentTarget.checked;});
  document.getElementById('showShadow').addEventListener('change',event=>{showShadows=event.currentTarget.checked;});
  document.getElementById('resetBtn').addEventListener('click',()=>{onReset();setFromPhase(store.getView().phase);cam.yaw=-.6;cam.pitch=.55;cam.focus=false;cam.auto=!reducedMotion;playing=!reducedMotion;linked=false;speed=.35;showOrbits=true;showShadows=true;syncControls();});
  canvas.style.cursor='grab';
  canvas.addEventListener('pointerdown',event=>{dragging=true;lastX=event.clientX;lastY=event.clientY;canvas.style.cursor='grabbing';canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!dragging)return;cam.yaw+=(event.clientX-lastX)*.007;cam.pitch=Math.max(-1.2,Math.min(1.2,cam.pitch+(event.clientY-lastY)*.005));lastX=event.clientX;lastY=event.clientY;cam.auto=false;syncControls();});
  function endDrag(){dragging=false;canvas.style.cursor='grab';}
  canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);

  addAnimation((time,dt)=>{
    if(playing){
      model.earthAng+=dt*.000018*speed;model.moonAng+=dt*.00022*speed;model.sunSpin+=dt*.00035*speed;model.earthSpin+=dt*.006*speed;if(cam.auto)cam.yaw+=dt*.00008*speed;
      if(linked){const phase=demoPhase(),view=store.getView();if(view.mode==='real'&&phase<lastLinkedPhase-.8)store.setDate(view.month.end,'solar-cycle');store.setPhase(phase,'solar');lastLinkedPhase=phase;}
    }
    cam.target=cam.focus?moonPos():{x:0,y:0,z:0};cam.dist=cam.focus?250:640;
    draw();
  },{element:canvas,fps:30});
  store.subscribe((view,meta)=>{if(meta.source!=='solar'&&meta.source!=='solar-cycle')setFromPhase(view.phase);});
  resize();setFromPhase(store.getView().phase);syncControls();addEventListener('resize',resize);
  return { pause:pauseAndUnlink };
}
