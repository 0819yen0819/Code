import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { TableCol } from 'src/app/core/model/data-table-cols';
import { ECCNStatus } from 'src/app/core/model/eccn-info';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { SelectorDialogParams } from './../../../../core/model/selector-dialog-params';
import { LicenseViewerHeaderService } from './../../components/common/license-viewer-header/license-viewer-header.service';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';

@Component({
  selector: 'app-eccn-data-table',
  templateUrl: './eccn-data-table.component.html',
  styleUrls: ['./eccn-data-table.component.scss'],
})
export class EccnDataTableComponent implements OnInit, OnChanges {
  @ViewChild('dt') tableDOM: Table;

  @Input() mode: string;
  @Input() data: ECCNStatus[];
  @Input() cols: TableCol[];
  @Output() outputTargetData: EventEmitter<ECCNStatus[]> = new EventEmitter<
    ECCNStatus[]
  >();
  @Output() outputModifyData: EventEmitter<ECCNStatus[]> = new EventEmitter<
    ECCNStatus[]
  >();

  //>  dialog setting parameters
  dialogSettingParams!: DialogSettingParams;

  //> data table setting
  globalFilterCols!: string[];
  showTableCols!: TableCol[];
  searchKeyword!: string;

  //> data selected
  selectedData: any[];

  //> item add dialog setting
  itemAddDialogParams!: SelectorDialogParams;

  permissions!: string[];

  stateOptions!: SelectItem<string>[];

  viewpointWidth!: number;

  constructor(
    private router: Router,
    private userContextService: UserContextService,
    private translateService: TranslateService,
    private licenseViewerHeaderService: LicenseViewerHeaderService,
    public tableStatusKeepService : TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
    }

    this.viewpointWidth = window.innerWidth;
  }

  ngOnInit(): void {
    this.stateOptions = [
      { label: 'Y', value: 'Y' },
      { label: 'N', value: 'N' },
    ];
    this.onInitParams();

    this.tableStatusKeepService.resetPage.subscribe((res:any)=>{
      this.tableStatusKeepService.keep(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent,{
        first: res.first,
        rows: res.rows
      }); 
    })
  }

  ngOnChanges(): void {
    this.onInitParams();
  }

  @HostListener('window:resize', ['$event'])
  onViewPointWatcher(event): void {
    this.viewpointWidth = event.target.innerWidth;
  }

  onInitParams(): void {
    this.searchKeyword = '';
    this.selectedData = new Array<any[]>();
    if (!this.showTableCols){this.showTableCols = this.cols;}
    this.globalFilterCols = this.cols.map((data) => data.field);
  }

  onItemAddEvent(): void {
    this.itemAddDialogParams = {
      title: this.translateService.instant(
        'LicenseMgmt.Common.Title.AddECCNInfo'
      ),
      type: SelectorItemType.ITEM,
      visiable: true,
    };
  }

  onSelectedOutputEvent(): void {
    this.outputTargetData.emit(this.selectedData);
  }

  onStatusChangeEvent(status: string): void {
    for (const data of this.data) {
      data.activeFlag = status;
    }
  }

  onModifyCancelEvent(): void {
    this.licenseViewerHeaderService.setReloadNotice(true);
  }

  onModifySubmitEvent(): void {
    this.outputModifyData.emit(this.data);
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

  //> listening table cols selector dialog callback
  onSelectedColDialogCallback(selectedCols: string[]): void {
    this.showTableCols = new Array();
    for (const selectedCol of selectedCols) {
      this.showTableCols.push(
        this.cols.filter((data) => data.field === selectedCol)[0]
      );
    }
  }

  onPage(event) {
    console.log(event);
    this.tableStatusKeepService.keep(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent,event); 
  }
}
