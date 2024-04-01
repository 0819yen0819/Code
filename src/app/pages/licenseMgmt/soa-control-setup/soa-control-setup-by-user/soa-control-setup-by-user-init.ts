import { DataTableSettings } from 'src/app/core/model/data-table-view';

export const soaControlTabelSetting: DataTableSettings = {
  isSelectMode: true,
  isShowNoDataInfo: true,
  isAddMode: true,
  isForceShowTable: true,
  isPaginationMode: true,
  isEditedMode: true,
  isScrollable: true,
  isFuzzySearchMode: true,
  isColSelectorMode: true,
  isSortMode: true,
  noDataConText: '無資料',
  isDeleteMode: false,
  lazyMode: true,
  templateBelongTo: null,
  data: null,
};

export const getFormValueDefault = {
  group: null,
  selectedOu: null,
  cvType: 'Customer',
  cvValue: null,
  flag: 'Y',
};

export const getDialogDefault = {
  group: null,
  ouCode: '',
  flag: false,
  ouName: '',
  vcType: 'Customer',
  vcCode: null,
  validFrom: null,
  remark: '',
  vcLabel: '',
};
