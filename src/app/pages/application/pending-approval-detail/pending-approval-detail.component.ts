import { Component, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'app-pending-approval-detail',
  templateUrl: './pending-approval-detail.component.html',
  styleUrls: ['./pending-approval-detail.component.scss'],
})
export class PendingApprovalDetailComponent implements OnInit {
  cols: any[];
  data: any[];

  selectedRadio: string = 'Yes';
  selectedRadio2: string = 'Group OU';
  selectedChk: string[] = ['YOSUNG', 'WPIG-OTHER'];

  historyCols: any[];
  historyData: any[];

  selectedRadio3: string;
  chipVals: string[];
  options: SelectItem[];

  constructor() {}

  ngOnInit(): void {
    this.cols = [
      { field: 'date', header: 'UploadDate' },
      { field: 'filename', header: 'File Name' },
      { field: 'username', header: 'User Name' },
    ];
    this.data = [
      {
        date: '2019/06/21',
        filename: 'frgyjmngffsfghj.xlsx',
        username: 'Emmy Chou',
        userImg: './assets/imgs/user.svg',
      },
      {
        date: '2019/06/21',
        filename: 'rtaeghj.xlsx',
        username: 'Emmy Chou',
        userImg: './assets/imgs/user.svg',
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
        userImg: './assets/imgs/user.svg',
        dept: '華南陸商珠海行銷部',
        opinion:
          '申請 (Apply) 貨在新加坡 341 倉，SHIP TO 必須是英文地址才能打單出貨，故勾選 SHIP TO，謝謝。',
        contact: '36214 / 8613652250402',
      },
      {
        time: '2019/06/21',
        username: 'Nina Cheng 鄭甯云',
        userImg: './assets/imgs/user.svg',
        dept: '大聯大控股客戶管理部',
        opinion: '送件 Approve 新加玻出貨勾選 SHIP TO 確認',
        contact: '86200',
      },
    ];

    this.options = [
      { label: 'Choose...', value: null },
      { label: 'Item01', value: 1 },
      { label: 'Item02', value: 2 },
      { label: 'Item03', value: 3 },
    ];
  }
}
