export interface SelectedDataTable {
  key: string;
}

/** Data table settings
 * @param isSelectMode 刪除模式
 * @param isDeleteMode 刪除模式
 * @param isAddMode 新增
 * @param isForceShowTable 強制顯示 header sections
 * ( 只對 header 父元素做控制 )
 * @param isShowNoDataInfo 顯示沒資料區塊
 * @param isPaginationMode 分頁
 * @param isEditedMode 編輯單筆
 * @param isScrollable 可滾動
 * @param isFuzzySearchMode 模糊查詢
 * @param isColSelectorMode 欄位篩選
 * @param isSortMode 排序
 * @param templateBelongTo 若 table 內需加入編輯，則需多加這個tag
 * @param noDataConText 無資料時顯示字樣 Optional
 * @param data 需要 pass data to data table DOM
 **/

export interface DataTableParams {
  lazyMode: boolean;
  isSelectMode: boolean;
  isDeleteMode: boolean;
  isAddMode: boolean;
  isForceShowTable: boolean;
  isShowNoDataInfo: boolean;
  isPaginationMode: boolean;
  isEditedMode: boolean;
  isScrollable: boolean;
  isFuzzySearchMode: boolean;
  isColSelectorMode: boolean;
  isSortMode: boolean;
  isUpdateMode?: boolean;
  templateBelongTo: string | null;
  noDataConText: string;
  data: any;
}

export class DataTableSettings implements DataTableParams {
  lazyMode = false;
  isSelectMode = false;
  isDeleteMode = false;
  isAddMode = false;
  isForceShowTable = false;
  isShowNoDataInfo = false;
  isPaginationMode = false;
  isEditedMode = false;
  isScrollable = false;
  isFuzzySearchMode = false;
  isColSelectorMode = false;
  isSortMode = false;
  templateBelongTo = null;
  noDataConText = '';
  data = null;
}
