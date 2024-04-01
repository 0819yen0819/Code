export const PCF_CONFIG_ID = {
    SHOW_REJECT:"SHOW_REJECT", // 是否可以整單Reject : Y的話就是審核的駁回時明細都要壓reject
    MAINTAIN_MC:"MAINTAIN_M-C", // Y的話點Approve時才要顯示，且Sales Cost Type要等於[FlowConfigSetting].ConfigVal2 (config2可能多個)
    BATCH_MAINTAIN:"BATCH_MAINTAIN" // 是否顯示批次修改
}