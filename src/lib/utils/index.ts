import { cloneDeep, merge } from "lodash-es";
import { Color, type ColorRepresentation, Line, Mesh } from "three";
import type { LineStyle } from "@/lib/interface";

export function addUserDataToMesh(mesh: Mesh | Line, userData: any) {
  mesh.userData = {
    ...mesh.userData,
    ...userData,
  };
}

export function mergeFlyLineStyle(
  { flyLineStyle, pathStyle }: LineStyle,
  override?: Partial<LineStyle>
): LineStyle {
  return merge(cloneDeep({ flyLineStyle, pathStyle }), override);
}

export function parseColorOpacity(input?: ColorRepresentation) {
  if (typeof input === "string") {
    const match = input.match(
      /rgba\s*\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)/i
    );
    if (match) {
      const r = Number(match[1]);
      const g = Number(match[2]);
      const b = Number(match[3]);
      const a = Math.max(0, Math.min(1, Number(match[4])));
      return { color: new Color(`rgb(${r}, ${g}, ${b})`), opacity: a };
    }
  }
  return { color: new Color(input), opacity: 1 };
}
