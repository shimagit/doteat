"use strict";

// =================== 02_breakout ====================

class Rectangle
{
  constructor( x, y, width, height )
  {
    this.mX = x;
    this.mY = y;
    this.mWidth = width;
    this.mHeight = height;
  }

  contains( x, y )
  {
    return( this.mX <= x && x < this.mX + this.mWidth &&
            this.mY <= y && y < this.mY + this.mHeight );
  }
  
  get pCX()
  {
    return( this.mX + this.mWidth / 2 );
  }
  set pCX( value )
  {
    this.mX = value - this.mWidth / 2;
  }

  get pCY()
  {
    return( this.mY + this.mHeight / 2 );
  }
  set pCY( value )
  {
    this.mY = value - this.mHeight / 2;
  }
}
// =================== 04_doteat ====================

class BG
{
  constructor( tile, width, height )
  {
    this.mTile = tile;
    this.mWidth = width;
    this.mHeight = height;
  }
  draw( g )
  {
    for( let y = 0; y < this.mHeight; y++ ){
      for( let x = 0; x < this.mWidth; x++ ){
        this.mTile.draw( g, this.getName( x, y ), 0, x * this.mTile.mDot, y * this.mTile.mDot );
      }
    }
  }

  getName( x, y )
  {
    return( this.mName[ this.index( x, y ) ] );
  }

  index( x, y )
  {
    return( y * this.mWidth + x );
  }

  setName( x, y, value )
  {
    this.mName[ this.index( x, y ) ] = value;
  }
}

class Sprite extends Rectangle
{
  constructor( tile, clm, row, x = 0, y = 0 )
  {
    super( x, y, tile.mDot, tile.mDot );
    this.mTile = tile;
    this.mClm = clm;
    this.mRow = row;
  }

  draw( g )
  {
    this.mTile.draw( g, this.mClm, this.mRow, this.mX, this.mY );
  }

}

class Tile
{
  constructor( img, dot )
  {
    this.mImg = img;
    this.mDot = dot;
  }

  draw( g, clm, row, x, y )
  {
    g.drawImage( this.mImg, clm * this.mDot, row * this.mDot, this.mDot, this.mDot, x, y, this.mDot, this.mDot );
  }
}

// =================== MAIN ====================

const MAG = 3;
const MAP_WIDTH = 30;
const MAP_HEIGHT = 22;
const MESH = 8;
const RES_IMG = "tile.png";
const RES_SE = [ "se0.mp3", "se1.mp3", "se2.mp3" ];
const WIDTH = 240;
const HEIGHT = 176;

var gChange;
var gFailed;
var gWait = 61;
var gBG;
var gCount;
var gEnemy = [];
var gGameOver;
var gPlayer;
var gStage = 0;
var gTile;

class Character extends Sprite
{
  static  sCos = [ 1, 0, -1, 0 ];
  static  sSin = [ 0, 1, 0, -1 ];

  constructor( tile, clm, row, turn )
  {
    super( tile, clm, row );
    this.mTurn = turn;
  }

  checkCurve()
  {
    if( this.mX % MESH || this.mY % MESH ){
      return;
    }

    let x = this.mX / MESH;
    let y = this.mY / MESH;

    if( gBG.getName( x, y ) == 1 ){
      gBG.setName( x, y, 0 );
      gChange = true; 
      this.mScore++;
      if( this == gPlayer ){
        gSE[ 0 ].currentTime = 0;
        gSE[ 0 ].play();
      }
      if( !--gCount ){
        gWait = 180;
        gFailed = ( gPlayer.mScore <= 56 );
      }
    }

    x += Character.sCos[ this.mAngle ];
    y += Character.sSin[ this.mAngle ];
    if( gBG.getName( x, y ) != ( this.mAngle & 1 ) + 2 ){
      return;
    }
    this.mAngle += this.mTurn;
    this.mAngle &= 3;
    this.mClm &= 4;
    this.mClm |= this.mAngle;
  }

  checkWall()
  {
    let x0 = Math.floor(   this.mX              / MESH );
    let x1 = Math.floor( ( this.mX + MESH - 1 ) / MESH );
    let y0 = Math.floor(   this.mY              / MESH );
    let y1 = Math.floor( ( this.mY + MESH - 1 ) / MESH );
    if( gBG.getName( x0, y0 ) < 2 &&
        gBG.getName( x1, y0 ) < 2 &&
        gBG.getName( x0, y1 ) < 2 &&
        gBG.getName( x1, y1 ) < 2 ){
      return;
    }

    if( this.mAngle & 1 ){
      if( gBG.getName( x0, y0 ) >= 2 ||
          gBG.getName( x0, y1 ) >= 2 ){
          x0++;
      }
      this.mX = x0 * MESH;
    }else{
      if( gBG.getName( x0, y0 ) >= 2 ||
          gBG.getName( x1, y0 ) >= 2 ){
            y0++;
          }
          this.mY = y0 * MESH;
    }
  }

  lane()
  {
    if( this.mAngle & 1 ){
      return( Math.abs( WIDTH / 2 - this.pCX ) - 32 );
    }
    return( Math.abs( HEIGHT / 2 - this.pCY ) );
  }

  move()
  {
    this.mX += Character.sCos[ this.mAngle ];
    this.mY += Character.sSin[ this.mAngle ];
    this.checkCurve();
    this.checkWall();
  }

  tick()
  {
    for( let i = 0; i < this.mSpeed; i++ ){
      this.move();
    }

    if( this.mAngle & 1 ){
      this.mX += this.mDX;
    }else{
      this.mY += this.mDY;
    }
    this.checkCurve();
    this.checkWall();
  }
} 

class Enemy extends Character
{
  constructor( tile, no )
  {
    super( tile, 6, 1, 1 );
    this.mDX = 0;
    this.mDY = 0;
    this.mNo = no;
  }

  start()
  {
    this.mX = 13 * MESH;
    this.mY = 20 * MESH;
    this.mAngle = 2;
    this.mClm = 6;
    this.mScore = 0;
  }

  tick()
  {
    super.tick();
    
    this.mSpeed = ( 110 - this.mNo * 10 - gCount ) / 60;
    this.mDX = 0;
    this.mDY = 0;

    if( this.mStraight ){
      this.mStraight--;
      return;
    }
    if( Math.random() < 0.02 ){
      this.mStraight = 20;
    }

    let si = Math.sign( gPlayer.lane() - this.lane());
    if( !si ){
      return;
    }

    if( this.mAngle & 1 ){
      this.mDX = si * Math.sign( this.mX - WIDTH / 2 );
    }else{
      this.mDY = si * Math.sign( this.mY - HEIGHT / 2 );
    }
  }
}

class Player extends Character
{
  constructor( tile )
  {
    super( tile, 0, 1, -1 );
  }

  start()
  {
    this.mX = 16 * MESH;
    this.mY = 20 * MESH;
    this.mAngle = 0;
    this.mClm = 0;
    this.mScore = 0;
  }

  tick()
  {
    this.mDX = gKey[ 39 ] - gKey[ 37 ];
    this.mDY = gKey[ 40 ] - gKey[ 38 ];
    if( this.mDX | this.mDY ){
      gSE[ 1 ].play();
    }
    this.mSpeed = 1 + ( gKey[ 90 ] | gKey[ 13 ] | gKey[ 32 ] );
    super.tick();
  }
}

function draw()
{
  if( gChange ){
    gChange = false;
    gBG.draw( gCanvas[ 0 ].getContext( "2d" ) );
  }

  let g = gCanvas[ 1 ].getContext( "2d" );
  g.clearRect( 0, 0, WIDTH, HEIGHT );
  gPlayer.draw( g );
  for( let o of gEnemy ){
    o.draw( g );
  }

  g = document.getElementById( "main" ).getContext( "2d" );
  g.imageSmoothingEnabled = g.msImageSmoothingEnabled = false;
  g.drawImage( gCanvas[ 0 ], 0, 0, WIDTH, HEIGHT, 0, 0, WIDTH * MAG, HEIGHT * MAG );
  g.drawImage( gCanvas[ 1 ], 0, 0, WIDTH, HEIGHT, 0, 0, WIDTH * MAG, HEIGHT * MAG );

  g.font = "bold " + MESH * MAG + "px monospace";
 
  g.fillStyle = "#ffff00";
  drawBold( g,"PLAYER", MESH * MAG * 15, MESH * MAG * 10 );

  g.fillStyle = "#ff2200";
  drawBold( g,"ENEMY", MESH * MAG * 9, MESH * MAG * 10 );

  g.fillStyle = "#ffffff";
  g.fillText(""+ gPlayer.mScore, MESH * MAG * 15, MESH * MAG * 11 );
  let es = 0;
  for( let o of gEnemy ){
    es += o.mScore;
  }
  g.fillText(""+ es, MESH * MAG * 9, MESH * MAG * 11 );

  if( gGameOver ){
    drawMessage( g, "GAME OVER");
    return;
  }

  if( gWait > 60 ){
    if( gFailed ){
      drawMessage( g, "STAGE FAILED");
    }else{
      drawMessage( g, "STAGE CLEAR!");
    }
  }else if( gWait > 30 ){
    drawMessage( g, "STAGE " + gStage );
  }else if( gWait > 0 ){
      drawMessage( g, "START!!");
  }
}

function drawBold( g, str, x, y )
{
  g.fillText( str, x    , y );
  g.fillText( str, x + 1, y );
}

function drawMessage( g, str )
{
  drawBold( g, str, WIDTH * MAG / 2 - g.measureText( str ).width / 2, MESH * MAG * 13 );
}

function nextStage()
{
  gCount = 112;
  if( !gFailed ){
    gStage++;
  }

  gBG.mName = [
    4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,5,
		2,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,0,1,0,1,0,1,0,1,0,1,0,1,0,2,
		2,1,4,3,3,3,3,3,3,3,3,3,3,0,0,0,0,3,3,3,3,3,3,3,3,3,3,5,1,2,
		2,0,2,0,1,0,1,0,1,0,1,0,1,0,0,0,0,1,0,1,0,1,0,1,0,1,0,2,0,2,
		2,1,2,1,4,3,3,3,3,3,3,3,3,0,0,0,0,3,3,3,3,3,3,3,3,5,1,2,1,2,
		2,0,2,0,2,0,1,0,1,0,1,0,1,0,0,0,0,1,0,1,0,1,0,1,0,2,0,2,0,2,
		2,1,2,1,2,1,4,3,3,3,3,3,3,0,0,0,0,3,3,3,3,3,3,5,1,2,1,2,1,2,
		2,0,2,0,2,0,2,0,1,0,1,0,1,0,0,0,0,1,0,1,0,1,0,2,0,2,0,2,0,2,
		2,1,2,1,2,1,2,1,4,3,3,3,3,3,3,3,3,3,3,3,3,5,1,2,1,2,1,2,1,2,
		2,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2,
		2,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2,
		2,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2,
		2,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2,
		2,1,2,1,2,1,2,1,6,3,3,3,3,3,3,3,3,3,3,3,3,7,1,2,1,2,1,2,1,2,
		2,0,2,0,2,0,2,0,1,0,1,0,1,0,0,0,0,1,0,1,0,1,0,2,0,2,0,2,0,2,
		2,1,2,1,2,1,6,3,3,3,3,3,3,0,0,0,0,3,3,3,3,3,3,7,1,2,1,2,1,2,
		2,0,2,0,2,0,1,0,1,0,1,0,1,0,0,0,0,1,0,1,0,1,0,1,0,2,0,2,0,2,
		2,1,2,1,6,3,3,3,3,3,3,3,3,0,0,0,0,3,3,3,3,3,3,3,3,7,1,2,1,2,
		2,0,2,0,1,0,1,0,1,0,1,0,1,0,0,0,0,1,0,1,0,1,0,1,0,1,0,2,0,2,
		2,1,6,3,3,3,3,3,3,3,3,3,3,0,0,0,0,3,3,3,3,3,3,3,3,3,3,7,1,2,
		2,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,0,1,0,1,0,1,0,1,0,1,0,1,0,2,
		6,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,7,
	];
  gChange = true;

  gPlayer.start();
  if( !gFailed ){
    gEnemy.push( new Enemy( gTile, gEnemy.length ) );
  }
  for( let o of gEnemy ){
    o.start();
  }

}

function tick()
{
  if( gGameOver ){
    return;
  }

  if( gWait ){
    gWait--;
    if( gWait == 60 ){
      nextStage();
    }
    return;
  }
  gPlayer.tick();
  for( let o of gEnemy ){
    o.tick();
    if( o.contains( gPlayer.pCX, gPlayer.pCY ) ){
      gGameOver = true;
      gSE[ 2 ].currentTime = 0;
      gSE[ 2 ].play();
    }
  }
}

function load()
{
  gTile = new Tile( gImg, MESH );
  gBG = new BG( gTile, MAP_WIDTH, MAP_HEIGHT );
  gPlayer = new Player( gTile );
  requestAnimationFrame( onPaint );
}


// =================== 03_breakout2 ====================

const TIMER_INTERVAL = 33;

var gCanvas = new Array( 2 );
var gKey = new Uint8Array( 0x100 );
var gTimer;
var gSE = [];
var gImg;

//起動時のイベント
function onLoad()
{
  for( let i = 0; i < gCanvas.length; i++ ){
    gCanvas[ i ] = document.createElement( "canvas" );
    gCanvas[ i ].width = WIDTH;
    gCanvas[ i ].height = HEIGHT;
  }

  for( let i = 0; i < RES_SE.length; i++ ){
    gSE[ i ] = new Audio();
    gSE[ i ].volume = 0.1;
    gSE[ i ].src = RES_SE[ i ];
  }
  
  gImg = new Image();
  gImg.src = RES_IMG;
  gImg.onload = load;
}

// 描画イベント
function onPaint()
{
  if( !gTimer ){
    gTimer = performance.now();
  }

  if( gTimer + TIMER_INTERVAL < performance.now() ){
    gTimer += TIMER_INTERVAL;
    tick();
    draw();
  }
  
  requestAnimationFrame( onPaint );
}

// キーを押した時のイベント
window.onkeydown = function(ev)
{
  gKey[ ev.keyCode ] = 1;
}

// キーを離した時のイベント
window.onkeyup = function(ev)
{
  gKey[ ev.keyCode ] = 0;
}

// 起動時のイベント
window.onload = function()
{
  onLoad();
}