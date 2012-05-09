/**
* Map between classnames and files needed to make them run
*/
CLASS_VIEW = $H({
	//WA - Time
	CAL: ["standard/parentCalendar/parentCalendar.js", "standard/calendar/calendar.js","modules/balloon/balloon.js","modules/balloonOnHover/balloonOnHover.js", "standard/fastEntry/fastEntryMenu.js", "modules/tableKitV2/tableKitV2.js"],
	listCalendar: ["standard/parentCalendar/parentCalendar.js", "standard/listCalendar/listCalendar.js","modules/tableKitV2/tableKitV2.js","modules/balloon/balloon.js"],
	teamCalendar: ["standard/parentCalendar/parentCalendar.js", "standard/teamCalendar/teamCalendar.js","modules/balloon/balloon.js"],
	shiftPlanning: ["standard/shiftPlanning/shiftPlanning.js", "modules/balloon/balloon.js"],
	timeSheet: ["standard/timeSheet/timeSheet.js"],
	timeEntryScreen: ["standard/timeEntryScreen/timeEntryScreen.js","modules/progressBar/progressBar.js","modules/multiSelect/multiSelect.js", "standard/fastEntry/fastEntryMenu.js", "modules/tableKitV2/tableKitV2.js", "standard/quotaChecker/quotaChecker.js", "standard/dm/sendDocument.js", "standard/dm/myDocuments.js", "standard/documentWA/documentsInformation.js", "standard/documentWA/uploadDocument.js", "standard/documentWA/sendCoversheet.js", "standard/dm/sendDocumentHistory.js", "standard/documentWA/coversheetsInformation.js", "standard/documentWA/coversheetDetails.js", "modules/viewSelector/viewSelector.js"],
	timeClocking: ["standard/clockInOut/clockInOut.js"],
	quotaChecker: ["standard/quotaChecker/quotaChecker.js","modules/tableKitV2/tableKitV2.js"],
	timeViews: ["standard/timeViews/timeViews.js","modules/viewSelector/viewSelector.js"],
	timeWb: ["modules/tooltip/tooltip.js", "standard/timeWb/timeEventViewer.js", "standard/timeWb/timeWb.js", "modules/balloon/balloon.js", "modules/tableKitV2/tableKitV2.js"],
	//Fast entry
	fastEntryScreen: ["standard/fastEntry/fastEntryScreen.js","modules/progressBar/progressBar.js","modules/multiSelect/multiSelect.js", "standard/fastEntry/fastEntryMenu.js", "modules/tableKitV2/tableKitV2.js"],
	//PCR
	PCR_overview: ["standard/PCR/PCR_Overview.js","modules/tableKitV2/tableKitV2.js"],
	PCR_Steps: ["standard/PCR/PCR_Steps.js","modules/Wizard/Wizard.js"],
	// Payslip
	PAY: ["standard/payslip/payslip.js","modules/tableKitV2/tableKitV2.js"],
	// Payroll Workbench
	payrollWb: ["standard/payrollWb/payrollWb.js", "modules/tableKitV2/tableKitV2.js", "modules/balloon/balloon.js"],
	// Quotas
	QOT: ["standard/quotas/quotas.js"],
	//Framework
	AdvancedSearch: ["standard/FWK/advancedSearch/advancedSearch.js","modules/tableKitV2/tableKitV2.js"],
	LOGOFF: ["standard/FWK/logOff/logOff.js"],
	getContentDisplayer: ["standard/PFM/parentPFM.js", "standard/FWK/genericApplications/getContentDisplayer.js","modules/fieldDisplayer/fieldDisplayer.js"],
	INBOX: ["standard/FWK/inbox/inbox.js", "modules/ckeditor/ckeditor.js", "standard/dm/uploadModule.js", "modules/tableKitV2/tableKitV2.js","modules/tableKitV2/tableKitV2WithPreferences.js", "modules/multiupload/multiupload.js","modules/balloon/balloon.js"],
	PDC_Viewer: ["standard/personalDataChange/PDC_Viewer.js", "modules/PDCModule/PDCModule.js"],
	DELE: ["standard/FWK/delegation/delegation.js"],
	StartPage: ["modules/ckeditor/ckeditor.js", "standard/dm/uploadModule.js","standard/help/stars.js", "standard/km/metadata.js", "standard/km/contentBrowser.js", "standard/km/TaxonomyAuthoring.js", "standard/km/IAMenu.js", "standard/help/startPage.js"],
	KMMENU: ["standard/help/startPagesMenu.js"],
	ContentBrowser: ["standard/dm/uploadModule.js", "standard/km/metadata.js","standard/km/TaxonomyAuthoring.js", "standard/km/contentBrowser.js"],
	UserProfile: ["standard/km/userProfile.js"],
	Search: ["standard/km/TaxonomyAuthoring.js","standard/km/searchMenus.js","standard/km/search.js"],
	Favourites: ["standard/km/favourites.js"],
	SavedSearches: ["standard/km/savedSearches.js"],
	TaxonomyAuthoring: ["modules/balloon/balloon.js","modules/autocompleter/autocompleter.js","standard/km/TaxonomyAuthoring.js"],
	IndexMaintenace: ["modules/tableKitV2/tableKitV2.js","standard/km/indexMaintenace.js"],
	TestingArea: ["standard/km/TaxonomyAuthoring.js","modules/tableKitV2/tableKitV2.js","standard/km/metadata.js","standard/km/testingArea.js"],
	//PFM
	//PFM_BoxGrid: ["standard/PFM/parentPFM.js","standard/PFM/PFM_BoxGrid.js"],
	PFM_Dashboard: ["standard/PFM/parentPFM.js","standard/PFM/PFM_Dashboard.js","modules/groupedLayout/groupedLayout.js","modules/multiSelect/multiSelect.js"],
	PFM_DevPlan: ["standard/PFM/parentPFM.js","standard/PFM/PFM_DevPlan.js","modules/groupedLayout/groupedLayout.js"],
	PFM_JobProfileMatchUp: ["standard/PFM/parentPFM.js","standard/PFM/PFM_JobProfileMatchUp.js","modules/groupedLayout/groupedLayout.js","modules/multiSelect/multiSelect.js"],
	PFM_ShowDocs: ["standard/PFM/parentPFM.js","standard/PFM/PFM_ShowDocs.js","modules/groupedLayout/groupedLayout.js","modules/simpleTable/simpleTable.js","standard/dm/uploadModule.js"],
	PFM_ShowDocsV2: ["standard/PFM/parentPFM.js", "standard/PFM/PFM_ShowDocsV2.js", "modules/balloonOnHover/balloonOnHover.js","standard/dm/uploadModule.js"],
	PFM_ShowGoals: ["standard/PFM/parentPFM.js", "standard/PFM/PFM_ShowDocsV2.js", "standard/PFM/PFM_ShowGoals.js", "modules/balloonOnHover/balloonOnHover.js"],
	PFM_RatingDistribution: ["standard/PFM/parentPFM.js","standard/PFM/PFM_RatingDistribution.js","modules/groupedLayout/groupedLayout.js","modules/tableKitV2/tableKitV2.js"],
	PFM_TeamGoals: ["standard/FWK/GenericCatalog/GenericCatalog.js","standard/PFM/PFM_TeamGoals.js","modules/treeHandler/treeHandler.js","modules/balloon/balloon.js"],
	PFM_MaintainGoals : ["standard/FWK/genericApplications/getContentDisplayer.js","standard/PFM/PFM_MaintainGoals.js"],
	COMPCATL: ["standard/FWK/GenericCatalog/GenericCatalog.js","standard/compCatl/compCatl.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js"],
	COMP_CATL_ACG: ["modules/getContentModule/dynamicFieldsPanel.js","modules/multiSelect/multiSelect.js","standard/FWK/genericApplications/getContentDisplayer.js","standard/compCatl/compCatAddGrp.js"],
	COMP_CATL_AC: ["modules/getContentModule/dynamicFieldsPanel.js","modules/multiSelect/multiSelect.js","standard/FWK/genericApplications/getContentDisplayer.js","standard/compCatl/compCatlAddComp.js"],
	PFM_devPlanCat: ["standard/FWK/GenericCatalog/GenericCatalog.js","standard/PFM/PFM_devPlanCat.js","modules/balloon/balloon.js","modules/treeHandler/treeHandler.js"],
	PFM_maintDevPlanGroup : ["modules/getContentModule/dynamicFieldsPanel.js","modules/multiSelect/multiSelect.js","standard/FWK/genericApplications/getContentDisplayer.js","standard/PFM/PFM_maintDevPlanGroup.js"],
	PFM_maintDevPlan : ["modules/getContentModule/dynamicFieldsPanel.js","modules/multiSelect/multiSelect.js","standard/FWK/genericApplications/getContentDisplayer.js","standard/PFM/PFM_maintDevPlan.js"],
	PFM_OrgStructCat: ["standard/FWK/GenericCatalog/GenericCatalog.js","standard/PFM/PFM_OrgStructCat.js","modules/treeHandler/treeHandler.js"],
	PFM_Reviews: ["standard/PFM/PFM_Reviews.js","modules/tableKitV2/tableKitV2.js","modules/tableKitV2/tableKitV2WithPreferences.js","modules/balloonOnHover/balloonOnHover.js","modules/multiSelect/multiSelect.js"],
	PFM_displayTreeFs: ["standard/OM/Display/displayTreeFS.js","standard/PFM/OM/PFM_displayTreeFS.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js", "standard/OM/Display/drawTreeOM.js", "modules/viewSelector/viewSelector.js", "modules/tableKitV2/tableKitV2.js","modules/chartingTool/lib/prototype-adapter.src.js", "modules/chartingTool/lib/highcharts.src.js",	"modules/chartingTool/lib/bluff/base/excanvas.js", "modules/chartingTool/lib/bluff/base/js-class.js", "modules/chartingTool/lib/bluff/base/BluffBase.js",	"modules/chartingTool/lib/bluff/base/BluffRenderer.js",	"modules/chartingTool/lib/bluff/base/BluffEvent.js","modules/chartingTool/lib/bluff/base/BluffTableReader.js",	"modules/chartingTool/lib/bluff/base/BluffToolTips.js",	"modules/chartingTool/lib/bluff/base/Radar.js",	"modules/chartingTool/lib/bluff/BluffChartGenerator.js"],
	//Succession Planning		
	SCC_Planning: ["standard/SCC/SCC_myKeyPositions.js","standard/SCC/SCC_MyNominees.js","standard/SCC/SCC_Planning.js","modules/tableKitV2/tableKitV2.js","modules/tableKitV2/tableKitV2WithPreferences.js","modules/balloonOnHover/balloonOnHover.js","modules/balloon/balloon.js","modules/viewSelector/viewSelector.js"],
	SCC_PosProfile: ["standard/SCC/SCC_myKeyPositions.js","standard/SCC/SCC_MyNominees.js","standard/PFM/parentPFM.js","standard/PFM/PFM_Dashboard.js","standard/SCC/SCC_PosProfile.js","modules/groupedLayout/groupedLayout.js"],
	SCC_TalentGroups: ["standard/FWK/GenericCatalog/GenericCatalog.js","standard/SCC/SCC_myKeyPositions.js","standard/SCC/SCC_MyNominees.js","standard/SCC/SCC_TalentGroups.js","modules/treeHandler/treeHandler.js","modules/balloon/balloon.js"],
    SCC_MaintTalentGroup: ["standard/FWK/genericApplications/getContentDisplayer.js","standard/SCC/SCC_MaintTalentGroup.js","modules/multiSelect/multiSelect.js","modules/ckeditor/ckeditor.js"],
    SCC_Dashboard: ["standard/SCC/SCC_myKeyPositions.js","standard/SCC/SCC_MyNominees.js", "standard/personalDataChange/PDChange.js","standard/SCC/SCC_Dashboard.js","modules/tableKitV2/tableKitV2.js","modules/tableKitV2/tableKitV2WithPreferences.js","modules/multiSelect/multiSelect.js","modules/progressBar/progressBar.js", "standard/reporting/reporting.js", "standard/reporting/Rept_standAlone.js","standard/reporting/RA_repUnmWidget.js"],	
    SCC_ManageBench: ["standard/SCC/SCC_myKeyPositions.js","standard/SCC/SCC_MyNominees.js","standard/SCC/SCC_ManageBench.js","modules/tableKitV2/tableKitV2.js","modules/tableKitV2/tableKitV2WithPreferences.js","modules/multiSelect/multiSelect.js","modules/balloon/balloon.js"],
    SCC_RankBench: ["standard/SCC/SCC_myKeyPositions.js","standard/SCC/SCC_MyNominees.js","standard/SCC/SCC_RankBench.js"],    
	SCC_displayTreeFs: ["standard/OM/Display/displayTreeFS.js","standard/SCC/OM/SCC_displayTreeFS.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js", "standard/OM/Display/drawTreeOM.js", "modules/viewSelector/viewSelector.js", "modules/tableKitV2/tableKitV2.js"],
	//Learning
	//CATL: ["modules/tooltip/tooltip.js","modules/balloon/balloon.js", "modules/viewSelector/viewSelector.js","modules/multiSelect/multiSelect.js", "modules/tablekit/tablekit.js","modules/tablekitV2/tablekitV2.js", "modules/linedTree/linedTree.js", "standard/learning/trainingCatalog/trCatListView.js", "standard/learning/trainingCatalog/trCatTreeView.js", "standard/learning/trainingCatalog/trCatBrowserView.js","standard/learning/trainingCatalog/trCatCommon.js","standard/learning/trainingCatalog/trCatShowParticipant.js","standard/parentCalendar/parentCalendar.js","standard/calendar/calendar.js","standard/learning/trainingCatalog/Calendar/trCatCalendarView.js","standard/learning/trainingCatalog/Calendar/trCatCalendarWeekView.js","standard/learning/trainingCatalog/Calendar/trCatCalendarDayView.js","standard/learning/trainingCatalog/Calendar/trCatCalendarManager.js","standard/learning/trainingCatalog/trCatManager.js" ],
	CATL: ["modules/treeHandler/treeHandlerV2.js", "standard/FWK/GenericCatalog/GenericCatalogV2.js", "modules/tooltip/tooltip.js","modules/balloon/balloon.js", "modules/viewSelector/viewSelector.js","modules/multiSelect/multiSelect.js", "modules/tablekit/tablekit.js","modules/tablekitV2/tablekitV2.js", "standard/learning/trainingCatalog/trCatCommon.js", "standard/learning/trainingCatalog/trCatTreeView.js"],
	catalogBrowserView: ["modules/tooltip/tooltip.js","modules/balloon/balloon.js", "modules/viewSelector/viewSelector.js","modules/multiSelect/multiSelect.js", "modules/tablekit/tablekit.js","modules/tablekitV2/tablekitV2.js", "standard/learning/trainingCatalog/trCatCommon.js", "standard/learning/trainingCatalog/trCatBrowserView.js"],
	catalogListView: ["modules/tooltip/tooltip.js","modules/balloon/balloon.js", "modules/viewSelector/viewSelector.js","modules/multiSelect/multiSelect.js", "modules/tablekit/tablekit.js","modules/tablekitV2/tablekitV2.js", "standard/learning/trainingCatalog/trCatCommon.js", "standard/learning/trainingCatalog/trCatListView.js"],
	searchEngine: ["modules/treeHandler/treeHandlerV2.js", "standard/FWK/GenericCatalog/GenericCatalogV2.js", "modules/tooltip/tooltip.js","modules/balloon/balloon.js", "modules/viewSelector/viewSelector.js","modules/multiSelect/multiSelect.js", "modules/tablekit/tablekit.js","modules/tablekitV2/tablekitV2.js", "standard/learning/trainingCatalog/trCatCommon.js", "standard/learning/trainingCatalog/trCatSearchEngine.js"],	
	CATL_CG: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/learning/trainingCatalog/TrainingCatTypes/trCatCourseGroup.js", "modules/multiSelect/multiSelect.js"],
	CATL_C: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/learning/trainingCatalog/TrainingCatTypes/trCatCourseSessionDetails.js",  "modules/multiSelect/multiSelect.js"],
	CATL_CT: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/learning/trainingCatalog/TrainingCatTypes/trCatCourseType.js", "modules/multiSelect/multiSelect.js"],
	CATL_CUT: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/learning/trainingCatalog/TrainingCatTypes/trCatCurrDetails.js", "modules/multiSelect/multiSelect.js"],
	CATL_CUR: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/learning/trainingCatalog/TrainingCatTypes/trCatCurrSessionDetails.js", "modules/multiSelect/multiSelect.js"],
	CATLFollowUp: ["standard/learning/trainingCatalog/trCatFollowUp.js", "modules/multiSelect/multiSelect.js"],
	showParticipant: ["standard/learning/trainingCatalog/trCatShowParticipant.js","modules/tablekitV2/tablekitV2.js"],
	MANDATORY_CT: ["standard/learning/trainingCatalog/trCatMandatoryCourseType.js"],
	//CATLMAINTVIEW: ["modules/viewSelector/viewSelector.js", "standard/FWK/GenericCatalog/GenericCatalog.js", "standard/catalog/catalogMaintView.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js"],
	BOOK: ["standard/book/book.js", "modules/multiSelect/multiSelect.js"],
	CUR: ["standard/learning/bookCurriculum/bookCurriculum.js", "modules/multiSelect/multiSelect.js"],
	HIS: ["standard/learning/history/history.js", "modules/tablekitV2/tablekitV2.js","modules/tablekitV2/tableKitV2WithPreferences.js"],
	myLearning: ["standard/learning/myLearning/instrucLedTraining.js", "modules/tablekitV2/tablekitV2.js", "modules/tablekitV2/tableKitV2WithPreferences.js"],
	webBasedTraining: ["standard/learning/myLearning/webTraining.js", "modules/tablekitV2/tablekitV2.js", "modules/tablekitV2/tableKitV2WithPreferences.js"],
	traingEvaluation: ["standard/learning/myLearning/trainingEval.js", "modules/tablekitV2/tablekitV2.js", "modules/tablekitV2/tableKitV2WithPreferences.js"],
	trainingEvalSurvey: ["standard/help/stars.js", "standard/learning/myLearning/star.js", "standard/learning/myLearning/trainingEvalSurvey.js"],
	budgetMgmt:["modules/linedTree/linedTree.js", "standard/learning/budgetManagement/budgetManagement.js"],
	trainingEvalGraph:["standard/learning/graphs/BarGraph.js","standard/learning/courseEvaluation/trainingEvalGraph.js"],
	impactEvalGraph:["standard/learning/graphs/BarGraph.js","standard/learning/impactEvaluation/impactTrainingGraph.js"],
	CATL_COR : ['standard/learning/correspondence/correspondence.js',"modules/tablekitV2/tablekitV2.js"],
	
	PREB: ["standard/prebook/prebook.js", "modules/multiSelect/multiSelect.js"],
	learningNewRequest: ["standard/learning/trainingCatalog/trCatNewTrainingRequest.js"],
	TEACH: ["standard/learning/teacher/teacher.js", "modules/balloon/balloon.js", "modules/tablekitV2/tablekitV2.js"],
	resCatRoom: ["standard/learning/resourceCat/resCatRoom.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandlerV2.js"],
	resCatTeacher: [ "standard/learning/resourceCat/resCatTeacher.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandlerV2.js"],
	resCatCompany: [ "standard/learning/resourceCat/resCatCompany.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandlerV2.js"],
	resCatLocation: [ "standard/learning/resourceCat/resCatLocation.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandlerV2.js"],
	roomAdmin: ["standard/FWK/genericApplications/getContentDisplayer.js","standard/learning/resourceCat/roomAdmin.js"],
	locationAdmin: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/learning/resourceCat/locationAdmin.js"],
	relatUAdmin: ["standard/FWK/genericApplications/getContentDisplayer.js", "Standard/learning/resourceCat/relatUAdmin.js"],
	companyAdmin: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/learning/resourceCat/companyAdmin.js"],
	teacherAdmin: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/learning/resourceCat/teacherAdmin.js"],
	relatPAdmin: ["standard/FWK/genericApplications/getContentDisplayer.js", "Standard/learning/resourceCat/relatPAdmin.js"],
	relatPRemove: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/learning/resourceCat/relatPRemove.js"],
	relatHAsign: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/learning/resourceCat/relatHAsign.js"],
	learnDashboard: ["standard/learning/graphs/BarGraph.js", "standard/learning/graphs/thermoGraph.js", "standard/learning/graphs/pieGraph.js", "standard/learning/learnDashboard/learnDashboard.js","modules/groupedLayout/groupedLayout.js","modules/fieldDisplayer/fieldDisplayer.js"],
	//OM
	displayTreeDefaultPage: ["standard/OM/Display/displayTreeDefaultPage.js"],
	displayTree: ["standard/OM/Display/displayTree.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js", "standard/OM/Display/drawTreeOM.js", "modules/viewSelector/viewSelector.js"],
	displayTreeEmployee: ["standard/OM/Display/displayTreeEmployee.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js", "standard/OM/Display/drawTreeOM.js", "modules/viewSelector/viewSelector.js"],
	displayTreeFs: ["standard/OM/Display/displayTreeFS.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js", "standard/OM/Display/drawTreeOM.js", "modules/viewSelector/viewSelector.js", "modules/tableKitV2/tableKitV2.js"],
	DisplayFullTree: ["standard/OM/Display/displayFullTree.js", "modules/viewSelector/viewSelector.js"],
	OM_CostCenter: ["standard/OM/CostCenter/CostCenter.js", "modules/tableKitV2/tableKitV2.js"],
	MaintainTree: ["standard/OM/Maintain/maintainTree.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandlerV2.js", "modules/tablekitV2/tablekitV2.js", "standard/OM/Maintain/pendingReqLeftMenu.js"],
	baCatalogue: ["standard/OM/Maintain/baCatalogue.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandlerV2.js"],
	MassTrans: ["standard/FWK/genericApplications/MassTranslation.js", "standard/OM/Maintain/massTrans.js", "modules/tableKitV2/tableKitV2.js"],
	CreateOrgUnit: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/createOrgUnit.js", "modules/multiSelect/multiSelect.js"],
	UpdateOrgUnit: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/updateOrgUnit.js", "modules/multiSelect/multiSelect.js"],
	changeAssignOrg: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/changeAssignOrg.js"],
	CreatePosition: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/createPosition.js", "modules/multiSelect/multiSelect.js"],
	UpdatePosition: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/updatePosition.js", "modules/groupedLayout/groupedLayout.js", "modules/multiSelect/multiSelect.js"],
	NewAssign: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/newAssign.js"],
	AssignSuccNew: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/newSuccessor.js"],
	AssignHolder: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/assignHolder.js"],
	AssignSucc: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/assignSuccessor.js"],
	AssignHolderAddOcc: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/assignHolderAddOcc.js"],
	ChangeAssign: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/changeAssign.js"],
	ManageHolderAssign: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/manageHolderAssign.js"],
	DisplayOrgUnit: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/displayOrgUnit.js"],
	DisplayPosition: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/displayPosition.js"],
	DisplayPerson: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/displayPerson.js"],
	changeAssignBusinessArea: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/changeAssignBusinessArea.js"],
	viewBusinessArea: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/viewBusinessArea.js"],
	createBusinessArea: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/createBusinessArea.js", "modules/multiSelect/multiSelect.js"],
	editBusinessArea: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/editBusinessArea.js"],
	createBAassignment: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/createBAassignment.js"],
	changeCostAssignOrg: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/changeCostAssignOrg.js"],
	NewAssignCostC: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/Maintain/NewAssignCostC.js"],
	positionMassReassign: ["standard/OM/Maintain/positionMassReassign.js" , "modules/treeHandler/treeHandlerV2.js"],
	UpdateObject: ["modules/contentflow/contentflow.js", "modules/contentflow/ContentFlowAddOn_fancyScrollbar.js", "standard/OM/Maintain/UpdateObject.js", "modules/groupedLayout/groupedLayout.js"],
	JCAT: ["standard/OM/JobCatalog/jobCatalogue.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandlerV2.js"],
	MaintainJob: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/maintainJob.js", "modules/groupedLayout/groupedLayout.js"],
	JobAddData: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/JobAddData.js"],
	AddEvalRes: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/AddEvalRes.js"],
	AddSurvRes: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/AddSurvRes.js"],
	AddPlanComp: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/AddPlanComp.js"],
	JobAddDataDisplay: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/JobAddDataDisplay.js"],
	CreateJob: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/createJob.js"],
	CreateJobFamily: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/createJobFamily.js"],
	MaintainJobFam: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/maintainJobFam.js", "modules/groupedLayout/groupedLayout.js"],
	MaintainJobDisplay: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/maintainJobDisplay.js"],
	MaintainJobFamDisplay: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/maintainJobFamDisplay.js"],
	changeAssignJobFam: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/changeAssignJobFam.js"],
	changeAssignJob: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/changeAssignJob.js"],
	MaintainFNDisplay: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/MaintainFNDisplay.js"],
	MaintainFN: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/MaintainFN.js", "modules/groupedLayout/groupedLayout.js"],
	genericViewOM: ["standard/FWK/genericApplications/getContentDisplayer.js", "standard/OM/JobCatalog/genericViewOM.js", "modules/groupedLayout/groupedLayout.js"],
	jobEvaluate: ["standard/OM/JobCatalog/jobEvaluate.js", "modules/tableKitV2/tableKitV2.js"],
	WhoIsWho: ["modules/contentflow/contentflow.js", "modules/contentflow/ContentFlowAddOn_fancyScrollbar.js", "standard/OM/WhoIsWho/WhoIsWho.js", "modules/treeHandler/treeHandler.js", "modules/viewSelector/viewSelector.js", "standard/OM/WhoIsWho/WhoIsWhoMenu.js", "modules/listSearch/listSearch.js"],
	WhoIsWhoChart: ["standard/OM/WhoIsWho/WhoIsWhoChart.js", "standard/OM/Display/drawTreeOM.js", "modules/viewSelector/viewSelector.js", "standard/OM/WhoIsWho/WhoIsWhoMenu.js", "modules/listSearch/listSearch.js"],
	WhoIsWhoList: ["standard/OM/WhoIsWho/WhoIsWhoList.js", "modules/viewSelector/viewSelector.js", "modules/tableKitV2/tableKitV2.js", "standard/OM/WhoIsWho/WhoIsWhoMenu.js", "modules/listSearch/listSearch.js"],
	WhoIsWhoThumb: ["standard/OM/WhoIsWho/WhoIsWhoThumb.js", "modules/viewSelector/viewSelector.js", "standard/OM/WhoIsWho/WhoIsWhoMenu.js", "modules/tableKitV2/tableKitV2.js", "modules/listSearch/listSearch.js"],
	OM_OrgStructCat: ["standard/OM/WhoIsWho/OM_OrgStructCat.js", "modules/treeHandler/treeHandlerV2.js", "standard/OM/WhoIsWho/WhoIsWhoMenu.js", "modules/listSearch/listSearch.js"],
	omCreateInbox: ["standard/OM/Inbox/omCreateInbox.js"],
	omDelCutInbox: ["standard/OM/Inbox/omDelCutInbox.js"],
	/*Compensation module */
	COM_Dashboard: ["modules/viewSelector/viewSelector.js", "standard/compensation/compPDChange.js", "standard/personalDataChange/pendingRequestContent.js", "standard/compensation/dashboard.js", "standard/compensation/reviewAndSend.js"],
	BonusPayment:  [ "standard/compensation/infoPopUp2.js", "standard/compensation/widgetsOverview.js", "standard/personalDataChange/pendingRequestContent.js", "modules/excelTable/notes.js", "modules/excelTable/excelTable.js", "modules/orgSummary/orgSummary.js", "standard/compensation/compensationTab.js", "standard/compensation/bonusPayment.js"],
	SalaryReview:  [ "standard/compensation/infoPopUp2.js", "standard/compensation/widgetsOverview.js", "standard/personalDataChange/pendingRequestContent.js", "modules/excelTable/notes.js", "modules/excelTable/excelTable.js", "modules/orgSummary/orgSummary.js", "standard/compensation/compensationTab.js", "standard/compensation/salaryReview.js", "standard/reporting/XBoxGrid.js", "standard/compensation/boxGrid_com.js","modules/boxGrid/boxGrid.js", "standard/PCR/PCR_Overview.js"],
	LTI: [ "standard/compensation/infoPopUp2.js", "standard/compensation/widgetsOverview.js", "standard/personalDataChange/pendingRequestContent.js", "modules/excelTable/notes.js", "modules/excelTable/excelTable.js", "modules/orgSummary/orgSummary.js", "standard/compensation/compensationTab.js", "standard/compensation/lti.js"],
    Comp_Reporting: ["standard/compensation/compReporting.js"],
	COM_monitor: ["standard/compensation/CompPDChange.js", "standard/compensation/Com_monitor.js","modules/tableKitV2/tableKitV2.js","modules/tableKitV2/tableKitV2WithPreferences.js"],
    Compensation_Statement: ["standard/compensation/compStatement.js"],
    COM_Holi: ["modules/tableKitV2/tableKitV2.js", "modules/rangeSlider/rangeSlider.js", "standard/compensation/holisticView.js"],
    compStartPage: ["standard/compensation/compStartPage.js", "standard/compensation/orgStatus.js", "modules/excelTable/notes.js", "modules/excelTable/excelTable.js", "modules/orgSummary/orgSummary.js", "standard/compensation/CompensationTab.js", "standard/compensation/compSelector.js", "standard/compensation/CompOrgUnits.js", "standard/compensation/budgets.js", "modules/balloon/balloon.js", "standard/compensation/reviewPeriods.js", "standard/compensation/compPDChange.js", "modules/getContentModule/fieldsPanel.js", "standard/reporting/XBoxGrid.js", "standard/compensation/boxGrid_com.js", "modules/boxGrid/boxGrid.js", "modules/getContentModule/getContentModule.js", "modules/balloonOnHover/balloonOnHover.js", "standard/compensation/compBalloonOnHover.js"],

	/*Benefits module */
    benChange: ["standard/benefits/benChange.js","standard/personalDataChange/pendingRequestContent.js","modules/tableKitV2/tableKitV2.js","standard/personalDataChange/quotaReport.js","modules/reportTable/reportTable.js"],    
    BEN_monitor: ["standard/benefits/benChange.js", "standard/benefits/BEN_monitor.js","modules/tableKitV2/tableKitV2.js","modules/tableKitV2/tableKitV2WithPreferences.js"], 
   	Enrollement: ["standard/benefits/mybenefits.js", "standard/benefits/benChange.js", "standard/personalDataChange/PDChange.js", "standard/personalDataChange/pendingRequestContent.js", "standard/personalDataChange/personalDataChange.js", "standard/benefits/dependents.js", "standard/benefits/enrollement.js", "standard/benefits/benefitsScreens.js"],
   	YGB_Enrollment: ["standard/benefits/mybenefits.js", "standard/benefits/benChange.js", "standard/personalDataChange/pendingRequestContent.js", "standard/personalDataChange/personalDataChange.js", "standard/benefits/dependents.js", "countries/GB/gb_enrollement.js", "countries/GB/gb_benefitsScreens.js"],
    BenefitStatement: ["standard/benefits/benefitStatement.js"],
    BenefitRewardsStatement: ["standard/benefits/benefitsRewards.js"],
    BEN_Dashboard: ["standard/compensation/CompOrgUnits.js", "standard/benefits/benChange.js", "standard/personalDataChange/pendingRequestContent.js", "standard/benefits/dashboard.js", "modules/getContentModule/fieldsPanel.js"],
    
	//SCM
	scm_myActivity		: ["modules/balloon/balloon.js", "modules/linedTree/linedTree.js", "standard/SCM/scm_tooltips.js", "standard/SCM/scm_ticketGrouping.js", "modules/tableKitV2/tableKitV2.js", "standard/SCM/scm_popupScreens.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_actionList.js", "standard/SCM/scm_myActivity.js", "standard/SCM/scm_poolTable.js"],
	scm_generalPool		: ["modules/balloon/balloon.js", "modules/linedTree/linedTree.js", "standard/SCM/scm_tooltips.js", "standard/SCM/scm_ticketGrouping.js", "modules/tableKitV2/tableKitV2.js", "standard/SCM/scm_popupScreens.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_actionList.js", "standard/SCM/scm_generalPool.js", "standard/SCM/scm_poolTable.js"],
	scm_myPool			: ["modules/balloon/balloon.js", "modules/linedTree/linedTree.js", "standard/SCM/scm_tooltips.js", "standard/SCM/scm_ticketGrouping.js", "modules/tableKitV2/tableKitV2.js", "standard/SCM/scm_popupScreens.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_actionList.js", "standard/SCM/scm_poolTable.js", "standard/SCM/scm_hrwTicketObject.js"],
	scm_opmPool			: ["modules/balloon/balloon.js", "modules/linedTree/linedTree.js", "standard/SCM/scm_tooltips.js", "standard/SCM/scm_ticketGrouping.js", "modules/tableKitV2/tableKitV2.js", "standard/SCM/scm_popupScreens.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_actionList.js", "standard/SCM/scm_opmPool.js", "standard/SCM/scm_poolTable.js", "standard/SCM/scm_hrwTicketObject.js"],
	scm_teamPool		: ["modules/balloon/balloon.js", "modules/linedTree/linedTree.js", "standard/SCM/scm_tooltips.js", "standard/SCM/scm_ticketGrouping.js", "modules/tableKitV2/tableKitV2.js", "standard/SCM/scm_popupScreens.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_actionList.js", "standard/SCM/scm_teamPool.js", "standard/SCM/scm_poolTable.js", "standard/SCM/scm_hrwTicketObject.js"],
	scm_createTicket	: ["modules/balloon/balloon.js", "modules/ckeditor/ckeditor.js", "standard/dm/uploadModule.js", "modules/linedTree/linedTree.js", "standard/SCM/scm_tooltips.js", "standard/SCM/scm_ticketGrouping.js", "standard/SCM/scm_createTicket.js", "standard/SCM/scm_ticketScreen.js", "modules/tableKitV2/tableKitV2.js", "standard/SCM/scm_popupScreens.js", "modules/groupedLayout/groupedLayout.js", "standard/SCM/scm_ticketDocuments.js", "standard/SCM/scm_selectionBox.js", "standard/SCM/scm_hrwTicketObject.js"],
	scm_editTicket		: ["modules/balloon/balloon.js", "modules/ckeditor/ckeditor.js", "standard/dm/uploadModule.js", "modules/linedTree/linedTree.js", "standard/SCM/scm_tooltips.js", "standard/SCM/scm_ticketAction.js", "standard/SCM/scm_ticketGrouping.js", "standard/SCM/scm_viewEditTicket.js", "standard/SCM/scm_editTicketNew.js", "standard/SCM/scm_ticketScreen.js", "standard/SCM/scm_ticketActions.js", "modules/tableKitV2/tableKitV2.js", "standard/SCM/scm_popupScreens.js", "modules/groupedLayout/groupedLayout.js", "standard/SCM/scm_ticketDocuments.js", "standard/SCM/scm_selectionBox.js", "standard/SCM/scm_hrwTicketObject.js", "standard/SCM/scm_mailAttachObject.js", "standard/SCM/scm_mailInputObject.js"],
	scm_ticketApp		: ["standard/SCM/scm_ticketAction.js", "standard/SCM/scm_ticketApp.js"],
	scm_ticketDocuments	: ["standard/dm/uploadModule.js", "modules/groupedLayout/groupedLayout.js", "modules/tooltip/tooltip.js", "standard/SCM/scm_ticketDocuments.js", "modules/tableKitV2/tableKitV2.js", "standard/SCM/scm_popupScreens.js", "standard/SCM/scm_selectionBox.js"],
	scm_viewTicket		: ["modules/balloon/balloon.js", "modules/ckeditor/ckeditor.js", "standard/dm/uploadModule.js", "modules/linedTree/linedTree.js","modules/tooltip/tooltip.js", "standard/SCM/scm_tooltips.js", "standard/SCM/scm_ticketAction.js", "standard/SCM/scm_ticketGrouping.js", "standard/SCM/scm_viewEditTicket.js", "standard/SCM/scm_viewTicketNew.js", "standard/SCM/scm_ticketScreen.js", "standard/SCM/scm_ticketActions.js", "modules/tableKitV2/tableKitV2.js", "standard/SCM/scm_popupScreens.js"],
	scm_searchTicket	: ["modules/balloon/balloon.js", "modules/linedTree/linedTree.js", "standard/SCM/scm_tooltips.js", "standard/SCM/scm_ticketGrouping.js", "modules/tableKitV2/tableKitV2.js", "standard/SCM/scm_popupScreens.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_actionList.js", "standard/SCM/scm_searchTicket.js", "standard/SCM/scm_poolTable.js"],
	scm_employeeHistory	: ["modules/balloon/balloon.js", "modules/linedTree/linedTree.js", "standard/SCM/scm_tooltips.js", "standard/SCM/scm_ticketGrouping.js", "modules/tableKitV2/tableKitV2.js", "standard/SCM/scm_popupScreens.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_actionList.js", "standard/SCM/scm_employeeHistory.js", "standard/SCM/scm_poolTable.js"],
	scm_ticketTasks		: ["modules/tableKitV2/tableKitV2.js", "standard/SCM/scm_ticketTasks.js"],
	scm_agentPreferences: ["standard/SCM/scm_agentPreferences.js"],

	PM_processMonitoring: ["standard/web_frameworks/scriptaculous/src/slider.js", "modules/SliderModule/SliderModule.js", "modules/flowChart/excanvas.js", "modules/flowChart/FlowChart.js", "modules/flowChart/FlowChartArrowsDrawer.js", "modules/flowChart/FlowChartDataManager.js", "modules/flowChart/FlowChartElementsDrawer.js", "modules/flowChart/FlowChartElementsManager2.js", "modules/GanttChart/GanttElements.js", "modules/GanttChart/GanttDisplayLogic.js", "modules/GanttChart/GanttPeriodChooser.js", "modules/GanttChart/GanttElementDisplayer.js", "modules/flowChart/shapeDrawer.js","modules/viewSelector/viewSelector.js", "modules/dhtmlxgantt/dhtmlxcommon.js", "modules/dhtmlxgantt/dhtmlxgantt2.js","modules/balloon/balloon.js", "modules/linedTree/linedTree.js", "standard/processMng/pm_processMonitoringManager.js","standard/processMng/pm_processMonitoringInstanceView.js","standard/parentCalendar/parentCalendar.js","standard/calendar/calendar.js","standard/processMng/pm_menus.js", "standard/processMng/pm_processMonitoringTree.js", "standard/processMng/pm_processMonitoringList.js", "standard/processMng/pm_processMonitoringGantt.js", "standard/processMng/pm_processMonitoring.js", "standard/fastEntry/fastEntryMenu.js", "modules/tableKitV2/tableKitV2.js", "modules/tableKitV2/tableKitV2WithPreferences.js", "standard/reporting/reporting.js", "standard/reporting/Rept_standAlone.js" ,"standard/processMng/pm_instanceView_sa.js"],
	PM_processScheduling: ["standard/web_frameworks/scriptaculous/src/slider.js", "modules/SliderModule/SliderModule.js", "modules/linedTree/linedTree.js", "modules/multiSelect/multiSelect.js", "modules/selectionScreenGenerator/selScreenGenerator.js", "modules/Wizard/Wizard.js","standard/processMng/pm_processMonitoringManager.js","standard/processMng/pm_processMonitoringInstanceView.js", "standard/processMng/pm_processScheduling.js", "modules/flowChart/FlowChart.js", "modules/flowChart/FlowChartArrowsDrawer.js", "modules/flowChart/FlowChartDataManager.js", "modules/flowChart/FlowChartElementsDrawer.js", "modules/flowChart/FlowChartElementsManager2.js", "modules/flowChart/shapeDrawer.js", "standard/processMng/pm_processMonitoringManager.js"],
	
	SM_DashBoard: ["modules/balloon/balloon.js", "modules/linedTree/linedTree.js", "standard/SCM/scm_tooltips.js", "standard/processMng/pm_menus.js", "standard/SCM_Main/scm_main_processes.js", "standard/SCM/scm_ticketGrouping.js", "modules/tableKitV2/tableKitV2.js", "standard/SCM/scm_popupScreens.js", "standard/SCM/scm_myPool.js", "standard/SCM/scm_actionList.js", "standard/SCM/scm_poolTable.js", "standard/SCM_Main/scm_main_dashboard.js"],

    /*Onboarding*/
    Onboarding : ["standard/Onboarding/Onboarding.js","modules/tableKitV2/tableKitV2.js"],
    CARPOOL: ["standard/Onboarding/CarPool.js","modules/tableKitV2/tableKitV2.js"],
    CARPAGE: ["standard/Onboarding/CarPage.js" ],
    Models: ["standard/Onboarding/Models.js","modules/tableKitV2/tableKitV2.js"],
    modelPage: ["standard/Onboarding/PageModel.js"],
    PARAMEOB: ["standard/Onboarding/Parameters.js"],
    //TimeSchedule: ["standard/Onboarding/fastinit.js","standard/Onboarding/tablesort.js","standard/Onboarding/TimeSchedule.js" ],
    TimeSchedule: ["standard/Onboarding/tablesort.js", "standard/Onboarding/TimeSchedule.js", "modules/Wizard/Wizard.js"],
    PWS_ACTIONS: ["standard/Onboarding/TimeSchedulePage.js","modules/tableKitV2/tableKitV2.js"],
    WSR_ACTIONS: ["standard/Onboarding/WorkSchedule.js"],
    //PDChange
    PDChange:            ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js","modules/tableKitV2/tableKitV2.js","standard/personalDataChange/quotaReport.js","modules/reportTable/reportTable.js"],    
    YINPDChange: ["standard/personalDataChange/PDChange.js", "standard/personalDataChange/pendingRequestContent.js", "modules/tableKitV2/tableKitV2.js", "countries/IN/YINPDChange.js"],
    //Canadian tax forms
    YCA_TAXF: ["countries/CA/ca_TaxForms.js","modules/tablekit/tablekitWithSearch.js"],
    QuotaManagement:     ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js","standard/personalDataChange/personalDataChange.js"],
    PayRelatedData:      ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js","standard/personalDataChange/personalDataChange.js"],
    PersonalDevelopment: ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js","standard/personalDataChange/personalDataChange.js"],
    CorporateData:       ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js","standard/personalDataChange/personalDataChange.js"],
    KPI_temp:            ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js","standard/personalDataChange/personalDataChange.js"],
    PersonalDetails:     ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js","standard/personalDataChange/personalDataChange.js"],
    Dependents: ["standard/personalDataChange/PDChange.js", "standard/benefits/dependents.js"],
    HealthPlanScreen2: ["standard/personalDataChange/PDChange.js", "standard/benefits/benefitsScreens.js"],
    SuppLifeScreen: ["standard/personalDataChange/PDChange.js", "standard/benefits/benefitsScreens.js"],
    BeneficiariesPanel: ["standard/personalDataChange/PDChange.js", "standard/benefits/benefitsScreens.js"],
    DependentsPanel: ["standard/personalDataChange/PDChange.js", "standard/benefits/benefitsScreens.js"],
    PosTimeEvent:        ["standard/personalDataChange/PDChange.js","standard/personalDataChange/pendingRequestContent.js" , "standard/posTimeInformation/posTimeInformation.js","modules/titledPanel/titledPanel.js","modules/timeScheduleVisualizer/TimeScheduleVisualizer.js","modules/progressBar/progressBar.js","modules/multiSelect/multiSelect.js","modules/balloon/balloon.js"],
    TimeError: ["standard/posTimeInformation/timeError.js"],
    reportTable: ["modules/tableKitV2/tableKitV2.js"],  
    
	//start reporting and analytics
	RA_reptResViewer: ["standard/reporting/RA_repUnmWidget.js","modules/balloon/balloon.js","modules/linedTree/linedTree.js" ,"modules/tableKitV2/tableKitV2.js", "modules/tableKitV2/tableKitV2WithPreferences.js","modules/multiSelect/multiSelect.js","modules/progressBar/progressBar.js", "standard/reporting/reporting.js", "standard/reporting/Rept_standAlone.js", "standard/reporting/RA_reptResViewer.js"],
	RA_comparisonTool:[
					"standard/SCC/SCC_myKeyPositions.js", "standard/SCC/SCC_MyNominees.js",	"modules/chartingTool/lib/prototype-adapter.src.js", "modules/chartingTool/lib/highcharts.src.js",	"modules/chartingTool/lib/bluff/base/excanvas.js", "modules/chartingTool/lib/bluff/base/js-class.js", "modules/chartingTool/lib/bluff/base/BluffBase.js",	"modules/chartingTool/lib/bluff/base/BluffRenderer.js",	"modules/chartingTool/lib/bluff/base/BluffEvent.js","modules/chartingTool/lib/bluff/base/BluffTableReader.js",	"modules/chartingTool/lib/bluff/base/BluffToolTips.js",	"modules/chartingTool/lib/bluff/base/Radar.js",	"modules/chartingTool/lib/bluff/BluffChartGenerator.js", "standard/web_frameworks/scriptaculous/src/slider.js",
					,"modules/viewSelector/viewSelector.js", "standard/comparisonTool/RA_comparisonToolRatingBoxes.js", "standard/comparisonTool/RA_comparisonToolEditDiv.js", "standard/comparisonTool/RA_comparisonTool.js", "standard/comparisonTool/RA_comparisonToolController.js", 
					"standard/comparisonTool/RA_comparisonToolDataView.js", "standard/comparisonTool/RA_comparisonToolChartView.js", "standard/comparisonTool/RA_comparisonToolConf.js", "modules/balloonOnHover/balloonOnHover.js"
					],	
	ChartRenderer: ["modules/chartingTool/lib/prototype-adapter.src.js", "modules/chartingTool/lib/highcharts.src.js", "modules/chartingTool/lib/exporting.src.js", "modules/chartingTool/lib/bluff/base/excanvas.js", "modules/chartingTool/lib/bluff/base/js-class.js", "modules/chartingTool/lib/bluff/base/BluffBase.js", "modules/chartingTool/lib/bluff/base/BluffRenderer.js", "modules/chartingTool/lib/bluff/base/BluffEvent.js", "modules/chartingTool/lib/bluff/base/BluffTableReader.js","modules/chartingTool/lib/bluff/base/BluffToolTips.js", "modules/chartingTool/lib/bluff/base/Radar.js", "modules/chartingTool/lib/bluff/BluffChartGenerator.js",
					"standard/charting/data.js", "modules/balloon/balloon.js", "modules/chartingTool/ChartingToolBalloon.js", "modules/chartingTool/ChartingTool.js", "modules/chartingTool/ChartingToolImpl.js", "modules/chartingTool/MapRenderer.js", "standard/charting/testCharting.js","modules/tableKitV2/tableKitV2.js", "modules/tableKitV2/tableKitV2WithPreferences.js"],
															
	AdHocReporting: ["standard/adHocReporting/adHocReporting.js"],
	PublicationTool: ["standard/adHocReporting/adHocReporting.js", "standard/adHocReporting/PublicationTool.js"],
	KPIWidget: ["modules/multiSelect/multiSelect.js", "modules/infoPopUp/infoPopUp.js","modules/semitransparentBuilder/semitransparentBuilder.js",  "modules/linedTree/linedTree.js",  'standard/FWK/GetWidgets/GetWidgets.js', 'standard/dashboard/KpiGetWidgets.js', 'standard/dashboard/KPI_treeDisplayController.js', 'standard/dashboard/ColorPicker.js','standard/dashboard/KPI_parametersSelectionScreen.js', 'standard/dashboard/KPI_parametersControl.js', 'standard/dashboard/KPI_widgetController.js', 'standard/dashboard/KPIWidget.js'],
	Dashboard: ["standard/dashboard/Dashboard.js","modules/infoPopUp/infoPopUp.js","modules/semitransparentBuilder/semitransparentBuilder.js","modules/groupedLayout/groupedLayout.js"],
    Reporting: ["standard/reporting/RA_repUnmWidget.js", "standard/reporting/reporting.js","modules/balloon/balloon.js","modules/linedTree/linedTree.js" ,"modules/tableKitV2/tableKitV2.js", "modules/tableKitV2/tableKitV2WithPreferences.js","modules/multiSelect/multiSelect.js","modules/progressBar/progressBar.js"],
   	Rept_standAlone: ["standard/reporting/RA_repUnmWidget.js","modules/balloon/balloon.js","modules/linedTree/linedTree.js" ,"modules/tableKitV2/tableKitV2.js", "modules/tableKitV2/tableKitV2WithPreferences.js","modules/multiSelect/multiSelect.js","modules/progressBar/progressBar.js", "standard/reporting/reporting.js", "standard/reporting/Rept_standAlone.js"],
	XBoxGrid: ["standard/SCC/SCC_myKeyPositions.js", "standard/SCC/SCC_MyNominees.js", "standard/PFM/parentPFM.js","standard/reporting/XBoxGrid.js","modules/groupedLayout/groupedLayout.js","modules/boxGrid/boxGrid.js"],
	//end reporting and analytics
    settings: ["standard/personalDataChange/PDChange.js", "standard/FWK/settings/settings.js","standard/personalDataChange/pendingRequestContent.js"],
	
    //DM
	contentApprover: ["standard/help/contentApprover.js"],
    MyDocuments: ["modules/viewSelector/viewSelector.js","modules/tableKitV2/tableKitV2.js","standard/dm/coverflow.js","standard/dm/myDocuments.js"],
    MyDocuments_admin: [ "modules/viewSelector/viewSelector.js","modules/tableKitV2/tableKitV2.js","standard/dm/coverflow.js","standard/dm/myDocuments_admin.js"],
    SendDocumentHistory: [ "modules/tableKitV2/tableKitV2.js","standard/dm/sendDocument_transaction.js","standard/dm/sendDocumentHistory.js"],
    SendDocumentHistory_admin: [ "modules/tableKitV2/tableKitV2.js","standard/dm/sendDocument_transaction.js","standard/dm/sendDocumentHistory_admin.js"],
    LegalHolds: [ "modules/tableKitV2/tableKitV2.js","standard/dm/legalHoldList.js"],
    //UploadModule: ["standard/dm/uploadModule.js"],
	//SendDocument_Transaction: ["standard/dm/uploadModule.js"],
    CoversheetSD: ["standard/dm/sendDocument_transaction.js"],
    SendDocument: ["standard/dm/sendDocument_transaction.js","standard/dm/uploadModule.js","standard/dm/sendDocument.js"],
    SendDocument_admin: ["standard/dm/sendDocument_transaction.js","standard/dm/uploadModule.js","standard/dm/sendDocument_admin.js"],
    ExpiredDocuments: ["modules/viewSelector/viewSelector.js","modules/tableKitV2/tableKitV2.js","standard/dm/expiredDocs.js"],

    // RC
    RC_RequisitionRecruiter: ["standard/RC/tableKitWithPreferences.js", "standard/rc/viewRequisitions.js", "modules/tableKitV2/tableKitV2.js", "modules/viewSelector/viewSelector.js", "modules/Wizard/Wizard.js", "modules/rangeSlider/rangeSlider.js", "modules/groupedLayout/groupedLayout.js", "modules/ckeditor/ckeditor.js", "modules/multiSelect/multiSelect.js", "modules/balloon/balloon.js", "standard/RC/RC_showCandidatesReq.js", "standard/rc/requestedCandidatesMenu.js", "standard/dm/uploadModule.js", "standard/rc/RC_candidateOverview.js", "standard/rc/rc_extendedGetContentModule.js", "modules/progressBar/progressBar.js"],
    RC_MyProfile: ["standard/rc/myProfile.js", "standard/rc/requestedCandidatesMenu.js", "modules/groupedLayout/groupedLayout.js","modules/multiSelect/multiSelect.js", "modules/rangeSlider/rangeSlider.js","standard/dm/uploadModule.js", "standard/rc/rc_extendedGetContentModule.js"],
    RC_VacanciesTemp: ["standard/rc/vacanciesTemp.js"],
    RC_COMPCATL: ["standard/rc/RC_compCatl.js", "modules/balloon/balloon.js", "modules/treeHandler/treeHandler.js"],
    RC_jobApplication: ["standard/rc/RC_jobApplication.js","standard/rc/myProfile.js", "modules/groupedLayout/groupedLayout.js", "modules/multiSelect/multiSelect.js","modules/ckeditor/ckeditor.js", "standard/RC/RC_jobListing.js", "standard/rc/myProfile.js", "modules/rangeSlider/rangeSlider.js"],
	RC_jobListing: ["standard/RC/RC_jobListing.js", "standard/RC/tableKitWithPreferences.js", "modules/tableKitV2/tableKitV2.js", "modules/balloon/balloon.js", "standard/rc/rc_extendedGetContentModule.js","modules/ckeditor/ckeditor.js", "standard/rc/myProfile.js"],
	RC_Administration: ["standard/RC/RC_administration.js"],
	RC_Applications: ["standard/RC/tableKitWithPreferences.js", "modules/tableKitV2/tableKitV2.js", "modules/balloon/balloon.js", "standard/RC/RC_Applications.js", "standard/rc/rc_extendedGetContentModule.js", "standard/rc/myProfile.js"],
	RC_Preferences: ["standard/RC/RC_Preferences.js"],
	OMRequisitionReq: ["standard/rc/viewRequisitions.js", "standard/RC/tableKitWithPreferences.js", "standard/RC/OMRequisitionReq.js", "modules/Wizard/Wizard.js", "modules/rangeSlider/rangeSlider.js", "modules/groupedLayout/groupedLayout.js", "modules/multiSelect/multiSelect.js", "standard/dm/uploadModule.js", "modules/ckeditor/ckeditor.js", "standard/RC/RC_showCandidatesReq.js", "standard/rc/requestedCandidatesMenu.js", "standard/rc/RC_candidateOverview.js", "standard/rc/rc_extendedGetContentModule.js", "modules/progressBar/progressBar.js"],
	RC_inboxReq: ["standard/RC/RC_inboxReq.js"],
	RC_ApplicationTab: ["standard/rc/RC_CandidateApplication.js", "standard/rc/RC_CandidateApplicationSteps.js", "standard/rc/RC_CandAppMyProfile.js", "modules/Wizard/Wizard.js", "standard/rc/rc_extendedGetContentModule.js","standard/RC/tableKitWithPreferences.js","standard/FWK/advancedSearch/advancedSearch.js","standard/RC/RC_candidatesAdvancedSearch.js","modules/tableKitV2/tableKitV2.js","modules/balloon/balloon.js","standard/rc/RC_candidateOverview.js","modules/multiSelect/multiSelect.js","standard/rc/requestedCandidatesMenu.js","modules/ckeditor/ckeditor.js","modules/groupedLayout/groupedLayout.js", "modules/rangeSlider/rangeSlider.js", "modules/progressBar/progressBar.js"],
	RC_Favorites: ["standard/rc/RC_favorites.js"],
	RC_DashboardStaffing: ["standard/rc/RC_DashboardStaffing.js ", "standard/rc/rc_extendedGetContentModule.js", "standard/RC/tableKitWithPreferences.js", "modules/tableKitV2/tableKitV2.js", "modules/balloon/balloon.js", "modules/multiSelect/multiSelect.js", "standard/rc/RC_candidateOverview.js", "modules/ckeditor/ckeditor.js", "standard/dm/uploadModule.js", "standard/rc/requestedCandidatesMenu.js", "modules/rangeSlider/rangeSlider.js", "modules/groupedLayout/groupedLayout.js", "modules/progressBar/progressBar.js"],	

    //GC catalogues
    GCpositionCat: ["standard/FWK/GenericCatalog/GenericCatalog.js", "standard/GCposCat/GCposCat.js", "modules/treeHandler/treeHandler.js"]
});

CUSTOMER_FILES = $H();

NORMAL_VERSION_FILES = ["modules/autocompleter/autocompleter.js", "modules/infoPopUp/infoPopUp.js",
                        "modules/unmovableWidgets/unmovableWidgets.js", "modules/widgets/widgets.js",
                        "modules/buttonDisplayer/megaButtonDisplayer.js",
                        "modules/tablekit/tablekit.js",
                        "standard/FWK/GetWidgets/GetWidgets.js",
                        "standard/help/help.js",
						"standard/FWK/appNavigation/appNavigation.js",
						"standard/help/relatedLinks.js", "standard/km/authBar.js", "standard/rc/MyProfileMenu.js","standard/km/contentBrowser.js"];
LITE_VERSION_FILES = ["lite/autocompleter/autocompleter.js", "modules/infoPopUp/infoPopUp.js",
                        "Lite/widgets/widgets.js",
                        "Lite/buttonDisplayer/megaButtonDisplayer.js", 
                        "lite/tablekit/tablekit.js",
                        "Lite/GetWidgets/GetWidgets.js",
						"standard/help/help.js",
                        "standard/FWK/appNavigation/appNavigation.js", "standard/km/authBar.js", "standard/rc/MyProfileMenu.js"];
/**
 * Hash that tells us which files should be substituted by others if we are using liteVersion
 */
ALTERNATIVE_LITE_FILES = $H({
	"modules/ckeditor/ckeditor.js": "lite/ckeditor/ckeditor.js"
});

/**
* @fileOverview global.js
*@description the global object keeps all the useful information
*for the applications and rest of the objects created by the EWS Framework
*/

/**
* @description global object variable
*/
var global;

/**
* @constructor
* @description class that describes the global object features and behavior
*/
var Global = Class.create(origin,
/**
* @lends Global
*/
	{
	usettingsJson: null, // @description Json Get Usettings
	logOffTime: 1800, // @description EWS Framework log off time in milliseconds
	validDateFormats:
	    ['DD.MM.YYYY',
	    'MM/DD/YYYY',
	    'MM-DD-YYYY',
	    'YYYY.MM.DD',
	    'YYYY/MM/DD',
	    'YYYY-MM-DD',
	    'YYYY/MM/DD'],
	nullDate: '0000-00-00',
	reloadEWS: false, //@description true if EWS should be reloaded and false in other way
	usettingsLoaded: false, //true if all the data coming from get_usettings is loaded
	GCdetailsOpened: $H(),
	PAIfired: false, //to know in the getContent if a PAI service has been fired
	dateFormat: 'dd.MM.yyyy', //user date display format
	buttonsByAppid: $H(),
	validNumberFormats:
	    ['1.234.567,89',
	    '1,234,567.89',
	    '1 234 567,89'],
	hourFormat: "HH:mm", //the hour format to use with datejs Date objects.
	hourDisplayFormat: "12", //the hour format to use when displaying fields.
	numberFormat: '1.234.567,89', //user number display format
	thousandsSeparator: '.', //description Separator for thousands in number format
	commaSeparator: ',', //Separator for decimals in number format
	idSeparators: '[]', //user id separators
	idSeparatorLeft: '[', //user id separator for the left
	idSeparatorRight: ']', //user id separator for the right
	paginationLimit: 20, //user maximum number of items shown on a table in the EWS Framework
	maxSelectedEmployees: 10, //user maximum number of employees selected on the left menus
	maxEmployeesShown: 20, //user maximum number of employees shown on my Selections left menu
	calendarsStartDay: 1, //user calendars start day of week
	showId: null, //whether to show the Ids in My Selections or not
	showTopMenu: true, //user topMenu configuration; if should it be shown or not
	language: 'EN', //user language
	timeDiffUTC: null, //Difference in hours between local time and UTC
	hrwLogin: null, //Login used for HRW
	activateHRWLog: null, //Indicate if the log actions are to display
	translations: null, //the list of translations
	companies: null, //hash with the info about the different companies for the user.
	applications: [], //every instantiable application will be kept here
	currentApplication: null, //ID of the current application being run
	navigationData: $H({ //topMenu structure is kept in this global attribute
	    topMenu: $H({}),
	    mainMenu: $H({})
	}),
	tabid_mnmid: $H({}), //tabid - main areas relationships
	currentPopUp: null, //Object of the current infoPopUp shown
	kmAuthModeEnabled: false,
	kmAuthSimulationEnabled: false,
	kmAuthStatus: "DRAFT",
	tabid_sbmid: $H({}), // Tabids - subareas relationships
	leftMenusList: $H({}), //Different left menus lists indexed by tabId
	populations: $H({}), //Hash with another Hash for each one of the populations.
	populationsSelected: $H({}), // Hash with all the employees that have been selected with advanced search
	advancedSearchResults: $H(), //Array containing all the applications that need a popUp before open the next one
	popUpBeforeClose: [], //Whether the current selection type is single, multiple or none
	currentSelectionType: null, // user applications roles are kept in this global attribute
	sbmid_roles: $H({}),
	delegations: $H({}),
	labels: $H({}), //Framework labels
	topMenu: null, //topMenu application object
	leftMenu: null, //leftMenu application object
	maxLeftMenusNumber: null, //Maximum number of left menus.
	searchInputApplication: null, //searchInput application object
	takeRoleApplication: null, //takeRoleOf application object
	tabid_applicationData: $H(), //store all the applications with tabId, appId and view
	advancedSearchId: 'STD_P2', //store the Id for the advancedSearch, by default STD_P2
	delayTime: 10, //time that the info message is going to be showed
	appid_tabid: $H({}), //Keeps the relationship between an application ID and it's parent tab
	viewsCount: $H(), //It keeps a count on how many times is a view being used (to know whether to use child classes or not)
	servicesCache: new ServicesCache(), //here we keep all the already called services xmlJSON data
	labelsCache: $H({}),
	hisMan: null,
	blacklist: $H({ //A Hash with a black list, if the developer wants to avoid some applications, should add it here.
	    mnmid: [],
	    sbmid: [],
	    tbmid: [],
	    tpmid: [],
	    appid: [],
	    view: []
	}),
	colors: null, //Hash with the color list for each one of the employee IDs
	colorsStyle: null, //The HTML element containing the colors CSS classes
	redirectURL: null, //URL to redirect when logoff 
	showLoadingMsg: true,
	pendingCalls: $H({}), //Hash to keep track of currently pending AJAX calls

	// LEFT MENUS
	// ***********************************************************************************
	fixedLeftMenus: [], //An array of left menus which are always shown (hardcoded)
	tabid_leftmenus: $H({}), //the menus that has to be loaded for each application.
	hasTab: false, // If one appId have a tabId associated is true, else false.
	showGroupingsMySelections: false, /** If true, we will show myGroupings part in mySelections */
	/**
	* Applications that will be loaded from the begining.
	* They have their id as value.
	* This data should be loaded from SAP, instead of hard coding it!
	*/
	INIT_APPS: $H({
	    LOGOFF: "LOGOFF"
	}),
	allApps: $A(), //All the applications valid for a user.
	allStarterApps: $H(), // All the applications valid for a user at the beggining.
	/**
	* Hash containing the information about groups for each population.
	* The key for this hash is the populationId.
	* Each population will have this data:
	* - defaultGroup: the id for the default group in that population
	* - groups: hash containing the groups for that population.
	* The key for this hash is the groupId
	* For each group we will have the following data:
	* 	- id: id for the group
	*  - name: name of the group
	*  - members: a hash containing the ids of the members of the group.
	*  - loaded: boolean, useful to know if we have to call SAP for the data
	*  - isDefault: true if it's the default group  
	*/
	groups: $H(),
	redLabels: false, //boolean to know if we have to highline the labels if they are missing
	hideCopyright: false, //boolean to know if we have to hide the copyright message or not
	refreshObjects: $H(), //Hash that stores for each object the views that should be reloaded

	initialize: function ($super, usettingsJSON) {
	    $super();
	    this.virtualContent = $("content");
	    if (!Object.isEmpty(usettingsJSON)) {
	        this.usettingsJson = usettingsJSON;
	    }

	    // Parse FWK labels
	    if (usettingsJSON.EWS.labels) {
	        this.parseLabels(usettingsJSON.EWS.labels, 'FWK');
	    }
	    if (usettingsJSON.EWS.o_birthday) {
	        this.showBirthdays = usettingsJSON.EWS.o_birthday;
	    }
	    if (usettingsJSON.EWS.o_99klt) {
	        this.readCustomerFolder = usettingsJSON.EWS.o_99klt;
	    }
	    var hourformatfield = usettingsJSON.EWS.o_99fdt;
	    if (hourformatfield) {
	        if (hourformatfield == "1") {
	            this.hourDisplayFormat = "12";
	        }
	        else if (hourformatfield == "2") {
	            this.hourDisplayFormat = "24";
	        }
	    }
	    if (usettingsJSON.EWS.o_gcc) {
	        this.customer = usettingsJSON.EWS.o_gcc;
	    }
	    if (usettingsJSON.EWS.o_population) {
	        this.totalEmployees = this.getPopPagination(usettingsJSON);
	    }
	    if (usettingsJSON.EWS.o_rightm) {
	        this.rightPanels = usettingsJSON.EWS.o_rightm;
	    }
	    if (usettingsJSON.EWS.o_max_rec) {
	        this.maximumRecurrences = usettingsJSON.EWS.o_max_rec;
	    }
	    if (usettingsJSON.EWS.o_logoff) {
	        this.logOffTime = usettingsJSON.EWS.o_logoff;
	    }
	    if (usettingsJSON.EWS.o_99lan) {
	        this.userLanguage = usettingsJSON.EWS.o_99lan;
	    }
	    // Setting global attributes up
	    if (usettingsJSON.EWS.o_object) {
	        this.objectType = usettingsJSON.EWS.o_object['@otype'];
	        this.objectId = usettingsJSON.EWS.o_object['@objid'];
	        this.objectPicId = usettingsJSON.EWS.o_object['@pic_id'];
	    }
	    if (usettingsJSON.EWS.o_dmc) {
	        this.dmc = usettingsJSON.EWS.o_dmc;
	    }
	    // get the object type
	    if (usettingsJSON.EWS.o_object) {
	        this.name = usettingsJSON.EWS.o_object["@name"];
	    }
	    // get the object type
	    if (usettingsJSON.EWS.o_99sad) {
	        this.advancedSearchId = usettingsJSON.EWS.o_99sad;
	    }
	    // get the date format and convert it to make datejs compatible
	    if (usettingsJSON.EWS.o_date) {
	        this.dateFormat = (this.validDateFormats.indexOf(usettingsJSON.EWS.o_date)) ? usettingsJSON.EWS.o_date : this.validDateFormats[0];
	        this.dateFormat = this.dateFormat.gsub("DD", "dd").gsub("YYYY", "yyyy");
	    }
	    // get the number format and extract separators for comma and thousand
	    if (usettingsJSON.EWS.o_decimal) {
	        this.numberFormat = (this.validNumberFormats.indexOf(usettingsJSON.EWS.o_decimal)) ? usettingsJSON.EWS.o_decimal : this.validNumberFormats[0];
	        this.millionsSeparator = this.numberFormat.charAt(5);
	        this.thousandsSeparator = this.numberFormat.charAt(1);
	        this.commaSeparator = this.numberFormat.charAt(9);
	    }
	    // Get the id separators and split them
	    if (usettingsJSON.EWS.o_sepid) {
	        this.idSeparators = usettingsJSON.EWS.o_sepid;
	        this.idSeparatorLeft = this.idSeparators.charAt(0);
	        this.idSeparatorRight = this.idSeparators.charAt(1);
	    }
	    // Get the showId indicator (whether to show ids on left menus or not)
	    if (usettingsJSON.EWS.o_showid) {
	        this.showId = true;
	    } else {
	        this.showId = false;
	    }
	    // Get the pagination limit
	    if (usettingsJSON.EWS.o_pag) {
	        this.paginationLimit = parseInt(usettingsJSON.EWS.o_pag, 10);
	    }
	    // Get the default company
	    if (usettingsJSON.EWS.o_def_comp) {
	        this.defaultCompany = usettingsJSON.EWS.o_def_comp;
	    }
	    // Get the maximum number of selected employees
	    if (usettingsJSON.EWS.o_maxsel) {
	        this.maxSelectedEmployees = parseInt(usettingsJSON.EWS.o_maxsel, 10);
	    } else {
	        this.maxSelectedEmployees = 10;
	    }
	    // Get the maximum number of employees shown
	    if (usettingsJSON.EWS.o_sel) {
	        this.maxEmployeesShown = usettingsJSON.EWS.o_sel;
	    }
	    // Get the calendar start day (Monday or Sunday)
	    if (usettingsJSON.EWS.o_start) {
	        this.calendarsStartDay = usettingsJSON.EWS.o_start;
	    }
	    // Get whether to show the top menu or not
	    if (usettingsJSON.EWS.o_showtop) {
	        this.showTopMenu = usettingsJSON.EWS.o_showtop.toLowerCase() == 'x';
	    }
	    // Get the companies list
	    if (usettingsJSON.EWS.o_companies) {
	        this.setCompanies(usettingsJSON);
	    }
	    // Gets the delegations if they exists to show the takeRoleOf application
	    if (usettingsJSON.EWS.o_substitution) {
	        this.setDelegations(usettingsJSON);
	    }
	    // Get the translations
	    if (usettingsJSON.EWS.o_translations) {
	        this.setTranslations(usettingsJSON);
	    }

	    //Get the groups:
	    if (usettingsJSON.EWS.o_population) {
	        this.setGroups(usettingsJSON.EWS.o_population);
	    }
	    //Get the URL for redirecting after logoff
	    if (usettingsJSON.EWS.o_redirect_url) {
	        this.redirectURL = usettingsJSON.EWS.o_redirect_url
	    }
	    if (usettingsJSON.EWS.o_99uil) {
	        this.delayTime = parseInt(usettingsJSON.EWS.o_99uil, 10);
	    }
	    if (usettingsJSON.EWS.o_utcdiff) {
	        this.timeDiffUTC = {
	            time: usettingsJSON.EWS.o_utcdiff,
	            sign: (usettingsJSON.EWS.o_utcsign === '-') ? '-' : '+'
	        };
	    }

	    if (usettingsJSON.EWS.o_hrwlogin)
	        this.hrwLogin = usettingsJSON.EWS.o_hrwlogin;

	    this.activateHRWLog = false;

	    if (usettingsJSON.EWS.o_laiso) {
	        this.language = usettingsJSON.EWS.o_laiso;
	        //Create a meta tag to let the user and browser know the language
	        $('fwk_head').insert(new Element("meta", {
	            "id": "fwk_languageTag",
	            "http-equiv": "Content-Language",
	            "content": this.language.toLowerCase()
	        }));
	    }
	    if (usettingsJSON.EWS.o_missing_labels)
	        if (usettingsJSON.EWS.o_missing_labels == 'Y')
	            this.redLabels = true;
	    if (usettingsJSON.EWS.o_sap_client)
	        this.client = usettingsJSON.EWS.o_sap_client;

	    if (usettingsJSON.EWS.o_99scr)
	        this.screenNavigationLayout = usettingsJSON.EWS.o_99scr;
	    if (usettingsJSON.EWS.o_maxonl)
	        this.maxOnline = parseInt(usettingsJSON.EWS.o_maxonl);
	    if (usettingsJSON.EWS.o_99sor)
	        this.nameHire = parseInt(usettingsJSON.EWS.o_99sor);

	    //O_99MYS: Parameter to show or not grroupings in mySelections
	    if (usettingsJSON.EWS.o_99mys && usettingsJSON.EWS.o_99mys.toLowerCase() == "x")
	        this.showGroupingsMySelections = true;


	    if (this.showGroupingsMySelections) {
	        this.usettingsLoaded = true;
	        this.setAppsNavigation(usettingsJSON);
	        this.setMenus(usettingsJSON);
	    }
	    this.setPopulations(usettingsJSON);
	    this.liteVersion = liteVersion;
	},
	/**
	* Function to handle the open application and so keep a log of the current application being run
	* and also the current selected population's suffix
	*/
	open: function (args) {
	    if (args && !args.get) {
	        args = $H(args);
	    }
	    var appId;
	    var tabId;
	    var view;
	    var mode;
	    this.leftMenuShowed = true;

	    //Get the application data stored on global
	    var app;
	    //not arguments given it will open the default application
	    if (!args) {
	        appId = this.firstApp.appId;
	        tabId = this.firstApp.tabId;
	        view = this.firstApp.view;
	        //set mode to normal
	        mode = null;
	        app = this.firstApp;
	    }
	    else {
	        //hidding the copyright message after the first page
	        if (this.hideCopyright) {
	            $('fwk_copyRight').hide();
	            this.hideCopyright = false;
	        }
	        //get the data to get the application its storage on global
	        appId = args.get("app").appId;
	        tabId = args.get("app").tabId;
	        view = args.get("app").view;
	        if (!this.lastAppId || this.lastAppId != appId)
	            this.lastAppId = appId;
	        else
	            return;
	        if (appId.toLowerCase() == 'logoff')
	            tabId = 'popUp';
	        if (!Object.isEmpty(tabId)) {
	            //check if the app is opened in popup mode
	            if (tabId.toLowerCase() == 'popup')
	                mode = 'popUp';
	            //check if the app is opened in subapp mode
	            if (tabId.toLowerCase() == 'subapp')
	                mode = 'sub';
                //Checks for the application should be opened to load the subapplication
	            this.appNeedToBeOpened = !Object.isEmpty(args.get("appNeedToBeOpened")) ? args.get("appNeedToBeOpened") : null;
	        }
	        if (mode) {
	            var population;
	            var position = args.get('position');
	            var hasTabId = this.getTabIdByAppId(appId);
	            //If the application use noRefreshLeftMenu, means that the mydetails menu, and myselection will not be updated.
	            if (!Object.isEmpty(args.get('req_ta')) || !Object.isEmpty(args.get('noRefreshLeftMenu')))
	                if (args.get('req_ta') == 'C' || args.get('noRefreshLeftMenu') == true)
	                    this.leftMenuShowed = false;
	            if (!this.hasTab) {
	                if (mode != 'popUp') {
	                    var populationName = this.getPopulationName({ 'appId': appId, 'tabId': hasTabId });
	                    population = this.populations.get(populationName);
	                }
	                var applicationData = {
	                    tpmid: this.currentApplication.tpmid,
	                    mnmid: this.currentApplication.mnmid,
	                    sbmid: this.currentApplication.sbmnid,
	                    appId: appId,
	                    view: view,
	                    tabId: tabId,
	                    "default": true,
	                    loaded: false,
	                    population: population,
	                    position: position,
	                    mode: mode,
	                    refreshLeftMenu: this.leftMenuShowed
	                };
	                this.allApps.push(applicationData.appId);
	                //add view at the table is neccesary
	                if (!this.viewsCount.get(view)) {
	                    this.viewsCount.set(view, 1);
	                } else {
	                    this.viewsCount.set(view, this.viewsCount.get(view) + 1);
	                }
	                //fill in the appid-tabid table
	                if (!this.appid_tabid.get(applicationData.appId)) {
	                    this.appid_tabid.set(applicationData.appId, applicationData.tabId);
	                }
	                //If the tab is not added yet, it's added
	                if (!this.tabid_applicationData.get(tabId)) {
	                    this.tabid_applicationData.set(tabId, {
	                        "applications": $A([applicationData])
	                    });
	                }
	                //when the tab added already
	                else {
	                    //it's enqueued
	                    this.tabid_applicationData.get(tabId).applications.push(applicationData);
	                }
	                app = this.tabid_applicationData.get(tabId).applications.find(function (application) {
	                    return application.appId == appId;
	                } .bind(this));
	            }
	            else {
	                app = this.tabid_applicationData.get(hasTabId).applications.find(function (application) {
	                    return application.appId == appId;
	                } .bind(this));
	                app.mode = mode;
	                app.position = position;
	            }
	        }
	        else {
	            //if the application is stored under popup or subapp tab we delete and put it under the "real" tab
	            if (this.tabid_applicationData.get('POPUP')) {
	                var popupsApplications = this.tabid_applicationData.get('POPUP').applications;
	                this.tabid_applicationData.get('POPUP').applications = popupsApplications.reject(function (popApp) {
	                    if (popApp.appId == appId) {
	                        this.appid_tabid.set(appId, tabId);
	                        popApp.tabId = tabId;
	                        popApp.mode = null;
	                        if (!this.tabid_applicationData.get(tabId)) {
	                            this.tabid_applicationData.set(tabId, {
	                                "applications": $A([popApp])
	                            });
	                        }
	                        else {
	                            this.tabid_applicationData.get(tabId.toUpperCase()).applications.push(popApp);
	                        }
	                        return true;
	                    }
	                } .bind(this));
	                if (this.tabid_applicationData.get('POPUP').applications.length == 0) {
	                    delete (this.tabid_applicationData._object.POPUP);
	                }
	            }
	            //1051631: When an application is opened in SubApp mode, it shouldn't be stores in the hash
	            if (this.getTabIdByAppId(appId) == "SUBAPP") {
	                this.appid_tabid.unset(appId);
	            }
	            //get according to appId
	            if (appId && !tabId) {
	                tabId = this.getTabIdByAppId(appId);
	            }
	            //get according to tabId
	            var addAppToTable = true;
	            // TODO mira si puedes usar el metodo fillPopulationForApp para esto, por que hace lo mismo.

	            for (var i = 0; i < this.tabid_applicationData.get(tabId.toUpperCase()).applications.length && addAppToTable; i++) {
	                if (this.tabid_applicationData.get(tabId.toUpperCase()).applications[i].appId == appId.toUpperCase()) {
	                    app = this.tabid_applicationData.get(tabId.toUpperCase()).applications[i];
	                    app.mode = mode;
	                    app.position = position;
	                    addAppToTable = false;
	                }
	            }
	        }

	        //check if the application is added to the table, if not, we add it
	        if (addAppToTable) {
	            var copyDefault = deepCopy(this.tabid_applicationData.get(tabId.toUpperCase()).applications.first());
	            copyDefault["appId"] = appId;
	            copyDefault["className"] = null;
	            copyDefault["default"] = false;
	            copyDefault["loaded"] = false;
	            copyDefault["tabId"] = tabId;
	            copyDefault["view"] = view;
	            copyDefault["population"] = $H();
	            copyDefault["refreshLeftMenu"] = this.leftMenuShowed;
	            var populationKeys = this.tabid_applicationData.get(tabId.toUpperCase()).applications.first()["population"].keys();
	            for (var i = 0; i < populationKeys.length; i++) {
	                copyDefault["population"].set(populationKeys[i], {
	                    multiSelected: false,
	                    singleSelected: false
	                });
	            }
	            //if (Object.isEmpty(this.topMenu.appList.get(appId))) {
	            this.topMenu.appList.set(appId, $H({ mainApp: copyDefault['mnmid'], subApp: copyDefault['sbmid'] }));
	            //}
	            this.tabid_applicationData.get(tabId.toUpperCase()).applications.push(copyDefault);
	            if (Object.isEmpty(this.viewsCount.get(copyDefault.view)))
	                this.viewsCount.set(copyDefault.view, 1);
	            else
	                this.viewsCount.set(copyDefault.view, this.viewsCount.get(copyDefault.view) + 1);
	            this.allApps.push(copyDefault.appId);
	            app = copyDefault;
	        }
	    }

	    if (app.loaded)
	        this.runApplication(app, mode, args);
	    else
	    //get the file if needed
	        this.getFile(app, mode, args, true);

	},
	//run the application
	runApplication: function (app, mode, args) {
	    //close the current opened application if any
	    if (this.currentApplication && !mode) {
	        var currentClassName = this.currentApplication.className;
	        this.previousApplication = this.currentApplication;
	        window[currentClassName + "_instance"].close();
	    }
	    //close the current opened sub application if any
	    if (this.currentSubApplication && mode != 'popUp') {

	        var subSubApp = args.get('keepSubOpened');
	        if (!subSubApp) {
	            this.closeSubApplication();
	            if (this.currentSubSubApplication)
	                this.closeSubSubApplication();
	        }
	    }

	    //update the current application variables and set the
	    //current selection type too
	    if (mode != "popUp") {
	        if (mode != "sub") {
	            this.currentApplication = app;
	            this.currentSelectionType = this.getSelectionType(app, mode);
	        } else {
	            if (!subSubApp) {
                    //If the current application doesn't match with app needed to be opened, the sub application doesn't load
	                if (!Object.isEmpty(this.appNeedToBeOpened) && (this.appNeedToBeOpened != this.currentApplication.appId)) {
	                    this.appNeedToBeOpened = null;
	                    return
	                }
	                this.currentSubApplication = app;
	                this.currentSelectionType = this.getSelectionType(app, mode);
	            }
	            else {
	                this.currentSubSubApplication = app;
	                this.currentSelectionType = this.getSelectionType(app, mode);
	            }
	        }
	    }
	    //open the application
	    window[app.className + "_instance"].run(args);
	    toggleChildsOfElement(this.virtualContent,true);
	    //Hide the loading application screen if existing
	    if ($("loading_app") && $("loading_app").visible) {
	        $("loading_app").hide();
	        $("loading_app_semitrans").hide();
	    }
	    var actualRole = this.getPopulationName(app);
	    //Check if we have the left menu information before refresh the menu
	    if (!Object.isEmpty(this.populations.get(actualRole))) {
	        this.updateMenus(app, mode);
	    }
	    else {
	        this.getNewPopulation(actualRole, app, mode);
	    }
	},

	updateMenus: function (app, mode) {
	    if (window[app.className + "_instance"].options.population) {
	        if (this.previousApplication) {
	            if (this.getSelectionType(this.previousApplication) != "none") {
	                this.previousAppMode = this.getSelectionType(this.previousApplication);
	                this.oldPopulation = global.getPopulationName(this.previousApplication)
	            } else {
	                this.previousAppMode = "none";
	                this.oldPopulation = "NOPOP";
	            }
	        }
	        else {
	            this.previousAppMode = null;
	            this.oldPopulation = null;
	        }
	        window[app.className + "_instance"].afterRun(true, this.previousAppMode, this.oldPopulation);
	    }
	    // fire the event which will keep the menus updated
	    if (mode != 'popUp' && this.leftMenuShowed) {

	        this.leftMenu.onOpenApplication(app);
	        this.topMenu.applicationOpen({ app: app, mode: mode }); //previous line this.topMenu.applicationOpen({ app: app.appId, mode: mode });
	        if (this.historyManager) {
	            this.historyManager.openApplication({ app: app.appId, mode: mode });
	        }
	        document.fire("EWS:changeScreen", $H(app));
	    }
	},

	initializeApplicationByAppId: function (appId) {
	    if (this.allApps.include(appId)) {
	        var app = this.getApplicationByAppId(appId);
	        this.getFile(app, null, null, false);
	    }
	},

	/**
	* Creates an instance for a given application data
	* @param {JSON} applicationData The data for the application that you want to create an instance
	*/
	initializeApplication: function (applicationData, mode, args, runApplication) {
	    //Checking if we have to instanciate also a left menu for the application
	    //see if we have menus for our tabId
	    if (!Object.isEmpty(this.tabid_leftmenus.get(applicationData.tabId))) {
	        //for each left menu, check if it's instanciated or not
	        for (var i = 0; i < this.tabid_leftmenus.get(applicationData.tabId).keys().length; i++) {
	            var menusAlreadyInstance = this.leftMenu.menusInstances.keys();
	            if (!menusAlreadyInstance.include(this.tabid_leftmenus.get(applicationData.tabId).keys()[i])) {
	                var menuKey = this.tabid_leftmenus.get(applicationData.tabId).keys()[i];
	                var menuValue = this.leftMenu.menusClassNames.get(menuKey);
	                var menuOptions = this.leftMenu.menusOptions.get(menuKey).options;
	                if (window[menuValue]) {
	                    this.leftMenu.menusInstances.set(menuKey, new window[menuValue](menuKey, menuOptions));
	                }
	            }
	        }
	    }
	    //for a view used more than once create a subclass of the original
	    //view and an instance of this subclass
	    if (this.viewsCount.get(applicationData.view) > 1) {
	        applicationData.className = applicationData.appId + "_" + applicationData.view;
	        //create the subclass.
	        window[applicationData.className] = Class.create(window[applicationData.view], {

	            initialize: function ($super, options) {
	                $super(options);
	            },

	            run: function ($super, args) {
	                $super(args);
	            },

	            close: function ($super) {
	                $super();
	            }
	        });

	        window[applicationData.className + "_instance"] = new window[applicationData.className](applicationData);
	        //set loaded as true to not instantiate it again.
	        applicationData.loaded = true;
	    }
	    //for a view used just once, create a normal instance.
	    else {
	        applicationData.className = applicationData.view;
	        window[applicationData.className + "_instance"] = new window[applicationData.className](applicationData);
	        //set loaded as true to not instantiate it again.
	        applicationData.loaded = true;
	    }
	    var i = 0;

	    this.tabid_applicationData.get(applicationData.tabId).applications.find(function (appl, index) {
	        i = index;
	        return appl.appId == applicationData.appId;
	    });
	    this.tabid_applicationData.get(applicationData.tabId).applications[i] = applicationData;
	    if (runApplication)
	        this.runApplication(applicationData, mode, args);
	},
	/**
	* Function to handle the open application of the previous application before to make an open
	*/
	goToPreviousApp: function (args) {
	    var appHash = $H(args);
	    appHash.set("app", {
	        "appId": this.previousApplication.appId,
	        "tabId": this.previousApplication.tabId,
	        "view": this.previousApplication.view
	    });
	    this.open(appHash);
	},
	// GET METHODS
	// ***********************************************************************************
	/**
	* Fills the tabId depending on appId
	* @param {appId} 
	*/
	getTabIdByAppId: function (appId) {
	    if (!Object.isEmpty(this.appid_tabid.get(appId.toUpperCase()))) {
	        this.hasTab = true;
	        return this.appid_tabid.get(appId.toUpperCase());
	    }
	    else {
	        this.hasTab = false;
	        if (!Object.isEmpty(this.currentApplication)) {
	            return this.currentApplication.tabId;
	        } else {
	            return null;
	        }
	    }
	},
	getAppIdByView: function (view) {
	    var apps = this.tabid_applicationData.keys()
	    for (var i = 0; i < apps.size(); i++) {
	        var app = this.tabid_applicationData.get(apps[i]);
	        if (app.applications[0].view.toUpperCase() == view.toUpperCase()) {
	            return app.applications[0].appId;
	        }
	    }
	},
	getPopPagination: function (usettingsJSON) {
	    var auxHash = $H();
	    var populations = objectToArray(usettingsJSON.EWS.o_population.yglui_str_population);
	    for (var i = 0; i < populations.length; i++) {
	        if (populations[i]['@population_pag'] == 'X') {
	            auxHash.set(populations[i]['@population_id'], populations[i]['@population_rec']);
	        }
	    }
	    return auxHash;
	},
	/**
	* Gets all the employees that are in the current node of MySelections. A function
	* will be called with the results when they are ready.
	* @param {Object} handler Function that will be called after getting the results.
	*/
	getAllEmployeesMySelections: function (handler) {
	    if (!Object.isEmpty(this.leftMenu.menusInstances.get('SELECT'))) {
	        this.leftMenu.menusInstances.get('SELECT').getAllEmployees(handler);
	    } else {
	        //If there is no MySelections we will call the function, with null as result
	        handler.curry(null).call;
	    }
	},
	/**
	* Gets all the data for an application depending on its tabId
	* @param {String} tabId The desired application tabId
	* @returns an structure with the application's data
	*/
	getApplicationByTabId: function (tabId) {
	    var applications = this.tabid_applicationData.get(tabId).applications;
	    return applications;
	},
	/**
	* Gets all the data for an application depending on its appId
	* @param {String} appId The desired application appId
	* @returns an structure with the application's data
	*/
	getApplicationByAppId: function (appId) {
	    var applications = this.getApplicationByTabId(this.getTabIdByAppId(appId));
	    return applications.find(function (app) {
	        return app.appId == appId;
	    });

	},
	getNewPopulation: function (roles, app, mode) {
	    if (!roles) {
	        var actualRoles = [];
	        //Getting the first application to load
	        var firstApp = this.usettingsJson.EWS.o_landing_page['@appid'];
	        //Getting the roles for that applications
	        var roles = objectToArray(this.usettingsJson.EWS.o_role_sub.yglui_str_role_sub);
	        for (var j = 0; j < roles.length; j++) {
	            if (!Object.isEmpty(roles[j].menus)) {
	                var appRoles = objectToArray(roles[j].menus.yglui_str_submid)
	                for (var a = 0; a < appRoles.length; a++) {
	                    if (firstApp == appRoles[a]['@appid']) {
	                        if (!actualRoles.include(roles[j]['@rolid']))
	                            actualRoles.push(roles[j]['@rolid']);
	                    }
	                }
	            }
	        }
	    }
	    else {
	        var actualRoles = roles.split('_');
	    }
	    var rolesToSend = { yglui_str_rolid: [] };
	    for (var i = 0; i < actualRoles.length; i++) {
	        rolesToSend.yglui_str_rolid.push({ '@rolid': actualRoles[i] });
	    }
	    var jsonToSend = {
	        EWS: {
	            SERVICE: 'GET_POPULATION',
	            PARAM: {
	                ROLIDS: rolesToSend,
	                O_FROM: 1
	            }
	        }
	    };


	    var conversor = new XML.ObjTree();
	    conversor.attr_prefix = '@';
	    var xmlin = conversor.writeXML(jsonToSend);
	    //and make the call to the service
	    this.makeAJAXrequest($H({
	        xml: xmlin,
	        successMethod: this.managePopulation.bind(this, true, app, mode),
	        errorMethod: this.managePopulation.bind(this, true, app, mode)
	    }));
	},
	/**
	* Gets the color class assigned to an employee.
	* @param {String} employeeID
	* @return {JSON} a JSON object with to attributes: <ul><li>background: class name for the background color</li>
	* <li>text: class name for the text color</li></ul>
	*/
	getColor: function (employeeId) {
	    var colors = this.colors.get(employeeId);
	    if (!colors) {
	        colors = this.addColor(employeeId);
	    }
	    return colors;
	},
	/**
	* @description DEPRECATED
	* @param labelId {string} label id to be returned
	*/
	getLabel: function (labelId) {
	    if (this.redLabels)
	        return (this.labels.get(labelId)) ? this.labels.get(labelId) : "<span class='frameworkMissingLabel'>" + labelId + "</span>";
	    else
	        return (this.labels.get(labelId)) ? this.labels.get(labelId) : labelId;
	},
	/**
	* Gets the <img> associated to an employee
	* @param {Object} empPernr EmployeeId
	* @param {Object} imgClass Class to apply to the <img> class
	*/
	getPicture: function (empPernr, imgClass) {
	    var noPicture = "user.jpg" //Dummy Picture
	    var img = new Element('img', { 'id': 'img' + empPernr, 'class': 'content', 'src': noPicture }); //img html element which contains the "dummy" picture
	    var getPictureService = "GET_PICTURE"; //Employee picture backend service
	    var idPicture = !Object.isEmpty(global.getEmployee(empPernr)) ? global.getEmployee(empPernr).picId : null;
	    if (idPicture != null) {
	        var xmlin = ""
            + "<EWS>"
               + "<SERVICE>" + getPictureService + "</SERVICE>"
                + "<OBJECT TYPE=''/>"
                + "<PARAM>"
                    + "<I_V_CONTENT_ID>" + idPicture + "</I_V_CONTENT_ID>"
                + "</PARAM>"
            + "</EWS>";
	        var url = this.url;
	        while (('url' in url.toQueryParams())) {
	            url = url.toQueryParams().url;
	        }
	        url = (Object.isEmpty(Object.values(url.toQueryParams())[0])) ? url + '?xml_in=' : url + '&xml_in=';
	        img = new Element('img', { 'id': 'img' + empPernr, 'class': 'content', 'src': url + xmlin });
	    }
	    if (!Object.isEmpty(imgClass)) {
	        img.addClassName(imgClass);
	    }
	    return img;
	},
	/**
	* Get the name for the current population
	* @param {String} application The application whose population wants to be known
	* @return {String} The population name
	*/
	getPopulationName: function (application) {
	    if (Object.isString(application)) {
	        var appId = application;
	    }
	    else {
	        var appId = application.appId;
	        if (this.appid_tabid.keys().length != 0) {
	            if (!this.allStarterApps.get(appId)) {
	                appId = this.getAppIdByTabId(application.tabId);
	            }
	        }
	    }

	    if (!appId || !this.sbmid_roles.get(appId)) {
	        if (this.currentSubApplication)
	            appId = this.currentSubApplication.appId;
	        else
	            appId = null;
	        if (!appId) {
	            return "NOPOP";
	        }
	    }
	    var population = this.sbmid_roles.get(appId);
	    if (Object.isEmpty(population)) {
	        return "NOPOP";
	    }
	    else {
	        var populationName = population.roleName;
	        if (!populationName) {
	            populationName = "NOPOP";
	        }
	        return populationName;
	    }
	},
	getCompanyName: function () {
	    var gcc = getURLParam("gcc");
	    var lcc = getURLParam("lcc");
	    var companyId = gcc + lcc;
	    if (!Object.isEmpty(this.companies)) {
	        if (Object.isEmpty(this.companies.get(companyId))) {
	            companyId = this.defaultCompany['@yygcc'] + this.defaultCompany['@yylcc'];
	        }
	        var name = this.companies.get(companyId).name;
	    }
	    var title = '';
	    if (Object.isEmpty(name))
	        title = global.getLabel('MyCompany');
	    else
	        title = name;

	    return title;
	},
	/**
	* Get the tabId for the current population
	* @param {String} application The tabId whose appId wants to be known
	* @return {String} The appId
	*/
	getAppIdByTabId: function (tabId) {
	    var appId;
	    var applications = this.appid_tabid.keys();
	    for (var i = 0; i < applications.length; i++) {
	        var currentTabId = this.appid_tabid.get(applications[i]);
	        if (tabId == currentTabId)
	            return applications[i];
	    }
	    return appId;
	},
	/**
	* Gets the actual population
	*/
	getActualPopulation: function () {
	    if (Object.isEmpty(this.currentApplication)) {
	        return null;
	    }
	    if (!Object.isEmpty(this.currentSubApplication)) {
	        var populationName = this.getPopulationName(this.currentSubApplication);
	    }
	    else {
	        var populationName = this.getPopulationName(this.currentApplication);
	    }
	    if (!populationName) {
	        return null;
	    }
	    return this.populations.get(populationName);
	},
	/**
	* Returns the selected employees, in an array.
	* It will return null if any problem occurs
	*/
	getSelectedEmployees: function () {
	    if (Object.isEmpty(this.currentApplication)) {
	        return null;
	    }
	    if (!Object.isEmpty(this.currentSubApplication)) {
	        var populationName = this.getPopulationName(this.currentSubApplication);
	    }
	    else {
	        var populationName = this.getPopulationName(this.currentApplication);
	    }
	    if (!populationName) {
	        return null;
	    }
	    var population = this.populations.get(populationName);
	    if (Object.isEmpty(population)) {
	        return null;
	    }
	    var populationKeys = population.keys();
	    var result = $A();
	    for (var i = 0; i < populationKeys.size(); i++) {
	        if (this.employeeIsSelected(populationKeys[i])) {
	            result.push(populationKeys[i]);
	        }
	    }
	    return result;
	},
	/**
	* Returns the data of an employee in the present population (null, if it isn't in the selection)
	* @param {Object} employeeID The Id of the employee
	*/
	getEmployee: function (employeeID) {
	    if (Object.isEmpty(employeeID) || Object.isEmpty(this.currentApplication)) {
	        return null;
	    }
	    if (!Object.isEmpty(this.currentSubSubApplication)) {
	        var populationName = this.getPopulationName(this.currentSubSubApplication);
	    } else if (!Object.isEmpty(this.currentSubApplication)) {
	        var populationName = this.getPopulationName(this.currentSubApplication);
	    } else {
	        var populationName = this.getPopulationName(this.currentApplication);
	    }
	    if (!populationName) {
	        return null;
	    }
	    var population = this.populations.get(populationName);
	    return population.get(employeeID);
	},
	/**
	* Gets the selection mode depending on the application data
	*/
	getSelectionType: function (app, mode, menuId) {
	    var menuId = Object.isEmpty(menuId) ? "SELECT" : menuId; //We take select by default
	    var selectionType = null;

	    if (app)
	        var tabId = this.getTabIdByAppId(app.appId);

	    // set the current selection type based on the application that has just been opened.
	    if (this.tabid_leftmenus.get(tabId) && this.tabid_leftmenus.get(tabId).get(menuId)) {
	        var infoMenu = this.tabid_leftmenus.get(tabId).get(menuId);
	        switch (infoMenu.menuType) {
	            case "1":
	                selectionType = "single";
	                break;
	            case "2":
	                selectionType = "multi";
	                break;
	            case "NO":
	                selectionType = "none"; //Exception to allow my details no show checkboxes or radiobuttons
	                break;
	            default:
	                selectionType = "none";
	                break;

	        };
        //if no select menu to get the selection type set it as none
	    } else
	        selectionType = "none";

	    return selectionType;
	},
	//get the file from server
	getFile: function (app, mode, args, runApplication) {
	    if (!window[app.view]) {
	        this.loadFiles(CLASS_VIEW.get(app.view), app, mode, args, runApplication);
	    }
	    else {
	        this.initializeApplication(app, mode, args, runApplication);
	    }
	},
	/**
	* Checks if a screen has to be reloaded for the selected object
	* @param {Object} view
	* @param {Object} appid
	* @param {Object} screen
	* @param {Object} objectId
	* @param {Object} objectType
	*/
	getScreenToReload: function (view, appid, screen, objectId, objectType) {
	    //Check if we have all parameters
	    if (Object.isEmpty(objectId) || Object.isEmpty(objectType) || Object.isEmpty(view) || Object.isEmpty(appid) || Object.isEmpty(screen)) {
	        return false;
	    }
	    var objectKey = objectId + "_" + objectType;
	    //If the variable is set, return true
	    var screenKey = view + "_" + appid + "_" + screen;
	    if (!Object.isEmpty(this.refreshObjects.get(objectKey)) && !Object.isEmpty(this.refreshObjects.get(objectKey).get(screenKey))) {
	        return true;
	    } else {
	        return false;
	    }
	},
	// ***********************************************************************************
	// SET METHODS
	// ***********************************************************************************
	/**
	* sets the delegations from GET_USETTINGS
	* @param usettingsJSON {JSON} User settings JSON object
	*/
	setDelegations: function (usettingsJSON) {
	    objectToArray(usettingsJSON.EWS.o_substitution.yglui_str_delegated).each(function (delegation) {
	        this.delegations.set(delegation["@pernr"], {
	            begDate: delegation["@begda"],
	            endDate: delegation["@endda"],
	            employeeName: delegation["@ename"],
	            userName: delegation["@uname"],
	            active: delegation["@active"].toLowerCase() == "x",
	            reppr: delegation["@reppr"],
	            rtext: delegation["@rtext"]
	        });
	    } .bind(this));
	},
	/**
	* Set the list of companies for this user (if any)
	* @param usettingsJSON (JSON) User settings JSON object
	*/
	setCompanies: function (usettingsJSON) {
	    this.companies = $H({});
	    objectToArray(usettingsJSON.EWS.o_companies.yglui_str_company).each(function (company) {
	        var companyID = company["@yygcc"] + company["@yylcc"];
	        var companyName = company["@yylcct"] ? company["@yylcct"] : company["@yylcc"];

	        this.companies.set(companyID, {
	            gcc: company["@yygcc"],
	            lcc: company["@yylcc"],
	            name: companyName
	        });
	    } .bind(this));
	},
	/**
	* Unsets the reload parameter for all the objects in each of the views
	* @param {Object} screens An object or list of objects each containing:
	*     - view: the view for the app
	*     - appid: the id for the app
	*     - screen the number or id for the screen we want to refresh
	*/
	unsetReloadForScreens: function (screens) {
	    //Check if we have all parameters
	    if (Object.isEmpty(screens)) {
	        return;
	    }
	    var screensV = objectToArray(screens);
	    var refreshObjectsKeys = this.refreshObjects.keys();
	    for (var i = 0; i < refreshObjectsKeys.size(); i++) {
	        for (var j = 0; j < screensV.size(); j++) {
	            var screenKey = screensV[j].view + "_" + screensV[j].appid + "_" + screensV[j].screen;
	            this.refreshObjects.get(refreshObjectsKeys[i]).unset(screenKey);
	        }
	    }
	},
	/**
	* Sets the proper topMenu configuration hash handling the data
	* got from SAP
	* @param {JSON} xmlJson User settings JSON object
	*/
	setAppsNavigation: function (xmlJson) {
	    var aux = $H({
	        navigation: null,
	        top: null
	    });
	    //Setting the first application	   
	    var firsAppData = xmlJson.EWS.o_landing_page;
	    this.firstApp = {
	        tpmid: firsAppData["@tpmid"],
	        mnmid: firsAppData["@mnmid"],
	        sbmid: firsAppData["@sbmid"],
	        appId: firsAppData['@appid'],
	        view: firsAppData['@views'],
	        tabId: firsAppData["@tbmid"],
	        "default": firsAppData['@viewd'] ? true : false,
	        loaded: false,
	        population: $H()
	    };
	    objectToArray(xmlJson.EWS.o_get_menu.yglui_str_get_appl).each(function (app) {

	        //ignore the application if it's in the black list
	        if (this.blacklist.get("mnmid").include(app["@mnmid"]) ||
	    			this.blacklist.get("sbmid").include(app["@sbmid"]) ||
	    			this.blacklist.get("appid").include(app["@appid"]) ||
	    			this.blacklist.get("tbmid").include(app["@tbmid"]) ||
	    			this.blacklist.get("tpmid").include(app["@tpmid"]) ||
	    			this.blacklist.get("view").include(app["@views"])) {

	            return;
	        }
	        this.allApps.push(app['@appid']);
	        this.allStarterApps.set(app['@appid'], true);
	        //Add only applications coming with a view
	        if (!Object.isEmpty(app['@views'])) {

	            //increase in 1 the number of uses of this view.
	            if (!this.viewsCount.get(app["@views"])) {
	                this.viewsCount.set(app["@views"], 1);
	            } else {
	                this.viewsCount.set(app["@views"], this.viewsCount.get(app["@views"]) + 1);
	            }

	            var applicationData = {
	                tpmid: app["@tpmid"],
	                mnmid: app["@mnmid"],
	                sbmid: app["@sbmid"],
	                appId: app['@appid'],
	                view: app['@views'],
	                tabId: app["@tbmid"],
	                "default": app['@viewd'] ? true : false,
	                loaded: false,
	                population: $H()
	            };

	            //Set this application area and subarea
	            this.setAreaAndSubarea(applicationData);
	            //fills in the population for the application.
	            this.fillPopulationForApp(applicationData);

	            //fill in the appid-tabid table
	            if (!this.appid_tabid.get(applicationData.appId)) {
	                this.appid_tabid.set(applicationData.appId, applicationData.tabId);
	            }

	            //If the tab is not added yet, it's added
	            if (Object.isEmpty(this.tabid_applicationData.get(app["@tbmid"]))) {

	                this.tabid_applicationData.set(app["@tbmid"], {
	                    "applications": $A([applicationData])
	                });
	            }
	            //when the tab added already
	            else {
	                //it's enqueued
	                if (Object.isEmpty(app['@viewd'])) {
	                    this.tabid_applicationData.get(app['@tbmid']).applications.push(applicationData);
	                    //or set as the first one if it's the default application for the tab
	                } else {
	                    this.tabid_applicationData.get(app['@tbmid']).applications.unshift(applicationData);
	                }
	            }
	        }
	        // Main menu applications
	        // they have mnmid and not tpmid
	        if (Object.isEmpty(app["@tpmid"]) && app["@mnmid"] && this.tabid_applicationData.get(app["@tbmid"])) {
	            var applicationsArray = $A();
	            var tabHash = $H({
	                name: this.getLabel(app['@tbmid']),
	                appId: this.tabid_applicationData.get(app['@tbmid']).applications
	            });
	            var subHash = $H({});
	            // Se the submenu label
	            subHash.set(app['@sbmid'], $H({
	                name: this.getLabel(app['@sbmid']),
	                tabs: $H({})
	            }));
	            // And set the data for each one of the tabs in the submenu
	            subHash.get(app['@sbmid']).get('tabs').set(app['@tbmid'], tabHash);
	            var hash = $H({});
	            hash.set(app['@mnmid'], $H({
	                name: this.getLabel(app['@mnmid']),
	                subMenu: $H({})
	            }));
	            // Put the submenu in the main menu hash
	            hash.get(app['@mnmid']).set('subMenu', subHash);
	            if (!aux.get('navigation')) {
	                aux.set('navigation', hash);
	            } else {
	                aux.set('navigation', this.recursiveMerge(aux.get('navigation'), hash));
	            }
	        }
	        //if it's a top menu application with tabs (like the inbox or delegations)
	        else if (app['@tpmid'] && app['@tbmid'] && this.tabid_applicationData.get(app["@tbmid"])) {
	            // Set the tab properties for this application
	            var topTabHash = $H({
	                name: this.getLabel(app['@tbmid']),
	                appId: this.tabid_applicationData.get(app['@tbmid']).applications[0].appId
	            });
	            // Set the top menu hash for this application (including tabs)
	            var topSubHash = $H({});
	            topSubHash.set(app['@tpmid'], $H({
	                name: this.getLabel(app['@tpmid']),
	                tabs: $H({})
	            }));
	            topSubHash.get(app['@tpmid']).get('tabs').set(app['@tbmid'], topTabHash);
	            // set this Hash inside the appNavigation's top menu section
	            var topHash = $H({
	                topMenu: $H({})
	            });
	            topHash.set('topMenu', topSubHash);
	            if (!aux.get('top')) {
	                aux.set('top', topHash);
	            }
	            else {
	                aux.set('top', this.recursiveMerge(aux.get('top'), topHash));
	            }

	        }
	    } .bind(this));
	    this.navigationData.set('mainMenu', aux.get('navigation'));
	    if (aux.get("top")) {
	        this.navigationData.set('topMenu', aux.get('top').get('topMenu'));
	    }
	},
	/**
	* Sets an application area and subarea
	* @param {JSON} app is the application data as coming from GET_USETTINGS
	*/
	setAreaAndSubarea: function (app) {
	    var mainArea;
	    var subArea;
	    if (!app.mnmid) {
	        mainArea = "FWK";
	        subArea = "FWK";
	    } else {
	        mainArea = app.mnmid;
	        subArea = app.sbmid;
	    }
	    //add to the application sub area list
	    this.tabid_sbmid.set(app.tabId, subArea);
	    //add to the application main area list
	    this.tabid_mnmid.set(app.tabId, mainArea);
	},
	/**
	* Sets the proper left menus configuration hash handling the data
	* got from SAP
	* @param {JSON} xmlJSON User settings JSON object
	*/
	setMenus: function (xmlJSON) {
	    objectToArray(xmlJSON.EWS.o_leftm.yglui_str_wid_attributes).each(function (menu) {
	        this.leftMenusList.set(menu['@appid'], $H({
	            collapsed: menu['@collapsed'],
	            color: menu['@color'],
	            parentId: menu['@parentid'],
	            type: menu['@type'],
	            widColumn: menu['@widcolumn'],
	            widRow: menu['@widrow']
	        }));
	    } .bind(this));
	    this.maxLeftMenusNumber = this.leftMenusList.size();

	    // set the application - left menu map according to info from SAP
	    if (xmlJSON.EWS.o_mapping) {
	        // Loop the left menus data.
	        objectToArray(xmlJSON.EWS.o_mapping.yglui_str_left_menu).each(function (menu) {
	            if (!this.tabid_applicationData.get(menu["@tbmid"])) {
	                return;
	            }
	            var applicationSAPId = menu["@tbmid"];
	            var leftMenuSAPId = menu["@leftmid"];
	            // Get the web applications list for this tab.
	            var webApplications = this.tabid_applicationData.get(applicationSAPId).applications;
	            if (webApplications) {
	                webApplications.each(function (webApplication) {
	                    // Create the key if it doesn't exists
	                    if (!this.tabid_leftmenus.get(webApplication.tabId)) {
	                        this.tabid_leftmenus.set(webApplication.tabId, $H({}));
	                    }
	                    // Add the left menu to the web application
	                    if (!this.tabid_leftmenus.get(webApplication.tabId).get(leftMenuSAPId)) {
	                        if (menu["@type"]) {
	                            this.tabid_leftmenus.get(webApplication.tabId).set(leftMenuSAPId, {
	                                "menuType": menu["@type"],
	                                "advancedSearchId": menu["@sadv_id"],
	                                "rolid": menu["@rolid"]
	                            });
	                        } else {
	                            this.tabid_leftmenus.get(webApplication.tabId).set(leftMenuSAPId, true);
	                        }

	                    }
	                } .bind(this));
	            }
	        } .bind(this));
	    }
	},
	/**
	* Creates the structures needed to populate the different roles' populations
	* @param {JSON} xmlJSON the data coming from GET_USETTING service.
	*/
	setPopulations: function (xmlJSON) {
	    this.sbmid_roles = $H();
	    this.colors = $H();
	    // Get which roles does each application have and it's name.
	    if (xmlJSON.EWS.o_population) {
	        objectToArray(xmlJSON.EWS.o_role_sub.yglui_str_role_sub).each(function (role) {
	            // return since there's no populations assigned to this role.
	            if ("@menus" in role) {
	                return;
	            }
	            var roleID = role["@rolid"];

	            objectToArray(role.menus.yglui_str_submid).each(function (app) {
	                var submenuID = app["@sbmid"];
	                var appId = app['@appid'];
	                // if the role for this submenuID is not created, create it and populate the initial
	                // roleName and the first component role
	                if (!this.sbmid_roles.get(appId)) {
	                    this.sbmid_roles.set(appId, {
	                        roleName: roleID,
	                        roleComponents: [roleID],
	                        subMenu: submenuID
	                    });
	                }
	                // if already created ad a new role to both names and components.
	                else {
	                    var actualRoles = this.sbmid_roles.get(appId);
	                    actualRoles.roleName += "_" + roleID;
	                    actualRoles.roleComponents.push(roleID);
	                }
	            } .bind(this));
	        } .bind(this));
	    }

	    //Add actual employee to MySelections
	    var employeeData = {

	        type: this.objectType,
	        name: this.name,
	        singleSelected: true,
	        singleElement: null,
	        singleColor: 0,
	        multiSelected: true,
	        multiElement: null,
	        multiColor: 0,
	        actual: true,
	        picId: this.objectPicId
	    };
	    this._addEmployeeToPopulation(this.objectId, employeeData, "NOPOP");
	    if (!xmlJSON.EWS.o_population) {
	        //add the current employee so it's color is generated
	        if (!this.colors.get(this.objectId) != -1) {
	            this.colors.set(this.objectId, -1);
	        }
	        // Set the proper colors according to the user list.
	        this.setAvailableColorsList();
	    }
	    // don't continue as there's no populations generated for this user
	    if (xmlJSON.EWS.o_population) {
	        if (this.showGroupingsMySelections) {
	            this.managePopulation(false, null, null, xmlJSON);
	        }
	        else {
	            this.getNewPopulation();
	        }
	    }
	    else if (!this.showGroupingsMySelections) {
	        this.setAppsNavigation(this.usettingsJson);
	        this.setMenus(this.usettingsJson);
	        if (!this.usettingsLoaded)
	            this.usettingsLoaded = true;
	        else
	            this.usettingsLoaded = false;
	    }
	},
	/**
	* It generates a hash which uses pernr as key and the color as value.
	* 
	*/
	setAvailableColorsList: function () {
	    var style = new Element("style", {
	        type: "text/css"
	    });
	    // add the style tag into the web head tag
	    $$("head")[0].insert(style);
	    this.colorsStyle = style;
	    // add a color for each one of the actual employees on the populations.
	    //this.colors.each(this.addColor.bind(this));
	    this.addColor();
	},
	/**
	* Sets a label in global (won't be saved in backend) Will only set it when it does not exist
	* @param {Object} labelId The id for the new label
	* @param {Object} labelContent The content for the new label
	* @return true if set, false otherwise
	*/
	setLabel: function (labelId, labelContent) {
	    if (Object.isEmpty(this.labels.get(labelId))) {
	        this.labels.set(labelId, labelContent);
	        return true;
	    }
	    return false;
	},
	/**
	* Sets an employee as selected in the current application's population
	* @param {String} employee The employee ID
	* @param {boolean} selected true to select the employee, false to unselect
	* @param {boolean} fire used to avoid firing the event and making 
	*/
	setEmployeeSelected: function (employeeID, selected, fire) {
	    // don't double select the employee, exit the method if it's already selected

	    if (selected && this.employeeIsSelected(employeeID) || !selected && !this.employeeIsSelected(employeeID)) {
	        document.fire("EWS:employeeMenuSync", {
	            employeeId: employeeID,
	            selected: selected,
	            name: this.getEmployee(employeeID).name
	        });
	        return;
	    }

	    // get the current population name
	    if (!Object.isEmpty(this.currentSubSubApplication)) {
	        var populationName = this.getPopulationName(this.currentSubSubApplication);
	    }
	    else if (!Object.isEmpty(this.currentSubApplication)) {
	        var populationName = this.getPopulationName(this.currentSubApplication);
	    }
	    else {
	        var populationName = this.getPopulationName(this.currentApplication);
	    }
	    // get the current population and the selection type
	    var population = this.populations.get(populationName);
	    var selection = this.currentSelectionType;
	    //we have to take care if on myDetails there are more than one employee
	    this.populationOnMySelection = $H();
	    for (var i = 0; i < population.keys().length; i++) {
	        if (population.get(population.keys()[i]).actual == true) {
	            this.populationOnMySelection.set(population.keys()[i], population.get(population.keys()[i]));
	        }
	    }
	    //take care of the selections when it's working on single selectino mode.
	    if ((selection == "single" && selected) || (this.populationOnMySelection.keys().length >= 2 && selection != "multi" && selected)) {
	        population.keys().each(function (employee) {
	            if (this.employeeIsSelected(employee)) {
	                this.setEmployeeSelected(employee, false);
	            }
	        } .bind(this));
	    }

	    var employee = population.get(employeeID);
	    if (employee) {
	        if (selection = "none") {
	            employee["multiSelected"] = selected;
	            employee["singleSelected"] = selected;
	        }
	        employee[selection + "Selected"] = selected;
	    }
	    document.fire("EWS:employeeMenuSync", {
	        employeeId: employeeID,
	        selected: selected,
	        name: this.getEmployee(employeeID).name
	    });

	    //Notify the application about the employee selection
	    var className = this.currentApplication.className;
	    window[className + "_instance"].afterRun();

	    if (this.currentSubApplication && window[this.currentSubApplication.className + "_instance"].running) {
	        var subApplicationClassName = this.currentSubApplication.className;
	        window[subApplicationClassName + "_instance"].afterRun();
	    }
	    if (this.currentSubSubApplication && window[this.currentSubSubApplication.className + "_instance"].running) {
	        var subSubApplicationClassName = this.currentSubSubApplication.className;
	        window[subSubApplicationClassName + "_instance"].afterRun();
	    }
	},
	/**
	* Sets the reload variable to true for the selected screens for the selected object
	* @param {Object} screens An object or list of objects each containing:
	*     - view: the view for the app
	*     - appid: the id for the app
	*     - screen the number or id for the screen we want to refresh
	* @param {Object} objects An array with all the objects to set.Each one will have to be as this example:
	*         {objectId: "1293458723", objectType: "P"}
	*/
	setScreenToReload: function (screens, objects) {
	    //Check if we have all parameters
	    if (Object.isEmpty(objects) || Object.isEmpty(screens)) {
	        return;
	    }
	    var screensV = objectToArray(screens);
	    var objectsV = objectToArray(objects);
	    for (var i = 0; i < objectsV.size(); i++) {
	        var objectId = objectsV[i].objectId;
	        var objectType = objectsV[i].objectType;
	        var objectKey = objectId + "_" + objectType;
	        if (Object.isEmpty(this.refreshObjects.get(objectKey))) {
	            this.refreshObjects.set(objectKey, $H());
	        }
	        for (var j = 0; j < screensV.size(); j++) {
	            var screenKey = screensV[j].view + "_" + screensV[j].appid + "_" + screensV[j].screen;
	            this.refreshObjects.get(objectKey).set(screenKey, true);
	        }
	    }
	},
	/**
	* Unsets the reload variable to true for the selected screens for the selected object
	* @param {Object} screens An object or list of objects each containing:
	*     - view: the view for the app
	*     - appid: the id for the app
	*     - screen the number or id for the screen we want to refresh
	* @param {Object} objects An array with all the objects to set.Each one will have to be as this example:
	*         {objectId: "1293458723", objectType: "P"}
	*/
	unsetScreenToReload: function (screens, objects) {
	    //Check if we have all parameters
	    if (Object.isEmpty(objects) || Object.isEmpty(screens)) {
	        return;
	    }
	    var screensV = objectToArray(screens);
	    var objectsV = objectToArray(objects);
	    for (var i = 0; i < objectsV.size(); i++) {
	        var objectId = objectsV[i].objectId;
	        var objectType = objectsV[i].objectType;
	        var objectKey = objectId + "_" + objectType;
	        if (Object.isEmpty(this.refreshObjects.get(objectKey))) {
	            //If we don't have an entry for this object we don't need to do anything
	            return;
	        }
	        for (var j = 0; j < screensV.size(); j++) {
	            var screenKey = screensV[j].view + "_" + screensV[j].appid + "_" + screensV[j].screen;
	            this.refreshObjects.get(objectKey).unset(screenKey);
	        }
	    }
	},
	/**
	* Fills the group hash using the data received from SAP
	* @param {Object} groupData
	*/
	setGroups: function (groupData) {
	    var populationData = objectToArray(groupData.yglui_str_population);
	    this.groups = $H();
	    for (var i = 0; i < populationData.size(); i++) {
	        var defaultGroupId = "";
	        var populationGroups = $H();

	        //If this population has groups:
	        if (!Object.isEmpty(populationData[i].groups)) {
	            var groups = objectToArray(populationData[i].groups.yglui_str_group_obj);
	            for (var j = 0; j < groups.size(); j++) {
	                if (!Object.isEmpty(groups[j]['@groupid'])) {
	                    var groupId = groups[j]['@groupid'];
	                    //If the group doesn't have a name, we use the Id as name
	                    var groupName = groupId;
	                    if (!Object.isEmpty(groups[j]['@groupname'])) {
	                        groupName = groups[j]['@groupname'];
	                    }
	                    //Check if it's the default group
	                    var defaultGroup = !Object.isEmpty(groups[j]['@defgroup']) && ((groups[j]['@defgroup']).toLowerCase() == "x");
	                    var groupMembers = null;
	                    var loaded = false;
	                    if (defaultGroup) {
	                        defaultGroupId = groupId;
	                        //If it's the default, populate it
	                        if (!Object.isEmpty(populationData[i].population) && !Object.isEmpty(populationData[i].population.yglui_str_popul_obj)) {
	                            var defaultGroupPopulation = objectToArray(populationData[i].population.yglui_str_popul_obj);
	                            groupMembers = $H({});
	                            for (var k = 0; k < defaultGroupPopulation.size(); k++) {
	                                groupMembers.set(defaultGroupPopulation[k]['@objid'], defaultGroupPopulation[k]['@objid']);
	                            }
	                            loaded = true;
	                        }
	                    }
	                    //Add the group, using its id as key:
	                    populationGroups.set(groupId, { id: groupId, name: groupName, isDefault: defaultGroup, members: groupMembers, loaded: loaded });
	                }
	            }
	        }
	        this.groups.set(populationData[i]['@population_id'], { defaultGroup: defaultGroupId, groups: populationGroups });
	    }
	},
	// ***********************************************************************************
	// ADD METHODS
	// ***********************************************************************************
	/**
	* Adds a new color for the given employee and with the given index so it remains with the format whatever_eeColorXX
	* @param {Object} employee can be either a pernr or a Hash position (used when iteratin using Enumerable#each )
	* @param {Integer} index can be either a number or null. When null it's automatically calculated.
	* @return {String} The class name given to this employee.
	*/
	addColor: function (employee) {

	    if (Object.isEmpty(employee)) {
	        var array = this.colors.keys();
	    }
	    else {
	        var array = $A();
	        array.push(employee);
	    }
	    for (var i = 0; i < array.length; i++) {
	        var employeeId;

	        if (!Object.isEmpty(employee)) {
	            index = this.colors.size() + 1;
	        } else {
	            index = i + 1;
	        }
	        employeeId = array[i];

	        // Create the CSS class names and initial content
	        var employeeBackgroundClass = ".application_back_eeColor" + (index.toPaddedString(2)) + "{ color: #fff; background-color: ";
	        var employeeTextClass = ".application_color_eeColor" + (index.toPaddedString(2)) + "{ color: ";
	        var employeeBorderClass = ".application_border_color_eeColor" + (index.toPaddedString(2)) + "{ border-color: ";
	        var employeeWidgetBorderClass = ".application_border_widget_eeColor" + (index.toPaddedString(2)) + "{ border-left: ";
	        var employeeWidgetBottomBorderClass = ".application_border_widget_bottom_eeColor" + (index.toPaddedString(2)) + "{ border-bottom: 1px solid";
	        var employeeClass = ".eeColor" + (index.toPaddedString(2)) + "{ color: white; background-color: ";

	        // Generate the colors
	        var color1 = (Math.random() * 255).round();
	        var color2 = (Math.random() * 255).round();
	        var color3 = (Math.random() * 255).round();

	        if (color1 == color2 && color1 == color3) {
	            color2 = (Math.random() * 255).round();
	            color3 = (Math.random() * 255).round();
	        }

	        // mix the color with something a bit darker to avoid having too soft colors.
	        color1 = ((color1 + 150) / 2).round();
	        color2 = ((color2 + 150) / 2).round();
	        color3 = ((color3 + 150) / 2).round();

	        // Insert them properly on CSS classes
	        var hexColor = [color1, color2, color3].invoke('toColorPart').join('');
	        hexColor = "#" + hexColor;
	        employeeBackgroundClass += hexColor + "; } ";
	        employeeTextClass += hexColor + "; } ";
	        employeeBorderClass += hexColor + "; } ";
	        employeeWidgetBorderClass += "1px solid " + hexColor + "border-right: 1px solid " + hexColor + ";} ";
	        employeeWidgetBottomBorderClass += hexColor + "; } ";
	        employeeClass += hexColor + "; } ";

	        var cssText = employeeBackgroundClass + employeeTextClass + employeeBorderClass + employeeWidgetBorderClass + employeeWidgetBottomBorderClass + employeeClass;

	        // Put CSS classes on the style tag according to the browser
	        if (!Prototype.Browser.IE) {
	            this.colorsStyle.insert(cssText);
	        } else {
	            this.colorsStyle.styleSheet.cssText += cssText;
	        }

	        this.colors.set(employeeId, index);
	        if (!Object.isEmpty(employee)) {
	            // return the CSS class number used for this employee.
	            return this.colors.get(employeeId);
	        }
	    }
	},
	/**
	* Adds an employee to the current application's populations
	* @param {String} name the employee name
	* @param {String} employeeId the employee id
	* @param {String} type 
	* @param {String} pagination
	* @param {String} roleId
	* @param {String} picId
	*/
	addEmployee: function (name, employeeId, type, pagination, roleId, picId) {
	    if (Object.isEmpty(roleId)) {
	        var appId = this.currentApplication.appId;
	        role = this.sbmid_roles.get(appId);
	        if (!Object.isEmpty(role))
	            roleId = role.roleName;
	    }
	    else {
	        role = {
	            'roleName': roleId,
	            'roleComponents': roleId.split('_')
	        };
	    }
	    if (role) {
	        //if the application has a role
	        var roleName = role.roleName;
	        var roleComponents = role.roleComponents;
	        //look into all the roles
	        this.sbmid_roles.each(function (roleElement) {
	            roleComponents.each(function (roleComponentName) {
	                //for a role with similar components
	                if (roleElement.value.roleComponents.include(roleComponentName)) {
	                    //and include the employee inside this role if it doesn't exists yet
	                    if (!Object.isEmpty(this.populations.get(roleElement.value.roleName))) {
	                        var employeeData = {
	                            actual: false,
	                            multiSelected: false,
	                            singleSelected: false,
	                            name: name,
	                            type: type,
	                            picId: picId
	                        };
	                        this._addEmployeeToPopulation(employeeId, employeeData, roleElement.value.roleName);
	                    }
	                }
	            } .bind(this));
	        } .bind(this));
	        //Adding it to a list of advances search users:
	        this.advancedSearchResults.set(employeeId, {
	            actual: false,
	            multiSelected: false,
	            singleSelected: false,
	            name: name,
	            type: type
	        });
	        //Launching an event when an employee is added
	        if (this.sbmid_roles.get(this.currentApplication.appId).roleName == roleId)
	            document.fire("EWS:addEmployee", { 'employeeID': employeeId, 'pagination': pagination });
	    } else {
	        return;
	    }
	},
	/**
	* Adds an employee data to the population associated with a role
	* @param {Object} employeeId The id for the employee
	* @param {Object} employeeData Data associated with the employee
	* @param {Object} populationName Population name (normally the Role id)
	*/
	_addEmployeeToPopulation: function (employeeId, employeeData, populationName) {
	    if (!this.populations) {
	        this.populations = $H();
	    }
	    if (!this.populations.get(populationName)) {
	        this.populations.set(populationName, $H());
	    }
	    //Check if we already have this employeein this population
	    if (!this.populations.get(populationName).get(employeeId)) {
	        this.populations.get(populationName).set(employeeId, employeeData);
	    }
	},
	/**
	* Check if the user has the edit rights for HRW
	*/
	hasHRWEditRole: function () {
	    if (this.groups.get('SCM_AG')) return true;
	    if (this.groups.get('SCM_TE')) return true;
	    if (this.groups.get('SCM_OE')) return true;
	    return false;
	},
	/**
	* Parses the labels and stores it on the labelsCache
	* @param labels Labels node
	* @param area Labels scope
	*/
	parseLabels: function (labels, area) {
	    labels = objectToArray(labels.item);
	    this.labelsCache.set(area, $H());
	    var labelsSize = labels.size();
	    for (var i = 0; i < labelsSize; i++) {
	        this.labels.set(labels[i]['@id'], labels[i]['@value']);
	    }
	},
	/**
	* @description merges (recursively in every hash level) 
	* two given hashes returning the result
	* @param mhash1 {Hash} first hash to be merged
	* @param mhash2 {Hash} second hash to be merged
	* @return the merged version of the hashes given as argument
	*/
	recursiveMerge: function (mhash1, mhash2) {
	    var itHasHashInside = false;
	    var hashes = $H({});
	    var ret = mhash1.clone();
	    mhash1.each(function (field) {
	        if (Object.isHash(field.value) && mhash2.get(field.key)) {
	            hashes.set(field.key, this.recursiveMerge(mhash1.get(field.key), mhash2.get(field.key)));
	            itHasHashInside = true;
	        }
	    } .bind(this));
	    if (itHasHashInside) {
	        hashes.each(function (field) {
	            ret.set(field.key, field.value);
	        });
	        return ret;
	    }
	    else {
	        return mhash1.merge(mhash2);
	    }
	},

	/**
	* It fills the application data with its own copy of the employee selection
	* so it can handle the delta with other applications
	* @param {JSON} applicationData the application's data coming from SAP
	*/
	fillPopulationForApp: function (applicationData) {
	    if (this.getPopulationName(applicationData)) {
	        var populationName = this.getPopulationName(applicationData);
	        if (!Object.isEmpty(this.populations.get(populationName))) {
	            this.populations.get(populationName).each(function (employee) {
	                applicationData.population.set(employee.key, {
	                    multiSelected: false,
	                    singleSelected: false
	                });
	            });
	        }
	    }
	},
	/**
	* Manages a population when receiving it from get_Usettings, or when using GET_POPULATION
	* @param {Object} newPop Will be true when we are getting a new population, not in get_usettings
	* @param {Object} app if it is a new population, the app we are getting it for
	* @param {Object} mode 
	* @param {Object} xmlJSON The JSON with the population
	*/
	managePopulation: function (newPop, app, mode, xmlJSON) {
	    objectToArray(xmlJSON.EWS.o_population.yglui_str_population).each(function (population) {
	        var populationID = population["@population_id"];

	        // for each population look if it appears in one of the roles, if it does, add it's employees
	        // to the role
	        var check = function (role) {
	            if (newPop) {
	                if (role.value.roleName == populationID)
	                    return true
	                else
	                    false
	            }
	            else {
	                if (role.value.roleComponents.indexOf(populationID) != -1)
	                    return true;
	                else
	                    return false;
	            }
	        };
	        this.sbmid_roles.each(function (role) {
	            if (check(role)) {
	                //If this role has not yet been created, we add the actual employee 
	                if (!this.populations.get(role.value.roleName)) {
	                    var employeeData = {
	                        type: this.objectType,
	                        name: this.name,
	                        singleSelected: true,
	                        singleElement: null,
	                        singleColor: 0,
	                        multiSelected: false,
	                        multiElement: null,
	                        multiColor: 0,
	                        actual: true,
	                        picId: this.objectPicId
	                    };
	                    this._addEmployeeToPopulation(this.objectId, employeeData, role.value.roleName);
	                }

	                if ("@population" in population) return;
	                objectToArray(population.population.yglui_str_popul_obj).each(function (employee) {
	                    var employeeID = employee["@objid"];
	                    var employeeData = {
	                        type: employee["@otype"],
	                        name: employee["@name"],
	                        singleSelected: false,
	                        singleElement: null,
	                        singleColor: 0,
	                        multiSelected: false,
	                        multiElement: null,
	                        multiColor: 0,
	                        picId: employee["@pic_id"]
	                    };
	                    this._addEmployeeToPopulation(employeeID, employeeData, role.value.roleName);

	                    // add the employee ID to the colors list to be generated on setAvailableColorList method
	                    if (!this.colors.get(employeeID) != -1) {
	                        this.colors.set(employeeID, -1);
	                    }
	                } .bind(this));
	            }
	        } .bind(this));
	    } .bind(this));

	    //add the current employee so it's color is generated
	    if (!this.colors.get(this.objectId) != -1) {
	        this.colors.set(this.objectId, -1);
	    }

	    // Set the proper colors according to the user list.
	    this.setAvailableColorsList();

	    if (newPop && !app && !mode) {
	        this.setAppsNavigation(this.usettingsJson);
	        this.setMenus(this.usettingsJson);
	        if (!this.usettingsLoaded)
	            this.usettingsLoaded = true;
	        else
	            this.usettingsLoaded = false;

	        this.totalEmployees.set(xmlJSON.EWS.o_population.yglui_str_population['@population_id'], xmlJSON.EWS.o_population.yglui_str_population['@population_rec']);
	        document.fire('EWS:populationReady');
	    }
	    else if (app) {
	        //assing population for the new role added
	        var newPopId = xmlJSON.EWS.o_population.yglui_str_population['@population_id']
	        var appidRoles = this.sbmid_roles.keys();
	        for (var i = 0; i < appidRoles.length; i++) {
	            if (this.sbmid_roles.get(appidRoles[i]).roleName == newPopId) {
	                var tabidRole = this.getTabIdByAppId(appidRoles[i]);
	                var applications = this.tabid_applicationData.get(tabidRole).applications;
	                for (var j = 0; j < applications.length; j++) {
	                    this.fillPopulationForApp(applications[j]);
	                }
	            }
	        }
	        this.totalEmployees.set(xmlJSON.EWS.o_population.yglui_str_population['@population_id'], xmlJSON.EWS.o_population.yglui_str_population['@population_rec']);
	        this.updateMenus(app, mode);
	    }
	},
	/**
	* REturns if the employee is the user shown in mydetails.
	* @param {String} employee The employee id
	*/
	employeeIsUser: function (employee) {
	    if (!Object.isEmpty(this.currentSubSubApplication)) {
	        var populationName = this.getPopulationName(this.currentSubSubApplication);
	    }
	    else if (!Object.isEmpty(this.currentSubApplication)) {
	        var populationName = this.getPopulationName(this.currentSubApplication);
	    }
	    else {
	        var populationName = this.getPopulationName(this.currentApplication);
	    }
	    if (!populationName) return false;
	    var isUser = false;
	    var employeeData = this.populations.get(populationName).get(employee);
	    if (!employeeData)
	        return false
        else
            return !employeeData["actual"] ? false : employeeData["actual"];
    },
	/**
	* Test whether an employee is selected or not in the current Application.
	* @param {String} employee The employee id
	*/
	employeeIsSelected: function (employee) {
	    if (!Object.isEmpty(this.currentSubSubApplication)) {
	        var populationName = this.getPopulationName(this.currentSubSubApplication);
	    }
	    else if (!Object.isEmpty(this.currentSubApplication)) {
	        var populationName = this.getPopulationName(this.currentSubApplication);
	    }
	    else {
	        var populationName = this.getPopulationName(this.currentApplication);
	    }
	    if (!populationName) return false;
	    var isSelected = false;
	    var employeeData = this.populations.get(populationName).get(employee);
	    if (!employeeData) {
	        isSelected = false;
	    } else {
	        isSelected = employeeData[this.currentSelectionType + "Selected"];
	    }
	    return isSelected;
	},
	/**
	* Function to check if an label already exists
	*/
	existsLabel: function (words) {
	    var keys = this.labels.keys();
	    var results = $H();
	    for (var i = 0; i < keys.length; i++) {
	        var key = keys[i];
	        var label = this.labels.get(key);
	        if (label && label.toUpperCase().trim().include(words.toUpperCase().trim())) {
	            results.set(key, label);
	        }
	    }
	    return results;
	},
	/**
	* Close the opened subApplication 
	*/
	closeSubApplication: function () {
	    var currentSubClassName = this.currentSubApplication.className;
	    this.currentSubApplication = null;
	    if (!Object.isEmpty(this.currentApplication)) {
	        this.currentSelectionType = this.getSelectionType(this.currentApplication);
	    }
	    window[currentSubClassName + "_instance"].close();
	    //update left menus when the subapplication has been closed
	    if (Object.isEmpty(window[currentSubClassName + "_instance"].options["refreshLeftMenu"]) || window[currentSubClassName + "_instance"].options["refreshLeftMenu"]) {
	        this.leftMenu.onOpenApplication(this.currentApplication);
	    }
	},
	/**
	* Close the opened subSubApplication 
	*/
	closeSubSubApplication: function () {
	    var currentSubSubClassName = this.currentSubSubApplication.className;
	    this.currentSubSubApplication = null;
	    if (!Object.isEmpty(this.currentSubApplication)) {
	        this.currentSelectionType = this.getSelectionType(this.currentSubApplication);
	    }
	    window[currentSubSubClassName + "_instance"].close();
	    //update left menus when the subapplication has been closed
	    if (Object.isEmpty(window[currentSubSubClassName + "_instance"].options["refreshLeftMenu"]) || window[currentSubSubClassName + "_instance"].options["refreshLeftMenu"]) {
	        this.leftMenu.onOpenApplication(this.currentApplication);
	    }
	},
	/**
	* Fills the translations from GET_USETTINGS
	* @param {JSON} json the data from GET_USETTINGS
	*/
	setTranslations: function (json) {
	    this.translations = $H({});
	    objectToArray(json.EWS.o_translations.yglui_str_lang_prior).each(function (translation) {
	        this.translations.set(translation["@lang"], {
	            endda: translation["@endda"],
	            begda: translation["@begda"],
	            seqen: translation["@seqen"]
	        });
	    } .bind(this));
	},

	loadFiles: function (fileList, app, mode, args, runApplication) {
	    var fileToLoad = fileList.first();
	    if (this.liteVersion && !Object.isEmpty(ALTERNATIVE_LITE_FILES.get(fileToLoad)))
	        fileToLoad = ALTERNATIVE_LITE_FILES.get(fileToLoad);
	    if (fileList.size() != 1) {
	        $LAB
				.toBODY()
				.script(fileToLoad)
				.block(this.loadFiles.bind(this, fileList.without(fileList.first()), app, mode, args, runApplication));
	    } else {
	        $LAB
				.toBODY()
				.script(fileToLoad)
				.block(this.initializeApplication.bind(this, app, mode, args, runApplication));
	    }
	},
	mergeFiles: function () {
	    for (var i = 0; i < CUSTOMER_FILES.keys().length; i++) {
	        var key = CUSTOMER_FILES.keys()[i];
	        if (!Object.isEmpty(CLASS_VIEW.get(key))) {
	            for (k = 0; k < CUSTOMER_FILES.get(key).length; k++) {
	                CLASS_VIEW.get(key).push(CUSTOMER_FILES.get(key)[k]);
	            }
	            //CLASS_VIEW.get(key).push(CUSTOMER_FILES.get(key).first());
	        }
	    }
	    document.fire("EWS:customerFilesLoaded");
	},
	reloadApplication: function (rightMenu, light) {
	    if (this.reloadEWS) {
	        if (!Object.isEmpty(rightMenu) || !Object.isEmpty(light)) {
	            var hashParameters = window.location.href.toQueryParams();
	            var url = window.location.href
	            if (!Object.isEmpty(hashParameters.light) && hashParameters.light != light.toString())
	                url = url.gsub("light=" + hashParameters.light, "light=" + light.toString());
	            if (!Object.isEmpty(hashParameters.right) && hashParameters.right != rightMenu.toString())
	                url = url.gsub("right=" + hashParameters.right, "right=" + rightMenu.toString());
	            window.location.href == url ? location.reload() : window.location = url;
	            $("loading_app_semitrans").show();
	        }
	        else {
	            location.reload();
	            $("loading_app_semitrans").show();
	        }
	    }
	},

	enableAllButtons: function () {
	    if (!Object.isEmpty(this.buttonsByAppid.get(this.currentApplication.className))) {
	        var buttonsArray = objectToArray(this.buttonsByAppid.get(this.currentApplication.className).array);
	        for (var i = 0; i < buttonsArray.length; i++) {
	            var hash = buttonsArray[i];
	            for (var j = 0; j < hash.keys().length; j++) {
	                var idButton = hash.keys()[j];
	                hash.get(idButton)[0].enabled = true;
	                if ((hash.get(idButton)[0].isStandard)) {
	                    if (!Object.isEmpty(hash.get(idButton)[1].down('[class*=leftRoundedCornerDisable]'))) {
	                        hash.get(idButton)[1].down('[class*=leftRoundedCornerDisable]').className = 'leftRoundedCorner';
	                        hash.get(idButton)[1].down('[class*=centerRoundedButtonDisable]').className = 'centerRoundedButton';
	                        hash.get(idButton)[1].down('[class*=rightRoundedCornerDisable]').className = 'rightRoundedCorner';
	                    }
	                } else {
	                    if (!hash.get(idButton)[1].hasClassName('megaButtonDisplayer_active')) {
	                        hash.get(idButton)[1].removeClassName('application_action_link_disabled');
	                        if (!hash.get(idButton)[1].hasClassName('application_text_bolder'))
	                            hash.get(idButton)[1].addClassName('application_action_link');
	                    }
	                }
	                hash.get(idButton)[1].observe('click', hash.get(idButton)[2]);
	            }
	        }
	    }
	},

	disableAllButtons: function () {
	    if (!Object.isEmpty(this.buttonsByAppid.get(this.currentApplication.className))) {
	        var buttonsArray = objectToArray(this.buttonsByAppid.get(this.currentApplication.className).array);
	        for (var i = 0; i < buttonsArray.length; i++) {
	            var hash = buttonsArray[i];
	            for (var j = 0; j < hash.keys().length; j++) {
	                var idButton = hash.keys()[j];
	                hash.get(idButton)[0].enabled = false;
	                if ((hash.get(idButton)[0].isStandard)) {
	                    if (!Object.isEmpty(hash.get(idButton)[1].down('[class*=leftRoundedCorner]'))) {
	                        hash.get(idButton)[1].down('[class*=leftRoundedCorner]').className = 'leftRoundedCornerDisable';
	                        hash.get(idButton)[1].down('[class*=centerRoundedButton]').className = 'centerRoundedButtonDisable';
	                        hash.get(idButton)[1].down('[class*=rightRoundedCorner]').className = 'rightRoundedCornerDisable';
	                    }
	                } else {
	                    if (!hash.get(idButton)[1].hasClassName('megaButtonDisplayer_active')) {
	                        hash.get(idButton)[1].addClassName('application_action_link_disabled');
	                        hash.get(idButton)[1].removeClassName('application_action_link');
	                    }
	                }
	                hash.get(idButton)[1].stopObserving('click', hash.get(idButton)[2]);
	            }
	        }
	    }
	},
	/**
	* Reload the left menu for my selection if needed
	*/
	reloadMySelection: function (population) {
	    if (!Object.isEmpty(this.leftMenu.menusInstances.get('SELECT')))
	        this.leftMenu.menusInstances.get('SELECT').reloadPopulation(population);
	},
	/**
	* Function called when pressing "print" button
	*/
	showToolBox: function (evt) {
	    if (!Prototype.Browser.IE) {
	        this.toolboxEvt = evt;
	    } else {
	        evt = deepCopy(evt);
	    }
	    this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>GET_CON_ACTIO</SERVICE>' +
			'    <PARAM>' +
	        //'    	<CONTAINER>SEA_SEA</CONTAINER>' +
			'    	<CONTAINER>' + global.currentApplication.appId + '</CONTAINER>' +
			'    	<MENU_TYPE>A</MENU_TYPE>' +
			'    	<A_SCREEN>*</A_SCREEN>' +
			'    </PARAM>' +
            ' </EWS>',
	        successMethod: this.buildToolbox.bind(this, evt)
	    }));
	},

	buildToolbox: function (evt, json) {
	    if (Prototype.Browser.IE) {
	        this.toolboxEvt = evt;
	    }
	    this.toolboxMenu = null;
	    if (json.EWS.o_actions) {
	        var items = objectToArray(json.EWS.o_actions.yglui_vie_tty_ac);
	        var menuItems = new Array();
	        items.each(function (item) {
	            if (item['@actio'] == 'HORIZONTAL_LINE') {
	                menuItems.push({
	                    separator: true
	                });
	            } else {
	                menuItems.push({
	                    name: item['@actiot'],
	                    callback: function (e) {

	                        if (item['@tarap'] && item['@tartb'] && item['@views']) {
	                            global.open($H({
	                                app: {
	                                    appId: item['@tarap'],
	                                    tabId: item['@tartb'],
	                                    view: item['@views']
	                                }
	                            }));
	                        } else {
	                            document.fire('EWS:' + item['@actio']);
	                        }

	                    }
	                });
	            }
	        } .bind(this));
	        this.toolboxMenu = new Proto.Menu({
	            menuItems: menuItems
	        });
	        this.toolboxMenu.show(this.toolboxEvt);
	    } else {
	        //window.print();
	        var menuItems = new Array();
	        menuItems.push({
	            name: global.getLabel('KM_PRINT_PAGE'),
	            callback: function (e) {
	                window.print();
	            }
	        });
	        this.toolboxMenu = new Proto.Menu({
	            menuItems: menuItems
	        });
	        this.toolboxMenu.show(this.toolboxEvt);
	    }
	    this.toolboxEvt.stop();
	    this.toolboxEvt = null;
	},
	/**
	* Enables all previously disabled elements
	*/
	enableAllClickableElements: function () {
	    if (!Object.isEmpty(this.disabledElements)) {
	        for (var i = 0; i < this.disabledElements.size(); i++) {
	            Form.Element.enable(this.disabledElements[i]);
	            this.disabledElements[i] = null;
	        }
	        delete this.disabledElements;
	    }
	},
	/**
	* Disables all input and button elements that are not inside exceptParent
	* @param {Object} exceptParent
	*/
	disableAllClickableElements: function (exceptParent) {
	    this.disabledElements = $A();
	    var allButtons = $$("button,input");
	    for (var i = 0; i < allButtons.size(); i++) {
	        if (!allButtons[i].descendantOf(exceptParent)) {
	            if (!allButtons[i].disabled) {
	                this.disabledElements.push(allButtons[i]);
	                Form.Element.disable(allButtons[i]);
	            }
	        }
	    }
	},

	/**
	* Disables MySelections menu
	*/
	disableMySelections: function () {
	    if (!Object.isEmpty(this.leftMenu.menusInstances.get('SELECT'))) {
	        this.leftMenu.menusInstances.get('SELECT').disable();
	    }
	    if (!Object.isEmpty(this.leftMenu.menusInstances.get('DETAIL'))) {
	        this.leftMenu.menusInstances.get('DETAIL').disable();
	    }
	},

	/**
	* Enables MySelections menu
	*/
	enableMySelections: function () {
	    if (this.getPopulationName(this.currentApplication.tabId) != 'NOPOP') {
	        if (!Object.isEmpty(this.leftMenu.menusInstances.get('SELECT'))) {
	            this.leftMenu.menusInstances.get('SELECT').enable();
	        }
	    }
	    if (!Object.isEmpty(this.leftMenu.menusInstances.get('DETAIL'))) {
	        this.leftMenu.menusInstances.get('DETAIL').enable();
	    }
	},

	/**
	* Hide the left menu pagination
	*/
	hideLeftMenuPag: function () {
	    if (!Object.isEmpty(this.leftMenu.menusInstances.get('SELECT')) && !Object.isEmpty(this.leftMenu.menusInstances.get('SELECT').paginationDiv)) {
	        this.leftMenu.menusInstances.get('SELECT').paginationDiv.hide();
	        global.showPagination = false;
	    }
	},
	/**
	* show the left menu pagination
	*/
	showLeftMenuPag: function () {
	    if (!Object.isEmpty(this.leftMenu.menusInstances.get('SELECT')) && !Object.isEmpty(this.leftMenu.menusInstances.get('SELECT').paginationDiv)) {
	        this.leftMenu.menusInstances.get('SELECT').paginationDiv.show();
	        global.showPagination = true;
	    }
	},

	/**
	* Cancels all pending AJAX calls
	*/
	abortAjaxCalls: function () {
	    //Takes all pending calls from global and cancels them, and then removes them from the pending calls hash
	    this.pendingCalls.each(function (call) {
	        call.value.transport.onreadystatechange = Prototype.emptyFunction;
	        call.value.transport.abort();
	        this.pendingCalls.unset(call.key);

	    } .bind(this));
	    //We have to update the loading bars too
	    Ajax.activeRequestCount = 0;
	    if ($('loadingBars')) $('loadingBars').update("");
	    if ($("loadingDiv")) {
	        $("loadingDiv").hide();
	        $("loadingBars").hide();
	    }
	},
	removeQuerystringValue: function (url, key) {
	    /// <summary>Will take the url and remove the key and its corresponding value from the querystring</summary>
	    /// <param name="url">The url you want to look in</param>
	    /// <param name="key">The key you want to remove in the queryString</param>
	    /// <returns>A modified string of url without the queryString key and its value</returns>
	    url = url.replace(new RegExp(key + "=.*#", "g"), "#");   // Remove the values inside the querystring     ie "key=<any text>#"  => "#"
	    url = url.replace(new RegExp(key + "=.*&", "g"), "&");  // Remove the values inside the querystring     ie "key=<any text>&"  => "&"
	    url = url.replace(new RegExp(key + "=.*$", "g"), "");   // Remove the key at the end                    ie "key=<any text>"  => ""
	    url = url.replace(/&$/g, "");                           // Remove trailing ampersands
	    url = url.replace(/\?$/g, "");                          // Remove trailing questionmarks
	    url = url.replace("&&", "&");                           // Remove double ampersands
	    return url;
	},
	/**
	* Returns the current date format
	*/
	getDateFormat: function () {
	    return this.dateFormat;
	}
});
