declare module 'asciichart' {
  type PlotOptions = {
    height?: number;
    format?: (x: number, i?: number) => string;
  };

  function plot(series: number[] | number[][], options?: PlotOptions): string;

  export = {
    plot
  };
}


