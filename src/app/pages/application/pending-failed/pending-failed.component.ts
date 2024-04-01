import { Component, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'app-pending-failed',
  templateUrl: './pending-failed.component.html',
  styleUrls: ['./pending-failed.component.scss'],
})
export class PendingFailedComponent implements OnInit {
  displaySubmitDetail = false;
  linkVal: string;
  linkItem = [];
  selectedRadio3: string;
  chipVals: string[];
  options: SelectItem[];

  cols: any[];
  selectedCols: any[];
  data: any[];
  displayFilterDetail = false;

  historyCols: any[];
  historyData: any[];

  fileCols: any[];
  fileData: any[];
  linkCols: any[];
  linkData: any[];

  constructor() {}

  ngOnInit(): void {
    this.cols = [
      { field: 'created', header: '申請日期', isDefault: true },
      { field: 'id', header: '表單編號', isDisabled: true, isDefault: true },
      { field: 'name', header: '表單名稱', isDisabled: true, isDefault: true },
      { field: 'title', header: '標題', isDefault: true },
      { field: 'applicant', header: '申請人', isDefault: true },
      { field: 'updated', header: '處理日期', isDefault: true },
      { field: 'processor', header: '處理者', isDefault: true },
      { field: 'status', header: '狀態', isDefault: true },
      { field: 'desc', header: '備註', isDefault: true },
      { field: 'label01', header: 'Label01' },
      { field: 'label02', header: 'Label02' },
      { field: 'label03', header: 'Label03' },
    ];
    this.changeFilterDetail();
    this.data = [
      {
        created: '2019/06/21',
        id: 'BN190621001',
        name: '待付款',
        title: 'TEST_圖書館',
        applicant: '許小明',
        updated: '2019/06/21',
        processor: '許博彥',
        status: '通過',
        desc: '無',
        label01: 'Text',
        label02: 'Text',
        label03: 'Text',
      },
      {
        created: '2019/06/21',
        id: 'BN190621002',
        name: '待付款',
        title: 'TEST_圖書館',
        applicant: '許小明',
        updated: '2019/06/21',
        processor: '許博彥',
        status: '通過',
        desc: '無',
        label01: 'Text',
        label02: 'Text',
        label03: 'Text',
      },
      {
        created: '2019/06/21',
        id: 'BN190621003',
        name: '待付款',
        title: 'TEST_圖書館',
        applicant: '許小明',
        updated: '2019/06/21',
        processor: '許博彥',
        status: '通過',
        desc: '無',
        label01: 'Text',
        label02: 'Text',
        label03: 'Text',
      },
      {
        created: '2019/06/21',
        id: 'BN190621004',
        name: '待付款',
        title: 'TEST_圖書館',
        applicant: '許小明',
        updated: '2019/06/21',
        processor: '許博彥',
        status: '通過',
        desc: '無',
        label01: 'Text',
        label02: 'Text',
        label03: 'Text',
      },
      {
        created: '2019/06/21',
        id: 'BN190621005',
        name: '待付款',
        title: 'TEST_圖書館',
        applicant: '許小明',
        updated: '2019/06/21',
        processor: '許博彥',
        status: '通過',
        desc: '無',
        label01: 'Text',
        label02: 'Text',
        label03: 'Text',
      },
      {
        created: '2019/06/21',
        id: 'BN190621006',
        name: '待付款',
        title: 'TEST_圖書館',
        applicant: '許小明',
        updated: '2019/06/21',
        processor: '許博彥',
        status: '通過',
        desc: '無',
        label01: 'Text',
        label02: 'Text',
        label03: 'Text',
      },
      {
        created: '2019/06/21',
        id: 'BN190621007',
        name: '待付款',
        title: 'TEST_圖書館',
        applicant: '許小明',
        updated: '2019/06/21',
        processor: '許博彥',
        status: '通過',
        desc: '無',
        label01: 'Text',
        label02: 'Text',
        label03: 'Text',
      },
      {
        created: '2019/06/21',
        id: 'BN190621008',
        name: '待付款',
        title: 'TEST_圖書館',
        applicant: '許小明',
        updated: '2019/06/21',
        processor: '許博彥',
        status: '通過',
        desc: '無',
        label01: 'Text',
        label02: 'Text',
        label03: 'Text',
      },
      {
        created: '2019/06/21',
        id: 'BN190621009',
        name: '待付款',
        title: 'TEST_圖書館',
        applicant: '許小明',
        updated: '2019/06/21',
        processor: '許博彥',
        status: '通過',
        desc: '無',
        label01: 'Text',
        label02: 'Text',
        label03: 'Text',
      },
      {
        created: '2019/06/21',
        id: 'BN190621000',
        name: '待付款',
        title: 'TEST_圖書館',
        applicant: '許小明',
        updated: '2019/06/21',
        processor: '許博彥',
        status: '通過',
        desc: '無',
        label01: 'Text',
        label02: 'Text',
        label03: 'Text',
      },
    ];

    this.historyCols = [
      { field: 'time', header: 'Time' },
      { field: 'username', header: 'User Name' },
      { field: 'dept', header: 'Dept' },
      { field: 'opinion', header: 'Opinion' },
      { field: 'contact', header: 'Ext/Mobile' },
    ];
    this.historyData = [
      {
        time: '2019/06/21',
        username: 'Ewing Huang 黃怡穎',
        userImg: '/assets/imgs/user.svg',
        dept: '華南陸商珠海行銷部',
        opinion:
          '申請 (Apply) 貨在新加坡 341 倉，SHIP TO 必須是英文地址才能打單出貨，故勾選 SHIP TO，謝謝。',
        contact: '36214 / 8613652250402',
      },
      {
        time: '2019/06/21',
        username: 'Nina Cheng 鄭甯云',
        userImg: '/assets/imgs/user.svg',
        dept: '大聯大控股客戶管理部',
        opinion: '送件 Approve 新加玻出貨勾選 SHIP TO 確認',
        contact: '86200',
      },
    ];

    this.fileCols = [
      { field: 'upload', header: 'Upload Date' },
      { field: 'file', header: 'File Name' },
      { field: 'username', header: 'User Name' },
      { field: 'action', header: 'Action' },
    ];
    this.fileData = [];
    this.linkCols = [
      { field: 'upload', header: 'Upload Date' },
      { field: 'url', header: 'URL' },
      { field: 'username', header: 'User Name' },
      { field: 'action', header: 'Action' },
    ];
    this.linkData = [];
  }

  addLink(target) {
    if (this.linkVal) {
      target.unshift(this.linkVal);
      this.linkVal = '';
    }
  }
  delLink(target, i) {
    target.splice(i, 1);
  }

  showFilter() {
    this.displayFilterDetail = true;
  }
  changeFilterDetail() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
  } // end changeFilterDetail
}
