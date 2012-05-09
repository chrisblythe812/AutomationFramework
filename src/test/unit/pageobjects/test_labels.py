import unittest
from unit.ewslib_testcase import ewslibTestCase, LIB
import EWSLibrary.pageobjects.dummy_classes as DC
from unit.global_test_data import data
from EWSLibrary.pageobjects.ews_page_element import ValidationFailedError




class TestLabels(ewslibTestCase):

    @classmethod
    def setUpClass(cls):
        ewslibTestCase.setUpClass()
        LIB.open_browser(data.PD_URL, data.BROWSER)     

    @classmethod
    def tearDownClass(cls):
        LIB.close_browser()

    #####TEST METHODS########
    def test_euh_check_label_no_widget(self):
        self.navigate(data.LOGIN_URL)
        self.assertTrue(LIB.euh_check_label("User"))

    def test_euh_check_label_with_widget(self):
        expected_labels = ["Title","Last name","First name"]
        self.navigate(data.PD_URL)
        for lbl in expected_labels:
            self.assertTrue(lbl, LIB.euh_check_label(lbl,widget_name="Personal Data").text)

    def test_get_label_case_insensitive(self):
        self.navigate(data.PD_URL)
        self.assertTrue(LIB._get_label("TITLE", "Personal Data"))
        self.assertTrue(LIB._get_label("last Name", "Personal Data"))

    def test_euh_check_label_finds_label_in_widget_if_no_widget_specified(self):
        self.navigate(data.PD_URL)
        self.assertTrue("Title", LIB.euh_check_label("Title").text)

    def test_euh_check_label_in_widget_not_found_throws_RuntimeError(self):
        self.navigate(data.PD_URL)
        self.assertRaisesRegexp(RuntimeError, "Could not find label named not found in widget My Selections",
            LIB.euh_check_label, "not found", widget_name="My Selections")
        #also lets ensure it doesn't find a label that is in another widget
        self.assertRaisesRegexp(RuntimeError, "Could not find label named Title in widget My Selections",
            LIB.euh_check_label, "Title", widget_name="My Selections")

    def test_get_element_by_label(self):
        self.navigate(data.PD_URL)
        expected_data = {"PD_DATA_1_1_ANRED": "Title",
                        "PD_DATA_1_1_NACHN": "Last name",
                        "PD_DATA_1_1_VORNA": "First name",
                        "PD_DATA_1_1_GBDAT": "Date of birth",
                        "PD_DATA_1_1_NATIO": "Nationality",
                        "PD_DATA_1_1_SPRSL":"Language",
                        "PD_DATA_1_1_BEGDA": "Start Date",
                        "PD_DATA_1_1_ENDDA": "End Date"}
        
        for (id,name) in expected_data.iteritems():
            element = LIB._get_element_by_label(name,widget_name="Personal Data")
            self.assertEquals(id,element.get_attribute("id"))

    def test_get_element_by_label_checks_dummy_class(self):
        self.navigate(data.PD_URL)
        element = LIB._get_element_by_label("Country", widget_name="Address", dummy_class=DC.Text)
        self.assertEquals("PD_ADDR_1_1_LAND1", element.get_attribute("id"))
        self.assertTrue(element.get_attribute("class").find(DC.Text) <> 1)

    def test_get_element_by_label_checks_wrong_dummy_class_throws_runtimeError(self):
        self.navigate(data.PD_URL)
        self.assertRaisesRegexp(RuntimeError, "matching element for label had class .*test_text but expected class test_popupCalendar",
            LIB._get_element_by_label, "Country", widget_name="Address", dummy_class=DC.PopupCalendar)

    def test_get_element_by_label_for_label_that_dont_follow_standards_throws_runtimeError(self):
        self.navigate(data.PD_URL)
        self.assertRaisesRegexp(RuntimeError, "Label doesn't follow standards of having id starting with for_ that maps to elemnt.  Labels id was ",
        LIB._get_element_by_label, "No results found")

    def test_euh_check_field_existence(self):
        self.navigate(data.PD_URL)
        LIB.euh_check_field_existence(False,'Organizational Unit')
        LIB.euh_check_field_existence(True, 'End Date')
        LIB.euh_check_field_existence("FALSE",'Organizational Unit')
        LIB.euh_check_field_existence("trUE", 'End Date')

    def test_euh_check_field_existence_only_takes_boolean_values_for_field_existence_param(self):
        self.assertRaises(RuntimeError, LIB.euh_check_field_existence,3,"End Date")
        self.assertRaises(RuntimeError, LIB.euh_check_field_existence,"ugly","End Date")



    def test_euh_check_field_existence_throws_validation_error_if_incorrect(self):
        self.navigate(data.PD_URL)
        self.assertRaisesRegexp(ValidationFailedError,"" ,LIB.euh_check_field_existence,True,'Organizational Unit')
        self.assertRaisesRegexp(ValidationFailedError,"",LIB.euh_check_field_existence,False, 'End Date')
    
    def test_euh_check_displayed_value(self):
        self.navigate(data.PD_URL)
        LIB.euh_check_displayed_value("Country", "Belgium", "Address")
        LIB.euh_check_displayed_value("Distance in km", "0", "Address")

    def test_euh_check_displayed_value_throws_ValidationError_if_incorrect(self):
        self.navigate(data.PD_URL)
        self.assertRaises(ValidationFailedError, LIB.euh_check_displayed_value, "Country", "America", "Address")
        self.assertRaises(RuntimeError, LIB.euh_check_displayed_value, "non existent field", "no val")



#f,field_name,value,widget_name=None,index=0,positive_test=True):
        

