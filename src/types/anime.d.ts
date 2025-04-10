declare module "animejs" {
  interface AnimeParams {
    targets?: string | Element | Element[] | NodeList;
    duration?: number;
    delay?: number | ((el: Element, i: number, t: Element[]) => number);
    endDelay?: number;
    easing?: string;
    direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
    loop?: boolean | number;
    autoplay?: boolean;
    [key: string]: unknown;
  }

  interface AnimeInstance {
    play: () => AnimeInstance;
    pause: () => AnimeInstance;
    restart: () => AnimeInstance;
    seek: (time: number) => AnimeInstance;
    [key: string]: unknown;
  }

  const anime: {
    (params: AnimeParams): AnimeInstance;
    remove: (targets: string | Element | Element[]) => void;
  };
  export default anime;
}
