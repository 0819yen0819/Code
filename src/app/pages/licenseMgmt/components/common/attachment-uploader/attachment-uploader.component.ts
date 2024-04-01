import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TableCol } from 'src/app/core/model/data-table-cols';
import { DataTableParams, DataTableSettings } from 'src/app/core/model/data-table-view';
import { AttachmentUploaderService } from './attachment-uploader.service';
import { SessionService } from 'src/app/core/services/session.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'app-attachment-uploader',
  templateUrl: './attachment-uploader.component.html',
  styleUrls: ['./attachment-uploader.component.scss']
})
export class AttachmentUploaderComponent implements OnInit, OnChanges, OnDestroy {
  @Input() formTypeId: string = '';
  @Input() formNo: string = '';

  showUploadBtn = false; // 是否顯示新增按鈕
  showDialog = false; //

  tableSettings: DataTableParams; // Table 設定
  attachedFilesTableCols: TableCol[] = [  // 檔案 Table欄位
    { field: 'uploadDate', label: 'UploadDate' },
    { field: 'fileName', label: 'File Name' },
    { field: 'uploadName', label: 'User Name' },
    { field: 'delete', label: 'Action' },
  ];

  attachedURLTableCols: TableCol[] = [  // 連結 Table欄位
    { field: 'uploadDate', label: 'UploadDate' },
    { field: 'url', label: 'Url' },
    { field: 'uploadName', label: 'User Name' },
    { field: 'delete', label: 'Action' },
  ];

  attachedFilesData = []; // 檔案資料
  attachedURLData = []; // 連結資料

  constructor(
    private translateService: TranslateService,
    private attachmentUploaderService: AttachmentUploaderService,
    private sessionService: SessionService,
    public myFlowService: MyFlowService,
    private toastService: ToastService,
    private userContextService: UserContextService
  ) { }

  ngOnInit(): void {
    this.initTableSetting();
  }

  ngOnDestroy(): void {
    this.sessionService.removeItem('fileNum'); // for euc
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (!!this.formNo && !!this.formTypeId) { // 有 formTypeId 才能繼續執行以下的流程
      await this.initShowUploadBtn();
      this.getAttachments();
    }
  }

  // 取得當前表單的附件清單 ，並指定給 attachedFilesData & attachedURLData (需要先init上傳權限 initShowUploadBtn)
  async getAttachments(): Promise<void> {
    if (this.formTypeId) {
      this.attachedFilesData = this.initShowDelete(await this.attachmentUploaderService.getAttachment(this.formNo, this.formTypeId, 'File'));
      this.attachedURLData = this.initShowDelete(await this.attachmentUploaderService.getAttachment(this.formNo, this.formTypeId, 'Url'));
    }
  }

  // 刪除附加檔案或連結
  async deleteAttachmentBySeq(seq: string) {
    this.myFlowService.deleteFormFileOrUrl(seq).subscribe({
      next: () => { this.toastService.success('Delete Success.'); },
      error: (err) => { this.toastService.success('Delete Failed.'); },
      complete: () => { this.getAttachments(); },
    });
  }

  downloadFile(seq) {
    this.myFlowService.downloadFile(seq);
    return false;
  }

  openNewWebsite(url: string) {
    window.open(url, '_blank')
    return false;
  }

  /**
   * 初始化 共用 Table 設定 
   */
  private initTableSetting() {
    this.tableSettings = new DataTableSettings();
    this.tableSettings.isShowNoDataInfo = true;
    this.tableSettings.noDataConText = this.translateService.instant('LicenseMgmt.Common.Hint.NoData');
  }

  /**
   * 初始化 是否顯示新增附件連結
   */
  private async initShowUploadBtn() {
    const allowedStatus = ['Approving', 'Draft'];
    const urlIncludeApproving = this.attachmentUploaderService.urlInCludingApproving(); // 簽核頁面
    const isApproving = allowedStatus.includes(await this.attachmentUploaderService.getFormStatus(this.formNo)); // 當前表單是簽核中(或草稿)
    const havePermission = await this.attachmentUploaderService.haveApprovePermission(this.formNo, this.formTypeId); // 當前使用者有簽核權限 

    const rule1 = urlIncludeApproving && isApproving && havePermission; // -> 一般簽核頁面且有簽核權限

    const formLog = await this.attachmentUploaderService.getFormLog(this.formNo, this.formTypeId);

    const rule2 = !formLog.seq; // -> 申請人關卡(申請表單中)

    const iAmFormApplier = await this.attachmentUploaderService.iAmFormApplier(this.formNo, this.formTypeId); // 是表單申請人申請人
    const auditLogIsEmpty = await this.attachmentUploaderService.auditLogIsEmpty(this.formNo, this.formTypeId);
    const rule3 = !!formLog.seq && auditLogIsEmpty && iAmFormApplier // 草稿 -> (有FormLog但沒有AuditLog)要驗證是不是申請人

    this.showUploadBtn = rule1 || rule2 || rule3;
  }


  /**
   * 初始化 是否顯示刪除按鈕
   */
  private initShowDelete(attachedList: any[]) {
    if (attachedList.length === 0) { return [] };
    attachedList.forEach(async data => {
      const uploadByMe = this.userContextService.user$.getValue().userEmail === data.uploadBy;
      data.showDelete = this.showUploadBtn && uploadByMe && (data.canDelete === 'Y');
    })

    return attachedList;
  }
}
