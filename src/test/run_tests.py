#!/usr/bin/env python

import os
import sys
from subprocess import Popen, call,CalledProcessError,check_call
from tempfile import TemporaryFile

from run_unit_tests import run_unit_tests

ROOT = os.path.dirname(__file__)
ATESTDIR = os.path.join(ROOT, 'acceptance')
RTESTDIR = os.path.join(ROOT, 'regression')
RESOURCEDIR = os.path.join(ROOT, 'resources')
SRCDIR = os.path.join(ROOT, '..')
UTESTDIR = os.path.join(ROOT, 'unit')
RESULTDIR = os.path.join(ROOT, 'results')
HTPPSERVER = os.path.join(RESOURCEDIR, 'testserver', 'testserver.py')
ROBOT_ARGS = [
'--outputdir', '%(outdir)s',
#'--variable', 'browser:%(browser)s',
'--pythonpath', '%(pythonpath)s',
]
REBOT_ARGS = [
'--outputdir', '%(outdir)s',
#'--name', '%(browser)sSPAcceptanceSPTests',
]
ARG_VALUES = {'outdir': RESULTDIR, 'pythonpath': SRCDIR}
HIGHLIGHT = False

def regression_tests(test_set_name):
    print test_set_name

def acceptance_tests():
    #ARG_VALUES['browser'] = browser.replace('*', '')
    start_http_server()
    execute_tests(ATESTDIR)
    stop_http_server()

    #return process_output()

def start_http_server():
    server_output = TemporaryFile()
    Popen(['python', HTPPSERVER ,'start'],
          stdout=server_output, stderr=server_output)

def execute_tests(test_dir):
    if not os.path.exists(RESULTDIR):
        os.mkdir(RESULTDIR)
    delete_files(RESULTDIR)
    command = ['pybot'] + [arg % ARG_VALUES for arg in ROBOT_ARGS] + [test_dir]
    print 'Starting test execution with command:\n' + ' '.join(command)
    syslog = os.path.join(RESULTDIR, 'syslog.txt')
    try:
        check_call(command)
    except CalledProcessError, e:
        print "Not all tests passed, so we will not push commit to master repo"
        return False
    print "All acceptance tests pass!"
    return True

def delete_files(folder):
    #folder = '/path/to/folder'
    for the_file in os.listdir(folder):
        file_path = os.path.join(folder, the_file)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
        except Exception, e:
            print e


def push_to_git():
    #assuming everything is successful then let's go ahead and push our commits to the master repo
    try:
        print "Lets push code to master repo.  Please input your..."
        check_call(["git", "push"])
    except CalledProcessError, e:
        print "git push returned error code %d with message %s" % (e.returncode, e.message)
        exit()

def local_checkin(commit_msg):
    try:
        print "check-in to local git repo"
        check_call(["git", "commit", "-a", "-m" + commit_msg])
    except CalledProcessError, e:
        print "git commit returned error code %d with message %s" % (e.returncode, e.message)
        return False
    return True


def stop_http_server():
    call(['python', HTPPSERVER, 'stop'])

def _exit(rc):
    sys.exit(rc)

def _help():
    print 'Usage:  python run_tests.py python|jython browser [options]'
    print
    print 'See README.txt for details.'
    return 255

def do_checkin(checkin_msg):
    start_http_server()
    if _run_unit_tests() == 0:
        if execute_tests(ATESTDIR):
            if local_checkin(checkin_msg):
                push_to_git()
    stop_http_server()
        

def _run_unit_tests():
    print 'Running unit tests'
    failures = run_unit_tests("chrome",None,HIGHLIGHT)
    if failures != 0:
        print '\n%d unit tests failed - not running acceptance tests!' % failures
    else:
        print 'All unit tests passed'
    return failures


if __name__ ==  '__main__':
    import argparse
    parser  = argparse.ArgumentParser(description="Run test and checkin code")    
    parser.add_argument('--regression',default=None ,dest='reg_test_set', action='store',
                        help='run the regression test')
    parser.add_argument('--working',default=None,dest='working',action='store_true',
                        help='run only the tests tagged as working')
    parser.add_argument('--tag',default=None,dest='tag',action='store',
                        help='specify the tag which you want to include')
    parser.add_argument('--acceptance', default=None , dest='run_acceptance', action='store_true',
                        help='run the acceptance test if all test pass script will automatically check.  Pass in message for git checkin')
    parser.add_argument('--checkin', default=None, dest='checkin', action='store', help='if all acceptance test pass checkin and push changes')
    parser.add_argument('--highlight',default=None, dest='highlight',action='store_true',
                help='use this parameter to quickly highlight each element as it is found on the page')

 
    #execute_tests()
    args = parser.parse_args()
    print args
    if args.highlight:
        HIGHLIGHT = True
    if args.checkin:
        do_checkin(args.checkin)
    if args.working:
        ROBOT_ARGS.append("--include")
        ROBOT_ARGS.append("working")
    if args.tag:
        ROBOT_ARGS.append("--include")
        ROBOT_ARGS.append(args.tag)
    if args.run_acceptance :    #ie if run_acceptance != FALSE
        acceptance_tests()
    if args.reg_test_set:
        test_dir = RTESTDIR if args.reg_test_set == "all" else os.path.join(RTESTDIR, args.reg_test_set)
        execute_tests(test_dir)

        
    
