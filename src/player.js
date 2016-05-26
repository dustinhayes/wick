var WickPlayer = (function () {

	var wickPlayer = { };

	// Framerate keeper 
	// http://www.html5gamedevs.com/topic/1828-how-to-calculate-fps-in-plain-javascript/
	var fps = { 
		startTime : 0,
		frameNumber : 0,
		getFPS : function() {
			this.frameNumber++;

			var d = new Date().getTime();
			var currentTime = ( d - this.startTime ) / 1000;
			var result = Math.floor( ( this.frameNumber / currentTime ) );

			if( currentTime > 1 ) {
				this.startTime = new Date().getTime();
				this.frameNumber = 0;
			}

			return result;
		}   
	};

	var project;
	var currentFrameObjects;

	var projectLoaded;

	var mousePos;

	var canvas;
	var context;

	var mobileMode;
	var desktopMode;

	wickPlayer.runProject = function(projectJSON) {

		// Initialize editor vars
		projectLoaded = false;

		// Setup canvas
		canvas = document.getElementById("playerCanvas");
		context = canvas.getContext('2d');

		// Check if we're on a mobile device or not
		mobileMode = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		desktopMode = !mobileMode;

		// Setup mouse events (desktop mode)
		if(desktopMode) {

			var getMousePos = function (canvas, evt) {
				var rect = canvas.getBoundingClientRect();
				return {
					x: evt.clientX - rect.left,
					y: evt.clientY - rect.top
				};
			}

			canvas.addEventListener('mousemove', function(evt) {
				if(projectLoaded) {
					mousePos = getMousePos(canvas, evt);

					// Check if we're hovered over a clickable object...
					var hoveredOverObj = false;
					for(var i = 0; i < currentFrameObjects.length; i++) {
						var obj = currentFrameObjects[i];
						if(obj.clickable && pointInsideObj(obj, mousePos)) {
							hoveredOverObj = true;
							obj.hoveredOver = true;
							break;
						} else {
							obj.hoveredOver = false;
						}
					}
					//...and change the cursor if we are
					if(hoveredOverObj) {
						document.getElementById("playerCanvasContainer").style.cursor = "pointer";
					} else {
						document.getElementById("playerCanvasContainer").style.cursor = "default";
					}
				}
			}, false);

			document.getElementById("playerCanvasContainer").addEventListener("mousedown", function() {
				// Check if we clicked a clickable object
				for(var i = 0; i < currentFrameObjects.length; i++) {
					var obj = currentFrameObjects[i];
					if(obj.clickable && pointInsideObj(obj, mousePos)) {
						project.rootObject.currentFrame = obj.toFrame;
						console.log("Went to frame " + currentFrame);
						draw();
						break;
					}
				}
			}, false);

		}

		// Setup touch events (mobile mode)
		if(mobileMode) {

			var getTouchPos = function (canvas, evt) {
				var rect = canvas.getBoundingClientRect();
				var touch = evt.targetTouches[0];
				return {
					x: touch.pageX,
					y: touch.pageY
				};
			}

			document.getElementById("playerCanvasContainer").addEventListener("touchstart", function(evt) {
				console.log("bogo");

				// Check if we touched a clickable object
				for(var i = 0; i < frames[currentFrame].length; i++) {
					var obj = frames[currentFrame][i];
					if(obj.clickable && pointInsideObj(obj, getTouchPos(canvas, evt))) {
						currentFrame = obj.toFrame;
						console.log("Went to frame " + currentFrame);
						draw();
						break;
					}
				}
			}, false);

		}

		// update canvas size on window resize
		var resizeCanvas = function () {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}
		window.addEventListener('resize', resizeCanvas, false);
		resizeCanvas();

		// start draw/update loop
		animate();

		loadJSONProject(projectJSON);

	}

	wickPlayer.stopRunningCurrentProject = function() {

		console.error("WARNING: Builtin player cleanup (in WickPlayer.stopRunningCurrentProject()) not yet implemented! This can lead to slowness/problems!!")

	}

/*****************************
	Utils
*****************************/

	var pointInsideObj = function(obj, point) {

		var scaledObjLeft = obj.left;
		var scaledObjTop = obj.top;
		var scaledObjWidth = obj.width*obj.scaleX;
		var scaledObjHeight = obj.height*obj.scaleY;

		return point.x >= scaledObjLeft && 
			   point.y >= scaledObjTop &&
			   point.x <= scaledObjLeft + scaledObjWidth && 
			   point.y <= scaledObjTop + scaledObjHeight;
	}

/*****************************
	Draw/update loop
*****************************/

	var animate = function () {
		requestAnimationFrame(animate);
		if(projectLoaded) {
			update();
			draw();
		}
	}

	var update = function () {
		
		// Run scripts, advance all timelines one frame, etc.

		var root = project.rootObject;
		var currentFrame = root.layers[0].frames[root.currentFrame];
		currentFrameObjects = currentFrame.wickObjects;

	}

	var draw = function () {
		// Clear canvas
		context.clearRect(0, 0, canvas.width, canvas.height);

		// Draw current frame content
		for(var i = 0; i < currentFrameObjects.length; i++) {
			context.save();

			var obj = currentFrameObjects[i];
			if(obj.imageIsLoaded) {
				context.translate(obj.left, obj.top);
				context.scale(obj.scaleX, obj.scaleY);
				context.drawImage(obj.image, 0, 0);
			}

			context.restore();
		}

		context.fillStyle = "Black";
		context.font      = "normal 14pt Arial";
		context.fillText(fps.getFPS() + " FPS", canvas.width-80, 29);

	}

/*****************************
	Opening projects
*****************************/

	var loadJSONProject = function (proj) {
		projectLoaded = true;
		project = JSON.parse(proj);

		// Load images

		var root = project.rootObject;
		var currentFrame = root.layers[0].frames[root.currentFrame].wickObjects;
		
		for(var i = 0; i < currentFrame.length; i++) {
			var obj = currentFrame[i];
			obj.image = new Image();
			obj.image.src = obj.src;
			obj.image.onload = function() {
				obj.imageIsLoaded = true;
			};
		}
	}

	return wickPlayer;

})();