export const W = 800;
export const H = 500;
export const RAIL = 22;
export const BALL_R = 6;
export const CUP_R = 12;

export type Vec = { x: number; y: number };
/** s > 0 is a hill (ball rolls away from the centre), s < 0 is a hollow (ball rolls in). s is px/s² at its steepest. */
export type Hill = { x: number; y: number; r: number; s: number };
export type Blob = { x: number; y: number; rx: number; ry: number };
export type Hole = {
  name: string;
  par: number;
  ball: Vec;
  cup: Vec;
  hills: Hill[];
  sand: Blob[];
  water: Blob[];
};
