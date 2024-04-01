/**
 * @params field 對應 Data key
 * @params label 對應 Thead text
 * @params isDisabled 對應 table col selector 可否選擇
 * @params isFittedCol 對應 target table col 是否最窄化
 **/

export interface TableCol {
  field: string;
  label: string;
  isDisabled?: string;
  isFittedCol?: boolean;
  useTemplateType?: 'dropdown' | 'input' | 'radio';
  templateBelongTo?:string
}
