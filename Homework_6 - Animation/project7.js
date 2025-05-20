// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	//Define translation matrix in column-major order for WebGL
	//The matrix helps to move the object in 3D space
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1];

	//The next step is to define the rotation around X-axis and Y-axis
	//The rotation is counterclockwise, in this way is possible to replicate the rotation required in the video
	let rotationMatrixX = [
					1, 0, 0, 0,
					0, Math.cos(rotationX), Math.sin(rotationX), 0,
					0, -Math.sin(rotationX), Math.cos(rotationX), 0,
					0, 0, 0, 1];

	let rotationMatrixY = [
					Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
					0, 1, 0, 0,
					Math.sin(rotationY), 0, Math.cos(rotationY), 0,
					0, 0, 0, 1];

	//Finally, we need to make the multiplication by making use of the function: MatrixMult
	//We first apply the right parameter and then the left one
	//We obtain this order: trans*rotationMatrixX*rotationMatrixY
	let intermediateRotation = MatrixMult( rotationMatrixX, rotationMatrixY);

	let result = MatrixMult(trans, intermediateRotation);

	//In conclusion, we return the final transformation, this matrix is passed to the vertex shader to transform vertex position
	return result;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		//Links the shaders programs into a WebGL program
		this.prog = InitShaderProgram( vsMesh, fsMesh );

		//We create 3 buffer: for the vertex positions, texture and normal of the vertex. They are used to send data to the GPU 
		this.vertbuffer = gl.createBuffer();
		this.textureBuffer = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();

		//We set the initial number of triangles to 0
		this.numTriangles=0;

		//Get the locations of the uniform variables so we can pass values to the shader
		this.swapYZPos = gl.getUniformLocation( this.prog, 'swapYZ' );
		this.showTextureUniformLocation  = gl.getUniformLocation( this.prog, 'showText' );

		//Get the ids of the vertex attributes in the shaders
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );

		//Create an empty WebGL texture object
		this.mytexture = gl.createTexture();

		//Get the attribute for texture coordinates
		this.texturePosition = gl.getAttribLocation( this.prog, 'txc' );
		this.sampler = gl.getUniformLocation (this.prog, 'texture');

		//We define a variable in the shader for normals
		this.normal= gl.getAttribLocation(this.prog, "normalAttribute");
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
		//Each group of 3 values in vertPos represents one vertex
		//And each group of 3 vertices defines a triangle
		this.numTriangles = vertPos.length / 3;

		//Then we need to load the vertex position in the GPU memory
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		//We repeat the same for the texture coordinates
		gl.bindBuffer( gl.ARRAY_BUFFER, this.textureBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( texCoords ), gl.STATIC_DRAW );

		//We repeat the same for the normal
		gl.bindBuffer( gl.ARRAY_BUFFER, this.normalBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( normals ), gl.STATIC_DRAW );
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		gl.useProgram (this.prog);

		//Set a boolean uniform to tell to the vertex shader whether swap X and Y
		gl.uniform1i(this.swapYZPos, swap ? 1 : 0);
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		//We active the shader before sending uniform variables
		gl.useProgram( this.prog );

		//We obtain the location of the matrix in the shader
		this.location = gl.getUniformLocation(this.prog, "mvp");
		//Send to the vertex shader the MVP transformation matrix
		gl.uniformMatrix4fv( this.location, false, matrixMVP );

		this.location1 = gl.getUniformLocation(this.prog, "mv");
		//Send to the vertex shader the MV transformation matrix
		gl.uniformMatrix4fv( this.location1, false, matrixMV );

		this.location2 = gl.getUniformLocation(this.prog, "normalMatrix");
		//Send to the vertex shader the normal transformation matrix
		gl.uniformMatrix3fv( this.location2, false, matrixNormal );

		//Bind and enable the vertex position attribute
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );

		//We repeat the same procedure for texture
		gl.bindBuffer( gl.ARRAY_BUFFER, this.textureBuffer );
		gl.vertexAttribPointer( this.texturePosition, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.texturePosition );

		//We repeat the same procedure for normal
		gl.bindBuffer( gl.ARRAY_BUFFER, this.normalBuffer );
		gl.vertexAttribPointer( this.normal, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.normal );

		//In conclusion, we draw the mesh as a group of triangles
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		//We need to set the texture unit to TEXTURE0
		//Then we bind the texture with TEXTURE_2D
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.mytexture);

		//You can set the texture image data using the following command
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );
		gl.generateMipmap(gl.TEXTURE_2D);

		//Set texture filtering and wrapping mode
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		gl.useProgram(this.prog);

		//We set the uniform variable this.sampler in the shader program to 0
		//In this way we are saying tha we make use of the texture unit 0
		gl.uniform1i(this.sampler, 0);

		//We need to tell to the fragment shader to render the texture
		gl.uniform1i(this.showTextureUniformLocation , true);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		//Activate the shader program so that we can update its uniform variable
		gl.useProgram(this.prog);

		//Update the showTexture variable
		gl.uniform1i(this.showTextureUniformLocation , show ? 1 : 0);
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		//Set the direction of the light, then we send the value to the shader program 
		gl.useProgram(this.prog);
		this.lightDirection = [x, y, z];
		this.location4= gl.getUniformLocation(this.prog, "lightDirectionUniform");
		gl.uniform3fv(this.location4, this.lightDirection);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		//We need to send the alpha parameter to the vertex shader to calculate the specular part of the color
		gl.useProgram(this.prog);
		this.location5=gl.getUniformLocation(this.prog, "shininessUniform");
		gl.uniform1f(this.location5, shininess);
	}
}


// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep(dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution) {
    var forces = Array(positions.length);
    for (let i = 0; i < positions.length; i++) {
		//We initialize the force vector as a vec3
        forces[i] = new Vec3(0, 0, 0);
    }

    //Computation of the gravity force
    for (let i = 0; i < positions.length; i++) {
		//Forces=particleMass*gravity
        forces[i].set(gravity.mul(particleMass));
    }

    //Computation of the spring force and damping spring
    for (let i = 0; i < springs.length; i++) {
        let currentSpring = springs[i];

		//We take eache element of the spring
        let particleA = currentSpring.p0;
        let particleB = currentSpring.p1;
        let rest = currentSpring.rest;

        
        let displacement = positions[particleB].sub(positions[particleA]);
		//Compute the distance beetween A and B
        let length = displacement.len();
        if (length == 0) continue;


        let direction = displacement.unit();

		//ForceA=stiffness*(length-rest)*direction
        let forceA = direction.mul(stiffness * (length - rest));

		//ForceB is opposite to forceA
        let forceB = forceA.mul(-1);

		//We add the spring force to the gravity force of the two particles
        forces[particleA].inc(forceA);
        forces[particleB].inc(forceB);

        //Compute the damping spring
        let velocityA = velocities[particleA];
        let velocityB = velocities[particleB];
        let relativeVelocity = velocityB.sub(velocityA);

		//DampingForce= damping*(relativeVelocity.direction)*direction
        let dampingForce = direction.mul(damping * relativeVelocity.dot(direction));

		//Finally, we also add the damping force for the particleA, while for the particleB we subtract it
        forces[particleA].inc(dampingForce);
        forces[particleB].dec(dampingForce);
    }

    //We are updating the velocity and the position of the particle.
    //We make use of the Semi-implicit Euler integration
    for (let i = 0; i < positions.length; i++) {
		//A=Forces/particleMass
        let acceleration = forces[i].div(particleMass);

		//Given the acceleration we can compute the new velocity and then the new position
		//NewVelocities=Velocities+acceleration*dt
        velocities[i].inc(acceleration.mul(dt));
		//Positions=positions+NewVelocities*dt
        positions[i].inc(velocities[i].mul(dt));
    }

    for (let i = 0; i < positions.length; i++) 
	{
		//We consider the same for all the 3 axis
    	for (let j of ['x', 'y', 'z']) 
		{
			//We have a collision when the position of the particle is less or greater than 1.
			if (positions[i][j] < -1) 
			{
				positions[i][j] = -1; // Keep the particle inside the box

				//We invert velocity with restitution applied
				velocities[i][j] *= -restitution; 
			} else if (positions[i][j] > 1) 
			{
				positions[i][j] = 1; 

				//We invert velocity with restitution applied
				velocities[i][j] *= -restitution; 
			}

    	}
	}

}






//This shader is run for every vertex
var vsMesh = `

	//Data coming from the buffer defined in Javascript
	attribute vec2 txc;
	attribute vec3 pos;
	attribute vec3 normalAttribute;

	uniform mat4 mvp;
	uniform mat4 mv;
	uniform mat3 normalMatrix;
	uniform int swapYZ;

	//Values that are passed to the fragment shader
	varying vec2 textCoordinate;
	varying vec3 normalVar;
	varying vec4 positionVar;

	void main()
	{
		vec3 pos_temp; 

		//If swapYZ is active, use the temporary variable pos_temp to swap the Y and Z coordinates
		if (swapYZ == 1)
		{
			pos_temp = vec3(pos.x, pos.z, pos.y);
			gl_Position = mvp * vec4(pos_temp, 1.0);
		}
		else 
		{

			gl_Position = mvp * vec4(pos, 1.0);
		}

		//We pass these values to the fragment shader
		textCoordinate= txc;
		positionVar= mv * vec4(pos, 1.0);
		normalVar = normalMatrix * normalAttribute;
	}
`;

//Fragment shader source code, runs once per fragment to decide the final color
var fsMesh = `
	precision mediump float;

	//Uniform variables sent from JavaScript
	uniform sampler2D texture;
	uniform vec3 lightDirectionUniform;
	uniform int showText;
	uniform float shininessUniform;

	//Values passed from the vertex shader
	varying vec2 textCoordinate;
	varying vec4 positionVar;
	varying vec3 normalVar;

	
	void main()
	{
		//Initialize the 3 values to white
		float I= 1.0;
		vec4 Kd=vec4(1.0);
		vec4 Ks=vec4(1.0);
		
		//Normalization and vector calculations
		vec3 lightD= normalize(lightDirectionUniform);
		vec3 normalV=normalize(normalVar);
		vec3 positionV=normalize(vec3(-positionVar));
		vec3 H=normalize(lightD + positionV);


		//If the texture is set, we use the texture color for Kd, otherwise we use the white color
		if (showText == 1)
		{
			Kd = texture2D (texture, textCoordinate);
		}
		//Calculate the diffuse component
		float cosTeta= max(dot(lightD,normalV), 0.0);
		vec4 diffuse= I* cosTeta *Kd;
		
		//Obtain the specular component. Then the final color of the fragment is the sum between the two different components
		float cosPhi= max(dot(normalV,H), 0.0);
		float specularPart = pow(cosPhi,shininessUniform);

		vec4 specular= I * Ks * specularPart;

		gl_FragColor= diffuse + specular;



	}
`;