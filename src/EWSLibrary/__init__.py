import os
from selenium import webdriver
from Selenium2Library import Selenium2Library
from robot.api import logger
from pageobjects.ews_page_element import EWSPageElement
from pageobjects.ews_buttons import EWSButtons
from pageobjects.waits import Waits
from pageobjects.flows import Flows



_EWSLIBRARY_PATH=os.path.dirname(os.path.abspath(__file__))
if os.sys.platform == "darwin": #support mac :)
    CHROMEDRIVER_PATH=os.path.join(_EWSLIBRARY_PATH, "lib", "chromedriver")
else: #assume windows
    CHROMEDRIVER_PATH=os.path.join(_EWSLIBRARY_PATH, "lib", "chromedriver.exe")


class EWSLibrary(Selenium2Library, EWSPageElement, EWSButtons, Waits, Flows):
    '''This is a library for RobotFramework that uses Selenium 2.0 WebDriver in the back-end.
    For the front it it provides a number of specific keywords to work with NGA's EWS application 
    It shall be awesome.'''
    #ROBOT_LIBRARY_SCOPE = 'TEST CASE'

    def __init__(self, timeout=0.0, client='Default', run_on_failure='Capture Page Screenshot'):
        super( EWSLibrary, self).__init__()

        Selenium2Library.__init__(self,timeout=timeout, run_on_failure=run_on_failure)
        #self.set_selenium_implicitly_wait = timeout
        
    '''def open_browser(self, browser, implicit_wait_time = 60):
        really what this should do is set the appropriate firefox path / profile I want
        and / or chrome driver location I want and then call the open_browser from the parent
        _BrowserManagementKeywords.open_browser()
        
        opens the browser

        'browser' name of the browser.  All names are stored in EWSLibrary.BROWSER_ALIAS and are

        | firefox          | FireFox   |
        | ff               | FireFox   |
        | googlechrome     | Chrome |
        | chrome           | Chrome |
        | ie               | IE     |
        | internet explorer| IE     |
        
        
        BROWSER_ALIAS={"ff":"_open_firefox",
                "firefox":"_open_firefox",
                "chrome":"_open_chrome",
                "googlechrome":"_open_chrome",
                "ie":"_open_ie",
                "internet explorer" : "_open_ie"}


        #Call the apppropriate function listed in BROWSER_ALIAS i.e _open_firefox 
        self.driver = getattr(self, BROWSER_ALIAS.get(browser.lower()))()
        #all browsers should use implicit waits... plus explicit waits should be implemented
        #where necessary
        self.driver.implicitly_wait(implicit_wait_time)
    '''
    def open_browser(self, url, browser="firefox", alias=None):
        if (["ie", "internet explorer"].count(browser.lower()) > 0 ) and (self.get_os_name() == "darwin"):
            browser = "chrome"
        return Selenium2Library.open_browser(self, url, browser,alias)


    def get_os_name(self):
        return os.sys.platform




    



    
 


