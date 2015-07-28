var margin = {top: -20, right: 20, bottom: -40, left: 110},
    width = 960 - margin.right - margin.left, //960 is min to show all childs
    height = 650 - margin.top - margin.bottom;

// Used for zooming
var realWidth = window.innerWidth;
var realHeight = window.innerHeight;
var m = [40, 240, 40, 240],
    w = realWidth -m[0] -m[0],
    h = realHeight -m[0] -m[2];

var i = 0,
    duration = 300, // Duration of deployment of new child nodes
    root;

var tree = d3.layout.tree() // Call on the d3 tree layout method
    .size([height - 30, width]);

var diagonal = d3.svg.diagonal()                      // Diagonal path generator 
    .projection(function(d) { return [d.y, d.x]; }); // d.x and d.y are switched so the path matches the nodes
                                                    // makes the paths horizontal instead of vertical


/*********************************
* START FUNCTION COLLAPSIBLETREE *
*********************************/
function collapsibleTree() { 

          // For the reset the function. Removes the existing tree before re-generating a new one. 
          d3.selectAll(".collapsibletree").remove();

          var svg = d3.select("#tree").append("svg") // Append svg to tree div
              .attr("width", width + margin.right + margin.left)
              .attr("height", height + margin.top + margin.bottom)
              .attr("class","collapsibletree")
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 

              var tooltip = d3.select('#infobox')
                    .append('div')         
                    .attr('class', 'tooltip'); 
                                
                    tooltip.append('div')     
                      .attr('class', 'name');

                    tooltip.append('div') 
                      .attr('class', 'description');

                    tooltip.append('div') 
                      .attr('class', 'space');

                    tooltip.append('div') 
                      .attr('class', 'link');

          d3.json("openstreetmap-stack.json", function(error, osm) { //load JSON data
            if (error) throw error;

            root = osm;
            root.x0 = height / 2;
            root.y0 = 0;

            function collapse(d) {
              if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
              }
            }

            root.children.forEach(collapse);
            update(root);
          });

          d3.select(self.frameElement).style("height", "00px");

          function update(source) {

            // Compute the new tree layout.
            var nodes = tree.nodes(root).reverse(); // return an array of objects with parents and child for each
            var  links = tree.links(nodes);  // return an array of objects. Each has source and target properties
                                             // source and target are the nodes

            // Normalize for fixed-depth.
            nodes.forEach(function(d) { d.y = d.depth * 150;}); // Determine the horizontal spacing of the nodes
                                                                // To calculate the position on the y axis of the screen

            // Update the nodes…
            var node = svg.selectAll("g.node")
                .data(nodes, function(d) { return d.id || (d.id = ++i); }); // binds to the nodes data array

            // Enter any new nodes at the parent's previous position.
            var nodeEnter = node.enter()
                .append("g") // append a g element to each object
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; }) // place the nodes according to x and y properties
                                                                                                              // x and y are switch so tree is horizontal not vertical
                .on("click", click);    

            // append circles to nodes
            nodeEnter.append("circle")
                .attr("r", 10)
                .style("fill", function(d) { return d._children ? "#EFC94C" : "#fff"; }); // If the nodes has children set to the color to #EFC94C otherwise set it to #fff

            nodeEnter.append("text")
                .attr("x", function(d) { return d.children || d._children ? -10 : 10; }) //Distance of name in relation to node (left/right) 
                                                                                        // If the nodes has children set to -10 otherwise set it to 10
                .attr("dy", ".35em") //Distance (up/down) from node
                .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
                .text(function(d) { return d.name; })
                //.style("fill-opacity", 1)
                .on("mouseover", function(d) {
                          tooltip.select('.name').html(d.name + "<br><br>");
                          tooltip.select('.description').html(d.description);
                          tooltip.select('.space').html("<br><br>");
                          tooltip.select('.link').html(d.link);
                          tooltip.style('display', 'block');
                                            })    
                .on('mouseout', function(d) {tooltip.style('display', 'none');})
                .attr("class", "hyper").on("click", clickLink);

            // Transition nodes to their new position.
            var nodeUpdate = node.transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

            nodeUpdate.select("circle")
                .attr("r", 4.5)
                .style("fill", function(d) { return d._children ? "#EFC94C" : "#fff"; }); // If the nodes has children set to the color to #EFC94C otherwise set it to #fff

            nodeUpdate.select("text")
                .style("fill-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            var nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
                .remove();

            nodeExit.select("circle")
                .attr("r", 1e-6);

            nodeExit.select("text")
                .style("fill-opacity", 1e-6);

            // Update the links…
            var link = svg.selectAll("path.link")
                .data(links, function(d) { return d.target.id; });

            // Enter any new links at the parent's previous position.
            link.enter().insert("path", "g")
                .attr("class", "link")
                .attr("d", function(d) {
                  var o = {x: source.x0, y: source.y0};
                  return diagonal({source: o, target: o});
                });

            // Transition links to their new position.
            link.transition()
                .duration(duration)
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition()
                .duration(duration)
                .attr("d", function(d) {
                  var o = {x: source.x, y: source.y};
                  return diagonal({source: o, target: o});
                })
                .remove();

            // Stash the old positions for transition.
            nodes.forEach(function(d) {
              d.x0 = d.x;
              d.y0 = d.y;
            });
          }


          // Toggle children on click.
          function click(d) {
            if (d.children) {
              d._children = d.children;
              d.children = null;
            } else {
              d.children = d._children;
              d._children = null;
            }
            update(d);
          }

          //To open URL in new tab when text hyperlinked is clicked
          function clickLink(d) {
            window.open(d.link,'_blank');
          }

      d3.select("svg")
              .call(d3.behavior.zoom()
                    .scaleExtent([0.5, 15])
                    .on("zoom", zoom));

      function zoom() {
          var scale = d3.event.scale,
              translation = d3.event.translate,
              tbound = -h * scale,
              bbound = h * scale,
              lbound = (-w + m[1]) * scale,
              rbound = (w - m[3]) * scale;
          // limit translation to thresholds
          translation = [
              Math.max(Math.min(translation[0], rbound), lbound),
              Math.max(Math.min(translation[1], bbound), tbound)
          ];

          d3.select(".collapsibletree")
              .attr("transform", "translate(" + translation + ")" +
                    " scale(" + scale + ")");
      }
}
/*********************************
* End FUNCTION COLLAPSIBLETREE   *
*********************************/

function resetCollapsibleTree() {
  d3.selectAll(".collapsibletree").remove();
  collapsibleTree();
} 

function overlay() {
  el = document.getElementById("overlay");
  el.style.visibility = (el.style.visibility == "visible") ? "hidden" : "visible";
}


