from unit.ewslib_testcase import ewslibTestCase, LIB
from EWSLibrary import EWSLibrary
import EWSLibrary.pageobjects.dummy_classes as DC
from unit.global_test_data import data
from EWSLibrary.pageobjects.object_repository import OR
from EWSLibrary.pageobjects.ews_page_element import ValidationFailedError

'''I just use this for a quick test to copy paste a few functions in and run them'''


class TestQuickTest(ewslibTestCase):

    @classmethod
    def setUpClass(cls):
        ewslibTestCase.setUpClass()
        LIB.open_browser(data.PD_URL, data.BROWSER)     

    @classmethod
    def tearDownClass(cls):
        LIB.close_all_browsers()


    def test_set_text_area(self):
        self.navigate(data.TEXT_AREA_URL)
        LIB.euh_set_text_area_value("OR:om_maintain_general_description", "test")
        LIB.euh_check_text_area_value("OR:om_maintain_general_description", "test")



