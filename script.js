window.addEventListener('load', setTimeout(function() {
    document.getElementsByClassName('no-1')[0].style.animation = 'fadeOut 1s normal forwards';
    document.getElementsByClassName('no-2')[0].style.animation = 'fadeIn 1.5s  normal forwards';
    setTimeout(function(){ document.getElementById('no-1').remove(); }, 1000);
    setTimeout(function(){
      document.getElementsByClassName('no-2')[0].style.animation = 'fadeOut 1s normal forwards';
      document.getElementsByClassName('no-3')[0].style.animation = 'fadeIn 1.5s  normal forwards';
      setTimeout(function(){ document.getElementById('no-2').remove(); }, 1000);
    }, 5000);
}, 4000), false);

function startGame() {
  document.getElementById('mainOverlay').style.animation = 'fadeOut 1s normal forwards';
  document.getElementById('canvas').style.animation = 'fadeIn 1s normal forwards';
  document.getElementById('aiCanvas').style.animation = 'fadeIn 1s normal forwards';
  document.getElementById('mainOverlay').remove();

  function HitMap(img){
  	var self = this;
  	this.img = img;

  	// only do the drawing once the
  	// image has downloaded
  	if (img.complete){
  		this.draw();
  	} else {
  		img.onload = function(){
  			self.draw();
  		};
  	}
  }
  HitMap.prototype = {
  	draw: function(){
  		// first create the canvas
  		this.canvas = document.createElement('canvas');
  		this.canvas.width = this.img.width;
  		this.canvas.height = this.img.height;
  		this.context = this.canvas.getContext('2d');
  		// draw the image on it
  		this.context.drawImage(this.img, 0, 0);
  	},
  	isHit: function(x, y){
          if (this.context){
              // get the pixel RGBA values
              var pixel = this.context.getImageData(x, y, 1, 1);
              if (pixel){
                  // we consider a hit if the blue
                  // value is 0
                  return pixel.data[2] == 0;
              } else {
                  return false;
              }
          } else {
              return false;
          }
  	},
    AIisHit: function(x, y){
          if (this.context){
              // get the pixel RGBA values
              var pixel = this.context.getImageData(x, y, 1, 1);
              if (pixel){
                  // we consider a hit if the Red
                  // value is greater than 5
                  // This red line for the collisions of
                  // the AI acts as the AI's driving guides
                  return pixel.data[0] >= 5;
                  return pixel.data[2] == 0;
              } else {
                  return false;
              }
          } else {
              return false;
          }
  	},
    checkpoint: function(x,y) {
      if (this.context){
        var pixel = this.context.getImageData(x, y, 1, 1);
        if (pixel){
          return pixel.data[2] >= 200;
        }
      }
    }
  };

  function CollisionPoint (car, rotation, distance) {
  	this.car = car;
  	this.rotation = rotation;
  	this.distance = distance || this.distance;
  }
  CollisionPoint.prototype = {
  	car: null,
  	rotation: 0,
  	distance: 20,
  	getXY: function(){
  		return rotatePoint(
  					this.car.getCenter(),
  					this.car.rotation + this.rotation,
  					this.distance
  				);
  	},
    isHit: function(hitMap){
        var xy = this.getXY();
        return hitMap.isHit(xy.x, xy.y);
    },
    AIisHit: function(hitMap){
        var xy = this.getXY();
        return hitMap.AIisHit(xy.x, xy.y);
    },
    checkpoint: function(hitMap){
      var xy = this.getXY();
      return hitMap.checkpoint(xy.x, xy.y)
    }
  };

  var TO_RADIANS = Math.PI/180;
  function drawRotatedImage(image, x, y, angle) {

  	context.save();
  	context.translate(x, y);
  	context.rotate(angle * TO_RADIANS);
  	context.drawImage(image, -(image.width/2), -(image.height/2));
  	context.restore();
  }

  function aiDrawRotatedImage(image, x, y, angle) {

  	// save the current co-ordinate system
  	// before we screw with it
  	aiContext.save();

  	// move to the middle of where we want to draw our image
  	aiContext.translate(x, y);

  	// rotate around that point, converting our
  	// angle from degrees to radians
  	aiContext.rotate(angle * TO_RADIANS);

  	// draw it up and to the left by half the width
  	// and height of the image
  	aiContext.drawImage(image, -(image.width/2), -(image.height/2));

  	// and restore the co-ords to how they were when we began
  	aiContext.restore();
  }

  function rotatePoint (coords, angle, distance) {
  	return {
  		x: Math.sin(angle * TO_RADIANS) * distance + coords.x,
  		y: Math.cos(angle * TO_RADIANS) * distance * -1 + coords.y,
  	};
  }

  function drawPoint (xy) {
  	context.fillRect(xy.x,xy.y,1,1);
  }

  function distance (from, to) {
  	var a = from.x > to.x ? from.x - to.x : to.x - from.x,
  		b = from.y > to.y ? from.y - to.y : to.y - from.y
  		;
  	return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
  }

  function Car () {
  	this.img = new Image();   // Create new img element
  	this.img.src = 'player1.png'; // Set source path

  	// collision
  	this.collisions = {
  		top: new CollisionPoint(this, 0),
  		right: new CollisionPoint(this, 90, 10),
  		bottom: new CollisionPoint(this, 180),
  		left: new CollisionPoint(this, 270, 10)
  	};
  }
  Car.prototype = {
  	x: 521,
  	y: 585,
  	code: 'player',
  	acceleration: 1.1,
  	rotationStep: 3,
  	rotation: 90,
  	speed: 0,
  	speedDecay: 0.98,
  	maxSpeed: 3.5,
  	backSpeed: 1.1,
    checkpoints: "",


  	isMoving: function (speed) {
  		return !(this.speed > -0.4 && this.speed < 0.4);
  	},
  	getCenter: function(){
  		return {
  			x: this.x,
  			y: this.y
  		};
  	},
  	accelerate: function(){
  		if (this.speed < this.maxSpeed){
  			if (this.speed < 0){
  				this.speed *= this.speedDecay;
  			} else if (this.speed === 0){
  				this.speed = 0.4;
  			} else {
  				this.speed *= this.acceleration;
  			}
  		}
  	},
  	decelerate: function(min){
  		min = min || 0;
  		if (Math.abs(this.speed) < this.maxSpeed){
  			if (this.speed > 0){
  				this.speed *= this.speedDecay;
  				this.speed = this.speed < min ? min : this.speed;
  			} else if (this.speed === 0){
  				this.speed = -0.4;
  			} else {
  				this.speed *= this.backSpeed;
  				this.speed = this.speed > min ? min : this.speed;
  			}
  		}
  	},
  	steerLeft: function(){
  		if (this.isMoving()){
  			this.rotation -= this.rotationStep * (this.speed/this.maxSpeed);
  		}
  	},
  	steerRight: function(){
  		if (this.isMoving()){
  			this.rotation += this.rotationStep * (this.speed/this.maxSpeed);
  		}
  	}

  };

  function AI () {
  	this.img = new Image();   // Create new img element
  	this.img.src = 'player2.png'; // Set source path

  	// collision
  	this.collisions = {
  		top: new CollisionPoint(this, 0),
		top_right: new CollisionPoint(this, 32.005, 23.585),
		top_left: new CollisionPoint(this, 327.995, 23.585),
  		right: new CollisionPoint(this, 90, 10),
  		bottom: new CollisionPoint(this, 180),
  		left: new CollisionPoint(this, 270, 10)
  	};
  }
  AI.prototype = {
  	x: /*508*/ 521,
  	y: /*560*/ 535,
  	code: 'AI',
  	acceleration: 1.1,
  	rotationStep: /*4*/ /*4.5*/ 3.1,
  	rotation: /*88.5*/ 88.5,
  	speed: 0,
  	speedDecay: 0.98,
  	maxSpeed: 2,
  	backSpeed: 1.1,
	checkpoints: '',


  	isMoving: function (speed) {
  		return !(this.speed > -0.4 && this.speed < 0.4);
  	},
  	getCenter: function(){
  		return {
  			x: this.x,
  			y: this.y
  		};
  	},
  	accelerate: function(){
  		if (this.speed < this.maxSpeed){
  			if (this.speed < 0){
  				this.speed *= this.speedDecay;
  			} else if (this.speed === 0){
  				this.speed = 0.4;
  			} else {
  				this.speed *= this.acceleration;
  			}
  		}
  	},
  	decelerate: function(min){
  		min = min || 0;
  		if (Math.abs(this.speed) < this.maxSpeed){
  			if (this.speed > 0){
  				this.speed *= this.speedDecay;
  				this.speed = this.speed < min ? min : this.speed;
  			} else if (this.speed === 0){
  				this.speed = -0.4;
  			} else {
  				this.speed *= this.backSpeed;
  				this.speed = this.speed > min ? min : this.speed;
  			}
  		}
  	},
  	steerLeft: function(){
  		if (this.isMoving()){
  			this.rotation -= this.rotationStep * (this.speed/this.maxSpeed);
  		}
  	},
  	steerRight: function(){
  		if (this.isMoving()){
  			this.rotation += this.rotationStep * (this.speed/this.maxSpeed);
  		}
  	}

  };

  var canvas   = document.getElementById('canvas'),
  	context  = canvas.getContext('2d'),
  	ctxW     = canvas.width,
  	ctxH     = canvas.height,
    aiCanvas = document.getElementById('aiCanvas'),
    aiContext = aiCanvas.getContext('2d'),
    aiCtxW    = aiCanvas.width,
    aiCtxH    = aiCanvas.height,
    player   = new Car(),
    ai       = new AI(),
  	track    = new Image(),
  	trackHit = new Image();


  track.src = "easyTrackImage.jpg";
  trackHit.src = "EDITED HITMAPS/easyTrackHitmap.png";

  // collision
  var hit = new HitMap(trackHit);

  // Keyboard Variables
  var key = {
  	UP: 38,
  	DOWN: 40,
  	LEFT: 37,
  	RIGHT: 39
  };

  var keys = {
  	38: false,
  	40: false,
  	37: false,
  	39: false
  };


  function speedXY (rotation, speed) {
  	return {
  		x: Math.sin(rotation * TO_RADIANS) * speed,
  		y: Math.cos(rotation * TO_RADIANS) * speed * -1,
  	};
  }


  function step (car) {
  	if (car.code === 'player'){

  		// constantly decrease speed
  		if (!car.isMoving()){
  			car.speed = 0;
  		} else {
  			car.speed *= car.speedDecay;
  		}
  		// keys movements
  		if (keys[key.UP])  { car.accelerate(); }
  		if (keys[key.DOWN]){ car.decelerate(); }
  		if (keys[key.LEFT]){ car.steerLeft(); }
  		if (keys[key.RIGHT]){car.steerRight(); }

  		var speedAxis = speedXY(car.rotation, car.speed);
  		car.x += speedAxis.x;
  		car.y += speedAxis.y;

  		// collisions
  		if (car.collisions.left.isHit(hit)){
  			car.steerRight();
  			car.decelerate(1);
        car.speed = car.speed * car.speedDecay;
  		}
  		if (car.collisions.right.isHit(hit)){
  			car.steerLeft();
  			car.decelerate(1);
        car.speed = car.speed * car.speedDecay;
  		}
  		if (car.collisions.top.isHit(hit)){
  			car.decelerate(1);
        car.speed = -1;
  		}
  		if (car.collisions.bottom.isHit(hit)){
  			car.decelerate(1);
        car.speed = 1;
  		}

      // Checkpoints
      if (car.collisions.bottom.checkpoint(hit)){
        car.checkpoints += 'i';
        console.log("Player Checkpoints:" + car.checkpoints)
        if (car.checkpoints == 'iiiiiii'){
          alert('end game')
          car.decelerate(1);
        }
      }
  	} else if (car.code === 'AI') {

      if (!car.isMoving()){
        car.speed = 0;
      } else {
        car.speed *= car.speedDecay;
      }
	  setTimeout(car.accelerate(), 4000);

      var speedAxis = speedXY(car.rotation, car.speed);
  		car.x += speedAxis.x;
  		car.y += speedAxis.y;

  		// collisions
  		if (car.collisions.left.AIisHit(hit)){
  			car.steerRight();
  		}
		if (car.collisions.top_left.AIisHit(hit)){
			car.steerRight();
		}
  		if (car.collisions.right.AIisHit(hit)){
  			car.steerLeft();
  		}
		if (car.collisions.top_right.AIisHit(hit)){
			car.steerLeft();
		}
  		if (car.collisions.top.AIisHit(hit)){
        car.decelerate(1);
  		}
  		if (car.collisions.bottom.AIisHit(hit)){
  			car.accelerate();
		}
		
		if (car.collisions.bottom.checkpoint(hit)){
			car.checkpoints += 'i';
			console.log("AI Checkpoints:" + car.checkpoints)
			if (car.checkpoints == 'iiiiiii'){
			  alert('end game')
			  car.decelerate(1);
			}
		}
    }
  }
  function draw (car) {
  	context.clearRect(0,0,ctxW,ctxH);
  	context.drawImage(track, 0, 0);
  	drawRotatedImage(car.img, car.x, car.y, car.rotation);
  }

  function aiDraw (car) {
  	aiContext.clearRect(0,0,aiCtxW,aiCtxH);
  	aiDrawRotatedImage(car.img, car.x, car.y, car.rotation);
  }
	
  setTimeout(function(){
    // Keyboard event listeners
    document.onkeydown = function(event) {
    	if (keys[event.keyCode] !== 'undefined'){
    		keys[event.keyCode] = true;
    		// e.preventDefault();
    	}
    }
    document.onkeyup = function(event){
    	if (keys[event.keyCode] !== 'undefined'){
    		keys[event.keyCode] = false;
    		// e.preventDefault();
    	}
    }
  }, 4000);
  function frame () {
  	step(player);
    step(ai);
    draw(player);
    aiDraw(ai);
    requestAnimationFrame(frame);
  }

  frame();

}

