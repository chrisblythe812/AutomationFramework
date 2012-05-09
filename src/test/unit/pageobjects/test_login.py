from unit.ewslib_testcase import ewslibTestCase, LIB
from EWSLibrary import EWSLibrary
from unit.global_test_data import data
from EWSLibrary.pageobjects.object_repository import OR


class TestLogin(ewslibTestCase):

    @classmethod
    def setUpClass(cls):
        ewslibTestCase.setUpClass()


    def tearDown(self):
        LIB.close_browser()

    def test_login_negative_test_works_if_we_are_one_the_same_page(self):
        LIB.euh_EWS_Logon(data.BROWSER, data.LOGIN_URL, "jack","frost", False)
        LIB.textfield_value_should_be(OR["login_username"], "jack")
        LIB.textfield_value_should_be(OR["login_password"], None) #cannot read value from password field

    def test_open_browser_swaps_ie_for_chrome_on_mac(self):
        LIB.euh_EWS_Logon("IE", data.LOGIN_URL, "jack","frost",False)
        from selenium.webdriver import chrome
        self.assertIs(type(LIB._current_browser()),chrome.webdriver.WebDriver)

    def test_implicity_wait_is_set_from_ews_creation(self):
        test_lib = EWSLibrary(10)
        LIB.euh_EWS_Logon("IE", data.LOGIN_URL, "jack","frost",False)
        self.assertEquals('10 seconds', test_lib.get_selenium_implicit_wait())

    
    def test_can_click_link_but_will_fail_trying_to_click_button(self):
        '''fails clicking button cause there is no javascript runnin on our 'test' server'''
        self.navigate(data.PD_URL)
        self.assertRaisesRegexp(RuntimeError, "could not find element with text = Yes, dummy_class = test_button, widget = None and index = 0",             LIB.euh_EWS_Logoff)

    



