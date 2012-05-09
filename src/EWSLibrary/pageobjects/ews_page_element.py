from robot.api import logger
from ews_element_finder import EWSElementFinder
import dummy_classes as DC
from object_repository import OR
from selenium.webdriver.common.keys import Keys
from datetime import datetime, timedelta
from selenium.common.exceptions import StaleElementReferenceException

class CountNotEqualException(Exception):
    pass

class ValidationFailedError(RuntimeError):
    ROBOT_CONTINUE_ON_FAILURE = True


class EWSPageElement(EWSElementFinder):
       
    #Robot Framework exposed functions
    #Do you really want to remove this record?  Yes  True  True
    def euh_check_message_box(self, caption, button_name=None, close=True, positive=True):
        '''verifies that the currently displayed euh message box contains text 'caption'.  then clicks
        'button_name' if it is specified if not and if close=True clicks the close button'''
        if not caption: return

        popup = self.get_euh_element(DC.PopUpCaption)[0]
        import re
        try:
            failed_validation = (not re.match(caption, popup.text))
                    
            #now click the button
            if button_name: 
                self.euh_click_button(button_name)
            elif close:
                self.euh_click_icon("close")
        finally:    #I just want to make sure the validation error is raised if it should be
            if failed_validation:
                raise ValidationFailedError("Check_Message_Box expected caption of %s but found %s" % (caption, popup.text))

    #euh Click Tree Item  GAMO_GL_SC_OM_MM_Main BA  ${None}  0  True
    def euh_click_tree_item(self, item_name, widget_name=None,index=0,positive=True):
        '''clicks a tree item with 'item_name', which is just a text link. However if 
        'item_name' is a list of tree items seperated by a ; this function will assume each
        subsquent item is a child of the previous and attempt to click all in the list in order'''
        if not item_name: return
        for item in item_name.split(";"):
            #probably should be tree item, but in OM it is just text
            self.get_euh_element(DC.Text, item.strip(), widget_name,index)[0].click()
            self._wait_for_loading_div_to_clear() #TODO: this should be after basically every step


    def euh_check_displayed_value(self,field_name, field_value, widget_name=None, index=0,positive=True):
        '''checks the displayed value of a given field'''
        if not field_value: return

        self._wait_for_loading_div_to_clear()
        elem = self.get_euh_element_by_label(field_name,widget_name=widget_name,index=index)[0]
        #self._highlight(elem)
        if field_value.lower() != elem.text.lower():
            raise ValidationFailedError("Expected %s:%s with index %s to have value of %s but had value of %s" %
                    (widget_name,field_name,index,field_value,elem.text))

    def euh_check_field_existence(self,field_existence,field_name,widget_name=None,index=0):
        '''if 'field_existence' = True check if a label is displayed else check if field is not displayed'''
        if not field_name : return
        field_existence = str(field_existence)
        if field_existence.lower() not in ["true", "false"] : 
            raise RuntimeError("Check Field Existence valid value for field existence is true or false")

        self._wait_for_loading_div_to_clear()
        lbl = self._get_label(field_name,widget_name,index,False)
        is_displayed = False if not lbl else lbl.is_displayed()

        if str(is_displayed).lower() != field_existence.lower():
            raise ValidationFailedError("Checked Field Existence Failed: label named %s:%s was displayed = %s but expected %s" % 
                (widget_name,field_name, is_displayed,field_existence))


    def euh_click_ee_bubble_option_list(self, option, button_name=None, widget_name=None):
        '''
        Click the little blue icon next to an employee with name = 'button_name', where 'button_name'
        should equall employee id_position.  Note that is the employee id and '_' and then the position.
        Then the function will select 'option' from the drop down list.  If there is only one EEbutton in the widget
        or you want to pick the first one you can leave button_name blank.  Otherwise button name
        should be the line of text adjacent to the button generally this is two columns so just combine
        them as one.
        '''
        ee_button = self._get_ee_button(button_name,widget_name)
        ee_button.click()
        ee_button_popup = self._get_visible_ee_button_popup()
        ee_button_popup.find_element_by_link_text(option).click()
        self._wait_for_loading_div_to_clear()
        

    def _get_visible_ee_button_popup(self):
        '''returns which-ever ee_button_popup is visible'''
        #it can take a few seconds for the popup to be generated
        self._wait_for_loading_div_to_clear()
        #determine which popup is visible and return it
        popups = self.get_euh_element(DC.EEBubblePopup, index='all')[0]
        if self._with_timeout(self._get_visible_item_in_list, popups)[0]:
            return self._get_visible_item_in_list(popups)[0]
    

    def _get_visible_item_in_list(self, item_list):
        return [item for item in item_list if item.is_displayed()]


    def _get_ee_button(self,button_name=None,widget_name=None):
        '''finds and ee button, by 'button_name' which should be employee id_position
        and the 'widget_name', if 'button_name" is not specified just returns the first one found
        '''
        if not button_name:
            #just get the first one
            return self.get_euh_element(DC.EmployeeColorIcon,text=None, widget_name=widget_name, index=0)[0]
        
        #else get the div first and then get the button underneath
        if not widget_name:
            raise RuntimeError("you must specify widget_name if you specify button_name for _get_ee_button")

        div_locator = ("xpath=//div[starts-with(@id, '%s_%s')]" %
            (widget_name.lower().replace(" ", "_"), button_name))
        self._info("Trying to find ee_button div with locator = %s" % (div_locator))
        div = self._element_find(div_locator,True,True)
        
        #get ee_button child of the div
        return div.find_element_by_css_selector(".%s" % (DC.EmployeeColorIcon))

    def euh_set_unique_text_value(self, label_name, prefix="",length=100,widget_name=None, index=0):
        '''sets text values for 'widget_name':'label_name' by appending the current date to the second
        to the prefix string'''

        timepart = self._get_server_time().strftime("%Y%m%d%H%M%S%f") #time to the mili-second
        length = int(length) - len(prefix)
        if length > len(timepart):
            length = len(timepart) * -1
        else:
            length = length * -1
        unique_val = "%s%s" % (prefix,timepart[length:])        
        
        self.euh_set_text_value(label_name,unique_val,widget_name,index)
        return unique_val
    
    #TODO:this should be linked together with euh_set_text_value
    def euh_set_text_area_value(self, label_name, text_value=None, widget_name=None, index=0, first_call=True):
        '''get a text box by dummy class and name and then set it's value'''
        if not text_value: return
        try:
            textbox = self._get_euh_textarea(label_name, widget_name,index)
            self._set_text_value(textbox, text_value)

        #TODO: refactor all this stuff in to a 'protective call' function passing in the actual function'
        except StaleElementReferenceException as e:
            self._info("Found a stale element in euh_set_text_value trying again")
            if first_call : 
               self.euh_set_text_area_value(label_name,text_value,widget_name,index,False)
            raise e
    
    def euh_check_text_area_value(self, label_name, text_value=None, widget_name=None, index=0):
        if not text_value: return
        textbox = self._get_euh_textarea(label_name,widget_name,index)
        self._euh_check_default_textbox_value(textbox,text_value)


    def euh_set_text_value(self, label_name, text_value=None, widget_name=None, index=0,first_call=True):
        '''get a text box by dummy class and name and then set it's value'''
        if not text_value: return
        try:
            textbox = self._get_euh_textbox(label_name, widget_name,index)
            self._set_text_value(textbox, text_value)

        #TODO: refactor all this stuff in to a 'protective call' function passing in the actual function'
        except StaleElementReferenceException as e:
            self._info("Found a stale element in euh_set_text_value trying again")
            if first_call : 
               self.euh_set_text_value(label_name,text_value,widget_name,index,False)
            raise e



    def _set_text_value(self, textbox, text_value):
        textbox.click() #let's just make sure we have selected the textbox
        textbox.clear ()
        textbox.send_keys(text_value)
           
        #send TAB key
        textbox.send_keys(Keys.TAB)
        #verify text set correctly
        self._euh_check_default_textbox_value(textbox,text_value)


    #TODO: add capabilites of handeling the now parameter for text_value
    def euh_set_date_value(self, label_name, text_value=None, widget_name=None, index=0):
        if not text_value:return
        textbox = self._get_euh_textbox(label_name, widget_name,index)
        self._set_date_value(textbox, text_value) 
    
    def _set_date_value(self,textbox,date_value):
        textbox.click()  #let's just make sure we have selected the textbox
        textbox.clear() 
        textbox.send_keys(date_value, Keys.TAB)
        #verify set correctly
        self._check_date_value(textbox, date_value)

    def _check_date_value(self, textbox, expected_val):
        actual_value = textbox.get_attribute("value")
        if actual_value.replace(" ", "") <> expected_val.replace(" ", ""):
            raise ValidationFailedError ("Check Value FAILED. Expected value %s and the actual value is %s" %
                (expected_val, actual_value))


    def euh_check_default_date_value(self, label_name, text_value, widget_name=None, index=0):
        if not text_value : return
        textbox = self._get_euh_textbox(label_name, widget_name, index)
        self._check_date_value(textbox, text_value)

    def euh_check_default_textbox_value(self, label_name, text_value, widget_name=None, index=0,positive=True):
        if not text_value :return
        textbox = self._get_euh_textbox(label_name, widget_name,index)
        self._euh_check_default_textbox_value(textbox,text_value)
            
    def _euh_check_default_textbox_value(self,textbox,text_value):
        actual_value = textbox.get_attribute('value')
        if actual_value <> text_value:
            raise ValidationFailedError ("Check Value FAILED. Expected value %s and the actual value is %s" % 
                                (text_value, actual_value))


    def euh_check_label(self,label_name,widget_name=None,index=0):
        '''check to see if a label specificed by 'label_name' exists on the page
        or in the widget with name 'widget_name' if it is specified'''
        if not label_name : return
        return self._get_label(label_name,widget_name,index)
        #logger.debug("Label %s in widget %s was found!" % (label_name, widget_name))

    def euh_select_drop_down_field_value(self,label_name,dropdown_value,widget_name=None,index=0,
                first_call=True,no_validation=False):
        if not dropdown_value :return
        try:
            (dropdown,dummy_class) = self._find_euh_dropdown(label_name,widget_name,index)
            if dummy_class == DC.Dropdown:
                #uses the overwritten function _select_option_from_single_select_list
                self.select_from_list(dropdown.get_attribute("name"),dropdown_value)
            else:
                self._set_auto_dropdown_value(dropdown, dropdown_value, no_validation)
        except StaleElementReferenceException as e:
            self._info("Found a stale element in euh_select_drop_down_field_value, trying again")
            if first_call : 
               self.euh_select_drop_down_field_value(label_name,dropdown_value,widget_name,index,False)
            raise e
    
    def _set_auto_dropdown_value(self, textbox, dropdown_value, no_validation=False):
        textbox.clear ()
        textbox.send_keys(dropdown_value)
        textbox_id = textbox.get_attribute("id")
        options_locator ="id=%s_li_0" % (textbox_id.replace("text_area_", ""))
        self._quick_check(5,self._is_visible,options_locator)
        #self._info("Set drop-down field and options list shows %s" % self._get_text(options_locator))
           
        #send TAB key
        textbox.send_keys(Keys.TAB)
        #verify text set correctly
        #unfourtunatly some drop-downs actualy change into different elements after we select the item
        if no_validation: return
        try:
            self._euh_check_default_textbox_value(textbox,dropdown_value)
        except StaleElementReferenceException:
            pass #this one just doesn't get verified
        

    def euh_check_default_drop_down_field_value(self, label_name, dropdown_value, widget_name=None, index=0):
         if not dropdown_value : return
         dropdown = self._find_euh_dropdown(label_name, widget_name, index)[0]
         return self.list_selection_should_be(dropdown.get_attribute("name"),dropdown_value)

    def euh_click_link(self,link_name,widget_name=None,index=0, positive_test=True):
        if not link_name : return
        self._get_link_by_name(link_name,widget_name,index).click()
        self._wait_for_loading_div_to_clear()

    def euh_click_icon(self, icon_name, widget_name=None, index=0,positive_test=True):
        '''clicks an icon specifed by icon_name, if icon_name is Close
        click the close icon'''
        if not icon_name :return
        #known icon names and mappings
        #TODO: close icon needs to be handled differently because it has a different dummy class
        #we need a closed icon_map and an icon_map
        icon_map = {'close' : DC.CloseIcon, 
                    'close icon' : DC.CloseIcon, 
                    'closed icon' : DC.CloseIcon,
                    'closed' : DC.CloseIcon}
        
        icon_class = icon_map.get(icon_name.lower(), DC.Icon)
        text = None if icon_class == DC.CloseIcon else icon_name
        self.get_euh_element(icon_class,text,widget_name,index)[0].click()
        self._wait_for_loading_div_to_clear()

        

    def euh_check_link_existence(self,link_name,widget_name=None,index=0):
        if not link_name : return
        self._get_link_by_name(link_name,widget_name,index)
 
    def _get_euh_date_value(self, label_name, widget_name=None, index=0):
        '''date elements can be either textbox, or labels, or something else'''
        div, override = self.get_euh_element_by_label(label_name, widget_name=widget_name, index=index)
        if override : return div.text 
        textbox = div.find_element_by_css_selector(".%s" % DC.Textbox)
        return textbox.get_attribute("value")


    def euh_check_time_value(self,label_name, time_value, widget_name=None, index=0):
        '''check time value of a text box, used to check a time value in a text box. for time_value you
        can pass in the absolute value or <<current time>> to do an exact check on hh:mm:ss time
        or <<current min>> to do a check on hh:mm ignoring ss'''
        actual_value = self._get_euh_date_value(label_name,widget_name,index)
        self._compare_time_values(time_value,actual_value,"%s:%s with index = %s" % (widget_name,label_name,index)) 


    def _compare_time_values(self, expected_value, actual_value, field_name_for_reporting):
        '''compares text fields and handles the specific text field overwrites
        list <<current time>> or <<current min>>'''
        
        overrides = ("<<current time>>", "<<current min>>", "<<close>>")
        if expected_value == overrides[1]: #<<current min>>
            expected_value = self._get_server_time().strftime("%I:%M")
            actual_value = actual_value.replace(' ','')
            actual_value = ":".join(actual_value.split(":")[:2])
            valid = (expected_value == actual_value)
        elif expected_value == overrides[2]: #<<close>>
            expected_value = self._get_server_time()
            #actual_value = actual_value.replace(' ','')
            actual_val = actual_value.split(":")[:2]
            actual_time = datetime(expected_value.year, expected_value.month, expected_value.day, 
                        int(actual_val[0]), int(actual_val[1]))
            diff = abs(expected_value - actual_time)
            valid = (diff.seconds < 301) 
        elif expected_value == overrides[0]: #<<current time>>
            expected_value = self._get_server_time().strftime("%I:%M:%S")
            valid = (expected_value == actual_value)
        else:
            valid = (expected_value == actual_value)


        #now do the checking
        if not valid:
                raise ValidationFailedError ("euh_check_time_value expected time of %s but got time of %s for field %s" %
                    (expected_value,actual_value, field_name_for_reporting))
              

    def _get_server_time(self):
        '''our server is in belgium so UTC_OFFSET = 1'''
        UTC_OFFSET = 1
        return datetime.utcnow() + timedelta(hours=UTC_OFFSET)


    def euh_set_time_value(self,label_name, time_value, widget_name=None, index=0):
        if not time_value : return
        self.euh_set_text_value(label_name, time_value,widget_name, index)
    
    def _select_option_from_single_select_list(self, select, options, index=None):
        '''This function overwrites the default behavior in selenium library which is to select from a drop down
        by clicking; which doesn't work for EWS, so we do it through javascript here
        '''
        self._current_browser().execute_script("arguments[0].selectedIndex = %d;" % (index),select)
    

    #private functions
    def _find_euh_dropdown(self,label_name, widget_name=None, index=0,first_call=True):
        '''find the dropdown by label, and then ensure we have an element with tag = select'''
        dropdown_div = self.get_euh_element_by_label(label_name, widget_name=widget_name,index=index)[0]
        
        #this can take a long time do to the implict wait functionality
        #TODO: this should use the quick check function from wait.py
        wait = self.get_selenium_implicit_wait()
        try:
            self.set_browser_implicit_wait(0)
            if self._element_or_children_contains_class_name(DC.Dropdown, dropdown_div):
                #get underlying select
                retval =  (dropdown_div.find_element_by_tag_name("select"), DC.Dropdown)
            elif self._element_or_children_contains_class_name(DC.AutocompleteDropDown, dropdown_div):
                retval = (dropdown_div.find_element_by_tag_name("input"), DC.AutocompleteDropDown)
            else:
                logger.warn("element %s with widget_name = %s and index = %s does not appear to be a dropdown" %
                    (label_name, widget_name, index))
                retval = (dropdown_div, None)
        except StaleElementReferenceException as e:
            #we got the element too soon try one more time
            #TODO: these need to be refactored into a retry find type of structure / reusable function
            if first_call: 
                self._find_euh_dropdown(label_name, widget_name,index,first_call=False)
            raise e
        finally:
            self.set_browser_implicit_wait(wait)
            return retval
            

    def _element_or_children_contains_class_name(self, classname, element):
        '''checks the class names to see if the passed in classname is one of them'''
        #autocompleters have classname on the actual div
        if classname in element.get_attribute("class"):
            return True
        
        elems = element.find_elements_by_css_selector(".%s" % (classname))
        if len(elems) > 0: 
            return True
        
        #default
        return False

          
    def _get_euh_top_menu_button(self, name):
        or_lookup = "topmenu_%s" % (name.lower())
        logger.info("Looking up topmenu in OR with id %s if this fails be sure to update your OR" % (or_lookup))
        try: 
            self.wait_until_page_contains_element(self.get_locator_from_OR(or_lookup))
        except KeyError:
            raise RuntimeError("Trying to lookup %s in OR but item not found" % (or_lookup))
        logger.info("Page now contains topmenu button.")
        return self.get_element_from_OR(or_lookup)

        #return topmenu_div.find_element_by_tag_name("button") 

  
    def _get_euh_textbox(self,label_name, widget_name=None, index=0):
        textbox_div, override = self.get_euh_element_by_label(label_name, widget_name=widget_name,index=index)
        if override: return textbox_div
        return textbox_div.find_element_by_css_selector(".%s" % DC.Textbox)

    def _get_euh_textarea(self,label_name, widget_name=None, index=0):
        textbox_div, override = self.get_euh_element_by_label(label_name, widget_name=widget_name,index=index)
        if override: return textbox_div
        return textbox_div.find_element_by_css_selector(".%s" % DC.Textarea) 

    def _get_button_by_name(self,button_name,widget_name=None,index=0):
        '''
        get's a button by the text display in the button specified as 'button_name
        and the 'widget_name"
        '''
        return self.get_euh_element(DC.Button,button_name,widget_name,index)[0]

    def _get_link_by_name(self,link_name,widget_name=None,index=0):
        return self.get_euh_element(DC.Link,link_name,widget_name,index)[0]

    def euh_check_calendar_content(self, calendar_date, calendar_content):
        '''
        find the date on the screen
        '''
        if not calendar_date: return
        if not calendar_content: return
        
    def euh_check_field_length(self, widget_name, field_name, field_length, positive_test, index):
        pass
        return


  





