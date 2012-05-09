from robot.api import logger
from ews_element_finder import EWSElementFinder
import dummy_classes as DC
from object_repository import OR
from selenium.webdriver.common.keys import Keys


class EWSButtons(EWSElementFinder):
    
    def euh_click_button(self, button_name, widget_name=None, index=0, notification_message=None, wait_for_loading=True):
        '''
        Click euh_button identified by 'button_name', 'widget_name' and 'index'.
        '''
        if not button_name: return

        self.get_euh_element(DC.Button,button_name,widget_name,index)[0].click()
        if wait_for_loading: self._wait_for_loading_div_to_clear()

        #do notification_message stuff when it becomes necessary
        if notification_message:
            msg = ("euh_Click_Button called with notification_message set to %s.  This functionality not yet implemented" 
                % (notification_message))
            logger.warn(msg)
            raise NotImplementedError(msg)

    def euh_check_button_existence(self, button_name,widget_name=None,index=0):
        '''check if a button exists on the page'''
        if not button_name: return
        return self.get_euh_element(DC.Button,button_name,widget_name,index)[0]

    
    def euh_click_icon(self, icon_name, widget_name=None, index=0, positive_test=True):
        '''clicks an icon specifed by icon_name, if icon_name is Close
        click the close icon'''
        if not icon_name: return
        
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
        self._info("Clicked icon named %s:%s with index %s" % (widget_name,icon_name, index))


    def euh_click_tab(self,sub_module_name,tab_name):
        '''used to click a tab only if the tab is currently showing on the screen.. i.e.this
        function does not click on module / submodule buttons first'''
        if not tab_name: return
        
        self._wait_for_loading_div_to_clear()
        tab = self._get_euh_tab(tab_name)
        self._wait_and_click(tab)
        self._wait_for_loading_div_to_clear()

        #extra step to wait for element to appear on the screen because chrome doesn't always
        #honor the implicit wait setting so we do it explicitly here if it is setup in OR
        tab_wait_for = OR.get("tab_wait_for_%s_%s" %(sub_module_name.lower(),tab_name.lower()))
        if not tab_wait_for:
            logger.warn("There is not a tab_wait_for in OR for tab %s_%s this may cause tests not to work."  % (sub_module_name,tab_name))
        else:
            #wait_for_it
            loaded = self._with_timeout(self._is_element_visible_and_page_not_loading, tab_wait_for)
            if not loaded:
                logger.warn("Tab %s may not have loaded correctly, trying to continue anyways" % 
                    (tab_name))

    ##### Privates ######
    def _get_euh_tab(self, tab_name, index=0):
        '''get's the euh_tab with the associated 'tab_name" and returns the child clickable object of the tab'''
        tab_div, override = self.get_euh_element(DC.Tab,tab_name,None,index)
        if override: return tab_div
        return tab_div.find_element_by_tag_name("button")



