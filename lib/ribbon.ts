// The contact section's arc ribbon: the design prototype's RIBBON_FS shader, copied verbatim.
const RIBBON_FS = `
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
}`;

const UNIFORMS = ["uRes", "uTime", "uScroll", "uCenter", "uScale", "uMode", "uInt", "uC1", "uC2", "uC3"] as const;

export function createArc(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: true, depth: false, stencil: false });
  if (!gl) return null;
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, "attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}"));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, RIBBON_FS));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link");
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)])) as Record<
    (typeof UNIFORMS)[number],
    WebGLUniformLocation | null
  >;

  let aspect = 1;
  let visible = true;
  const io = new IntersectionObserver((es) => (visible = es[es.length - 1].isIntersecting), { rootMargin: "120px 0px" });
  io.observe(canvas);

  return {
    get visible() {
      return visible;
    },
    /** Sharper than the prototype: up to 2× pixel density, capped at ~4.5M pixels. */
    resize(wide: boolean, quality: number) {
      const w0 = canvas.clientWidth;
      const h0 = canvas.clientHeight;
      const area = Math.max(1, w0 * h0);
      let d = Math.min(window.devicePixelRatio || 1, wide ? 2 : 1.75);
      if (area * d * d > 4.5e6) d = Math.sqrt(4.5e6 / area);
      d *= quality;
      canvas.width = Math.max(2, Math.round(w0 * d));
      canvas.height = Math.max(2, Math.round(h0 * d));
      gl.viewport(0, 0, canvas.width, canvas.height);
      aspect = w0 / Math.max(1, h0);
    },
    draw(time: number, scroll: number, wide: boolean, mirror: 1 | -1) {
      const [cx, cy, s] = wide ? [aspect * 0.5 * 0.62, -0.02, 1.05] : [aspect * 0.5 * 0.6, 0.26, 0.62];
      gl.useProgram(program);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, time % 2000);
      gl.uniform1f(u.uScroll, scroll);
      gl.uniform2f(u.uCenter, cx * mirror, cy);
      gl.uniform1f(u.uScale, s);
      gl.uniform1f(u.uMode, 1);
      gl.uniform1f(u.uInt, 1);
      gl.uniform3f(u.uC1, 0.1, 0.92, 0.8);
      gl.uniform3f(u.uC2, 0.3, 0.7, 1.0);
      gl.uniform3f(u.uC3, 0.62, 0.48, 1.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      io.disconnect();
    },
  };
}

export type Arc = NonNullable<ReturnType<typeof createArc>>;
