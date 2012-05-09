import unittest
from EWSLibrary import EWSLibrary
from unit.global_test_data import data

LIB = EWSLibrary(run_on_failure="Nothing")

class ewslibTestCase(unittest.TestCase):

  
    @classmethod
    def setUpClass(cls):
        LIB.set_highlight_elements(data.HIGHLIGHT)


    def navigate(self, url):
        '''this helper function will check and see if a browser is open.  If not open it
        then check and see what page we are on, if none then browse'''
        #TODO refactor this into base testing class
        try:
            LIB._current_browser()
        except (RuntimeError):
            LIB.open_browser(url,data.BROWSER)
            return

        if url <> LIB.get_location():
            LIB.go_to(url)

