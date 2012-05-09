#get the command line argument, the first one should be the message used for git checkin and push
import sys
from sys import exit
msg = sys.argv[1]
if msg is None :
    print "Please provide a message a first argument to be used for git commit"
    exit()


#now attempt a git local commit
import subprocess 
from subprocess import CalledProcessError
try:
    subprocess.check_call(["git", "commit", "-a", "-m " + msg])
except CalledProcessError, e:
    print "git commit returned error code %d with message %s" % (e.returncode, e.message)
    #exit()

#if local commit is succesful then let's run the unit / acceptance tests
try:
    subprocess.check_call(['coverage', 'erase']) #clear out old coverage reports
    subprocess.check_call(['coverage', 'run', '-m', 'unittest', 'discover']) #run unit test with discovery
    subprocess.check_call(['coverage', 'report', '-m']) #display the report
except CalledProcessError, e:
    print "Failed some unit tests so we will not push commits to master repo"
    exit()


#TODO: let's track the percentage of code that has been tested through pybot
try:
    #there is a bug where pybot can't be run from the directory that includes the EWSLibrary so
    subprocess.check_call(["cd", "test"])
    subprocess.check_call(["pybot", "--pythonpath", "..","."])
except CalledProcessError, e:
    print "Not all tests passed, so we will not push commit to master repo"
    exit()
#assuming everything is scuessful then let's go ahead and push our commits to the master repo
try:
    print "All tests passed! Lets push code to master repo.  Please input your..."
    subprocess.check_call(["git", "push"])
except CalledProcessError, e:
    print "git push returned error code %d with message %s" % (e.returncode, e.message)
    exit()

print "Completed successfully.  Thank you for using checkin.py... have a nice day. :)"

