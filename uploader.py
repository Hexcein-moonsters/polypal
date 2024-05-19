import subprocess
import re

class Uploader:
  def __init__(self):
    pass
  def upload_string(self, content):
    content = re.sub(r'\W+', '', content)
    subprocess.check_output(f"""echo "{content}" | curl -T - https://api.pastes.dev/post""", shell=True).decode("utf-8")
