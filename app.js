// Get image dimensions from the viewBox attribute
// expected output: viewBox="0 0 54 56"

const getDims = (data) => {
    const dims = data.match(/viewBox="(\d+) (\d+) (\d+) (\d+)"/);
    return { drawW: dims[3], drawH: dims[4] }
}

// Get all data within the style tag.
// Remove the style tag from the data.

const getStyles = (data) => {
    // Find the style element
    const openingTag = `<style type="text/css">`,
        closingTag = `</style>`;
    const ind1 = data.indexOf(openingTag);
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
    return styles;
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
        if(element){
            const coord = element.split(',');
            points.push({
                x: coord[0],
                y: coord[1]
            });
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

const parseSVG = (data, fileName = '') => {
    const lines = data.split('\n');
    const styles = [];
    const paths = [];
    let l = '';
    lines.forEach((element, index) => {
        lines[index] = element.trim();

        // GET STYLE CLASSES

        if(lines[index].startsWith('.st')){
            styles.push(parseStyle(lines[index]));
        }

        // GET PATHS

        if(lines[index].match(/(rect|circle|ellipse|path|line|polyline|polygon)/) !== null ){
            if(lines[index].endsWith('/>')){
                paths.push(parseShape(lines[index]));
            } else {
                l = lines[index];
            }
        } else if (l && !lines[index].startsWith('<')){
            l += lines[index];
            if(l.endsWith('/>')){
                paths.push(parseShape(l));
                l = '';
            }
        }
    })

    // CHECK FOR STYLES

    if(!styles.length) styles.push({
        className: 'default',
        method: 'fill',
        color: '#000000'
    });

    const output = Object.create(null);

    if(fileName) output.name = fileName;
    output.classes = styles;
    output.shapes = paths;
    
    return JSON.stringify(output);
}

// TEST IN BROWSER

// SET INPUT AND OUTPUT ELEMENTS

const createLog = (logName) => {
    const div = document.createElement('div'),
        heading = document.createElement('h1'),
        paragraph = document.createElement('p');
    heading.innerText = logName;
    heading.style.textTransform = 'capitalize';
    heading.style.fontSize = '1.5em';
    div.appendChild(heading);
    div.appendChild(paragraph);
    document.body.appendChild(div);
    // createLog returns a reference to the paragraph where our data will be displayed
    return paragraph;
}

const inputLog = createLog('input:');
const outputLog = createLog('output:');

inputLog.innerText = testStr;

// NODE

// const fs = require('fs/promises');
// const path = require('path');

// const p = process.argv;

// const srcPath = process.argv[2] ? process.argv[2] : './test/input';
// const destPath = process.argv[3] ? process.argv[3] : './test/output';

// console.log(`src: ${srcPath}
// dest: ${destPath}`)

// const processBatch = async () => {
//     try {
//         const dir = await fs.opendir(srcPath);
//         for await (const dirent of dir){
//             // FIND .svg FILES
//             if(dirent.isFile() && dirent.name.endsWith('.svg')){
//                 // Get our file name
//                 const fName = path.basename(dirent.name, '.svg');
//                 // Read the file
//                 const data = await fs.readFile(path.join(srcPath,dirent.name),{encoding:'utf8'});
//                 // Parse the data
//                 const parsed = parseSVG(data, fName);
//                 // Write the file
//                 await fs.writeFile(path.join(destPath, `${fName}.json`), parsed);
//             }
//         }
//     } catch (err){
//         console.error(err);
//     }
// }

// processBatch();