'''Herein lies the object repository, it can be used to overwrite default functionality.  Use it only if you know
what you are doing'''

OR =  {"login_username" :'css=input[type="text"]',
    "login_password" : 'css=input[type="password"]',
    "login_button" : "css=button > span",
    "login_banner" : "id=logOnBanner",
    "login_info"   : "css=.infoMessage",
    "mainpage_banner" : "id=logoButton",
    "topmenu_service center" : "css=#topMenu_application_TI > button",
    "topmenu_strategy & communication" :"css=#topMenu_application_SC > button",
    "topmenu_talent management" : "css=#topMenu_application_TM > button",
    "topmenu_workforce administration" : "css=#topMenu_application_WA > button",
    "topmenu_process management" : "css=#topMenu_application_PM_MGT > button",
    "topmenu_home" : "css=#topMenu_application_SC_HOM > button",
    "topmenu_organizational management" : "css=#topMenu_application_SC_OM > button",
    "topmenu_my documents" : "css=#topMenu_application_SC_DOC > button",
    "topmenu_who is who" : "css=#topMenu_application_SC_WIW > button",
    "topmenu_learning" : "css=#topMenu_application_TM_LRN > button",
    "topmenu_performance" : "css=#topMenu_application_TM_PFM > button",
    "topmenu_compensation management" : "css=#topMenu_application_TM_CMP > button",
    "topmenu_employee data" : "css=#topMenu_application_WA_ED > button",
    "topmenu_time management" : "css=#topMenu_application_WA_PT > button",
    "topmenu_payroll data" : "css=#topMenu_application_WA_PAY > button",
    "topmenu_benefits" : "css=#topMenu_application_WA_BEN > button",
    #when navigating to tabs in Chrome, Chrome doesn't recognize the implicit wait and thus fails on the step
    #after navigate to tab because the tab hasn't loaded yet... so these are for explicit waits for the tab
    #to load, because there is not other way to tell when the AJAX calls have finished please try to put
    #use the last loading object with a static id for the wait_for property
    "tab_wait_for_time management_timesheet" : "id=applicationtimeSheet_submitButton",
    "tab_wait_for_employee data_personal" : "id=screensNavigation_button_1_SCR_ADDEXTDATA",
    "tab_wait_for_payroll data_reporting" : "id=WA_ED_reports_list",
    "tab_wait_for_benefits_benefit statements" : "id=app_BenefitStatement",     
    "tab_wait_for_learning_dashboard" : "id=screensNavigationLayer_link_1",
    "tab_wait_for_time management_time views": "id=divViewSelector",
    "tab_wait_for_organizational management_cost center" : "id=OM_costCenter_createButton",
    "tab_wait_for_organizational management_maintain" : "id=text_area_MGMT_OS_autocompleterView",
    #clock_in
    "clockin_reason" : "id=text_area_autoCompleter_reason_div",
    "clockin_hour"   : "id=A1 InHour",
    "clockin_button" : "css=#APP_CLK_IN_BUTTON > button",
    "clockout_button": "css=#APP_CLK_OUT_BUTTON > button",
    #personal data
    "personal_data_add": "id=screensNavigation_button_1_SCR_ADDEXTDATA",
    "personal_data_rightarrow" : "id=registersNavigationLayer_rightButton",
    #OM
    "om_cost_center_title": "css=.OM_costCenterAuxScreenFieldInputLong",
    "om_cost_center_pers_res" : "css=.OM_costCenterAuxScreenFieldInputLong", #this needs to be index 1
    "om_cost_center_abbr" : "id=OM_MaintObjCreate_AbrevField",
    "om_cost_center_from" : "css=#OM_MaintObjCreate_form_begCal > button",
    "om_cost_center_to" : "css=#OM_MaintObjCreate_endCal > button",
    "om_cost_center_french" : "id=OM_costCenter_FR",
    "om_cost_center_edit_title" : "id=OM_MaintObjCreate_TitleField",
    "om_cost_center_edit_pers_res" : "id=OM_costCenter_persResp",
    "om_maintain_org_structure" : "id=text_area_MGMT_OS_autocompleterView",
    "om_maintain_abbrev" : "css=#OM_BA_N_1_1_ABREV > input",
    "om_maintain_abbrev_2" : "css=#OM_BA_UP_1_1_ABREV > input",
    "om_maintain_general_description" : "css=#OM_BA_N_2_0001_values_textArea_EN",
    "om_maintain_close_icon" : "id=idModuleInfoPopUp_closeButton",
    "om_maintain_yes" : "id=Yes",
    #standard waiting stuff
    "loading_div" : "id=loadingDiv",
    "loading_bars" : "id=loadingBars",
    "loading_app" : "id=loading_app",
    "submit timesheet" : "applicationtimeSheet_submitButton",
    "logoff_link" : "name=Log off"}


