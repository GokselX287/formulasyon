'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Screensaver() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current!;
    const w = mount.clientWidth, h = mount.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    const uniforms = {
      u_time: { value: 0 },
      u_res: { value: new THREE.Vector2(w, h) },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `void main(){ gl_Position = vec4(position,1.0); }`,
      fragmentShader: `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_res;
        vec3 hsv2rgb(vec3 c){
          vec4 K = vec4(1.0,2.0/3.0,1.0/3.0,3.0);
          vec3 p = abs(fract(c.xxx + K.xyz)*6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p-K.xxx,0.0,1.0), c.y);
        }
        void main(){
          vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / min(u_res.x, u_res.y);
          float t = u_time * 0.15;
          float v = 0.0;
          for(int i=0; i<5; i++){
            float fi = float(i);
            v += sin(uv.x*(3.0+fi) + t*(1.0+fi*0.3))
               + sin(uv.y*(2.5+fi) - t*(0.8+fi*0.2))
               + sin((uv.x+uv.y)*(1.5+fi) + t);
          }
          v = v / 15.0;
          float hue = 0.62 + 0.2*sin(v*3.1415 + t);
          float sat = 0.55 + 0.35*cos(v*2.0);
          float val = 0.08 + 0.18*(0.5+0.5*sin(v*4.0));
          vec3 col = hsv2rgb(vec3(hue, sat, val));
          float r = length(uv);
          col *= smoothstep(1.3, 0.2, r);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const geo = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geo, mat));

    let raf = 0;
    const start = performance.now();
    const loop = () => {
      uniforms.u_time.value = (performance.now() - start) / 1000;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    const onResize = () => {
      const nw = mount.clientWidth, nh = mount.clientHeight;
      renderer.setSize(nw, nh);
      uniforms.u_res.value.set(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose(); geo.dispose(); mat.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black cursor-none">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center px-8">
          <p className="text-xs tracking-[0.4em] uppercase text-white/40">Sessizlik</p>
          <h1 className="text-white text-4xl md:text-6xl font-light mt-4 tracking-tight">
            Klinik Asistanı
          </h1>
          <p className="text-white/30 text-xs mt-8">Hareket et — geri dön</p>
        </div>
      </div>
    </div>
  );
}
