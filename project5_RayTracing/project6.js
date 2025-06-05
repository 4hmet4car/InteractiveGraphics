var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
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

bool IntersectRay( inout HitInfo hit, Ray ray );

// Define bias to prevent self shadowing
const float eps = 1e-5;

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) {

		vec3 Ldir    = normalize( lights[i].position - position );
		
		Ray shadowRay;
		shadowRay.pos = position;
		shadowRay.dir = Ldir;

		HitInfo shadowHit;
		if ( IntersectRay(shadowHit, shadowRay) ) {
			continue;
		}

		vec3 V = normalize(view);
		vec3 H = normalize(Ldir + V);
		
		float diff = max(dot(normal, Ldir), 0.0);
		float spec = (diff > 0.0) ? pow(max(dot(normal, H), 0.0), mtl.n) : 0.0;
		
		vec3 baseColor = mtl.k_d * lights[i].intensity * diff;
		vec3 specular = mtl.k_s * lights[i].intensity * spec;

		color += baseColor + specular;
	}
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	hit.t = 1e30;
	bool foundHit = false;

	for ( int i = 0; i < NUM_SPHERES; ++i ) {
		vec3 pc = ray.pos - spheres[i].center;
		float a = dot( ray.dir, ray.dir );
		float b = 2.0 * dot( ray.dir, pc );
		float c = dot( pc, pc ) - spheres[i].radius * spheres[i].radius;
		float disc = b * b - 4.0 * a * c;

		if ( disc > 0.0 ) {
			float sqrtd = sqrt( disc );
			float t = ( -b - sqrtd ) / (2.0 * a);
			
			if ( t > eps && t < hit.t ) {
				hit.t = t;
				hit.position = ray.pos + ray.dir * t;
				hit.normal = normalize( hit.position - spheres[i].center );
				hit.mtl = spheres[i].mtl;
				foundHit = true;
			}
		}
	}

	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );

		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;

			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info

			r.pos = hit.position;
			r.dir = reflect(ray.dir, hit.normal);

			if ( IntersectRay( h, r ) ) {
				
				view = normalize(-r.dir);
				vec3 reflectionColor = Shade(h.mtl, h.position, h.normal, view);
				clr += k_s * reflectionColor;
				
				k_s *= h.mtl.k_s;
				ray = r;
				hit = h;
			} else {
				// The refleciton ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
	}
}
`;