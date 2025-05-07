//Ettore Cantile 2026562

var raytraceFS = `

struct Ray{ 
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	//Diffuse coefficient
	vec3  k_s;	//Specular coefficient
	float n;	//Specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

//Returns true if the ray intersects any object and collects the information about the closest hit
bool IntersectRay( inout HitInfo hit, Ray ray );

//Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	//We start with a black color
	vec3 color = vec3(0,0,0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) {

		//Define a normalize vector pointing from the given point to the light source
		vec3 LightDir=normalize(lights[i].position - position);

		//We need to create the shadow ray and its hit information
		Ray rayShadow;
		HitInfo hitShadow;

		//The ray starts from the given point and follows the light direction
		rayShadow.pos= position;
		rayShadow.dir= LightDir;

		//Now we have to check if the ray shadow hits one of the object along the direction. So we make use of IntersectRay function

		bool resultInterception= IntersectRay(hitShadow, rayShadow);

		//If the function returns true it means that the point that we are considering is in shadow
		//If not we need to consider the contribute of the light to the color.
		if(!resultInterception) 
		{
			//Compute the shiny and diffuse part of the color
			vec3 h=normalize(LightDir + view);
			vec3 specularPart= lights[i].intensity *mtl.k_s *(pow(max(dot(normal,h),0.0),mtl.n));
			vec3 diffusePart= lights[i].intensity *mtl.k_d *(max(dot(LightDir,normal),0.0));

			color += diffusePart + specularPart; 
		}
	}
	//We return the final color, obtained by considering all the source of light
	return color;
}
//Intersects the given ray with all spheres in the scene
//And updates the given HitInfo using the information of the sphere
//That first intersects with the ray.
//Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	//We initialize the value of the interception to an upper limit
	hit.t = 1e30;
	bool foundHit = false;
	
	//Repeat the same procedure for all the object in the scene
	for ( int i=0; i<NUM_SPHERES; ++i ) {

	//Compute the coefficients of the quadratic equation
	float a= dot(ray.dir,ray.dir);
	float b= 2.0* (dot(ray.dir,(ray.pos-spheres[i].center)));
	float c=(dot((ray.pos-spheres[i].center),(ray.pos-spheres[i].center))) - (pow(spheres[i].radius,2.0));

	float delta= (pow(b,2.0)) -((4.0)*a*c);

	//In this case the ray intercepts the sphere, otherwise does not hits the element
	if(delta>=0.0)
	{
		//Compute the two possible intersection of the ray with the sphere.
		//We take the first value because is the closest hit with the object(if delta>0)
		float t1= (-b - (sqrt(delta)))/((2.0)*a); 
		float t2= (-b + (sqrt(delta)))/((2.0)*a);

		if((t1<hit.t) && (t1>0.0))
		{
			//Set the information about the hit
			hit.t= t1;
			hit.position= ray.pos + (t1*ray.dir);
			hit.mtl= spheres[i].mtl;
			hit.normal= normalize(hit.position - spheres[i].center);

			//Set the boolean value to true
			foundHit= true;
		}
	}
		
	}
	return foundHit;
}

//Given a ray, returns the shaded color where the ray intersects a sphere.
//If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		//Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	//This is the reflection ray
			HitInfo h;	//Reflection hit info
			

			r.pos=hit.position;
			r.dir=reflect(-view,  hit.normal);

			//Check if the reflection ray hit an object
			if ( IntersectRay( h, r ) ) {

				//Update the view direction for the new surface
				view = normalize(-r.dir);

				//Shade the new surface and update k_s 
				clr += k_s * Shade(h.mtl, h.position, h.normal, view);
				k_s = k_s * h.mtl.k_s;

				//Continue to bounce starting from the new surface
				hit=h;

			} else {
				//The reflection ray did not intersect with anything,
				//So we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	//No more reflections
			}
		}
		return vec4( clr, 1 );	//Return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	//Return the environment color
	}
}
`;