// src/google-maps.d.ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        ref?: React.RefObject<any>;
      };
    }
  }
}
export {};
