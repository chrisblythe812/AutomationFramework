import unittest
from EWSLibrary import EWSLibrary
import os

LIB = EWSLibrary()

class TestEWSLibrary(unittest.TestCase):

    def test_get_os_name(self):
        self.assertEquals(os.sys.platform, LIB.get_os_name())

    def test_chrome_waits(self):
        pass
    
        
if __name__ == "__main__":
    unittest.main()
