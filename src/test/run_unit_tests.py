#!/usr/bin/env python
import re
import os.path
import sys
import unittest
import xmlrunner
from subprocess import Popen, call
from tempfile import TemporaryFile
import os
from unit.global_test_data import data

ROOT = os.path.dirname(__file__)
RESOURCEDIR = os.path.join(ROOT,'resources')
HTPPSERVER = os.path.join(RESOURCEDIR, 'testserver', 'testserver.py')


def start_http_server():
    #just startup the simple http server
    server_output = TemporaryFile()
    Popen(['python', HTPPSERVER ,'start'],
            stdout=server_output, stderr=server_output)


def stop_http_server():
    #stop the http server
    call(['python', HTPPSERVER, 'stop'])


def run_unit_tests(browser,test_to_run, highlights_on,xml_reports=False):
    testfile = re.compile("^test_.*\.py$", re.IGNORECASE)
    basedir = os.path.abspath(os.path.dirname(__file__))
    testdir = os.path.join(basedir, 'unit', 'pageobjects')

    for path in [testdir, os.path.join(basedir, '..')]:
        if path not in sys.path:
            sys.path.insert(0, path)

    if test_to_run:
        #just loop through everything so you don't have to specify the path just the test name
         tests = [ unittest.defaultTestLoader.loadTestsFromModule(load_module(name))
              for name in os.listdir(testdir) if test_to_run == name ]
    else:
        tests = [ unittest.defaultTestLoader.loadTestsFromModule(load_module(name))
              for name in os.listdir(testdir) if testfile.match(name) ]

    #set Browser
    data.BROWSER = browser
    #from EWSLibrary.pageobjects.ews_element_finder import HIGHLIGHT_ELEMENTS
    data.HIGHLIGHT = highlights_on
    #TODO:create the LIB here, and open the browser, then have all test cases inherit from a parent test case
    #that links into the lib (ie, grabs it from data
    if xml_reports:
        runner = xmlrunner.XMLTestRunner(output='unit-test-reports')
    else:
        runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(unittest.TestSuite(tests))
    rc = len(result.failures) + len(result.errors)
    if rc > 255: rc = 255

    return rc


def load_module(name):
    return __import__(os.path.splitext(name)[0])


if __name__ == '__main__':
    import argparse
    parser  = argparse.ArgumentParser(description="Run unit test")    
    parser.add_argument('--browser',default="ff" ,dest='browser', action='store',
                        help='specify ff, ie, chrome or the name of the browser you want to use to run the unit tests')

    parser.add_argument('--test',default=None, dest='test_to_run',action='store',
                help='specify the test file name if you just want to run one test file')
    parser.add_argument('--highlight',default=False, dest='highlight',action='store_true',
                help='use this parameter to quickly highlight each element as it is found on the page')
    parser.add_argument('--xml_report',default=False, dest='xml_report',action='store_true',
                help='use this parameter to generate xml reports for use with jenkins CI server')

    #start the internal http server:
    args = parser.parse_args()
    start_http_server()
    exit_code = run_unit_tests(args.browser,args.test_to_run,args.highlight,args.xml_report)
    stop_http_server()
    sys.exit(exit_code)

