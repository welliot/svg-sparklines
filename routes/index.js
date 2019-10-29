const router = new (require('restify-router')).Router();
var errors = require('restify-errors');
const d3 = require('d3');

var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const sparkWidth = 200;
const sparkHeight = 100;

var lineFunction = d3.line()
                         .x((d) => { return d.x; })
                         .y((d) => { return d.y; });

router.get('/', function (req, res, next) {
  res.header('Content-Type', 'image/svg+xml');
  res.sendRaw(body.html());
	next();
});

router.get('/sparkline', function (req, res, next) {
  let { x, y } = getCoordinates(req);
  if (x.length != y.length || x.length < 2) {
    res.send(new errors.BadRequestError('Need coordinates to work and arrays must be same length'));
    next();
    return;
  }

  const { svg, body } = createSVG(sparkWidth, sparkHeight);
  svg.append("path")
    .attr("d", lineFunction(scaleData(createLineData(x, y))))
    .attr("stroke", req.query.color || "black")
    .attr("stroke-width", "2")
    .attr("fill", "transparent");

  res.header('Content-Type', 'image/svg+xml');
  res.sendRaw(body.html());
	next();
});

router.get('/sparkbar', function (req, res, next) {
  let { y } = getCoordinates(req);
  if (y.length <= 2) {
    res.send(new errors.BadRequestError('Need some data'));
    next();
    return;
  }

  const barPadding = 2 ;
  const barWidth = (sparkWidth / y.length);

  const yFunc = d3.scaleLinear()
    .domain([Math.min(0, d3.min(y) - 1), d3.max(y)])
    .range([0, sparkHeight]);

  const { svg, body } = createSVG(sparkWidth, sparkHeight);
  svg.attr("class", "bar-chart");
  svg.selectAll("rect")
    .data(y)
    .enter()
    .append("rect")
    .attr("y", (d) => {return sparkHeight - yFunc(d);})
    .attr("fill", req.query.color || "black")
    .attr("height", (d) => yFunc(d))
    .attr("width", barWidth - barPadding)
    .attr("transform", (d, i) => {
        var translate = [barWidth * i, 0];
        return `translate(${ translate})`;
    });

  res.header('Content-Type', 'image/svg+xml');
  res.sendRaw(body.html());
	next();
});

router.get('/circle', function (req, res, next) {
  const { svg, body } = createSVG(100, 100);
  svg.attr("class", "circle");
  svg.selectAll("circle")
    .data([ { "x_axis": 50, "y_axis": 50, "radius": 40, "fill" : "none" }])
    .enter()
    .append("circle")
    .attr("cx", (d) => d.x_axis)
    .attr("cy", (d) => d.y_axis)
    .attr("r", (d) => d.radius)
    .attr("fill", (d) => d.fill)
    .attr("stroke", req.query.color || "black")
    .attr("stroke-width", 10);
  svg.selectAll("text")
    .data([{label: req.query.label || "100"}])
    .enter()
    .append("text")
    .attr("x", 50)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline","central")
    .text((d) => d.label)
    .attr("font-family", "sans-serif")
    .attr("font-size", "40px")
    .attr("fill", req.query.color || "black");

  res.header('Content-Type', 'image/svg+xml');
  res.sendRaw(body.html());
	next();
});

router.post('/', function (req, res, next) {
	res.json({
		message: `Welcome to API ${req.body.name}`,
		query: req.query
	});
	next();
});

module.exports = router;

function createLineData(x, y) {
  const lineData = [];
  for (let i = 0; i < x.length; i++) {
    lineData.push({ x: x[i], y: y[i] });
  }
  return lineData;
}

function getCoordinates(req) {
  let x = !req.query.x ? [] : req.query.x.split(',').map(val => parseFloat(val) || 0);
  let y = !req.query.y ? [] : req.query.y.split(',').map(val => parseFloat(val) || 0);
  return { x, y };
}

function scaleData(lineData) {
  const xFunc = d3.scaleLinear()
    .domain(d3.extent(lineData.map((row) => row.x)))
    .range([0, sparkWidth]);
  const yFunc = d3.scaleLinear()
    .domain(d3.extent(lineData.map((row) => row.y)))
    .range([sparkHeight, 0]);

  let lineDataScaled = lineData.map((row) => { return { x: xFunc(row.x), y: yFunc(row.y)}; });
  console.log(JSON.stringify(lineDataScaled));
  return lineDataScaled;

}

function createSVG(width, height) {
  const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
  const body = d3.select(dom.window.document.querySelector("body"));
  const svg = body.append('svg').attr('width', width).attr('height', height).attr('xmlns', 'http://www.w3.org/2000/svg');
  return { svg, body };
}
