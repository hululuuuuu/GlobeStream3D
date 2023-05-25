declare module "dva";
declare module "*.css";
declare module "*.less";
declare module "*.svg";
declare module "*.png";
declare module "*.json" {
  const content: object;
  export default content;
}
declare module "*.geojson" {
  const content: object;
  export default content;
}
