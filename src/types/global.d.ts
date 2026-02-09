import { Vector3 } from "three";
export {};

declare global {
    type Coordinate = [number, number, number];

    type Coordinates = {
        x: number;
        y: number;
        z: number;
    };

    type DeepPartial<T> = {
        [P in keyof T]?: T[P] extends object
            ? T[P] extends (...args: infer Args) => infer Return
                ? (...args: Args) => Return
                : DeepPartial<T[P]>
            : T[P];
    };

    type PositionArray = Coordinate | Vector3;
}
