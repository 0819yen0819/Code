// Main Table 欄位設定
export const tableCols: any[] = [
    { header: 'APPROVING_LEH.Label.EUC', field: 'euc' },
    { header: 'APPROVING_LEH.Label.Brand', field: 'brand' },
    { header: 'APPROVING_LEH.Label.Item', field: 'item' },
    { header: 'APPROVING_LEH.Label.Qty', field: 'qty' },
    { header: 'APPROVING_LEH.Label.CtmPo', field: 'ctmpo' },
    { header: 'APPROVING_LEH.Label.ECCN', field: 'eccn' },
    { header: 'APPROVING_LEH.Label.CCATs', field: 'ccats' },
    { header: 'APPROVING_LEH.Label.Proviso', field: 'proviso' },
    { header: 'APPROVING_LEH.Label.ExceptionHoldReason', field: 'exceptionHoldReason' },
    { header: 'APPROVING_LEH.Label.BillToCountry', field: 'billToCountry' },
    { header: 'APPROVING_LEH.Label.BillTo', field: 'billTo' },
    { header: 'APPROVING_LEH.Label.ShipToCountry', field: 'shipToCountry' },
    { header: 'APPROVING_LEH.Label.ShipTo', field: 'shipTo' },
    { header: 'APPROVING_LEH.Label.DeliverToCountry', field: 'deliverToCountry' },
    { header: 'APPROVING_LEH.Label.DeliverTo', field: 'deliverTo' },
];

// euc Table 欄位設定
export const eucCols: any[] = [
    { header: '', field: 'space' },
    { header: 'Document No', field: 'documentNo' },
    { header: 'Item', field: 'item' },
    { header: 'Qty', field: 'qty' },
    { header: 'Period from to', field: 'period' },
    { header: 'APPROVING_LEH.Label.GovermentUnit', field: 'govermentUnit' },
    { header: 'APPROVING_LEH.Label.CivillianEndUser', field: 'civillianEU' },
    { header: 'APPROVING_LEH.Label.CillianEndUse', field: 'cillianEU' },
]

// 副表中需要在HTML中顯示為Checkbox而非字串的euc欄位
export const eucCheckBoxList: string[] = [
    'govermentUnit',
    'civillianEU',
    'cillianEU'
]

// 簽核歷程欄位
export const historyCols = [
    { field: 'stepNumber', label: 'Step' },
    { field: 'completeTime', label: 'Time' },
    { field: 'signerCode', label: 'Signer Name' },
    { field: 'signerDeptName', label: 'Dept' },
    { field: 'remark', label: 'Action' },
    { field: 'signComment', label: 'Opinion' },
    { field: 'signerPhoneNumber', label: 'Mobile' }
];
