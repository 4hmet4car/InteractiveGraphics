// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {

	cosa = Math.cos(0);
	sina = Math.sin(0);
	cosb = Math.cos(rotationY);
	sinb = Math.sin(rotationY);
	cosc = Math.cos(rotationX);
	sinc = Math.sin(rotationX);

	var trans = [
		cosa * cosb, sina * cosb, -sinb, 0,
		cosa * sinb * sinc - sina * cosc, sina * sinb * sinc + cosa * cosc, cosb * sinc, 0,
		cosa * sinb * cosc + sina * sinc, sina * sinb * cosc - cosa * sinc, cosb * cosc, 0,
		translationX, translationY, translationZ, 1
	];
	var mv = trans;
	return mv;
}

class MeshDrawer {
	constructor() {
		// Compile the vertex shader
		this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(this.vertexShader, meshVS);
		gl.compileShader(this.vertexShader);

		if (!gl.getShaderParameter(this.vertexShader, gl.COMPILE_STATUS)) {
			alert('An error occurred compiling shader:\n' + gl.getShaderInfoLog(this.vertexShader));
			gl.deleteShader(this.vertexShader);
		}

		// Compile the fragment shader
		this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(this.fragmentShader, meshFS);
		gl.compileShader(this.fragmentShader);

		if (!gl.getShaderParameter(this.fragmentShader, gl.COMPILE_STATUS)) {
			alert('An error occurred compiling shader:\n' + gl.getShaderInfoLog(this.fragmentShader));
			gl.deleteShader(this.fragmentShader);
		}

		// Link the shader program
		this.program = gl.createProgram();
		gl.attachShader(this.program, this.vertexShader);
		gl.attachShader(this.program, this.fragmentShader);
		gl.linkProgram(this.program);

		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
			alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(this.program));
		}

		// Get uniform and attribute locations
		this.uMVP = gl.getUniformLocation(this.program, 'uMVP');
		this.uMV = gl.getUniformLocation(this.program, 'uMV');
		this.uNormalMatrix = gl.getUniformLocation(this.program, 'uNormalMatrix');
		this.uLightDir = gl.getUniformLocation(this.program, 'uLightDir');
		this.uSampler = gl.getUniformLocation(this.program, 'uSampler');
		this.uUseTexture = gl.getUniformLocation(this.program, 'uUseTexture');
		this.uShininess = gl.getUniformLocation(this.program, 'uShininess');
		this.uSwapYZ = gl.getUniformLocation(this.program, 'uSwapYZ');

		this.aPosition = gl.getAttribLocation(this.program, 'aPosition');
		this.aNormal = gl.getAttribLocation(this.program, 'aNormal');
		this.aTexCoord = gl.getAttribLocation(this.program, 'aTexCoord');

		// Create buffers
		this.positionBuffer = gl.createBuffer();
		this.texCoordBuffer = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();

		// Initialize identity swapYZ matrix
		this.swapYZMatrix = new Float32Array([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		]);
		gl.useProgram(this.program);
		gl.uniformMatrix4fv(this.uSwapYZ, false, this.swapYZMatrix);

		this.hasTexture = false;
	}

	setMesh(vertPos, texCoords, normals) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

		this.numVertices = vertPos.length / 3;
	}

	swapYZ(swap) {
		this.swapYZMatrix = new Float32Array(swap ? [
			1, 0, 0, 0,
			0, 0, 1, 0,
			0, 1, 0, 0,
			0, 0, 0, 1
		] : [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		]);

		gl.useProgram(this.program); // ensure program is active
		gl.uniformMatrix4fv(this.uSwapYZ, false, this.swapYZMatrix);
	}

	draw(matrixMVP, matrixMV, matrixNormal) {
		gl.useProgram(this.program);

		gl.uniformMatrix4fv(this.uMVP, false, matrixMVP);
		gl.uniformMatrix4fv(this.uMV, false, matrixMV);
		gl.uniformMatrix3fv(this.uNormalMatrix, false, matrixNormal);

		// Position attribute
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.aPosition);

		// Normal attribute
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.aNormal);

		gl.drawArrays(gl.TRIANGLES, 0, this.numVertices);
	}

	setTexture(img) {
		// Texture coordinate attribute
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.aTexCoord);

		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(this.uSampler, 0);

		gl.useProgram(this.program);
		gl.uniform1i(this.uUseTexture, 1);

		this.hasTexture = true;
	}

	showTexture(show) {
		if (this.hasTexture) {
			gl.useProgram(this.program);
			gl.uniform1i(this.uUseTexture, show);
		}
	}

	setLightDir(x, y, z) {
		gl.useProgram(this.program);
		gl.uniform3fv(this.uLightDir, new Float32Array([x, y, z]));
	}

	setShininess(shininess) {
		gl.useProgram(this.program);
		gl.uniform1f(this.uShininess, shininess);
	}
}


// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
	var forces = Array( positions.length ); // The total for per particle

	// [TO-DO] Compute the total force of each particle

	for ( var i=0; i<forces.length; ++i ) {
			forces[i] = gravity.mul(particleMass);
		}
	
	for ( var i=0; i<springs.length; ++i ) {
			this.x1x0 = positions[springs[i].p1].sub(positions[springs[i].p0]);
			this.v1v0 = velocities[springs[i].p1].sub(velocities[springs[i].p0]);
			this.l = this.x1x0.len();
			this.d = this.x1x0.div(this.l);
			this.ldot = this.v1v0.dot(this.d);
			this.rest = springs[i].rest;
			this.springforce = this.d.mul(stiffness * (this.l - this.rest));
			this.dampingforce = this.d.mul(damping * this.ldot);
			this.force = this.springforce.add(this.dampingforce);
			forces[springs[i].p0] = forces[springs[i].p0].add(this.force);
			forces[springs[i].p1] = forces[springs[i].p1].sub(this.force);
			//console.log(forces);
		}
	
	// [TO-DO] Update positions and velocities

	for ( var i=0; i<forces.length; ++i ) {
			this.a = forces[i].div(particleMass);
			velocities[i] = velocities[i].add(this.a.mul(dt));
			positions[i] = positions[i].add(velocities[i].mul(dt));
		}
	
	// [TO-DO] Handle collisions

	for ( var i=0; i<positions.length; ++i ) {
			//console.log(positions[i]);
			if (positions[i].x < -1){
				h = -1 - positions[i].x;
				positions[i].x = -1 + restitution * h;
				velocities[i] = velocities[i].mul(-restitution);
			}
			if (positions[i].x > 1){
				h = positions[i].x -1;
				positions[i].x = 1 - restitution * h;
				velocities[i] = velocities[i].mul(-restitution);
			}
			if (positions[i].y < -1){
				h = -1 - positions[i].y;
				positions[i].y = -1 + restitution * h;
				velocities[i] = velocities[i].mul(-restitution);
			}
			if (positions[i].y > 1){
				h = positions[i].y -1;
				positions[i].y = 1 - restitution * h;
				velocities[i] = velocities[i].mul(-restitution);
			}
			if (positions[i].z < -1){
				h = -1 - positions[i].z;
				positions[i].z = -1 + restitution * h;
				velocities[i] = velocities[i].mul(-restitution);
			}
			if (positions[i].z > 1){
				h = positions[i].z -1;
				positions[i].z = 1 - restitution * h;
				velocities[i] = velocities[i].mul(-restitution);
			}
		}
	
}


// Vertex shader source code
var meshVS = `
	attribute vec3 aPosition;
	attribute vec2 aTexCoord;
	attribute vec3 aNormal;

	uniform mat4 uMVP;
	uniform mat4 uMV;
	uniform mat4 uSwapYZ;

	varying vec2 vTexCoord;
	varying vec3 vNormal;
	varying vec3 vViewDir;

	void main() {
		gl_Position = uMVP * uSwapYZ * vec4(aPosition, 1.0);
		vViewDir = (uMV * uSwapYZ * vec4(aPosition, 1.0)).xyz;
		vTexCoord = aTexCoord;
		vNormal = aNormal * mat3(uSwapYZ);
	}

`;

// Fragment shader source code
var meshFS = `
	
	precision mediump float;

	uniform sampler2D uSampler;
	uniform bool uUseTexture;
	uniform vec3 uLightDir;
	uniform mat3 uNormalMatrix;
	uniform float uShininess;
	
	varying vec2 vTexCoord;
	varying vec3 vNormal;
	varying vec3 vViewDir;

	void main() {
		vec3 lightColor = vec3(1.0);
		vec3 diffuseColor = vec3(1.0, 0.0, 0.0); // red
		vec3 specularColor = vec3(1.0);
		
		vec3 N = normalize(uNormalMatrix * vNormal);
		vec3 L = normalize(uLightDir);
		vec3 V = normalize(-vViewDir);
		vec3 H = normalize(L + V);
		
		float diff = max(dot(N, L), 0.0);
		float spec = (diff > 0.0) ? pow(max(dot(N, H), 0.0), uShininess) : 0.0;
		
		vec3 baseColor = uUseTexture ? texture2D(uSampler, vTexCoord).xyz : diffuseColor;
		vec3 color = baseColor * diff * lightColor + specularColor * spec * lightColor;

		// Optional ambient
		color += baseColor * 0.1;

		gl_FragColor = vec4(color, 1.0);
	}

`;