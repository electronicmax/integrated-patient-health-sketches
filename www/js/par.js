/* globals angular, d3, _, console */
angular.module('pchealth')
	.directive('parcoords', () => ({
		scope:{data:'='},
		restrict:'E',
		replace:true,
		template:'<div class="parcoords"></div>',
		link: ($s, $e) => {	$s.el = $e[0]; },
		controller: ($scope) => {
			var margin = {top: 30, right: 10, bottom: 10, left: 10},
			    width = 960 - margin.left - margin.right,
			    height = 500 - margin.top - margin.bottom;

			var ordinals = ['dinner'];

			var x = d3.scale.ordinal().rangePoints([0, width], 1),
			    y = window.ys = {},
			    dragging = {};

			var line = d3.svg.line(),
			    axis = d3.svg.axis().orient("left"),
			    background,
			    foreground,
			    dimensions,
			    svg;


			$scope.$watch('data', () => {
				var data = $scope.data;		

				console.info(' data and el ', data, $scope.el);
				if (data === undefined || !$scope.el) { return; }
				// normalise the horrible names with spaces
				// data = _(data).map((d) => { 
				// 	return _.reduce(d, (result, value, key) => {
				// 	    key = key.replace(/[\s\.\+]/g, '').toLowerCase();
				// 	    if (value == 'HA') { value = 4; }
				// 	    result[key] = value;
				// 	    return result;
				// 	}, {});			
				// });

				// get rid of ones without nodeid -- extra blank rows thanks, excel!
				// data = _(data).filter((d) => d.nodeid && d.nodeid.length > 0);

				// select some dimensions for fun first
				// data = _(data).map((d) => { return _(d).pick('nodeid', 'gender', 'uniqueness', 'hsdistance', 'pgdistance', 'generation'); });


				svg = d3.select($scope.el)
					.selectAll('svg').data([0]);
				console.info('svg >> ', svg);
				svg.enter().append('svg') // d3.select("body").append("svg")
				    .attr("width", width + margin.left + margin.right)
				    .attr("height", height + margin.top + margin.bottom)
					.append("g")
					    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


				 // Extract the list of dimensions and create a scale for each.
				x.domain(dimensions = d3.keys(data[0]).filter(function(d) {
					if (d.indexOf('$$') === 0) { return false; }

					if (ordinals.indexOf(d) >= 0) { 
						console.info('domain ', _.uniq(data.map((x) => x[d])));
						y[d] = d3.scale.ordinal()
							.domain(_.uniq(data.map((x) => x[d])))
							.rangePoints([height, 0]);
					} else {
						y[d] = d3.scale.linear()
						    .domain(d3.extent(data, function(p) { console.log(' value ', d, p[d], +p[d]); return +p[d]; }))
						    .range([height, 0]);
					}
					return true;
				}));
				// Add grey background lines for context.
				background = svg.append("g")
				  .attr("class", "background")
				.selectAll("path")
				  .data(data)
				.enter().append("path")
				  .attr("d", path);

				// Add blue foreground lines for focus.
				foreground = svg.append("g")
				  .attr("class", "foreground")
				.selectAll("path")
				  .data(data)
				.enter().append("path")
				  .attr("d", path);

				// Add a group element for each dimension.
				var g = svg.selectAll(".dimension")
				  .data(dimensions)
				.enter().append("g")
				  .attr("class", "dimension")
				  .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
				  .call(d3.behavior.drag()
				    .origin(function(d) { return {x: x(d)}; })
				    .on("dragstart", function(d) {
				      dragging[d] = x(d);
				      background.attr("visibility", "hidden");
				    })
				    .on("drag", function(d) {
				      dragging[d] = Math.min(width, Math.max(0, d3.event.x));
				      foreground.attr("d", path);
				      dimensions.sort(function(a, b) { return position(a) - position(b); });
				      x.domain(dimensions);
				      g.attr("transform", function(d) { return "translate(" + position(d) + ")"; });
				    }).on("dragend", function(d) {
				      delete dragging[d];
				      transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
				      transition(foreground).attr("d", path);
				      background
				          .attr("d", path)
				        .transition()
				          .delay(500)
				          .duration(0)
				          .attr("visibility", null);
				    }));

				// Add an axis and title.
				g.append("g")
				  .attr("class", "axis")
				  .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
				.append("text")
				  .style("text-anchor", "middle")
				  .attr("y", -9)
				  .text(function(d) { return d; });

				// Add and store a brush for each axis.
				g.append("g")
				  .attr("class", "brush")
				  .each(function(d) {
				    d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
				  })
				.selectAll("rect")
				  .attr("x", -8)
				  .attr("width", 16);


				window.data = data;
			});

		function position(d) {
		  var v = dragging[d];
		  return v === undefined ? x(d) : v;
		}

		function transition(g) {
		  return g.transition().duration(500);
		}

		// Returns the path for a given data point.
		function path(d) {
		  return line(dimensions.map(function(p) { 
		  	console.info(p, [position(p), y[p](d[p])]);
		  	return [position(p), y[p](d[p])]; 
		  }));
		}

		function brushstart() {
		  d3.event.sourceEvent.stopPropagation();
		}

		// Handles a brush event, toggling the display of foreground lines.
		function brush() {
		  var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
		      extents = actives.map(function(p) { return y[p].brush.extent(); });
		  foreground.style("display", function(d) {
		    return actives.every(function(p, i) {
		    	if (ordinals.indexOf(p) >= 0) { 
		    		// ordinal!
		    		// console.info('ordinal ', p);
		    		var keys_included = y[p].domain().filter(function(xval) { 
		    			// console.info('xval ', xval, y[p](xval));
					    return extents[i][0] <= y[p](xval) && y[p](xval) <= extents[i][1];			
		    		});
		    		// console.info('keys_included ', keys_included);
		    		return keys_included.indexOf(d[p]) >= 0;
		    	} else {
			      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
			    }
		    }) ? null : "none";
		  });
		}
	}
}));