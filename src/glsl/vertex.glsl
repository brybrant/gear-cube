varying vec3 vViewPosition;

#include <common>
#include <batching_pars_vertex>
#include <normal_pars_vertex>

void main() {
	#include <batching_vertex>

  // For Rim Effect
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  #include <normal_vertex>

	#include <begin_vertex>
	#include <project_vertex>

  vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
}