// Runtime config injected by Terraform via public/config.js (loaded in <head>).
// The Hosted UI implicit grant and all API calls depend on these values.

export interface VBConfig {
  apiBaseUrl: string;
  cognitoUserPoolId: string;
  cognitoClientId: string;
  cognitoDomain: string;
  awsRegion: string;
}

declare global {
  interface Window {
    VB_CONFIG: VBConfig;
  }
}

/** Returns the runtime config, or a safe empty object during SSR / static export. */
export function getConfig(): VBConfig {
  if (typeof window === "undefined") {
    return {
      apiBaseUrl: "",
      cognitoUserPoolId: "",
      cognitoClientId: "",
      cognitoDomain: "",
      awsRegion: "",
    };
  }
  return window.VB_CONFIG ?? {
    apiBaseUrl: "",
    cognitoUserPoolId: "",
    cognitoClientId: "",
    cognitoDomain: "",
    awsRegion: "",
  };
}
