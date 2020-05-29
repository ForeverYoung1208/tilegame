'use strict'


class ProgressMeter{
  constructor(totalStages, left){
    this.totalStages = totalStages
    this.node = document.createElement('div')
    this.node.innerHTML = `
      <div id='progress__wrapper'> 
        <h2>Progress meter</h2>
        <div class='progress__border'>
          <div class='progress__bar'></div>
        </div>
        <h3 id='progress__message'></h3>
        </div>
    `
    this.progressbarNode = this.node.querySelector('.progress__bar')
    this.messageNode = this.node.querySelector('#progress__message')
    this.setProgress(left)

    this.render = ()=>{
      return this.node
    }
  }

  setProgress(left){
    this.progressbarNode.style.width = ( (this.totalStages - left)/this.totalStages * 100 ).toFixed() + '%'
    left === 0
    ? this.messageNode.textContent = 'You win!!! Cool!'
    : this.messageNode.textContent = `left ${left} stages of ${this.totalStages}`
  }

}

class AbstractGameField {
  constructor(gameOptions){
    const {sizeX, sizeY, cellsX, cellsY, colors, winPatterns} = gameOptions;

    this.cellWidth = sizeX/cellsX
    this.cellHight = sizeY/cellsY
    this.cells = []

    this.node = document.createElement('div')
    this.node.style.width = (sizeX+0)+'px';
    this.node.style.height = (sizeY+0)+'px';
    this.node.style.minHeight = (sizeY+0)+'px';
    // this.fillCells(cellsY, cellsX, colors);

    this.render = ()=>{
      this.node.className = 'abstract-game-field'
      return this.node
    }
  }

}

class Cell{
  constructor(cellColor, y, x,  cellWidth, cellHight, gameFieldNode ){

    this.cellWidth = cellWidth
    this.cellHight = cellHight
    this.color = cellColor
    this.buildNode(y,x,gameFieldNode)
  }

  removeNode(){
    this.node.remove();
  }

  buildNode(y,x,gameFieldNode){
    this.node = document.createElement('div')
    this.node.dataset.y = y
    this.node.dataset.x = x

    this.node.className = 'cell color-'+this.color;
    
    this.node.style.height = this.cellHight+'px'
    this.node.style.width = this.cellWidth+'px'
    this.node.style.top = this.cellHight*y+'px'
    this.node.style.left = this.cellWidth*x+'px'
    gameFieldNode.appendChild(this.node)
  }

  animateDown(){
    this.node.style.top = String(this.node.dataset.y*this.cellHight + this.cellHight) + 'px'
  }

  animateUp(){
    this.node.style.top = String(this.node.dataset.y*this.cellHight - this.cellHight) + 'px'
  }

  animateLeft(){
    this.node.style.left = String(this.node.dataset.x*this.cellWidth - this.cellWidth) + 'px'
  }

  animateRight(){
    this.node.style.left = String(this.node.dataset.x*this.cellWidth + this.cellWidth) + 'px'
  }

}

class TilesGame extends AbstractGameField{
  constructor(gameOptions){
    super(gameOptions)

    const {sizeX, sizeY, cellsX, cellsY, colors, winPatterns} = gameOptions;
    const startingWinPatternsAmount = winPatterns.length
    
    this.winPatterns = winPatterns
    this.pointedCellNode = null;
    this.progressMeter = new ProgressMeter(startingWinPatternsAmount, winPatterns.length)
    this.sampleFields = new SampleFields(gameOptions)
    this.fillCellsRandomly(cellsY, cellsX, colors);


    this.node.onclick = this.clickHandler.bind(this);
    this.node.onmousemove = ( e => this.pointedCellNode = e.toElement)

    document.onkeypress = this.keypressHanler.bind(this)
    this.render = ()=>{
      this.node.className = 'game-field'
      return this.node
    }    

  }

  //fill randomly from given colors
  fillCellsRandomly(cellsY, cellsX, colors){
    let colorsPool = colors.flat()
    let randomPoolIndex;
    this.cells = new Array(cellsY);
    for (let y = 0; y<cellsY; y++){
      this.cells[y] = new Array(cellsX)
      for (let x = 0; x<cellsX; x++){
        randomPoolIndex = Math.round( Math.random()*colorsPool.length)-1;
        let randomColor = colorsPool.splice(randomPoolIndex,1);
        this.cells[y][x]= new Cell(randomColor[0], y, x, this.cellWidth, this.cellHight, this.node);
      }
    }
  }
  
  clickHandler(e){
    this.moveCell(+e.target.dataset.y, +e.target.dataset.x).then(()=>{
      let stagesLeft = this.checkWinState()  // false or array of remaining win patters
      if (!stagesLeft) return;
      this.progressMeter.setProgress(stagesLeft.length)
      if (stagesLeft.length>0){
        // console.log('Stage done! '+ stagesLeft.length+ ' left');
      } else {
        setTimeout(()=>{
          confirm('you win! Play again?')
          ? startGame()
          : closeGame()
        }, 200) 
      }
    })
  }

  keypressHanler(e){
    if (e.key === 'Enter'){
      this.pointedCellNode.click();

    }

  }

  checkWinState(){
    // console.log('not a winner yet');
    for( let y = 0; y < this.cells.length; y++){
      for ( let x = 0; x < this.cells[y].length; x++){
        if ( this.winPatterns[0][y][x]!=='any' && this.cells[y][x].color !== this.winPatterns[0][y][x]){
          // console.log('fail on', y, x );
          // console.log('expected ', this.winPatterns[0][y][x]);
          // console.log('got ', this.cells[y][x].color );
          // console.log('-----------');
          return false
        }
      }
    }
    this.winPatterns.splice(0, 1)
    return this.winPatterns
  }

  async moveCell(y,x){
    if ( !isFinite(x) || !isFinite(y) ) return console.log('strange NaN - maybe, misclick');
    if ( this.cells[y][x+1] && this.cells[y][x+1].color==='empty' ){
      // console.log('right');
      this.cells[y][x].animateRight()
      await this.swapCells({y, x}, {y, x:x+1})             //includes timeout for finish animation

    }else if( this.cells[y+1] && this.cells[y+1][x].color==='empty' ){
      // console.log('down');      
      this.cells[y][x].animateDown()
      await this.swapCells({y, x}, {y: y+1, x})             //includes timeout for finish animation
      
    }else if( this.cells[y][x-1] && this.cells[y][x-1].color==='empty' ){
      // console.log('left');
      this.cells[y][x].animateLeft()
      await this.swapCells({y, x}, {y, x:x-1})             //includes timeout for finish animation

    }else if( this.cells[y-1] && this.cells[y-1][x].color==='empty' ){
      // console.log('up');
      this.cells[y][x].animateUp()
      await this.swapCells({y, x}, {y: y-1, x})             //includes timeout for finish animation

    }
  }

  async swapCells(c1, c2){
    // disable click handling to prevent simulatinous moves
    this.node.onclick=null;

    //swap in cells array
    let tmp = this.cells[c1.y][c1.x]
    this.cells[c1.y][c1.x] = this.cells[c2.y][c2.x]
    this.cells[c2.y][c2.x] = tmp

    // swap in DOM after animation ends through deleting nodes
    // and then rebuild them from cells array
    
    await new Promise(resolve => {
      setTimeout(()=>{
        
        this.cells[c1.y][c1.x].removeNode();
        this.cells[c2.y][c2.x].removeNode();
        
        this.cells[c1.y][c1.x].buildNode(c1.y, c1.x, this.node);
        this.cells[c2.y][c2.x].buildNode(c2.y, c2.x, this.node);
        
        //re-bind click handler to enable new turns
        this.node.onclick = this.clickHandler.bind(this);
        resolve();
      }, 100)    
    })
  }  
}

class SampleFields{
  constructor(gameOptions){
    const {winPatterns} = gameOptions;
    const sampleFieldOptions={
      ...gameOptions,
      sizeX: gameOptions.sizeX/gameOptions.sampleAspect,
      sizeY: gameOptions.sizeY/gameOptions.sampleAspect,
    }
    this.node = document.createElement('div')
    this.node.innerHTML=
    `
    <div class='sample-fields-wrapper'>
      <h3> Stages to complete </h3>
      <div class ='sample-fields'></div>
    </div>
    `
    const sampleFields = this.node.querySelector('.sample-fields')
    
    winPatterns.forEach( (pattern, index) =>{
      const t = sampleFields.appendChild(document.createElement('h4'))
      t.innerHTML='Stage '+ (index+1)+ ' :'
      sampleFields.appendChild( new SampleField(sampleFieldOptions, pattern).render())
    })
    this.render = () =>{
      return this.node
    }
  }
}

class SampleField extends AbstractGameField{
  constructor(gameOptions, pattern){
    super(gameOptions)
    this.cells = pattern  
    this.fillCells(gameOptions.cellsY, gameOptions.cellsX, pattern);    
    this.render = ()=>{
      this.node.className = 'sample-game-field'
      return this.node
    }        

  }
  //fill directly from given pattern
  fillCells(cellsY, cellsX, pattern){
    
    // console.log('[pattern]', pattern);
    this.cells = new Array(cellsY);
    for (let y = 0; y<cellsY; y++){
      this.cells[y] = new Array(cellsX)
      for (let x = 0; x<cellsX; x++){
        this.cells[y][x]= new Cell(pattern[y][x], y, x, this.cellWidth, this.cellHight, this.node);
      }
    }
    // console.log('[this.cells]', this.cells);

  }
}


const gameOptions1 = {
  sizeX:400,
  sizeY:400,
  sampleAspect:4,
  cellsX: 4,
  cellsY: 4,
  colors: [1,2,3,4].map( n => ['green', 'yellow', 'blue', 'red']),
  winPatterns:[[
    ['yellow', 'any', 'any', 'any'],
    ['yellow', 'any', 'any', 'any'],
    ['yellow', 'any', 'any', 'any'],
    ['yellow', 'any', 'any', 'empty'],
  ],
  [
    ['blue', 'blue', 'blue', 'blue'],
    ['any', 'any', 'any', 'any'],
    ['any', 'any', 'any', 'any'],
    ['any', 'any', 'any', 'empty'],
  ],
  [
    ['any', 'any', 'any', 'red'],
    ['any', 'any', 'red', 'any'],
    ['any', 'red', 'any', 'any'],
    ['red', 'any', 'any', 'empty'],
  ],
  [
    ['yellow', 'red', 'green', 'blue'],
    ['any', 'any', 'any', 'any'],
    ['any', 'any', 'any', 'any'],
    ['yellow', 'red', 'green', 'empty'],
  ]]
}
gameOptions1.colors[0][0]='empty'


function startGame(selector='#game-wrapper'){
  const gameNode = document.querySelector(selector)
  let JSONgameOprions1 = JSON.stringify(gameOptions1)
  const game = new TilesGame( JSON.parse(JSONgameOprions1));
  gameNode.innerHTML = '';
  gameNode.appendChild( game.progressMeter.render() )
  gameNode.appendChild( game.render() )
  gameNode.appendChild( game.sampleFields.render() )  
}

function closeGame(selector='#game-wrapper') {
  const gameNode = document.querySelector(selector)
  gameNode.innerHTML = '';
  alert('Bye! See Ya !')
}


startGame();