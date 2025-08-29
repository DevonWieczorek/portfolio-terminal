import { Vector3 } from "three";
import { useGLTF, Html } from "@react-three/drei";
import { useControls, folder } from 'leva';
import { useScene } from "@/lib/contexts/SceneContext";
import InteractiveBox from "@/components/InteractiveBox";

type MonitorTooltipContentType = () => JSX.Element;

const MonitorTooltipContent: MonitorTooltipContentType = () => (
	<Html>
		<div style={{ textAlign: 'center' }}>
			<div>Press ENTER</div>
			<div>to use computer.</div>
		</div>
	</Html>
);

interface MonitorProps {
	proximityPosition: PositionArray;
	collisionPosition: PositionArray;
};

type MonitorType = (props: MonitorProps) => JSX.Element;

interface ControlValue {
	[key: string]: number;
}

interface ControlValues {
	[key: string]: ControlValue;
};

const Monitor: MonitorType = ({
	proximityPosition,
	collisionPosition
}) => {
	const { monitor } = useScene();
	const monitorModel = useGLTF("/models/monitor.glb");

	const controls: ControlValues = useControls({
		Monitor: folder({
			monitorRotationY: {
				value: monitor?.rotation?.y,
				min: -5,
				max: Math.PI * 2,
				step: 0.01,
			},
			monitorX: {
				value: monitor?.position?.x,
				min: -20,
				max: 10,
				step: 0.01,
			},
			monitorY: {
				value: monitor?.position?.y,
				min: -10,
				max: 10,
				step: 0.01,
			},
			monitorZ: {
				value: monitor?.position?.z,
				min: -20,
				max: 10,
				step: 0.01,
			},
		} as any), // TODO: Fix type
	});

	const { monitorRotationY, monitorX, monitorY, monitorZ } = controls;

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
				proximityPosition={proximityPosition as Vector3}
			/>
			{/* Collision for monitor */}
			<mesh position={collisionPosition} visible={false}>
				<boxGeometry args={[1.4, 1.2, 1]} />
			</mesh>
		</group>
	);
};

export default Monitor;
useGLTF.preload('/models/monitor.glb');