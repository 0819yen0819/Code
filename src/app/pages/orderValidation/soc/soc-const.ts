export const Test_formTitle = { 
	"code": "Success", 
	"message": "Success", 
	"formTypeId": "41C2FB01-26D6-43BB-8628-257FB21FFF0B", 
	"category": "LCM", 
	"formTypeNameC": "GBG_Sales Order Change", 
	"formTypeNameE": "Statement of Assurance Application", 
	"formType": "License_SOA", 
	"isWithdraw": "false", 
	"status": "Activate", 
	"display": "true", 
	"addUrl": "/licenseMgmt/soa", 
	"processKey": null 
}

export const Test_FormLog = {
	"seq":23719,
	"formNo":"SOA202304000887",
	"applicantId":"153206",
	"editUrl":null,
	"formTypeId":"41C2FB01-26D6-43BB-8628-257FB21FFF0B",
	"formTypeNameC":"貿易合規客戶確認函(SOA)申請單",
	"formTypeNameE":"Statement of Assurance Application",
	"remark":"Import ALL Group",
	status:"Approving",
	"subject":"Statement of Assurance Application,葉昕濠 Ray Yeh Apply,Customer/Vendor：211123(深圳市星礪達科技有限公司/SHENZHEN SENLD TECHNOLOGY CO., LTD.),Applied Company：296(大聯大投資控股股份有限公司)",
	"viewUrl":"/licenseMgmt/soa",
	"approvingUrl":"/licenseMgmt/approving-soa",
	"submitDate":null,"lastUpdatedDate":"2023-04-26T01:49:48.974+00:00",
	"lastUpdatedBy":"ray.yeh@wpgholdings.com",
	"createdDate":"2023-04-26T01:48:06.976+00:00",
	"createdBy":"ray.yeh@wpgholdings.com",
	"docType":null,
	"applicantName":"153206 Ray Yeh 葉昕濠",
	"serviceType":"BPaaS",
	"tenant":"WPG",
	"ouCode":"296"
};

export const Test_getSoChgGbgForm = {
	"code": "Success",
	"message": "執行成功",
	"formNo": "SOA202304000873",
	"comment": null,
	"userCode": "153206",
	"userName": "NEOH PUI MUN/CELINE NEOH",
	"salesCode": "112516",
	"salesName": "HONG HUI TING/FELICIA HONG",
	"salesDeptCode": null,
	"salesDeptName": null,
	"ouCode": "686",
	"ouName": "World Peace International (South Asia) Pte. Ltd.",
	"ouGroup": "WPIG",
	"custCode": "32195",
	"custName": "CEI PTE. LTD.",
	orderNumber: "1000856282",
	"orderDate": 1656086400,
	"currency": "USD",
	"holdSourceId": "1000856282",
	"creationDate": 1656086400,
	"lines": [
		{
			"lineNumber": "19.1",
			"orderHoldId": "1",
			"status": null,
			"formType": "PM",
			"sendPMFlag": "Y",
			"salesCode": "112516",
			"salesName": "FELICIA HONG HUI TING",
			"salesDeptCode": "FSBAC01020",
			"salesDeptName": "MBM Sales SGP-Active 2",
			"custPo": "534677",
			"productCode": "0705430106",
			"brand": "MOLEX",
			"itemType": "SINGLE;",
			"military": "N",
			"category": "00",
			"shipTerm": "shipTerm",
			"salesMargin": "0.1",
			"changeDate": 1656086400,
			"changeReason": "	CANCELLED (WITHOUT STK/PBK)[]",
			"oldUc": 0.263,
			"newUc": 0.263,
			"oldQuantity": 3456,
			"newQuantity": 0,
			"oldAmount": 908.928,
			"newAmount": 0,
			"oldCrd": 1656086400,
			"newCrd": 1656086400,
			"salesCostType": "1.2",
			"endCustomer": null,
			"comments": "comments test",
			"datas": [
				{
					"HoldCommandId": "1",
					"HoldCommand": "Change Qty(Cancelled)",
					"HoldReasonC": "更換理由(Cancelled)",
					"HoldReasonE": "Change Qty(Cancelled)"
				},
				{
					"HoldCommandId": "2",
					"HoldCommand": "2Change Qty(Cancelled)",
					"HoldReasonC": "2更換理由(Cancelled)",
					"HoldReasonE": "2Change Qty(Cancelled)"
				}
			]
		}
	]
}
