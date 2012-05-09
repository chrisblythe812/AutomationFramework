from robot.api import logger
from Selenium2Library.locators import ElementFinder
from Selenium2Library.keywords._element import _ElementKeywords
import dummy_classes as DC
from object_repository import OR

HIGHLIGHT_ELEMENTS = False

class EWSElementFinder(_ElementKeywords):
    '''
    This is the Base Element that all EWS elements should derive from.  It provides a number
    of convinience functions to ensure development of elements is standardized. In particular
    it provides functinality to handeling getting elemes via dummy class, labels and widgets.
    It also provides functionality for overwritting get's via OR.
    There are three main functions that should be used from this class:
    1. get_euh_element - this will attempt to find an element by it's dummy class, widget and text
    2. get_euh_element_by_label - this will attempt to find an element by the associated label, dummy class and widget
    3. get_element_from_OR - this will look up an element definition in object_repository.py and attempt to find it on screen.
    '''

    def __init__(self):
        self._element_finder = ElementFinder()

   ##### PUBLIC Function #####
    def get_euh_element(self, dummy_class, text=None, widget_name=None, index=0):
        '''call to return element matching 'dummy_class', with 'text' and inside 'widget_name'
        if index = all then return all elements that match.  If 'text'=None then just find
        via dummy class.  Will also handle object repository overrides.  If 'text' starts with
        OR: then the object locator will be looked up in object_repository.py.  In which case
        the second return value of this function will be equal = True, where as its normal = False
        for normal lookups.'''

        #first check for overwrides in the object repository
        override = self._find_object_from_OR(text,index) #TODO: change this to find OR override
        if override : return override,True

        if text:
            element = self._get_via_dummy_class_and_text(text, dummy_class, widget_name, index)
        else:
            elems = self._get_via_dummy_class(dummy_class,widget_name,return_first=False,required=True)
            if index == 'all':
                return elems, False
            element = elems[int(index)]
            
        #try to slow things down a bit here
        self._info("found element with name %s:%s, dummy_class %s, and index %s.  Waiting for it to be displayed" % (widget_name, text, dummy_class, index))
        #self._wait_for_elem(element)
        self._prep_element(element)
        return element,False


    def get_euh_element_by_label(self,label_name,dummy_class=None,widget_name=None,index=0):
        '''Use this function to get an element by the associated label.  Assumes the label has
        an id with value of "for_id_of_associated_element".  And will return that associated element as
        the first value returned.  The second value is an boolean which is True if the element comes
        from and object repository override (which generally happens if 'label_name" starts with OR:') or
        false if the element was gotten in the normal way as detailed above.'''
        
        #first check for overwrides in the object repository
        override = self._find_object_from_OR(label_name,index) #TODO: change this to find OR override
        if override : return override, True

        element = self._get_element_by_label(label_name,dummy_class,widget_name,index)
        #try to slow things down a bit here
        self._info("found element with name %s:%s, dummy_class %s, and index %s.  Waiting for it to be displayed" % (widget_name, label_name, dummy_class, index))
        #self._wait_for_elem(element)
        self._prep_element(element)
        return element, False


    def get_element_from_OR(self,OR_name):
        locator = OR.get(OR_name.lower())
        if locator:
            logger.warn("Found an overwrite in the OR for name %s with locator %s. Not using dummy classes" % (OR_name, locator))
            element = self._element_find(locator,True,True)
            #try to slow things down a little bit here
            #self._wait_for_elem(element)
            self._prep_element(element)
            return element
        
        raise RuntimeError("Trying to lookup %s in OR but item not found" % (OR_name))

    def get_locator_from_OR(self,OR_name):
        '''gets a locator stored in the OR'''
        
        if OR_name and OR_name.lower().startswith("or:"):
            name = OR_name[3:].lower()
        elif OR_name:
            name = OR_name.lower()
        return OR[name]
    
    
    def set_highlight_elements(self,highlight):
        '''if 'highlight' = True elements will be highlighted else they won't'''
        global HIGHLIGHT_ELEMENTS
        HIGHLIGHT_ELEMENTS = True if highlight else False

    def _prep_element(self,element):
        '''does any necessary prep to the element before returning it'''
        self._wait_for_elem(element)
        if HIGHLIGHT_ELEMENTS: self._highlight(element)


    ##### GET VIA DUMMY CLASS ######
    #def get_euh_element(self,text,dummy_class,viaLabel=False,
    def _get_via_dummy_class_and_text(self, text, dummy_class,widget_name=None,index=0):
        '''
        This is the main function to locate all euh elements.
        Finds an element via 'dummy_class', and 'widget_name' with text == to 'text'
        '''
        not_found = "could not find element with text = %s, dummy_class = %s, widget = %s and index = %s" % (text,dummy_class,widget_name,index)
        self._info("called _get_via_dummy_class_and_text with text as %s dummy_class as %s and widget name as %s" % 
            (text,dummy_class,widget_name))

        all_elements = self._get_via_dummy_class(dummy_class,widget_name,required=True)
        matching_elem=[elem for elem in all_elements if elem.text == text]
        if not matching_elem:
            raise(RuntimeError(not_found))
        return matching_elem[int(index)]


    def _get_via_dummy_class(self, dummy_class,widget_name=None,return_first=False,required=True):
        '''
        Convinience function used to get all of an object by the assigned dummy class.
        '''
        self._info("called _get_via_dummy_class with dummy_class as %s and widget name as %s" %(dummy_class,widget_name))
        
        if widget_name:
            all_elems = self._get_via_dummy_class_and_widget(dummy_class,widget_name,return_first,required)
        else:
            all_elems = self._element_find("css=.%s" %(dummy_class), return_first, required)
        return all_elems

    def _verify_element_contains_dummy_class(self,elem, dummy_class=None):
        '''verify that 'elem' which is of type WebElement has a class equal to 'dummy_class'
        '''
        if dummy_class:
            elem_class = elem.get_attribute("class")
            if elem_class.find(dummy_class) == -1:
                raise RuntimeError("matching element for label had class %s but expected class %s" % (elem_class,dummy_class))
        
    ##### Widget Functionality #####    
    def _get_via_dummy_class_and_widget(self,dummy_class,widget_name,return_first=False,required=True, cache_widget=True):
        '''
        first get the widget by 'widget_name', then get all items in the widget with 'dummy_class' then return
        the value
        '''
        not_found = "Failed to find any items with dummy_class of %s inside widget %s" % (dummy_class, widget_name)
        self._info("called _get_via_dummy_class_and widget with dummy_class as %s and widget name as %s" %(dummy_class,widget_name))
        

        widget = self._get_widget_by_name(widget_name,cache_widget)
        all_elements = widget.find_elements_by_css_selector(".%s" % (dummy_class))
        if required and not all_elements:
            raise RuntimeError(not_found)
        if return_first:
            return all_elements[0]
        else:
            return all_elements

    
    def _is_widget_cached(self,name):
        '''as we find widgets we cache them... will stay cached until reload, this will
        save us some time if we keep calling the same thing over and over'''
        return self._quick_check(0,self._element_find,"%s_widget" % (name), True, False)
            

    def _get_widget_by_name(self, name, cache_widget=True):
        '''return the widget as a WebElement that has then name 'name', by default
        this widget will be cached with the id = 'name'_widget so as to be able to quickly
        retrive the widget the next time.
        '''
        not_found = "No widget with name %s was found on the current page." % (name)
        cached_widget = self._is_widget_cached(name)
        if cached_widget: return cached_widget
        self._info("widget is not chached searching")

        all_widgets = self._get_all_widgets()
        for widget in all_widgets:
            if name == widget.find_element_by_css_selector(".test_widget_text").text:
                #this is a time consuming operation so let's cache the widgets
                if cache_widget:
                    locator = "id = %s" % (widget.get_attribute('id'))
                    self.assign_id_to_element(locator,"%s_widget" % (name))
                return widget
        
        #if we get here we haven't found it
        raise RuntimeError(not_found)


    def _get_all_widgets(self):
        '''finds all widgets on current page by looking for elements with certain ids
        Currently this is a work around as there should be a test_widget class to identify widgets
        '''
        not_found = "Could not find any widgets on the current page"
        widget_locators = ['div[id^=widget_]','div[id^=fwk_].menus_item_container','div[id^=combScreen_div]']
    
        all_widgets = []
        for widget_id in widget_locators:
            widgets = self._quick_check(0,self._element_find,"css=%s" % (widget_id), False, False)
            all_widgets.extend( [widget for widget in widgets if self._quick_check(0,widget.is_displayed)])
        if len(all_widgets) == 0:
            raise RuntimeError(not_found)
        return all_widgets




    ##### OBJECT REPOSITORY Functionality.  See object_repository.py for the actual Object locators #####   
    def _find_object_from_OR(self,OR_name,index=0):
        '''here we are assume the name starts with OR: so we strip it off, look up the name
        and return the object'''
        if OR_name and OR_name.startswith("OR:"):
            #TODO - call get_element_from_OR
            logger.warn("Found an overwrite in the OR for name %s. Not using dummy classes" % (OR_name))
            element =  self._element_find(OR[OR_name[3:].lower()],False,True)[int(index)]
            #try to slow things down a little bit here
            #self._wait_for_elem(element)
            self._prep_element(element)
            return element
        return None


    ##### LABEL Functionality ######
    def _get_label(self,name,widget_name=None, index=0, required=True):
        '''
        Search for a label and return it based upon the 'name' and 'index' and 'widget_name'
        '''
        not_found = "Could not find label named %s in widget %s" % (name, widget_name)

        all_elems = self._get_via_dummy_class(DC.Label,widget_name=widget_name)
        the_elems = [elem for elem in all_elems if elem.text.lower() == name.lower()]
        if not the_elems:
            if required:
                raise RuntimeError(not_found)
            return None
        else:
            return the_elems[int(index)]

    
    def _get_element_by_label(self,label_name,dummy_class=None,widget_name=None,index=0):
        ''' finds label with 'label_name' and then find the element that the label should
        be asociated with.  Will verify that the element has class 'dummy_class' if 'dummy_class' is not null.
        if lablel_name starts with OR: the object will be loocked up from the object_repository.py and the normal
        functinality will be skipped, returns the object and if it was overwritten
        '''
        lbl = self._get_label(label_name,widget_name,index)
        logger.debug("Label %s in widget %s was found!" % (label_name, widget_name))

        elem = self._get_element_associated_with_label_by_id(lbl)
        self._verify_element_contains_dummy_class(elem,dummy_class)

        return elem 


    def _get_element_associated_with_label_by_id(self,label_element):
        ''' 'label_element' should be of type WebElment, grab labels id which should be in the form
        for_xxx and return the element with id = xxx
        '''
        
        lbl_id = label_element.get_attribute("id")
        if lbl_id.startswith("for_"):
            elem_id = lbl_id[4:]
            logger.debug("ID associted with label is %s" % (elem_id))
        else:
            raise RuntimeError("Label doesn't follow standards of having id starting with for_ that maps to elemnt.  Labels id was %s " % (lbl_id))

        return self._element_find("id=%s" % (elem_id), first_only=True,required=True)

    #####Highlight Functionality######
    def _highlight(self,element):
        '''flashes an element... i.e. highlights'''
        import time
        wait = .015
        orig_style = element.get_attribute("style")
        light_style = "color: yellow; border: 10px solid yellow; background-color: black;"
        dark_style = "color: black; border: 10px solid yellow; background-color: yellow;"
        highlights = [light_style,dark_style,light_style,dark_style,orig_style]
        for style in highlights:
            self._current_browser().execute_script("arguments[0].setAttribute(arguments[1],arguments[2]);", 
                    element, "style", style)
            time.sleep(wait)






   

