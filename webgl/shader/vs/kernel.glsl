uniform vec2 texelsize;
uniform vec2 offset;
uniform vec2 scale;

attribute vec4 vertex;

varying vec2 tc_ul;
varying vec2 tc_uc;
varying vec2 tc_ur;
varying vec2 tc_cl;
varying vec2 tc;
varying vec2 tc_cr;
varying vec2 tc_dl;
varying vec2 tc_dc;
varying vec2 tc_dr;

void main()
{
	vec4 pos = vertex;

	tc = pos.xy;

	tc_ul = tc + vec2(-1.0, 1.0) * texelsize;
	tc_uc = tc + vec2(0.0, 1.0) * texelsize;
	tc_ur = tc + vec2(1.0, 1.0) * texelsize;

	tc_cl = tc + vec2(-1.0, 0.0) * texelsize;
	tc_cr = tc + vec2(1.0, 0.0) * texelsize;

	tc_dl = tc + vec2(-1.0, -1.0) * texelsize;
	tc_dc = tc + vec2(0.0, -1.0) * texelsize;
	tc_dr = tc + vec2(1.0, -1.0) * texelsize;

	pos.xy = pos.xy * scale + offset;
	gl_Position = pos;
}
