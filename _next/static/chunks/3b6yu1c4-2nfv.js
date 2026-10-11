(()=>{"use strict";(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,81308,e=>{var t=e.i(71645);e.s(["default",0,function(){return(0,t.useEffect)(()=>{let e=window.matchMedia("(prefers-reduced-motion: reduce)").matches,t=t=>{if(!(!t.open||t.hasAttribute("data-closing"))){if(e)return t.close();t.setAttribute("data-closing",""),window.setTimeout(()=>{t.close(),t.removeAttribute("data-closing")},240)}},r=e=>{let r=e.target,a=r.closest("[data-dialog-open]");if(a){let t=document.getElementById(a.dataset.dialogOpen);t instanceof HTMLDialogElement&&(e.preventDefault(),t.showModal(),t.scrollTop=0);return}let o=r.closest("[data-dialog-close]"),i=o?.closest("dialog")??(r instanceof HTMLDialogElement?r:null);i&&t(i)},a=e=>{e.target instanceof HTMLDialogElement&&(e.preventDefault(),t(e.target))};return document.addEventListener("click",r),document.addEventListener("cancel",a,!0),()=>{document.removeEventListener("click",r),document.removeEventListener("cancel",a,!0)}},[]),null}])},22834,e=>{var t=e.i(71645);e.s(["default",0,function(){return(0,t.useEffect)(()=>{document.documentElement.classList.add("anim-ready");let e=new IntersectionObserver(t=>{for(let r of t)r.isIntersecting&&(r.target.classList.add("is-in"),e.unobserve(r.target))},{rootMargin:"0px 0px -12% 0px",threshold:.12});document.querySelectorAll("[data-anim]").forEach(t=>e.observe(t));let t=window.matchMedia("(hover: hover) and (pointer: fine)").matches,r=window.matchMedia("(prefers-reduced-motion: reduce)").matches,a=null,o=()=>{a&&(a.style.setProperty("--mx","0px"),a.style.setProperty("--my","0px"),a=null)},i=e=>{let t=e.target.closest("[data-magnetic]");if(t!==a&&o(),!t)return;a=t;let r=t.querySelector(".circle")?.getBoundingClientRect();if(!r)return;let i=e.clientX-(r.left+r.width/2),n=e.clientY-(r.top+r.height/2),l=e=>Math.max(-10,Math.min(10,.32*e));t.style.setProperty("--mx",`${l(i).toFixed(1)}px`),t.style.setProperty("--my",`${l(n).toFixed(1)}px`)};return t&&!r&&(document.addEventListener("pointermove",i,{passive:!0}),document.addEventListener("pointerleave",o)),()=>{e.disconnect(),document.removeEventListener("pointermove",i),document.removeEventListener("pointerleave",o)}},[]),null}])},37517,e=>{var t=e.i(71645);let r=`
precision highp float;
uniform vec2 uRes;uniform float uTime;uniform float uScroll;uniform vec2 uCenter;uniform float uScale;uniform float uMode;uniform float uInt;
uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uC3;
vec3 pal(float h){h=fract(h)*3.0;vec3 c=mix(uC1,uC2,smoothstep(0.0,1.0,h));c=mix(c,uC3,smoothstep(1.0,2.0,h));return mix(c,uC1,smoothstep(2.0,3.0,h));}
vec3 ribbon(float a,float x,float W,float tw,float ph,float aa,float hue){
  float th=a*tw+ph;float c=cos(th);float w=W*abs(c)+0.0035;float s=x/w;
  float m=1.0-smoothstep(1.0-aa/w,1.0,abs(s));
  if(m<=0.0)return vec3(0.0);
  float side=c>=0.0?1.0:-1.0;
  float f=sqrt(max(0.0,1.0-s*s));
  float edge=pow(1.0-abs(c),4.0);
  vec3 base=pal(hue+a*0.42+s*0.08*side+(side<0.0?0.22:0.0));
  float rim=pow(abs(s),14.0);
  float spec=exp(-pow((s-0.5*sin(th+0.9)*side)*8.0,2.0));
  float spec2=exp(-pow((s+0.72*cos(th*1.3))*16.0,2.0));
  float caus=exp(-pow((s+0.4*cos(th*1.6+a))*2.6,2.0));
  vec3 col=base*(0.05+0.11*f)+base*caus*0.20;
  col+=mix(base,vec3(1.0),0.55)*spec*1.05+mix(base,vec3(1.0),0.7)*spec2*0.55;
  col+=mix(base,vec3(1.0),0.35)*rim*1.5;
  col*=side>0.0?1.0:0.65;
  col+=mix(base,vec3(1.0),0.45)*edge*1.3;
  return col*m;
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 p=(gl_FragCoord.xy-0.5*uRes)/uRes.y;
  p=(p-uCenter)/uScale;
  float aa=1.6/(uRes.y*uScale);
  float t=uTime;float sc=uScroll;
  vec3 col=vec3(0.0);float g=0.0;float a=0.0;
  if(uMode<0.5){
    a=p.y;
    float cx=0.10*sin(a*2.8+t*0.28+sc*1.4)+0.045*sin(a*6.1-t*0.40+sc*2.2);
    float x=p.x-cx;
    col+=ribbon(a,x,0.15,3.2,t*0.22+sc*2.4,aa,0.0);
    float cx2=0.14*sin(a*2.2-t*0.20+sc*1.0+1.7)+0.05*sin(a*5.0+t*0.30);
    float x2=p.x-cx2-0.02;
    col+=0.6*ribbon(a+2.0,x2,0.06,4.4,-t*0.18+sc*3.0+2.0,aa,0.33);
    g=exp(-abs(x)*6.5)*0.20+exp(-abs(x2)*12.0)*0.05;
  }else{
    float r=length(p);float an=atan(p.y,p.x);
    float R=0.40+0.035*sin(an*2.0+t*0.25+sc*1.6);
    a=an;
    float x=r-R;
    float fade=smoothstep(-3.0,-1.6,an)*(1.0-smoothstep(1.6,3.0,an));
    col+=ribbon(an*0.9,x,0.11,2.0,t*0.20+sc*2.2,aa,0.1)*fade;
    float x2=r-R*0.86;
    col+=0.45*ribbon(an*0.9+1.5,x2,0.045,3.1,-t*0.17+sc*2.8,aa,0.45)*fade;
    g=exp(-abs(x)*7.0)*0.16*fade;
  }
  col+=pal(a*0.22+0.12)*g;
  col*=uInt;
  col=1.0-exp(-col*1.4);
  col*=smoothstep(0.0,0.16,uv.y)*smoothstep(0.0,0.2,1.0-uv.y);
  float al=clamp(max(col.r,max(col.g,col.b))*1.15,0.0,1.0);
  gl_FragColor=vec4(col,al);
}`,a=["uRes","uTime","uScroll","uCenter","uScale","uMode","uInt","uC1","uC2","uC3"],o=(e,t,r)=>{let a=Math.min(1,Math.max(0,(r-e)/(t-e)));return a*a*(3-2*a)},i={wide:{dist:15,elev:4,roll:-9,fov:30,shift:[-2.3,.04]},tall:{dist:15,elev:7,roll:22,fov:34,shift:[-.62,-.85]}},n={wide:[.5,.35,.96,.5],tall:[.12,.5,.95,.88]},l=`#version 300 es
layout(location=0) in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`,s=`#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec3 uCam;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uFwd;
uniform float uTan;
uniform vec2 uShift;
uniform float uMargin;
uniform float uRin;
uniform float uRout;
// Angles are stored as cos/sin so the map can be filtered smoothly (no wrap seam).
layout(location=0) out vec4 oHit1;   // r, cos phi, sin phi, D   (direct image)
layout(location=1) out vec4 oHit2;   // r, cos phi, sin phi, D   (lensed image)
layout(location=2) out vec4 oInfo;   // closest approach (negative if captured), hits
void main() {
  vec2 uv = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
  uv *= uMargin;
  uv.x *= uRes.x / uRes.y;
  uv += uShift;
  vec3 v = normalize(uFwd + (uRight * uv.x + uUp * uv.y) * uTan);
  vec3 p = uCam;
  vec3 c = cross(p, v);
  float h2 = dot(c, c);
  vec4 h1 = vec4(-1.0, 1.0, 0.0, 0.0);
  vec4 h2v = vec4(-1.0, 1.0, 0.0, 0.0);
  float rmin = 1e4;
  float n = 0.0;
  float haze = 0.0;
  bool captured = false;
  for (int i = 0; i < 420; i++) {
    float r = length(p);
    rmin = min(rmin, r);
    if (r < 1.0) { captured = true; break; }
    if (r > 45.0 && dot(p, v) > 0.0) break;
    float dt = clamp(0.045 * r * r / (r + 3.0), 0.012, 0.9);
    vec3 a = -1.5 * h2 * p / pow(r, 5.0);
    vec3 pp = p;
    v += a * dt;
    p += v * dt;
    // The disk has thickness: gather the faint glow of gas just above and below its
    // plane, so it never collapses to a razor line when seen edge-on.
    float rh = length(p.xz);
    if (rh > uRin && rh < uRout) haze += exp(-abs(p.y) / 0.16) * pow(uRin / rh, 2.0) * smoothstep(uRout, uRout * 0.4, rh) * dt;
    if (pp.y * p.y < 0.0) {
      vec3 q = mix(pp, p, pp.y / (pp.y - p.y));
      float rq = length(q.xz);
      if (rq > uRin && rq < uRout) {
        // Keplerian gas (r_s = 1  ⇒  v = sqrt(0.5 / r)), Doppler + gravitational shift.
        float beta = min(sqrt(0.5 / rq), 0.7);
        vec3 orbit = normalize(vec3(-q.z, 0.0, q.x)); // the visible side approaches: brighter, blue-shifted
        float cosT = dot(orbit, -normalize(v));
        float gam = inversesqrt(1.0 - beta * beta);
        float D = sqrt(max(1.0 - 1.5 / rq, 0.05)) / (gam * (1.0 - beta * cosT));
        vec4 hit = vec4(rq, q.x / rq, q.z / rq, D);
        if (n < 0.5) h1 = hit; else h2v = hit;
        n += 1.0;
        if (n > 1.5) break;
      }
    }
  }
  oHit1 = h1;
  oHit2 = h2v;
  oInfo = vec4(captured ? -rmin : rmin, n, haze, 0.0);
}`,u=`#version 300 es
precision highp float;
uniform vec2 uRes;
out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 19.19); return fract(p.x * p.y); }
float vnoise(vec2 x, float period) {
  vec2 i = floor(x), f = fract(x);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(mod(i, period));
  float b = hash(mod(i + vec2(1, 0), period));
  float c = hash(mod(i + vec2(0, 1), period));
  float d = hash(mod(i + vec2(1, 1), period));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 uv, float base, int oct) {
  float v = 0.0, a = 0.5, s = 0.0, per = base;
  for (int i = 0; i < 6; i++) {
    if (i >= oct) break;
    v += a * vnoise(uv * per, per);
    s += a; a *= 0.5; per *= 2.0;
  }
  return v / s;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float soft = fbm(uv + 0.37, 4.0, 4);
  float mid = fbm(uv + 0.71, 8.0, 5);
  float ridge = 1.0 - abs(2.0 * fbm(uv + 0.13, 16.0, 5) - 1.0);
  float fine = 1.0 - abs(2.0 * fbm(uv + 0.53, 32.0, 4) - 1.0);
  o = vec4(soft, mid, ridge, fine);
}`,f=`#version 300 es
precision highp float;
uniform vec2 uRes;
uniform sampler2D uHit1;
uniform sampler2D uHit2;
uniform sampler2D uInfo;
uniform sampler2D uNoise;
uniform float uTime;
uniform float uMirror;
uniform float uMargin;
uniform vec2 uAnchor;    // hole position in map uv
uniform float uZoom;     // < 1 recedes
uniform vec2 uDrift;
uniform float uDetail;   // 1 crisp filaments, 0 soft haze
uniform float uIntensity;
uniform float uClearSide;
uniform float uTall;
uniform float uRin;
uniform float uRout;
uniform float uHole;     // visibility of the black hole
uniform float uAurora;   // strength of the aurora that takes over below the hero
uniform float uShape;    // scroll-driven shape of the aurora
uniform float uMorph;    // 0 = aurora lies along the hole's horizon, 1 = free aurora
uniform vec4 uLine;      // the hole's horizon: disk point (xy) to hole side (zw), centred units
uniform float uAuroraGain;
uniform float uRoll;
uniform float uAspect;
out vec4 outColor;

const vec3 TEAL = vec3(0.30, 0.98, 0.86);
const vec3 CYAN = vec3(0.55, 0.92, 1.0);
const vec3 BLUE = vec3(0.24, 0.48, 1.0);
const vec3 VIOLET = vec3(0.55, 0.36, 1.0);

float flowNoise(float r, float phi, float phase, float bias) {
  // Keplerian shear: inner rings move faster. Coordinates wrap seamlessly in phi.
  float omega = 2.4 * pow(r, -1.5);
  float u = phi / 6.2831853 - omega * phase;
  float v = log(r) * 1.35;
  // Streams of gas, long along the orbit: broad, soft bands with gentler filaments
  // inside them, so the light reads as one flowing body rather than separate lines.
  float b = bias + 0.9;
  float soft = texture(uNoise, vec2(u * 1.0, v * 0.8), b).r;
  float mid = texture(uNoise, vec2(u * 1.0 + 0.4, v * 1.7 + 0.3), b).g;
  float ridge = texture(uNoise, vec2(u * 1.0 + 0.11, v * 2.6), b).b;
  float fine = texture(uNoise, vec2(u * 2.0 - 0.27, v * 4.0), b + 0.4).a;
  float filaments = pow(ridge, 2.2) * 0.75 + pow(fine, 3.0) * 0.25;
  // Clumps of brighter gas travelling round with the flow.
  float knots = texture(uNoise, vec2(u * 6.0 + 0.5, v * 1.3 - 0.2), b).g;
  float clump = 0.6 + 0.8 * smoothstep(0.38, 0.8, knots);
  return (soft * 0.55 + mid * 0.4 + filaments * mix(0.35, 1.0, uDetail)) * clump;
}

vec4 disk(float r, float phi, float D) {
  // Two phases cross-faded, so the shear never winds the pattern up over time.
  float cycle = 30.0;
  float t1 = fract(uTime / cycle), t2 = fract(uTime / cycle + 0.5);
  float w = abs(t1 * 2.0 - 1.0);
  float bias = (1.0 - uDetail) * 2.5;
  float n = mix(flowNoise(r, phi, t1 * cycle * 0.11, bias), flowNoise(r, phi + 1.7, t2 * cycle * 0.11, bias), w);
  float profile = smoothstep(uRin, uRin + 1.3, r) * pow(uRin / r, 1.8) * (1.0 - smoothstep(uRout * 0.22, uRout * 0.95, r));
  float beam = D * D * D;
  // Bright filaments over a faint haze of the same gas.
  float I = profile * (0.04 + 0.35 * n + 1.25 * n * n * n) * beam;
  // Hotter (whiter, cyan) inside and on the approaching side; violet outside and receding.
  vec3 col = mix(VIOLET, BLUE, smoothstep(uRout * 0.75, uRout * 0.35, r));
  col = mix(col, CYAN, smoothstep(6.5, 3.2, r) * 0.85);
  col = mix(col, TEAL, clamp((D - 1.0) * 1.6, 0.0, 1.0) * 0.7);
  col = mix(col, VIOLET, clamp((1.0 - D) * 1.8, 0.0, 1.0) * 0.75);
  col = mix(col, vec3(0.9, 0.98, 1.0), smoothstep(1.2, 3.2, I) * 0.45);
  return vec4(col * I, clamp(I * 1.4, 0.0, 1.0));
}

// The original aurora (from the globe version), ported as it was: curtains of rays
// above a wandering base line, gathered in patches, folding and drifting slowly.
float ahash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float anoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(ahash(i), ahash(i + vec2(1, 0)), u.x), mix(ahash(i + vec2(0, 1)), ahash(i + vec2(1, 1)), u.x), u.y);
}
float afbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * anoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}
vec3 aurPal(float h) {
  vec3 a = vec3(0.16, 0.95, 0.72), b = vec3(0.24, 0.62, 1.0), c = vec3(0.64, 0.46, 1.0);
  return h < 0.5 ? mix(a, b, h * 2.0) : mix(b, c, (h - 0.5) * 2.0);
}
vec3 curtain(float s, float h, float t, float hue, float height) {
  if (h < -0.04 || h > height * 4.0) return vec3(0.0);
  float n = afbm(vec2(s * 5.0 + t * 0.05, h * 1.1 - t * 0.07));
  float clump = smoothstep(0.32, 0.72, afbm(vec2(s * 1.3 + t * 0.025, 3.7)));
  float rays = afbm(vec2(s * 20.0 + n * 3.2 + t * 0.08, h * 0.9));
  float folds = 0.5 + 0.5 * sin(s * 3.8 + n * 5.0 + t * 0.15);
  float bottom = smoothstep(-0.035, 0.015, h);
  float fall = exp(-max(h, 0.0) / (height * (0.6 + 0.8 * rays)));
  float k = bottom * fall * (0.15 + 0.85 * clump) * (0.3 + 0.9 * rays * rays) * (0.4 + 0.6 * folds);
  vec3 col = aurPal(clamp(hue + h / height * 0.3 + (n - 0.5) * 0.3, 0.0, 1.0)) * k;
  col += vec3(0.45, 1.0, 0.85) * exp(-abs(h) * 70.0) * 0.25 * folds;
  return col;
}
// The aurora's base line starts as the black hole's own light horizon (a straight
// line from the disk's point to the hole) and bends into the free, wandering line.
vec3 aurora(vec2 p, float sx) {
  float t = uTime;
  float x = p.x;
  float baseFree = -0.2 + 0.13 * sin(x * 1.5 + uShape * 1.3 + t * 0.05) + 0.06 * sin(x * 3.4 - uShape * 0.8 + t * 0.07);
  float slope = (uLine.w - uLine.y) / (uLine.z - uLine.x);
  float baseHole = uLine.y + (x - uLine.x) * slope;
  float base = mix(baseHole, baseFree, uMorph);
  float height = mix(0.045, 0.3, uMorph);
  float reach = mix(smoothstep(uLine.x - 0.06, uLine.x + 0.3, x), 1.0, uMorph);
  float hueX = clamp((sx - 0.3) / 0.65, 0.0, 1.0);
  return curtain(x * 0.75 + uShape * 0.15, p.y - base, t, clamp(hueX + 0.15 * sin(uShape * 0.7), 0.0, 1.0), height) * reach;
}

void main() {
  vec2 s = gl_FragCoord.xy / uRes;
  if (uMirror < 0.0) s.x = 1.0 - s.x;
  vec2 m = 0.5 + (s - 0.5) / uMargin;
  m = uAnchor + (m - uAnchor) / uZoom + uDrift;
  float inside = smoothstep(0.0, 0.16, m.x) * smoothstep(1.0, 0.84, m.x) * smoothstep(0.0, 0.16, m.y) * smoothstep(1.0, 0.84, m.y);
  vec4 A = texture(uHit1, m);
  vec4 B = texture(uHit2, m);
  vec4 F = texture(uInfo, m);

  vec3 col = vec3(0.0);
  float cover = 0.0;
  if (uHole > 0.001 && A.x > 0.0) {
    vec4 d = disk(A.x, atan(A.z, A.y), A.w);
    col += d.rgb;
    cover = d.a;
  }
  if (uHole > 0.001 && B.x > 0.0) {
    vec4 d = disk(B.x, atan(B.z, B.y), B.w);
    col += d.rgb * (1.0 - cover) * 0.9;
  }
  col += mix(BLUE, CYAN, 0.35) * F.z * 0.22;
  // Rays that skim the photon sphere squeeze the disk into hairline rings round the
  // shadow, too thin to draw cleanly: let them melt into the dark instead.
  float rmin = abs(F.x);
  col *= smoothstep(1.62, 2.5, rmin);
  // Photon ring: a soft glow only.
  // (Blending across the shadow's edge can yield values below the photon sphere;
  // only true escaping rays count, and the glow is clamped.)
  if (F.x > 1.5) {
    vec2 toHole = m - uAnchor;
    float side = smoothstep(-0.15, 0.7, -toHole.x / max(length(toHole), 1e-4));
    // A soft glow where light skims the photon sphere; no hard ring line.
    float skim = max(rmin - 1.5, 0.0);
    col += CYAN * exp(-skim * 3.2) * (0.02 + 0.1 * side) * smoothstep(1.5, 1.6, rmin);
    col += BLUE * exp(-skim * 1.4) * 0.03 * smoothstep(1.5, 1.6, rmin);
  }
  // Palette by arm: the upper arm (light lensed over the hole) runs cyan-teal,
  // the lower arm violet, meeting in blue at the point of the disk.
  // Measured across the band (the view is rolled), so the split follows its tilt.
  vec2 rel = vec2((m.x - uAnchor.x) * uAspect, m.y - uAnchor.y);
  float across = rel.y * cos(uRoll) + rel.x * sin(uRoll);
  float arm = smoothstep(-0.14, 0.2, across);
  // The far tail thins out gradually with distance from the hole, so the light
  // dissolves into the dark instead of ending where the disk's geometry stops.
  col *= 1.0 - smoothstep(0.4, 0.98, length(rel));
  float lum = max(col.r, max(col.g, col.b));
  vec3 tint = mix(mix(VIOLET, BLUE, smoothstep(0.0, 0.5, arm)), mix(BLUE, TEAL, 0.6), smoothstep(0.5, 1.0, arm));
  col = mix(col, tint * lum * 1.1, 0.55);
  // Keep the headline's side in near-darkness: the reading-start side on wide
  // screens, the bottom on tall ones (where the hero text sits on phones).
  float side = uTall > 0.5 ? smoothstep(0.22, 0.66, s.y) : 1.0;
  float clear = mix(1.0, side, uClearSide);
  col *= uIntensity * inside * clear * uHole;
  if (uAurora * uAuroraGain > 0.001) {
    vec2 pa = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    float sx = gl_FragCoord.x / uRes.x;
    if (uMirror < 0.0) { pa.x = -pa.x; sx = 1.0 - sx; }
    col += aurora(pa, sx) * uAurora * uAuroraGain;
  }
  col = 1.0 - exp(-col * 1.15);
  float a = clamp(max(col.r, max(col.g, col.b)) * 1.15, 0.0, 1.0);
  outColor = vec4(col, a);
}`,c=`#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uStep;
uniform vec2 uRes;
out vec4 o;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec4 c = texture(uTex, uv) * 0.2270270;
  c += (texture(uTex, uv + uStep * 1.3846154) + texture(uTex, uv - uStep * 1.3846154)) * 0.3162162;
  c += (texture(uTex, uv + uStep * 3.2307692) + texture(uTex, uv - uStep * 3.2307692)) * 0.0702703;
  o = c;
}`,d=`#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uStrength;
out vec4 o;
void main() {
  vec4 c = texture(uTex, gl_FragCoord.xy / uRes) * uStrength;
  o = vec4(c.rgb, max(c.r, max(c.g, c.b)));
}`;function m(e,t,r){let a=e.createShader(t);if(e.shaderSource(a,r),e.compileShader(a),!e.getShaderParameter(a,e.COMPILE_STATUS))throw Error(e.getShaderInfoLog(a)??"shader");return a}function h(e,t,r){let a=e.createProgram();if(e.attachShader(a,m(e,e.VERTEX_SHADER,l)),e.attachShader(a,m(e,e.FRAGMENT_SHADER,t)),e.linkProgram(a),!e.getProgramParameter(a,e.LINK_STATUS))throw Error(e.getProgramInfoLog(a)??"link");return{p:a,u:Object.fromEntries(r.map(t=>[t,e.getUniformLocation(a,t)]))}}let p=(e,t)=>[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]],g=e=>{let t=Math.hypot(e[0],e[1],e[2])||1;return[e[0]/t,e[1]/t,e[2]/t]},v=e=>e<0?0:e>1?1:e,b=(e,t,r)=>{let a=v((r-e)/(t-e));return a*a*(3-2*a)},x=(e,t,r)=>e+(t-e)*r,w=e=>{let t=0;for(;e;)t+=e.offsetTop,e=e.offsetParent;return t};e.s(["default",0,function(){return(0,t.useEffect)(()=>{let e=document.querySelector("[data-root]");if(!e)return;let t=t=>Array.from(e.querySelectorAll(t)),l=window.matchMedia("(prefers-reduced-motion: reduce)").matches,m="rtl"===document.documentElement.dir?-1:1,y="ontouchstart"in window,E=document.querySelector("[data-nav]"),R=Array.from(document.querySelectorAll(".nav__link")),T="",A=!1,_=window.scrollY,M=e.querySelector("[data-hero-text]"),S=e.querySelector("[data-stack]"),F=e.querySelector("[data-laptop]"),C=e.querySelector("[data-hrail]"),L=e.querySelector("[data-hrail-track]"),P=t("[data-pcard]").map(e=>({el:e,body:e.firstElementChild,c:0,w:1})),O=e.querySelector("[data-hrail-index]"),I=e.querySelector("[data-hrail-bar]"),D=0,U=0,j=1,k=0,N=1,B=1,z=-1,H=t("[data-plate]").map(e=>({el:e,step:Number(e.dataset.plate),glow:e.querySelector("[data-glow]")})),q=t("[data-step]"),$=t("[data-stepbar]"),X=window.innerWidth>=900,G=window.innerHeight,W=null,V=0,Y=0,K=[],Z=!0,J=null,Q=null,ee=e.querySelector("canvas[data-arc]");if(ee)try{(Q=function(e){let t=e.getContext("webgl",{alpha:!0,premultipliedAlpha:!0,antialias:!0,depth:!1,stencil:!1});if(!t)return null;let o=(e,r)=>{let a=t.createShader(e);if(t.shaderSource(a,r),t.compileShader(a),!t.getShaderParameter(a,t.COMPILE_STATUS))throw Error(t.getShaderInfoLog(a)??"shader");return a},i=t.createProgram();if(t.attachShader(i,o(t.VERTEX_SHADER,"attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}")),t.attachShader(i,o(t.FRAGMENT_SHADER,r)),t.linkProgram(i),!t.getProgramParameter(i,t.LINK_STATUS))throw Error(t.getProgramInfoLog(i)??"link");t.useProgram(i),t.bindBuffer(t.ARRAY_BUFFER,t.createBuffer()),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),t.STATIC_DRAW);let n=t.getAttribLocation(i,"p");t.enableVertexAttribArray(n),t.vertexAttribPointer(n,2,t.FLOAT,!1,0,0);let l=Object.fromEntries(a.map(e=>[e,t.getUniformLocation(i,e)])),s=1,u=!0,f=new IntersectionObserver(e=>u=e[e.length-1].isIntersecting,{rootMargin:"120px 0px"});return f.observe(e),{get visible(){return u},resize(r,a){let o=e.clientWidth,i=e.clientHeight,n=Math.max(1,o*i),l=Math.min(window.devicePixelRatio||1,r?2:1.75);n*l*l>45e5&&(l=Math.sqrt(45e5/n)),e.width=Math.max(2,Math.round(o*(l*=a))),e.height=Math.max(2,Math.round(i*l)),t.viewport(0,0,e.width,e.height),s=o/Math.max(1,i)},draw(r,a,o,n){let[u,f,c]=o?[.5*s*.62,-.02,1.05]:[.5*s*.6,.26,.62];t.useProgram(i),t.uniform2f(l.uRes,e.width,e.height),t.uniform1f(l.uTime,r%2e3),t.uniform1f(l.uScroll,a),t.uniform2f(l.uCenter,u*n,f),t.uniform1f(l.uScale,c),t.uniform1f(l.uMode,1),t.uniform1f(l.uInt,1),t.uniform3f(l.uC1,.1,.92,.8),t.uniform3f(l.uC2,.3,.7,1),t.uniform3f(l.uC3,.62,.48,1),t.drawArrays(t.TRIANGLES,0,3)},dispose(){f.disconnect()}}}(ee))?requestAnimationFrame(()=>ee.classList.add("is-ready")):ee.style.display="none"}catch(e){console.warn("arc",e),ee.style.display="none"}let et=!0,er=null,ea=e.querySelector("canvas[data-sky]");if(ea)try{(er=function(e,t){let r=e.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1});if(!r||!r.getExtension("EXT_color_buffer_float"))return null;let a=h(r,s,["uRes","uCam","uRight","uUp","uFwd","uTan","uShift","uMargin","uRin","uRout"]),l=h(r,u,["uRes"]),m=h(r,c,["uTex","uStep","uRes"]),v=h(r,d,["uTex","uRes","uStrength"]),b=h(r,f,["uRes","uHit1","uHit2","uInfo","uNoise","uTime","uMirror","uMargin","uAnchor","uZoom","uDrift","uDetail","uIntensity","uClearSide","uTall","uHole","uAurora","uShape","uAspect","uMorph","uLine","uAuroraGain","uRoll","uRin","uRout"]),x=r.createVertexArray();r.bindVertexArray(x),r.bindBuffer(r.ARRAY_BUFFER,r.createBuffer()),r.bufferData(r.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),r.STATIC_DRAW),r.enableVertexAttribArray(0),r.vertexAttribPointer(0,2,r.FLOAT,!1,0,0);let w=(e,t,a,o,i,n,l)=>{let s=r.createTexture();return r.bindTexture(r.TEXTURE_2D,s),r.texImage2D(r.TEXTURE_2D,0,a,e,t,0,o,i,null),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,n),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MAG_FILTER,n===r.LINEAR_MIPMAP_LINEAR?r.LINEAR:n),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_S,l),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_T,l),s},y=w(512,512,r.RGBA8,r.RGBA,r.UNSIGNED_BYTE,r.LINEAR_MIPMAP_LINEAR,r.REPEAT);{let e=r.createFramebuffer();r.bindFramebuffer(r.FRAMEBUFFER,e),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,y,0),r.viewport(0,0,512,512),r.useProgram(l.p),r.uniform2f(l.u.uRes,512,512),r.drawArrays(r.TRIANGLES,0,3),r.bindFramebuffer(r.FRAMEBUFFER,null),r.deleteFramebuffer(e),r.bindTexture(r.TEXTURE_2D,y),r.generateMipmap(r.TEXTURE_2D)}let E=0,R=0,T=null,A=null,_=null,M=null,S=0,F=[.5,.5],C=!1,L=0,P=0,O=[null,null],I=[null,null],D=1;return{get ready(){return null!==M&&S>=R},resize:a=>{D=a;let o=Math.min(window.devicePixelRatio||1,1.5)*D,n=Math.max(2,Math.round(e.clientWidth*o)),l=Math.max(2,Math.round(e.clientHeight*o));if(e.width!==n||e.height!==l||!M){let a,o,s,u,f;e.width=n,e.height=l,a=e.width,C=(o=e.height)>1.05*a,E=Math.max(16,Math.round(1.35*a*(s=t.mobile?.62:.72))),R=Math.max(16,Math.round(1.35*o*s)),[T,A,_].forEach(e=>e&&r.deleteTexture(e)),M&&r.deleteFramebuffer(M),T=(u=()=>w(E,R,r.RGBA16F,r.RGBA,r.HALF_FLOAT,r.LINEAR,r.CLAMP_TO_EDGE))(),A=u(),_=u(),M=r.createFramebuffer(),r.bindFramebuffer(r.FRAMEBUFFER,M),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,T,0),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT1,r.TEXTURE_2D,A,0),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT2,r.TEXTURE_2D,_,0),r.drawBuffers([r.COLOR_ATTACHMENT0,r.COLOR_ATTACHMENT1,r.COLOR_ATTACHMENT2]),r.clearBufferfv(r.COLOR,0,[-1,1,0,0]),r.clearBufferfv(r.COLOR,1,[-1,1,0,0]),r.clearBufferfv(r.COLOR,2,[100,0,0,0]),r.bindFramebuffer(r.FRAMEBUFFER,null),S=0,F=[.5+-(f=i[C?"tall":"wide"]).shift[0]/(a/o*1.35)*.5,.5+-f.shift[1]/1.35*.5],L=Math.max(8,Math.round(e.width/4)),P=Math.max(8,Math.round(e.height/4));for(let e=0;e<2;e++)O[e]&&r.deleteTexture(O[e]),I[e]&&r.deleteFramebuffer(I[e]),O[e]=w(L,P,r.RGBA16F,r.RGBA,r.HALF_FLOAT,r.LINEAR,r.CLAMP_TO_EDGE),I[e]=r.createFramebuffer(),r.bindFramebuffer(r.FRAMEBUFFER,I[e]),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,O[e],0);r.bindFramebuffer(r.FRAMEBUFFER,null)}},draw(l){if(S<R&&(()=>{let e,o,n,l,s,u,f,c,d,m,h;if(!M||S>=R)return;let v=Math.max(8,Math.ceil(R/(t.mobile?10:7))),b=i[C?"tall":"wide"],w=(l=g((o=[0,Math.sin(e=b.elev*Math.PI/180)*b.dist,-Math.cos(e)*b.dist],[(n=[0,0,0])[0]-o[0],n[1]-o[1],n[2]-o[2]])),s=g(p([0,1,0],l)),u=p(l,s),c=Math.cos(f=b.roll*Math.PI/180),d=Math.sin(f),m=[s[0]*c+u[0]*d,s[1]*c+u[1]*d,s[2]*c+u[2]*d],h=[u[0]*c-s[0]*d,u[1]*c-s[1]*d,u[2]*c-s[2]*d],{cam:o,fwd:l,right:s=m,up:u=h,tan:Math.tan(b.fov*Math.PI/360)});r.bindFramebuffer(r.FRAMEBUFFER,M),r.drawBuffers([r.COLOR_ATTACHMENT0,r.COLOR_ATTACHMENT1,r.COLOR_ATTACHMENT2]),r.viewport(0,0,E,R),r.enable(r.SCISSOR_TEST),r.scissor(0,S,E,v),r.disable(r.BLEND),r.useProgram(a.p),r.uniform2f(a.u.uRes,E,R),r.uniform3fv(a.u.uCam,w.cam),r.uniform3fv(a.u.uRight,w.right),r.uniform3fv(a.u.uUp,w.up),r.uniform3fv(a.u.uFwd,w.fwd),r.uniform1f(a.u.uTan,w.tan),r.uniform2f(a.u.uShift,b.shift[0],b.shift[1]),r.uniform1f(a.u.uMargin,1.35),r.uniform1f(a.u.uRin,2.4),r.uniform1f(a.u.uRout,11),r.bindVertexArray(x),r.drawArrays(r.TRIANGLES,0,3),r.disable(r.SCISSOR_TEST),r.bindFramebuffer(r.FRAMEBUFFER,null),S+=v})(),r.bindFramebuffer(r.FRAMEBUFFER,null),r.viewport(0,0,e.width,e.height),r.clearColor(0,0,0,0),r.clear(r.COLOR_BUFFER_BIT),S<R)return;let s=1-l.presence;r.bindVertexArray(x);let u=(t,a,u)=>{r.useProgram(b.p),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,T),r.activeTexture(r.TEXTURE1),r.bindTexture(r.TEXTURE_2D,A),r.activeTexture(r.TEXTURE2),r.bindTexture(r.TEXTURE_2D,_),r.activeTexture(r.TEXTURE3),r.bindTexture(r.TEXTURE_2D,y),r.uniform1i(b.u.uHit1,0),r.uniform1i(b.u.uHit2,1),r.uniform1i(b.u.uInfo,2),r.uniform1i(b.u.uNoise,3),r.uniform2f(b.u.uRes,t,a),r.uniform1f(b.u.uTime,l.time),r.uniform1f(b.u.uMirror,l.mirror),r.uniform1f(b.u.uMargin,1.35),r.uniform2f(b.u.uAnchor,F[0],F[1]),r.uniform1f(b.u.uZoom,1),r.uniform2f(b.u.uDrift,0,0),r.uniform1f(b.u.uDetail,1-.7*s),r.uniform1f(b.u.uIntensity,l.intensity),r.uniform1f(b.u.uClearSide,l.presence),r.uniform1f(b.u.uTall,+!!C),r.uniform1f(b.u.uHole,o(.12,.72,l.presence)),r.uniform1f(b.u.uAurora,o(.04,.4,s)*l.aurora*(1+2.4*(1-o(.45,1,s)))),r.uniform1f(b.u.uMorph,o(.32,.96,s)),r.uniform1f(b.u.uAuroraGain,u),r.uniform1f(b.u.uRoll,i[C?"tall":"wide"].roll*Math.PI/180),r.uniform1f(b.u.uShape,l.shape),r.uniform1f(b.u.uAspect,e.width/e.height);let f=e.width/e.height,c=n[C?"tall":"wide"];r.uniform4f(b.u.uLine,(c[0]-.5)*f,c[1]-.5,(c[2]-.5)*f,c[3]-.5),r.uniform1f(b.u.uRin,2.4),r.uniform1f(b.u.uRout,11),r.drawArrays(r.TRIANGLES,0,3)};for(let e of(r.disable(r.BLEND),r.bindFramebuffer(r.FRAMEBUFFER,I[0]),r.viewport(0,0,L,P),u(L,P,0),r.useProgram(m.p),r.uniform1i(m.u.uTex,0),r.uniform2f(m.u.uRes,L,P),r.activeTexture(r.TEXTURE0),[1,2.2]))r.bindFramebuffer(r.FRAMEBUFFER,I[1]),r.bindTexture(r.TEXTURE_2D,O[0]),r.uniform2f(m.u.uStep,e/L,0),r.drawArrays(r.TRIANGLES,0,3),r.bindFramebuffer(r.FRAMEBUFFER,I[0]),r.bindTexture(r.TEXTURE_2D,O[1]),r.uniform2f(m.u.uStep,0,e/P),r.drawArrays(r.TRIANGLES,0,3);r.bindFramebuffer(r.FRAMEBUFFER,null),r.viewport(0,0,e.width,e.height),r.enable(r.BLEND),r.blendFunc(r.ONE,r.ONE_MINUS_SRC_ALPHA),u(e.width,e.height,1),r.blendFunc(r.ONE,r.ONE),r.useProgram(v.p),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,O[0]),r.uniform1i(v.u.uTex,0),r.uniform2f(v.u.uRes,e.width,e.height),r.uniform1f(v.u.uStrength,.85-.25*s),r.drawArrays(r.TRIANGLES,0,3)},dispose(){[T,A,_,y,...O].forEach(e=>e&&r.deleteTexture(e)),I.forEach(e=>e&&r.deleteFramebuffer(e)),M&&r.deleteFramebuffer(M)}}}(ea,{mobile:window.innerWidth<900||window.matchMedia("(pointer: coarse)").matches}))?requestAnimationFrame(()=>ea.classList.add("is-ready")):ea.style.display="none"}catch(e){console.warn("sky",e),ea.style.display="none"}let eo=!0,ei=-1,en=0,el=1,es=!1,eu=-1,ef=()=>{G=window.innerHeight,X=window.innerWidth>=900;let e=e=>{let t=document.getElementById(e);return t?{top:w(t),h:t.offsetHeight}:{top:0,h:1}};if(W={hero:e("top"),about:e("about"),work:e("work"),certs:e("certificates"),contact:e("contact")},V=Math.max(0,document.documentElement.scrollHeight-G),Y=F?w(F):0,C&&L){L.style.transform="none",B=L.clientWidth||1,P.forEach(e=>{e.w=e.el.offsetWidth||1,e.c=e.el.offsetLeft+e.w/2}),k=parseFloat(getComputedStyle(L).paddingLeft)||0;let e=P.map(e=>e.el.offsetLeft);U=Math.max(0,Math.max(...e.map((e,t)=>e+P[t].w))-Math.min(...e)+2*k-B),N=P[0]?.w??1,j=U;let t=.2*G,r=`${Math.round(j+t+G)}px`;C.style.height!==r&&(C.style.height=r),D=w(C),C.dataset.ready=""}K=t("[data-reveal]").map(e=>({el:e,top:w(e),d:Number(e.dataset.reveal)||0,cert:e.hasAttribute("data-cert"),a:-1})),Q?.resize(X,el),er?.resize(el),Z=et=eo=!0},ec=window.innerWidth,ed=window.innerHeight,em=()=>{let e=window.innerWidth,t=window.innerHeight;y&&e===ec&&160>Math.abs(t-ed)||(ec=e,ed=t,ef())};window.addEventListener("resize",em,{passive:!0});let eh=e=>{let t=P.findIndex(t=>t.el.contains(e.target));t<0||P.length<2||window.scrollTo({top:D+t/(P.length-1)*j,behavior:l?"auto":"smooth"})};L?.addEventListener("focusin",eh);let ep=0,eg=new ResizeObserver(()=>{ep||(ep=requestAnimationFrame(()=>(ep=0,ef())))});eg.observe(e),ef(),document.fonts?.ready.then(ef);let ev=window.setTimeout(ef,700),eb=window.scrollY,ex=null,ew=performance.now(),ey=7,eE=16,eR=0,eT=0,eA=e=>{eT=requestAnimationFrame(eA);let t=Math.min(64,Math.max(0,e-ew));ew=e;let r=window.scrollY;if(E&&W&&Math.abs(r-_)>6){let e=r>_&&r>.7*W.hero.h;e!==A&&(A=e,E.toggleAttribute("data-hidden",e)),_=r}if(l?eb=r:(eb+=(r-eb)*(1-Math.exp(-t/70)),.2>Math.abs(r-eb)&&(eb=r)),(eb!==ex||Z)&&((e=>{var t;let r;if(!W)return;let a=e>10;E&&a!==J&&(J=a,E.toggleAttribute("data-solid",a));let o=e+.4*G,i=["contact","certs","work","about"].find(e=>o>=W[e].top)??"",n="certs"===i?"certificates":i;n!==T&&(T=n,R.forEach(e=>e.setAttribute("aria-current",String(e.hash===`#${n}`))));let s=v(e/Math.max(1,W.hero.h));M&&(M.style.opacity=String(1-b(.05,.6,s)),M.style.transform=`translate3d(0,${.22*e}px,0)`);let u=W.about,f=v((e-u.top)/Math.max(1,u.h-G)),c=b(0,.22,f),d=X?62:40,h=Math.min(3,(r=Math.floor(t=3*v((f-.2)/.72)))+b(.28,.72,t-r));S&&(S.style.transform=`rotateX(56deg) rotateZ(${-40*m}deg) translate3d(0,0,${-1.5*d*c}px)`);let p=b(.1,.24,f);H.forEach((e,t)=>{let r=v(1-1.3*Math.abs(h-e.step))*p;e.el.style.transform=`translate3d(0,0,${t*d*c+12*r}px)`,e.el.style.opacity=String(.5+.5*Math.max(r,1-c)),e.glow&&(e.glow.style.opacity=String(r))}),q.forEach((e,t)=>{let r=v(1-2.2*Math.abs(h-t));e.style.opacity=String(r),e.style.transform=`translate3d(0,${(t-h)*22}px,0)`,e.style.visibility=r<.01?"hidden":"visible"}),$.forEach((e,t)=>e.style.transform=`scaleX(${v(h-t+1)})`);let g=v((e-(Y-G))/(.7*G));if(F){let e=X?22-14*g:14-9*g,t=(X?-28+12*g:-10+5*g)*m;F.style.transform=`rotateX(${e}deg) rotateY(${t}deg) translate3d(0,${(1-g)*40}px,0)`}if(L&&P.length){let e=j?v((window.scrollY-D)/j):0,t=-m*e*U;L.style.transform=`translate3d(${t.toFixed(1)}px,0,0)`;let r=x(1===m?k+N/2:B-k-N/2,1===m?B-k-N/2:k+N/2,e);P.forEach(e=>{let a=(e.c+t-r)/e.w,o=Math.min(Math.abs(a),2);e.body&&(e.body.style.transform=l?"":`translate3d(0,${(o*o*22).toFixed(1)}px,0) rotate(${(3.2*a).toFixed(2)}deg) scale(${(1-.05*o).toFixed(3)})`,e.body.style.opacity=String(1-.3*o))});let a=Math.round(e*(P.length-1));a!==z&&O&&(z=a,O.textContent=String(a+1).padStart(2,"0")),I&&(I.style.transform=`scaleX(${e.toFixed(4)})`)}K.forEach(t=>{let r=Math.min(t.top+t.d*G*.05,V+.58*G),a=(e+.94*G-r)/(.32*G),o=l?1:b(0,1,a);if(.001>Math.abs(o-t.a))return;t.a=o;let i=1-o;t.el.style.opacity=String(o),t.el.style.transform=t.cert?`translate3d(0,${70*i}px,0) rotateX(${22*i}deg) rotateY(${-16*i*m}deg) rotateZ(${3*i*m}deg)`:`translate3d(0,${40*i}px,0)`})})(eb),ex=eb,Z=!1),!W)return;let a=!l&&!es;if(a&&(ey+=t/1e3),Q&&Q.visible){let e=v((eb-(W.contact.top-G))/(1.5*G));(a||et||e!==eu)&&(Q.draw(ey,e,X,m),eu=e,et=!1)}if(er){let e=eb!==ei;if(!er.ready||e||eo||a){var o,i;let t,r,a,n=(o=eb,i=ey,t=W.contact,r=1-b(0,W.about.top+1.1*G,o),{presence:r,aurora:.3*(1-(a=b(t.top-1.2*G,t.top-.3*G,o))),shape:o/G*.55,intensity:x(.55,1,r)*(1-.55*a),mirror:m,time:i});er.ready&&n.presence<.05&&!e&&!eo&&++en%2!=0||er.draw(n),ei=eb,eo=!1}}t>0&&(eE=.92*eE+.08*t,++eR>40&&eE>26&&(eR=0,eE=16,el>.5?(el*=.8,Q?.resize(X,el),er?.resize(el)):es=!0))};return eT=requestAnimationFrame(eA),()=>{cancelAnimationFrame(eT),clearTimeout(ev),window.removeEventListener("resize",em),L?.removeEventListener("focusin",eh),eg.disconnect(),cancelAnimationFrame(ep),Q?.dispose(),er?.dispose()}},[]),null}],37517)},42724,e=>{var t=e.i(43476),r=e.i(71645);function a({children:e}){return(0,t.jsxs)("span",{className:"roll",children:[(0,t.jsx)("span",{className:"roll__a",children:e}),(0,t.jsx)("span",{className:"roll__b","aria-hidden":"true",children:e})]})}let o=e=>{let t;return t=`/${e}/`,`/testfolio${t}`};e.s(["default",0,function({nav:e}){let[i,n]=(0,r.useState)(!1),l=()=>n(!1);(0,r.useEffect)(()=>{if(!i)return;let e=e=>"Escape"===e.key&&n(!1),t=window.matchMedia("(min-width: 900px)"),r=()=>t.matches&&n(!1);return window.addEventListener("keydown",e),t.addEventListener("change",r),()=>{window.removeEventListener("keydown",e),t.removeEventListener("change",r)}},[i]);let s=t=>{t.preventDefault(),document.cookie=`lang=${e.switchLocale}; path=/; max-age=31536000; samesite=lax`,window.location.assign(`${o(e.switchLocale)}${window.location.hash}`)},u=[{href:"#about",label:e.about},{href:"#work",label:e.work},{href:"#certificates",label:e.certificates},{href:"#contact",label:e.contact}],f=r=>(0,t.jsx)("a",{href:o(e.switchLocale),hrefLang:e.switchLocale,lang:e.switchLocale,"aria-label":e.switchAria,className:r,onClick:s,children:e.switchLabel});return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("header",{className:"nav","data-nav":!0,"data-open":i||void 0,children:(0,t.jsxs)("div",{className:"nav__inner",children:[(0,t.jsx)("a",{href:"#top",className:"wordmark",onClick:l,children:e.wordmark}),(0,t.jsxs)("nav",{className:"nav__links wide-only",children:[u.map(e=>(0,t.jsx)("a",{href:e.href,className:"nav__link",children:e.label},e.href)),(0,t.jsx)("a",{href:"#contact",className:"pill pill--nav",children:(0,t.jsx)(a,{children:e.cta})}),f("nav__lang")]}),(0,t.jsxs)("div",{className:"nav__narrow narrow-only",children:[f("nav__lang"),(0,t.jsxs)("button",{type:"button",className:"menu-btn","aria-label":e.menuLabel,"aria-expanded":i,"aria-controls":"menu-sheet",onClick:()=>n(e=>!e),children:[(0,t.jsx)("span",{}),(0,t.jsx)("span",{})]})]})]})}),i&&(0,t.jsx)("div",{id:"menu-sheet",className:"menu-sheet narrow-only",children:u.map(e=>(0,t.jsx)("a",{href:e.href,onClick:l,children:e.label},e.href))})]})}],42724)},5500,(e,t,r)=>{e.i(47167),Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"Image",{enumerable:!0,get:function(){return x}});let a=e.r(55682),o=e.r(90809),i=e.r(43476),n=o._(e.r(71645)),l=a._(e.r(74080)),s=a._(e.r(25633)),u=e.r(8927),f=e.r(65856),c=e.r(49381),d=a._(e.r(1948)),m=e.r(18581);function h(e,t,r,a,o,i,n){let l=e?.src;e&&e["data-loaded-src"]!==l&&(e["data-loaded-src"]=l,("decode"in e?e.decode():Promise.resolve()).catch(()=>{}).then(()=>{if(e.parentElement&&e.isConnected){if("empty"!==t&&o(!0),r?.current){let t=new Event("load");Object.defineProperty(t,"target",{writable:!1,value:e});let a=!1,o=!1;r.current({...t,nativeEvent:t,currentTarget:e,target:e,isDefaultPrevented:()=>a,isPropagationStopped:()=>o,persist:()=>{},preventDefault:()=>{a=!0,t.preventDefault()},stopPropagation:()=>{o=!0,t.stopPropagation()}})}a?.current&&a.current(e)}}))}function p(e){return n.use?{fetchPriority:e}:{fetchpriority:e}}"u"<typeof window&&(globalThis.__NEXT_IMAGE_IMPORTED=!0);let g="u"<typeof window?n.useEffect:n.useLayoutEffect,v=(0,n.forwardRef)(({src:e,srcSet:t,sizes:r,height:a,width:o,decoding:l,className:s,style:u,fetchPriority:f,placeholder:c,loading:d,unoptimized:v,fill:b,onLoadRef:x,onLoadingCompleteRef:w,setBlurComplete:y,setShowAltText:E,sizesInput:R,onLoad:T,onError:A,..._},M)=>{let S=(0,n.useRef)(!1),F=(0,n.useRef)(null);g(()=>{let{current:e}=S,{current:t}=F;e||null===t||(A&&(t.src=t.src),t.complete&&h(t,c,x,w,y,v,R),S.current=!0)},[e,c,x,w,A,v,R]);let C=(0,m.useMergedRef)(M,F);return(0,i.jsx)("img",{..._,...p(f),loading:d,width:o,height:a,decoding:l,"data-nimg":b?"fill":"1",className:s,style:u,sizes:r,srcSet:t,src:e,ref:C,onLoad:e=>{h(e.currentTarget,c,x,w,y,v,R)},onError:e=>{E(!0),"empty"!==c&&y(!0),A&&A(e)}})});function b({isAppRouter:e,imgAttributes:t}){let r={as:"image",imageSrcSet:t.srcSet,imageSizes:t.sizes,crossOrigin:t.crossOrigin,referrerPolicy:t.referrerPolicy,...p(t.fetchPriority)};return e&&l.default.preload?(l.default.preload(t.src,r),null):(0,i.jsx)(s.default,{children:(0,i.jsx)("link",{rel:"preload",href:t.srcSet?void 0:t.src,...r},"__nimg-"+t.src+t.srcSet+t.sizes)})}let x=(0,n.forwardRef)((e,t)=>{let r=(0,n.useContext)(f.RouterContext),a=(0,c.useImageConfig)(),{onLoad:o,onLoadingComplete:l}=e,s=(0,n.useRef)(o);(0,n.useEffect)(()=>{s.current=o},[o]);let m=(0,n.useRef)(l);(0,n.useEffect)(()=>{m.current=l},[l]);let[h,p]=(0,n.useState)(!1),[g,x]=(0,n.useState)(!1),{props:w,meta:y}=(0,u.getImgProps)(e,{defaultLoader:d.default,imgConf:a,blurComplete:h,showAltText:g});return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(v,{...w,unoptimized:y.unoptimized,placeholder:y.placeholder,fill:y.fill,onLoadRef:s,onLoadingCompleteRef:m,setBlurComplete:p,setShowAltText:x,sizesInput:e.sizes,ref:t}),y.preload?(0,i.jsx)(b,{isAppRouter:!r,imgAttributes:w}):null]})});("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},49381,(e,t,r)=>{e.i(47167),Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"useImageConfig",{enumerable:!0,get:function(){return l}});let a=e.r(71645),o=e.r(87690),i=e.r(18556),n={deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[32,48,64,96,128,256,384],qualities:[75],path:"/testfolio/_next/image/",loader:"default",dangerouslyAllowSVG:!1,unoptimized:!0};function l(){let e=(0,a.useContext)(i.ImageConfigContext);return(0,o.prepareImageConfig)(n,e)}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},18581,(e,t,r)=>{Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"useMergedRef",{enumerable:!0,get:function(){return o}});let a=e.r(71645);function o(e,t){let r=(0,a.useRef)(null),o=(0,a.useRef)(null);return(0,a.useCallback)(a=>{if(null===a){let e=r.current;e&&(r.current=null,e());let t=o.current;t&&(o.current=null,t())}else e&&(r.current=i(e,a)),t&&(o.current=i(t,a))},[e,t])}function i(e,t){if("function"!=typeof e)return e.current=t,()=>{e.current=null};{let r=e(t);return"function"==typeof r?r:()=>e(null)}}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},70965,(e,t,r)=>{function a(e,t){let r=e||75;return t?.qualities?.length?t.qualities.reduce((e,t)=>Math.abs(t-r)<Math.abs(e-r)?t:e,t.qualities[0]):r}Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"findClosestQuality",{enumerable:!0,get:function(){return a}})},8927,(e,t,r)=>{e.i(47167),Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"getImgProps",{enumerable:!0,get:function(){return s}});let a=e.r(43369),o=e.r(88143),i=["-moz-initial","fill","none","scale-down",void 0];function n(e){return void 0!==e.default}function l(e){return void 0===e?e:"number"==typeof e?Number.isFinite(e)?e:0/0:"string"==typeof e&&/^[0-9]+$/.test(e)?parseInt(e,10):0/0}function s({src:e,sizes:t,unoptimized:r=!1,priority:u=!1,preload:f=!1,loading:c,className:d,quality:m,width:h,height:p,fill:g=!1,style:v,overrideSrc:b,onLoad:x,onLoadingComplete:w,placeholder:y="empty",blurDataURL:E,fetchPriority:R,decoding:T="async",layout:A,objectFit:_,objectPosition:M,lazyBoundary:S,lazyRoot:F,...C},L){var P;let O,I,{imgConf:D,showAltText:U,blurComplete:j,defaultLoader:k}=L;if(void 0===k)throw Error("images.loaderFile detected but the file is missing default export.\nRead more: https://nextjs.org/docs/messages/invalid-images-config");let N=C.loader||k;delete C.loader,delete C.srcSet;let B="__next_img_default"in N;if(B){if("custom"===D.loader)throw Error(`Image with src "${e}" is missing "loader" prop.
Read more: https://nextjs.org/docs/messages/next-image-missing-loader`)}else{let e=N;N=t=>{let{config:r,...a}=t;return e(a)}}if(A){"fill"===A&&(g=!0);let e={intrinsic:{maxWidth:"100%",height:"auto"},responsive:{width:"100%",height:"auto"}}[A];e&&(v={...v,...e});let r={responsive:"100vw",fill:"100vw"}[A];r&&!t&&(t=r)}let z="",H=l(h),q=l(p);if((P=e)&&"object"==typeof P&&(n(P)||void 0!==P.src)){let t=n(e)?e.default:e;if(!t.src)throw Error(`An object should only be passed to the image component src parameter if it comes from a static image import. It must include src. Received ${JSON.stringify(t)}`);if(!t.height||!t.width)throw Error(`An object should only be passed to the image component src parameter if it comes from a static image import. It must include height and width. Received ${JSON.stringify(t)}`);if(O=t.blurWidth,I=t.blurHeight,E=E||t.blurDataURL,z=t.src,!g)if(H||q){if(H&&!q){let e=H/t.width;q=Math.round(t.height*e)}else if(!H&&q){let e=q/t.height;H=Math.round(t.width*e)}}else H=t.width,q=t.height}let $=!u&&!f&&("lazy"===c||void 0===c);(!(e="string"==typeof e?e:z)||e.startsWith("data:")||e.startsWith("blob:"))&&(r=!0,$=!1),D.unoptimized&&(r=!0),B&&!D.dangerouslyAllowSVG&&e.split("?",1)[0].endsWith(".svg")&&(r=!0);let X=l(m),G=Object.assign(g?{position:"absolute",height:"100%",width:"100%",left:0,top:0,right:0,bottom:0,objectFit:_,objectPosition:M}:{},U?{}:{color:"transparent"},v),W=j||"empty"===y?null:"blur"===y?`url("data:image/svg+xml;charset=utf-8,${(0,o.getImageBlurSvg)({widthInt:H,heightInt:q,blurWidth:O,blurHeight:I,blurDataURL:E||"",objectFit:G.objectFit})}")`:`url("${y}")`,V=i.includes(G.objectFit)?"fill"===G.objectFit?"100% 100%":"cover":G.objectFit,Y=W?{backgroundSize:V,backgroundPosition:G.objectPosition||"50% 50%",backgroundRepeat:"no-repeat",backgroundImage:W}:{},K=function({config:e,src:t,unoptimized:r,width:o,quality:i,sizes:n,loader:l}){if(r){if(t.startsWith("/")&&!t.startsWith("//")){let e=(0,a.getDeploymentId)();if(t.includes("/_next/static/immutable")&&!(0,a.getAssetToken)())e=void 0;else if(e){let r=t.indexOf("?");if(-1!==r){let a=new URLSearchParams(t.slice(r+1));a.get("dpl")||(a.append("dpl",e),t=t.slice(0,r)+"?"+a.toString())}else t+=`?dpl=${e}`}}return{src:t,srcSet:void 0,sizes:void 0}}let{widths:s,kind:u}=function({deviceSizes:e,allSizes:t},r,a){if(a){let r=/(^|\s)(1?\d?\d)vw/g,o=[];for(let e;e=r.exec(a);)o.push(parseInt(e[2]));if(o.length){let r=.01*Math.min(...o);return{widths:t.filter(t=>t>=e[0]*r),kind:"w"}}return{widths:t,kind:"w"}}return"number"!=typeof r?{widths:e,kind:"w"}:{widths:[...new Set([r,2*r].map(e=>t.find(t=>t>=e)||t[t.length-1]))],kind:"x"}}(e,o,n),f=s.length-1;return{sizes:n||"w"!==u?n:"100vw",srcSet:s.map((r,a)=>`${l({config:e,src:t,quality:i,width:r})} ${"w"===u?r:a+1}${u}`).join(", "),src:l({config:e,src:t,quality:i,width:s[f]})}}({config:D,src:e,unoptimized:r,width:H,quality:X,sizes:t,loader:N}),Z=$?"lazy":c;return{props:{...C,loading:Z,fetchPriority:R,width:H,height:q,decoding:T,className:d,style:{...G,...Y},sizes:K.sizes,srcSet:K.srcSet,src:b||K.src},meta:{unoptimized:r,preload:f||u,placeholder:y,fill:g}}}},25633,(e,t,r)=>{e.i(47167),Object.defineProperty(r,"__esModule",{value:!0});var a={default:function(){return p},defaultHead:function(){return c}};for(var o in a)Object.defineProperty(r,o,{enumerable:!0,get:a[o]});let i=e.r(55682),n=e.r(90809),l=e.r(43476),s=n._(e.r(71645)),u=i._(e.r(98879)),f=e.r(42732);function c(){return[(0,l.jsx)("meta",{charSet:"utf-8"},"charset"),(0,l.jsx)("meta",{name:"viewport",content:"width=device-width"},"viewport")]}function d(e,t){return"string"==typeof t||"number"==typeof t?e:t.type===s.default.Fragment?e.concat(s.default.Children.toArray(t.props.children).reduce((e,t)=>"string"==typeof t||"number"==typeof t?e:e.concat(t),[])):e.concat(t)}let m=["name","httpEquiv","charSet","itemProp"];function h(e){let t,r,a,o;return e.reduce(d,[]).reverse().concat(c().reverse()).filter((t=new Set,r=new Set,a=new Set,o={},e=>{let i=!0,n=!1;if(e.key&&"number"!=typeof e.key&&e.key.indexOf("$")>0){n=!0;let r=e.key.slice(e.key.indexOf("$")+1);t.has(r)?i=!1:t.add(r)}switch(e.type){case"title":case"base":r.has(e.type)?i=!1:r.add(e.type);break;case"meta":for(let t=0,r=m.length;t<r;t++){let r=m[t];if(e.props.hasOwnProperty(r))if("charSet"===r)a.has(r)?i=!1:a.add(r);else{let t=e.props[r],a=o[r]||new Set;("name"!==r||!n)&&a.has(t)?i=!1:(a.add(t),o[r]=a)}}}return i})).reverse().map((e,t)=>{let r=e.key||t;return s.default.cloneElement(e,{key:r})})}let p=function({children:e}){let t=(0,s.useContext)(f.HeadManagerContext);return(0,l.jsx)(u.default,{reduceComponentsToState:h,headManager:t,children:e})};("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},88143,(e,t,r)=>{function a({widthInt:e,heightInt:t,blurWidth:r,blurHeight:o,blurDataURL:i,objectFit:n}){let l=r?40*r:e,s=o?40*o:t,u=l&&s?`viewBox='0 0 ${l} ${s}'`:"";return`%3Csvg xmlns='http://www.w3.org/2000/svg' ${u}%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='${u?"none":"contain"===n?"xMidYMid":"cover"===n?"xMidYMid slice":"none"}' style='filter: url(%23b);' href='${i}'/%3E%3C/svg%3E`}Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"getImageBlurSvg",{enumerable:!0,get:function(){return a}})},18556,(e,t,r)=>{e.i(47167),Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"ImageConfigContext",{enumerable:!0,get:function(){return i}});let a=e.r(55682)._(e.r(71645)),o=e.r(87690),i=a.default.createContext(o.imageConfigDefault)},87690,(e,t,r)=>{Object.defineProperty(r,"__esModule",{value:!0});var a={VALID_LOADERS:function(){return i},imageConfigDefault:function(){return u},prepareImageConfig:function(){return s}};for(var o in a)Object.defineProperty(r,o,{enumerable:!0,get:a[o]});let i=["default","imgix","cloudinary","akamai","custom"],n={},l=new WeakMap;function s(e,t){let r=e??n,a=t??n,o=l.get(r);if(o){let e=o.get(a);if(e)return e}let i=e||t||u,s=[...i.deviceSizes].sort((e,t)=>e-t),f=[...i.imageSizes],c={deviceSizes:s,imageSizes:f,allSizes:[...s,...f].sort((e,t)=>e-t),qualities:void 0===i.qualities?void 0:[...i.qualities].sort((e,t)=>e-t),path:i.path,loader:i.loader,dangerouslyAllowSVG:i.dangerouslyAllowSVG,unoptimized:i.unoptimized,domains:i.domains,remotePatterns:i.remotePatterns,localPatterns:"u"<typeof window&&void 0!==t?t.localPatterns:i.localPatterns,output:i.output};return o||(o=new WeakMap,l.set(r,o)),o.set(a,c),c}let u={deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[32,48,64,96,128,256,384],path:"/_next/image",loader:"default",loaderFile:"",domains:[],disableStaticImages:!1,minimumCacheTTL:14400,formats:["image/webp"],maximumDiskCacheSize:void 0,maximumRedirects:3,maximumResponseBody:5e7,dangerouslyAllowLocalIP:!1,dangerouslyAllowSVG:!1,contentSecurityPolicy:"script-src 'none'; frame-src 'none'; sandbox;",contentDispositionType:"attachment",localPatterns:void 0,remotePatterns:[],qualities:[75],unoptimized:!1,customCacheHandler:!1}},1948,(e,t,r)=>{e.i(47167),Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"default",{enumerable:!0,get:function(){return n}});let a=e.r(70965),o=e.r(43369);function i({config:e,src:t,width:r,quality:n}){let l=(0,o.getDeploymentId)();if(t.startsWith("/")&&!t.startsWith("//"))if(t.includes("/_next/static/immutable")&&!(0,o.getAssetToken)())l=void 0;else{let e=t.indexOf("?");if(-1!==e){let r=new URLSearchParams(t.slice(e+1)),a=r.get("dpl");if(a){l=a,r.delete("dpl");let o=r.toString();t=t.slice(0,e)+(o?"?"+o:"")}}}if(t.startsWith("/")&&t.includes("?")&&e.localPatterns?.length===1&&"**"===e.localPatterns[0].pathname&&""===e.localPatterns[0].search)throw Error(`Image with src "${t}" is using a query string which is not configured in images.localPatterns.
Read more: https://nextjs.org/docs/messages/next-image-unconfigured-localpatterns`);let s=(0,a.findClosestQuality)(n,e);return`${e.path}?url=${encodeURIComponent(t)}&w=${r}&q=${s}${t.startsWith("/")&&l?`&dpl=${l}`:""}`}i.__next_img_default=!0;let n=i},65856,(e,t,r)=>{e.i(47167),Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"RouterContext",{enumerable:!0,get:function(){return a}});let a=(e.r(55682)._(e.r(71645))).default.createContext(null)},98879,(e,t,r)=>{Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"default",{enumerable:!0,get:function(){return l}});let a=e.r(71645),o="u"<typeof window,i=o?()=>{}:a.useLayoutEffect,n=o?()=>{}:a.useEffect;function l(e){let{headManager:t,reduceComponentsToState:r}=e;function l(){if(t&&t.mountedInstances){let e=a.Children.toArray(Array.from(t.mountedInstances).filter(Boolean));t.updateHead(r(e))}}return o&&(t?.mountedInstances?.add(e.children),l()),i(()=>(t?.mountedInstances?.add(e.children),()=>{t?.mountedInstances?.delete(e.children)})),i(()=>(t&&(t._pendingUpdate=l),()=>{t&&(t._pendingUpdate=l)})),n(()=>(t&&t._pendingUpdate&&(t._pendingUpdate(),t._pendingUpdate=null),()=>{t&&t._pendingUpdate&&(t._pendingUpdate(),t._pendingUpdate=null)})),null}}])})();