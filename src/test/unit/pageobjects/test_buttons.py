from unit.ewslib_testcase import ewslibTestCase, LIB
from EWSLibrary import EWSLibrary
import EWSLibrary.pageobjects.dummy_classes as DC
from unit.global_test_data import data
from EWSLibrary.pageobjects.object_repository import OR
from EWSLibrary.pageobjects.ews_page_element import ValidationFailedError
import xmlrunner
import unittest


class TestButtons(ewslibTestCase):

    @classmethod
    def setUpClass(cls):
        ewslibTestCase.setUpClass()
        LIB.open_browser(data.PD_URL, data.BROWSER)     

    @classmethod
    def tearDownClass(cls):
        LIB.close_all_browsers()

    ###test methods######

    #TODO: there should be a specific test for each euh function to ensure it handles OR overrides correctly
    #TODO: write acceptance test for euh_click_button
    def test_find_button_by_name_inside_of_a_widget(self):
        self.navigate(data.PD_URL)
        expected_button_names= ["Save", "Cancel"]

        for name in expected_button_names:
            my_button = LIB._get_button_by_name(name,'Personal Data')
            self.assertEquals(name, my_button.text)
    
    def test_notification_message_not_Implmented(self):
        self.navigate(data.PD_URL)
        self.assertRaises(NotImplementedError, LIB.euh_click_button,"Save", "Personal Data", notification_message="some msg")

    def test_find_button_by_name_no_widget(self):
        self.navigate(data.LOGIN_URL)
        self.assertEquals("Login", LIB._get_button_by_name("Login").text)
        
    def test_find_button_by_name_no_widget_finds_button_outside_of_widget(self):
        self.navigate(data.PD_URL)
        btn = LIB._get_button_by_name(button_name="Save")
        self.assertEquals("Save", btn.text)
        self.assertEquals("my_fake_button", btn.get_attribute("id"))

    def test_find_button_by_index(self):
        self.navigate(data.PD_URL)
        btn = LIB._get_button_by_name(button_name="Save",index=0)
        self.assertEquals("Save", btn.text)
        self.assertEquals("my_fake_button", btn.get_attribute("id"))

        btn = LIB._get_button_by_name(button_name="Save",index=1)
        self.assertEquals("Save", btn.text)
        self.assertEquals("centerRoundedButton test_button", btn.get_attribute("class"))

    def test_euh_check_button_existence_by_index(self):
        self.navigate(data.PD_URL)
        btn = LIB.euh_check_button_existence(button_name="Save",index=0)
        self.assertEquals("Save", btn.text)
        self.assertEquals("my_fake_button", btn.get_attribute("id"))

        btn = LIB.euh_check_button_existence(button_name="Save",index=1)
        self.assertEquals("Save", btn.text)
        self.assertEquals("centerRoundedButton test_button", btn.get_attribute("class"))

    def test_find_button_not_found_should_throw_RuntimeError(self):
        self.assertRaises(RuntimeError, LIB._get_button_by_name,button_name="I am not here")

    def test_euh_check_button_existence_not_found_should_throw_RuntimeError(self):
        self.assertRaises(RuntimeError, LIB.euh_check_button_existence, button_name="I am not here")

    def test_click_button(self):
        LIB.euh_click_button(button_name="Save", index=1)
        LIB.euh_click_button(button_name="Save", widget_name="Personal Data")
        LIB.euh_click_button(button_name="Cancel",widget_name="Personal Data")

    def test_click_button_fails_if_button_is_not_displayed(self):
        self.assertRaises(RuntimeError, LIB.euh_click_button, button_name="Clear selection")
        
    #####test euh top menu buttons#############
    def test_find_euh_top_menu_buttons(self):
        data = ("employee data", "time management", "Payroll Data", "BENEFITS", "WorKFORce administration", "TaLeNt MaNaGeMeNt",
            "Strategy & Communication","Service Center")

        for topmenu_name in data:
            button = LIB._get_euh_top_menu_button(topmenu_name)
            self.assertEquals("button", button.tag_name)
            locator = OR["topmenu_%s" % (topmenu_name.lower())][5:]
            button_id = locator.split(" > ")[0]
            #print "name = %s button_id = %s button class = %s" % (topmenu_name, button_id, button.get_attribute("class"))
            self.assertTrue(button.get_attribute("class").find(button_id) > -1)

    def test_find_euh_top_menu_throws_please_add_error_if_button_name_not_in_OR(self):
        self.assertRaisesRegexp(RuntimeError, 
            "Trying to lookup topmenu_yo mama in OR but item not found",
            LIB._get_euh_top_menu_button, "yo mama")

    
    #######Test EUH TABS################

    def test_navigate_to_specific_tab_clicks_visible_tabs(self):
        '''this really needs to be tested in the "acceptance test", i.e. on the live system
        just doing basic checking making sure we don't throw errors'''

        for tab_name in data.TABS.keys() :  
            LIB.euh_navigate_to_specific_tab("workforce administration", "employee data", tab_name)

    def test_navigate_to_specific_tab_ignores_tab_if_not_specified(self):
        self.assertRaisesRegexp(RuntimeError,
            "could not find element with text =  , dummy_class = test_tabs, widget = None and index = 0",
            LIB._get_euh_tab, " ")        
        #next line shouldn't throw an error
        LIB.euh_navigate_to_specific_tab("workforce administration", "employee data")


    def test_get_euh_tab_returns_button_for_visible_tabs(self):
        for (tab_name, tab_id) in data.TABS.iteritems():
            button = LIB._get_euh_tab(tab_name)
            self.assertEquals("button", button.tag_name)
            self.assertEquals(tab_id, button.get_attribute("id"))
            self.assertTrue(button.is_displayed) #ensure we can click on the thing


    def test_navigate_to_specific_tab_clicks_tabs_in_dropdown(self):
        '''this functionality is not present in GAMO I think it's only in securex
        so we will implement this when securex starts'''
        pass
        #LIB.euh_navigate_to_specific_tab(


    ####### Test Click Link ########

    def test_euh_click_link(self):
        self.navigate(data.PD_URL)
        LIB.euh_click_link(link_name="Groups", widget_name="My Selections")
        LIB.euh_click_link(link_name="View details...", widget_name="Personal Data")

    
    ############TEST EE BUtton############
    def test_get_ee_button_with_no_name_returns_first_on_the_page_or_widget(self):
         self.navigate(data.PD_URL)
         ee = LIB._get_ee_button()
         self.assertEquals("central_css test_employeeColorIcon eeColor02", ee.get_attribute("class"))
         ee = LIB._get_ee_button(widget_name="My Details")
         self.assertEquals("central_css test_employeeColorIcon eeColor02", ee.get_attribute("class"))


    def test_get_ee_button_by_name_and_widget(self):
        self.navigate(data.PD_URL)
        ee= LIB._get_ee_button(widget_name="My Details",button_name="30000309_GAMO_GL_WA_PA_HR Admin")
        self.assertEquals("central_css test_employeeColorIcon eeColor02", ee.get_attribute("class"))
        ee= LIB._get_ee_button(widget_name="My details",button_name="30000309")
        self.assertEquals("central_css test_employeeColorIcon eeColor02", ee.get_attribute("class"))

    def test_get_ee_button_no_found_throws_runtime_error(self):
        self.navigate(data.PD_URL)
        self.assertRaises(ValueError, LIB._get_ee_button,widget_name="My Details", button_name="not found")

    def test_find_ee_button_popup_throws_value_error_if_none_found(self):
        self.navigate(data.PD_URL)
        self.assertRaises(ValueError,LIB._get_visible_ee_button_popup)

    def test_find_ee_buttton_popup(self):
        self.navigate(data.EE_URL)
        ee = LIB._get_visible_ee_button_popup()
        self.assertTrue(ee)
        self.assertEquals("contextMenuContainer_0.9612519179717565", ee.get_attribute("id"))

    def test_euh_click_ee_bubble_option_list(self):
        self.navigate(data.EE_URL)
        LIB.euh_click_ee_bubble_option_list("Clock IN / OUT")
        LIB.euh_click_ee_bubble_option_list("Clock IN / OUT", "30000290", "My Details")
        LIB.euh_click_ee_bubble_option_list("Clock IN / OUT", "30000290_Time Error_Correct Time_Emp", "My Details")
        LIB.euh_click_ee_bubble_option_list("Clock IN / OUT", "30000290_Time Error_Correct", "my details")
        self.assertRaisesRegexp(RuntimeError, "you must specify widget_name if you specify button_name for _get_ee_button",
            LIB.euh_click_ee_bubble_option_list,"Clock IN / OUT", "30000290")
       

    ###########Test Click Icon####################
    def test_click_close_icon(self):
        self.navigate(data.POPUP_URL)
        LIB.euh_click_icon("close")
        LIB.euh_click_icon("Closed Icon")
        LIB.euh_click_icon("CLOSED")
        LIB.euh_click_icon("close icon")

    def test_click_icon_throws_runtime_error_if_icon_not_found(self):
        self.assertRaises(RuntimeError,LIB.euh_click_icon,"i am not here")

        #TOD write test below
        #def test_click_icon_by_name(self):
        
   
    #TODO: message boxes warrant their own
    def test_euh_check_message_box(self):
        self.navigate(data.MSGBOX_URL)
        LIB.euh_check_message_box("Do you really want to remove this record?")

    def test_euh_check_message_box_support_regexp(self):
        self.navigate(data.MSGBOX_URL)
        LIB.euh_check_message_box("Do you .*")

    def test_euh_check_message_box_clicks_button(self):
        self.navigate(data.MSGBOX_URL)
        LIB.euh_check_message_box("Do you really want to remove this record?", "Yes")

    def test_euh_check_message_box_throws_validation_error(self):
        self.navigate(data.MSGBOX_URL)
        expected = "wrong msg"
        actual = "Do you really want to remove this record?"
        self.assertRaisesRegexp(ValidationFailedError,"Check_Message_Box expected caption of %s but found %s" %
            (expected, actual), LIB.euh_check_message_box, expected)

    ####### TREE ITEMS ##########
    def test_euh_click_tree_item(self):
        self.navigate(data.TREE_URL)
        LIB.euh_click_tree_item("GAMO_GL_SC_OM_MM_Main BA")

    #TODO: this should be shortned after the demo as we don't always want to wait for it
    def test_euh_click_tree_items_clicks_all_in_passed_in_list(self):
        self.navigate(data.TREE_URL)
        LIB.euh_click_tree_item("GAMO_GL_SC_OM_MM_Main BA; GAMO_GL_SC_OM_MM_BA 04 ; GAMO_GL_SC_OM_MM_Organization Unit;GAMO_GL_SC_OM_MM_Organization Unit 01;GAMO_GL_SC_OM_MM_Organization Unit 02 ; GAMO_GL_SC_OM_MM_Organization Unit 03;GAMO_GL_SC_OM_MM_CA_OU 02;GAMO_GL_WA_TM_LsTViewAbs;GAMO_GL_SC_OM_MM_Position 01;GAMO_GL_SC_OM_MM_Position 02;GAMO_GL_SC_OM_MM_EMP;GAMO_GL_SC_OM_MM_CA_OU 01;GAMO_GL_WA_PA_PCCI;GAMO_GL_SC_OM_MM_BA 02;GAMO_GL_SC_OM_MM_BA 03;GAMO_GL_SC_OM_MM_BA 04;GAMO_GL_SC_OM_Matrix Maintenance_test;Time_Error View and Correct Time Error")

    def test_euh_click_tree_items_honors_index(self):
        self.navigate(data.TREE_URL)
        LIB.euh_click_tree_item("GAMO_GL_SC_OM_MM_Organization Unit 03", index=0)
        LIB.euh_click_tree_item("GAMO_GL_SC_OM_MM_Organization Unit 03", index=1)
        LIB.euh_click_tree_item("GAMO_GL_SC_OM_MM_Organization Unit 03", index=2)
        self.assertRaises(IndexError, LIB.euh_click_tree_item,"GAMO_GL_SC_OM_MM_Organization Unit 03", index=3)

    def test_euh_click_tree_items_can_use_OR(self):
        self.navigate(data.TREE_URL)
        OR["test_tree_item"] = "id=OM_BAM_level5_linedTreeTxt_O50003462"
        LIB.euh_click_tree_item("OR:test_tree_item")

    #def test_euh_check_message_box_still_clicks_button_after_validation_error(self):


        
if __name__ == '__main__':
    unittest.main()
    #unittest.main(testRunner=xmlrunner.XMLTestRunner(output='test-reports'))
 
