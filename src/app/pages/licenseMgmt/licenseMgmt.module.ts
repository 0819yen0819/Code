import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IcpProcessService } from './icp/icp-process.service';
import { ImpexpInitService } from './impexp/services/impexp-init.service';
import { Sc047V2ItemBatchHandlerComponent } from './sc047-v2/sc047-v2-item-batch-handler/sc047-v2-item-batch-handler.component';
import { Sc047V2FlowService } from './sc047-v2/services/sc047-v2-flow.service';
import { Sc047V2InitService } from './sc047-v2/services/sc047-v2-init.service';
import { Sc047V2ProcessService } from './sc047-v2/services/sc047-v2-process.service';

import { AppCommonModule } from 'src/app/app.common.module';
import { PrimengModule } from 'src/app/shared/primeng.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuditActionDialogComponent } from './components/common/audit-action-dialog/audit-action-dialog.component';
import { CommomByTypeSelectorComponent } from './components/common/selector-dialog/by-type-selector/by-type-selector.component';

import { CommonComponentModule } from 'src/app/core/components/common-component.module';
import { BafaAddDialogComponent } from './bafa-license-mtn/bafa-add-dialog/bafa-add-dialog.component';
import { BafaBatchEditComponent } from './bafa-license-mtn/bafa-batch-edit/bafa-batch-edit.component';
import { BafaDetailDialogComponent } from './bafa-license-mtn/bafa-detail-dialog/bafa-detail-dialog.component';
import { SimpleTableComponent } from './bafa-license-mtn/bafa-detail-dialog/simple-table/simple-table.component';
import { BafaLicenseMtnComponent } from './bafa-license-mtn/bafa-license-mtn.component';
import { ViewAreaPopupComponent } from './common/popup/view-area/view-area-popup.component';
import { ViewHistoryPopupComponent } from './common/popup/view-history/view-history-popup.component';
import { ApplyActionDialogComponent } from './components/common/apply-action-dialog/apply-action-dialog.component';
import { AuditHistoryLogComponent } from './components/common/audit-history-log/audit-history-log.component';
import { LicenseFormHeaderComponent } from './components/common/license-form-header/license-form-header.component';
import { LicenseViewerHeaderComponent } from './components/common/license-viewer-header/license-viewer-header.component';
import { LicenseViewerHeaderService } from './components/common/license-viewer-header/license-viewer-header.service';
import { ItemSelectorDialogComponent } from './components/common/selector-dialog/selector-dialog.component';
import { AddExpItemByRefDialogComponent } from './components/dialog/add-exp-item-by-ref-dialog/add-exp-item-by-ref-dialog.component';
import { ExpRefDataTableComponent } from './components/dialog/add-exp-item-by-ref-dialog/exp-ref-data-table/exp-ref-data-table.component';
import { AddEccnMultiItemComponent } from './components/dialog/am-eccn-status-dialog/add-eccn-multi-item/add-eccn-multi-item.component';
import { AddEccnSingleItemComponent } from './components/dialog/am-eccn-status-dialog/add-eccn-single-item/add-eccn-single-item.component';
import { AmEccnStatusDialogComponent } from './components/dialog/am-eccn-status-dialog/am-eccn-status-dialog.component';
import { MultiItemAddComponent } from './components/dialog/am-euc-item-dialog/add-euc-multi-item/add-euc-multi-item.component';
import { AmEucItemDialogComponent } from './components/dialog/am-euc-item-dialog/am-euc-item-dialog.component';
import { AmEucSingleItemAddComponent } from './components/dialog/am-euc-item-dialog/am-euc-single-item/am-euc-single-item.component';
import { AddExpMultiItemComponent } from './components/dialog/am-exp-item-dialog/add-exp-multi-item/add-exp-multi-item.component';
import { AmExpItemDialogComponent } from './components/dialog/am-exp-item-dialog/am-exp-item-dialog.component';
import { AmExpSingleItemComponent } from './components/dialog/am-exp-item-dialog/am-exp-single-item/am-exp-single-item.component';
import { AddImpMultiItemComponent } from './components/dialog/am-imp-item-dialog/add-imp-multi-item/add-imp-multi-item.component';
import { AmImpItemDialogComponent } from './components/dialog/am-imp-item-dialog/am-imp-item-dialog.component';
import { AmImpSingleItemComponent } from './components/dialog/am-imp-item-dialog/am-imp-single-item/am-imp-single-item.component';
import { AMLERuleDialogComponent } from './components/dialog/am-le-rule-dialog/am-le-rule-dialog.component';
import { AmSc047ItemDialogComponent } from './components/dialog/am-sc047-item-dialog/am-sc047-item-dialog.component';
import { TargetImpItemSelectorDialogComponent } from './components/dialog/target-imp-item-selector-dialog/target-imp-item-selector-dialog.component';
import { EccnDialogComponent } from './eccn-mtn/eccn-dialog/eccn-dialog.component';
import { EccnMtnComponent } from './eccn-mtn/eccn-mtn.component';
import { EccnDataTableComponent } from './eccn-status-mtn/eccn-data-table/eccn-data-table.component';
import { EccnStatusMtnComponent } from './eccn-status-mtn/eccn-status-mtn.component';
import { EucAddRecordDialogComponent } from './euc-license-mtn/euc-add-record-dialog/euc-add-record-dialog.component';
import { EucLicenseMtnComponent } from './euc-license-mtn/euc-license-mtn.component';
import { EucModifyRecordDialogComponent } from './euc-license-mtn/euc-modify-record-dialog/euc-modify-record-dialog.component';
import { EucItemBatchHandlerComponent } from './euc/euc-item-batch-handler/euc-item-batch-handler.component';
import { EucComponent } from './euc/euc.component';
import { IcpComponent } from './icp/icp.component';
import { ImpExpLicenseMtnComponent } from './impexp-license-mtn/impexp-license-mtn.component';
import { ImpexpItemBatchHandlerComponent } from './impexp/impexp-item-batch-handler/impexp-item-batch-handler.component';
import { ImpexpComponent } from './impexp/impexp.component';
import { ImpexpHandlerService } from './impexp/services/impexp-handler.service';
import { ImpexpProcessService } from './impexp/services/impexp-process.service';
import { LehComponent } from './leh/leh.component';
import { LerComponent } from './ler/ler.component';
import { LicenseRoutingModule } from './licenseMgmt-routing.module';
import { RuleSetupComponent } from './rule-setup/rule-setup.component';
import { Sc047AddRecordDialogComponent } from './sc047-license-mtn/sc047-add-record-dialog/sc047-add-record-dialog.component';
import { Sc047LicenseMtnComponent } from './sc047-license-mtn/sc047-license-mtn.component';
import { Sc047ModifyRecordDialogComponent } from './sc047-license-mtn/sc047-modify-record-dialog/sc047-modify-record-dialog.component';
import { AddSc047V2ItemByRefDialogComponent } from './sc047-v2/dialog/add-sc047-v2-item-by-ref-dialog/add-sc047-v2-item-by-ref-dialog.component';
import { AmSc047V2ItemDialogComponent } from './sc047-v2/dialog/am-sc047-v2-item-dialog/am-sc047-v2-item-dialog.component';
import { Sc047V2Component } from './sc047-v2/sc047-v2.component';
import { AttachedLogService } from './services/attached-log.service';
import { AuditActionControlService } from './services/audit-action-control.service';
import { CurFormInfoService } from './services/cur-form-info.service';
import { CurFormStatusService } from './services/cur-form-status.service';
import { SoaControlByUserDialogComponent } from './soa-control-setup/soa-control-by-user-dialog/soa-control-by-user-dialog.component';
import { SoaControlSetupComponent } from './soa-control-setup/soa-control-setup.component';
import { AmSoaMtnDialogComponent } from './soa-license-mtn/am-soa-mtn-dialog/am-soa-mtn-dialog.component';
import { SoaLicenseMtnComponent } from './soa-license-mtn/soa-license-mtn.component';
import { AddItemComponent } from './soa/soa-support/component/add-item/add-item.component';
import { AmSoaItemDialogComponent } from './soa/soa-support/component/add-item/am-soa-item-dialog/am-soa-item-dialog.component';
import { SoaItemBatchEditComponent } from './soa/soa-support/component/add-item/soa-item-batch-edit/soa-item-batch-edit.component';
import { SoaModifyItemDialogComponent } from './soa/soa-support/component/add-item/soa-modify-item-dialog/soa-modify-item-dialog.component';
import { EditApplyOptionComponent } from './soa/soa-support/component/edit-apply-option/edit-apply-option.component';
import { SoaFormCommonComponent } from './soa/soa-support/component/soa-form-common/soa-form-common.component';
import { SoaHeaderComponent } from './soa/soa-support/component/soa-header/soa-header.component';
import { SoaImportOuComponent } from './soa/soa-support/component/soa-import-ou/soa-import-ou.component';
import { SoaComponent } from './soa/soa.component';
import { SoaControlSetupByUserComponent } from './soa-control-setup/soa-control-setup-by-user/soa-control-setup-by-user.component';
import { SoaControlByItemDialogComponent } from './soa-control-setup/soa-control-by-item-dialog/soa-control-by-item-dialog.component';
import { SoaControlSetupByItemService } from './soa-control-setup/soa-control-setup-by-item/soa-control-by-item-setup.service';
import { SoaControlSetupByUserService } from './soa-control-setup/soa-control-setup-by-user/soa-control-by-user-setup.service';
import { SoaControlSetupByItemComponent } from './soa-control-setup/soa-control-setup-by-item/soa-control-setup-by-item.component';
import { SoaExclusionControlComponent } from './soa-control-setup/soa-exclusion-control/soa-exclusion-control.component';
import { SoaExclusionControlDialogComponent } from './soa-control-setup/soa-exclusion-control-dialog/soa-exclusion-control-dialog.component';
import { DateInputHandlerService } from '../../core/services/date-input-handler.service';
import { DirectivesModule } from '../../core/directives/directives.module';
import { SoaControlSetupCheckResultDownloadComponent } from './soa-control-setup/soa-control-setup-check-result-download/soa-control-setup-check-result-download.component';
import { ApproveDialogComponent } from './leh/leh-support/component/approve-dialog/approve-dialog.component';
import { HistoryLogComponent } from './leh/leh-support/component/history-log/history-log.component';
import { DataTableColSelectorComponent } from './components/common/data-table-col-selector-dialog/data-table-col-selector-dialog.component';
import { DataTableViewerComponent } from './components/common/data-table-viewer/data-table-viewer.component';
import { DtViewerDropdownComponent } from './components/common/data-table-viewer/dt-viewer-dropdown/dt-viewer-dropdown.component';
import { DtViewerDropdownInitService } from './components/common/data-table-viewer/dt-viewer-dropdown/services/dt-viewer-dp-init.service';
import { DtViewerDropdownProcessService } from './components/common/data-table-viewer/dt-viewer-dropdown/services/dt-viewer-dp-process.service';
import { ApproveAttachedDialogComponent } from './components/common/attached-file-log/approve-add-attached-dialog/approve-add-attached-dialog.component';
import { AttachedFileLogComponent } from './components/common/attached-file-log/attached-file-log.component';
import { SoaApprovingLicenseDialogComponent } from './soa/soa-support/component/add-item/soa-approving-license-dialog/soa-approving-license-dialog.component';
import { SoaControlSetupByItemUpdateDialogComponent } from './soa-control-setup/soa-control-setup-by-item/soa-control-setup-by-item-update-dialog/soa-control-setup-by-item-update-dialog.component';
import { AttachmentUploaderModule } from './components/common/attachment-uploader/attachment-uploader.module';
@NgModule({
  declarations: [
    ImpExpLicenseMtnComponent,
    EucLicenseMtnComponent,
    SoaLicenseMtnComponent,
    Sc047LicenseMtnComponent,
    ImpexpComponent,
    EucComponent,
    LicenseFormHeaderComponent,
    ItemSelectorDialogComponent,
    LerComponent,
    CommomByTypeSelectorComponent,
    LicenseViewerHeaderComponent,
    AmEucItemDialogComponent,
    AMLERuleDialogComponent,
    RuleSetupComponent,
    AuditActionDialogComponent,
    AuditHistoryLogComponent,
    LicenseFormHeaderComponent,
    LicenseViewerHeaderComponent,
    AmEucSingleItemAddComponent,
    MultiItemAddComponent,
    AuditActionDialogComponent,
    ItemSelectorDialogComponent,
    CommomByTypeSelectorComponent,
    ViewAreaPopupComponent,
    ViewHistoryPopupComponent,
    ImpexpComponent,
    RuleSetupComponent,
    AuditHistoryLogComponent,
    LehComponent,
    AmSc047ItemDialogComponent,
    TargetImpItemSelectorDialogComponent,
    SoaComponent,
    SoaHeaderComponent,
    EditApplyOptionComponent,
    AddItemComponent,
    SoaImportOuComponent,
    SoaFormCommonComponent,
    AmSoaItemDialogComponent,
    SoaModifyItemDialogComponent,
    EccnMtnComponent,
    EccnDialogComponent,
    AmImpSingleItemComponent,
    AddImpMultiItemComponent,
    AddExpMultiItemComponent,
    AmExpSingleItemComponent,
    AmImpItemDialogComponent,
    AmExpItemDialogComponent,
    IcpComponent,
    SoaControlSetupComponent,

    EccnStatusMtnComponent,
    AmEccnStatusDialogComponent,
    AddEccnMultiItemComponent,
    AddEccnSingleItemComponent,
    EccnDataTableComponent,
    AddExpItemByRefDialogComponent,
    ExpRefDataTableComponent,
    ApplyActionDialogComponent,
    EucItemBatchHandlerComponent,
    ImpexpItemBatchHandlerComponent,
    SoaItemBatchEditComponent,
    BafaLicenseMtnComponent,
    BafaAddDialogComponent,
    BafaDetailDialogComponent,
    SimpleTableComponent,
    BafaBatchEditComponent,
    Sc047AddRecordDialogComponent,
    Sc047ModifyRecordDialogComponent,
    EucAddRecordDialogComponent,
    EucModifyRecordDialogComponent,
    AmSoaMtnDialogComponent,
    Sc047V2Component,
    Sc047V2ItemBatchHandlerComponent,
    AmSc047V2ItemDialogComponent,
    AddSc047V2ItemByRefDialogComponent,
    SoaControlSetupByUserComponent,
    SoaControlSetupByItemComponent,
    SoaControlByItemDialogComponent,
    SoaControlByUserDialogComponent,
    SoaExclusionControlComponent,
    SoaExclusionControlDialogComponent,
    SoaControlSetupCheckResultDownloadComponent,
    ApproveDialogComponent,
    HistoryLogComponent,
    DataTableViewerComponent,
    DataTableColSelectorComponent,
    AttachedFileLogComponent,
    DataTableColSelectorComponent,
    DataTableViewerComponent,
    ApproveAttachedDialogComponent,
    AttachedFileLogComponent,
    DtViewerDropdownComponent,
    SoaApprovingLicenseDialogComponent,
    SoaControlSetupByItemUpdateDialogComponent,
  ],
  imports: [
    CommonModule,
    PrimengModule,
    LicenseRoutingModule,
    SharedModule,
    AppCommonModule,
    CommonComponentModule,
    DirectivesModule,
    AttachmentUploaderModule
  ],
  providers: [
    CurFormInfoService,
    CurFormInfoService,
    AuditActionControlService,
    CurFormStatusService,
    AttachedLogService,
    IcpProcessService,
    LicenseViewerHeaderService,
    ImpexpProcessService,
    ImpexpInitService,
    ImpexpHandlerService,
    Sc047V2InitService,
    Sc047V2ProcessService,
    Sc047V2FlowService,
    SoaControlSetupByUserService,
    SoaControlSetupByItemService,
    DateInputHandlerService,
    DtViewerDropdownInitService,
    DtViewerDropdownProcessService,
  ],
})
export class LicenseMgmtModule {}
