from robot.api import logger
from ews_element_finder import EWSElementFinder
import dummy_classes as DC
from object_repository import OR
from ews_page_element import ValidationFailedError


class Flows(EWSElementFinder):
    '''for multi step function calls that basically make stuff easier.'''
    
    def euh_check_last_clockout_hour(self, expected_time):
        '''finds the last clockout hour label and verifies that its text equals 'expected_time'
        for use with the clock-in pop-up form'''
            
        last_clockouthour_locator = "css=[id$='OutHour']"
        hour = self._element_find(last_clockouthour_locator,False,True)[-1]
        self._compare_time_values(expected_time, hour.text, "last clockout hour")
        

    def euh_check_last_clockin_hour(self, expected_time):
        '''finds the last clock_in hour label and verifies that its text equals 'expected_time'
        for use with the clock-in pop-up form'''

        last_clockinhour_locator = "css=[id$='InHour']"
        hour = self._element_find(last_clockinhour_locator, False,True)[-1]
        self._compare_time_values(expected_time, hour.text, "last clockin hour")
    
    def euh_check_last_clockin_reason(self, expected_reason):
        '''finds the last clockin reason text field for the clock_in pop_up box and
        verifies if it displays 'expected_reason' '''
        last_clockin_reason_locator = "css=[id$='InReason']"
        reason = self._element_find(last_clockin_reason_locator, False, True)[-1]
        if expected_reason != reason.text:
            raise ValidationFailedError("last clockin reason was %s but expected %s" % (reason.text,expected_reason))
   
    def euh_EWS_Logon(self, browser, url, user_name, pwd, positive_test=True):
        '''perfoms Login functionality, by opening browser, navigating to URL, and trying to login
        '''
        self.open_browser(url, browser)
        self.wait_until_page_contains_element(OR["login_username"])
        self.input_text(OR["login_username"], user_name)
        self.input_text(OR["login_password"], pwd)
        self.click_element(OR["login_button"])

        #now verify we are on the correct page
        if not positive_test:
            self.page_should_contain_element(OR["login_banner"])
        else:
            #this is generally an error msg saying user already logged in
            if self._quick_check(4,self._is_element_present,OR["login_info"]):                  
                logger.warn("Error msg saying %s trying to continue " % self._get_text(OR["login_info"]))
                self.click_element(OR["login_button"])
            self._wait_for_loading_div_to_clear()
            self.page_should_contain_element(OR["mainpage_banner"])


    def euh_EWS_Logoff(self,confirmation_button="Yes",positive_test=True):
        self.click_element(OR["logoff_link"])
        self.euh_click_button(button_name=confirmation_button,wait_for_loading=False)
        if positive_test:
            self.page_should_contain_element(OR["login_banner"])
        else:
            self.page_should_contain_element(OR["mainpage_banner"])

    def euh_navigate_to_specific_tab(self, module_name, sub_module_name, tab_name=None, index=0):
        '''TODO: index is not yet implemented'''
        self._wait_for_loading_div_to_clear()
        self._info("about to click module %s" % (module_name))
        module = self._get_euh_top_menu_button(module_name)
        self._wait_for_loading_div_to_clear()
        if not self._wait_and_click(module):
            #sometimes we are too fast, so let's just try it again.
            self._info("Couldn't click % module button, trying again" % (module_name))
            module = self._get_euh_top_menu_button(module_name)
            self._wait_and_click(module)
        self._info("about to click sub module %s" % (sub_module_name))    
        self._wait_for_loading_div_to_clear()
        sub_module = self._get_euh_top_menu_button(sub_module_name)
        self._wait_for_loading_div_to_clear()
        self._wait_and_click(sub_module)
        self._wait_for_loading_div_to_clear()
        if tab_name:
            self._info("about to click tab %s" % (tab_name))
            self.euh_click_tab(sub_module_name,tab_name)


          
