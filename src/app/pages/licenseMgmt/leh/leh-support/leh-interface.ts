export interface IHeaderSetting {
    header: string,
    field: string
}

export interface IColSetting {
    col: string,
    content: string
}

export interface IMainTableData {
    euc: number
    brand: string,
    item: string,
    qty: number,
    ctmPo: string,
    eccn: string,
    ccats: string,
    proviso: string,
    exceptionHoldReason: string,
    billToCountry: string,
    billTo: string,
    shipToCountry: string,
    shipTo: string,
    deliverToCountry: string,
    deliverTo: string
}

export interface IEucTableData {
    documentNo: string,
    item: string,
    qty: number,
    period: string,
    govermentUnit: boolean,
    civillianEU: boolean,
    cillianEU: boolean
}



