from ews_element_finder import EWSElementFinder
from robot.api import logger
from object_repository import OR
from selenium.common.exceptions import StaleElementReferenceException

class Waits(EWSElementFinder):
    '''all the necessary functions to wait for certain things in the applicatoin to happen'''

    def _is_element_visible_and_page_not_loading(self,locator):
        '''returns True if both object is visible and the loading div is not displayed'''

        return self._wait_for_loading_div_to_clear() and self._is_visible(locator)

    def _wait_for_elem(self, elem):
        '''waits for the elemetn to be visible and the page to finish loading'''
        self._wait_for_loading_div_to_clear()
        self._with_timeout(lambda elem: elem.is_displayed(), elem,
            test_name_for_logger="waiting for element")

    def wait_for_element_to_not_be_displayed(self,locator):
        gone = self._with_timeout(self._is_element_not_visible,locator,
                test_name_for_logger="waiting for element %s to not be visible" % (locator))
        if gone[0] == False:
            logger.warn("Waited for %s seconds but element is still displayed" % (gone[1]))
        else:
            self._info("Waited for %s seconds until loading div disappeard" % (gone[1]))

        return gone[0]
    
    def _wait_for_loading_div_to_clear(self):
        '''Check to see if loading div is on the screen and return only when it is not'''
        div_gone = self._with_timeout(self._is_loading_div_not_visible,None, 
                test_name_for_logger="wait for loading div to clear")
        if div_gone[0] == False:
            logger.warn("Waited for %s seconds but loading div is still displayed" % (div_gone[1]))
        else:
            self._info("Waited for %s seconds until loading div disappeared" % (div_gone[1]))
        
        return div_gone[0]

    def _is_element_not_visible(self, locator):
        return not self._is_visible(locator)


    def _is_loading_div_not_visible(self):
        ''' use _wait_for_loading_div_to_clear'''
        return not(self._is_visible(OR["loading_div"]) or self._is_visible(OR["loading_bars"]) 
                or self._is_visible(OR["loading_app"]))

        
    def _wait_and_click(self,elem):
        self._info("waiting for element to be displayed, if not an assertion error will appear on the next line.")
        try:
            if self._with_timeout(elem.is_displayed,None)[0]:
                self._info("clicking element")
                elem.click()
                return True
            return False
        except StaleElementReferenceException: #sometimes we are too fast, so let's tell people we can't do it
            return False

      

    def _with_timeout(self,test, value, timeout=None,test_name_for_logger=None):
        '''wait for test(value) to become true.  Function will return a tuple with two values
        the first value is a boolean indicating if test(value) is true... (false if the timeout elapsed)..
        the second argument is the amount of time waited before test(value) became true, or timeout
        if it never became true'''
        timeout = self._implicit_wait_in_secs if not timeout else timeout
        import time
        found = (False, timeout)
        start = time.time()
        while True:  #I need the loop to run at least once
            res = test(value) if value else test()
            if res:
                found = (True,time.time() - start)
                break
            if start + timeout < time.time(): break
            time.sleep(1)
        test_name = test_name_for_logger if test_name_for_logger else test.__name__
        self._info("Waited for %s seconds for test %s and test value is %s" % (time.time() - start, test_name, found[0]))
        return found


    def _quick_check(self,timeout,function, *args):
          #this can take a long time do to the implict wait functionality
        wait = self.get_selenium_implicit_wait()
        retval = None
        try:
            self.set_browser_implicit_wait(timeout)
            retval = function(*args)
        finally:
            self.set_browser_implicit_wait(wait)
            return retval

