// Get image dimensions from the viewBox attribute
// expected output: viewBox="0 0 54 56"

const getDims = (data) => {
    const dims = data.match(/viewBox="(\d+) (\d+) (\d+) (\d+)"/);
    return { drawW: dims[3], drawH: dims[4] }
}

// Get all data within the style tag.
// Remove the style tag from the data.

const getStyles = (data, startInd = 0) => {
    // Find the style element
    const openingTag = `<style type="text/css">`,
        closingTag = `</style>`;
    const ind1 = data.indexOf(openingTag, startInd);
    const ind2 = data.indexOf(closingTag) + closingTag.length;

    // Split the style element into lines
    const lines = data.substring(ind1, ind2).split('\n');

    // Remove the first and last element of lines
    lines.pop();
    lines.shift();

    // Process each line
    const styles = [];
    lines.forEach( line => {
        styles.push(parseStyle(line));
    })
    return [styles, ind2];
}

const parseStyle = (line) => {
    // Get the className
    const className = line.match(/\.(st\d+)/)[1];
    // Get the string data between the { }
    const index1 = line.indexOf('{')+1, index2 = line.indexOf('}',index1);
    const sub = line.substring(index1,index2);
    // Get our properties
    const props = sub.split(';');
    // Parse our properties
    const parsedProps = props.filter( element => element).map( parseProp )
    // Construct our Style Object
    return Object.fromEntries([["className",className]].concat(parsedProps));
}

const parseProp = (prop) => {
    return prop.split(':');
}

// groups = 'temp' 'fill || mask' 'stroke || main' 'hitBoxes'
// {/* <g id="temp"></g> */}

const getLayers = (data, startInd = 0) => {
    const layers = [];
    let current = startInd;
    while(true){
        const layer = getLayer(data, current);
        if(!layer) break;
        layers.push(layer[0]);
        current = layer[1];
    }
    return layers;
}

const getLayer = (data, startInd = 0) => {
    const openingTag = `<g`,
    closingTag = `</g>`;
    const ind1 = data.indexOf(openingTag, startInd);
    // if no match is found return null
    if(ind1 < 0) return null;
    const ind2 = data.indexOf(closingTag, ind1) + closingTag.length;
    return [data.substring(ind1, ind2), ind2];
}

const getLayerID = (data) => {
    const rx = /id="(.+)"/;
    const match = data.match(rx);
    return match[1];
}

const getLayerByName = (data, layerName) => {
    // Find the grouped elements
    const openingTag = `<g id="${layerName}">`,
        closingTag = `</g>`;
    const ind1 = data.indexOf(openingTag);
    const ind2 = data.indexOf(closingTag, ind1) + closingTag.length;

    // Split the grouped elements into individual elements
    const lines = data.substring(ind1, ind2).split('\n');

    // Remove the first and last element of lines
    lines.pop();
    lines.shift();
    const string = lines.join(''); // a solid string now... so now we need to go through that bitch and split our elements into an array...

    // To do this...
    // We start at index 0
    // We find our element, a string that begins with '<' and ends with '/>'
    // We push this string into an array.
    // We update our index to the end of the last element.
    // We repeat until we reach the end of the string.

    let index = 0;
    const elements = [];

    while(index < string.length - 1){
        const e = getElement(string, index);
        elements.push(e[0]);
        index = e[1];
    }

    return elements;
}

const parseLayer = (data) => {
    const ind1 = data.indexOf('<',1);
    const ind2 = data.indexOf('</g>',ind1);

    // Remove any new lines from our string.
    const rn = data.substring(ind1,ind2).split('\n').join('');
    const layer = rn.split('\r').join('');
    let index = 0;
    const elements = [];
    while(index < layer.length -1){
        const e = getElement(layer, index);
        elements.push(e[0]);
        index = e[1];
    }
    return elements;
}

const getElement = (data, startInd = 0) => {
    // Find each element
    // This assumes that we are either in an element... or at a point in our document where we are dealing exclusively with shapes
    const openingTag = `<`,
        closingTag = `/>`;
    const ind1 = data.indexOf(openingTag, startInd);
    const ind2 = data.indexOf(closingTag, ind1) + closingTag.length;
    return [data.substring(ind1, ind2), ind2];
}

const getClass = (line) => {
    if(line.includes('class')){
        const rx = /class="(st\d+)"/;
        const match = line.match(rx);
        return match[1]
    }
    return 'default'
}

const parseShape = (line) => {
    const shape = line.match(/(rect|circle|ellipse|path|line|polyline|polygon)/)[0];
    switch(shape){
        case 'rect':
            return parseRect(line);
        case 'circle':
            return parseCircle(line);
            break;
        case 'ellipse':
            return parseEllipse(line);
        case 'path':
            return parsePath(line);
        case 'line':
            return parseLine(line);
        case 'polyline':
            return parsePolyLine(line);
        case 'polygon':
            return parsePolygon(line);
        default:
            break;
    }
    return shape
}

// PARSE CIRCLES

const parseCircle = (line) => {
    return {
        type: 'circle',
        className: getClass(line),
        x: line.includes('cx="') ? line.match(/cx="(\S*)"/)[1] : 0,
        y: line.includes('cy="') ? line.match(/cy="(\S*)"/)[1] : 0,
        r: line.match(/r="(\S*)"/)[1]
    }
}

const parseEllipse = (line) => {
    return {
        type: 'ellipse',
        className: getClass(line),
        x: line.includes('cx="') ? line.match(/cx="(\S*)"/)[1] : 0,
        y: line.includes('cy="') ? line.match(/cy="(\S*)"/)[1] : 0,
        rx: line.match(/rx="(\S*)"/)[1],
        ry: line.match(/ry="(\S*)"/)[1]
    }
}

// PARSE RECTANGLES

const parseRect = (line) => {
    return {
        type: 'rect',
        className: getClass(line),
        x: line.includes('x="') ? line.match(/x="(\S*)"/)[1] : 0,
        y: line.includes('y="') ? line.match(/y="(\S*)"/)[1] : 0,
        w: line.match(/width="(\S*)"/)[1],
        h: line.match(/height="(\S*)"/)[1]
    }
}

// PARSE LINES

const parseLine = (data) => {
    return {
        type: 'line',
        className: getClass(data),
        x1: data.match(/x1="(\S*)"/)[1],
        y1: data.match(/y1="(\S*)"/)[1],
        x2: data.match(/x2="(\S*)"/)[1],
        y2: data.match(/y2="(\S*)"/)[1]
    }
}

const parsePolyLine = (data) => {
    return {
        type: 'polyline',
        className: getClass(data),
        points: getPoints(data)
    }
}

const getPoints = (data) => {
    const points = [];
    const match = data.match(/points="(.*)"/);
    const coords = match[1].split(' ');
    coords.forEach( element => {
<<<<<<< HEAD
        if(element.trim()){
            const coord = element.split(',');
            points.push({
                x: coord[0],
                y: coord[1]
            });
=======
        if(element){
            const coord = element.trim().split(',');
            if(coord[0] && coord[1]){
                points.push({
                    x: coord[0],
                    y: coord[1]
                });
            }
>>>>>>> testInBrowser
        }
    })
    return points
}

// PARSE POLYGONS

const parsePolygon = (data) => {
    return {
        type: 'polygon',
        className: getClass(data),
        points: getPoints(data)
    }
}

// PARSE PATHS

const getPathCoords = (line) => {
    const match = line.match(/d="(.*)"/);
    return match[1];
}

const parsePath = (line) => {
    return {
        type: 'path',
        className: getClass(line),
        coords: getPathCoords(line)
    }
}

// PARSE SVG

const parseSVG = (data) => {
    let current;
    // Get Dimensions
    const dimensions = getDims(data);

    // Get Styles
    const s = getStyles(data);
    const styles = s[0];
    current = s[1];

    // Get Layers
    let layers = [];

    getLayers(data, current).forEach( layer => {
        const name = getLayerID(layer);
        const shapes = [];
        parseLayer(layer).forEach( element => {
            shapes.push(parseShape(element));
        })
        layers.push({
            name,
            shapes
        })
    })

    // Store Hitbox to its own property
    // Hitbox should be the last property of layers
    const hitboxes = layers.pop();
    // Compile the final object
    return {
        dimensions,
        hitboxes: hitboxes.shapes.map(shape => {
            return {x:shape.x, y:shape.y, w:shape.w, h:shape.h}
        }),
        styles,
        layers:layers.filter(layer => layer.name !== 'temp') 
    }
}

<<<<<<< HEAD
const parseSVG = (data, fileName = '') => {
    const lines = data.split('\n');
    const styles = [];
    const paths = [];
    let l = '';
    lines.forEach((element, index) => {
        lines[index] = element.trimStart();
=======
// TEST IN BROWSER
>>>>>>> testInBrowser

// SET INPUT AND OUTPUT ELEMENTS

// const createLog = (logName) => {
//     const div = document.createElement('div'),
//         heading = document.createElement('h1'),
//         paragraph = document.createElement('p');
//     heading.innerText = logName;
//     heading.style.textTransform = 'capitalize';
//     heading.style.fontSize = '1.5em';
//     div.appendChild(heading);
//     div.appendChild(paragraph);
//     document.body.appendChild(div);
//     // createLog returns a reference to the paragraph where our data will be displayed
//     return paragraph;
// }

<<<<<<< HEAD
        // GET PATHS
       
        if(lines[index].match(/(rect|circle|ellipse|path|line|polyline|polygon)/) !== null ){
            if(lines[index].trimEnd().endsWith('/>')){
                paths.push(parseShape(lines[index].trimEnd()));
            } else {
                l = lines[index].trimEnd();
            }
        } else if (l && !lines[index].startsWith('<')){
            if(l.includes('polygon') || l.includes('polyline')){
                 // While <path/> elements work without any whitespace, <polyline/> and <polygon/> must have spaces between each point in the "points" attribute.  This fixes a bug caused by the absence of white space.
                l += ` ${lines[index].trim()}`
            } else {
                l += lines[index];
            }
            // console.log(lines[index]);
            if(l.endsWith('/>')){
                paths.push(parseShape(l));
                l = '';
            }
        }
    })

    // CHECK FOR STYLES
=======
// const inputLog = createLog('input:');
// const outputLog = createLog('output:');

// inputLog.innerText = testStr;
// outputLog.innerText = JSON.stringify(parseSVG(testStr, 'Oink'));
>>>>>>> testInBrowser

// NODE

const fs = require('fs/promises');
const path = require('path');

const p = process.argv;

const srcPath = process.argv[2] ? process.argv[2] : './test/input';
const destPath = process.argv[3] ? process.argv[3] : './test/output';

console.log(`src: ${srcPath}
dest: ${destPath}`)

const processBatch = async () => {
    try {
        const dir = await fs.opendir(srcPath);
        const imgData = {};
        for await (const dirent of dir){
            // FIND .svg FILES
            if(dirent.isFile() && dirent.name.endsWith('.svg')){
                // Get our file name
                const fName = path.basename(dirent.name, '.svg');
                // Read the file
                const data = await fs.readFile(path.join(srcPath,dirent.name),{encoding:'utf8'});
                // Parse the data
                const parsed = parseSVG(data);
                imgData[fName] = parsed;
            }
        }
        // Write the file
        await fs.writeFile(path.join(destPath, `imgData.js`), `const imgData = ${JSON.stringify(imgData)}`);
    } catch (err){
        console.error(err);
    }
}

processBatch();