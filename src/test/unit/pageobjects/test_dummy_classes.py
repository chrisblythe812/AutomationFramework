import unittest
from unit.ewslib_testcase import ewslibTestCase, LIB
from EWSLibrary import EWSLibrary
import EWSLibrary.pageobjects.dummy_classes as DC
from unit.global_test_data import data
from EWSLibrary.pageobjects.object_repository import OR



class TestDummyClass(ewslibTestCase):

    @classmethod
    def setUpClass(cls):
        ewslibTestCase.setUpClass()
        LIB.open_browser(data.PD_URL, data.BROWSER)     

    @classmethod
    def tearDownClass(cls):
        LIB.close_browser()

    #########Dummy Class Tests###########
    def test_get_label_via_dummy_class_no_widget(self):
        self.navigate(data.LOGIN_URL)
        expected_labels=("User", "Password")
        labels = LIB._get_via_dummy_class(DC.Label)
        actual_labels = [lb.text for lb in labels]
        self.assertItemsEqual(expected_labels,actual_labels)

    def test_get_elements_via_dummy_class_and_widget(self):
        self.navigate(data.PD_URL)
        #verify some links
        self.verify_elements_in_widget("Family Details",DC.Link, ["Add"],["screensNavigation_button_1_SCR_FAADDPARTNER"])
        self.verify_elements_in_widget("Communication",DC.Link, ["E-mail","Add"],['','screensNavigation_button_1_SCR_ADDCOMM'])
        self.verify_elements_in_widget("My Details",DC.Link, ["30000309"],[''])
        #text box
        self.verify_elements_in_widget("My Selections",DC.Textbox, ['',''],
            ['mySelections_searchField',''])
        #dropdown
        self.verify_elements_in_widget_by_attribute("Personal Data", DC.Dropdown,'Name',['PD_DATA_1_1_SPRSL_select'])
        #button
        #text only displayes visible text so most of these guys show no text
        self.verify_elements_in_widget("My Selections",DC.Button,['Search','','','','','',''],['','','','','','',''])

    def test_get_elements_via_dummy_class_with_no_widget_still_finds_elements_inside_widget(self):
        self.navigate(data.PD_URL)
        labels = LIB._get_via_dummy_class(DC.Label)
        #list of labels that don't implmenet the for_ ID pattern to identify the associated control
        #print "\n".join([lbl.text for lbl in labels if not lbl.get_attribute("id").startswith("for_")])
        self.assertEquals(39, len(labels))
        #ensure we find stuff like Title, Last name, first name that are in the Personal Data widget
        from sets import Set
        expected_Label_Names=Set(["Title","Last name","First name"])
        actual_Label_Names =Set([lbl.text for lbl in labels])
        self.assertTrue(expected_Label_Names.issubset(actual_Label_Names))

  
    def test_get_via_dummy_class_and_widget(self):
        self.navigate(data.PD_URL)
        widget = LIB._get_widget_by_name("Family Details")
        link = widget.find_elements_by_css_selector(".%s" % (DC.Link))
        self.assertEquals("Add",link[0].text)
        self.assertEquals("screensNavigation_button_1_SCR_FAADDPARTNER", link[0].get_attribute('id'))

    def test_get_via_dummy_class_and_no_elements_with_dummy_class_throws_ValueError(self):
        self.navigate(data.LOGIN_URL)
        self.assertRaisesRegexp(ValueError, "Element locator 'css=.test_notfound' did not match any elements",
            LIB._get_via_dummy_class, "test_notfound")

    def test_get_via_dummy_class_and_widget_but_no_items_in_widget_with_dummy_class_throws_runtimeError(self):
        self.navigate(data.PD_URL)
        self.assertRaisesRegexp(RuntimeError, 
            "Failed to find any items with dummy_class of test_notfound inside widget Pending Requests",
            LIB._get_via_dummy_class, "test_notfound", widget_name="Pending Requests")

 
    ####OR Tests#############       
    def test_find_objects_from_OR(self):
        self.navigate(data.PD_URL)
        #_get_via_dummy_class_and_text
        elem = LIB._find_object_from_OR("OR:Topmenu_workforce administration")
        self.assertEquals("anonymous_element_11", elem.get_attribute("id"))

    def test_get_locator_from_OR(self):
        self.navigate(data.PD_URL)
        OR["test_item"] = "test_locator"
        locator = LIB.get_locator_from_OR("OR:test_item")
        self.assertEquals("test_locator", locator)


    ####PRIVATE HELPER FUNCTIONS########
    
    def verify_elements_in_widget_by_attribute(self, widget_name,dummy_class,attrib,expected_vals):
        elements = LIB._get_via_dummy_class(dummy_class, widget_name=widget_name)
        #verify attribute
        attribs = [elem.get_attribute(attrib) for elem in elements]
        self.assertItemsEqual(expected_vals, attribs)


    def verify_elements_in_widget(self, widget_name,dummy_class,expected_link_names,expected_ids):
        links = LIB._get_via_dummy_class(dummy_class, widget_name=widget_name)
        #verify link names
        link_names = [link.text for link in links]
        self.assertItemsEqual(expected_link_names, link_names)
        #verify link IDs
        link_ids = [link.get_attribute('id') for link in links]
        self.assertItemsEqual(expected_ids, link_ids)
  

    

if __name__ == "__main__":
    unittest.main()
