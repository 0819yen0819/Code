// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  envName: 'LOCAL',
  baseHref: '/portal/',
  apiUrl: 'https://itu7-apim.azure-api.net/dev-sofcheck-api/v1',
  apiPathPrefix: '/service/v1',
  workflowApiUrl: 'https://itu7-apim.azure-api.net/dev-work-flow-api/v1/workflow',
  apiUsageCode: '',
  apiKey: 'a6adb39cb25e4975ad7fbc0a447afc15',
  version: '1.0.0',
  clientId: '8305ae0f-3152-49f8-8c3f-1ad24902bd47',
  authority: 'https://login.microsoftonline.com/common',
  redirectUrl: 'http://localhost:4200/portal/redirect',
  postLogoutRedirectUri: 'http://localhost:4200/portal/login',
  sofcBaseHerf: 'https://dev-sofcheck.ibpaas.com/portal',
  devLoginDisplay: 'true',
  storeRedirectUrlPrefix: 'local',
  storeEmbedTargetOrigin: 'local'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
