# Savage Parser

Batch processes .SVG files into a single Javascript object.

## How to Use Savage Parser

### **Exporting Images from Adobe Illustrator**

1. Click *File* -> *Save As* or use the keyboard shortcut *Shift + Ctrl + S*
2. From the *Save as type* drop down menu, select *.SVG*
1. Check *Use Artboards* (You can either select *All* or select a range of artboards to export)
1. Select SVG Profile 1.1  Leave the rest of the options unchanged.

### **Image Prep**

Savage Parser only accepts .SVG files created in Adobe Illustrator.  Please follow these guidelines when preparing a file to be parsed:

- The file must contain a ***minimum of two layers***.
- The top layer is used for parsing data for collision detection.  The top layer can ***only contain rectangles***
- Any layer named 'temp' will be ignored by the parser
- The file ***cannot*** contain any raster images (i.e. jpg, gif, bmp, png, etc.)
- All ***groups*** and ***subgroups*** must be ***removed***
- Similarly styled elements should all exist on the same layer
- File names must be valid Javascript variable names and **cannot** contain any **whitespace** or **special characters**
- Any shape with a solid black fill (#000000) and no stroke will be assigned a class of 'default.'
- 

### **Running Savage Parser**

Savage parser requires Node.js to run.

1. In your terminal, navigate to the folder containing **Savage Parser**
2. Run **Savage Parser** by typing:

> node app "< source directory >" "< target directory >"

3. The processed data will be saved as imgData.js inside of the target directory.

### **spriteData**

Savage parser process .svg data in batches, combing through the entire contents of a directory and parsing each .svg file.  It then saves this data to a single Javascript object: **spriteData**.  Each processed file becomes a property of **spriteData** and can be accessed with its file name.

> spriteData [ *fileName* ]

spriteData Structure:
- fileName
    - dimensions : { drawW, drawH },
    - hitboxes : [ {x,y,w,h}, ... ],
    - styles : [ { className, fill, stroke < optional > }, ... ],
    - layers : [ { name, shapes : [ < shape >, ... ] }, ... ]

### **Sprites**

Each property of spriteData is a named 'sprite' object.

Each 'image' contains the following properties:
- dimensions
- hitboxes
- styles
- layers

### Images

## Known Issues

- There is a bug causing multiline path elements to not be parsed correctly.

## Future Updates

- Grab data from the viewBox attribute to determine draw width and draw height (dw, dh)
- Parse layers for additional information
    - Parse shapes from layers named 'hitBox' and save them to the hitBoxes property.
    - Ignore layers named 'temp'
    - Mask layers, and their associated classes, will be used for live styling (change fill, stroke during run time)