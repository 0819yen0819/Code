import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MenuItem, SelectItem } from 'primeng/api';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [ConfirmationService],
})
export class HomeComponent implements OnInit, OnDestroy {
  options: SelectItem[];
  selectedRadio: string = '';
  chipVals: string[];
  linkVal: string;
  linkItem = [];
  sourceList: any[];
  targetList: any[];

  cols: any[];
  selectedCols: any[];
  data: any[];
  displayFilterDetail = false;

  stepItems: MenuItem[];
  activeIndex: number = 0;

  constructor(private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    this.options = [
      { label: 'Choose...', value: null },
      { label: 'Item01', value: 1 },
      { label: 'Item02', value: 2 },
      { label: 'Item03', value: 3 },
    ];
    this.sourceList = [
      {
        id: '1',
        name: 'Alice',
      },
      {
        id: '2',
        name: 'Bob',
      },
      {
        id: '3',
        name: 'Cindy',
      },
    ];
    this.targetList = [];

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

    this.stepItems = [
      { label: '角色設定&選擇群組' },
      { label: '功能權限設定' },
      { label: '設定確認' },
    ];
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
    this.selectedCols.unshift({ field: 'checkbox', header: '' });
  } // end changeFilterDetail

  confirm() {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        //
      },
      reject: (type) => {
        //
      },
    });
  }
}
