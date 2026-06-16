declare module "three" {
  export class Object3D {
    add(obj: unknown): void;
    rotation: { x: number; y?: number; z?: number };
  }

  export class Group extends Object3D {}

  export class Mesh extends Object3D {
    constructor(geometry?: unknown, material?: unknown);
    rotation: { x: number; y?: number; z?: number };
  }

  export class ConeGeometry {
    constructor(...args: number[]);
  }

  export class MeshStandardMaterial {
    constructor(opts?: Record<string, unknown>);
  }

  export class AmbientLight {
    constructor(color?: number, intensity?: number);
  }

  export class DirectionalLight {
    constructor(color?: number, intensity?: number);
  }

  export const Math: { PI: number };
}
