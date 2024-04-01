import { DataTableSettings } from 'src/app/core/model/data-table-view';
import { SOAExclusionControlInfoDialog } from './interface';

export const soaControlTabelSetting: DataTableSettings = {
  isSelectMode: true,
  isShowNoDataInfo: true,
  isAddMode: true,
  isForceShowTable: true,
  isPaginationMode: false,
  isEditedMode: true,
  isScrollable: true,
  isFuzzySearchMode: true,
  isColSelectorMode: true,
  isSortMode: true,
  noDataConText: '',
  isDeleteMode: false,
  lazyMode: false,
  templateBelongTo: null,
  data: null,
};

export const getFormValueDefault = {
  group: null,
  brand: null,
  cvType: 'Customer',
  cvValue: null,
  flag: 'Y',
};

export const getDialogDefault: SOAExclusionControlInfoDialog = {
  group: null,
  vcType: 'Customer',
  vcCode: null,
  vcName: null,
  brand: null,
  validFrom: new Date().getTime(),
  flag: 'Y',
  remark: null,
};
