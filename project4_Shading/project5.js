// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	
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
	var mv = trans;
	return mv;
}




class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
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
		this.mvmesh = gl.getUniformLocation( this.meshProg, 'mvmesh' );
		this.mNormal = gl.getUniformLocation( this.meshProg, 'mNormal' );
		this.lDir = gl.getUniformLocation( this.meshProg, 'lDir' );
		this.sampler = gl.getUniformLocation( this.meshProg, 'tex' );
		this.useTex = gl.getUniformLocation( this.meshProg, 'useTexture' );
		this.shine = gl.getUniformLocation( this.meshProg, 'shininess' );
		
		this.vertexPos = gl.getAttribLocation( this.meshProg, 'posmesh' );
		this.vertexNorm = gl.getAttribLocation( this.meshProg, 'nrm' );
		this.texCoordsPos = gl.getAttribLocation( this.meshProg, 'txc' );

		// Create the needed buffers.
		this.pos_buffer = gl.createBuffer();
		this.texCoords_buffer = gl.createBuffer();
		this.normal_buffer = gl.createBuffer();

		// Initialize swapYZMatrix as identity.
		this.swapYZMatrix = new Float32Array([
			1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,0,0,1
		]);

		this.hasTexture = false;

	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// Bind the vertex positions buffer.
		gl.bindBuffer(gl.ARRAY_BUFFER, this.pos_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos),gl.STATIC_DRAW);

		// Bind the texture coordinates buffer.
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoords_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords),gl.STATIC_DRAW);

		// Bind the normal buffer.
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals),gl.STATIC_DRAW);

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
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		gl.useProgram( this.meshProg );
		// Update the values of uniform mvpmesh, mvmesh, mNormal to get the final transformation.
		gl.uniformMatrix4fv( this.mvpmesh, false, MatrixMult(matrixMVP, this.swapYZMatrix) );
		gl.uniformMatrix4fv( this.mvmesh, false, matrixMV);
		gl.uniformMatrix3fv( this.mNormal, false, matrixNormal);
		
		// Bind the vertex positions and set the vertex attribute pointer.
		gl.bindBuffer( gl.ARRAY_BUFFER, this.pos_buffer );
		gl.enableVertexAttribArray( this.vertexPos );
		gl.vertexAttribPointer( this.vertexPos, 3, gl.FLOAT, false, 0, 0 );

		// Bind the normals and set the vertex attribute pointer.
		gl.bindBuffer( gl.ARRAY_BUFFER, this.normal_buffer );
		gl.enableVertexAttribArray( this.vertexNorm );
		gl.vertexAttribPointer( this.vertexNorm, 3, gl.FLOAT, false, 0, 0 );

		// Draw the mesh.
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		gl.bindBuffer( gl.ARRAY_BUFFER, this.texCoords_buffer );
		gl.vertexAttribPointer( this.texCoordsPos, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.texCoordsPos );
		
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

		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(this.sampler,0);

		gl.useProgram( this.meshProg );
		gl.uniform1i(this.useTex,1);

		this.hasTexture = true;

	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// Set shwTexture control variable.
		if(this.hasTexture){
			gl.useProgram( this.meshProg );
			gl.uniform1i(this.useTex,show);
		}
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		
		gl.useProgram( this.meshProg );
		gl.uniform3fv(this.lDir, new Float32Array([x,y,z]));
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		
		gl.useProgram( this.meshProg );
		gl.uniform1f(this.shine,shininess);
	}
}

// Vertex shader source code
var meshVS = `
	attribute vec3 posmesh;
	attribute vec2 txc;
	attribute vec3 nrm;

	uniform mat4 mvpmesh;
	uniform mat4 mvmesh;

	varying vec2 texCoord;
	varying vec3 norm;
	varying vec3 camDir;

	void main()
	{
		gl_Position = mvpmesh * vec4(posmesh,1);
		camDir = (mvmesh * vec4(posmesh,1)).xyz;
		texCoord = txc;
		norm = nrm;
	}
`;
// Fragment shader source code
var meshFS = `
	
	precision mediump float;

	uniform sampler2D tex;
	uniform bool useTexture;
	uniform vec3 lDir;
	uniform mat3 mNormal;
	uniform float shininess;

	varying vec2 texCoord;
	varying vec3 norm;
	varying vec3 camDir;

	void main()
	{
		vec3 lightColor = vec3(1);
		vec3 diffColor = vec3(1,0,0);
		vec3 specColor = vec3(1);

		vec3 N = normalize(mNormal * norm);
		vec3 L = lDir;
		vec3 V = normalize(-camDir);
		vec3 H = normalize(L + V);

		float diff = max(dot(N, L),0.0);
		float spec = pow(max(dot(N, H),0.0),shininess);

		vec3 diffuse = lightColor * diff;
		vec3 specular = lightColor * spec;
		vec3 ambient = diffColor * 0.1;

		vec3 color;
		

		if(useTexture){
			color = lightColor * diff * (texture2D(tex, texCoord).xyz + specColor * spec / diff);
		} else {
		 	color = lightColor * diff * (diffColor + specColor * spec / diff);
		}

		gl_FragColor = vec4(color, 1);
	}
`;
