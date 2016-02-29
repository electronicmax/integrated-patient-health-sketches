/* globals angular, d3, _, console */
angular.module('pchealth')
	.directive('parcoords', () => ({
		scope:{data:'='},
		restrict:'E',
		replace:true,
		template:'<div class="parcoords"></div>',
		link: ($s, $e) => {	
			$s.el = $e[0]; 
			$s.$watch(
			    function () { 
			    	console.info('pxh', $e.parent()[0], $e.parent().width(), $e.parent().height());
			        return {
			           width: $e.width(),
			           height: $e.height(),
			        };
			   },
			   () => { console.info('resize '); $s.render() }, //listener 
			   true //deep watch
			);	
		},
		controller: ($scope, $timeout) => {
			var margin = {top: 30, right: 10, bottom: 10, left: 10},
			    width = ($scope.el && $($scope.el).width() || 1560) - margin.left - margin.right,
			    height = ($scope.el && $($scope.el).height() || 800) - margin.top - margin.bottom;

			var ordinals = ['dinner'],
				dates = ["date"];

			var x = d3.scale.ordinal().rangePoints([0, width], 1),
			    y = window.ys = {},
			    dragging = {};

			var line = d3.svg.line(),
			    axis = d3.svg.axis().orient("left"),
			    dateaxis = d3.svg.axis().orient("left").tickFormat(d3.time.format("%b %e")).ticks(20),
			    background,
			    foreground,
			    dimensions,
			    inrcolour = d3.scale.linear().domain([0.5,1.0,3.0,3.5]).range(["red","#aaa","#aaa","red"]),
			    svg;

			$scope.render = () => {
			    console.info('render!');
				var data = $scope.data;
				if (data === undefined || !$scope.el) { return; }

			    width = $($scope.el).width()- margin.left - margin.right;
			    height = $($scope.el).height() - margin.top - margin.bottom;
				x.rangePoints([0, width], 1);

			    console.info('updated dims :: ', width, ' - ', height, data, $scope.el);

				d3.select($scope.el).selectAll('svg').remove();				
				svg = d3.select($scope.el).selectAll('svg').data([0]);

				svg.enter().append('svg')
					// .attr("width", width + margin.left + margin.right)
				 //    .attr("height", height + margin.top + margin.bottom)
					.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				 // Extract the list of dimensions and create a scale for each.
				x.domain(dimensions = d3.keys(data[0]).filter(function(d) {
					if (d.indexOf('$$') === 0) { return false; }
					if (ordinals.indexOf(d) >= 0) { 
						y[d] = d3.scale.ordinal()
							.domain(_.uniq(data.map((x) => x[d])))
							.rangePoints([height, 0]);
					} else if (dates.indexOf(d) >= 0) {
						var extent = d3.extent(data, (x) => x[d].valueOf());	
						y[d] = d3.time.scale().domain(extent).range([height,0]);
					} else {
						y[d] = d3.scale.linear()
						    .domain(d3.extent(data, function(p) { return +p[d]; }))
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
				  .attr("d", path)
				  .attr('style',function(d) { console.log(d.inr); return "stroke:"+inrcolour(d.inr); });

				// Add a group element for each dimension.
				var g = svg.selectAll(".dimension").data(dimensions)
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
				  .each(function(d) { 
				  	if (dates.indexOf(d) >= 0) { 
				  		return d3.select(this).call(dateaxis.scale(y[d]));
				  	}
				  	return d3.select(this).call(axis.scale(y[d])); 
				  })
				.append("text")
				  .style("text-anchor", "middle")
				  .attr("y", -9)
				  .text((d) => d);

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
			};

		$timeout(() => { 
			$scope.$watch('data',$scope.render);
			$scope.render();
		}, 1000);


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
		  	// console.info(p, [position(p), y[p](d[p])]);
		  	return [position(p), y[p](d[p])]; 
		  }));
		}

		function brushstart() {
		  d3.event.sourceEvent.stopPropagation();
		}
		window.s = $scope;
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