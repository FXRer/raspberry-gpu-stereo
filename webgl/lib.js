var buffer;
var screen_w;
var screen_h;

/* Create programs, textures and framebuffers */
var programs = [];
var textures = [];	
var framebuffers = [];
var gl;

// Following loadShaders() function is (slightly modified) from: http://webreflection.blogspot.fr/2010/09/fragment-and-vertex-shaders-my-way-to.html
function loadShaders(e,a,r){function t(){var t=this,n=t.i;if(4==t.readyState){if(a[n]=e.createShader("fs"==a[n].slice(0,2)?e.FRAGMENT_SHADER:e.VERTEX_SHADER),e.shaderSource(a[n],t.responseText),e.compileShader(a[n]),!e.getShaderParameter(a[n],e.COMPILE_STATUS))throw e.getShaderInfoLog(a[n]);!--d&&"function"==typeof r&&r(a)}}for(var n,a=[].concat(a),o=!!r,s=a.length,d=s;s--;)(n=new XMLHttpRequest).i=s,n.open("get",loadShaders.base+a[s]+".glsl",o),o&&(n.onreadystatechange=t),n.send(null),t.call(n);return a}loadShaders.base="shader/";

function main()
{
  /* Get left image */
  var image_left = new Image();
  image_left.onload = function() {
	/* Now get the right one */
	var image_right = new Image();
	image_right.onload = function() {
		/* Ready to go! so GO! */
		setupWebGL(image_left, image_right);
	}
	image_right.src = "img_right.bmp";
  }
  image_left.src = "img_left.bmp";
}

function buildProgram(gl, vs, fs)
{
	var p = gl.createProgram();
	/* console.log(p); */
	gl.attachShader(p, vs);
	gl.attachShader(p, fs);  
	gl.linkProgram(p);

	return p;
}

/* This helper function is only used where time is not critical, do not worry */
function setVariables(gl, proggy, listVariables){ 
	for (var i = 0; i < listVariables.length; i++) {
		var value = listVariables[i].VALUE;
		if(Array.isArray(value)){
			gl.uniform2f(gl.getUniformLocation(proggy, listVariables[i].LVALUE), value[0], value[1]);
		}else{
			gl.uniform1i(gl.getUniformLocation(proggy, listVariables[i].LVALUE), value);
		}
	}
}

function setupWebGL(image_left, image_right)
{
	/* Set up the "screen" canvas */
	var canvObj = document.getElementById("screen");
	screen_w = w * cols; canvObj.width = screen_w;
	screen_h = h * rows; canvObj.height = screen_h;

	/* Get the Webgl instance */
	try {
		gl = canvObj.getContext("experimental-webgl", { preserveDrawingBuffer: true });
	} catch (e) {
		alert("No WebGL support!");
		return false;
	};

	/* Set clear color to white */
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	/* Create the buffer for the quad */
	buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, 0.0, 1.0, 1.0,
		1.0, 0.0, 1.0, 1.0,
		0.0, 1.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0
		]), gl.STATIC_DRAW);


	/* Get and load shaders */
	var v_shaders = loadShaders(gl, vs_paths);
	var f_shaders = loadShaders(gl, fs_paths);

	/* Programs */
	for (var i = 0; i < PROGRAMS.length; i++) {
		var program = buildProgram(gl, v_shaders[PROGRAMS[i].VS], f_shaders[PROGRAMS[i].FS]);

		/* Point to the buffer with the quad */
		gl.useProgram(program);
		var _vertex = gl.getAttribLocation(program, "vertex");
		gl.vertexAttribPointer(_vertex, 4, gl.FLOAT, false, 16, 0);
		gl.enableVertexAttribArray(_vertex);

		programs.push(program);
	}

	/* Textures and framebuffers */
	for (var i = 0; i < FBS.length; i++) {
		/* Texture */
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

		if(i == 0){
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image_left);
			texture.width = image_left.width;
			texture.height = image_left.height;
		}else if(i == 1){
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image_right);
			texture.width = image_right.width;
			texture.height = image_right.height;
		}else{
			texture.width = w/FBS[i].WDIV;
			texture.height = h/FBS[i].HDIV;
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texture.width, texture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);		
		}

		/* Framebuffer */
		var framebuffer = gl.createFramebuffer();
		framebuffer.width = texture.width;
		framebuffer.height = texture.height;
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		/* Add to array */
		textures.push(texture);
		framebuffers.push(framebuffer);
	}

	/* Do only once as many as things as possible! */
	renderInit(gl, textures, framebuffers, programs);

	/* Actual frame drawing code */
	render(gl, textures, framebuffers, programs);
}

function renderGrid(){
	/* Draw the grid */
	var tex = rows * cols - 1;
	var grid_col_size = 2.0 / cols;
	var grid_row_size = 2.0 / rows;
	gl.bindFramebuffer(gl.FRAMEBUFFER, null); 	/* Now we are drawing to screen! */
	gl.viewport(0, 0, screen_w, screen_h);
	gl.useProgram(programs[_FS.FLIP]);

	for(var row = 0; row < rows; row++){
		for(var col = cols - 1; col >= 0; col--){
			var colx = -1.0 + col * grid_col_size;
			var rowy = -1.0 + row * grid_row_size;
			var gridValues = [{LVALUE: "offset", VALUE: [colx + col * 0.005, rowy]}, {LVALUE: "scale", VALUE: [grid_col_size, grid_row_size]}];
			setVariables(gl, programs[_FS.FLIP], gridValues)
			gl.bindTexture(gl.TEXTURE_2D, textures[dtex[tex--]]);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		}
	}
}
