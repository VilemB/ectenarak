declare module "animejs" {
  const anime: {
    (params: any): any;
    remove: (targets: string | Element | Element[]) => void;
  };
  export default anime;
}
