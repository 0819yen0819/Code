import { Component, isDevMode, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject, finalize } from 'rxjs';
import { EccnMtnService } from './eccn-mtn.service';
import { eccnColInfo, eccnTabelSetting } from './eccn-mtn.const';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';
@Component({
  selector: 'app-eccn-mtn',
  templateUrl: './eccn-mtn.component.html',
  styleUrls: ['./eccn-mtn.component.scss'],
})
export class EccnMtnComponent implements OnInit {
  itemQueue: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]); // Table主資料
  tableCols: any = []; // table欄位表頭

  //TODO:需修改 by Rioton
  //> Rioton 新增 Data Table Setting Params，ctr+P data-table-view.ts
  dataTableSettings: any = eccnTabelSetting; // table欄位設定
  formTitle = ''; // 本管理標題名稱

  itemFilterTypeOptions: SelectItem[]; // 搜尋類型 下拉選項
  filterType; // 當前所選類型
  itemInfo; // 當前所輸入欲查詢之Item
  editObj; // 當前欲編輯的對象資料

  showDialog = false; // 新增 or 編輯用之eccn Dialog
  showSpinner = false;

  noticeCheckDialogParams!: DialogSettingParams; // 訊息dialog
  noticeContentList: string[] = [];

  permissions!: string[];

  constructor(
    private translateService: TranslateService,
    private eccnMtnService: EccnMtnService,
    private commonApiService: CommonApiService,
    private datePipe: DatePipe,
    private userContextService: UserContextService,
    private router: Router,
    private tableStatusKeepService : TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(this.router.url);
    }
  }

  ngOnInit(): void {
    this.subscribeLangChange();
    this.init();
  }

  init() {
    // 初始化Table欄位
    let defaultCol = eccnColInfo;
    defaultCol.forEach((col) => { this.tableCols.push({ label: col.label, field: col.field }); });
  }

  subscribeLangChange() {
    // table setting(初始化)
    this.dataTableSettings.noDataConText = this.translateService.instant('EccnMtn.Label.PleaseSearchOrAdd');

    this.dataTableSettings.isAddMode = this.permissions.includes('add');
    this.dataTableSettings.isEditedMode = this.permissions.includes('edit');
    this.dataTableSettings.isDeleteMode = this.permissions.includes('del');
    //# TK-35854
    this.dataTableSettings.isPaginationMode = false;
    // 下拉選單(初始化)
    this.itemFilterTypeOptions = this.translateService.instant('EccnMtn.Options.itemFilterTypeOptions');
    this.filterType = this.itemFilterTypeOptions[0].value;

    this.translateService.onLangChange.subscribe(() => {
      // 根據語系變動
      this.dataTableSettings.noDataConText = this.translateService.instant('EccnMtn.Label.PleaseSearchOrAdd'); // table setting
      this.itemFilterTypeOptions = this.translateService.instant('EccnMtn.Options.itemFilterTypeOptions'); // 下拉選單
    });
  }

  //> 當篩選模式更換後，清空 item info
  onSelectModeChange() {
    this.itemInfo = null;
  }

  /**
   * Table編輯按鈕
   *
   * @param e
   */
  onEditSelectedDataCallback(e) {
    this.editObj = e;
    this.showDialog = true;
  }

  /**
   * 刪除callback(callback只回傳刪除後剩下的資料，應回刪除的資料)
   * @param e
   */
  onAfterModifiedDataCallback(remainData) {
    this.showSpinner = true;
    // 建立要刪除的資料
    const originData = this.itemQueue.getValue();
    const deleteData = originData.filter((data) => !remainData.includes(data));
    const model = {
      areaEccn: [] ,
      createdBy:this.userContextService.user$.getValue().userEmail,
      tenant:this.userContextService.user$.getValue().tenant
    };
    deleteData.forEach((item) => {
      model.areaEccn.push({
        productCode: item.item,
        area: item.area,
        eccn: item.eccn,
      });
    });

    // 呼叫刪除API
    this.eccnMtnService.deleteAreaEccn(model).subscribe({
      next: (rsp: any) => {
        if (!rsp.body) { return; }
        this.noticeContentList = [];
        this.noticeContentList.push(this.translateService.instant('EccnMtn.Msg.DelSuccess'));
        this.showNoticeDialog('success');
        this.showSpinner = false;
      },
      error: (rsp) => {
        this.noticeContentList = [];
        this.noticeContentList.push(rsp.error.message || this.translateService.instant('System.Message.Error'));
        this.showNoticeDialog('error');

        this.showSpinner = false;
      },
    });
  }

  /**
   * eccn dialog 關閉
   */
  dialogOnClose() {
    this.showDialog = false;
    this.editObj = null;
  }

  /**
   * eccn dialog 打開
   */
  tableAddOnClick() {
    this.showDialog = true;
  }

  /**
   * 查詢
   *
   * @param action
   * @returns
   */
  searchOnClick(action: 'S' | 'E') {
    this.tableStatusKeepService.resetPageEvent();
    if (!this.searchCheck()) {
      return;
    } 

    this.showSpinner = true;

    // 建立搜尋api所需model
    const model = {
      keyword: typeof this.itemInfo === 'string' ? [this.itemInfo] : this.itemInfo,
      searchType: this.filterType,
      action: action,
    };

    this.eccnMtnService.getECCNlist(model)
    .pipe(finalize(() => {
      if (this.itemQueue.getValue().length > 0) {
        this.dataTableSettings.isPaginationMode = true;
      }
    }))
    .subscribe({
      next: (rsp: any) => {
        if (rsp?.type === 0) { return; }
        if (model.action === 'S') { // 搜尋
          const res = [];
          rsp.body.datas.forEach((data, index) => { res.push(this.returnFormatData(data, index)); });

          this.itemQueue.next(res);
        } else if (model.action === 'E') { // 下載
          this.commonApiService.downloadFile(rsp.body.fileId);
        }

        this.showSpinner = false;
      },
      error: (rsp) => {
        this.noticeContentList = [];
        this.noticeContentList.push(rsp.error.message || this.translateService.instant('System.Message.Error'));
        this.showNoticeDialog('error');

        this.showSpinner = false;
      },
    });
  }

  /**
   * 新增 / 編輯
   *
   * @param e
   */
  getDialogResult(e) {
    const model = {
      productCode: e.item,
      areaEccn: [
        {
          area: e.area,
          eccn: e.eccn,
        },
      ],
    };

    this.showSpinner = true;
    if (this.editObj) {
      // 編輯
      this.eccnMtnService.editAreaEccn(model).subscribe({
        next: (rsp: any) => {
          if (!rsp.body) { return; }

          // 刷新table
          let newItemQueue = this.itemQueue.getValue();
          newItemQueue.map((item, index) => {
            if (item.item === e.item && item.area === e.area) { item.eccn = e.eccn; }
            item.key = item.productCode + item.area + index;
          });
          this.itemQueue.next(newItemQueue);

          this.noticeContentList = [];
          this.noticeContentList.push(
            this.translateService.instant('EccnMtn.Msg.EditSuccess')
          );
          this.showNoticeDialog('success');

          this.showSpinner = false;
        },
        error: (rsp) => {
          this.noticeContentList = [];
          this.noticeContentList.push(rsp.error.message || this.translateService.instant('System.Message.Error'));
          this.showNoticeDialog('error');

          this.showSpinner = false;
        },
      });
    } else {
      // 新增
      // 建立搜尋model，用以於新增前檢查是否重複(重複規則:item名稱與area一樣)
      const searchModel = {
        keyword: typeof e.item === 'string' ? [e.item] : e.item,
        searchType: 'Equals',
        action: 'S',
      };

      this.eccnMtnService.getECCNlist(searchModel).subscribe({
        next: (rsp: any) => {
          if (!rsp.body) {
            return;
          }
          const itemAlreadyExist = rsp.body?.datas.filter((item) => item.area === model.areaEccn[0].area).length > 0 ? true : false;
          if (itemAlreadyExist) {
            this.noticeContentList = [];
            const msg = `${e.item},${e.area} ${this.translateService.instant('EccnMtn.Msg.ItemExistError')}`
            this.noticeContentList.push(msg);
            this.showNoticeDialog('error');
            this.showSpinner = false;
          } else {
            this.eccnMtnService.saveAreaEccn(model).subscribe({
              next: (rsp: any) => {
                if (!rsp.body) { return; }
                this.searchBySpeciallyItem(e);
              },
              error: (rsp) => {
                this.noticeContentList = [];
                this.noticeContentList.push(rsp.error.message || this.translateService.instant('System.Message.Error'));
                this.showNoticeDialog('error');

                this.showSpinner = false;
              },
            });
          }
        },
        error: (rsp) => {
          isDevMode() && console.log('fail', rsp);

          this.noticeContentList = [];
          this.noticeContentList.push(rsp.error.message || this.translateService.instant('System.Message.Error'));
          this.showNoticeDialog('error');

          this.showSpinner = false;
        },
      });
    }
  }

  /**
   * 重置按鈕
   */
  resetOnClick() {
    //# TK-35854
    this.dataTableSettings.isPaginationMode = false;
    this.itemInfo = '';
    this.filterType = this.itemFilterTypeOptions[0].value;
    this.itemQueue.next([]);
  }

  /**
   * 為了新增後的更新Table (將itemQueue加上剛剛新增的資料)
   * @param item
   */
  searchBySpeciallyItem(item) {
    this.showSpinner = true;
    const model = {
      keyword: typeof item.item === 'string' ? [item.item] : item.item,
      searchType: 'Equals',
      action: 'S',
    };
    this.eccnMtnService.getECCNlist(model).subscribe({
      next: (rsp: any) => {
        if (rsp?.type === 0) { return; }
        // 改成不手動加資料進來，為了與其他管理頁面統一統一，所以User要再查詢一次
        // const res = [];
        // rsp.body.datas.forEach((data, index) => {
        //   if (data.area === item.area) {// 只加剛剛建的那筆進來
        //     res.push(this.returnFormatData(data, index));
        //   }
        // });
        // this.itemQueue.next([...this.itemQueue.getValue(), ...res]);
        this.noticeContentList = [];
        this.noticeContentList.push(
          this.translateService.instant('EccnMtn.Msg.CreateSuccess')
        );
        this.showNoticeDialog('success');

        this.showSpinner = false;
      },
      error(rsp) {
        isDevMode() && console.log('fail', rsp);

        this.noticeContentList = [];
        this.noticeContentList.push(rsp.error.message || this.translateService.instant('System.Message.Error'));
        this.showNoticeDialog('error');

        this.showSpinner = false;
      },
    });
  }

  private returnFormatData(data, index) {
    return {
      item: data.productCode,
      area: data.area,
      eccn: data.eccn,
      controlFlag: data.controlFlag,
      createDate: this.datePipe.transform(data.createdDate, 'yyyy/MM/dd  HH:mm:ss'),
      createBy: data.createdBy,
      updateDate: this.datePipe.transform(data.lastUpdatedDate, 'yyyy/MM/dd  HH:mm:ss'),
      updateBy: data.lastUpdatedBy,
      key: data.productCode + data.area + index,
    };
  }

  /**
   * 搜尋前檢查
   *
   * @returns
   */
  private searchCheck() {
    this.noticeContentList = [];

    if (!this.itemInfo) {
      this.noticeContentList.push(this.translateService.instant('EccnMtn.Msg.PleaseEnterKeyWord'));
    }
    if (!this.filterType) {
      this.noticeContentList.push(this.translateService.instant('EccnMtn.Msg.PleaseChooseType'));
    }
    if (this.noticeContentList.length > 0) {
      this.showNoticeDialog('error');
      return false;
    } else {
      return true;
    }
  }

  private showNoticeDialog(mode: string) {
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
      visiable: true,
      mode: mode
    };
  }
}
