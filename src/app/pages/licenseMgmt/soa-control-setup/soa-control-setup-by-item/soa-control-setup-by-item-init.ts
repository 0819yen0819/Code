import { DataTableParams } from 'src/app/core/model/data-table-view';

export const soaControlTabelSetting: DataTableParams = {
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
  isUpdateMode: true
};

export const getFormValueDefault = {
  brand: '',
  ctg1: '',
  ctg2: '',
  ctg3: '',
  eccn: '',
  item: '',
  validFrom: new Date(),
  flag: 'Y',
  specialApproval: '',
};

export const getDialogDefault = {
  flag: 'Y',
  vcType: 'Customer',
  vcCode: '',
  validFrom: '',
  remark: '',
  vcLabel: '',
  brand: '',
  ctg1: '',
  ctg2: '',
  ctg3: '',
  eccn: '',
  item: '',
};
