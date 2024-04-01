export const TABLE_HEADER_SOC_DEFAULT = [
    { line1: { label: 'Approve', field: '' }, line2: { label: '', field: '' } },
    { line1: { label: 'Reject', field: '' }, line2: { label: '', field: '' } },
    { line1: { label: 'Line', field: 'lineNumber' }, line2: { label: '', field: '' } },
    { line1: { label: 'Sales Cost Type', field: 'salesCostType' }, line2: { label: '', field: '' } },
    { line1: { label: 'End customer', field: 'endCustomer' }, line2: { label: '', field: '' } },
    { line1: { label: 'Margin%', field: 'salesMargin' }, line2: { label: '', field: '' } },
    { line1: { label: 'Sales Person', field: 'salesNameString' }, line2: { label: 'Customer PO', field: 'custPo' } },
    { line1: { label: 'Item Number', field: 'productCode' }, line2: { label: 'Item Type', field: 'itemType' } },
    { line1: { label: 'Change Date', field: 'changeDate' }, line2: { label: 'Change Reason', field: 'changeReason' } },
    { line1: { label: 'Old Unit Price', field: 'oldUc' }, line2: { label: 'New Unit Price', field: 'newUc' } },
    { line1: { label: 'Old Quantity', field: 'oldQuantityString' }, line2: { label: 'New Quantity', field: 'newQuantityString' } },
    { line1: { label: 'Old Amount', field: 'oldAmountString' }, line2: { label: 'New Amount', field: 'newAmountString' } },
    { line1: { label: 'Old CRD', field: 'oldCrdString' }, line2: { label: 'New CRD', field: 'newCrdString' } },
    { line1: { label: 'Ship Term', field: 'shipTerm' }, line2: { label: 'Military', field: 'military' } },
    { line1: { label: 'Brand', field: 'brand' }, line2: { label: 'Category', field: 'category' } },
    { line1: { label: 'Hold Remark', field: 'holdRemark' }, line2: { label: 'Comments', field: 'comments' } },
]


export const TABLE_HEADER_SO_STD_CHG3 = [
    { line1: { label: 'Approve', field: '' }, line2: { label: '', field: '' } },
    { line1: { label: 'Reject', field: '' }, line2: { label: '', field: '' } },
    { line1: { label: 'Line', field: 'lineNumber' }, line2: { label: '', field: '' } },
    { line1: { label: 'Sales Person', field: 'salesNameString' }, line2: { label: 'Customer PO', field: 'custPo' } },
    { line1: { label: 'Item Number', field: 'productCode' }, line2: { label: 'Item Type', field: 'itemType' } },
    { line1: { label: 'Change Date', field: 'changeDate' }, line2: { label: 'Change Reason', field: 'changeReason' } },
    { line1: { label: 'Old Unit Price', field: 'oldUc' }, line2: { label: 'New Unit Price', field: 'newUc' } },
    { line1: { label: 'Old Quantity', field: 'oldQuantityString' }, line2: { label: 'New Quantity', field: 'newQuantityString' } },
    { line1: { label: 'Old Amount', field: 'oldAmountString' }, line2: { label: 'New Amount', field: 'newAmountString' } },
    { line1: { label: 'Old CRD', field: 'oldCrdString' }, line2: { label: 'New CRD', field: 'newCrdString' } },
    { line1: { label: 'Old SSD', field: 'oldSsdString' }, line2: { label: 'New SSD', field: 'newSsdString' } },
    { line1: { label: 'Ship Term', field: 'shipTerm' }, line2: { label: 'Military', field: 'military' } },
    { line1: { label: 'Brand', field: 'brand' }, line2: { label: 'Category', field: 'category' } },
    { line1: { label: 'Hold Remark', field: 'holdRemark' }, line2: { label: 'Comments', field: 'comments' } }
]


export const TABLE_HEADER_SO_STD_CHG2 = [
    { line1: { label: 'Approve', field: '' }, line2: { label: '', field: '' } },
    { line1: { label: 'Reject', field: '' }, line2: { label: '', field: '' } },
    { line1: { label: 'Line', field: 'lineNumber' }, line2: { label: '', field: '' } },

    { line1: { label: 'Item Number', field: 'productCode' }, line2: { label: '', field: '' } },
    { line1: { label: 'Sales Cost Type', field: 'salesCostType' }, line2: { label: '', field: '' } },
    { line1: { label: 'Margin%', field: 'salesMargin' }, line2: { label: '', field: '' } },
    { line1: { label: 'Ship Term', field: 'shipTerm' }, line2: { label: '', field: '' } },
    { line1: { label: 'End customer', field: 'endCustomer' }, line2: { label: '', field: '' } },

    { line1: { label: 'Sales Person', field: 'salesNameString' }, line2: { label: 'Customer PO', field: 'custPo' } },
    { line1: { label: 'Change Date', field: 'changeDate' }, line2: { label: 'Change Reason', field: 'changeReason' } },
    { line1: { label: 'Old Unit Price', field: 'oldUc' }, line2: { label: 'New Unit Price', field: 'newUc' } },
    { line1: { label: 'Old Quantity', field: 'oldQuantityString' }, line2: { label: 'New Quantity', field: 'newQuantityString' } },
    { line1: { label: 'Old Amount', field: 'oldAmountString' }, line2: { label: 'New Amount', field: 'newAmountString' } },

    { line1: { label: 'Old CRD', field: 'oldCrdString' }, line2: { label: 'New CRD', field: 'newCrdString' } },

    { line1: { label: 'Brand', field: 'brand' }, line2: { label: 'Category', field: 'category' } },
    { line1: { label: 'Hold Remark', field: 'holdRemark' }, line2: { label: 'Comments', field: 'comments' } }
]


// 要縮小的欄位名稱
export const CONFIG_SMALL_SIZE_FILED = [
    'Approve', 'Reject', 'Line', 'Old Unit Price', 'Old Quantity', 'Old Amount', 'Brand', 'Ship Term', 'Margin%', 'End customer'
];

export const CONFIG_MID_SIZE_FILED = [
    'Sales Person', 'Item Number', 'Change Date', 'Hold Remark'
];

// 日期欄位
export const CONFIG_DATE_FILED = ['Change Date', 'Old CRD', 'New CRD','Old SSD','New SSD'];
// 價格欄位變數
export const CONFIG_PRICE_FILED = ['oldUc', 'newUc', 'oldQuantity', 'newQuantity', 'oldAmount', 'newAmount'];
// 價格欄位Label
export const CONFIG_PRICE_COLS = ['Old Unit Price', 'New Unit Price', 'Old Quantity', 'New Quantity', 'Old Amount', 'New Amount'];
// 不換行
export const CONFIG_NO_WRAP_COLS = ['Old CRD', 'New CRD']
// 比較上下資料是否一致的欄位
// export const CONFIG_COMPARE_COLS = ['Old Unit Price','Old Quantity','Old Amount','Old CRD','Old SSD']

// 手機板縮放的欄位 (不被隱藏的)
export const MOBILE_CORE_COLS = ['lineNumber','productCode','salesCostType','salesMargin','holdRemark',
'oldQuantityString','newQuantityString','oldUc','newUc']

export const MOBILE_CORE_COLS_CHG3 = ['lineNumber','productCode','salesCostType','salesMargin','holdRemark',
'oldQuantityString','newQuantityString','oldUc','newUc','itemType','oldCrdString','newCrdString']