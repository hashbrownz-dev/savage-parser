# Savage Parser

Processes .SVG files into Javascript Objects containing the file name, the original draw dimensions, style, and path data.

## Known Issues

- There is a bug causing multiline path elements to not be parsed correctly.

## Future Updates

- Grab data from the viewBox attribute to determine draw width and draw height (dw, dh)
- Parse layers for additional information
    - Parse shapes from layers named 'hitBox' and save them to the hitBoxes property.
    - Ignore layers named 'temp'
    - Mask layers, and their associated classes, will be used for live styling (change fill, stroke during run time)