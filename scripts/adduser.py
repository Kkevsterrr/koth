import os
import subprocess
import time
for i in range(10100,20000):
    print(i)
    time.sleep(0.01)
    os.system("sudo useradd -u %s -g sudo -d /home/users -s /bin/false -p $(echo password | openssl passwd -1 -stdin) user%s" % (str(i), str(i)))
print("Done.")
