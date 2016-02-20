/* globals $, d3, _, console */

$(document).ready(function() { 

	var margin = {top: 20, right: 120, bottom: 20, left: 120},
		width = 960 - margin.right - margin.left,
		height = 500 - margin.top - margin.bottom;
	
	var i = 0;

	var tree = d3.layout.tree()
		.size([height, width]);

	var diagonal = d3.svg.diagonal()
		.projection(function(d) { return [d.y, d.x]; });

	var svg = d3.select("body").append("svg")
		.attr("width", width + margin.right + margin.left)
		.attr("height", height + margin.top + margin.bottom)
	  .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	function update(root) {

	  // Compute the new tree layout.
	  var nodes = tree.nodes(root).reverse(),
		  links = tree.links(nodes);

	  // Normalize for fixed-depth.
	  nodes.forEach(function(d) { d.y = d.depth * 180; });

	  // Declare the nodes…
	  var node = svg.selectAll("g.node")
		  .data(nodes, function(d) { return d.id || (d.id = ++i); });

	  // Enter the nodes.
	  var nodeEnter = node.enter().append("g")
		  .attr("class", "node")
		  .attr("transform", function(d) { 
			  return "translate(" + d.y + "," + d.x + ")"; });

	  nodeEnter.append("circle")
		  .attr("r", function(d) { return d.value; })
		  .style("stroke", function(d) { return d.type; })
		  .style("fill", function(d) { return d.level; });

	  nodeEnter.append("text")
		  .attr("x", function(d) { 
			  return d.children || d._children ? 
			  (d.value + 4) * -1 : d.value + 4 })
		  .attr("dy", ".35em")
		  .attr("text-anchor", function(d) { 
			  return d.children || d._children ? "end" : "start"; })
		  .text(function(d) { return d.nodeidterm; })
		  .style("fill-opacity", 1);

	  // Declare the links…
	  var link = svg.selectAll("path.link")
		  .data(links, function(d) { return d.target.id; });

	  // Enter the links.
	  link.enter().insert("path", "g")
		  .attr("class", "link")
	  	  .style("stroke", function(d) { return d.target.level; })
		  .attr("d", diagonal);

	}	

	d3.csv('data/kinships.csv', (data) => {
		console.info(data);


		// normalise the horrible names with spaces
		data = _(data).map((d) => { 
			return _.reduce(d, (result, value, key) => {
			    key = key.replace(/[\s\.\+]/g, '').toLowerCase();
			    if (value == 'HA') { value = 4; }
			    result[key] = value;
			    return result;
			}, {});			
		});

		data = _(data).filter((d) => d.nodeid && d.nodeid.length > 0);		

		var subtrees_by_id = data.reduce((tree, b) => { 
			tree[b.nodeid] = _({}).extend(b, {value:1, children:[]})
			return tree;
		}, {});

		window.sid = subtrees_by_id;
		console.log(subtrees_by_id);


		_.uniq(data.map((x) => x.parent)).map(function(parentid) { 
			if (parentid === 'root') return;

			var siblings = data.filter((x) => x.parent == parentid),
				parentnode = data.filter((x) => x.nodeid == parentid)[0];

			// console.log('pn ', parentnode, parentnode.nodeid, subtrees_by_id);
			subtrees_by_id[parentnode.nodeid].children = siblings.map((st) => subtrees_by_id[st.nodeid]);
		});

		window.sid = subtrees_by_id;
		console.log(subtrees_by_id);

		var root_id = data.filter((x) => x.parent == 'root')[0];

		console.info('root id ', root_id.nodeid);
		update(subtrees_by_id[root_id.nodeid]);
		// // select some dimensions for fun first
		// data = _(data).map((d) => { return _(d).pick('nodeid', 'gender', 'uniqueness', 'hsdistance', 'pgdistance', 'generation'); });

	});

});