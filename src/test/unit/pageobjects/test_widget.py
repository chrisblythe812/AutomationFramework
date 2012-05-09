import unittest
import time
from unit.ewslib_testcase import ewslibTestCase, LIB
import EWSLibrary.pageobjects.dummy_classes as DC
from unit.global_test_data import data


class TestWidget(ewslibTestCase):

    @classmethod
    def setUpClass(cls):
        ewslibTestCase.setUpClass()
        LIB.open_browser(data.PD_URL, data.BROWSER)     

    @classmethod
    def tearDownClass(cls):
        LIB.close_browser()

    #########Widget Tests###########
    def test_get_all_widgets(self):
        all_widgets = LIB._get_all_widgets()
        self.assertEquals(9, len(all_widgets))
        
    def test_widget_by_name_throws_error_if_not_found(self):
        self.assertRaises(RuntimeError, LIB._get_widget_by_name, "I don't exist")

    def test_verify_widget_caching_behavior(self):
        self.navigate(data.PD_URL)
        widget_id = "fwk_menu_16"
        widget_name = "Related Links"

        #initially widget is uncached
        self.assertIsNone(LIB._is_widget_cached(widget_name))
        #call with cache_widget = False and widget is Not cached
        t0 = time.clock()
        LIB._get_widget_by_name(widget_name, False)
        uncached_retrival_time = time.clock() - t0
        self.assertIsNone(LIB._is_widget_cached(widget_name))
        #default - call with cach_widget = True and widget is cached
        widget = LIB._get_widget_by_name(widget_name)
        t1 = time.clock()
        cached_widget = LIB._get_widget_by_name(widget_name)
        cached_retrival_time = time.clock() - t1
        self.assertEqual(widget.text, cached_widget.text)
        self.assertTrue(cached_retrival_time < uncached_retrival_time)
        print "Uncached retrival time = %f Cached retrival time = %f" % (uncached_retrival_time, cached_retrival_time)
        #and widget id should be set to name_widget
        self.assertEqual("%s_widget" % (widget_name), widget.get_attribute('id'))
        #and cache should be invalidated after reload
        LIB.reload_page()
        self.assertIsNone(LIB._is_widget_cached(widget_name))


    def test_get_widget_by_name(self):
        widgets = {"widget_0" : "Personal Data",
                   "widget_1" : "Family Details",
                   "widget_2" : "Communication",
                   "widget_3" : "Bank Details",
                   "widget_4" : "Address",
                   "widget_5" : "Pending Requests",
                   "fwk_menu_1" : "My Details",
                   "fwk_menu_3" : "My Selections"}

        #if no caching we should have the dev suplied ids
        for (id, name) in widgets.iteritems():
                returned_widget = LIB._get_widget_by_name(name,False)
                self.assertEquals(id, returned_widget.get_attribute('id'))
   
    def test_get_widget_with_limited_widgets_on_the_page(self):
        self.navigate(data.LIMITED_WIDGETS_URL)
        returned_widget = LIB._get_widget_by_name("Personal Data", False)
        self.assertEquals("widget_0",returned_widget.get_attribute("id"))

    def test_get_widget_with_limited_widgets_on_the_page_should_be_fast(self):
        self.navigate(data.LIMITED_WIDGETS_URL)
        
        wait = LIB.get_selenium_implicit_wait()
        try:
            LIB.set_browser_implicit_wait(2)
            t0 = time.clock()
            returned_widget = LIB._get_widget_by_name("Personal Data", False)
            t1 = time.clock()
            self.assertTrue((t1-t0) <2) #we get it faster than the implic_wait time, meaning we aren't using the wait time 
            self.assertEquals("widget_0",returned_widget.get_attribute("id"))
            
        finally:
            LIB.set_browser_implicit_wait(wait)

    def test_get_widget_by_name_and_verify_caching_is_faster_than_initial_get(self):

         widgets = {"widget_0" : "Personal Data",
                   "widget_1" : "Family Details",
                   "widget_2" : "Communication",
                   "widget_3" : "Bank Details",
                   "widget_4" : "Address",
                   "widget_5" : "Pending Requests",
                   "fwk_menu_1" : "My Details",
                   "fwk_menu_3" : "My Selections"}

         testTime = time.clock()
        
         #first time through we should have the dev suplied ids
         for (id, name) in widgets.iteritems():
                returned_widget = LIB._get_widget_by_name(name)
                #by default id with be changed to chached name first time widget is found
                self.assertEquals("%s_widget" % (name), returned_widget.get_attribute('id'))
         firstRunTime = time.clock() - testTime
         print "get widget by name without caching time is %f" % (firstRunTime)

         cachedRunStart = time.clock()
         #after which everything should be cached
         for (id, name) in widgets.iteritems():
            returned_widget = LIB._get_widget_by_name(name)
            self.assertEquals("%s_widget" % (name), returned_widget.get_attribute('id'))
         cachedRunStop = time.clock() - cachedRunStart
         print "Time for cached run was %f" % (cachedRunStop)
         self.assertTrue(cachedRunStop < firstRunTime)
         fullTestTime = time.clock() - testTime
         print "Total time for test was %f" % (fullTestTime)

    def test_widget_containing_no_items_of_dummy_class_type_throws_runtimeError(self):
        self.assertRaisesRegexp(RuntimeError, 
            "Failed to find any items with dummy_class of test_link inside widget Pending Requests",
            LIB._get_via_dummy_class, DC.Link, widget_name="Pending Requests")
        
    def test_widget_not_on_page_throws_runtimeError(self):
         self.navigate(data.PD_URL) #page has widgets
         self.assertRaisesRegexp(RuntimeError, "No widget with name not here was found on the current page.",
            LIB._get_widget_by_name, "not here")


    def test_no_widgets_on_page_throws_runtimeError(self):
        self.navigate(data.INDEX_URL) #page has no widgets at all
        self.assertRaisesRegexp(RuntimeError, "Could not find any widgets on the current page",
            LIB._get_widget_by_name, "not here")
    



if __name__ == "__main__":
    unittest.main()
