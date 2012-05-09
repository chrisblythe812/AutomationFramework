import unittest
from unit.ewslib_testcase import ewslibTestCase, LIB
import EWSLibrary.pageobjects.dummy_classes as DC
from unit.global_test_data import data
from EWSLibrary.pageobjects.ews_page_element import ValidationFailedError




class TestInputs(ewslibTestCase):

    @classmethod
    def setUpClass(cls):
        ewslibTestCase.setUpClass()
        LIB.open_browser(data.PD_URL, data.BROWSER)     

    @classmethod
    def tearDownClass(cls):
        pass
        LIB.close_browser()


    ########## Test Input #########
    def test_euh_set_text_value_works_on_text_box_and_date_fields(self):
        self.navigate(data.PD_URL)
        test_data= [("Date of birth", "10.10.1975","Personal Data"),
                    ("Last name", "Jack", "Personal Data"),
                    ("First name", "Jack", "Personal Data"),
                    ("Start Date", "01.10.2013", "Personal Data"),
                    ("End Date", "12.12.2020", "Personal Data")]

        for (name,val,widget) in test_data:
            self.set_and_check_text_value(name,val,widget)
    

    def set_and_check_text_value(self,textbox_name,val,widget):
        LIB.euh_set_text_value(textbox_name, val,widget)
        LIB.euh_check_default_textbox_value(textbox_name,val,widget)
    
    def test_euh_set_date_value(self):
        self.navigate(data.PD_URL)
        test_data= [("Date of birth", "10.10.1975","Personal Data"),
                    ("Start Date", "01.10.2013", "Personal Data"),
                    ("End Date", "12.12.2020", "Personal Data")]

        for (name, val, widget) in test_data:
            self.set_and_check_date_value(name,val,widget)

    def test_check_date_value_handles_spaces_in_date(self):
        self.set_and_check_date_value("Date of birth", "10 . 10 . 1975", "Personal Data")

    def set_and_check_date_value(self,textbox_name,val,widget=None):
        LIB.euh_set_date_value(textbox_name, val,widget)
        LIB.euh_check_default_date_value(textbox_name,val,widget)
    
    def test_check_date_throw_RuntimeError(self):
        self.navigate(data.PD_URL)
        self.assertRaisesRegexp(RuntimeError,
        "Check Value FAILED. Expected value 11.11.2111 and the actual value is 01 . 10 . 1980",
        LIB.euh_check_default_date_value,"Start Date","11.11.2111","Personal Data")

    def test_check_textbox_throw_RuntimeError(self):
        self.navigate(data.PD_URL)
        self.assertRaisesRegexp(RuntimeError,
        "Check Value FAILED. Expected value wrong value and the actual value is Selenium",
        LIB.euh_check_default_date_value,"First name","wrong value","Personal Data")

    def test_set_and_check_time_value(self):
        self.navigate(data.TIME_URL)
        LIB.euh_set_time_value("From","10:00")
        LIB.euh_check_time_value("From","10:00")

    def test_check_time_uses_belgium_time_zone(self):
        self.navigate(data.TIME_URL)
        from datetime import datetime, timedelta
        time_value = datetime.now().strftime("%I:%M:%S")
        LIB.euh_set_time_value("From",time_value)
        self.assertRaises(ValidationFailedError,LIB.euh_check_time_value,"From", "<<current min>>")

        belgium_time_value = (datetime.utcnow() + timedelta(hours=1)).strftime("%I:%M:%S")
        LIB.euh_set_time_value("From",belgium_time_value)
        LIB.euh_check_time_value("From", "<<current min>>")

    def test_set_unique_text_value(self):
        self.navigate(data.PD_URL)
        val1 = LIB.euh_set_unique_text_value("Last name", "test",widget_name="Personal Data")
        val2 = LIB.euh_set_unique_text_value("Last name", "test", widget_name="Personal Data")
        val3 = LIB.euh_set_unique_text_value("Last name", "test",widget_name="Personal Data")
        val4 = LIB.euh_set_unique_text_value("Last name", "test", widget_name="Personal Data")
        self.assertTrue(val1 != val2 != val3 != val4)

    def test_set_uniqe_text_value_limit_size(self):
        self.navigate(data.PD_URL)
        val1 = LIB.euh_set_unique_text_value("Last name", "test",widget_name="Personal Data")
        self.assertTrue(20,len(val1))
        val2 = LIB.euh_set_unique_text_value("Last name", "test",length="10",widget_name="Personal Data")
        self.assertTrue(10,len(val2))

    ######test dropdown boxes###############
    def test_euh_select_drop_down_field_value(self):
        langs = [u'Afrikaans', u'Espa\xf1ol',u'Ukrainian',u'\u05e2\u05d1\u05e8\u05d9\u05ea']
        for lang in langs:
            LIB.euh_select_drop_down_field_value("Language",lang,widget_name="Personal Data")
            #make sure we click somethign else to ensure that the drop down is really set
            self.set_and_check_date_value("Date of birth", "10.10.1975","Personal Data")
            LIB.euh_check_default_drop_down_field_value("Language", lang, widget_name="Personal Data")
   
    def test_euh_autocomplete_drop_down_field_value(self):
        self.navigate(data.PD_URL)
        LIB.euh_select_drop_down_field_value("Nationality", "american", widget_name="Personal Data")


    def test_euh_select_dropdown_field_value_using_OR(self):
        self.navigate(data.POPUP_URL)
        LIB.euh_select_drop_down_field_value("OR:ClockIn_Reason", "test")


    def test_find_euh_dropdown_returns_appropriate_type_of_dropdown(self):
        dropdown = LIB._find_euh_dropdown("Language", "Personal Data")
        self.assertEquals(DC.Dropdown, dropdown[1])
        self.assertEquals("select", dropdown[0].tag_name)
        
        auto_dropdown = LIB._find_euh_dropdown("Nationality", "Personal Data")
        self.assertEquals(DC.AutocompleteDropDown, auto_dropdown[1])
        self.assertEquals("input", auto_dropdown[0].tag_name)

        nota_dropdown = LIB._find_euh_dropdown("Last name", "Personal Data")
        self.assertIsNone(nota_dropdown[1])
        self.assertEquals("div", nota_dropdown[0].tag_name)

    def mock_warn(self,msg):
        '''this is used to overwrite the _warn function so I can verify that it is check the correct thing
        probably should use mocks instead'''
        self.assertEquals("item not a language was not found in list with locator PD_DATA_1_1_SPRSL_select", msg)
        self.was_called = True

    def test_euh_select_drop_down_field_value_logs_warning_if_value_not_displayed(self):
        self.was_called = False
        old_warn = LIB._warn
        LIB._warn = self.mock_warn
        LIB.euh_select_drop_down_field_value("Language","not a language",widget_name="Personal Data")
        LIB._warn = old_warn
        self.assertTrue(self.was_called)

    ####### TEXT AREA ################
    
    def test_set_text_area(self):
        self.navigate(data.TEXT_AREA_URL)
        LIB.euh_set_text_area_value("OR:om_maintain_general_description", "test")
        LIB.euh_check_text_area_value("OR:om_maintain_general_description", "test")



