export interface DialogSettingParams {
  title?: string;
  visiable: boolean;
  modal?: boolean;
  maximized?: boolean;
  draggable?: boolean;
  resizeable?: boolean;
  blockScroll?: boolean;
  data?: any;
  mode?: string;
}

export interface SelectorDialogParams extends DialogSettingParams {
  type: string;
}

export interface NoticeDialogParams extends DialogSettingParams {
  mode: 'info' | 'success' | 'warring' | 'error';
}
