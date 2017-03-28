from PIL import Image
import sys
sizes = [(120,120)]
files = [r'F:\Team\Season 3\GB000_TEST\05_LAYOUT\02_APPROVED\Sc011\GB000TEST_Sc010_BG3Dstill_School_Canteen.jpg']

for image in files:
    for size in sizes:
      Image.open(image).thumbnail(size).save("thumbnail_%s" % image)