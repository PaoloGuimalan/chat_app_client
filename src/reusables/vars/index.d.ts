export {};

declare global {
  interface Window {
    locationiq: {
        key: string;
    };
    locationiqLayerControl: any;
  }
}