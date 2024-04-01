import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  LazyLoadEvent,
  ConfirmationService as NGConfirmationService,
  SelectItem,
} from 'primeng/api';
import { Table } from 'primeng/table';
import { Subject, takeUntil } from 'rxjs';
import { TableCol } from 'src/app/core/model/data-table-cols';
import { DataTableParams } from 'src/app/core/model/data-table-view';
import { AttachedFileLog } from 'src/app/core/model/file-info';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { UserInfo } from 'src/app/core/model/user-info';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { CurFormStatusService } from 'src/app/pages/licenseMgmt/services/cur-form-status.service';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';
@Component({
  selector: 'app-common-data-table-viewer',
  templateUrl: './data-table-viewer.component.html',
  styleUrls: ['./data-table-viewer.component.scss'],
})
export class DataTableViewerComponent implements OnInit, OnChanges, OnDestroy {
  private unsubscribeEvent = new Subject();
  @ViewChild('dt') table: Table;

  @Input() data!: any[];
  @Input() tableCols!: TableCol[];
  @Input() tableSettings!: DataTableParams;
  @Input() totalRecords: number = 0;
  @Input() deleteKeyBeforeReturn: boolean = true;
  @Input() cleanSelected: boolean = false;
  @Input() itemFieldShowButton: boolean = false;
  @Output() isSingleDeleteItemActive: EventEmitter<any> =
    new EventEmitter<any>();
  @Output() isAddItemActive: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  @Output() outputTargetData: EventEmitter<any> = new EventEmitter<any>();
  @Output() outputSelectedData: EventEmitter<any[]> = new EventEmitter<any[]>();
  @Output() outputAfterDeletedData: EventEmitter<any[]> = new EventEmitter<
    any[]
  >();
  @Output() detailActive: EventEmitter<any> = new EventEmitter<any>();
  @Output() outputTableStatus: EventEmitter<LazyLoadEvent> =
    new EventEmitter<LazyLoadEvent>();
  @Output() itemFieldOnClick: EventEmitter<any> =
    new EventEmitter<any>();
  @Output() updateSignal: EventEmitter<any> =
    new EventEmitter<any>();
  //>  dialog setting parameters
  dialogSettingParams!: DialogSettingParams;

  //> data selected
  selectedData: any[];

  //> table settings
  globalFilterCols!: string[];
  showTableCols!: TableCol[];
  searchKeyword!: string;

  curUserInfo!: UserInfo;
  curFormStatus!: string;

  viewpointWidth!: number;

  tableColDropDownOptions!: {
    key: string;
    option: Array<SelectItem<any>>;
    data: any;
  }[];

  curTableStatus: LazyLoadEvent;
  curTableRows: number;
  curFirst: number;

  constructor(
    private ngConfirmationService: NGConfirmationService,
    private translateService: TranslateService,
    private myFlowService: MyFlowService,
    private userContextService: UserContextService,
    private toastService: ToastService,
    private curFormStatusService: CurFormStatusService,
    public router: Router,
    private tableStatusKeepService: TableStatusKeepService
  ) {
    this.viewpointWidth = window.innerWidth;
    this.curTableRows = 10;
    this.curTableStatus = {
      first: 0,
      rows: this.curTableRows,
      sortOrder: 1,
      filters: {},
      globalFilter: null,
      multiSortMeta: undefined,
      sortField: undefined,
    };
  }

  ngOnInit(): void {
    this.selectedData = new Array<any[]>();

    this.searchKeyword = '';

    this.curFormStatusService.getCurFormStatus$().then((obs) => {
      obs.pipe(takeUntil(this.unsubscribeEvent)).subscribe((res) => {
        this.curFormStatus = res;
      });
    });

    this.tableStatusKeepService.resetPage
      .subscribe((res:LazyLoadEvent) => {
        this.curFirst = res.first;
        this.curTableRows = res.rows;
        this.curTableStatus.first = res.first;
        this.curTableStatus.rows = res.rows;
      })
  }

  ngOnChanges(changes: SimpleChanges): void {
    //驗證目前因 什麼 Input 導致觸發 onChanges
    // console.log(changes.data.currentValue);
    this.globalFilterCols = new Array<string>();
    this.searchKeyword = '';
    this.showTableCols = this.tableCols;
    this.curUserInfo = this.userContextService.user$.getValue();
    this.dialogSettingParams = {
      visiable: false,
    };
 
    if (this.cleanSelected) {
      this.selectedData = new Array<any[]>();
      this.cleanSelected = false;
    }

    try {
      this.tableCols.forEach((col) => {
        this.globalFilterCols.push(col.field);
      });
      if(!changes.cleanSelected){this.table.reset()};
      this.ngConfirmationService.close();
    } catch { }

    if (this.selectedColsHistory.length !== 0) {
      this.showTableCols = new Array();
      for (const selectedCol of this.selectedColsHistory) {
        this.showTableCols.push(
          this.tableCols.filter((data) => data.field === selectedCol)[0]
        );
      }
    }

    this.resetDataIndex();
  }

  ngOnDestroy(): void {
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  @HostListener('window:resize', ['$event'])
  onViewPointWatcher(event: { target: { innerWidth: number } }): void {
    this.viewpointWidth = event.target.innerWidth;
  }

  async onTableLazyload(event: LazyLoadEvent): Promise<void> {
    setTimeout(() => {
      this.table.first = this.curTableStatus.first ?? 0;
    });
    if (
      event &&
      event.sortField &&
      this.table &&
      (event.sortField !== this.curTableStatus.sortField ||
        event.sortOrder !== this.curTableStatus.sortOrder)
    ) {
      this.data = this.sortDataProcess(
        this.data,
        event.sortField,
        event.sortOrder ?? 0
      );
      return;
    } else {
      if (this.tableSettings.lazyMode && this.data && this.data.length === 0) {
        this.resetTableStatus();
      }
    }
    this.outputTableStatus.emit(this.curTableStatus);
  }

  onTablePageChange(event: any): void {
    this.curTableStatus = {
      ...this.curTableStatus,
      ...{ first: event.first, rows: event.rows },
    };
    this.curTableRows = event.rows;
    this.tableStatusKeepService.keep(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent, event);
    this.outputTableStatus.emit(this.curTableStatus);
  }

  //> on open table cols selector dialog handler
  onOpenTableColSeletorDialog(): void {
    this.dialogSettingParams = {
      title: this.translateService.instant(
        'LicenseMgmt.Common.Title.SelectField'
      ),
      visiable: true,
    };
  }

  //> on open delect selected data confirm dialog handler
  onDeleteSelectedData(): void {
    this.ngConfirmationService.confirm({
      message: this.translateService.instant(
        'LicenseMgmt.Common.Hint.QDeleteData'
      ),
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      key: 'dataTableViewer',
      accept: () => {
        const selectDataKeys = new Array<string>();
        this.resetDataIndex();
        for (const data of this.selectedData) {
          selectDataKeys.push(data.lineId);
        }
        this.data = this.data.filter(
          (data) => !selectDataKeys.includes(data.lineId)
        );
        this.selectedData = new Array<[]>();
        this.outputAfterDeletedData.emit(this.data);
      },
    });
  }

  selectedColsHistory = [];
  //> listening table cols selector dialog callback
  onSelectedColDialogCallback(selectedCols: string[]): void {
    this.selectedColsHistory = selectedCols;
    this.showTableCols = new Array();
    for (const selectedCol of selectedCols) {
      this.showTableCols.push(
        this.tableCols.filter((data) => data.field === selectedCol)[0]
      );
    }
  }

  //> on send notice about active item add
  onActiveItemAddEvent(): void {
    this.dialogSettingParams = {
      visiable: false,
    };
    this.isAddItemActive.emit(true);
  }

  onDataSelectedEvent(seletedData: any): void {
    if (this.deleteKeyBeforeReturn) {
      delete seletedData.key;
    }
    this.outputTargetData.emit(seletedData);
  }

  onTargetFileDownloadEvent(data: AttachedFileLog): void {
    this.myFlowService.downloadFile(data.seq);
  }

  onExtranetEvent(url: string): void {
    window.open(url, '_blank');
  }

  onDeleteItemEvent(seq: number) {
    this.myFlowService.deleteFormFileOrUrl(seq).subscribe({
      next: () => {
        this.toastService.success('Delete Success.');
      },
      error: (err) => {
        console.log('delete form file error : ' + JSON.stringify(err));
        this.toastService.success('Delete Failed.');
      },
      complete: () => {
        this.isSingleDeleteItemActive.emit();
      },
    });
  }

  detailOnClick(seletedData: any) {
    this.detailActive.emit(seletedData);
  }

  onRowSelectEvent(): void {
    if (this.tableSettings.isSelectMode) {
      this.outputSelectedData.emit(this.selectedData);
    }
  }

  itemFieldClick(e) {
    this.itemFieldOnClick.emit(e)
  }

  private resetTableStatus(): void {
    this.curTableStatus = {
      first: 0,
      rows: this.curTableRows,
      sortOrder: 1,
      filters: {},
      globalFilter: null,
      multiSortMeta: undefined,
      sortField: undefined,
    };
  }

  private resetDataIndex(): void {
    for (let [index, data] of this.data.entries()) {
      data['lineId'] = index;
    }
  }

  private sortDataProcess(
    arrayData: any[],
    field: string,
    sort: number
  ): any[] {
    if (arrayData && field && sort) {
      if (sort && sort == 1) {
        return arrayData.sort((a, b) =>
          (a[field] != null ? a[field] : '') <
            (b[field] != null ? b[field] : '')
            ? -1
            : 1
        );
      } else {
        return arrayData.sort((a, b) =>
          (a[field] != null ? a[field] : '') >
            (b[field] != null ? b[field] : '')
            ? -1
            : 1
        );
      }
    }
    return arrayData;
  }

  onUpdateBtnClick(): void {
    this.updateSignal.emit();
  }
}
