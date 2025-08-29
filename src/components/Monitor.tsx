import { useGLTF, Html } from "@react-three/drei";
import { useControls, folder } from 'leva';
import { useScene } from "@/lib/contexts/SceneContext";
import InteractiveBox from "@/components/InteractiveBox";

const MonitorTooltipContent = () => (
	<Html>
		<div style={{ textAlign: 'center' }}>
			<div>Press ENTER</div>
			<div>to use computer.</div>
		</div>
	</Html>
);

export default function Monitor({
	proximityPosition,
	collisionPosition,
}) {
	const { monitor } = useScene();
	const monitorModel = useGLTF('/models/monitor.glb');

	const {
		monitorRotationY,
		monitorX,
		monitorY,
		monitorZ,
	} = useControls({
		Monitor: folder({
			monitorRotationY: { value: monitor?.rotation?.y, min: -5, max: Math.PI * 2, step: 0.01 },
			monitorX: { value: monitor?.position?.x, min: -20, max: 10, step: 0.01 },
			monitorY: { value: monitor?.position?.y, min: -10, max: 10, step: 0.01 },
			monitorZ: { value: monitor?.position?.z, min: -20, max: 10, step: 0.01 },
		}),
	});

	return (
		<group>
			<primitive
				object={monitorModel.scene}
				position={[monitorX, monitorY, monitorZ]}
				rotation={[0, monitorRotationY, 0]}
			/>
			<InteractiveBox
				position={[monitorX, monitorY, monitorZ]}
				tooltipContent={<MonitorTooltipContent />}
				proximityPosition={proximityPosition}
			/>
			{/* Collision for monitor */}
			<mesh position={collisionPosition} visible={false}>
				<boxGeometry args={[1.4, 1.2, 1]} />
			</mesh>
		</group>
	);
};

useGLTF.preload('/models/monitor.glb');