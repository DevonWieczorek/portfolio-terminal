import { Vector3 } from "three";
export {};

declare global {
    type DeepPartial<T> = {
        [P in keyof T]?: T[P] extends object
            ? T[P] extends Function
                ? T[P]
                : DeepPartial<T[P]>
            : T[P];
    };

    type PositionArray = [number, number, number] | Vector3;
}
