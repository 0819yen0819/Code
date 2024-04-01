export const TABLE_HEADER_NSO_DEFAULT = [
    { label: 'Approve', field: '', isApproveField: true, colSize: 'xs-col' },
    { label: 'Reject', field: '', isApproveField: true, colSize: 'xs-col' },
    { label: 'Line', field: 'lineNumber', isApproveField: false, colSize: 'xxs-col' },
    { label: 'Sales Person', field: 'salesNameString', isApproveField: false, colSize: 'sm-col' },
    { label: 'Customer PO', field: 'custPo', isApproveField: false, colSize: 'sm-col' },
    { label: 'Item Number', field: 'productCode', isApproveField: false, colSize: 'sm-col' },
    { label: 'Brand', field: 'brand', isApproveField: false, colSize: 'xs-col' },
    { label: 'Quota Price', field: 'quotaPrice', isApproveField: false, colSize: 'xs-col' },
    { label: 'Unit Price', field: 'newUc', isApproveField: false, colSize: 'xs-col' },
    { label: 'Quantity', field: 'newQuantityString', isApproveField: false, colSize: 'xs-col' },
    { label: 'Amount', field: 'newAmountString', isApproveField: false, colSize: 'xs-col' },
    { label: 'Sales Cost Type', field: 'salesCostType', isApproveField: false, colSize: 'xs-col' },
    { label: 'Sales Cost', field: 'salesCost', isApproveField: false, colSize: 'xs-col' },
    { label: 'Sales Margin%', field: 'salesMargin', isApproveField: false, colSize: 'xs-col' },
    { label: 'CRD', field: 'newCrd', isApproveField: false, colSize: 'sm-col' },
    { label: 'Payment Term', field: 'paymentTermByLang', isApproveField: false, colSize: 'sm-col' },
    { label: 'Ship Term', field: 'shipTerm', isApproveField: false, colSize: 'sm-col' },
    { label: 'End Customer', field: 'endCustomer', isApproveField: false, colSize: 'sm-col' },
    { label: 'Hold Remark', field: 'holdRemark', isApproveField: false, colSize: 'sm-col' },
    { label: 'Send PM', field: 'sendPmFlag', isApproveField: false, colSize: 'xxs-col' },
    { label: 'Comments', field: 'comments', isApproveField: false, colSize: 'sm-col' }
]

// 手機板縮放的欄位 (不被隱藏的)
export const MOBILE_CORE_COLS = ['lineNumber','productCode','salesCostType','salesMargin',
'newUc','newQuantityString','holdRemark']
