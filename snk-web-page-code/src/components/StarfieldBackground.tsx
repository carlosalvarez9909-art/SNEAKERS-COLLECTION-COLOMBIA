import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const STAR_COUNT = 3200;
const SPACE_COLOR = 0x050506;

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'low-power'
      });
    } catch (error) {
      console.error('No se pudo iniciar el fondo espacial WebGL:', error);
      return;
    }

    renderer.setClearColor(SPACE_COLOR, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    const starField = new THREE.Group();
    scene.add(starField);

    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const opacities = new Float32Array(STAR_COUNT);
    const twinklePhases = new Float32Array(STAR_COUNT);
    const twinkleSpeeds = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i += 1) {
      const offset = i * 3;
      const brightness = 0.6 + Math.random() * 0.4;
      const coolTint = Math.random() < 0.24;

      positions[offset] = (Math.random() * 2 - 1) * 80;
      positions[offset + 1] = (Math.random() * 2 - 1) * 47.5;
      positions[offset + 2] = -40 - Math.random() * 50;

      colors[offset] = brightness * (coolTint ? 0.82 : 0.92);
      colors[offset + 1] = brightness * (coolTint ? 0.9 : 0.94);
      colors[offset + 2] = brightness;
      sizes[i] = 0.8 + Math.random() * 0.9;
      opacities[i] = 0.45 + Math.random() * 0.5;
      twinklePhases[i] = Math.random() * Math.PI * 2;
      twinkleSpeeds[i] = 0.7 + Math.random() * 0.35;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute('aTwinklePhase', new THREE.BufferAttribute(twinklePhases, 1));
    geometry.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: renderer.getPixelRatio() },
        uTime: { value: 0 }
      },
      vertexShader: `
        attribute float aSize;
        attribute float aOpacity;
        attribute float aTwinklePhase;
        attribute float aTwinkleSpeed;
        uniform float uPixelRatio;
        uniform float uTime;
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          float depthScale = 40.0 / max(-viewPosition.z, 40.0);
          gl_PointSize = max(1.0, aSize * uPixelRatio * depthScale);
          gl_Position = projectionMatrix * viewPosition;
          vColor = color;
          float twinkle = 1.0 + 0.18 * sin(uTime * aTwinkleSpeed + aTwinklePhase);
          vOpacity = aOpacity * twinkle;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          float radius = length(gl_PointCoord - vec2(0.5));
          float edge = 1.0 - smoothstep(0.12, 0.5, radius);
          float alpha = edge * vOpacity;
          if (alpha < 0.015) discard;
          gl_FragColor = vec4(vColor, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    starField.add(new THREE.Points(geometry, material));

    let frameId = 0;
    let previousTime = 0;
    let elapsedTime = 0;
    let pointerX = 0;
    let pointerY = 0;
    let resizeObserver: ResizeObserver | undefined;

    const resize = () => {
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const animate = (time: number) => {
      frameId = 0;
      if (document.hidden) return;

      const delta = previousTime
        ? Math.min((time - previousTime) / 1000, 0.05)
        : 0;
      previousTime = time;
      elapsedTime += delta;
      material.uniforms.uTime.value = elapsedTime;

      starField.rotation.z += 0.003 * delta;
      starField.position.x += (pointerX * 1.2 - starField.position.x) * Math.min(delta * 0.35, 1);
      starField.position.y += (-pointerY * 0.7 - starField.position.y) * Math.min(delta * 0.35, 1);

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (reducedMotion.matches || document.hidden || frameId) return;
      previousTime = 0;
      frameId = window.requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
      previousTime = 0;
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation();
      } else {
        startAnimation();
      }
    };

    const onMotionPreferenceChange = () => {
      if (reducedMotion.matches) {
        stopAnimation();
        renderer.render(scene, camera);
      } else {
        startAnimation();
      }
    };

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(document.documentElement);
    resize();

    if (!reducedMotion.matches) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      startAnimation();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    reducedMotion.addEventListener('change', onMotionPreferenceChange);

    return () => {
      stopAnimation();
      resizeObserver?.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reducedMotion.removeEventListener('change', onMotionPreferenceChange);

      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield-background" aria-hidden="true" />;
}
