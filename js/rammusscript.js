/*
* Rammus Runner
* @author Jason Lin
*/
Parse.initialize("RBsotC2LiGjEDRYfv3ycXfLMg9nACJIcHVZBFqQ6", "ZLlLg5Ed0PHWfLIXaSkzyas5QGNzWOTfH6zBFNfe");
var canvas = document.getElementById("mainCanvas");
var context = canvas.getContext("2d");

var keys = [];
var obstacles = [];
var powerUps = [];
var scores = [];
var playerNames = [];

var width = 500;
var height = 400;
var speed = 8;
var obstacleSpeed = 6;
var maxJump = 10;
var timer = 30;
var score = 0;
var safetyDuration = 70;
var interventionDuration = 150;
var timeWarpDuration = 200;
var numLives = 3;
var obstacleSpawnChance = .02;
var powerUpSpawnChance = .002;

var alive = true;
var touchMode = false;
var safety = false;
var firstLoad = true;
var soundEffects = true;
var isJumping = false;
var isJumpingDown = false;
var interventionActive = false;
var timeWarpActive = false;

//retrieves score array object from Parse database
var ScoreArray = Parse.Object.extend("ScoreArray");
var query = new Parse.Query(ScoreArray);
var scoreArr = undefined;
query.get("oVg6QtnKX4", {
	success: function(scoreArray) {
		scoreArr = scoreArray;
		scores = scoreArray.get("scores");
		playerNames = scoreArray.get("playerNames");
	},
	error: function(object, error) {
		console.log(e.message);
	}
});

var font = "Herculanum";
var title = new Image();
title.src = "https://i.imgur.com/pB0ntib.png";
var rammus = new Image();
rammus.src = "https://i.imgur.com/KSqIEBc.png";
var life = new Image();
life.src = "https://i.imgur.com/WWuKQ2U.png";
var ground = new Image();
ground.src = "https://i.imgur.com/pzU4s50.png";
var sky = new Image();
sky.src = "https://i.imgur.com/16S4PlL.png";
var meleeMinion = new Image();
meleeMinion.src = "https://i.imgur.com/X3VXZhh.png";
var casterMinion = new Image();
casterMinion.src = "https://i.imgur.com/8FKQlEF.png";
var instructionCaster = new Image();
instructionCaster.src = "https://i.imgur.com/DRooCNk.png";
var heal = new Image();
heal.src = "https://i.imgur.com/TN8WKey.png";
var intervention = new Image();
intervention.src = "https://i.imgur.com/2ece4h0.png";
var interventionImage = new Image();
interventionImage.src = "https://i.imgur.com/3e7votX.png";
var timeWarp = new Image();
timeWarp.src = "https://i.imgur.com/xXQ5lso.png";

var ok = new Audio("audio/ok.mp3");
var arcadeMusic = new Audio("audio/arcademusic.mp3");
arcadeMusic.loop = true;

//rectangles for detecting clicks/touches
var player = {
	x: 0,
	y: height-30,
	width: 30,
	height: 30
};

var playRect = {
	x: 210,
	y: 240,
	width: 80,
	height: 30
}

var instructionRect = {
	x: 180,
	y: 290,
	width: 150,
	height: 20
}

var highscoreRect = {
	x: 180,
	y: 340,
	width: 150,
	height: 20
}

var backRect = {
	x: 15,
	y: 20,
	width: 50,
	height: 20
}

//functions to create obstacle and powerup objects
function Ob () {
	this.x = width-20;
	this.y = height-50;
	this.width = 30;
	this.height = 50;
	this.type = "melee";
}

function powerUp () {
	this.x = width-30;
	this.y = height-120;
	this.width = 30;
	this.height = 30;
	this.type = "";
}

window.addEventListener("keydown", function(e){
	keys[e.keyCode] = true;
});

window.addEventListener("keyup", function(e){
	delete keys[e.keyCode];
});

function game() {
	update();
	render();
}

function collision (player, obstacle) {
	return (player.x+player.width >= obstacle.x && player.x <= obstacle.x+obstacle.width) 
	&& (player.y >= obstacle.y && player.y <= obstacle.y+obstacle.height);
}

//updates the position of each object in the game
function update() {	
	score += 10;

	//1/50 chance to create a minion obstacle
	var obChance = Math.random();
	if (obChance < obstacleSpawnChance) {
		var minionChance = Math.random();
		var newOb = new Ob();
		if (minionChance > .5) {
			newOb.type = "caster";
		}
		obstacles.push(newOb);
	}

	//1/500 chance for a power up to spawn
	var powerUpChance = Math.random();
	if (powerUpChance < powerUpSpawnChance) {
		var powerUpType = Math.random();
		var newPowerUp = new powerUp();
		if (powerUpType < .33) {
			newPowerUp.type = "heal";
		} else if (powerUpType >= .33 && powerUpType <= .66) {
			newPowerUp.type = "intervention";
		} else {
			newPowerUp.type = "timeWarp";
		}
		powerUps.push(newPowerUp);
	}

	//check if player hits obstacle, update obstacles
	for (var k = 0; k < obstacles.length; k++) {
		if (collision(player, obstacles[k]) && !interventionActive){
			if (!safety) {
				numLives--;
				player.x = 0;
				safety = true;
			}
		}
		if (timeWarpActive) {
			obstacles[k].x -= (obstacleSpeed/2);
		} else {
			obstacles[k].x -= obstacleSpeed;
		}
		if (obstacles[k] <= (0 - obstacles[k].width)) {
			obstacles.splice(k, 1);
		}
	}
	
	//check if player hits powerup, update powerups
	for (var k = 0; k < powerUps.length; k++) {
		if (timeWarpActive) {
			powerUps[k].x -= speed;
		} else {
			powerUps[k].x -= (speed * 2);
		}
		if (collision(player,powerUps[k])) {
			if (powerUps[k].type == "heal") {
				if (numLives < 3 && numLives > 0) {
					numLives++;
				}
			} else if (powerUps[k].type == "intervention") {
				interventionDuration = 150;
				interventionActive = true;
			} else {
				timeWarpDuration = 200;
				timeWarpActive = true;
			}
			powerUps.splice(k,1);
		}	
		if (powerups[k] != undefined && powerUps[k] <= (0 - powerUps[k].width)) {
			powerUps.splice(k,1);
		}
	}

	//jump
	if (isJumping) {
		if (maxJump > 0) {
			if (touchMode) {
				player.y -= (speed * 1.5);
			} else {
				player.y -= (speed+2);
			}
			maxJump--;
		}
		if (maxJump <= 0) {
			if (touchMode) {
				player.y += (speed * 1.5);
			} else {
				player.y += (speed+2);
			}
			maxJump--;
		}
		if (maxJump == -10) {
			isJumping = false
			maxJump = 10;
		}
	}

	if (keys[37]) { //left
		player.x -= speed;
	}
	if (keys[39]) { //right
		player.x += speed;
	}

	//bounds check
	if (player.x < 0) {
		player.x = 0;
	}
	if (player.y < 0) {
		player.y= 0;
	}
	if (player.x > width-player.width) {
		player.x = width-player.width;
	}
	if (player.y > height-player.height) {
		player.y = height-player.height;
	}
}

function jump(e) {
	if (e.keyCode == 38 || touchMode) {
		if (!isJumping) {
			if (soundEffects) {
				ok.play();
			}
			isJumping = true;
		}
	}
}

//draws images on the canvas
function render() {
	context.clearRect(0,0, width, height);
	context.drawImage(sky,0,0);
	if (checkLives()) {
		if (safety) {
			//if safety is active, makes the player flash
			if (safetyDuration % 10 == 0) {
				context.drawImage(rammus, player.x, player.y, player.width, player.height);
				safetyDuration--;
			} else if (safetyDuration <= 0) {
				safety = false;
				safetyDuration = 70;
			} else {
				safetyDuration--;
			}
		} else {
			context.drawImage(rammus, player.x, player.y, player.width, player.height);
		}
		if (interventionActive) {
			if (interventionDuration > 0) {
				context.drawImage(interventionImage, player.x, player.y);
				interventionDuration--;
			} else {
				interventionActive = false;
			}
		}
		if (timeWarpActive) {
			timeWarpDuration--;
			if (timeWarpDuration <= 0) {
				timeWarpActive = false;
			}
		}
		//draw obstacles
		for (var k = 0; k < obstacles.length; k++) {
			if (obstacles[k].type == "melee") {
				context.drawImage(meleeMinion, obstacles[k].x, obstacles[k].y, obstacles[k].width, obstacles[k].height);
			} else {
				context.drawImage(casterMinion, obstacles[k].x, obstacles[k].y, obstacles[k].width, obstacles[k].height);
			}	
		}
		//draw powerups
		for (var k = 0; k < powerUps.length; k++) {
			if (powerUps[k].type == "heal") {
				context.drawImage(heal, powerUps[k].x, powerUps[k].y, powerUps[k].width, powerUps[k].height);
			} else if (powerUps[k].type == "intervention") {
				context.drawImage(intervention, powerUps[k].x, powerUps[k].y, powerUps[k].width, powerUps[k].height);
			} else {
				context.drawImage(timeWarp, powerUps[k].x, powerUps[k].y, powerUps[k].width, powerUps[k].height);
			}
		}
		context.fillStyle = "black";
		context.font = "15px " + font;
		context.fillText(score, width-40, 30);
	} else {
		alive = false;
	}
}

var checkLives = function() {
	if (numLives == 0) {
		return false;
	}
	if (numLives >= 1) {
		context.drawImage(life, 15, 15, 30, 30);
	}
	if (numLives >= 2) {
		context.drawImage(life, 55, 15, 30, 30);
	}
	if (numLives == 3) {
		context.drawImage(life, 95, 15, 30, 30);
	}
	return true;
}

//moves player on mobile devices
function turnPhone(e) {
	var a = e.gamma;
	if (a < -5) {
		player.x -= (speed/2);
	} 
	if (a > 5) {
		player.x += (speed/2);
	}
}

function main() {
	context.drawImage(ground,0,400,500,100);
	window.addEventListener("keydown", jump, false);
	window.addEventListener("touchstart", jump, false);
	window.addEventListener("deviceorientation", turnPhone, false);
	var g = setInterval( function() {
		if (alive) {
			game(); 
		} else {
			clearInterval(g);
			window.removeEventListener("touchstart", jump, false);
			window.removeEventListener("deviceorientation", turnPhone, false);
			for (var k = 0; k < scores.length; k++) {
				//checks if high score is achieved, then saves if true
				if (score > scores[k]) {
					do {
						var playerName = prompt("You have a new high score! Please enter your name.");
						if (playerName == null) {
							playerName = "Anonymous";
						}
					} while (playerName.length > 30);
					
					var temp = scores.length-1;					
					while(temp > k) {
						scores[temp] = scores[temp-1];
						playerNames[temp] = playerNames[temp-1];
						temp--;
					}
					scores[k] = score;
					playerNames[k] = playerName;
					scoreArr.save(null, {
						success: function(scoreArray) {
							scoreArray.set("scores", scores);
							scoreArray.set("playerNames", playerNames);
							scoreArray.save();
						}
					});
					break;
				}
			}			
			loseScreen();
			numLives = 3;
			alive = true;
			score = 0;
			safety = false;
			obstacles = [];	
			window.addEventListener("touchstart", clickLosescreen, false);
			window.addEventListener("click", clickLosescreen, false);
		}
	}, timer);
}

function clickBack(e) {
	if (touchMode) {
		e = e.changedTouches[0];
	}
	var x = e.clientX;
	var y = e.clientY;
	if (x >= backRect.x && x <= backRect.x + backRect.width && y >= backRect.y && y <= backRect.y + backRect.height) {
		window.removeEventListener("touchstart",clickBack, false);
		window.removeEventListener("click",clickBack, false);
		window.removeEventListener("click", soundChange, false);
		window.removeEventListener("touchstart", soundChange, false);
		menu();
	}
}

function clickPlay(e) {
	window.removeEventListener("touchstart", initTouch, false);
	if (touchMode) {
		e = e.changedTouches[0];
	}
	var x = e.clientX;
	var y = e.clientY;
	if (x >= playRect.x && x <= playRect.x + playRect.width && y >= playRect.y && y <= playRect.y + playRect.height) {
		window.removeEventListener("touchstart",clickPlay, false);
		window.removeEventListener("click",clickPlay, false);
		main();
	}
	if (x >= instructionRect.x && x <= instructionRect.x + instructionRect.width && y >= instructionRect.y && y <= instructionRect.y + instructionRect.height) {
		window.removeEventListener("touchstart",clickPlay, false);
		window.removeEventListener("click",clickPlay, false);
		instructions();
	}
	if (x >= highscoreRect.x && x <= highscoreRect.x + highscoreRect.width && y >= highscoreRect.y && y <= highscoreRect.y + highscoreRect.height) {
		window.removeEventListener("touchstart",clickPlay, false);
		window.removeEventListener("click",clickPlay, false);
		highscores();
	}
}

function clickLosescreen(e) {
	if (touchMode) {
		e = e.changedTouches[0];
	}
	var x = e.clientX;
	var y = e.clientY;
	if (x >= playRect.x && x <= playRect.x + playRect.width && y >= playRect.y && y <= playRect.y + playRect.height) {
		window.removeEventListener("touchstart",clickLosescreen, false);
		window.removeEventListener("click",clickLosescreen, false);
		main();
	}
	if (x >= instructionRect.x && x <= instructionRect.x + instructionRect.width && y >= instructionRect.y && y <= instructionRect.y + instructionRect.height) {
		window.removeEventListener("touchstart",clickLosescreen, false);
		window.removeEventListener("click",clickLosescreen, false);
		menu();
	}
}

function soundChange(e) {
	if (touchMode) {
		e = e.changedTouches[0];
	}
	var x = e.clientX;
	var y = e.clientY;
	if (x >= highscoreRect.x && x <= highscoreRect.x + highscoreRect.width && y >= highscoreRect.y && y <= highscoreRect.y + highscoreRect.height) {
		soundEffects = !soundEffects;
		context.textAlign = "center";
		if (!arcadeMusic.paused) {
			context.clearRect(175, 335, 160, 30);
			context.fillText("Turn sound ON", width/2, 350);
			arcadeMusic.pause();
		} else {
			context.clearRect(175, 335, 160, 30);
			context.fillText("Turn sound OFF", width/2, 350);
			arcadeMusic.play();
		}
	}
}

function loseScreen() {
	context.fillStyle = "black";
	context.textAlign = "center";
	context.font = "bold 30px " + font;
	context.fillText("You Lose!", width/2, 200);
	context.font = "bold 20px " + font;
	context.fillText("Retry", width/2, 250);	
	context.font = "bold 15px " + font;
	context.fillText("Your score was: " + score, width/2, 225);	
	context.fillText("Menu", width/2, 300);	
}

function instructions() {
	context.clearRect(0,0, width, height+100);
	context.drawImage(rammus, 217, 30, 66, 100);
	context.drawImage(meleeMinion, 100, 30, 80, 80);
	context.drawImage(instructionCaster, 323, 37, 80, 80);
	context.fillStyle = "black";
	context.textAlign = "center";
	if (touchMode) {
		context.font = "bold 10px " + font;
		context.fillText("It seems that you're on a mobile device!", width/2, 210);
		context.fillText("Please play this game in portrait mode.", width/2, 220);
	}
	context.font = "bold 18px " + font;
	if (!arcadeMusic.paused) {
		context.fillText("Turn sound OFF", width/2, 350);
	} else {
		context.fillText("Turn sound ON", width/2, 350);
	}
	window.addEventListener("click", soundChange, false);
	window.addEventListener("touchstart", soundChange, false);
	context.fillText("Back", 30, 20);
	context.fillText("Rammus needs your help to gank mid.", width/2, 150);
	context.fillText("Help him navigate around minions in the lane", width/2, 170);
	context.fillText("to get to that pesky enemy before it's too late!", width/2, 190);
	context.fillText("Controls:", width/2, 250);
	context.fillText("Power Ups:", width/2, 380);
	context.textAlign = "left";
	context.fillText("Move Left:", 25, 280);
	context.fillText("Move Right:", 25, 300);
	context.fillText("Jump:", 25, 320);
	context.drawImage(heal, 25, 390);
	context.drawImage(intervention, 25, 420);
	context.drawImage(timeWarp, 25, 450);
	context.fillText("Heal:", 60, 410);
	context.fillText("Intervention:", 60, 440);
	context.fillText("Time Warp:", 60, 470);
	context.textAlign = "right";
	if (touchMode) {
		context.fillText("Tilt device left", 450, 280);
		context.fillText("Tilt device right", 450, 300);
		context.fillText("Tap device", 450, 320);
	} else {
		context.fillText("Left arrow key", 450, 280);
		context.fillText("Right arrow key", 450, 300);
		context.fillText("Up arrow key", 450, 320);
	}
	context.fillText("+1 life", 450, 410);
	context.fillText("Invincibility", 450, 440);
	context.fillText("Slows minions", 450, 470);
	window.addEventListener("click", clickBack, false);
	window.addEventListener("touchstart", clickBack, false);
}

function highscores() {
	context.clearRect(0,0, width, height+100);	
	context.textAlign = "center";
	context.font = "bold 18px " + font;
	context.fillText("Back", 30, 20);
	context.font = "bold 30px " + font;
	context.fillText("High Scores", width/2, 100);
	context.textAlign = "right";
	context.font = "bold 20px " + font;
	for (var k = 0; k < scores.length; k++) {
		context.fillText(k+1 + ". ", 50, 150 + (k*30));
		context.fillText(scores[k], 450, 150 + (k*30));
	}
	context.textAlign = "left";
	for (var k = 0; k < scores.length; k++) {
		context.fillText(playerNames[k], 52, 150 + (k*30));
	}
	window.addEventListener("click", clickBack, false);
	window.addEventListener("touchstart", clickBack, false);
}

function initTouch() {
	touchMode = true;
	soundEffects = false;
}

function menu() {
	context.clearRect(0,0, width, height+100);
	if (firstLoad) {
		title.onload = function() {
			context.drawImage(title, 0, 0);
		}
		firstLoad = false;
	} else {
		context.drawImage(title, 0, 0);
	}
	window.addEventListener("click", clickPlay, false);
	window.addEventListener("touchstart", clickPlay, false);
}

window.addEventListener("touchstart", initTouch, false);
menu();