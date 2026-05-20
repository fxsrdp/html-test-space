// custom proximity cursor — cyan edition
(function(){
  var M = document.createElement('div');
  M.id = 'milestone-marker';
  M.innerHTML = '<span class="hl">I</span>&#8288;·&#8288;<span class="hl">I</span>';
  document.body.appendChild(M);

  var C = document.getElementById('cur');
  if(!C) return;

  var dots = [C.querySelector('.d1'),C.querySelector('.d2'),C.querySelector('.d3')];
  var targets = document.querySelectorAll('a[href], button, .btn, [data-cursor]');
  var dragTargets = document.querySelectorAll('[data-drag="true"]');
  var cx = 0, cy = 0;
  var onDrag = false;
  var splitTimer = null, cdTimer = null, cooling = false;
  var physRunning = false;
  var cursorVX = 0, cursorVY = 0;

  var state = dots.map(function(d,i){
    return {x:0, y:0, vx:0, vy:0, el:d};
  });

  document.addEventListener('mousemove', function(e){
    cursorVX = e.clientX - cx;
    cursorVY = e.clientY - cy;
    cx = e.clientX; cy = e.clientY;
    C.style.transform = 'translate('+cx+'px,'+cy+'px) translate(-50%,-50%)';
    C.classList.add('vis');
  });
  document.addEventListener('mouseleave', function(){ C.classList.remove('vis'); });

  function edgeDist(x, y, el){
    var r = el.getBoundingClientRect();
    var ex = Math.max(r.left - x, 0, x - r.right);
    var ey = Math.max(r.top - y, 0, y - r.bottom);
    return Math.sqrt(ex*ex + ey*ey);
  }

  function physicsTick(){
    if(!C.classList.contains('split')){ physRunning = false; return; }
    physRunning = true;
    var dt=0.8, G=1.8, soften=6, damp=0.997, repel=800, repelR=10;

    var cxm=0, cym=0;
    for(var i=0;i<3;i++){ cxm+=state[i].x; cym+=state[i].y; }
    cxm/=3; cym/=3;

    for(var i=0;i<3;i++){
      var s=state[i], ax=0, ay=0;

      var dxc=cxm-s.x, dyc=cym-s.y;
      var dc=Math.sqrt(dxc*dxc+dyc*dyc+soften*soften);
      ax+=G*dxc/(dc*dc*dc); ay+=G*dyc/(dc*dc*dc);

      for(var j=0;j<3;j++){
        if(i===j)continue;
        var rx=state[j].x-s.x, ry=state[j].y-s.y;
        var dist=Math.sqrt(rx*rx+ry*ry+soften*soften);
        ax+=G*rx/(dist*dist*dist)*0.7;
        ay+=G*ry/(dist*dist*dist)*0.7;
        var rd=Math.sqrt(rx*rx+ry*ry);
        if(rd<repelR&&rd>0.5){
          var f=repel/(rd*rd);
          ax-=(rx/rd)*f*0.016;
          ay-=(ry/rd)*f*0.016;
        }
      }

      ax+=cursorVX*0.005; ay+=cursorVY*0.005;

      var dcurX=-s.x, dcurY=-s.y;
      var dcur=Math.sqrt(dcurX*dcurX+dcurY*dcurY);
      if(dcur>0.3){ ax+=0.35*dcurX/dcur; ay+=0.35*dcurY/dcur; }

      s.vx+=ax*dt; s.vy+=ay*dt;
      s.vx*=damp; s.vy*=damp;
      s.x+=s.vx*dt; s.y+=s.vy*dt;

      s.el.style.transform='translate(calc(-50% + '+s.x.toFixed(2)+'px), calc(-50% + '+s.y.toFixed(2)+'px)) scale(1)';
    }
    requestAnimationFrame(physicsTick);
  }

  function split(){
    if(cooling)return;
    clearTimeout(splitTimer);
    splitTimer=setTimeout(function(){
      for(var i=0;i<3;i++){
        var angle=(i/3)*Math.PI*2+Math.random()*0.5;
        var r=4+Math.random()*6;
        state[i].x=Math.cos(angle)*r;
        state[i].y=Math.sin(angle)*r;
        state[i].vx=Math.cos(angle+Math.PI/2)*2.5+(Math.random()-0.5);
        state[i].vy=Math.sin(angle+Math.PI/2)*2.5+(Math.random()-0.5);
      }
      C.classList.add('split');
      C.classList.remove('rejoin');
      if(!physRunning)physicsTick();
      cdTimer=setTimeout(function(){cooling=true;setTimeout(function(){cooling=false},500)},3000);
    },200);
  }

  function rejoin(){
    clearTimeout(splitTimer);clearTimeout(cdTimer);
    C.classList.add('rejoin');C.classList.remove('split','on');
    cooling=false;physRunning=false;
    setTimeout(function(){C.classList.remove('rejoin')},300);
  }

  function update(){
    var bestDrag = null, bestDragD = Infinity;
    for(var i=0; i<dragTargets.length; i++){
      var d = edgeDist(cx, cy, dragTargets[i]);
      if(d < bestDragD){ bestDragD = d; bestDrag = dragTargets[i]; }
    }

    if(bestDrag && bestDragD < 60){
      C.classList.add('on');
      if(!onDrag){ onDrag = true; split(); }
      C.style.opacity = Math.max(0.3, 1 - bestDragD/60);
      requestAnimationFrame(update);
      return;
    }

    if(onDrag){
      onDrag = false;
      rejoin();
    }

    var best = null, bestD = Infinity;
    for(var i=0; i<targets.length; i++){
      var d = edgeDist(cx, cy, targets[i]);
      if(d < bestD){ bestD = d; best = targets[i]; }
    }

    if(best && bestD < 60){
      C.classList.add('on');
      C.classList.remove('split','rejoin');
      C.style.opacity = Math.max(0.3, 1 - bestD/60);
    } else {
      C.classList.remove('on','split','rejoin');
      C.style.opacity = bestD < 200 ? Math.max(0.15, 0.4 - bestD/500) : 0.4;
    }
    requestAnimationFrame(update);
  }
  update();
})();
