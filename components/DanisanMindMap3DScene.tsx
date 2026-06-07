'use client';

import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls, Text, Line, Points, PointMaterial,
  MeshTransmissionMaterial, Environment, Html,
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Patient    = { adSoyad: string; yas?: string; patientType?: 'cocuk' | 'yetiskin' };
type Formulation = {
  id?: string;
  actKabul?: string; actDefuzyon?: string; actSimdi?: string;
  actBaglam?: string; actDegerler?: string; actEylem?: string;
  actYaraticiCaresizlik?: string;
  otomatikDusunceler?: string; duyguBedensel?: string;
};
type Seans = { id: string; tarih: string; konu?: string };

export type Props = {
  patient: Patient;
  formulation?: Formulation | null;
  seanslar?: Seans[];
};

type FreeNode = {
  id: string; patient_id: string; parent_process: string;
  label: string; content: string; created_at: string;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const D2R   = Math.PI / 180;
const HEX_R = 3.2;

const BRANCHES = [
  { id: 'simdi',    label: 'Şimdiki An',   angle: 270, color: '#00CCFF', actKey: 'actSimdi' as keyof Formulation,    examples: ['Toplantı öncesi kaygı',    'Geçmiş düşünceler'] },
  { id: 'defuzyon', label: 'Bil. Ayrışma', angle: 330, color: '#AA55FF', actKey: 'actDefuzyon' as keyof Formulation, examples: ['"Ben yetersizim"',          '"Başaramam"'] },
  { id: 'kabul',    label: 'Kabul',         angle: 30,  color: '#FF4488', actKey: 'actKabul' as keyof Formulation,    examples: ['Göğüs sıkışması',           'Kaygı (7/10)'] },
  { id: 'degerler', label: 'Değerler',      angle: 90,  color: '#FF8844', actKey: 'actDegerler' as keyof Formulation, examples: ['Aile bağlılığı',            'Mesleki büyüme'] },
  { id: 'eylem',    label: 'Adanmış Eylem', angle: 150, color: '#4488FF', actKey: 'actEylem' as keyof Formulation,    examples: ['Haftada 3 egzersiz',        'Günlük nefes'] },
  { id: 'baglam',   label: 'Bağlamsal',     angle: 210, color: '#7755DD', actKey: 'actBaglam' as keyof Formulation,   examples: ['"Endişeli ebeveyn"',        'Savunmacı tepkiler'] },
] as const;

type BranchId = typeof BRANCHES[number]['id'];

function parseItems(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(/[,;\n•·]+/).map(s => s.trim()).filter(Boolean);
}

function branchPos(angle: number, r: number): [number, number, number] {
  return [r * Math.cos(angle * D2R), r * Math.sin(angle * D2R), 0];
}

// ─── Nebula + star background ──────────────────────────────────────────────────

function NebulaBackground() {
  const starPos = useMemo(() => {
    const arr = new Float32Array(4000 * 3);
    for (let i = 0; i < 4000; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 200;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 200;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    return arr;
  }, []);

  const starGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    return g;
  }, [starPos]);

  return (
    <>
      {/* Deep space shell */}
      <mesh>
        <sphereGeometry args={[90, 32, 32]} />
        <meshBasicMaterial color="#020008" side={THREE.BackSide} />
      </mesh>

      {/* Soft nebula blobs — provide color for glass to refract */}
      {([
        { pos: [-22, 18, -45] as [number,number,number], col: '#0D0030', r: 20, op: 0.55 },
        { pos: [26, -14, -50] as [number,number,number], col: '#001835', r: 24, op: 0.45 },
        { pos: [-6, -22, -38] as [number,number,number], col: '#180030', r: 18, op: 0.50 },
        { pos: [12,  20, -42] as [number,number,number], col: '#001A30', r: 16, op: 0.40 },
      ]).map((b, i) => (
        <mesh key={i} position={b.pos}>
          <sphereGeometry args={[b.r, 16, 16]} />
          <meshBasicMaterial color={b.col} transparent opacity={b.op} />
        </mesh>
      ))}

      {/* Stars */}
      <Points geometry={starGeo}>
        <PointMaterial size={0.055} color="#e8e8ff" sizeAttenuation transparent opacity={0.55} />
      </Points>
    </>
  );
}

// ─── Center Hexagon ───────────────────────────────────────────────────────────

function CenterHex({ patientName }: { patientName: string }) {
  const hexRef  = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const hexGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const r = 1.1;
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 - 30) * D2R;
      if (i === 0) shape.moveTo(r * Math.cos(a), r * Math.sin(a));
      else         shape.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.14, bevelEnabled: true,
      bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3,
    });
  }, []);

  useFrame((_, delta) => {
    if (hexRef.current)  hexRef.current.rotation.z  += delta * 0.07;
    if (ringRef.current) ringRef.current.rotation.z -= delta * 0.035;
  });

  return (
    <group>
      {/* Outer counter-rotating ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.25, 0.018, 8, 64]} />
        <meshBasicMaterial color="#aa77ff" transparent opacity={0.50} />
      </mesh>
      <mesh>
        <torusGeometry args={[1.17, 0.010, 8, 64]} />
        <meshBasicMaterial color="#6644cc" transparent opacity={0.28} />
      </mesh>

      {/* Glass hex body */}
      <mesh ref={hexRef} geometry={hexGeo} position={[0, 0, -0.07]}>
        <MeshTransmissionMaterial
          transmission={1}
          thickness={0.6}
          roughness={0.10}
          ior={1.45}
          chromaticAberration={0.045}
          backside
          temporalDistortion={0.08}
          color="#f2f0ff"
          attenuationColor="#8833ee"
          attenuationDistance={1.0}
          samples={4}
        />
      </mesh>

      {/* Hex border lines */}
      {Array.from({ length: 6 }, (_, i) => {
        const r  = 1.12;
        const a1 = (i * 60 - 30) * D2R;
        const a2 = ((i + 1) * 60 - 30) * D2R;
        return (
          <Line key={i}
            points={[
              [r * Math.cos(a1), r * Math.sin(a1), 0.12] as [number,number,number],
              [r * Math.cos(a2), r * Math.sin(a2), 0.12] as [number,number,number],
            ]}
            color="#c4aaff" lineWidth={1.6}
          />
        );
      })}

      {/* ACT label — Html for white-on-glass legibility */}
      <Html center distanceFactor={10} position={[0, 0.14, 0.25]}>
        <div style={{
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '900',
          letterSpacing: '0.18em',
          textShadow: '0 0 14px rgba(150,80,255,0.95), 0 1px 3px rgba(0,0,0,0.9)',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>ACT</div>
      </Html>
      <Html center distanceFactor={10} position={[0, -0.22, 0.25]}>
        <div style={{
          color: 'rgba(210,190,255,0.85)',
          fontSize: '8.5px',
          fontWeight: '500',
          textShadow: '0 1px 4px rgba(0,0,0,0.95)',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>{patientName}</div>
      </Html>
    </group>
  );
}

// ─── Leaf Node ────────────────────────────────────────────────────────────────

function LeafNode({
  label, position, color, isExample, onSelect, isFree,
}: {
  label: string; position: [number,number,number];
  color: string; isExample: boolean;
  onSelect: () => void; isFree?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rimRef  = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const offset = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    const dy = Math.sin(clock.elapsedTime * 0.6 + offset.current) * 0.06;
    if (meshRef.current) meshRef.current.position.y = position[1] + dy;
    if (rimRef.current)  rimRef.current.position.y  = position[1] + dy;
  });

  const R = 0.18;

  return (
    <group>
      {/* Colored rim ring — color-blind identifier */}
      <mesh ref={rimRef} position={position}>
        <sphereGeometry args={[R * 1.16, 24, 24]} />
        <meshBasicMaterial
          color={color} side={THREE.BackSide} transparent
          opacity={hovered ? 0.70 : isExample ? 0.16 : 0.38}
        />
      </mesh>

      {/* Frosted glass sphere */}
      <mesh
        ref={meshRef}
        position={position}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerEnter={() => { setHovered(true);  document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[R, 28, 28]} />
        <MeshTransmissionMaterial
          transmission={1}
          thickness={0.8}
          roughness={isExample ? 0.42 : 0.15}
          ior={1.4}
          chromaticAberration={0.03}
          backside={false}
          temporalDistortion={0.10}
          color="#f5f7ff"
          attenuationColor={color}
          attenuationDistance={0.6}
          samples={2}
        />
      </mesh>

      {/* Label — Text (fast for many small labels) */}
      <Text
        position={[position[0], position[1] + 0.30, position[2]]}
        fontSize={0.105}
        color={isExample ? 'rgba(160,155,200,0.65)' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.4}
        outlineWidth={0.007}
        outlineColor="#00000088"
      >
        {isFree ? `★ ${label}` : label}
      </Text>
    </group>
  );
}

// ─── Process Node ─────────────────────────────────────────────────────────────

function ProcessNode({
  branch, items, freeNodes, isSelected, onSelect, onLeafSelect,
}: {
  branch: typeof BRANCHES[number];
  items: string[];
  freeNodes: FreeNode[];
  isSelected: boolean;
  onSelect: () => void;
  onLeafSelect: (label: string, content: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rimRef  = useRef<THREE.Mesh>(null);
  const offset  = useRef(Math.random() * Math.PI * 2);
  const pos     = useMemo(() => branchPos(branch.angle, HEX_R), [branch.angle]);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const dy = Math.sin(clock.elapsedTime * 0.5 + offset.current) * 0.10;
    if (meshRef.current) meshRef.current.position.y = pos[1] + dy;
    if (rimRef.current)  rimRef.current.position.y  = pos[1] + dy;
  });

  const LEAF_R     = 1.6;
  const allItems   = items.length > 0 ? items : branch.examples;
  const isExData   = items.length === 0;

  const leafPos = useMemo(() => allItems.map((_, i) => {
    const spread = allItems.length <= 1 ? 0 : (i / (allItems.length - 1) - 0.5) * Math.PI * 0.9;
    return branchPos(branch.angle + spread * (180 / Math.PI), HEX_R + LEAF_R);
  }), [allItems, branch.angle]);

  const freePos = useMemo(() => freeNodes.map((_, i) => {
    const spread = freeNodes.length <= 1 ? 0 : (i / (freeNodes.length - 1) - 0.5) * Math.PI * 0.6;
    return branchPos(branch.angle + spread * (180 / Math.PI) + 30, HEX_R + LEAF_R + 0.5);
  }), [freeNodes, branch.angle]);

  const R = 0.42;

  return (
    <group>
      {/* Center → process line */}
      <Line
        points={[[0, 0, 0], pos]}
        color={branch.color}
        lineWidth={isSelected ? 2.2 : 1.2}
        transparent
        opacity={isSelected ? 0.75 : 0.42}
      />

      {/* Colored rim ring — BackSide sphere gives Fresnel edge glow */}
      <mesh ref={rimRef} position={pos}>
        <sphereGeometry args={[R * 1.15, 32, 32]} />
        <meshBasicMaterial
          color={branch.color} side={THREE.BackSide} transparent
          opacity={isSelected ? 0.65 : hovered ? 0.52 : 0.28}
        />
      </mesh>

      {/* Frosted glass sphere */}
      <mesh
        ref={meshRef}
        position={pos}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerEnter={() => { setHovered(true);  document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[R, 48, 48]} />
        <MeshTransmissionMaterial
          transmission={1}
          thickness={0.8}
          roughness={0.12}
          ior={1.45}
          chromaticAberration={0.035}
          backside
          temporalDistortion={0.09}
          color="#f5f7ff"
          attenuationColor={branch.color}
          attenuationDistance={1.0}
          samples={4}
        />
      </mesh>

      {/* Glass label card — Html for full glassmorphism */}
      <Html center distanceFactor={8} position={[pos[0], pos[1] + 0.70, pos[2]]}>
        <div style={{
          background:          'rgba(255,255,255,0.08)',
          backdropFilter:      'blur(14px)',
          WebkitBackdropFilter:'blur(14px)',
          border:              `1px solid ${branch.color}45`,
          borderTop:           `1px solid ${branch.color}70`,
          boxShadow:           `inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 16px rgba(0,0,0,0.4)`,
          borderRadius:        '8px',
          padding:             '4px 12px',
          color:               branch.color,
          fontSize:            '11px',
          fontWeight:          '700',
          letterSpacing:       '0.025em',
          whiteSpace:          'nowrap',
          userSelect:          'none',
          pointerEvents:       'none',
          textShadow:          `0 0 10px ${branch.color}90`,
        }}>
          {branch.label}
        </div>
      </Html>

      {/* Leaves */}
      {allItems.map((item, i) => (
        <group key={`lf-${branch.id}-${i}`}>
          <Line
            points={[pos, leafPos[i]]}
            color={branch.color} lineWidth={0.7}
            transparent opacity={isExData ? 0.18 : 0.30}
          />
          <LeafNode
            label={item.length > 22 ? item.slice(0, 22) + '…' : item}
            position={leafPos[i]} color={branch.color}
            isExample={isExData}
            onSelect={() => onLeafSelect(item, '')}
          />
        </group>
      ))}

      {/* Free nodes */}
      {freeNodes.map((fn, i) => (
        <group key={`fn-${fn.id}`}>
          <Line
            points={[pos, freePos[i]]}
            color={branch.color} lineWidth={0.9}
            transparent opacity={0.44}
          />
          <LeafNode
            label={fn.label.length > 22 ? fn.label.slice(0, 22) + '…' : fn.label}
            position={freePos[i]} color={branch.color}
            isExample={false}
            onSelect={() => onLeafSelect(fn.label, fn.content)}
            isFree
          />
        </group>
      ))}
    </group>
  );
}

// ─── Slow auto-rotation wrapper ───────────────────────────────────────────────

function SceneRotator({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.014;
  });
  return <group ref={ref}>{children}</group>;
}

// ─── OrbitControls with reset ref ─────────────────────────────────────────────

type OcType = { reset: () => void };

function ControlsCapture({ cr }: { cr: React.MutableRefObject<OcType | null> }) {
  return (
    <OrbitControls
      ref={(r) => { cr.current = r as OcType | null; }}
      enableDamping dampingFactor={0.08}
      minDistance={4} maxDistance={30}
    />
  );
}

// ─── Inner 3D scene (everything inside Canvas) ───────────────────────────────

function InnerScene({
  patient, formulation, freeNodes,
  selectedBranch, onSelectBranch, onLeafSelect, cr,
}: {
  patient: Patient;
  formulation?: Formulation | null;
  freeNodes: FreeNode[];
  selectedBranch: BranchId | null;
  onSelectBranch: (id: BranchId | null) => void;
  onLeafSelect: (label: string, content: string) => void;
  cr: React.MutableRefObject<OcType | null>;
}) {
  return (
    <>
      <color attach="background" args={['#020008']} />

      {/* Lights — warm-white key + color fill for glass */}
      <ambientLight intensity={0.12} />
      <pointLight position={[0,  0,  6]}  intensity={2.0} color="#ffffff"  />
      <pointLight position={[9,  7,  5]}  intensity={0.55} color="#9933FF" />
      <pointLight position={[-9,-7,  5]}  intensity={0.55} color="#3366FF" />
      <pointLight position={[0, -10, 5]}  intensity={0.40} color="#FF4488" />

      {/* HDRI environment — gives glass something to refract/reflect */}
      <Environment preset="night" />

      <NebulaBackground />

      <SceneRotator>
        <CenterHex patientName={patient.adSoyad} />
        {BRANCHES.map(branch => {
          const raw      = formulation ? formulation[branch.actKey] : undefined;
          const items    = parseItems(raw as string | undefined);
          const freeB    = freeNodes.filter(n => n.parent_process === branch.id);
          return (
            <ProcessNode
              key={branch.id}
              branch={branch}
              items={items}
              freeNodes={freeB}
              isSelected={selectedBranch === branch.id}
              onSelect={() => onSelectBranch(selectedBranch === branch.id ? null : branch.id)}
              onLeafSelect={onLeafSelect}
            />
          );
        })}
      </SceneRotator>

      <ControlsCapture cr={cr} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.28} luminanceSmoothing={0.85} intensity={0.60} />
      </EffectComposer>
    </>
  );
}

// ─── Glass overlay panel style ─────────────────────────────────────────────────

const glassPanelStyle: React.CSSProperties = {
  background:          'rgba(255,255,255,0.05)',
  backdropFilter:      'blur(18px)',
  WebkitBackdropFilter:'blur(18px)',
  border:              '1px solid rgba(255,255,255,0.12)',
  borderTop:           '1px solid rgba(255,255,255,0.22)',
  boxShadow:           '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
  borderRadius:        '14px',
};

// ─── Main exported component ──────────────────────────────────────────────────

export default function DanisanMindMap3DScene({ patient, formulation, seanslar }: Props) {
  const [selectedBranch, setSelectedBranch] = useState<BranchId | null>(null);
  const [selectedLeaf,   setSelectedLeaf]   = useState<{ label: string; content: string } | null>(null);
  const [freeNodes,      setFreeNodes]      = useState<FreeNode[]>([]);
  const [addingNode,     setAddingNode]     = useState(false);
  const [newLabel,       setNewLabel]       = useState('');
  const cr = useRef<OcType | null>(null);

  const patientId = (patient as Patient & { id?: string }).id ?? '';

  useEffect(() => {
    if (!patientId) return;
    fetch(`/api/mindmap?patientId=${patientId}`)
      .then(r => r.json())
      .then((rows: FreeNode[]) => setFreeNodes(rows))
      .catch(() => {});
  }, [patientId]);

  const handleAdd = useCallback(async () => {
    if (!selectedBranch || !newLabel.trim()) return;
    try {
      const res = await fetch('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, parentProcess: selectedBranch, label: newLabel.trim() }),
      });
      const { id } = await res.json() as { id: string };
      setFreeNodes(prev => [...prev, {
        id, patient_id: patientId, parent_process: selectedBranch,
        label: newLabel.trim(), content: '', created_at: new Date().toISOString(),
      }]);
      setNewLabel('');
      setAddingNode(false);
    } catch { /* ignore */ }
  }, [selectedBranch, newLabel, patientId]);

  const selBranchData = BRANCHES.find(b => b.id === selectedBranch);

  return (
    <div className="relative w-full" style={{ height: '700px', background: '#020008' }}>

      {/* Canvas */}
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <InnerScene
          patient={patient}
          formulation={formulation}
          freeNodes={freeNodes}
          selectedBranch={selectedBranch}
          onSelectBranch={setSelectedBranch}
          onLeafSelect={(label, content) => setSelectedLeaf({ label, content })}
          cr={cr}
        />
      </Canvas>

      {/* ── Top-left title ── */}
      <div className="absolute top-4 left-5 pointer-events-none" style={{ zIndex: 10 }}>
        <div style={{
          ...glassPanelStyle,
          padding: '8px 14px',
          display: 'inline-block',
        }}>
          <p style={{ color: '#fff', fontSize: '12px', fontWeight: '700', margin: 0,
            textShadow: '0 0 10px rgba(150,80,255,0.8)' }}>
            ⬡ 3D ACT Hexaflex
          </p>
          <p style={{ color: 'rgba(200,180,255,0.75)', fontSize: '10px', margin: '2px 0 0',
            fontWeight: '400' }}>
            {patient.adSoyad}{seanslar && seanslar.length > 0 && ` · ${seanslar.length} seans`}
          </p>
        </div>
      </div>

      {/* ── Top-right reset ── */}
      <div className="absolute top-4 right-5" style={{ zIndex: 10 }}>
        <button
          onClick={() => cr.current?.reset()}
          title="Resetle"
          style={{
            ...glassPanelStyle,
            width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(200,180,255,0.8)',
            fontSize: '18px',
            cursor: 'pointer',
            border: '1px solid rgba(180,150,255,0.2)',
          }}
        >↺</button>
      </div>

      {/* ── Branch action panel (bottom-left) ── */}
      {selBranchData && (
        <div className="absolute bottom-5 left-5" style={{ zIndex: 10, minWidth: '210px', maxWidth: '280px' }}>
          <div style={{ ...glassPanelStyle, padding: '12px 14px' }}>
            <p style={{ color: selBranchData.color, fontSize: '12px', fontWeight: '700',
              margin: '0 0 8px', textShadow: `0 0 8px ${selBranchData.color}80` }}>
              {selBranchData.label}
            </p>
            {addingNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  autoFocus
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAdd();
                    if (e.key === 'Escape') { setAddingNode(false); setNewLabel(''); }
                  }}
                  placeholder="Yeni not…"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    color: '#fff',
                    fontSize: '11px',
                    outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={handleAdd} style={{
                    flex: 1,
                    background: `${selBranchData.color}28`,
                    border: `1px solid ${selBranchData.color}55`,
                    borderRadius: '7px',
                    padding: '4px 0',
                    color: selBranchData.color,
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}>Ekle</button>
                  <button onClick={() => { setAddingNode(false); setNewLabel(''); }} style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: '7px',
                    padding: '4px 10px',
                    color: 'rgba(200,200,220,0.7)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}>İptal</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingNode(true)} style={{
                background: `${selBranchData.color}20`,
                border: `1px solid ${selBranchData.color}40`,
                borderRadius: '8px',
                padding: '5px 12px',
                color: selBranchData.color,
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
              }}>+ Serbest Node Ekle</button>
            )}
          </div>
        </div>
      )}

      {/* ── Leaf info panel (bottom-right) ── */}
      {selectedLeaf && (
        <div className="absolute bottom-5 right-5" style={{ zIndex: 10, maxWidth: '250px' }}>
          <div style={{ ...glassPanelStyle, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <p style={{ color: '#fff', fontSize: '12px', fontWeight: '600',
                margin: 0, lineHeight: 1.35 }}>{selectedLeaf.label}</p>
              <button onClick={() => setSelectedLeaf(null)} style={{
                background: 'none', border: 'none',
                color: 'rgba(200,180,255,0.5)',
                fontSize: '14px', cursor: 'pointer', lineHeight: 1, flexShrink: 0,
              }}>✕</button>
            </div>
            {selectedLeaf.content && (
              <p style={{ color: 'rgba(200,190,230,0.75)', fontSize: '11px',
                margin: '8px 0 0', lineHeight: 1.5 }}>{selectedLeaf.content}</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
