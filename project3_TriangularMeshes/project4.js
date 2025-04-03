// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	cosa=Math.cos(0);
	sina=Math.sin(0);
	cosb=Math.cos(rotationY);
	sinb=Math.sin(rotationY);
	cosc=Math.cos(rotationX);
	sinc=Math.sin(rotationX);

	var trans = [
		cosa*cosb, 				  sina*cosb, 				-sinb, 	      0,
		cosa*sinb*sinc-sina*cosc, sina*sinb*sinc+cosa*cosc, cosb*sinc,    0,
		cosa*sinb*cosc+sina*sinc, sina*sinb*cosc-cosa*sinc, cosb*cosc,    0,
		translationX, 			  translationY, 			translationZ, 1
	];
	var mvp = MatrixMult( projectionMatrix, trans );
	return mvp;
}

class MeshDrawer
{
	// Constructor handles shader compilation, program linking and uniform/attribute setup.
	constructor()
	{
		// Compile the vertex shader.
		this.vertexSha = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(this.vertexSha, meshVS);
		gl.compileShader(this.vertexSha);

		if (!gl.getShaderParameter( this.vertexSha, gl.COMPILE_STATUS) ) {
			alert('An error occurred compiling shader:\n' + gl.getShaderInfoLog(this.vertexSha));
			gl.deleteShader(this.vertexSha);
		}

		// Compile the fragment shader.
		this.fragmentSha = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(this.fragmentSha, meshFS);
		gl.compileShader(this.fragmentSha);

		if (!gl.getShaderParameter( this.fragmentSha, gl.COMPILE_STATUS) ) {
			alert('An error occurred compiling shader:\n' + gl.getShaderInfoLog(this.fragmentSha));
			gl.deleteShader(this.fragmentSha);
		}

		// Create and link the shader program.
		this.meshProg = gl.createProgram();
		gl.attachShader(this.meshProg, this.vertexSha);
		gl.attachShader(this.meshProg, this.fragmentSha);
		gl.linkProgram(this.meshProg);

		if (!gl.getProgramParameter(this.meshProg, gl.LINK_STATUS)) {
			alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(this.meshProg));
		}

		// Retrieve uniform and attrbute locations once.
		this.mvpmesh = gl.getUniformLocation( this.meshProg, 'mvpmesh' );
		this.sampler = gl.getUniformLocation( this.meshProg, 'tex' );
		this.useTex = gl.getUniformLocation( this.meshProg, 'useTexture' );
		this.vertexPos = gl.getAttribLocation( this.meshProg, 'posmesh' );
		this.texCoordsPos = gl.getAttribLocation( this.meshProg, 'txc' );

		// Initialize swapYZMatrix as identity.
		this.swapYZMatrix = new Float32Array([
			1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,0,0,1
		]);

		// Setup the control variables for texture binding and texture display.
		this.hasTexture = false;
		this.shwTexture = false;

	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
		// Create and bind the vertex positions buffer.
		this.pos_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.pos_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos),gl.STATIC_DRAW);

		// Create and bind the texture coordinates buffer.
		this.texCoords_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoords_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords),gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// Update swapYZMatrix to swap Y and Z axes.
		this.swapYZMatrix = swap ? [
			1,0,0,0,
			0,0,1,0,
			0,1,0,0,
			0,0,0,1
		] : [
			1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,0,0,1
		];
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{
		gl.useProgram( this.meshProg );
		// Update the value of uniform mvpmesh to get the final transformation.
		gl.uniformMatrix4fv( this.mvpmesh, false, MatrixMult(trans, this.swapYZMatrix) );
		
		// Bind the vertex positions and set the vertex attribute pointer.
		gl.bindBuffer( gl.ARRAY_BUFFER, this.pos_buffer );
		gl.vertexAttribPointer( this.vertexPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertexPos );

		// If a tecture is used, bind the texture corrdinates buffer, set up the texture and update the uniform.
		if (this.hasTexture && this.shwTexture){
			
			gl.bindBuffer( gl.ARRAY_BUFFER, this.texCoords_buffer );
			gl.vertexAttribPointer( this.texCoordsPos, 2, gl.FLOAT, false, 0, 0 );
			gl.enableVertexAttribArray( this.texCoordsPos );

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture( gl.TEXTURE_2D, this.tex_buffer);
			gl.uniform1i(this.sampler,0);
			gl.uniform1i(this.useTex,1);

		} else {
			gl.uniform1i(this.useTex,0);
		};

		// Draw the mesh.
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// Create and bind the texture
		this.tex_buffer = gl.createTexture();
		gl.bindTexture( gl.TEXTURE_2D, this.tex_buffer);
		// Set the texture image data.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );
		gl.generateMipmap( gl.TEXTURE_2D );
		// Set some uniform parameters of the fragment shader, so that it uses the texture.
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_MAG_FILTER,
			gl.LINEAR
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_MIN_FILTER,
			gl.LINEAR
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_S,
			gl.REPEAT
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_T,
			gl.REPEAT
		);

		this.hasTexture = true;
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// Set shwTexture control variable.
		this.shwTexture = show;
	}
	
}

// Vertex shader source code
var meshVS = `
	attribute vec3 posmesh;
	attribute vec2 txc;
	uniform mat4 mvpmesh;
	varying vec2 texCoord;

	void main()
	{
		gl_Position = mvpmesh * vec4(posmesh,1);
		texCoord = txc;
	}
`;
// Fragment shader source code
var meshFS = `
	
	precision mediump float;
	uniform sampler2D tex;
	uniform bool useTexture;
	varying vec2 texCoord;
	void main()
	{
		if(useTexture){
			gl_FragColor = texture2D(tex, texCoord);
		} else {
			gl_FragColor = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
		}
	}
`;
