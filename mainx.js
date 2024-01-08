"use strict";

//	======================== 02_breakout ================================

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

//	======================== MAIN ================================

const COLUMN = 14;
const ROW = 6;
const MAG = 3;
const MAP_WIDTH = 30;
const MAP_HEIGHT = 23;
const MESH = 8;
const WIDTH = 240;
const HEIGHT = 180;

var	gBall = [];
var gCanvas = [];
var gChange;
var gHP = new Int8Array( COLUMN * ROW );
var gImg;
var gItem = [];
var gLife = 3;
var gScore = 0;
var gStage = 0;
var gMap;
var gSE = [];
var gWait = 61;

class Ball extends Rectangle
{
	static	sSpeed = 12;
	static	sPower = 1;

	constructor()
	{
		super( 0, 0, 5, 5 );
		this.pCX = WIDTH / 2;
		this.pCY = MESH * 12;
		this.mDX = Math.random() / 20 - 0.025;
		this.mDY = 0.25;
	}

	static Init()
	{
		gBall = [];
		Ball.sSpeed = 12;
		Ball.sPower = 1;
	}

	draw( g )
	{
		g.drawImage( gImg, ( Ball.sPower + 18 ) * MESH + 1, 1, 5, 5, this.mX, this.mY, 5, 5 );
	}

	move()
	{
		this.mX += this.mDX;
		this.mY += this.mDY;

		if( gPlayer.contains( this.pCX, this.pCY ) ){
			gSE[ 0 ].currentTime = 0;
			gSE[ 0 ].play();
			let		a = Math.atan2( ( this.pCY - gPlayer.pCY ) * gPlayer.mWidth / MESH, this.pCX - gPlayer.pCX );
			this.mDX = Math.cos( a ) / 4;
			this.mDY = Math.sin( a ) / 4;
			this.mDY = Math.min( this.mDY, -0.1 );
			this.mY = gPlayer.mY - MESH * 0.75;
			Ball.sSpeed += gStage;
		}

		if( this.pCX < MESH || this.pCX > WIDTH - MESH ){
			this.mDX = -this.mDX;
		}

		if( this.pCY < MESH ){
			this.mDY = -this.mDY;
		}

		let		x = Math.floor( ( this.pCX - MESH ) / ( MESH * 2 ) );
		let		y = Math.floor( ( this.pCY - MESH * 3 ) / MESH );
//console.log( "x=" + x + " y=" + y );
		if( x < 0 || x >= COLUMN ||
		    y < 0 || y >= ROW ){
			return;
		}

		let		i = y * COLUMN + x;
		if( gHP[ i ] <= 0 ){
			return;
		}

		gHP[ i ] -= Ball.sPower;
		if( gHP[ i ] <= 0 ){
			let		mi = ( y + 3 ) * MAP_WIDTH + x * 2 + 1;
			let		v = 1 + ( y & 1 );
			gMap[ mi++ ] = v;
			gMap[ mi   ] = 3 - v;
			gChange = true;
			if( ++gScore == COLUMN * ROW * gStage ){
				gWait = 120;
			}

			if( Math.random() < 0.25 ){
				let		t = 1;
				if( Ball.sSpeed >= 16 && Math.random() < 0.3 ){
					t = 3;
				}else if( Math.random() < 0.25 ){
					t = 0;
				}else if( Ball.sPower == 1 && Math.random() < 0.1 ){
					t = 2;
				}else if( Math.random() < 0.05 ){
					t = 4;
				}
				gItem.push( new Item( ( x * 2 + 1.5 ) * MESH, ( y + 3 ) * MESH, t ) );
			}

			gSE[ 1 ].currentTime = 0;
			gSE[ 1 ].play();
		}else{
			gSE[ 2 ].currentTime = 0;
			gSE[ 2 ].play();
		}

		if( gHP[ i ] < 0 ){
			return;
		}

		let		dx = Math.abs( this.pCX - ( x + 1 ) * MESH * 2 );
		let		dy = Math.abs( this.pCY - ( y + 3.5 ) * MESH );
		if( dx < dy * 2 ){
			this.mDY = -this.mDY;
		}else{
			this.mDX = -this.mDX;
		}
	}

	tick()
	{
		for( let i = 0; i < Ball.sSpeed; i++ ){
			this.move();
		}
		return( this.mY < HEIGHT );
	}
}

class Item extends Rectangle
{
	constructor( x, y, type )
	{
		super( x, y, MESH, MESH );
		this.mType = type;
	}

	draw( g )
	{
		g.drawImage( gImg, ( this.mType + 24 ) * MESH, 0, MESH, MESH, this.mX, this.mY, MESH, MESH );
	}

	tick()
	{
		this.mY++;
		return( gPlayer.contains( this.pCX, this.pCY ) );
	}
}

class Player extends Rectangle
{
	constructor()
	{
		super( 0, 0, 0, MESH );
		this.start();
	}

	draw( g )
	{
		let		x = this.mX + MESH / 2;
		g.drawImage( gImg, 21 * MESH, 0, MESH, MESH, x, this.mY, MESH, MESH );
		x += MESH;
		for( let i = 0; i < this.mWidth / MESH - 3; i++ ){
			g.drawImage( gImg, 22 * MESH, 0, MESH, MESH, x, this.mY, MESH, MESH );
			x += MESH;
		}
		g.drawImage( gImg, 23 * MESH, 0, MESH, MESH, x, this.mY, MESH, MESH );
	}

	start()
	{
		this.mWidth = MESH * 5;
		this.pCX = WIDTH / 2;
		this.pCY = HEIGHT - MESH * 2;
	}

	tick()
	{
		this.mX = Math.max( MESH / 2                      , this.mX - gKey[ 37 ] * MESH );
		this.mX = Math.min( WIDTH - this.mWidth - MESH / 2, this.mX + gKey[ 39 ] * MESH );
	}
}

var	gPlayer = new Player();

function draw()
{
	if( gChange ){
		gChange = false;
		let g = gCanvas[ 0 ].getContext( "2d" );
		for( let y = 0; y < MAP_HEIGHT; y++ ){
			for( let x = 0; x < MAP_WIDTH; x++ ){
				g.drawImage( gImg, gMap[ y * MAP_WIDTH + x ] * MESH, 0, MESH, MESH, x * MESH, y * MESH, MESH, MESH );
			}
		}
	}

	let g = gCanvas[ 1 ].getContext( "2d" );
	g.clearRect( 0, 0, WIDTH, HEIGHT );

	if( gWait < 30 ){
		gPlayer.draw( g );
	}
	for( let o of gBall ){
		o.draw( g );
	}
	for( let o of gItem ){
		o.draw( g );
	}

	g = document.getElementById( "main" ).getContext( "2d" );
	g.imageSmoothingEnabled = g.msImageSmoothingEnabled = false;
	g.drawImage( gCanvas[ 0 ], 0, 0, WIDTH, HEIGHT, 0, 0, WIDTH * MAG, HEIGHT * MAG );
	g.drawImage( gCanvas[ 1 ], 0, 0, WIDTH, HEIGHT, 0, 0, WIDTH * MAG, HEIGHT * MAG );

	g.font = "bold " + MESH * MAG + "px monospace";
	g.fillStyle = "#ff2200";
	g.fillText( "ＳＣＯＲＥ", MESH * MAG * 2, MESH * MAG * 1.8 );
	g.fillText( "ＳＣＯＲＥ", MESH * MAG * 2 + 1, MESH * MAG * 1.8 );
	g.fillText( "ＬＩＦＥ", MESH * MAG * 13, MESH * MAG * 1.8 );
	g.fillText( "ＬＩＦＥ", MESH * MAG * 13 + 1, MESH * MAG * 1.8 );
	g.fillText( "ＳＴＡＧＥ", MESH * MAG * 23, MESH * MAG * 1.8 );
	g.fillText( "ＳＴＡＧＥ", MESH * MAG * 23 + 1, MESH * MAG * 1.8 );

	g.fillStyle = "#ffffff";
	g.fillText( "" + gScore, MESH * MAG * 6.5, MESH * MAG * 2.8 );
	g.fillText( "" + gLife, MESH * MAG * 16.5, MESH * MAG * 2.8 );
	g.fillText( "" + gStage, MESH * MAG * 27.5, MESH * MAG * 2.8 );

	if( gLife <= 0 ){
		g.fillText( "ＧＡＭＥ　ＯＶＥＲ", WIDTH * MAG / 2 - MESH * MAG * 4, HEIGHT * MAG / 2 + MESH * MAG );
	}

	if( gScore == COLUMN * ROW * gStage ){
		g.fillText( "ＳＴＡＧＥ　ＣＬＥＡＲ！", WIDTH * MAG / 2 - MESH * MAG * 5, HEIGHT * MAG / 2 + MESH * MAG );
	}
}

function nextStage()
{
	gStage++;
	gChange = true;
	Ball.Init();

	for( let y = 0; y < ROW; y++ ){
		let		v = 1;
		if( !y ){
			v = gStage * 2;
		}
		for( let x = 0; x < COLUMN; x++ ){
			gHP[ y * COLUMN + x ] = v;
		}
	}

	gMap = [
		5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6,
		3, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 3,
		3, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3,
		3,17,18,17,18,17,18,17,18,17,18,17,18,17,18,17,18,17,18,17,18,17,18,17,18,17,18,17,18, 3,
		3,11,12,11,12,11,12,11,12,11,12,11,12,11,12,11,12,11,12,11,12,11,12,11,12,11,12,11,12, 3,
		3,15,16,15,16,15,16,15,16,15,16,15,16,15,16,15,16,15,16,15,16,15,16,15,16,15,16,15,16, 3,
		3, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 3,
		3,13,14,13,14,13,14,13,14,13,14,13,14,13,14,13,14,13,14,13,14,13,14,13,14,13,14,13,14, 3,
		3, 9,10, 9,10, 9,10, 9,10, 9,10, 9,10, 9,10, 9,10, 9,10, 9,10, 9,10, 9,10, 9,10, 9,10, 3,
		3, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 3,
		3, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3,
		3, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 3,
		3, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3,
		3, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 3,
		3, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3,
		3, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 3,
		3, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3,
		3, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 3,
		3, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3,
		3, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 3,
		3, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3,
		3, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 3,
		3, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3,
	];

}

function start()
{
	gCanvas[ 0 ] = document.createElement( "canvas" );
	gCanvas[ 0 ].width = WIDTH;
	gCanvas[ 0 ].height = HEIGHT;

	gCanvas[ 1 ] = document.createElement( "canvas" );
	gCanvas[ 1 ].width = WIDTH;
	gCanvas[ 1 ].height = HEIGHT;

	let	s = [ "se1.mp3", "se2.mp3", "se3.mp3" ];
	for( let i = 0; i < s.length; i++ ){
		gSE[ i ] = new Audio();
		gSE[ i ].volume = 0.1;
		gSE[ i ].src = s[ i ];
	}

	gImg = new Image();
	gImg.src = "tile.png";
	gImg.onload = function()
	{
		requestAnimationFrame( onPaint );
	}
}

function tick()
{
	if( !gLife ){
		return;
	}

	if( gWait ){
		gWait--;
		if( gWait == 60 ){
			nextStage();
		}
		if( gWait == 30 ){
			gPlayer.start();
			gBall.push( new Ball() );
		}
		return;
	}

	gPlayer.tick();

	for( let i = gItem.length - 1; i >= 0; i-- ){
		let		o = gItem[ i ];
		if( !o.tick() ){
			continue;
		}
		gItem.splice( i, 1 );

		if( o.mType == 0 ){
			gPlayer.mWidth += MESH;
			gPlayer.mX -= MESH / 2;
		}
		if( o.mType == 1 ){
			let		b = new Ball();
			b.pCX = o.pCX;
			b.pCY = gPlayer.mY - MESH;
			gBall.push( b );
		}
		if( o.mType == 2 ){
			Ball.sPower = 2;
		}
		if( o.mType == 3 ){
			Ball.sSpeed /= 2;
		}
		if( o.mType == 4 ){
			gLife++;
		}
	}

	for( let i = gBall.length - 1; i >= 0; i-- ){
		if( gBall[ i ].tick() ){
			continue;
		}
		gBall.splice( i, 1 );
		if( !gBall.length ){
			gWait = 60;
			gLife--;
			Ball.Init();
		}
	}
}


//	======================== 03_breakout2 ================================

const TIMER_INTERVAL = 33;

var gKey = new Uint8Array( 0x100 );
var gTimer;

//	描画イベント
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

//	キーを押したときのイベント
window.onkeydown = function( ev )
{
	gKey[ ev.keyCode ] = 1;
}

//	キーを離した時のイベント
window.onkeyup = function( ev )
{
	gKey[ ev.keyCode ] = 0;
}

//	起動時のイベント
window.onload = function()
{
	start();
}
