const fs = require('fs/promises');
const path = require('path');

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
        if(element.trim()){
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

const parseSVG = (data, fileName = '') => {
    const lines = data.split('\n');
    const styles = [];
    const paths = [];
    let l = '';
    lines.forEach((element, index) => {
        lines[index] = element.trimStart();

        // GET STYLE CLASSES

        if(lines[index].startsWith('.st')){
            styles.push(parseStyle(lines[index]));
        }

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

const p = process.argv;

const srcPath = process.argv[2] ? process.argv[2] : './test/input';
const destPath = process.argv[3] ? process.argv[3] : './test/output';

console.log(`src: ${srcPath}
dest: ${destPath}`)

const processBatch = async () => {
    try {
        const dir = await fs.opendir(srcPath);
        for await (const dirent of dir){
            // FIND .svg FILES
            if(dirent.isFile() && dirent.name.endsWith('.svg')){
                // Get our file name
                const fName = path.basename(dirent.name, '.svg');
                // Read the file
                const data = await fs.readFile(path.join(srcPath,dirent.name),{encoding:'utf8'});
                // Parse the data
                const parsed = parseSVG(data, fName);
                // Write the file
                await fs.writeFile(path.join(destPath, `${fName}.json`), parsed);
            }
        }
    } catch (err){
        console.error(err);
    }
}

processBatch();