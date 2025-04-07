// Ettore Cantile 2026562
// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
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

  // Finally, we need to make the multiplication by making use of the function: MatrixMult
	// We first apply the right parameter and then the left one
	// We obtain this order: projectionMatrix*trans*rotationMatrixX*rotationMatrixY
	let finalRotation = MatrixMult( rotationMatrixX, rotationMatrixY);

	let intermediateResult = MatrixMult(trans, finalRotation);

	//transform the 3D coordinates into the 2D screen
	let result = MatrixMult( projectionMatrix, intermediateResult);

	//In conclusion, we return the final transformation, this matrix is passed to the vertex shader to transform vertex position
	return result;
}


class MeshDrawer
{
	//The constructor is a good place for taking care of the necessary initializations. Called when a new object is created
	constructor()
	{
		// Compile the shader program
		this.prog = InitShaderProgram( vsMesh, fsMesh );

		//We create two buffer: one  for the vertex positions and the other for the texture coordinates
		this.vertbuffer = gl.createBuffer();
		this.textureBuffer = gl.createBuffer();

		this.numTriangles=0;

		//Obtain the uniform variable locations from the shader program
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		this.swapYZPos = gl.getUniformLocation( this.prog, 'swapYZ' );
		this.showTexture = gl.getUniformLocation( this.prog, 'showText' );

		//Get the ids of the vertex attributes in the shaders
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );

		//Create an empty WebGL texture object
		this.mytexture = gl.createTexture();

		//Get the attribute for texture coordinates
		this.texturePosition = gl.getAttribLocation( this.prog, 'txc' );
		this.sampler = gl.getUniformLocation (this.prog, 'texture');
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

		//Each group of 3 values in vertPos represents one vertex
		//And each group of 3 vertices defines a triangle
		this.numTriangles = vertPos.length / 3;

		//Then we need to load the vertex position in the GPU memory
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		//We repeat the same for the texture coordinates
		gl.bindBuffer( gl.ARRAY_BUFFER, this.textureBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( texCoords ), gl.STATIC_DRAW );
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
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{

		gl.useProgram( this.prog );

		//Send to the vertex shader the MVP transformation matrix
		gl.uniformMatrix4fv( this.mvp, false, trans );

		//Bind and enable the vertex position attribute
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );

		//We repeat the same procedure for texture
		gl.bindBuffer( gl.ARRAY_BUFFER, this.textureBuffer );
		gl.vertexAttribPointer( this.texturePosition, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.texturePosition );

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
		gl.uniform1i(this.showTexture, true);

	}

	// This method is called when the user changes the state of the
	// "Show Texture" checkbox.
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		//Activate the shader program so that you can update its uniform variable
		gl.useProgram(this.prog);

		//Update the showTexture variable
		gl.uniform1i(this.showTexture, show ? 1 : 0);
	}

}
//This shader is run for every vertex
var vsMesh = `
  attribute vec2 txc;
	attribute vec3 pos;
	uniform mat4 mvp;
	uniform int swapYZ;

	varying vec2 textCoordinate;

	void main()
	{
		vec3 pos_temp;

		if (swapYZ == 1)
		{
			pos_temp = vec3(pos.x, pos.z, pos.y);
			gl_Position = mvp * vec4(pos_temp, 1.0);
		}
		else {

				gl_Position = mvp * vec4(pos, 1.0);
		}

		textCoordinate= txc;



	}
`;

//Fragment shader source code, runs once per fragment to decide the final color
var fsMesh = `
	precision mediump float;
	uniform sampler2D texture;
	varying vec2 textCoordinate;
	uniform int showText;
	void main()
	{

		if (showText == 1)
		{
				gl_FragColor = texture2D (texture, textCoordinate);
		}
		else
		{

				gl_FragColor = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
		}

	}
`;
