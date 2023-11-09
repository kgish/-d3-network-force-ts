import './style.css'

import * as d3 from 'd3';

let svg = d3.select("svg"),
    // @ts-ignore
    width = +svg.node()!.getBoundingClientRect().width,
    // @ts-ignore
    height = +svg.node()!.getBoundingClientRect().height;

// svg objects
let link: any, node: any;
// the data - an object with nodes and links
let graph: any;

// load the data
// @ts-ignore
d3.json("miserables.json", (error, _graph) => {
    if (error) throw error;
    graph = _graph;
    initializeDisplay();
    initializeSimulation();
});

//////////// FORCE SIMULATION ////////////

// force simulator
const simulation = d3.forceSimulation();

// set up the simulation and event to update locations after each tick
const initializeSimulation = () => {
    simulation.nodes(graph.nodes);
    initializeForces();
    simulation.on("tick", ticked);
}

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
    console.log(forceProperties);
    // @ts-ignore
    simulation.force("center").x(width * (forceProperties.center.x ? 1 : 0))
        .y(height * forceProperties.center.y);
    // @ts-ignore
    simulation.force("charge").strength(forceProperties.charge.strength * (forceProperties.charge.enabled ? 1 : 0))
        .distanceMin(forceProperties.charge.distanceMin)
        .distanceMax(forceProperties.charge.distanceMax);
    // @ts-ignore
    simulation.force("collide").strength(forceProperties.collide.strength * (forceProperties.collide.enabled ? 1 : 0))
        .radius(forceProperties.collide.radius)
        .iterations(forceProperties.collide.iterations);
    // @ts-ignore
    simulation.force("forceX").strength(forceProperties.forceX.strength * (forceProperties.forceX.enabled ? 1 : 0))
        .x(width * forceProperties.forceX.x);
    // @ts-ignore
    simulation.force("forceY").strength(forceProperties.forceY.strength * (forceProperties.forceY.enabled ? 1 : 0))
        .y(height * forceProperties.forceY.y);
    // @ts-ignore
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
        // @ts-ignore
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

const dragstarted = (event: any, d: any) => {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

const dragged = (event: any, d: any) => {
    d.fx = event.x;
    d.fy = event.y;
}

const dragended = (event: any, d: any) => {
    if (!event.active) simulation.alphaTarget(0.0001);
    d.fx = null;
    d.fy = null;
}

// update size-related forces
d3.select(window).on("resize", () => {
    // @ts-ignore
    width = +svg.node()!.getBoundingClientRect().width;
    // @ts-ignore
    height = +svg.node()!.getBoundingClientRect().height;
    updateForces();
});

// convenience function to update everything (run after UI input)
const updateAll = () => {
    updateForces();
    updateDisplay();
}

export { d3, forceProperties, updateAll };