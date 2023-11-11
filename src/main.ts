import './style.css'

import * as d3 from 'd3';

let svg: any, width: any, height: any;

// svg objects
let link: any, node: any;
// the data - an object with nodes and links
let graph: any;

// force simulator
let simulation: any;

// values for all forces
const forceProperties = {
    center: {
        x: 0.5,
        y: 0.5
    },
    charge: {
        enabled: true,
        strength: -30,
        distanceMin: 1,
        distanceMax: 2000
    },
    collide: {
        enabled: true,
        strength: .7,
        iterations: 1,
        radius: 5
    },
    forceX: {
        enabled: false,
        strength: .1,
        x: .5
    },
    forceY: {
        enabled: false,
        strength: .1,
        y: .5
    },
    link: {
        enabled: true,
        distance: 30,
        iterations: 1
    }
}

// set up the simulation and event to update locations after each tick
const initializeSimulation = () => {
    simulation = d3.forceSimulation();
    simulation.nodes(graph.nodes);
    initializeForces();
    simulation.on("tick", ticked);
}

// add forces to the simulation
const initializeForces = () => {
    // add forces and associate each with a name
    simulation
        .force("link", d3.forceLink())
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide())
        .force("center", d3.forceCenter())
        .force("forceX", d3.forceX())
        .force("forceY", d3.forceY());
    // apply properties to each of the forces
    updateForces();
}

// apply new force properties
const updateForces = () => {
    // get each force by name and update the properties
    simulation.force("center").x(width * forceProperties.center.x)
        .y(height * forceProperties.center.y);
    simulation.force("charge").strength(forceProperties.charge.strength * (forceProperties.charge.enabled ? 1 : 0))
        .distanceMin(forceProperties.charge.distanceMin)
        .distanceMax(forceProperties.charge.distanceMax);
    simulation.force("collide").strength(forceProperties.collide.strength * (forceProperties.collide.enabled ? 1 : 0))
        .radius(forceProperties.collide.radius)
        .iterations(forceProperties.collide.iterations);
    simulation.force("forceX").strength(forceProperties.forceX.strength * (forceProperties.forceX.enabled ? 1 : 0))
        .x(width * forceProperties.forceX.x);
    simulation.force("forceY").strength(forceProperties.forceY.strength * (forceProperties.forceY.enabled ? 1 : 0))
        .y(height * forceProperties.forceY.y);
    simulation.force("link").id((d: any) => d.id)
        .distance(forceProperties.link.distance)
        .iterations(forceProperties.link.iterations)
        .links(forceProperties.link.enabled ? graph.links : []);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    simulation.alpha(1).restart();
}

//////////// DISPLAY ////////////

// generate the svg objects and force simulation
const initializeDisplay = () => {
    // set the data and properties of link lines
    link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line");

    // set the data and properties of node circles
    node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // node tooltip
    node.append("title")
        .text((d: any) => d.id);
    // visualize the graph
    updateDisplay();
}

// update the display based on the forces (but not positions)
const updateDisplay = () => {
    node
        .attr("r", forceProperties.collide.radius)
        .attr("stroke", forceProperties.charge.strength > 0 ? "blue" : "red")
        .attr("stroke-width", forceProperties.charge.enabled ? Math.abs(forceProperties.charge.strength) / 15 : 0);

    link
        .attr("stroke-width", forceProperties.link.enabled ? 1 : .5)
        .attr("opacity", forceProperties.link.enabled ? 1 : 0);
}

// update the display positions after each simulation tick
const ticked = () => {
    link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

    node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
    d3.select('#alpha_value').style('flex-basis', (simulation.alpha() * 100) + '%');
}


//////////// UI EVENTS ////////////

const dragstarted = (d: any) => {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

const dragged = (d: any) => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

const dragended = (d: any) => {
    if (!d3.event.active) simulation.alphaTarget(0.0001);
    d.fx = null;
    d.fy = null;
}

// convenience function to update everything (run after UI input)
const updateAll = () => {
    updateForces();
    updateDisplay();
}

async function onLoaded(_event: any) {
    svg = d3.select("svg");
    width = +svg.node()!.getBoundingClientRect().width;
    height = +svg.node()!.getBoundingClientRect().height;

    // Load the data, see: https://github.com/d3/d3/blob/main/CHANGES.md#changes-in-d3-50
    graph = await d3.json("miserables.json");
    initializeDisplay();
    initializeSimulation();

    // update size-related forces
    d3.select(window).on("resize", () => {
        width = +svg.node().getBoundingClientRect().width;
        height = +svg.node().getBoundingClientRect().height;
        updateForces();
    });
}

window.addEventListener("load", (event) => onLoaded(event));

export { d3, forceProperties, updateAll };