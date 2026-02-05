declare module 'cal-heatmap' {
    export interface CalHeatmapOptions {
        itemSelector?: HTMLElement | string;
        range?: number;
        domain?: {
            type?: string;
            gutter?: number;
            label?: {
                text?: string | null;
                position?: string;
                textAlign?: string;
            };
        };
        subDomain?: {
            type?: string;
            radius?: number;
            width?: number;
            height?: number;
            gutter?: number;
            color?: string;
        };
        date?: {
            start?: Date;
        };
        data?: {
            source?: any;
            x?: string | ((datum: any) => number);
            y?: string | ((datum: any) => number);
            defaultValue?: any;
        };
        scale?: {
            color?: {
                type?: string;
                range?: string[];
                domain?: number[];
                scheme?: string;
            };
        };
    }

    export default class CalHeatmap {
        paint(options: CalHeatmapOptions): Promise<void>;
        destroy(): Promise<void>;
    }
}
