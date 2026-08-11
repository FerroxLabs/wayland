declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*?raw' {
  const content: string;
  export default content;
}

// Vite `?url` imports: the file is emitted as a build asset and the import
// resolves to its URL (used for the bundled ORT WASM runtime).
declare module '*?url' {
  const url: string;
  export default url;
}

declare module 'unocss';
