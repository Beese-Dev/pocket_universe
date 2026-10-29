/* ---------- shaders ---------- */
const NOISE=`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){float s=0.0,a=0.5;for(int i=0;i<5;i++){s+=a*snoise(p);p=p*2.02+vec3(1.7,9.2,3.1);a*=0.5;}return s;}
float fbm3(vec3 p){float s=0.0,a=0.5;for(int i=0;i<3;i++){s+=a*snoise(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=0.5;}return s;}
`;
const VS=`varying vec3 vObj; varying vec3 vWorld; varying vec3 vN;
void main(){ vObj=position; vec4 w=modelMatrix*vec4(position,1.0); vWorld=w.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*w; }`;

const PLANET_FS=`uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uStarPos; uniform vec3 uStarCol;
uniform float uType; uniform float uSeed; uniform float uTime; uniform float uGrow; uniform float uClouds; uniform float uDust; uniform float uCiv;
varying vec3 vObj; varying vec3 vWorld; varying vec3 vN;
${NOISE}
void main(){
  vec3 p=normalize(vObj); vec3 sp=p*1.8+vec3(uSeed,uSeed*0.37,uSeed*0.71);
  vec3 col; vec3 emis=vec3(0.0);
  if(uType<0.5){
    float h=fbm(sp*1.3); float land=smoothstep(-0.02,0.04,h);
    vec3 sea=mix(uA*0.55,uA,smoothstep(-0.6,0.0,h)); vec3 gr=mix(uB,uC,smoothstep(0.05,0.55,h));
    col=mix(sea,gr,land);
    float cap=smoothstep(0.8,0.88,abs(p.y)+fbm(sp*3.0)*0.08); col=mix(col,vec3(0.92,0.94,0.97),cap*uClouds);
  } else if(uType<1.5){
    float h=fbm(sp*1.1); float land=smoothstep(0.24,0.29,h);
    vec3 sea=mix(uA,uB,smoothstep(-0.4,0.25,h)); col=mix(sea,uC,land);
    float cap=smoothstep(0.74,0.82,abs(p.y)+fbm(sp*3.0)*0.1); col=mix(col,vec3(0.93,0.96,1.0),cap);
  } else if(uType<2.5){
    float warp=fbm(vec3(p.x*2.0,p.y*6.0,p.z*2.0)+uSeed+vec3(uTime*0.015,0.0,0.0));
    float lat=p.y*5.0+warp*1.1;
    col=mix(uA,uB,0.5+0.5*sin(lat*3.1+uSeed));
    col=mix(col,uC,smoothstep(0.55,0.95,0.5+0.5*sin(lat*7.3+1.3))*0.55);
    vec3 sc=normalize(vec3(cos(uSeed),-0.42,sin(uSeed)));
    float spot=1.0-smoothstep(0.08,0.2,length((p-sc)*vec3(1.0,2.2,1.0))+fbm(p*7.0)*0.04);
    col=mix(col,uC*1.15,spot*0.85);
  } else if(uType<3.5){
    float h=fbm(sp*1.6+vec3(0.0,uTime*0.01,0.0));
    float crack=1.0-smoothstep(0.0,0.07,abs(h));
    float crack2=1.0-smoothstep(0.0,0.035,abs(fbm(sp*3.3+4.0)));
    col=uA*(0.8+0.5*fbm(sp*4.0));
    emis=uB*(crack*1.7+crack2*0.9)*(0.85+0.15*sin(uTime*2.0+h*10.0));
  } else {
    float h=fbm(sp*2.0); col=mix(uB,uA,smoothstep(-0.4,0.5,h));
    float cr=1.0-smoothstep(0.0,0.03,abs(fbm(sp*4.0+2.0))); col=mix(col,uB*0.7,cr*0.7);
    col=mix(col,uC,smoothstep(0.66,0.8,abs(p.y)));
  }
  if(uClouds>0.5 && uType<1.5){
    float c=smoothstep(0.08,0.55,fbm(sp*1.7+vec3(uTime*0.02,0.0,uTime*0.01)));
    col=mix(col,vec3(0.97),c*0.75);
  }
  vec3 N=normalize(vN); vec3 L=normalize(uStarPos-vWorld); float d=dot(N,L);
  float lit=smoothstep(-0.12,1.0,d);
  vec3 lc=col*(0.035+lit*uStarCol*1.02)+emis;
  lc=mix(lc,vec3(dot(lc,vec3(0.33)))*vec3(0.75,0.68,0.6),uDust*0.75);
  /* a civilisation: city lights where it is night */
  float night=smoothstep(0.08,-0.2,d); float towns=smoothstep(0.5,0.72,fbm(sp*9.0+vec3(7.0)))*step(0.55,fbm(sp*2.0+vec3(2.0))*0.5+0.5+0.2);
  lc+=vec3(1.0,0.76,0.42)*uCiv*night*towns*1.1;
  float m=fbm(p*3.0+vec3(uTime*0.25));
  vec3 molten=mix(vec3(1.7,0.45,0.08),vec3(0.35,0.05,0.02),smoothstep(-0.3,0.5,m))*(0.5+0.6*max(d,0.0));
  float g=uGrow*1.3;
  float crust=smoothstep(g-0.15,g+0.15,fbm(p*2.5+uSeed)*0.5+0.5);
  gl_FragColor=vec4(mix(lc,molten,crust),1.0);
}`;

const ATMO_FS=`uniform vec3 uColor; uniform vec3 uStarPos; uniform float uGrow;
varying vec3 vObj; varying vec3 vWorld; varying vec3 vN;
void main(){ vec3 V=normalize(cameraPosition-vWorld); vec3 N=normalize(vN);
  float f=pow(1.0-max(dot(N,V),0.0),2.6); float lit=smoothstep(-0.35,0.6,dot(N,normalize(uStarPos-vWorld)));
  gl_FragColor=vec4(uColor*f*lit*1.15*smoothstep(0.4,1.0,uGrow),1.0); }`;

const STAR_FS=`uniform vec3 uCol; uniform float uTime; uniform float uSeed; uniform float uSwell;
varying vec3 vObj; varying vec3 vWorld; varying vec3 vN;
${NOISE}
void main(){ vec3 p=normalize(vObj);
  float n=fbm(p*3.0+uSeed+vec3(0.0,uTime*0.08,0.0));
  float g=snoise(p*14.0+vec3(uTime*0.35))*0.5+0.5;
  float mu=max(dot(normalize(vN),normalize(cameraPosition-vWorld)),0.0);
  float limb=0.5+0.5*pow(mu,0.55);
  vec3 c=uCol*(1.02+0.5*n+0.28*g)*limb;
  c=mix(c,vec3(1.05,0.38,0.14)*(0.8+0.6*n)*limb,uSwell*0.85);
  gl_FragColor=vec4(c,1.0); }`;

const RING_VS=`varying vec2 vL; void main(){ vL=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const RING_FS=`uniform vec3 uA; uniform vec3 uB; uniform float uIn; uniform float uOut; uniform float uSeed; uniform float uGrow;
varying vec2 vL;
${NOISE}
void main(){ float r=length(vL); float t=(r-uIn)/(uOut-uIn);
  float n=snoise(vec3(t*4.0,uSeed,0.0))*0.5+0.5; float n2=snoise(vec3(t*19.0,uSeed*2.0,1.0))*0.5+0.5;
  float gap=smoothstep(0.02,0.05,abs(t-0.62));
  float a=smoothstep(0.0,0.06,t)*smoothstep(1.0,0.86,t)*(0.25+0.75*n)*(0.45+0.55*n2)*gap;
  gl_FragColor=vec4(mix(uA,uB,n2)*0.85,a*0.85*smoothstep(0.5,1.0,uGrow)); }`;

const DISK_FS=`uniform float uIn; uniform float uOut; uniform float uTime; uniform float uSeed; uniform float uFeed;
varying vec2 vL;
${NOISE}
void main(){ float r=length(vL); float t=(r-uIn)/(uOut-uIn); float ang=atan(vL.y,vL.x);
  float sw=snoise(vec3(cos(ang+t*6.0-uTime*0.9)*2.0,sin(ang+t*6.0-uTime*0.9)*2.0,t*5.0+uSeed))*0.5+0.5;
  float a=smoothstep(0.0,0.08,t)*pow(1.0-t,1.6)*(0.45+0.75*sw);
  vec3 hot=vec3(1.9,1.5,1.1); vec3 warm=vec3(1.6,0.55,0.12); vec3 cool=vec3(0.45,0.12,0.5);
  vec3 c=mix(hot,warm,smoothstep(0.0,0.35,t)); c=mix(c,cool,smoothstep(0.45,1.0,t));
  gl_FragColor=vec4(c*a*(1.0+uFeed*1.4)+vec3(0.5,0.7,1.0)*a*uFeed*0.5,a); }`;

const REM_FS=`uniform float uT; uniform float uLife; uniform float uSeed; uniform float uKind;
varying vec3 vObj; varying vec3 vWorld; varying vec3 vN;
${NOISE}
void main(){ vec3 p=normalize(vObj); vec3 V=normalize(cameraPosition-vWorld);
  float rim=pow(1.0-abs(dot(normalize(vN),V)),1.5);
  float f=fbm(p*3.5+uSeed+vec3(0.0,uT*0.01,0.0)); float n2=fbm3(p*1.6+uSeed*0.3);
  float fil=1.0-smoothstep(0.0,0.1,abs(f));
  float k=uT/uLife; float fade=smoothstep(0.0,0.03,k)*pow(1.0-k,1.3);
  vec3 c=mix(vec3(0.15,0.65,0.75),vec3(0.85,0.25,0.6),smoothstep(-0.3,0.4,n2));
  c+=vec3(1.0,0.55,0.25)*fil*1.2;
  if(uKind>0.5){ c=mix(vec3(0.2,0.8,0.55),vec3(0.3,0.5,1.0),smoothstep(-0.3,0.4,n2)); c+=vec3(1.0,0.4,0.5)*rim*0.8+vec3(0.9,0.95,0.6)*fil*0.9; }
  if(uKind>1.5){ c=mix(vec3(0.9,0.3,0.15),vec3(0.6,0.15,0.25),smoothstep(-0.3,0.4,n2)); c+=vec3(1.0,0.7,0.4)*rim*0.9+vec3(1.0,0.5,0.2)*fil; }
  float a=(rim*0.55*(0.5+0.5*f)+fil*0.55+0.04)*fade;
  gl_FragColor=vec4(c*a,a); }`;

const HZ_FS=`uniform float uIn; uniform float uAlpha; varying vec2 vL;
void main(){ float r=length(vL); float a=smoothstep(uIn-0.06,uIn+0.04,r)*smoothstep(1.0,0.9,r)*uAlpha;
  gl_FragColor=vec4(vec3(0.35,0.95,0.55)*a,a); }`;
const PDISC_FS=`uniform float uIn; uniform float uOut; uniform float uT; uniform float uSeed; uniform float uGap[8]; uniform int uN; uniform float uAlpha;
varying vec2 vL;
${NOISE}
void main(){ float r=length(vL); float t=(r-uIn)/(uOut-uIn); float ang=atan(vL.y,vL.x);
  float n=snoise(vec3(t*6.0,uSeed,0.0))*0.5+0.5; float n2=snoise(vec3(cos(ang)*3.0,sin(ang)*3.0,t*9.0+uSeed))*0.5+0.5;
  float gaps=1.0; for(int i=0;i<8;i++){ if(i>=uN) break; float g=(r-uGap[i])/(uOut*0.045); gaps*=1.0-0.9*exp(-g*g); }
  float a=smoothstep(0.0,0.08,t)*pow(1.0-t,1.4)*(0.35+0.65*n)*(0.6+0.4*n2)*gaps*uAlpha;
  vec3 c=mix(vec3(0.75,0.5,0.3),vec3(0.95,0.82,0.6),smoothstep(0.0,0.5,t)); c=mix(c,vec3(0.55,0.6,0.75),smoothstep(0.6,1.0,t));
  gl_FragColor=vec4(c*a*0.9,a*0.55); }`;

const NEB_FS=`varying vec3 vObj; varying vec3 vWorld; varying vec3 vN;
${NOISE}
void main(){ vec3 d=normalize(vObj);
  float band=exp(-pow(d.y*2.6+snoise(d*2.0)*0.4,2.0));
  float n=fbm3(d*2.2+vec3(3.1)); float n2=fbm3(d*4.5+vec3(8.0,1.0,2.0));
  vec3 c=mix(vec3(0.17,0.07,0.32),vec3(0.03,0.19,0.26),smoothstep(-0.3,0.5,n2));
  c=mix(c,vec3(0.32,0.07,0.2),smoothstep(0.2,0.7,n)*0.6);
  float a=smoothstep(-0.25,0.65,n)*(0.28+0.72*band);
  gl_FragColor=vec4(c*a*0.8+vec3(0.012,0.01,0.026),1.0); }`;
