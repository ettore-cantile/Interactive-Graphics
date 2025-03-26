// Ettore Cantile 2026562
// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	// Define the translation and scale matrices. The values are stored in column-major format
	let translationMatrix = Array(1, 0, 0, 0, 1, 0, positionX, positionY, 1);
	let scaleMatrix = Array(scale, 0, 0, 0, scale, 0, 0, 0, 1);
	
	
	// Since Math.sin and Math.cos take an angle in radians as input, we need to convert rotation from degrees to radians
	radiantRotation = rotation*( Math.PI / 180 );
	
	// Define the rotation matrix
	let rotationMatrix = Array(Math.cos(radiantRotation), Math.sin(radiantRotation), 0, -Math.sin(radiantRotation), Math.cos(radiantRotation), 0, 0, 0, 1);
	
	
	// Call the function ApplyTransform to apply scaling first, then rotation
	intermediateMatrix= ApplyTransform(scaleMatrix, rotationMatrix);
	
	// After the first application we need also to apply the translation
	return ApplyTransform(intermediateMatrix, translationMatrix);
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{
	// Check whether both matrices are 3x3. If not, we don't apply the transformation. We return an identity matrix
	if (trans1.length != 9 || trans2.length != 9)
			return Array( 1, 0, 0, 0, 1, 0, 0, 0, 1);
	
	// Initialize the final matrix with all zeros.
	let finalMatrix= new Array(3 * 3).fill(0);
	
	
	// Perform matrix multiplication: finalMatrix= trans2 * trans1
	for (j=0; j<3; j++) // Iterate over columns of trans1
	{
		for(i=0; i<3; i++ ) // Iterate over rows of trans2
		{
			for(l=0; l<3; l++)    // Perform the dot product sum
			{
				finalMatrix[(j*3)+i]+= trans2[(l*3)+i] * trans1[(j*3)+l];
			}
		}
	}
	
	// Return the result to the GetTransform function
	return finalMatrix;
}
