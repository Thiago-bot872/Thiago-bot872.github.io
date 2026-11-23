(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const isLightTheme = () => document.documentElement.dataset.theme === 'light';

  // Tema
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  $('.theme-toggle')?.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('theme', nextTheme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', nextTheme === 'light' ? '#f7f4fb' : '#09070d');
    setTimeout(() => {
      drawSnake();
      drawCheckers();
      drawChess();
    }, 0);
  });

  // Central de jogos
  let activeGame = 'snake';
  let difficulty = 'easy';
  const panel = $('#snake-game');
  const launcherButton = $('.snake-launcher');
  launcherButton?.addEventListener('click', () => {
    const open = panel?.classList.toggle('open');
    launcherButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && activeGame === 'snake') startSnake();
  });
  $('#snake-close')?.addEventListener('click', () => {
    panel?.classList.remove('open');
    launcherButton?.setAttribute('aria-expanded', 'false');
  });
  $('#snake-restart')?.addEventListener('click', () => startSnake());

  $$('[data-game]').forEach((button) => button.addEventListener('click', () => {
    activeGame = button.dataset.game;
    $$('[data-game]').forEach((item) => item.classList.toggle('active', item === button));
    $$('.game-view').forEach((view) => view.classList.remove('active'));
    $(`#${activeGame}-view`)?.classList.add('active');
    if (activeGame === 'snake') startSnake();
    if (activeGame === 'checkers') initCheckers();
    if (activeGame === 'chess') initChess();
  }));

  $$('[data-difficulty]').forEach((button) => button.addEventListener('click', () => {
    difficulty = button.dataset.difficulty;
    $$('[data-difficulty]').forEach((item) => item.classList.toggle('active', item === button));
    if (activeGame === 'snake') startSnake();
    if (activeGame === 'checkers') initCheckers();
    if (activeGame === 'chess') initChess();
  }));

  // COBRINHA
  const snakeCanvas = $('#snake-canvas');
  const sctx = snakeCanvas?.getContext('2d');
  let snake, snakeDir, nextDir, apple, score, snakeTimer, alive;
  const size = 16;

  function snakeEmptyCell() {
    let cell;
    do cell = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
    while (snake?.some((p) => p.x === cell.x && p.y === cell.y));
    return cell;
  }

  function startSnake() {
    clearInterval(snakeTimer);
    snake = [{x:8,y:8},{x:7,y:8},{x:6,y:8}];
    snakeDir = nextDir = 'RIGHT'; apple = snakeEmptyCell(); score = 0; alive = true;
    $('#snake-score').textContent = '0';
    drawSnake();
    snakeTimer = setInterval(snakeStep, {easy:220, medium:170, hard:120}[difficulty]);
  }

  function setSnakeDirection(dir) {
    if (dir === 'LEFT' && snakeDir !== 'RIGHT') nextDir = dir;
    if (dir === 'RIGHT' && snakeDir !== 'LEFT') nextDir = dir;
    if (dir === 'UP' && snakeDir !== 'DOWN') nextDir = dir;
    if (dir === 'DOWN' && snakeDir !== 'UP') nextDir = dir;
  }

  document.addEventListener('keydown', (event) => {
    const map = {ArrowLeft:'LEFT', ArrowRight:'RIGHT', ArrowUp:'UP', ArrowDown:'DOWN'};
    if (map[event.key]) { event.preventDefault(); setSnakeDirection(map[event.key]); }
  });
  $$('[data-direction]').forEach((button) => button.addEventListener('pointerdown', (event) => {
    event.preventEvent?.();
    event.preventDefault();
    setSnakeDirection(button.dataset.direction.toUpperCase());
  }));

  let snakeTouchStart = null;
  snakeCanvas?.addEventListener('pointerdown', (event) => {
    snakeTouchStart = { x: event.clientX, y: event.clientY };
  });
  snakeCanvas?.addEventListener('pointerup', (event) => {
    if (!snakeTouchStart) return;
    const dx = event.clientX - snakeTouchStart.x;
    const dy = event.clientY - snakeTouchStart.y;
    snakeTouchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    setSnakeDirection(Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'RIGHT' : 'LEFT')
      : (dy > 0 ? 'DOWN' : 'UP'));
  });

  function snakeStep() {
    if (!alive) return;
    snakeDir = nextDir;
    const head = {...snake[0]};
    if (snakeDir === 'LEFT') head.x--;
    if (snakeDir === 'RIGHT') head.x++;
    if (snakeDir === 'UP') head.y--;
    if (snakeDir === 'DOWN') head.y++;
    if (head.x < 0 || head.y < 0 || head.x >= size || head.y >= size || snake.some((p) => p.x === head.x && p.y === head.y)) {
      alive = false; clearInterval(snakeTimer); drawSnake();
      sctx.fillStyle = 'rgba(9,7,13,.75)'; sctx.fillRect(0,96,256,64);
      sctx.fillStyle = '#fff'; sctx.textAlign = 'center'; sctx.font = 'bold 15px sans-serif';
      sctx.fillText('Fim de jogo — clique para recomeçar',128,132);
      snakeCanvas.onclick = startSnake;
      return;
    }
    snake.unshift(head);
    if (head.x === apple.x && head.y === apple.y) {
      score++; $('#snake-score').textContent = score; apple = snakeEmptyCell();
    } else snake.pop();
    drawSnake();
  }

  function drawSnake() {
    if (!sctx) return;
    const cell = 256 / size;
    sctx.fillStyle = isLightTheme() ? '#ece5f7' : '#0e0a13'; sctx.fillRect(0,0,256,256);
    sctx.fillStyle = '#d83b57'; sctx.beginPath(); sctx.arc(apple.x*cell+cell/2,apple.y*cell+cell/2,6,0,Math.PI*2); sctx.fill();
    sctx.fillStyle = '#78a04a'; sctx.fillRect(apple.x*cell+9,apple.y*cell+2,3,6);
    snake.forEach((p,i) => {
      sctx.fillStyle = i === 0 ? '#7740ad' : `hsl(267,68%,${isLightTheme() ? 42 : 58-Math.min(i,12)}%)`;
      sctx.beginPath();
      if (typeof sctx.roundRect === 'function') sctx.roundRect(p.x*cell+1,p.y*cell+1,cell-2,cell-2,5);
      else sctx.rect(p.x*cell+1,p.y*cell+1,cell-2,cell-2);
      sctx.fill();
      if (i === 0) { sctx.fillStyle='#fff'; sctx.beginPath(); sctx.arc(p.x*cell+5,p.y*cell+5,1.5,0,Math.PI*2); sctx.arc(p.x*cell+11,p.y*cell+5,1.5,0,Math.PI*2); sctx.fill(); }
    });
  }

  // DAMAS — jogador claro contra bot escuro
  const checkersCanvas = $('#checkers-canvas');
  const cctx = checkersCanvas?.getContext('2d');
  const checkersStatus = $('#checkers-status');
  let cb, cs, cTurn, cGameOver, cCaptureChain;

  function initCheckers() {
    cb = Array.from({length:8},()=>Array(8).fill(null));
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) if ((r+c)%2) {
      if (r<3) cb[r][c]={side:'b',king:false};
      if (r>4) cb[r][c]={side:'w',king:false};
    }
    cs=null; cTurn=true; cGameOver=false; cCaptureChain=null;
    checkersStatus.textContent='Sua vez: peças claras'; drawCheckers();
  }

  function drawCheckers() {
    if (!cctx) return;
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      cctx.fillStyle=(r+c)%2 ? (isLightTheme()?'#d8c7eb':'#17101f') : (isLightTheme()?'#f1ebf7':'#332044'); cctx.fillRect(c*40,r*40,40,40);
      const p=cb[r][c]; if (!p) continue;
      const x=c*40+20,y=r*40+20,g=cctx.createRadialGradient(x-5,y-6,2,x,y,14);
      g.addColorStop(0,p.side==='w'?'#ffffff':'#5a2d78'); g.addColorStop(1,p.side==='w'?'#7a43b8':'#2a123d');
      cctx.fillStyle=g; cctx.beginPath(); cctx.arc(x,y,14,0,Math.PI*2); cctx.fill(); cctx.strokeStyle=p.side==='b'?'#160820':'#5a357a'; cctx.stroke();
      if(p.king){cctx.fillStyle=isLightTheme()?'#2d1b3d':'#fff';cctx.font='16px serif';cctx.textAlign='center';cctx.fillText('♛',x,y+6);}
    }
    if(cs){
      cctx.strokeStyle=isLightTheme()?'#6f3dab':'#d5b0ff';cctx.lineWidth=3;cctx.strokeRect(cs.c*40+2,cs.r*40+2,36,36);
      if(cTurn&&!cGameOver){
        for(const m of checkersMoves('w').filter(move=>move.from.r===cs.r&&move.from.c===cs.c)){
          cctx.fillStyle='rgba(155,92,246,.42)';cctx.beginPath();cctx.arc(m.to.c*40+20,m.to.r*40+20,7,0,Math.PI*2);cctx.fill();
        }
      }
    }
  }

  function checkersMoves(side) {
    const moves=[];
    for(let r=0;r<8;r++)for(let c=0;c<8;c++){
      const p=cb[r][c]; if(!p||p.side!==side)continue;
      const rows=p.king?[-1,1]:side==='w'?[-1]:[1];
      for(const dr of rows)for(const dc of [-1,1]){
        const mr=r+dr,mc=c+dc,lr=r+dr*2,lc=c+dc*2;
        if(mr>=0&&mr<8&&mc>=0&&mc<8&&!cb[mr][mc])moves.push({from:{r,c},to:{r:mr,c:mc},capture:null});
        if(lr>=0&&lr<8&&lc>=0&&lc<8&&!cb[lr][lc]&&cb[mr]?.[mc]?.side&&cb[mr][mc].side!==side)moves.push({from:{r,c},to:{r:lr,c:lc},capture:{r:mr,c:mc}});
      }
    }
    const captures=moves.filter(m=>m.capture); return captures.length?captures:moves;
  }

  function applyCheckers(move){const p=cb[move.from.r][move.from.c];cb[move.from.r][move.from.c]=null;cb[move.to.r][move.to.c]=p;if(move.capture)cb[move.capture.r][move.capture.c]=null;if(p.side==='w'&&move.to.r===0)p.king=true;if(p.side==='b'&&move.to.r===7)p.king=true;}

  function botCheckers(moves){
    if(difficulty==='easy')return moves[Math.floor(Math.random()*moves.length)];
    if(difficulty==='medium')return moves.find(m=>m.capture)||moves[Math.floor(Math.random()*moves.length)];
    let best=moves[0],score=-Infinity;
    for(const m of moves){let s=m.capture?20:0;if(m.to.r===0||m.to.r===7)s+=12;s+=7-Math.abs(m.to.r-3.5)*.3;if(s>score){score=s;best=m;}}
    return best;
  }

  function countCheckers(side){return cb.flat().filter(piece=>piece?.side===side).length;}

  function finishCheckersCheck(side){
    if(!countCheckers(side)){
      cGameOver=true;cTurn=false;checkersStatus.textContent=side==='b'?'Você venceu!':'O bot venceu!';return true;
    }
    return false;
  }

  function runCheckersBot(){
    const moves=checkersMoves('b');
    if(!moves.length||finishCheckersCheck('b')){if(!cGameOver){cGameOver=true;cTurn=false;checkersStatus.textContent='Você venceu!';}drawCheckers();return;}
    let move=botCheckers(moves);
    applyCheckers(move);drawCheckers();
    if(move.capture){
      let continued=checkersMoves('b').filter(m=>m.capture&&m.from.r===move.to.r&&m.from.c===move.to.c);
      if(continued.length){setTimeout(()=>{move=botCheckers(continued);applyCheckers(move);drawCheckers();runCheckersBotCapture(move);},180);return;}
    }
    if(finishCheckersCheck('w')){drawCheckers();return;}
    cTurn=true;cCaptureChain=null;
    const humanMoves=checkersMoves('w');
    if(!humanMoves.length){cGameOver=true;cTurn=false;checkersStatus.textContent='O bot venceu!';}
    else checkersStatus.textContent='Sua vez: peças claras';
    drawCheckers();
  }

  function runCheckersBotCapture(move){
    const continued=checkersMoves('b').filter(m=>m.capture&&m.from.r===move.to.r&&m.from.c===move.to.c);
    if(continued.length){setTimeout(()=>{const next=botCheckers(continued);applyCheckers(next);drawCheckers();runCheckersBotCapture(next);},180);return;}
    if(finishCheckersCheck('w')){drawCheckers();return;}
    cTurn=true;cCaptureChain=null;
    const humanMoves=checkersMoves('w');
    if(!humanMoves.length){cGameOver=true;cTurn=false;checkersStatus.textContent='O bot venceu!';}
    else checkersStatus.textContent='Sua vez: peças claras';
    drawCheckers();
  }

  checkersCanvas?.addEventListener('pointerdown',(event)=>{
    event.preventDefault();
    if(cGameOver){initCheckers();return;}
    if(!cTurn)return;
    const rect=checkersCanvas.getBoundingClientRect(),c=Math.floor((event.clientX-rect.left)*8/rect.width),r=Math.floor((event.clientY-rect.top)*8/rect.height),p=cb[r]?.[c];
    if(p?.side==='w'){
      const available=cCaptureChain?checkersMoves('w').filter(m=>m.capture&&m.from.r===cCaptureChain.r&&m.from.c===cCaptureChain.c):checkersMoves('w');
      if(available.some(m=>m.from.r===r&&m.from.c===c))cs={r,c};
      return;
    }
    if(cs){
      let moves=checkersMoves('w').filter(m=>m.from.r===cs.r&&m.from.c===cs.c&&m.to.r===r&&m.to.c===c);
      if(cCaptureChain)moves=moves.filter(m=>m.capture);
      const m=moves[0];
      if(m){applyCheckers(m);cs={r,c};cTurn=false;drawCheckers();
        if(m.capture){
          const continued=checkersMoves('w').filter(next=>next.capture&&next.from.r===r&&next.from.c===c);
          if(continued.length){cCaptureChain={r,c};cTurn=true;cs={r,c};checkersStatus.textContent='Continue capturando';drawCheckers();return;}
        }
        cs=null;cCaptureChain=null;
        if(finishCheckersCheck('b')){drawCheckers();return;}
        checkersStatus.textContent='Bot pensando…';setTimeout(runCheckersBot,difficulty==='hard'?520:320);
      }
    }
    drawCheckers();
  });

  // XADREZ — jogador branco contra bot preto
  const chessCanvas=$('#chess-canvas'), xctx=chessCanvas?.getContext('2d'), chessStatus=$('#chess-status');
  let xb,xs,xTurn,xGameOver; const symbols={w:{k:'♔',q:'♕',r:'♖',b:'♗',n:'♘',p:'♙'},b:{k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'}};

  function initChess(){
    xb=[['br','bn','bb','bq','bk','bb','bn','br'],['bp','bp','bp','bp','bp','bp','bp','bp'],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null],['wp','wp','wp','wp','wp','wp','wp','wp'],['wr','wn','wb','wq','wk','wb','wn','wr']];
    xs=null; xTurn=true; xGameOver=false;
    chessStatus.textContent='Sua vez: peças brancas'; drawChess();
  }

  function drawChess(){
    if(!xctx)return;
    for(let r=0;r<8;r++)for(let c=0;c<8;c++){
      xctx.fillStyle=(r+c)%2 ? (isLightTheme()?'#d8c7eb':'#17101f') : (isLightTheme()?'#f1ebf7':'#332044'); xctx.fillRect(c*40,r*40,40,40);
      const p=xb[r][c];
      if(p){xctx.fillStyle=p[0]=='w'?(isLightTheme()?'#5f2d8f':'#f8efff'):(isLightTheme()?'#7a43b8':'#9b5cf6');xctx.font='34px Georgia,serif';xctx.textAlign='center';xctx.textBaseline='middle';xctx.fillText(symbols[p[0]][p[1]],c*40+20,r*40+21);}
    }
    if(xs){
      xctx.strokeStyle=isLightTheme()?'#6f3dab':'#d5b0ff';xctx.lineWidth=3;xctx.strokeRect(xs.c*40+2,xs.r*40+2,36,36);
      if(xTurn&&!xGameOver){
        for(const m of chessMoves('w').filter(move=>move.from.r===xs.r&&move.from.c===xs.c)){
          xctx.fillStyle='rgba(155,92,246,.42)';xctx.beginPath();xctx.arc(m.to.c*40+20,m.to.r*40+20,7,0,Math.PI*2);xctx.fill();
        }
      }
    }
  }

  function copyChessBoard(){return xb.map(row=>row.slice());}

  function findChessKing(board,side){
    for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]===side+'k')return {r,c};
    return null;
  }

  function chessSquareAttacked(board,r,c,attacker){
    const pawnDir=attacker==='w'?-1:1;
    for(const dc of [-1,1]){
      const pr=r-pawnDir,pc=c-dc;
      if(pr>=0&&pr<8&&pc>=0&&pc<8&&board[pr][pc]===attacker+'p')return true;
    }
    for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){
      const tr=r+dr,tc=c+dc;if(tr>=0&&tr<8&&tc>=0&&tc<8&&board[tr][tc]===attacker+'n')return true;
    }
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
      if(!dr&&!dc)continue;
      const tr=r+dr,tc=c+dc;if(tr>=0&&tr<8&&tc>=0&&tc<8&&board[tr][tc]===attacker+'k')return true;
    }
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]){
      let tr=r+dr,tc=c+dc;
      while(tr>=0&&tr<8&&tc>=0&&tc<8){
        const piece=board[tr][tc];
        if(piece){
          if(piece[0]===attacker){
            const line=dr===0||dc===0;
            const diagonal=dr!==0&&dc!==0;
            if(piece[1]==='q'||(line&&piece[1]==='r')||(diagonal&&piece[1]==='b'))return true;
          }
          break;
        }
        tr+=dr;tc+=dc;
      }
    }
    return false;
  }

  function chessInCheck(board,side){
    const king=findChessKing(board,side);
    return !!king&&chessSquareAttacked(board,king.r,king.c,side==='w'?'b':'w');
  }

  function chessPseudoMoves(board,side){
    const moves=[];
    for(let r=0;r<8;r++)for(let c=0;c<8;c++){
      const p=board[r][c];if(!p?.startsWith(side))continue;
      const type=p[1];
      const add=(tr,tc)=>{
        if(tr>=0&&tr<8&&tc>=0&&tc<8){
          const target=board[tr][tc];
          if(!target) moves.push({from:{r,c},to:{r:tr,c:tc}});
          else if(!target.startsWith(side)&&target[1]!=='k')moves.push({from:{r,c},to:{r:tr,c:tc}});
        }
      };
      if(type==='p'){
        const d=side==='w'?-1:1,start=side==='w'?6:1;
        if(!board[r+d]?.[c]){add(r+d,c);if(r===start&&!board[r+d*2]?.[c])add(r+d*2,c);}
        for(const dc of[-1,1]){
          const target=board[r+d]?.[c+dc];
          if(target&&target[0]!==side&&target[1]!=='k')add(r+d,c+dc);
        }
      }else if(type==='n'){
        for(const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])add(r+dr,c+dc);
      }else if(type==='k'){
        for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc)add(r+dr,c+dc);
      }else{
        const dirs=type==='r'?[[-1,0],[1,0],[0,-1],[0,1]]:type==='b'?[[-1,-1],[-1,1],[1,-1],[1,1]]:[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
        for(const [dr,dc] of dirs){let tr=r+dr,tc=c+dc;while(tr>=0&&tr<8&&tc>=0&&tc<8){const target=board[tr][tc];if(!target){moves.push({from:{r,c},to:{r:tr,c:tc}});}else{if(!target.startsWith(side)&&target[1]!=='k')moves.push({from:{r,c},to:{r:tr,c:tc}});break;}tr+=dr;tc+=dc;}}
      }
    }
    return moves;
  }

  function chessMoves(side){
    return chessPseudoMoves(xb,side).filter((move)=>{
      const test=copyChessBoard();
      const piece=test[move.from.r][move.from.c];
      test[move.to.r][move.to.c]=piece;test[move.from.r][move.from.c]=null;
      if(piece[1]==='p'&&(move.to.r===0||move.to.r===7))test[move.to.r][move.to.c]=piece[0]+'q';
      return !chessInCheck(test,side);
    });
  }

  function applyChess(move){
    const piece=xb[move.from.r][move.from.c];xb[move.to.r][move.to.c]=piece;xb[move.from.r][move.from.c]=null;
    if(piece[1]==='p'&&(move.to.r===0||move.to.r===7))xb[move.to.r][move.to.c]=piece[0]+'q';
  }

  function botChess(moves){
    if(difficulty==='easy')return moves[Math.floor(Math.random()*moves.length)];
    const values={p:1,n:3,b:3,r:5,q:9,k:100};let best=moves[0],score=-Infinity;
    for(const move of moves){const capture=xb[move.to.r][move.to.c];let s=capture?values[capture[1]]*10:0;if(difficulty==='hard')s+=7-(Math.abs(move.to.r-3.5)+Math.abs(move.to.c-3.5))*0.5;if(s>score){score=s;best=move;}}
    return best;
  }

  chessCanvas?.addEventListener('pointerdown',(event)=>{
    event.preventDefault();
    if(xGameOver){initChess();return;}
    if(!xTurn)return;
    const rect=chessCanvas.getBoundingClientRect();
    const c=Math.floor((event.clientX-rect.left)*8/rect.width),r=Math.floor((event.clientY-rect.top)*8/rect.height),p=xb[r]?.[c];
    if(p?.startsWith('w'))xs={r,c};
    else if(xs){
      const move=chessMoves('w').find((item)=>item.from.r===xs.r&&item.from.c===xs.c&&item.to.r===r&&item.to.c===c);
      if(move){
        const captured=xb[move.to.r][move.to.c];
        applyChess(move);xs=null;xTurn=false;drawChess();
        if(captured==='bk'){chessStatus.textContent='Você capturou o rei preto — vitória!';xGameOver=true;drawChess();return;}
        if(chessInCheck(xb,'b')){
          const botMoves=chessMoves('b');
          if(!botMoves.length){chessStatus.textContent='Xeque-mate! Você venceu!';xGameOver=true;drawChess();return;}
          chessStatus.textContent='Xeque no rei preto — bot pensando…';
        }else chessStatus.textContent='Bot pensando…';
        setTimeout(()=>{
          const moves=chessMoves('b');
          if(!moves.length){
            if(chessInCheck(xb,'b'))chessStatus.textContent='Xeque-mate! Você venceu!';
            else chessStatus.textContent='Empate — não há jogadas legais';
            xGameOver=true;
          }else{
            const botMove=botChess(moves);
            const captured=xb[botMove.to.r][botMove.to.c];
            applyChess(botMove);drawChess();
            if(captured==='wk'){chessStatus.textContent='O bot capturou seu rei — derrota!';xGameOver=true;drawChess();return;}
            if(chessInCheck(xb,'w')){
              const humanMoves=chessMoves('w');
              if(!humanMoves.length){chessStatus.textContent='Xeque-mate! O bot venceu!';xGameOver=true;}
              else {chessStatus.textContent='Xeque no seu rei — sua vez';xTurn=true;}
            }else{
              const humanMoves=chessMoves('w');
              if(!humanMoves.length){chessStatus.textContent='Empate — não há jogadas legais';xGameOver=true;}
              else {chessStatus.textContent='Sua vez: peças brancas';xTurn=true;}
            }
          }
          drawChess();
        },difficulty==='hard'?650:380);
      }
    }
    drawChess();
  });

  snakeCanvas?.addEventListener('click', () => {
    snakeCanvas.focus();
    if (!alive) startSnake();
  });

  startSnake(); initCheckers(); initChess();
})();
